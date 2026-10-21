# TASK-016 — ทำไทม์ไลน์ต่อสู้ ตีปกติ และคิวสี่สกิล

Milestone: M1 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-015 — สร้างโครงโปรเจกต์และโหลดข้อมูลเกมที่ตรวจ schema ได้

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- combat state/virtual clock/event scheduler และ seeded RNG
- stats calculation และสกิลดาเมจพื้นฐานที่ใช้พิสูจน์ไทม์ไลน์

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ใช้สูตร TASK-002 ให้ทุก actor ทำงานพร้อมกัน มี SI/CT/ACD, Normal Attack, SP และจุด cast-start ตาม decisions แยกเวลาของเกมจากการวาด รองรับ fast-forward โดยไม่รอจริง

## ขั้นตอนทำงาน

1. ทำ state/event order/formula/seed ตาม spec
2. เชื่อมคิวสี่ช่อง ตีปกติ SP และผลแพ้ชนะพื้นฐาน
3. ตรวจ timeline กับกรณีคำนวณมือและการรันซ้ำ

## เกณฑ์ตรวจรับ

- [x] AC-01: สองฝ่ายเริ่มร่ายพร้อมกันได้ และคิวไม่รอให้ actor อื่นจบ
- [x] AC-02: Normal Attack ตรงช่วง SI/ACD หยุด CT; ไม่มี cooldown แยก; SP ไม่พอข้ามแล้ว SI ช่องถัดไป
- [x] AC-03: หัก SP/นับใช้ที่ cast start และจัดเหตุการณ์เวลาเดียวกันตาม spec
- [x] AC-04: seed/input เดียวกันให้ event order/ผลตรงกัน และ fast-forward ไฟต์ 90 วินาทีไม่ต้องรอ wall clock 90 วินาที

## วิธีตรวจและหลักฐาน

ใช้ fixture จาก M0 เปรียบเทียบเวลาตามเหตุการณ์และ state สุดท้าย พร้อมรันแบบทีละช่วง/ข้ามเหตุการณ์

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `npm run check`; parallel start/resolve/next-start goldens | [review](../evidence/task-016-review.json), [93tests](../evidence/task-016-checks-round3.txt), [build](../evidence/task-016-build.txt) | ผ่าน |
| AC-02 | `npm run check`; NA/SI/CT/ACD/empty slots/SP skip goldens | [review](../evidence/task-016-review.json), [93tests](../evidence/task-016-checks-round3.txt), [build](../evidence/task-016-build.txt) | ผ่าน |
| AC-03 | `npm run check`; cast-start spending/locked lethal completion batch/timeout priority | [review](../evidence/task-016-review.json), [93tests](../evidence/task-016-checks-round3.txt), [build](../evidence/task-016-build.txt) | ผ่าน |
| AC-04 | `npm run check`; seed0 and repeated input/onejump vs20Hz/restore midCT/90s fast-forward | [review](../evidence/task-016-review.json), [93tests](../evidence/task-016-checks-round3.txt), [build](../evidence/task-016-build.txt) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 3

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เริ่มหลังTASK-015done มีสูตรกลาง/RNG/scheduler/immutablebattle state/คิวสี่ช่อง/basicdamageและcheckpoint portsแล้ว กำลังตรวจgoldenกับparallel/NA/SP/same-time/timeout/stepping/restore ยังไม่ผ่านACจนได้ผลจริง
- Primitiveที่ยังเป็นTASK-017 (สถานะ/ฮีล/trigger/periodic) คืนdiagnostic ไม่ข้ามผลเงียบหรืออ้างว่า126skillพร้อมเล่นแล้ว


- 19 ตุลาคม 2026: ผ่าน93tests (51foundation+42core),typecheck/boundaries/build และsame-seed/50msstep/checkpointเทียบตรง ยังไม่มีstatus/procครบหรือdemoเกมในbrowser งานถัดไปทำตามdependency; เก็บround2typecheckfailureไว้ไม่ซ่อน
