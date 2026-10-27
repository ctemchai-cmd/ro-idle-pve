# TASK-172 — Daily quota charged on reward collection

Milestone: M4 · D196 · Dependencies: TASK-036, TASK-040, TASK-171 (done)

## งานที่ต้องรอก่อนหน้า
TASK-036, TASK-040, TASK-171 (done).

## ขอบเขต
Move daily quota payment from entry to first successful reward collection per run. Explicit typed pending attempt metadata; same atomic command/receipt. Empty/abandoned/disconnected runs cost zero. Unclaimed boxes survive reload and block a new unpaid run of that boss/day until collected. Preserve phase/HP/chest keys and legacy prepaid claims. Backed-up migration refunds old active prepaid reservations; authorized slot1 Champion100 receives today's 28Oct quota reset once, preserving world/rewards/other saves.

## ขั้นตอน
1. Freeze baseline, define schema/migration/refund boundary.
2. Shared claim preflight and daily commands; pending-reward UI.
3. Validate lost response, duplicate/partial/bulk claims, rollover, migration/target scope; native/mobile, build and hosted release.

## เกณฑ์ตรวจรับ
- [x] AC-01: Quota stays unchanged at start/finish/retreat; increments once on first actual collection. Atomic failure/retry and multi-box/partial collection remain correct.
- [x] AC-02: Old paid claims never recharged; old active reservation refunded once; authorized slot1 Champion100 28Oct reset once via backup migration only, other worlds/saves untouched.
- [ ] AC-03: Native320/390 pending collection and states, focused/full TS/M0/build/public pass; no new SQL/env/owner credentials/media/balance changes.
