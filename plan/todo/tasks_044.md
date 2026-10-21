# TASK-044 — ตรวจรับรุ่น Class 2 บน release candidate

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [Level design](../design/06-level-design.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-040 — ทำสำรองเซฟ ย้าย schema และเครื่องมือกู้คืน
- TASK-041 — เติมเนื้อหาครบและปรับบาลานซ์ด้วย simulation
- TASK-042 — ตรวจขนาดโหลด ความลื่น และจอที่รองรับ
- TASK-043 — ตั้ง build/deploy และ Vercel Preview ที่แยกเซฟทดสอบ

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- รายงาน release acceptance ที่ trace กลับ decisions และทุกระบบได้
- รายการ defects ที่ปิดแล้วหรือข้อจำกัดที่บันทึกอย่างชัดเจน

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ตรวจทั้ง flow บน preview ที่มีเนื้อหาล่าสุด, cloud/reconnect/reward/ปลดระบบ, saveupgrade และ simulationparity ใช้ผลทดสอบเดิมที่ยังตรง version และรันเพิ่มเฉพาะ integration/ความเสี่ยงที่ยังไม่ครอบคลุม

## ขั้นตอนทำงาน

1. สร้าง releasecandidate และระบุ content/build/migrationversions
2. ทำ acceptance matrix จาก decisions/tasks และตรวจทุกเส้นทางสำคัญ
3. คืนงานที่ไม่ผ่านให้ task เจ้าของแก้แล้วตรวจจุดที่ได้รับผลก่อนปิด review

## เกณฑ์ตรวจรับ

- [ ] AC-01: เล่นจากเซฟใหม่จนจุดสำคัญและโหลดเซฟเก่า/backup ได้ตาม scope โดยใช้ acceleratedfixtures เฉพาะ test ที่แยกจาก production
- [ ] AC-02: ยืนยัน Lv.70/Class 2, roster/slot,คิว SP/CC,ทุกโหมด/กาชา/AFK และข้อห้ามรับของซ้ำตาม spec
- [ ] AC-03: ผล seed/input เดียวกันตรงระหว่าง headless/runtime และรายงาน simulation มีที่มาของข้อมูลครบ
- [ ] AC-04: ไม่มี defect ที่ทำเกมเดินต่อไม่ได้/เซฟหาย/รับของซ้ำหรือผิดข้อยืนยันค้างอยู่ ทุกเกณฑ์มีหลักฐานจริง

- [ ] AC-05: หลักฐาน A-01–A-08 ครบระดับ runtime ตามงานเจ้าของ: boundaries/shared rules/replay/variant isolation/actor scope และ cloud command/retry/version/interruption/migration ผ่านบนรุ่นที่จะปล่อย ไม่มีการใช้ผล audit เอกสารแทนผลรัน

## วิธีตรวจและหลักฐาน

review acceptance matrix และ browser/cloudintegration บน releasecandidate เก็บผลตาม version; ไม่ติ๊กผ่านแทนข้อที่ยังตรวจไม่ได้

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | ใช้วิธีตรวจด้านบนกับเงื่อนไขข้อนี้ | ยังไม่ตรวจ | ยังไม่ตรวจ |
| AC-02 | ใช้วิธีตรวจด้านบนกับเงื่อนไขข้อนี้ | ยังไม่ตรวจ | ยังไม่ตรวจ |
| AC-03 | ใช้วิธีตรวจด้านบนกับเงื่อนไขข้อนี้ | ยังไม่ตรวจ | ยังไม่ตรวจ |
| AC-04 | ใช้วิธีตรวจด้านบนกับเงื่อนไขข้อนี้ | ยังไม่ตรวจ | ยังไม่ตรวจ |
| AC-05 | ไล่ closure table จาก architecture audit ไปยัง build/content/rules versions และผลที่ทดสอบจริงของ TASK-015/018/020/022/038/040 | ยังไม่ตรวจ | ยังไม่ตรวจ |

ผู้ตรวจ: ยังไม่มี · วันที่: ยังไม่มี · รอบ review: 0

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime
