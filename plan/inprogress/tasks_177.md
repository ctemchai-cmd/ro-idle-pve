# TASK-177 — Hunter slot3 phone PWA save failure

Milestone: M4 · D201

## งานที่ต้องรอก่อนหน้า
TASK-176 done. Actual device failure identifier is still required.

## ขอบเขต
User reports Hunter thirdsave repeatedly shows generic reconnect error on phone PWA; the same save works on desktop. Do not assume server corruption, reset data or discard uncertain pending requests. No owner Auth/cloud reads or writes have been performed; local environment has no Supabase server key. Public API healthy/current. Add bounded public failure code to existing HUD/settings/initial-load error so the owner can report it without phone DevTools; this is diagnosis, not a completed recovery.

## ขั้นตอน
1. Read actual phone error code after UI reload; distinguish local pending/old client/writer/session from server data.
2. Reproduce the identified condition in disposable slot-isolated fixtures, fix the confirmed cause, retain exact request IDs/receipt reconciliation and server checkpoint guards.
3. Verify mobile error readability/retry, safe recovery/other slots/real server protocol as relevant; publish and confirm owner can reopen Hunter.

## เกณฑ์ตรวจรับ
- [ ] AC-01: Actual phone failure identified with a concrete code and reproduced; diagnostic shows only bounded public identifier, no secrets/save payload.
- [ ] AC-02: Confirmed cause fixed without resetting character/progression or blindly clearing pending requests/local storage.
- [ ] AC-03: Focused/native/build/public checks pass; owner's Hunter recovery is verified or explicitly still pending.

## สถานะ
Desktop same save works, phone PWA fails. Diagnostic UI implemented locally; actual cause/recovery remain pending the phone code. TASK-178 speed change is independent.
