# TASK-060 — เซฟไฟต์เฉพาะเริ่มและจบ

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง D-084, design/23-save-runtime-protocol.md

## งานที่ต้องรอก่อนหน้า

- TASK-020/022/025/035/036 (done): deterministic shared engine, atomic receipts, Story/Tower/daily settlement

## เป้าหมายและผลส่งมอบ

ระหว่างสู้และเปลี่ยน1×/2×/4×ไม่มีการเขียนเซฟ บันทึกเริ่มไฟต์และจบ/ถอยเท่านั้น เซิร์ฟเวอร์คำนวณผลซ้ำจาก snapshot เริ่มก่อนจ่ายรางวัล

## ขอบเขตและรายละเอียด

- `battle.finish` รับเพียง battle_id และใช้ DB time/ticket guard/seed+buildที่serverเก็บ ไม่รับผลดาเมจ/เงินจากclient
- ใช้สูตรและ engine เดิม; ไม่ต้องรอheartbeat lease15sสำหรับfinish แต่ยังตรวจticket180sและเวลาขั้นต่ำตามความเร็วสูงสุด4×
- manual retreat ส่งเวลาจำลองที่เล่นมาเพื่อคำนวณpartialdailyผลใหม่; refresh/hidden/offlineไม่มีการเดินบอสย้อนหลังและไม่คืนattempt
- resource commands และreceipt retry/CAS/backup migrationเดิม; ไม่เพิ่มSQLmigrationหรือรีสตาร์ต6173

## ขั้นตอนทำงาน

1. เพิ่ม closed command/schema/contracts และ shared reducer
2. ลบ periodic client writer และ capการทำนาย5s; ส่งfinishครั้งเดียวเมื่อเห็นterminal
3. ตรวจ Story/Tower/daily parity, rejection/idempotency/response loss และ actual browser+Postgres จำนวนwrite
4. Build/version migration proof, บันทึกเอกสารและdeploy

## เกณฑ์ตรวจรับ

- [x] AC-01: ไฟต์ยาว>15sและเปลี่ยนความเร็วระหว่างไฟต์ → revision/checkpointยังอยู่จุดเริ่มและไม่มีPOSTกลางไฟต์; จบส่งfinishครั้งเดียว/ผลตรงsharedreplay
- [x] AC-02: Story/Tower/daily win/loss/timeoutและmanualretreat → rewards/HP/chests/day/attemptsถูกต้อง; tooearly/expired/foreign/forged fieldsไม่จ่าย; receipt replay/response lossไม่จ่ายซ้ำ
- [x] AC-03: offline/refreshไม่จำลองบอสย้อนหลัง; pure engineยังแยกจากnetwork; tests/build/schema/migrationผ่านและdeployตรวจbundleจริงโดยไม่แตะเซฟส่วนตัว

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | isolated Chrome/SQL request+revision count and continuous game_ms | [local review](../evidence/task-060-review.json) ผ่าน45tests/API/Chrome/SQL/buildและ [hosted smoke](../evidence/task-060-061-hosted.json) | ผ่าน self-review + hosted smoke |
| AC-02 | shared API/reducer fixtures + real SQL/browser finish/retry/claim | [local review](../evidence/task-060-review.json) ผ่าน45tests/API/Chrome/SQL/buildและ [hosted smoke](../evidence/task-060-061-hosted.json) | ผ่าน self-review + hosted smoke |
| AC-03 | save lifecycle/content migration/full tests/build/hosted smoke | [local review](../evidence/task-060-review.json) ผ่าน45tests/API/Chrome/SQL/buildและ [hosted smoke](../evidence/task-060-061-hosted.json) | ผ่าน self-review + hosted smoke |

ผู้ตรวจ: Codex self-review · วันที่: 21 ต.ค.2026 · รอบ review: 2

## Blocker / คำถาม

ไม่มีสำหรับimplementation; cloudเซฟเดิมจะผ่านbacked-upcontentmigrationตามflowเดิม ไม่ข้ามversionguard

## บันทึกการทำงานและ review

- 45 targeted save/mode testsผ่านและisolatedupstreamAuth/PostgREST/PostgreSQL/Chromeจริง ไม่มีownercloudwrite/6173write
- Browser4กลุ่ม: >15sยังไม่มีPOST/revisionchange/gamecheckpointยัง0; speed1/2/4ไม่เขียน; finish1ครั้ง; offline/reload/รับรางวัลไม่ซ้ำ Artifactsชื่อตามcadenceเดิมแต่assertionsเป็นterminal-only
- Integrationรอบแรกuninitializedaccountprobeไม่ใช่404และไม่มีstatusdiagnostic เก็บround1 เพิ่มstatus/codeเฉพาะเมื่อfailแล้วรันผ่านโดยไม่เปลี่ยนAPIguard ไม่สรุปสาเหตุที่ยังไม่มีหลักฐาน
- Fullnpmtestรอบแรกหยุดเฉพาะownprocesstreeหลังuserเพิ่มscope ใช้targeted45save/modecasesแทน ไม่อ้างว่าfullsuiteผ่าน

- Source5215676f8 push main/Vercelstatussuccess ActualproductionChrome shellมีbattle.finish/ไม่มีbattle.advanceหรือschedulerเก่า และข้อความresetdailyใหม่; health200/ok/content768e12a4ตรงกัน ไม่มีownercloudwrite การซ่อมเซฟจริงรอเจ้าของกดยืนยันmigrationตามflow
