#!/usr/bin/env python3
"""Real local Auth/PostgREST/PostgreSQL/SMTP; fresh private data, cleanup on exit.

No Docker, hosted project, production keys, existing DB, or external mail relay.
Tool downloads are a separate explicit prepare_auth_test_tools.py command.
"""
import base64
import getpass
import hashlib
import hmac
import json
import os
import re
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RUN_TAG = os.environ.get("RO_EVIDENCE_PREFIX", "task-021")
if not re.fullmatch(r"task-[0-9]{3}",RUN_TAG): raise SystemExit("INVALID_EVIDENCE_PREFIX")
FOCUS = os.environ.get("RO_LOCAL_TEST_FOCUS", "all")
if FOCUS not in ("all", "auth", "navigation", "daily_terminal", "statuses", "history", "healing", "cards", "elements", "impact", "skill_descriptions", "card_frames", "card_rarity", "equipment", "slots", "growth", "shell", "compact", "cadence", "settlement", "daily_reset", "save_latency", "save_timeout", "migration_pending"): raise SystemExit("INVALID_TEST_FOCUS")
TOOLS = Path(os.environ.get("RO_AUTH_TOOLS", "/private/tmp/ro-idle-auth-tools"))
PG = Path(os.environ.get("RO_PG_BIN") or subprocess.check_output(["pg_config", "--bindir"], text=True).strip())
NODE = os.environ.get("RO_NODE", "node")
manifest = json.loads((ROOT / "supabase/tests/local-tools.json").read_text())
for tool in manifest:
    archive = TOOLS / tool["archive"]
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != tool["sha256"]:
        raise SystemExit("Prepare checksum-verified tools first: scripts/prepare_auth_test_tools.py")

def port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0)); return sock.getsockname()[1]

def wait_url(url, timeout=30):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if any(process.poll() is not None for process in processes): raise RuntimeError("LOCAL_SERVICE_EXITED")
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200: return
        except Exception: pass
        time.sleep(.15)
    raise RuntimeError("LOCAL_SERVICE_START_TIMEOUT")

def run(args, env=None, cwd=ROOT):
    result = subprocess.run([str(a) for a in args], cwd=cwd, env=env, capture_output=True, text=True)
    if result.returncode:
        message = result.stderr.strip() or result.stdout.strip()
        for value in [jwt_secret, db_password, environment["SUPABASE_SERVICE_ROLE_KEY"], environment["VITE_SUPABASE_PUBLISHABLE_KEY"], environment["SAVE_SIGNING_KEY"]]: message = message.replace(value,"[redacted]")
        message = re.sub(r"[A-Za-z0-9_~+/=.-]{24,}","[redacted-long-value]",message)
        raise RuntimeError("LOCAL_COMMAND_FAILED:" + Path(str(args[0])).name + ':' + message[-600:])
    return result.stdout

def token(role, secret):
    enc = lambda value: base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode()).rstrip(b"=")
    body = enc({"alg":"HS256","typ":"JWT"}) + b"." + enc({"role":role,"iss":"local-ro-idle-test","iat":int(time.time()),"exp":int(time.time())+3600})
    return (body + b"." + base64.urlsafe_b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).rstrip(b"=")).decode()

report = {"task_id":RUN_TAG.upper(), "test_focus":FOCUS, "passed":False, "self_hosted_local":True, "hosted_supabase_tested":False, "components":manifest, "checks":[], "credentials_logged":False}
with tempfile.TemporaryDirectory(prefix="ro-auth21-", dir="/private/tmp") as folder:
    base = Path(folder); data = base / "pg"; socket_dir = base / "socket"; socket_dir.mkdir()
    processes = []; logs = []; pg_started = False
    pg_port, auth_port, rest_port, smtp_port, mail_port, gateway_port, ui_port = [port() for _ in range(7)]
    jwt_secret, db_password = secrets.token_urlsafe(48), secrets.token_urlsafe(32)
    password_file = base / "pw"; password_file.write_text(db_password); password_file.chmod(0o600)
    db_url = f"postgres://{getpass.getuser()}:{db_password}@127.0.0.1:{pg_port}/postgres?sslmode=disable"
    gateway = f"http://127.0.0.1:{gateway_port}"; ui = f"http://127.0.0.1:{ui_port}"
    environment = {**os.environ, "APP_ENV":"test", "VITE_APP_ENV":"test", "SUPABASE_URL":gateway, "VITE_SUPABASE_URL":gateway, "SUPABASE_SERVICE_ROLE_KEY":token("service_role",jwt_secret), "SAVE_SIGNING_KEY":secrets.token_urlsafe(48), "VITE_SUPABASE_PUBLISHABLE_KEY":token("anon",jwt_secret), "SUPABASE_TEST_PROJECT_REF":"local", "SUPABASE_PRODUCTION_PROJECT_REF":"", "RO_EVIDENCE_PREFIX":RUN_TAG, "RO_SUPABASE_LOCAL_STACK":"1", "RO_RUN_SUPABASE_INTEGRATION":"1", "RO_AUTH_PORT":str(auth_port), "RO_REST_PORT":str(rest_port), "RO_GATEWAY_PORT":str(gateway_port), "RO_LIVE_URL":ui, "RO_API_PROXY_URL":gateway, "RO_MAILPIT_URL":f"http://127.0.0.1:{mail_port}"}
    # Ignore project .env files: temp cwd for service binaries; explicit env for Vite.
    def start(name, args, env=environment, cwd=base):
        log = open(base / (name + ".log"), "w+"); logs.append(log)
        process = subprocess.Popen([str(a) for a in args], cwd=cwd, env=env, stdout=log, stderr=log); processes.append(process); return process
    try:
        run([PG/"initdb","-D",data,"--encoding=UTF8","--no-locale","--auth-local=trust","--auth-host=scram-sha-256","--pwfile",password_file])
        run([PG/"pg_ctl","-D",data,"-l",base/"pg.log","-o",f"-h 127.0.0.1 -k {socket_dir} -p {pg_port}","-w","start"]); pg_started=True
        psql = [PG/"psql","-X","-h",socket_dir,"-p",str(pg_port),"-d","postgres","-v","ON_ERROR_STOP=1"]
        run([*psql,"-c",f"do $$ begin if not exists(select 1 from pg_roles where rolname='postgres') then create role postgres nologin; end if; end $$; create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role authenticator login noinherit password '{db_password}'; grant anon,authenticated,service_role to authenticator; create schema auth; alter role current_user set search_path=auth,public;"])
        start("mailpit",[TOOLS/"mailpit/mailpit","--listen",f"127.0.0.1:{mail_port}","--smtp",f"127.0.0.1:{smtp_port}","--database",str(base/"mail.db"),"--disable-version-check","--quiet"])
        auth_env = {**environment,"GOTRUE_API_HOST":"127.0.0.1","PORT":str(auth_port),"API_EXTERNAL_URL":gateway+"/auth/v1","GOTRUE_SITE_URL":ui,"GOTRUE_URI_ALLOW_LIST":ui+"/auth","GOTRUE_DB_DRIVER":"postgres","GOTRUE_DB_DATABASE_URL":db_url,"GOTRUE_DB_NAMESPACE":"auth","GOTRUE_DB_MIGRATIONS_PATH":str(TOOLS/"auth/migrations"),"GOTRUE_JWT_SECRET":jwt_secret,"GOTRUE_JWT_AUD":"authenticated","GOTRUE_JWT_DEFAULT_GROUP_NAME":"authenticated","GOTRUE_JWT_ADMIN_ROLES":"service_role","GOTRUE_DISABLE_SIGNUP":"true","GOTRUE_EXTERNAL_EMAIL_ENABLED":"true","GOTRUE_MAILER_AUTOCONFIRM":"false","GOTRUE_SMTP_HOST":"127.0.0.1","GOTRUE_SMTP_PORT":str(smtp_port),"GOTRUE_SMTP_ADMIN_EMAIL":"test@example.invalid","GOTRUE_SMTP_SENDER_NAME":"Local RO Idle Tests","GOTRUE_SMTP_MAX_FREQUENCY":"1s","GOTRUE_RATE_LIMIT_EMAIL_SENT":"100","GOTRUE_MAILER_URLPATHS_RECOVERY":"/auth/v1/verify","GOTRUE_LOG_LEVEL":"error"}
        run([TOOLS/"auth/auth","migrate"],auth_env,cwd=base)
        start("auth",[TOOLS/"auth/auth","serve"],auth_env)
        wait_url(f"http://127.0.0.1:{auth_port}/health")
        run([*psql,"-c","grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;"])
        for migration in sorted((ROOT/"supabase/migrations").glob('*.sql')): run([*psql,"-f",migration])
        run([*psql,"-c","insert into public.game_deployment values (true,'test','local');"])
        rest_env = {**environment,"DYLD_LIBRARY_PATH":str(PG.parent/"lib"),"PGRST_DB_URI":f"postgres://authenticator:{db_password}@127.0.0.1:{pg_port}/postgres","PGRST_DB_SCHEMAS":"public","PGRST_DB_ANON_ROLE":"anon","PGRST_JWT_SECRET":jwt_secret,"PGRST_SERVER_HOST":"127.0.0.1","PGRST_SERVER_PORT":str(rest_port)}
        start("rest",[TOOLS/"postgrest/postgrest"],rest_env)
        wait_url(f"http://127.0.0.1:{rest_port}/")
        start("gateway",[NODE,"--import","tsx",ROOT/"scripts/game/local-supabase-gateway.ts"],cwd=ROOT)
        wait_url(gateway+"/auth/v1/health"); wait_url(environment["RO_MAILPIT_URL"]+"/api/v1/messages")
        report["checks"].append("Fresh PostgreSQL, upstream Auth migrations, game migration and matching marker; real Auth/PostgREST/mail sink on loopback")
        # Integration prints only redacted results; copy output only after the script handles it.
        integration = run([NODE,"--import","tsx",ROOT/"scripts/game/test-supabase.ts"],environment)
        (ROOT/("plan/evidence/"+RUN_TAG+"-local-api.txt")).write_text(integration)
        report["checks"].append("Real SDK Auth/JWT/PostgREST/RLS/API tests passed")
        if FOCUS == "all" and RUN_TAG in ("task-025", "task-026", "task-027", "task-028"):
            story_api = run([NODE,"--import","tsx",ROOT/"scripts/game/test-story-supabase.ts"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-story-api.txt")).write_text(story_api)
            report["checks"].append("Real Story failure/main-death/90s/terminal-lease SQL boundary tests passed")
        start("vite",[NODE,ROOT/"node_modules/vite/bin/vite.js","--host","127.0.0.1","--port",str(ui_port),"--strictPort"],cwd=ROOT)
        wait_url(ui+"/auth")
        if FOCUS == "migration_pending":
            result = run([NODE,ROOT/"scripts/test_migration_pending_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-migration-ui.txt")).write_text(result)
            report["checks"].append("Actual boss-start version race/committed and refused pending/signed backup/migration reply loss/retry passed")
        if FOCUS == "save_timeout":
            result = run([NODE,ROOT/"scripts/test_save_timeout_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-timeout-ui.txt")).write_text(result)
            report["checks"].append("Actual held committed Refine reply/15s timeout/in-dialog retry/frozen old gold→new rate and exactly-once replay passed")
        if FOCUS == "card_rarity":
            result = run([NODE,ROOT/"scripts/test_card_rarity_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-card-rarity-ui.txt")).write_text(result)
            report["checks"].append("Actual fixed monster rarity/signed migration/long Add Card UI/progress badges/assignment/pity/frozen farm passed")
        if FOCUS == "card_frames":
            result = run([NODE,ROOT/"scripts/test_card_frames_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-card-frames-ui.txt")).write_text(result)
            report["checks"].append("Actual full-card masks/equipped card frames and frozen old→rare new farm/retry passed")
        if FOCUS == "skill_descriptions":
            result = run([NODE,ROOT/"scripts/test_skill_descriptions_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-descriptions-ui.txt")).write_text(result)
            report["checks"].append("Actual mobile skill descriptions/level deltas and native card geometry passed with zero inspection writes")
        if FOCUS == "impact":
            impact = run([NODE,ROOT/"scripts/test_build_impact_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-impact-ui.txt")).write_text(impact)
            report["checks"].append("Actual mobile shared skill power, gear/card role descriptions, preview/equip/reload and retained card assignment passed")
        if FOCUS == "elements":
            elements = run([NODE,ROOT/"scripts/test_elements_ui_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-elements-ui.txt")).write_text(elements)
            report["checks"].append("Actual mobile skill/target armor element labels, card priority and live endow display passed")
        if FOCUS == "cards":
            cards = run([NODE,ROOT/"scripts/test_cards_equipment_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-cards-ui.txt")).write_text(cards)
            report["checks"].append("Actual mobile RO card farm/receipt replay/assignment/reload and option/weapon-family UI passed")
        if FOCUS == "healing":
            healing = run([NODE,ROOT/"scripts/test_healing_ui_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-healing.txt")).write_text(healing)
            report["checks"].append("Actual mobile Bard/Dancer/Sanctuary HoT rings, P.ATK details, expiry and read-only rendering passed")
        if FOCUS == "history":
            history = run([NODE,ROOT/"scripts/test_battle_history_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-history.txt")).write_text(history)
            report["checks"].append("Actual terminal battle history touch/zoom/log/filter and no save writes passed")
        if FOCUS == "statuses":
            statuses = run([NODE,ROOT/"scripts/test_status_ui_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-statuses.txt")).write_text(statuses)
            report["checks"].append("Actual mobile live Monk spheres, buff/debuff/shield icons, source/stack/expiry and requested farm presentation passed")
        if FOCUS == "daily_terminal":
            terminal = run([NODE,ROOT/"scripts/test_daily_terminal_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-daily-terminal.txt")).write_text(terminal)
            report["checks"].append("Daily60s deadline completes in realChrome, commits onefinish and reload retains quota/rewards")
        if FOCUS == "navigation":
            navigation = run([NODE,ROOT/"scripts/test_navigation_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-navigation.txt")).write_text(navigation)
            report["checks"].append("Actual mobile menu navigation CPU profile and click-to-paint timings captured without API save requests")
        if FOCUS == "all":
            browser = run([NODE,ROOT/"scripts/test_auth_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-local-browser.txt")).write_text(browser)
            report["checks"].append("Browser password login, missing-save read, SMTP-captured recovery with PKCE redirect and logout passed")
        if FOCUS == "all" and RUN_TAG in ("task-022", "task-023", "task-024", "task-025", "task-026", "task-027", "task-028"):
            save_browser = run([NODE, ROOT/"scripts/test_save_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-save-browser.txt")).write_text(save_browser)
            report["checks"].append("Actual save browser response-loss/refresh, Web Locks two-tab transfer and offline reconnect passed")
        if FOCUS == "all" and RUN_TAG in ("task-023", "task-024", "task-025", "task-026", "task-027", "task-028"):
            roster_browser = run([NODE, ROOT/"scripts/test_roster_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-roster-browser.txt")).write_text(roster_browser)
            report["checks"].append("Actual roster creation/progression/team/class/refund/Breakthrough/offline mobile flow passed")
        if FOCUS == "all" and RUN_TAG in ("task-024", "task-025", "task-026", "task-027", "task-028"):
            skills_browser = run([NODE, ROOT/"scripts/test_skills_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-skills-browser.txt")).write_text(skills_browser)
            report["checks"].append("Actual skills purchase/Passive/loadout/off-team/refund/offline mobile flow passed")
        if FOCUS == "all" and RUN_TAG in ("task-025", "task-026", "task-027", "task-028"):
            story_browser = run([NODE, ROOT/"scripts/test_story_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-story-browser.txt")).write_text(story_browser)
            report["checks"].append("Actual fresh-account Story/farm/upgrade/repeat/reload browser cycle passed")
        if RUN_TAG in ("task-026", "task-027", "task-028") and FOCUS in ("all", "equipment"):
            equipment_browser = run([NODE,ROOT/"scripts/test_equipment_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-equipment-browser.txt")).write_text(equipment_browser)
            report["checks"].append("Actual inventory/equip/slot-source/transfer/lock/capacity/purchase response-loss mobile browser flow passed")
        if RUN_TAG in ("task-027", "task-028") and FOCUS in ("all", "slots"):
            slots_browser = run([NODE,ROOT/"scripts/test_slots_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-slots-browser.txt")).write_text(slots_browser)
            report["checks"].append("Actual slot/card upgrade/refund/ledger/duplicate sources/response-loss mobile browser flow passed")
        if RUN_TAG == "task-028" and FOCUS in ("all", "growth"):
            growth_browser = run([NODE,ROOT/"scripts/test_gear_growth_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-growth-browser.txt")).write_text(growth_browser)
            report["checks"].append("Actual rarity fusion/tier preservation/materials/response-loss/full bag mobile browser flow passed")
        if RUN_TAG == "task-048" and FOCUS in ("all", "shell"):
            shell_browser = run([NODE,ROOT/"scripts/test_game_shell_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-shell-browser.txt")).write_text(shell_browser)
            report["checks"].append("Actual game shell onboarding/farm walk/boss/AFK/buddy/slot/stats/skills/backpack/team/viewport flow passed")
        if FOCUS == "compact":
            compact_browser = run([NODE,ROOT/"scripts/test_compact_ui_live.cjs"],environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-compact-browser.txt")).write_text(compact_browser)
            report["checks"].append("Compact UI: actual isolated Chrome navigation, draft isolation, per-character saved changes and mobile layout audit passed")
        if FOCUS == "cadence":
            cadence_browser = run([NODE, ROOT/"scripts/test_battle_cadence_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-cadence-browser.txt")).write_text(cadence_browser)
            report["checks"].append("Battle save cadence: actual isolated Chrome/HTTP/SQL intervals, prediction, speed, settlement and reconnect passed")
        if FOCUS == "settlement":
            finish_browser = run([NODE, ROOT/"scripts/test_battle_finish_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-finish-browser.txt")).write_text(finish_browser)
            report["checks"].append("Terminal-only battle: actual Chrome/SQL zero mid-fight writes, local speed changes, one finish and reconnect passed")
        if FOCUS == "save_latency":
            latency_browser = run([NODE, ROOT/"scripts/test_save_latency_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-latency-browser.txt")).write_text(latency_browser)
            report["checks"].append("Actual shared save ports/controller on Chrome with Auth/API/Postgres: combined writes, network-count/latency baseline, response loss/retry and legacy fallback")
        if FOCUS == "daily_reset":
            reset_browser = run([NODE, ROOT/"scripts/test_daily_reset_live.cjs"], environment)
            (ROOT/("plan/evidence/"+RUN_TAG+"-reset-browser.txt")).write_text(reset_browser)
            report["checks"].append("Daily reset: actual owner migration preview/backup/repair and typed new-game reset/reload passed")
        report["passed"] = True
    except Exception as error:
        report["error"] = str(error) if str(error).startswith(("LOCAL_",)) else "LOCAL_STACK_FAILED_REDACTED"
        # Diagnostics stay private in this ephemeral directory while debugging.
        # Deliberately do not copy Auth/SMTP logs (may contain one-use tokens).
        report["diagnostics"] = {}
        for log in logs:
            log.flush(); log.seek(0)
            lines = [line.strip() for line in log.read().splitlines() if re.search(r"error|fatal|failed|exception", line, re.I)][-4:]
            safe = []
            for line in lines:
                for value in [jwt_secret, db_password, environment["SUPABASE_SERVICE_ROLE_KEY"], environment["VITE_SUPABASE_PUBLISHABLE_KEY"], environment["SAVE_SIGNING_KEY"]]: line = line.replace(value, "[redacted]")
                line = re.sub(r"[A-Za-z0-9_~+/=.-]{24,}", "[redacted-long-value]", line)
                safe.append(line[:300] + ' … ' + line[-500:] if len(line)>800 else line)
            report["diagnostics"][Path(log.name).name] = safe
    finally:
        for process in reversed(processes):
            process.terminate()
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired: process.kill(); process.wait()
        for log in logs: log.close()
        if pg_started: run([PG/"pg_ctl","-D",data,"-m","fast","-w","stop"])
        report["cleanup"] = "Owned services stopped and private DB/mail/credentials directory removed at exit"
report["source_sha256"] = {str(path.relative_to(ROOT)):hashlib.sha256(path.read_bytes()).hexdigest() for path in [Path(__file__),ROOT/"scripts/game/test-supabase.ts",ROOT/"scripts/game/local-supabase-gateway.ts",*sorted((ROOT/"supabase/migrations").glob("*.sql"))]}
(ROOT/("plan/evidence/"+RUN_TAG+"-local-stack.json")).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(0 if report["passed"] else 1)
