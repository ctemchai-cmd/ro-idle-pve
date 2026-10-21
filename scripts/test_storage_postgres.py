#!/usr/bin/env python3
"""Test actual PostgreSQL grants/RLS in a new private Unix-socket cluster.

Auth schema/claims are fixtures. This is not a Supabase/GoTrue integration test.
Never connects to PGHOST, an existing database, or a hosted project.
"""
import getpass
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / "supabase/tests/bootstrap_local_postgres.sql", *sorted((ROOT / "supabase/migrations").glob('*.sql')), ROOT / "supabase/tests/storage_ownership.sql"]
PG_BIN = Path(os.environ.get("RO_PG_BIN") or subprocess.check_output(["pg_config", "--bindir"], text=True).strip())

def run(args):
    result = subprocess.run([str(arg) for arg in args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result.stdout

report = {"task_id": "TASK-021", "scope": "Fresh plain PostgreSQL migrations/grants/RLS with Auth UID fixture. No Supabase Auth/JWT/PostgREST/email verification.", "supabase_auth_tested": False, "input_sha256": {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [*FILES, Path(__file__)]}, "passed": False}
try:
    report["postgres_version"] = run([PG_BIN / "postgres", "--version"]).strip()
    with tempfile.TemporaryDirectory(prefix="ro-idle-sql21-", dir="/private/tmp") as temporary:
        base = Path(temporary); data = base / "data"; socket = base / "socket"; socket.mkdir()
        run([PG_BIN / "initdb", "-D", data, "--encoding=UTF8", "--no-locale", "--auth-local=trust", "--auth-host=reject"])
        started = False
        try:
            run([PG_BIN / "pg_ctl", "-D", data, "-l", base / "postgres.log", "-o", f"-h '' -k {socket} -p 55431", "-w", "start"]); started = True
            outputs = []
            for file in FILES:
                outputs.append(run([PG_BIN / "psql", "-X", "-h", socket, "-p", "55431", "-U", getpass.getuser(), "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-f", file]))
            report.update(passed=True, assertions="two UID reads own four tables/RPC, other owner hidden, raw owner insert/update/delete denied, anonymous table/RPC denied, privileged RPC denied, service storage update allowed, receipt update/delete/truncate denied, environment relabel denied to authenticated/service, matching environment passes and wrong environment rejects", final_output=outputs[-1].strip())
        finally:
            if started:
                run([PG_BIN / "pg_ctl", "-D", data, "-m", "fast", "-w", "stop"])
except Exception as error:
    report["error"] = str(error)
(ROOT / "plan/evidence/task-021-postgres.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(0 if report["passed"] else 1)
