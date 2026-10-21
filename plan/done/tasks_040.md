# TASK-040 — ทำสำรองเซฟ ย้าย schema และเครื่องมือกู้คืน

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-022 — ทำ cloud save, checkpoint และ reconnect ที่ไม่จ่ายของซ้ำ
- TASK-028 — ทำการผสม rarity และอัป tier ที่รักษาการลงทุน
- TASK-036 — ทำดันรายวันบอสหลายหลอดและรีเซ็ตวัน
- TASK-037 — ทำกาชาการ์ดพร้อมอัตรา pity และของซ้ำ
- TASK-038 — ทำรางวัล AFK 12 ชั่วโมงด้วยสูตรที่จำลองแยกได้

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- versioned backup/export/import/reset ตามสเปก
- migration/restore flow และคำอธิบายกู้ข้อมูลสำหรับผู้เล่น

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ต่อจาก checkpoint protocol เพิ่มเครื่องมือกู้ข้อมูลที่ไม่เขียนทับ cloud เงียบๆ ตรวจ schema/version/owner/revision ก่อน import สำรองก่อน migration/reset และจัด server-ownedclaims/cursors ไม่ให้ restore แล้วรับของซ้ำ

## ขั้นตอนทำงาน

1. ทำ backup/export/import/reset และ schema migration ตามสเปก
2. ทำ preview/confirmation เฉพาะการเขียนทับหรือลบข้อมูลและเก็บ backup ก่อนทำ
3. ตรวจไฟล์เสีย/รุ่นเก่า/เจ้าของผิด/ข้อมูลใหม่กว่า/claims เดิม

## เกณฑ์ตรวจรับ

- [x] AC-01: export แล้ว restore ในสภาพแวดล้อมทดสอบได้ค่าตัวละคร/NPC/ของ/slot ตามที่กำหนด
- [x] AC-02: schema เก่า migrate ตามกติกาและมี backup ก่อนเปลี่ยน ไฟล์ผิด/รุ่นไม่รองรับไม่ทำเซฟเดิมเสีย
- [x] AC-03: import/reset ไม่ข้าม revision/ownership หรือย้อน claim cursor เพื่อรับเงิน/การ์ด/AFK ซ้ำ
- [x] AC-04: ผู้เล่นเห็นว่าจะเปลี่ยนข้อมูลใดและกู้ได้จาก backup ตามขั้นตอนจริง ไม่แสดงสำเร็จก่อน cloud ตอบ

- [x] AC-05: มี fixtures ต่าง schema/content/rules/cost versions; migrate/reject/backup และ refund ตรง compatibility matrix โดยไม่ใช้ราคาใหม่ย้อนคืนผิดหรือเขียนเซฟที่เป็นรุ่นใหม่เกินรองรับเสีย

## วิธีตรวจและหลักฐาน

ใช้ save fixtures หลายรุ่นและฐานทดสอบ ตรวจ migration/restore/resource ledger รวมไฟล์เสียและขัดการเชื่อมต่อระหว่างทำ

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | save-backup.test AC-01 + live BACKUP_040 | ส่งออก → รีเซ็ต → ย้อนกลับ ได้ตัวละคร/NPC/ของ/refine/เงินเหมือนเดิมทุกค่า ทั้ง unit และ stack จริง ไฟล์มีลายเซ็นไม่มีความลับ | ผ่าน |
| AC-02 | save-backup.test AC-02 + live (migration) + `test_storage_postgres.py` | เซฟรุ่นเก่าเห็น before/after แล้วย้ายพร้อมสำรองก่อน schema ใหม่กว่า/ID ไม่รู้จักไม่เขียนอะไร ไฟล์เสียถูกปฏิเสธ | ผ่าน |
| AC-03 | save-backup.test AC-03 (+ mutation check) + live (quarantine) | revision ไม่ข้าม เจ้าของต้องตรง AFK ไม่ย้อน (จ่ายแค่ช่วงหลังรีเซ็ต) สิทธิ์รายวัน/ร้านค้าไม่คืน ย้อนรีเซ็ตได้ครั้งเดียว เซฟเสียกู้จาก signed tip เท่านั้น | ผ่าน |
| AC-04 | save-backup.test AC-04 + live screenshots backup-* | ตารางเทียบก่อนเขียนทับ พิมพ์ RESET แผงย้ายรุ่น/กู้คืนบอกสิ่งที่เปลี่ยน แจ้งสำเร็จหลัง receipt เท่านั้น | ผ่าน |
| AC-05 | save-backup.test AC-05 | fixtures หลายรุ่น migrate/reject ถูก คืนทุนตามราคาที่จ่ายจริง (cost v0) ไม่ใช่ราคาใหม่ รีเซ็ตซ้ำคืน 0 | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `5b194302…` · [หลักฐาน](../evidence/task-040-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime
- 20 ตุลาคม 2026: ทำสำรอง/กู้คืนตาม D-064: ตาราง `game_save_backups` + `game_commit_maintenance` (migration 006), คำสั่ง `save.migrate`/`account.reset`/`backup.restore_request`, หน้า ตั้งค่า › สำรอง/กู้คืน และแผงย้ายรุ่น/กู้เซฟเสีย ผ่าน unit 6 ข้อ (mutation ตัวกัน AFK/ร้านค้าถูกจับได้), PostgreSQL จริง และ live BACKUP_040
