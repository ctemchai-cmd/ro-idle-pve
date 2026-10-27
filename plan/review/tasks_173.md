# TASK-173 — Daily batches over32 boxes and stuck-fight recovery

Milestone: M4 · D197

## งานที่ต้องรอก่อนหน้า
TASK-036, TASK-040, TASK-172 (done).

## ขอบเขต
User confirms daily fight gives40boxes and twice cannot confirm. Current queue32 stores one pending claim per phase: terminal settlement rejects PENDING_REWARDS_FULL. Aggregate every new phase in a run into one fixed claim with all daily phase source keys and exact summed resources. Keep per-phase reward ledger/HP and once-per-run quota from172; display true box count everywhere. Preserve old pending individual boxes. Provide actionable finish retry/errors. Recover recognized compatible2a62old daily checkpoint during backed-up migration by exact data/schema/core-source fingerprints + server identity/battle proof, shared deterministic full replay, elapsed >= terminal/4; no client-reported count or owner access. No replay for unknown/incompatible histories.

## ขั้นตอน
1. Freeze source and exact previous runtime compat contract.
2. Shared daily settlement batch/helper, UI counts/retry; narrow backed-up compatible daily recovery.
3.40/100box tests, overflow, actual API original UUID/backups, native UI, full/build/public; publish.

## เกณฑ์ตรวจรับ
- [x] AC-01:40/100cleared phases fit one claim with exact per-phase totals and phase keys; no reward/HP/attempt loss or double charge on partial/legacy/batch/replay.
- [x] AC-02: Narrow compatible saved daily replay in backup migration retains actual old outcome/rewards once, rejects stale/mismatched/unknown evidence; no owner login/writes/SQL/env.
- [ ] AC-03: Native320390 true40box count/retry, focused/full/build/M0 and hosted public pass; no combat power or new assets.
