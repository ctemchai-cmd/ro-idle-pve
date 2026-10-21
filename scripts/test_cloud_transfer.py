#!/usr/bin/env python3
"""TASK-058 real SQL/operator-helper test on a new private disposable cluster."""
import importlib.util
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import tempfile
import traceback

ROOT = Path(__file__).resolve().parents[1]
PG = Path(os.environ.get('RO_PG_BIN') or subprocess.check_output(['pg_config', '--bindir'], text=True).strip())
SOURCE = '11111111-1111-4111-8111-111111111111'
TARGET = 'abcdefab-1234-4567-89ab-1234567890ab'
PROJECT = 'abcdefghijklmnopqrst'
KEY = 'cloud-transfer-fixture-signing-key-' * 2
report = {'task_id': 'TASK-058', 'passed': False, 'checks': [], 'scope': 'Fresh PostgreSQL/Auth UID fixtures, operator helper and shared API handler. No hosted Supabase/GoTrue/JWT/PostgREST or personal preview access.', 'personal_preview_accessed': False, 'credential_values_logged': False}

def command(args, **kwargs):
    result = subprocess.run([str(a) for a in args], capture_output=True, text=True, **kwargs)
    if result.returncode:
        report['failure_program'] = Path(str(args[0])).name
        report['fixture_diagnostic'] = result.stderr[-1200:]
        raise RuntimeError('DISPOSABLE_COMMAND_FAILED')
    return result.stdout

base = Path(tempfile.mkdtemp(prefix='xt-', dir=ROOT / '.local'))
started = False
try:
    report['step'] = 'initialize disposable database'
    socket = base / 'socket'; socket.mkdir()
    data = base / 'pg'
    command([PG / 'initdb', '-D', data, '--encoding=UTF8', '--no-locale', '--auth-local=trust', '--auth-host=reject'])
    command([PG / 'pg_ctl', '-D', data, '-l', base / 'postgres.log', '-o', f"-h '' -k '{socket}' -p 55439", '-w', 'start']); started = True
    psql = [PG / 'psql', '-X', '-qAt', '-h', socket, '-p', '55439', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
    def query(text): return command([*psql, '-c', text]).strip()
    def apply(path, expected_error=None):
        result = subprocess.run([str(a) for a in [*psql, '-f', path]], capture_output=True, text=True)
        if expected_error:
            if result.returncode == 0 or expected_error not in result.stderr: raise RuntimeError('EXPECTED_SQL_REFUSAL_MISSING')
        elif result.returncode: raise RuntimeError('IMPORT_SQL_FAILED')
    apply(ROOT / 'supabase/tests/bootstrap_local_postgres.sql')
    for migration in sorted((ROOT / 'supabase/migrations').glob('*.sql')): apply(migration)
    report['step'] = 'create source fixture'
    query(f"insert into public.game_deployment values(true,'local','local'); insert into auth.users values('{SOURCE}'),('{TARGET}');")
    env = {**os.environ, 'RO_CLOUD_TRANSFER_TEST': '1', 'RO_PG_BIN': str(PG)}
    command(['node', '--import', 'tsx', 'scripts/game/test-cloud-transfer.ts', 'fixtures', base], cwd=ROOT, env=env)
    apply(base / 'source.sql')
    (base / 'private.json').write_text(json.dumps({'ports': {'pg': 55439}, 'user_id': SOURCE, 'signing_key': KEY})); (base / 'private.json').chmod(0o600)
    spec = importlib.util.spec_from_file_location('transfer_helper', ROOT / 'scripts/prepare_local_cloud_transfer.py')
    helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
    report['step'] = 'run private local export helper'
    before = query(f"select revision::text || ':' || state_hash from public.game_saves where account_id='{SOURCE}'")
    prepared = helper.prepare(base, base / 'output', f'https://{PROJECT}.supabase.co', TARGET)
    output = Path(prepared['output_directory']); sql = output / 'import.sql'
    assert prepared['source_read_only'] and prepared['backup_created'] and prepared['cloud_written'] is False
    assert before == query(f"select revision::text || ':' || state_hash from public.game_saves where account_id='{SOURCE}'")
    for path in output.iterdir(): assert path.stat().st_mode & 0o077 == 0
    assert output.stat().st_mode & 0o077 == 0 and KEY not in sql.read_text()
    assert subprocess.run(['git', 'check-ignore', '-q', str(output)], cwd=ROOT).returncode == 0
    report['checks'].append('Private helper backed up game tables, read a consistent source tip without writes and produced only ignored 0600 files in a 0700 directory; signing key absent from SQL/logs')
    apply(sql, 'ENVIRONMENT_MISMATCH')
    query(f"update public.game_deployment set environment='production',project_ref='{PROJECT}'; delete from auth.users where id='{TARGET}';")
    apply(sql, 'TARGET_AUTH_USER_MISSING')
    query(f"insert into auth.users values('{TARGET}');")
    apply(base / 'future.sql', 'TARGET_CLOCK_BEHIND_FARM_CURSOR')
    query(f"insert into public.game_saves select '{TARGET}',revision,schema_version,content_version,rules_version,content_hash,state,state_hash,updated_at from public.game_saves where account_id='{SOURCE}';")
    apply(sql, 'TARGET_ALREADY_HAS_SAVE')
    assert query(f"select state_hash from public.game_saves where account_id='{TARGET}'") == before.split(':')[1]
    query(f"delete from public.game_saves where account_id='{TARGET}';")
    report['checks'].append('Wrong project/environment, missing Auth user, future AFK clock and nonempty destination refuse without overwriting a save')
    query("create function public.fixture_fail_history() returns trigger language plpgsql as $$ begin raise exception 'FIXTURE_ATOMIC_FAILURE'; end $$; create trigger fixture_fail_history before insert on public.game_save_history for each row execute function public.fixture_fail_history();")
    apply(sql, 'FIXTURE_ATOMIC_FAILURE')
    for table in ['game_saves', 'game_save_history', 'game_command_receipts']:
        assert query(f"select count(*) from public.{table} where account_id='{TARGET}'") == '0'
    query('drop trigger fixture_fail_history on public.game_save_history; drop function public.fixture_fail_history();')
    report['checks'].append('Injected failure after save insert rolls back the save/history/receipt together')
    apply(sql)
    assert query(f"select state_hash from public.game_saves where account_id='{TARGET}'") == before.split(':')[1]
    report['api'] = json.loads(command(['node', '--import', 'tsx', 'scripts/game/test-cloud-transfer.ts', 'api', socket, '55439'], cwd=ROOT, env=env))
    progressed = query(f"select revision::text || ':' || state_hash from public.game_saves where account_id='{TARGET}'")
    apply(sql)
    assert progressed == query(f"select revision::text || ':' || state_hash from public.game_saves where account_id='{TARGET}'")
    collision = base / 'collision.sql'; collision.write_text(sql.read_text().replace(prepared['transfer_id'], '55555555-5555-4555-8555-555555555555'))
    apply(collision, 'TARGET_ALREADY_HAS_SAVE')
    original_hash = re.search(r"prior_hash <> '([0-9a-f]{64})'", sql.read_text()).group(1)
    collision.write_text(sql.read_text().replace(original_hash, 'b' * 64))
    apply(collision, 'IDEMPOTENCY_KEY_REUSE')
    assert progressed == query(f"select revision::text || ':' || state_hash from public.game_saves where account_id='{TARGET}'")
    report['checks'].append('Valid full state including SQL quote delimiters imports; shared API verifies the target-owner signature and commits another command; replay after progression is a no-op')
    assert query(f"set role authenticated; set request.jwt.claim.sub='{TARGET}'; select count(*) from public.game_saves where account_id='{SOURCE}'; reset role;").splitlines()[-1] == '0'
    report['checks'].append('Post-import RLS hides the source owner from the destination user role')
    query("update public.game_deployment set environment='local',project_ref='local';")
    query(f"update public.game_saves set state=jsonb_set(state,'{{active_battle}}','{{\"battle_id\":\"{TARGET}\"}}') where account_id='{SOURCE}';")
    try:
        helper.prepare(base, base / 'output', f'https://{PROJECT}.supabase.co', TARGET)
        raise RuntimeError('ACTIVE_BATTLE_EXPORT_ACCEPTED')
    except RuntimeError as error:
        assert str(error) == 'FINISH_OR_RETREAT_BATTLE_BEFORE_TRANSFER'
    report['checks'].append('Local helper refuses an unfinished battle before creating an export directory')
    report['passed'] = True
except Exception as error:
    report['error_type'] = type(error).__name__
    frame = traceback.extract_tb(error.__traceback__)[-1]
    report['failure_location'] = f'{Path(frame.filename).name}:{frame.lineno}'
    report['error'] = str(error) if str(error).isupper() else 'DISPOSABLE_TEST_ASSERTION_FAILED'
    if (base / 'postgres.log').exists(): report['fixture_postgres_diagnostic'] = (base / 'postgres.log').read_text()[-1600:]
finally:
    if started: command([PG / 'pg_ctl', '-D', base / 'pg', '-m', 'fast', '-w', 'stop'])
    shutil.rmtree(base)
    (ROOT / 'plan/evidence/task-058-postgres.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if report['passed'] else 1)
