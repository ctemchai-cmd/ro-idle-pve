# TASK-022 — ทำ cloud save, checkpoint และ reconnect ที่ไม่จ่ายของซ้ำ

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-021 — ตั้ง Supabase Auth ฐานข้อมูลเซฟและสิทธิ์เจ้าของ

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- save repository/atomic revision protocol และ local checkpoint
- สถานะเซฟ/หนึ่งผู้เขียน/reconnect/conflict recovery

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ทำ autosave ตามสเปก พร้อม expected_revision/request_id และ local backup ขาดเน็ตพักความก้าวหน้า/การใช้ทรัพยากร เมื่อกลับมาตรวจ cloud ก่อนต่อ ไม่ merge inventory/currency จากสอง snapshot

## ขั้นตอนทำงาน

1. ทำ load/commit/retry และ server-owned fields ตาม contracts
2. ทำ checkpoint/save status/แท็บผู้เขียนและ conflict flow
3. ทดสอบ response หาย สองแท็บ refresh/crash และ session หมด

## เกณฑ์ตรวจรับ

- [x] AC-01: save/load คงตัวหลัก roster ทั้งหก ทีม inventory/slot/เงิน/progress/version ครบ
- [x] AC-02: commit จาก revision เก่าถูกปฏิเสธอย่างกู้ได้ และ retry request เดิมไม่ทำธุรกรรมซ้ำ
- [x] AC-03: เน็ตขาดแล้วไม่สร้างผลถาวรเพิ่ม แสดงสถานะจริง เก็บ checkpoint และ reconcile ก่อนเล่นต่อ
- [x] AC-04: จุดเชื่อม online earnings กับ AFK cursor ไม่ทับ/จ่ายช่วงเดียวกันซ้ำ แม้ response หายหรือสลับอุปกรณ์

- [x] AC-05: ทุก persistent mutation ผ่าน command/repository boundary ที่เลือก; request ID เดิมแต่ payload ต่างถูกปฏิเสธ, response หายแล้วคืน receipt เดิม และ autosave/checkpoint ไม่เขียนทับ wallet/claim cursor ที่ commit ใหม่แล้ว

## วิธีตรวจและหลักฐาน

fault injection ที่ network/response พร้อมทดสอบหลายแท็บ ตรวจ state/revision/ledger ฝั่ง cloud และการกู้ checkpoint

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | Signed complete owner checkpoint preserves main+six NPCs/team/42 items/slots/wallet/progress/version; schema and state/hash validation. | [review](../evidence/task-022-review.json) · [task-022-supabase-local.json](../evidence/task-022-supabase-local.json), [task-022-check.txt](../evidence/task-022-check.txt) | ผ่าน |
| AC-02 | Actual HTTP concurrent CAS, stale409, exact replay and changed-hash409; rejected receipt immutable; failed SQL history insert rolls back. | [review](../evidence/task-022-review.json) · [task-022-supabase-local.json](../evidence/task-022-supabase-local.json) | ผ่าน |
| AC-03 | Actual Chrome response abort after committed200, refresh receipt lookup, Web Locks two tabs and lock transfer, offline events; stale checkpoint refused by controller. | [review](../evidence/task-022-review.json) · [task-022-save-live-browser.json](../evidence/task-022-save-live-browser.json), [task-022-check.txt](../evidence/task-022-check.txt) | ผ่าน |
| AC-04 | Actual frozen12h reservation+144gear/288draws/carry/cursor; retry replays; payout once; next interval only unpaid time. Pure split/whole and rate-change tests. | [review](../evidence/task-022-review.json) · [task-022-supabase-local.json](../evidence/task-022-supabase-local.json), [task-022-check.txt](../evidence/task-022-check.txt) | ผ่าน |
| AC-05 | Server command-only boundary/RLS; owner/HMAC/hash checks; no raw state writes. DB-time battle checkpoint/lease/retreat atomic and no visual kill income. | [review](../evidence/task-022-review.json) · [task-022-supabase-local.json](../evidence/task-022-supabase-local.json), [task-022-save-live-browser.json](../evidence/task-022-save-live-browser.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime

- 19 ตุลาคม 2026: เริ่มหลัง TASK-021 ผ่านครบ4AC ใช้ verified-owner initial account.create, atomic initial receipt/history, pure initial state และ real local Auth/PostgREST/SMTP test harness เป็นฐาน; ยังไม่มีACของTASK-022ผ่าน

- ฐานที่เพิ่ม: migration003 อ่าน save/history/active battle จาก snapshot เดียวกับ DB UTC; API initialization ใช้เวลานี้, DTO owner/revision checks; pure canonicalCommand แยก UUID ออกจาก payload; pure calculateBattleCredit จำกัดเวลาจริง/5000ms และปฏิเสธ clock regression/lease expiry
- หลักฐานระหว่างทำแยกprefix TASK-022 เพื่อไม่เขียนทับ review TASK-021 การแก้ request hash อยู่ก่อนเผยแพร่/ไม่มีบัญชีผู้ใช้จริง ไม่เป็นการเปลี่ยนความเข้ากันได้ของ production โดยเงียบ
- ยังต้องทำ: generic atomic CAS/immutable rejected receipts, signed local backup, single-writer/client reconnect state machine, server checkpoint commands และเชื่อม unreserved AFK cursor; AC-01–05 ยังไม่ผ่านจนตรวจครบ

- ฐานผ่าน171tests/typecheck/boundaries/build และ real local Auth/HTTP/SQL/SMTP regressionแล้ว: [foundation report](../evidence/task-022-foundation.json) ไม่ใช่ผล reviewครบงาน AC-01–05ยังไม่ตรวจครบ

- 20 ตุลาคม2026: ผ่านครบ5AC หลัง195TStests/typecheck/boundaries/build และ real local Auth/PostgREST/SQL/SMTP/Chrome response-loss/offline/two-tab tests ตาม [review](../evidence/task-022-review.json) และ [protocol](../design/23-save-runtime-protocol.md) ไม่มีhosted project/deploy โหมดครบวงจรและmigrationยังตามงานเจ้าของ
