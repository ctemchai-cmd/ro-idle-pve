# TASK-038 — ทำรางวัล AFK 12 ชั่วโมงด้วยสูตรที่จำลองแยกได้

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-025 — ทำ Story ฟาร์มและวงจรเล่นที่เซฟได้
- TASK-022 — ทำ cloud save, checkpoint และ reconnect ที่ไม่จ่ายของซ้ำ

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- AFK preview/claim และ pure farm reward calculation
- server cursor/idempotent settlement และข้อมูลอัตราฟาร์ม

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

คำนวณช่วงที่ยังไม่เคยจ่ายด้วยเวลา server และ farm snapshot จำกัด 12 ชั่วโมง ใช้สูตรเดียวกันในเกม/ทดสอบและเตรียม progression simulation ไม่เปิด combat offline หรือปลดด่านย้อนหลัง

## ขั้นตอนทำงาน

1. ทำ pure calculation จากเวลาช่วง/อัตรา/เงื่อนไขที่สเปกระบุ
2. ทำ claim และเลื่อน cursor พร้อมกัน รวมช่วง reconnect/เครื่องหลับ
3. ทำหน้ารายงานเวลา/เพดาน/ของที่ได้รับและทดสอบรับซ้ำ

## เกณฑ์ตรวจรับ

- [x] AC-01: กลับมาหลัง 1/12/เกิน 12 ชั่วโมงได้ของตามสูตรและเพดาน ไม่มี stage/boss progression ใหม่
- [x] AC-02: รับซ้ำ/response หาย/สองอุปกรณ์ไม่เพิ่มของเกินช่วงที่ยังไม่จ่าย และ checkpoint เก่าไม่ย้อน cursor
- [x] AC-03: ไม่จ่ายซ้ำกับ online earnings/ช่วงแท็บพักที่ settle แล้ว และจัดข้ามวันตามกติกา
- [x] AC-04: สูตรรางวัลเรียกใน process ไม่มี browser/cloud ได้ด้วย virtual clock และได้ผลเดียวกับ settlement ที่ใช้จริง

- [x] AC-05: สูตรรางวัลมี canonical implementation ตาม TASK-013 ที่ preview/runner/ผู้คำนวณจริงใช้สอดคล้องกัน ไม่แอบเพิ่ม SQL formula อีกชุด; balance patch ระหว่าง AFK ใช้ rate snapshot/version ตาม policy และ retry ไม่เปลี่ยนผลเดิม

## วิธีตรวจและหลักฐาน

เทียบกรณีเวลาที่คำนวณอิสระกับ pure function และ cloud transaction ตรวจ ledger/เวลา server โดยไม่รอ 12 ชั่วโมงจริง

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `node --import tsx --test tests/game/afk.test.ts` | ไม่อยู่ 1/12/20 ชม. ได้ทอง 3,600/43,200/43,200 (เพดาน 12 ชม.) ไม่มีการปลดด่าน | ผ่าน |
| AC-02 | ดูด้านบน | รับซ้ำช่วงเดิมได้ NO_FARM_ELAPSED เซฟไม่เปลี่ยน cursor เก่าถูกปฏิเสธไม่ย้อนกลับ | ผ่าน |
| AC-03 | ดูด้านบน | ช่วงออนไลน์กับช่วง AFK ไม่ทับกัน ข้ามเที่ยงคืนไม่รีเซ็ตนาฬิกาฟาร์ม | ผ่าน |
| AC-04 | ดูด้านบน | สูตร pure ที่ฉีดเวลาได้ผลเท่ากับการ settle ของเซิร์ฟเวอร์ทุกค่า เศษสะสมครบ | ผ่าน |
| AC-05 | ดูด้านบน | แพตช์กลางช่วงใช้อัตราที่ freeze ไว้ ย้ายด่านฟาร์มจ่ายช่วงเก่าก่อน retry ได้ผลเดิม | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `ab45f216…` · [หลักฐาน](../evidence/task-038-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime

- ฐานTASK-022: ใช้ `reserveFarm`/shared seeded RNG และ command-only signed checkpoint/SaveController ตาม [protocol23](../design/23-save-runtime-protocol.md) ห้ามคำนวณรายได้ซ้ำจากkillหรือใช้snapshot upload งานนี้เชื่อม mode/rate/AFK UX จริงและตรวจหลักฐานของตน
- 20 ตุลาคม 2026: ระบบ AFK/ฟาร์มมีจาก TASK-022/025/048 แล้ว งานนี้พิสูจน์ครบตามเกณฑ์ด้วย `tests/game/afk.test.ts` และใช้หน้า "รับทั้งหมด"/หีบ AFK เดิมเป็นหน้ารายงาน
