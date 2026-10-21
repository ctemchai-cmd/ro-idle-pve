#!/bin/bash
# Re-run every M0 data check (writing reports), rebuild the release manifest and the readiness gate.
# Prints one ok/FAIL line per check; a FAIL shows the tail of that check's output. Run after any plan/data change,
# then `npm run content:generate` (and `npm run assets:build` when presentation/asset data changed).
cd "$(dirname "$0")/.."
status=0
r() { out=$("$@" 2>&1); if echo "$out" | grep -q '"passed": false\|Traceback\|"passed":false'; then echo "FAIL $*"; echo "$out" | tail -20; status=1; else echo "ok   $*"; fi; }
r python3 plan/checks/progression.py --write-report
r python3 plan/checks/combat.py --write-report
r python3 plan/checks/classes.py
r python3 plan/checks/equipment.py
r python3 plan/checks/economy.py
r python3 plan/checks/levels.py
r python3 plan/checks/ui.py --write-report
r python3 plan/checks/architecture.py --write-report
r python3 plan/checks/composition.py --write-report
if node plan/checks/build_manifest.mjs >/dev/null 2>&1; then echo "ok   manifest"; else echo "FAIL manifest"; status=1; fi
r python3 plan/checks/readiness.py
exit $status
