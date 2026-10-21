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
RUN_TAG = os.environ.get('RO_TRANSFER_EVIDENCE_PREFIX', 'task-058')
if not re.fullmatch(r'[a-z0-9-]+', RUN_TAG): raise RuntimeError('INVALID_EVIDENCE_PREFIX')
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
    report['step'] = 'recover an accidentally created cloud account'
    query(f"delete from public.game_saves where account_id='{TARGET}';")
    apply(base / 'initial-target.sql')
    def target_fingerprint():
        parts = ','.join(f"'{table}',(select coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text),'[]'::jsonb) from public.{table} r where account_id='{TARGET}')" for table in ['game_saves','game_save_history','game_command_receipts','game_battle_checkpoints','game_save_backups'])
        return query(f"select md5(jsonb_build_object({parts})::text)")
    initial_fingerprint = target_fingerprint()
    initial_hash = query(f"select state_hash from public.game_saves where account_id='{TARGET}'")
    apply(base / 'replacement-wrong-hash.sql', 'TARGET_SAVE_CHANGED')
    query(f"update public.game_saves set revision=2 where account_id='{TARGET}';")
    apply(base / 'replacement.sql', 'TARGET_SAVE_CHANGED')
    query(f"update public.game_saves set revision=1 where account_id='{TARGET}';")
    query(f"update public.game_save_history set signature='wrong-signing-key' where account_id='{TARGET}';")
    apply(base / 'replacement.sql', 'TARGET_SIGNING_KEY_MISMATCH')
    query(f"delete from public.game_saves where account_id='{TARGET}';")
    apply(base / 'initial-target.sql')
    query(f"insert into public.game_battle_checkpoints values('{TARGET}','77777777-7777-4777-8777-777777777777','{{}}','{'a'*64}',clock_timestamp(),clock_timestamp()+interval '15 seconds');")
    apply(base / 'replacement.sql', 'TARGET_SAVE_NOT_IDLE')
    query(f"delete from public.game_battle_checkpoints where account_id='{TARGET}';")
    # Recreated fixture timestamps differ only in the creation receipt's default created_at.
    initial_fingerprint = target_fingerprint()
    query("create function public.fixture_fail_replacement() returns trigger language plpgsql as $$ begin raise exception 'FIXTURE_REPLACEMENT_FAILURE'; end $$; create trigger fixture_fail_replacement before insert on public.game_save_history for each row execute function public.fixture_fail_replacement();")
    apply(base / 'replacement.sql', 'FIXTURE_REPLACEMENT_FAILURE')
    assert target_fingerprint() == initial_fingerprint
    assert query("select to_regclass('ro_operator_archive.save_replacements') is null") == 't'
    query('drop trigger fixture_fail_replacement on public.game_save_history; drop function public.fixture_fail_replacement();')
    report['checks'].append('Replacement requires the exact idle revision-1 hash/content and matching signing key; a failure after destination delete restores every original row and leaves no partial archive')
    apply(base / 'replacement.sql')
    assert query(f"select state_hash from public.game_saves where account_id='{TARGET}'") == before.split(':')[1]
    assert query(f"select payload#>>'{{save,state_hash}}' from ro_operator_archive.save_replacements where account_id='{TARGET}'") == initial_hash
    assert query(f"select jsonb_array_length(payload->'history')=1 and jsonb_array_length(payload->'receipts')=1 and jsonb_array_length(payload->'battles')=0 and jsonb_array_length(payload->'backups')=0 from ro_operator_archive.save_replacements where account_id='{TARGET}'") == 't'
    assert query(f"select count(*) from auth.users where id='{TARGET}'") == '1'
    assert query("select not has_schema_privilege('authenticated','ro_operator_archive','USAGE') and not has_table_privilege('service_role','ro_operator_archive.save_replacements','SELECT')") == 't'
    report['replacement_api'] = json.loads(command(['node', '--import', 'tsx', 'scripts/game/test-cloud-transfer.ts', 'api', socket, '55439'], cwd=ROOT, env=env))
    replacement_progress = target_fingerprint()
    apply(base / 'replacement.sql')
    assert target_fingerprint() == replacement_progress
    assert query('select count(*) from ro_operator_archive.save_replacements') == '1'
    report['checks'].append('Replacement archives all original game rows privately, keeps the Auth user, loads the signed imported save through the shared API and replays safely after further progression')
    report['step'] = 'validate a legacy source using its frozen runtime'
    query("update public.game_deployment set environment='local',project_ref='local';")
    snapshot = base / 'snapshot'
    shutil.copytree(ROOT / 'src', snapshot / 'src')
    (snapshot / 'node_modules').symlink_to(ROOT / 'node_modules', target_is_directory=True)
    (snapshot / 'package.json').write_text('{"type":"module"}')
    for name in ['content.json','runtime-manifest.json']:
        file = snapshot / 'src/generated' / name
        doc = json.loads(file.read_text()); manifest_row = doc['manifest'] if name == 'content.json' else doc
        manifest_row['content_hash'] = 'e' * 64
        file.write_text(json.dumps(doc))
    apply(base / 'legacy-source.sql')
    legacy_before = query(f"select content_hash || ':' || state_hash from public.game_saves where account_id='{SOURCE}'")
    legacy_prepared = helper.prepare(base, base / 'output', f'https://{PROJECT}.supabase.co', TARGET)
    assert legacy_prepared['content_hash'] == 'e' * 64
    assert query(f"select content_hash || ':' || state_hash from public.game_saves where account_id='{SOURCE}'") == legacy_before
    manifest_path = snapshot / 'src/generated/runtime-manifest.json'
    bad_manifest = json.loads(manifest_path.read_text()); bad_manifest['content_hash'] = 'f' * 64
    manifest_path.write_text(json.dumps(bad_manifest))
    try:
        helper.prepare(base, base / 'output', f'https://{PROJECT}.supabase.co', TARGET)
        raise RuntimeError('MISMATCHED_SOURCE_RUNTIME_ACCEPTED')
    except RuntimeError as error:
        assert str(error) == 'SOURCE_RUNTIME_CONTENT_MISMATCH'
    report['checks'].append('Read-only export uses the signed source version and its matching frozen runtime even when cloud code is newer; a mismatched snapshot fails closed')
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
    (ROOT / f'plan/evidence/{RUN_TAG}-postgres.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if report['passed'] else 1)
