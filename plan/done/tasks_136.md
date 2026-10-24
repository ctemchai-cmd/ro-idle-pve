# TASK-136 — เพดานสกิลจากจุดปลดและคืนทุนส่วนเกิน

Milestone: M4 · D165 · design53

## งานที่ต้องรอก่อนหน้า

TASK-124, TASK-125, TASK-133, TASK-135 (done)

## ขอบเขตและผลส่งมอบ

Class2ปลด20/30/40เต็ม60/70/80; shared rank helper, UIเพดานถัดไป, migrationส่วนเกิน/immutableราคาเก่า. คงClass1/Hi/ราคา/program/คิว/บิลด์ที่ไม่เกิน. ไม่ทำownerwrite/SQL/env/restart6173.

## ขั้นตอน

1. บันทึกกติกาและfreezeต้นทุนก่อนปรับ
2. shared cap/quote/validation/UI และclone migration+ledgerลดส่วนเกิน
3. unit boundaryทุกrank/allskills,Aw/reset/unknownprice/overflow/idempotence/ราคาเก่า
4. actuallocalAuth-SQL-backup-migration-replay/mobile และfulltest/build
5. review,push,Vercel/hostedตรวจตรงhashก่อนdone

## เกณฑ์ตรวจรับ

- [x] AC-01: ทุกClass2rankปลดตามunlock+40,30→70/40→80;ก่อนปลด/เพดานquoteปฏิเสธก่อนจ่าย;Class1/Hi/ราคา/programไม่เปลี่ยน
- [x] AC-02: Lv40skill7→1คืน2100gold420manualส่วนเกินครั้งเดียว,ต่ำกว่าcapไม่เปลี่ยน,loadout/NPC/ทุนที่เหลือ/Aw-stateคงเดิม;resetภายหลังไม่คืนซ้ำ
- [x] AC-03: ใช้actualpaid/snapshotไม่ใช่ราคาใหม่;unknownprice/overflowไม่เขียนpartial;ทุก10slotแยก/backup-CAS-replayผ่านจริง
- [x] AC-04: UI320/390แสดงcap/full/nextตรงsharedrules,fulltests/buildและfilteredbuildผ่าน,เว็บจริงhashตรง ไม่มีownerwrite

## วิธีตรวจและหลักฐาน

T136-AC01–04: tests/game/skill-rank-caps.test.ts, actual local stack, public hosted harness; plan/evidence/task-136-review.json. ครบตามหลักฐานด้านล่าง.

## Blocker / คำถาม

ไม่มี

## Review

Local660tests/10focused/actualAuthAPI-SQL-mobile4กลุ่ม/10slots backup-replay/root+filteredผ่าน;mobile320ภาพตรวจแล้ว. Source35f866bb8ขึ้นVercelSUCCESS/hosted4groups24bundleSHA/healthSIN1/public320390/noownerwritesผ่านแล้ว. ทุกACผ่าน done;ดูplan/evidence/task-136-review.json.
