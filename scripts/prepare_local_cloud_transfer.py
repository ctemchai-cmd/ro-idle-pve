#!/usr/bin/env python3
"""Read-only local save export; prepares private operator SQL, never calls cloud APIs."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
from urllib.parse import urlparse
import uuid

ROOT = Path(__file__).resolve().parents[1]

def private_write(path: Path, value: str):
    with open(path, 'x', encoding='utf-8', opener=lambda p, f: os.open(p, f, 0o600)) as stream:
        stream.write(value)

def prepare(source_base: Path, output_base: Path, project_url: str, target_user: str, replacement: dict | None = None):
    parsed = urlparse(project_url)
    if parsed.scheme != 'https' or not re.fullmatch(r'[a-z0-9]{12,40}\.supabase\.co', parsed.netloc) or parsed.path not in ['', '/'] or parsed.query or parsed.fragment:
        raise RuntimeError('INVALID_TARGET_PROJECT_URL')
    target_user = str(uuid.UUID(target_user))
    cfg = json.loads((source_base / 'private.json').read_text())
    source_user = str(uuid.UUID(cfg['user_id']))
    signing_key = cfg['signing_key']
    if not isinstance(signing_key, str) or not re.fullmatch(r'[A-Za-z0-9_-]{32,}', signing_key):
        raise RuntimeError('INVALID_LOCAL_SIGNING_KEY')
    pg = Path(os.environ.get('RO_PG_BIN') or subprocess.check_output(['pg_config', '--bindir'], text=True).strip())
    socket = source_base / 'socket'
    port = str(int(cfg['ports']['pg']))
    # Deliberately do not copy database/password/Auth service keys from the source config.
    env = {**os.environ, 'PGOPTIONS': '-c default_transaction_read_only=on', 'SAVE_SIGNING_KEY': signing_key}
    psql = [str(pg / 'psql'), '-X', '-qAt', '-h', str(socket), '-p', port, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
    def context():
        query = f"select public.game_load_context('{source_user}', 'local', 'local')"
        result = subprocess.run([*psql, '-c', query], env=env, capture_output=True, text=True)
        if result.returncode: raise RuntimeError('LOCAL_CONTEXT_READ_FAILED')
        try: data = json.loads(result.stdout)
        except (ValueError, TypeError): raise RuntimeError('LOCAL_CONTEXT_INVALID') from None
        if not data.get('save') or not data.get('history'): raise RuntimeError('LOCAL_SAVE_NOT_FOUND')
        if data['save']['state'].get('active_battle') or data.get('battle'): raise RuntimeError('FINISH_OR_RETREAT_BATTLE_BEFORE_TRANSFER')
        return data
    context()  # Refuse an active fight before creating any export.
    output_base.mkdir(parents=True, exist_ok=True, mode=0o700)
    out = output_base / f'transfer-{time.time_ns()}'
    out.mkdir(mode=0o700)
    backup = out / 'local-game-backup.dump'
    backup.touch(mode=0o600, exist_ok=False)
    dump = subprocess.run([str(pg / 'pg_dump'), '-h', str(socket), '-p', port, '-d', 'postgres', '--no-owner', '--no-privileges', '--format=custom', '--table=public.game_*', '-f', str(backup)], env=env, capture_output=True, text=True)
    if dump.returncode: raise RuntimeError('LOCAL_BACKUP_FAILED')
    data = context()  # One statement/MVCC context after the backup; includes its signed tip.
    context_path = out / 'context.json'
    private_write(context_path, json.dumps(data, separators=(',', ':')))
    sql = out / ('replace-initial-save.sql' if replacement else 'import.sql')
    transfer_id = str(uuid.uuid4())
    # Validate the source with the content/rules of its running frozen snapshot.
    # A newer cloud build can then use its existing backed-up save.migrate flow.
    runtime = source_base / 'snapshot'
    tool = ROOT / 'scripts/game/prepare-cloud-transfer.ts'
    if (runtime / 'src/generated/runtime-manifest.json').is_file():
        manifest = json.loads((runtime / 'src/generated/runtime-manifest.json').read_text())
        if manifest['content_hash'] != data['save']['content_hash']:
            raise RuntimeError('SOURCE_RUNTIME_CONTENT_MISMATCH')
        tools = out / '.source-tools'
        for directory in [tools, tools / 'scripts', tools / 'scripts/game']:
            directory.mkdir(mode=0o700)
        private_write(tools / 'package.json', '{"type":"module"}\n')
        (tools / 'src').symlink_to((runtime / 'src').resolve(), target_is_directory=True)
        tool = tools / 'scripts/game/prepare-cloud-transfer.ts'
        shutil.copyfile(ROOT / 'scripts/game/prepare-cloud-transfer.ts', tool)
        tool.chmod(0o600)
    arguments = ['node', '--import', 'tsx', str(tool), str(context_path), str(sql), project_url, target_user, transfer_id]
    if replacement:
        arguments.extend([str(replacement['revision']), replacement['state_hash'], replacement['content_hash']])
    result = subprocess.run(arguments, cwd=ROOT, env=env, capture_output=True, text=True)
    if result.returncode:
        code = result.stderr.strip()
        raise RuntimeError(code if re.fullmatch(r'[A-Z_]+', code) else 'TRANSFER_PREPARATION_FAILED')
    report = json.loads(result.stdout)
    # An operator pastes this ONE value into Vercel; it never enters SQL, source or logs.
    private_write(out / 'vercel-signing.env', f'SAVE_SIGNING_KEY={signing_key}\n')
    report.update(output_directory=str(out), backup_created=backup.stat().st_size > 0, source_read_only=True, cloud_written=False, signing_key_logged=False, secrets_copied_to_sql=False)
    private_write(out / 'summary.json', json.dumps(report, indent=2) + '\n')
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project-url', required=True)
    parser.add_argument('--target-user-id', required=True)
    parser.add_argument('--replace-initial-revision', type=int)
    parser.add_argument('--replace-initial-state-hash')
    parser.add_argument('--replace-initial-content-hash')
    options = parser.parse_args()
    try:
        guard = [options.replace_initial_revision, options.replace_initial_state_hash, options.replace_initial_content_hash]
        if any(value is not None for value in guard) and not all(value is not None for value in guard):
            raise RuntimeError('INCOMPLETE_REPLACEMENT_GUARD')
        replacement = dict(revision=guard[0], state_hash=guard[1], content_hash=guard[2]) if guard[0] is not None else None
        report = prepare(ROOT / '.local/play', ROOT / '.local/cloud-transfer', options.project_url, options.target_user_id, replacement)
        print(json.dumps(report))
    except Exception as error:
        code = str(error)
        print(json.dumps({'prepared': False, 'code': code if re.fullmatch(r'[A-Z_]+', code) else 'TRANSFER_PREPARATION_FAILED', 'values_logged': False}))
        raise SystemExit(1)
