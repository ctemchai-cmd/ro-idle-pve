#!/bin/bash
# TASK-041 boss calibration rounds on fixed journey snapshots (level pace does not depend on boss stats, so the
# snapshots from scripts/game/journey.ts --schedule can be reused). Each round: calibrate --write → stages.py →
# M0 checks → content:generate, then prints the win-band summary (scripts/game/calibration_summary.py).
# Make snapshots first (≈10 min, both in parallel):
#   node --import tsx scripts/game/journey.ts --main mage  --trio swordsman,acolyte,archer --days 25 --schedule .local/balance/snap-mage.json.gz  --out .local/balance/pace-mage.json
#   node --import tsx scripts/game/journey.ts --main thief --trio merchant,acolyte,archer  --days 25 --schedule .local/balance/snap-thief.json.gz --out .local/balance/pace-thief.json
# Usage: ROUNDS=6 bash scripts/game/calibrate-rounds.sh   (≈2.5 min per round; SAMPLES/DAMPING optional)
set -e
cd "$(dirname "$0")/../.."
OUT=.local/balance; SNAPS="$OUT/snap-mage.json.gz,$OUT/snap-thief.json.gz"
for round in $(seq 1 ${ROUNDS:-6}); do
  node --import tsx scripts/game/balance.ts calibrate --samples ${SAMPLES:-10} --damping ${DAMPING:-0.7} --snapshots "$SNAPS" --write > "$OUT/cal-r$round.txt" 2>/dev/null
  python3 plan/generators/stages.py --write > /dev/null
  bash scripts/m0_checks.sh > "$OUT/m0-r$round.log" 2>&1 || { echo "round $round: M0 checks failed"; tail -5 "$OUT/m0-r$round.log"; exit 1; }
  npm run -s content:generate > /dev/null 2>&1
  echo "round $round: $(python3 scripts/game/calibration_summary.py "$OUT/cal-r$round.txt")"
done
node --import tsx scripts/game/balance.ts calibrate --samples ${SAMPLES:-10} --damping ${DAMPING:-0.7} --snapshots "$SNAPS" > "$OUT/cal-final.txt" 2>/dev/null
echo "after all rounds (measured, not written): $(python3 scripts/game/calibration_summary.py "$OUT/cal-final.txt")"
