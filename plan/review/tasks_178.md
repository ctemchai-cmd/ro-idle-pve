# TASK-178 — Battle speed1/2/3

Milestone: M4 · D202

## งานที่ต้องรอก่อนหน้า
TASK-176 (done).

## ขอบเขต
Replace visible4× with3× in actual savedbattle, demo and skill-preview. Device preference4 becomes3 without touching save storage/Auth. Keep1×/2× and all skill/cast/CC/RNG/Timeline semantics. Server terminal replay and historical4× protocol/receipts stay compatible; current UI sends no speed commands. No core/schema/data/media/SQL changes.

## ขั้นตอน
1. Share typed1/2/3 options/cycle, normalize old4 preference to3 even if preference writes fail.
2. Check subscriptions/reload/private storage, actual mobile controls, original four-slot and interrupt event/RNG identity at1/2/3 plus legacy4.
3. Strict/root-filtered/M0/public verification and release.

## เกณฑ์ตรวจรับ
- [x] AC-01: Savedbattle/demo/skill-preview offer only1×/2×/3×; old4 preference maps to3, device preference only.
- [x] AC-02: Identical shared-engine state/events including interrupted casts, empty slots/RNG/Timeline at1/2/3; old4 fixtures remain valid.
- [ ] AC-03: Native mobile/root-filtered/M0/public pass; five gameplay fingerprints unchanged and no owner save access.
