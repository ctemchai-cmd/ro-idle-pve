#!/bin/bash
# One TASK-041 journey-calibration round: two level-gated schedule journeys (economy-derived team snapshots)
# → calibrate Story boss stats against the win bands → regenerate stages/content. Outputs go to $OUT
# (default .local/balance, git-ignored). Tunables: DAYS (10), SAMPLES (10), DAMPING (0.7).
# A 25-day journey is a long CPU job (hours); 10 days covers the Story pace check.
set -e
cd "$(dirname "$0")/../.."
OUT=${OUT:-.local/balance}; mkdir -p "$OUT"
node --import tsx scripts/game/journey.ts --main mage --trio swordsman,acolyte,archer --days ${DAYS:-10} --schedule "$OUT/snap-mage.json.gz" --out "$OUT/sched-mage.json" > /dev/null &
node --import tsx scripts/game/journey.ts --main thief --trio merchant,acolyte,archer --days ${DAYS:-10} --schedule "$OUT/snap-thief.json.gz" --out "$OUT/sched-thief.json" > /dev/null &
wait
node --import tsx scripts/game/balance.ts calibrate --samples ${SAMPLES:-10} --damping ${DAMPING:-0.7} --snapshots "$OUT/snap-mage.json.gz,$OUT/snap-thief.json.gz" --write > "$OUT/cal-round.txt"
python3 plan/generators/stages.py --write > /dev/null
bash scripts/m0_checks.sh > "$OUT/m0.log" 2>&1 || { tail -5 "$OUT/m0.log"; exit 1; }
npm run content:generate > /dev/null 2>&1
echo "perfect=$(grep -c 'win 1\b' "$OUT/cal-round.txt")"
tail -1 "$OUT/cal-round.txt"
