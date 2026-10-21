#!/usr/bin/env python3
"""Personal loopback game preview with persistent saves and a frozen source/build.

No cloud project or external SMTP. Data and credentials stay in the private project .local/play
folder; Ctrl+C stops only this command's services and retains the player's DB.
"""
import argparse, base64, fcntl, getpass, hashlib, hmac, json, os, re, secrets, shlex, shutil, signal, socket, subprocess, time, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--refresh-empty-snapshot',action='store_true',help='Archive and rebuild the frozen preview only when there are no game saves; retains Auth and creates a private DB backup')
parser.add_argument('--refresh-compatible-snapshot',action='store_true',help='Archive and rebuild the frozen preview while keeping existing saves, only when the new build has the same content hash, migrations and server code; creates a private DB backup first')
parser.add_argument('--refresh-migrate-saves',action='store_true',help='Update to the current source even when content changed: back up, migrate every save with the NEW code (scripts/game/migrate-local-saves.ts) and only swap the snapshot if all saves validate')
parser.add_argument('--lan',action='store_true',help='D-075: also serve the game to phones on the home Wi-Fi at http://<LAN IP>:<port>/play (gateway only; Auth/PostgREST/Postgres/mail stay on 127.0.0.1; new sign-ups disabled)')
parser.add_argument('--reset-saves-for-new-content',action='store_true',help='For an incompatible content change the player approved (e.g. D-057): pg_dump + JSON export, then delete game saves/history/receipts/battles (Auth kept) and rebuild the snapshot')
options=parser.parse_args()
if sum([options.refresh_empty_snapshot,options.refresh_compatible_snapshot,options.reset_saves_for_new_content,options.refresh_migrate_saves])>1:parser.error('choose one refresh mode')
BASE=Path(os.environ.get('RO_LOCAL_PLAY_ROOT',str(ROOT/'.local/play')))
BASE.mkdir(mode=0o700,parents=True,exist_ok=True);BASE.chmod(0o700)
lock=open(BASE/'running.lock','w')
try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError:
 ready=BASE/'ready.json'
 print('Local preview already running: '+(json.loads(ready.read_text())['url'] if ready.exists() else 'starting'))
 raise SystemExit(0)
TOOLS=Path(os.environ.get('RO_AUTH_TOOLS','/private/tmp/ro-idle-auth-tools'))
PG=Path(os.environ.get('RO_PG_BIN') or subprocess.check_output(['pg_config','--bindir'],text=True).strip())
NODE=os.environ.get('RO_NODE','node');processes=[];logs=[];pg_started=False
for tool in json.loads((ROOT/'supabase/tests/local-tools.json').read_text()):
 archive=TOOLS/tool['archive']
 if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest()!=tool['sha256']:raise SystemExit('Prepare verified tools with scripts/prepare_auth_test_tools.py first')
def port():
 with socket.socket()as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
def token(role,secret):
 enc=lambda v:base64.urlsafe_b64encode(json.dumps(v,separators=(',',':')).encode()).rstrip(b'=')
 body=enc({'alg':'HS256','typ':'JWT'})+b'.'+enc({'role':role,'iss':'ro-idle-local-preview','iat':int(time.time()),'exp':int(time.time())+315360000})
 return(body+b'.'+base64.urlsafe_b64encode(hmac.new(secret.encode(),body,hashlib.sha256).digest()).rstrip(b'=')).decode()
config_path=BASE/'private.json'
if config_path.exists():cfg=json.loads(config_path.read_text())
else:
 cfg={'jwt_secret':secrets.token_urlsafe(48),'db_password':secrets.token_urlsafe(32),'signing_key':secrets.token_urlsafe(48),'email':'local-player@example.invalid','password':secrets.token_urlsafe(24),'ports':{'pg':port(),'auth':port(),'rest':port(),'smtp':port(),'mail':port(),'gateway':int(os.environ.get('RO_LOCAL_PLAY_PORT','6173'))}}
 cfg['public_key']=token('anon',cfg['jwt_secret']);cfg['service_key']=token('service_role',cfg['jwt_secret']);config_path.write_text(json.dumps(cfg));config_path.chmod(0o600)
p=cfg['ports'];url=f"http://127.0.0.1:{p['gateway']}";data=BASE/'pg';socket_dir=BASE/'socket';socket_dir.mkdir(exist_ok=True,mode=0o700);snapshot=BASE/'snapshot';web=snapshot/'web'
env={**os.environ,'APP_ENV':'local','VITE_APP_ENV':'local','SUPABASE_URL':url,'VITE_SUPABASE_URL':url,'SUPABASE_SERVICE_ROLE_KEY':cfg['service_key'],'VITE_SUPABASE_PUBLISHABLE_KEY':cfg['public_key'],'SAVE_SIGNING_KEY':cfg['signing_key'],'SUPABASE_TEST_PROJECT_REF':'local','SUPABASE_PRODUCTION_PROJECT_REF':'','RO_GATEWAY_PORT':str(p['gateway']),'RO_AUTH_PORT':str(p['auth']),'RO_REST_PORT':str(p['rest']),'RO_LIVE_URL':url,'RO_STATIC_WEB_ROOT':str(web)}
def run(args,environment=env,cwd=ROOT,input_text=None):
 r=subprocess.run([str(a)for a in args],cwd=cwd,env=environment,input=input_text,text=True,capture_output=True)
 if r.returncode:raise RuntimeError('LOCAL_PLAY_COMMAND_FAILED:'+Path(str(args[0])).name)
 return r.stdout

def start(name,args,environment=env,cwd=BASE):
 log=open(BASE/(name+'.log'),'w');logs.append(log);child=subprocess.Popen([str(a)for a in args],cwd=cwd,env=environment,stdout=log,stderr=log);processes.append(child)
def wait(url):
 deadline=time.monotonic()+35
 while time.monotonic()<deadline:
  if any(c.poll()is not None for c in processes):raise RuntimeError('LOCAL_PLAY_SERVICE_EXITED')
  try:
   with urllib.request.urlopen(url,timeout=1)as r:
    if r.status==200:return
  except Exception:pass
  time.sleep(.15)
 raise RuntimeError('LOCAL_PLAY_SERVICE_TIMEOUT')
def admin_call(endpoint,method='GET',payload=None):
 req=urllib.request.Request(url+'/auth/v1'+endpoint,method=method,headers={'authorization':'Bearer '+cfg['service_key'],'apikey':cfg['service_key'],'content-type':'application/json'},data=json.dumps(payload).encode()if payload is not None else None)
 with urllib.request.urlopen(req,timeout=15)as r:return json.load(r)
def tree_digest(base,parts):
 # Byte identity of server-side code; content/rules identity is covered by content_hash.
 digest=hashlib.sha256()
 for part in parts:
  target=base/part;files=sorted(f for f in target.rglob('*') if f.is_file() and '__pycache__' not in f.parts and f.suffix!='.log') if target.is_dir() else [target] if target.is_file() else []
  for f in files:digest.update(str(f.relative_to(base)).encode()+b'\0'+f.read_bytes()+b'\0')
 return digest.hexdigest()
SERVER_PARTS=['api','src/server','supabase/migrations','scripts/game/local-supabase-gateway.ts']
def prepare_snapshot(require_compatible=False,build=True):
 # Generate/check content from the same source before copying API and browser artifacts.
 if build:run(['npm','run','build'])
 if require_compatible:
  # Saves stay valid only when rules, schema and server code are unchanged; UI/renderer/pack may differ.
  old_hash=json.loads((snapshot/'src/generated/runtime-manifest.json').read_text())['content_hash'];new_hash=json.loads((ROOT/'src/generated/runtime-manifest.json').read_text())['content_hash']
  if old_hash!=new_hash:raise RuntimeError('LOCAL_PLAY_REFRESH_INCOMPATIBLE_CONTENT')
  if tree_digest(snapshot,SERVER_PARTS)!=tree_digest(ROOT,SERVER_PARTS):raise RuntimeError('LOCAL_PLAY_REFRESH_INCOMPATIBLE_SERVER')
 staging=BASE/'snapshot-building'
 if staging.exists():shutil.rmtree(staging)
 staging.mkdir(mode=0o700)
 for directory in ['src','api','supabase']:shutil.copytree(ROOT/directory,staging/directory,ignore=shutil.ignore_patterns('__pycache__','*.log'))
 (staging/'scripts/game').mkdir(parents=True)
 shutil.copyfile(ROOT/'scripts/game/local-supabase-gateway.ts',staging/'scripts/game/local-supabase-gateway.ts')
 for filename in ['package.json','package-lock.json']:shutil.copyfile(ROOT/filename,staging/filename)
 (staging/'node_modules').symlink_to(ROOT/'node_modules',target_is_directory=True)
 shutil.copytree(ROOT/'dist',staging/'web')
 for file in (staging/'web').rglob('*'):
  if file.is_file() and file.suffix in ['.js','.css','.html','.json']:
   text=file.read_text()
   if any(value in text for value in [cfg['service_key'],cfg['signing_key'],cfg['jwt_secret'],cfg['db_password']]):raise RuntimeError('LOCAL_PLAY_SECRET_IN_BUILD')
 if snapshot.exists():
  archives=BASE/'archives';archives.mkdir(exist_ok=True,mode=0o700)
  old_hash=json.loads((snapshot/'src/generated/runtime-manifest.json').read_text())['content_hash']
  snapshot.rename(archives/f'snapshot-{old_hash[:12]}-{time.time_ns()}')
 staging.rename(snapshot)

try:
 fresh=not(data/'PG_VERSION').exists()
 if fresh:
  pw=BASE/'pw';pw.write_text(cfg['db_password']);pw.chmod(0o600);run([PG/'initdb','-D',data,'--encoding=UTF8','--no-locale','--auth-local=trust','--auth-host=scram-sha-256','--pwfile',pw])
 run([PG/'pg_ctl','-D',data,'-l',BASE/'pg.log','-o',f"-h 127.0.0.1 -k {shlex.quote(str(socket_dir))} -p {p['pg']}",'-w','start']);pg_started=True
 psql=[PG/'psql','-X','-h',socket_dir,'-p',str(p['pg']),'-d','postgres','-v','ON_ERROR_STOP=1']
 run(psql,input_text=f"do $$ begin if not exists(select 1 from pg_roles where rolname='postgres') then create role postgres nologin; end if; if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if; if not exists(select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit password '{cfg['db_password']}'; end if; end $$; grant anon,authenticated,service_role to authenticator; create schema if not exists auth; alter role current_user set search_path=auth,public;")
 if options.refresh_empty_snapshot:
  # Check after PostgreSQL starts, before serving HTTP or changing any snapshot/migration.
  exists=run([*psql,'-At','-c',"select to_regclass('public.game_saves') is not null"]).strip()
  if exists=='t' and run([*psql,'-At','-c','select count(*) from public.game_saves']).strip()!='0':raise RuntimeError('LOCAL_PLAY_REFRESH_REQUIRES_EMPTY_DATABASE')
  backups=BASE/'backups';backups.mkdir(exist_ok=True,mode=0o700)
  backup=backups/f'before-empty-snapshot-refresh-{time.time_ns()}.sql';backup.touch(mode=0o600,exist_ok=False)
  run([PG/'pg_dump','-h',socket_dir,'-p',str(p['pg']),'-d','postgres','--no-owner','--no-privileges','-f',backup])
 migration_sql=None
 if options.refresh_migrate_saves:
  # Dry-run the carry-over with the new code before the frozen snapshot changes; any invalid save aborts here.
  backups=BASE/'backups';backups.mkdir(exist_ok=True,mode=0o700);stamp=time.time_ns()
  dump=backups/f'before-migrate-refresh-{stamp}.sql';dump.touch(mode=0o600,exist_ok=False)
  run([PG/'pg_dump','-h',socket_dir,'-p',str(p['pg']),'-d','postgres','--no-owner','--no-privileges','-f',dump])
  run(['npm','run','build'])
  if run([*psql,'-At','-c',"select to_regclass('public.game_saves') is not null"]).strip()=='t':
   saves=backups/f'migrate-input-{stamp}.json';saves.touch(mode=0o600,exist_ok=False)
   saves.write_text(run([*psql,'-At','-c',"select coalesce(json_agg(json_build_object('account_id',account_id,'revision',revision,'content_hash',content_hash,'content_version',content_version,'rules_version',rules_version,'state',state)),'[]') from public.game_saves"]))
   migration_sql=backups/f'migrate-{stamp}.sql'
   print(run([NODE,'--import','tsx',ROOT/'scripts/game/migrate-local-saves.ts',saves,migration_sql]).strip(),flush=True)
  prepare_snapshot(build=False)
 if options.reset_saves_for_new_content:
  # Only after the player chose to start over: keep a full dump and a JSON export of every game save first.
  backups=BASE/'backups';backups.mkdir(exist_ok=True,mode=0o700);stamp=time.time_ns()
  dump=backups/f'before-new-content-reset-{stamp}.sql';dump.touch(mode=0o600,exist_ok=False)
  run([PG/'pg_dump','-h',socket_dir,'-p',str(p['pg']),'-d','postgres','--no-owner','--no-privileges','-f',dump])
  if run([*psql,'-At','-c',"select to_regclass('public.game_saves') is not null"]).strip()=='t':
   export=backups/f'game-saves-before-new-content-reset-{stamp}.json';export.touch(mode=0o600,exist_ok=False)
   export.write_text(run([*psql,'-At','-c',"select coalesce(json_agg(row_to_json(s)),'[]') from public.game_saves s"]))
   run(psql,input_text='begin; delete from public.game_battle_checkpoints; delete from public.game_command_receipts; delete from public.game_save_history; delete from public.game_saves; commit;')
  prepare_snapshot()
 if options.refresh_compatible_snapshot:
  if not snapshot.exists():raise RuntimeError('LOCAL_PLAY_NO_SNAPSHOT_TO_REFRESH')
  backups=BASE/'backups';backups.mkdir(exist_ok=True,mode=0o700)
  backup=backups/f'before-compatible-snapshot-refresh-{time.time_ns()}.sql';backup.touch(mode=0o600,exist_ok=False)
  run([PG/'pg_dump','-h',socket_dir,'-p',str(p['pg']),'-d','postgres','--no-owner','--no-privileges','-f',backup])
  prepare_snapshot(require_compatible=True)
 elif not snapshot.exists() or options.refresh_empty_snapshot:prepare_snapshot()
 start('mailpit',[TOOLS/'mailpit/mailpit','--listen',f"127.0.0.1:{p['mail']}",'--smtp',f"127.0.0.1:{p['smtp']}",'--database',BASE/'mail.db','--disable-version-check','--quiet'])
 auth_env={**env,'GOTRUE_API_HOST':'127.0.0.1','PORT':str(p['auth']),'API_EXTERNAL_URL':url+'/auth/v1','GOTRUE_SITE_URL':url,'GOTRUE_URI_ALLOW_LIST':url+'/auth','GOTRUE_DB_DRIVER':'postgres','GOTRUE_DB_DATABASE_URL':f"postgres://{getpass.getuser()}:{cfg['db_password']}@127.0.0.1:{p['pg']}/postgres?sslmode=disable",'GOTRUE_DB_NAMESPACE':'auth','GOTRUE_DB_MIGRATIONS_PATH':str(TOOLS/'auth/migrations'),'GOTRUE_JWT_SECRET':cfg['jwt_secret'],'GOTRUE_JWT_AUD':'authenticated','GOTRUE_JWT_DEFAULT_GROUP_NAME':'authenticated','GOTRUE_JWT_ADMIN_ROLES':'service_role','GOTRUE_DISABLE_SIGNUP':'true','GOTRUE_EXTERNAL_EMAIL_ENABLED':'true','GOTRUE_MAILER_AUTOCONFIRM':'false','GOTRUE_SMTP_HOST':'127.0.0.1','GOTRUE_SMTP_PORT':str(p['smtp']),'GOTRUE_SMTP_ADMIN_EMAIL':'local@example.invalid','GOTRUE_SMTP_SENDER_NAME':'Local RO Idle','GOTRUE_MAILER_URLPATHS_RECOVERY':'/auth/v1/verify','GOTRUE_LOG_LEVEL':'error'}
 if options.lan:auth_env['GOTRUE_DISABLE_SIGNUP']='true'  # strangers on the same Wi-Fi cannot create accounts
 run([TOOLS/'auth/auth','migrate'],auth_env,cwd=BASE);start('auth',[TOOLS/'auth/auth','serve'],auth_env);wait(f"http://127.0.0.1:{p['auth']}/health")
 run(psql,input_text='grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role; create schema if not exists ro_local_tools; create table if not exists ro_local_tools.migrations(filename text primary key,checksum text not null);')
 for migration in sorted((snapshot/'supabase/migrations').glob('*.sql')):
  name=migration.name.replace("'","''");checksum=hashlib.sha256(migration.read_bytes()).hexdigest();previous=run([*psql,'-At','-c',f"select checksum from ro_local_tools.migrations where filename='{name}'"]).strip()
  if previous and previous!=checksum:raise RuntimeError('LOCAL_PLAY_SNAPSHOT_MIGRATION_CHANGED')
  if not previous:
   body=re.sub(r'(?mi)^begin;\s*$', '',migration.read_text(),count=1);body=re.sub(r'(?mi)^commit;\s*$', '',body,count=1)
   run(psql,input_text=f"begin;\n{body}\ninsert into ro_local_tools.migrations values('{name}','{checksum}');\ncommit;")
 if migration_sql:run([*psql,'-f',migration_sql])  # after schema migrations, before any service serves saves
 run(psql,input_text="insert into public.game_deployment values(true,'local','local') on conflict(singleton) do nothing; select public.game_assert_environment('local','local');")
 rest_env={**env,'DYLD_LIBRARY_PATH':str(PG.parent/'lib'),'PGRST_DB_URI':f"postgres://authenticator:{cfg['db_password']}@127.0.0.1:{p['pg']}/postgres",'PGRST_DB_SCHEMAS':'public','PGRST_DB_ANON_ROLE':'anon','PGRST_JWT_SECRET':cfg['jwt_secret'],'PGRST_SERVER_HOST':'127.0.0.1','PGRST_SERVER_PORT':str(p['rest'])}
 start('rest',[TOOLS/'postgrest/postgrest'],rest_env);wait(f"http://127.0.0.1:{p['rest']}/")
 start('gateway',[NODE,'--import','tsx',snapshot/'scripts/game/local-supabase-gateway.ts'],{**env,'RO_GATEWAY_HOST':'0.0.0.0'}if options.lan else env,cwd=snapshot);wait(url+'/auth/v1/health');wait(url+'/auth')
 if not cfg.get('user_id'):
  user=admin_call('/admin/users','POST',{'email':cfg['email'],'password':cfg['password'],'email_confirm':True,'app_metadata':{'ro_idle_local_preview':True}});cfg['user_id']=user['id'];config_path.write_text(json.dumps(cfg));config_path.chmod(0o600)
 credentials=BASE/'login.md';credentials.write_text(f"# Local RO Idle preview\n\nURL: {url}/auth\n\nEmail: {cfg['email']}\n\nPassword: {cfg['password']}\n\nThis is a synthetic account on this computer only.\n");credentials.chmod(0o600)
 (BASE/'running.pid').write_text(str(os.getpid()));(BASE/'running.pid').chmod(0o600)
 def lan_address():
  # The route the OS would use for an outside address; a UDP connect sends no packet.
  with socket.socket(socket.AF_INET,socket.SOCK_DGRAM)as s:
   try:s.connect(('192.0.2.1',9));return s.getsockname()[0]
   except OSError:return None
 lan=lan_address() if options.lan else None
 metadata={'url':url,'lan_url':f"http://{lan}:{p['gateway']}/play" if lan else None,'login_file':str(credentials),'private_config':str(config_path),'snapshot':str(snapshot),'content_hash':json.loads((snapshot/'src/generated/runtime-manifest.json').read_text())['content_hash'],'persistent':True,'empty_save_refresh':options.refresh_empty_snapshot,'compatible_refresh':options.refresh_compatible_snapshot,'new_content_reset':options.reset_saves_for_new_content,'migrated_saves':bool(migration_sql),'hosted':False,'public_key_or_credentials_logged':False}
 (BASE/'ready.json').write_text(json.dumps(metadata,indent=2));(BASE/'ready.json').chmod(0o600)
 print(json.dumps({k:v for k,v in metadata.items()if k!='private_config'}),flush=True)
 def stop(_signal,_frame):raise KeyboardInterrupt
 signal.signal(signal.SIGTERM,stop)
 while True:
  if any(child.poll()is not None for child in processes):raise RuntimeError('LOCAL_PLAY_SERVICE_EXITED')
  time.sleep(1)
except KeyboardInterrupt:pass
except Exception as error:
 print(str(error)if str(error).startswith('LOCAL_PLAY_')else'LOCAL_PLAY_FAILED_REDACTED',flush=True)
 raise SystemExit(1)
finally:
 for child in reversed(processes):
  if child.poll()is None:
   child.terminate()
   try:child.wait(timeout=5)
   except subprocess.TimeoutExpired:child.kill();child.wait()
 for log in logs:log.close()
 if pg_started:run([PG/'pg_ctl','-D',data,'-m','fast','-w','stop'])
