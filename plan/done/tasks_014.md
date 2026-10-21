# TASK-014 — ตรวจสเปกรวมก่อนเริ่มเขียนเกม

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [Level design](../design/06-level-design.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-001 — กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร
- TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation
- TASK-003 — เขียนข้อมูลสกิลครบสาย Swordsman → Knight / Crusader
- TASK-004 — เขียนข้อมูลสกิลครบสาย Acolyte → Priest / Monk
- TASK-005 — เขียนข้อมูลสกิลครบสาย Archer → Hunter / Bard / Dancer
- TASK-006 — เขียนข้อมูลสกิลครบสาย Mage → Wizard / Sage
- TASK-007 — เขียนข้อมูลสกิลครบสาย Thief → Assassin / Rogue
- TASK-008 — เขียนข้อมูลสกิลครบสาย Merchant → Blacksmith / Alchemist
- TASK-009 — ออกแบบอุปกรณ์ Refine Enchant และชุดการ์ด
- TASK-010 — ออกแบบเศรษฐกิจ ดรอป กาชา และเป้าหมายเวลาสะสม
- TASK-011 — ออกแบบด่าน บอส Tower และดันรายวันให้ครบรุ่นแรก
- TASK-012 — ออกแบบหน้าจอและ flow ที่เล่นครบวงจร
- TASK-013 — กำหนดสถาปัตยกรรม runtime, cloud save และ simulation
- TASK-047 — ออกแบบแค็ตตาล็อกสถานะและโมดูลร่วมของสกิล/ไอเทม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- รายงานความพร้อม M0 และรายการข้อมูล/สเปกฉบับอ้างอิง
- `plan/acceptance-matrix.md`: traceability decisions → data → task/AC → case ID/input/expected result/วิธีวัด

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

เป็นจุดตรวจ design ทั้งชุดตามความต้องการคุย/ออกแบบก่อน coding ตรวจความขัดแย้ง ID/ข้อมูลอ้างอิง ราคาทรัพยากร ชุดสกิล โหมด UI/cloud และช่องทาง simulation โดยยังไม่บังคับมีผลจาก engine ที่ยังไม่ได้สร้าง

## ขั้นตอนทำงาน

1. อ่านผลส่งมอบ TASK-001–013 และ TASK-047 และตรวจข้อมูลข้ามระบบ
2. คำนวณตัวอย่างคิว/งบพัฒนา/ปลดด่านและตรวจ task coverage
3. ผูกทุก AC กับ case ID/ข้อมูลตั้งต้น/ผลคาดหวังหรือเกณฑ์ตัวเลขและวิธีวัดใน acceptance-matrix แก้สเปกกับงานที่ได้รับผลให้ตรงกันแล้วบันทึก review
4. ตรวจ A-01–A-08 ใน architecture audit ว่ามี decision/contract/ตัวอย่างและ task พิสูจน์ครบ แยกส่วนที่ปิดได้ด้วยสเปกกับผล runtime ที่ต้องรอ M1/M2/M4

## เกณฑ์ตรวจรับ

- [x] AC-01: งานออกแบบก่อน gate ทั้ง 14 งาน (TASK-001–013 และ TASK-047) อยู่ done พร้อมหลักฐานจริง ไม่ใช้เพียง checkbox ว่าเขียนแล้ว
- [x] AC-02: ไม่มี TBD ที่บล็อกสูตร/ชุดสกิล/สถานะ/schema composition/ด่าน/transactions; บัฟหลายผู้ร่ายบวกไม่มี cap ตาม D-037, reapply คนเดิมมีข้อสรุป และลำดับคูณ-คริ-เกราะชัด โดยไม่เปลี่ยนข้อยืนยันคิว/Chain CC
- [x] AC-03: ทุกระบบรุ่นแรกและ simulation interface มี task รองรับ ไม่มี dependency วนหรือสกิล/asset ID อ้างลอย
- [x] AC-04: ทุก AC มี input/ผลคาดหวัง/วิธีตรวจอ้างใน acceptance-matrix รวม pace/performance budgets; ค่าบาลานซ์ระบุว่าเป็น baseline รอวัดจริง ไม่อ้าง simulator ผ่านก่อนสร้าง

- [x] AC-05: A-01–A-08 มี closure ระดับ design ใน TASK-013/งานต้นทางครบ ไม่มีคำตัดสินที่กระทบ module/save/time/version ค้างโดยไร้เจ้าของ และระบุผล runtime ที่ยังไม่พิสูจน์โดยไม่อ้างว่าพร้อมหรือไม่มี tech debt แล้ว

## วิธีตรวจและหลักฐาน

review ข้ามเอกสารและคำนวณตัวอย่างอิสระ เก็บ findings และการแก้ครบก่อนปล่อย gate; ยังไม่สร้างเกมหรือ remote infrastructure

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/readiness.py`; ตรวจ14prerequisites/ผล749checksและSHAของinputs | [gate report](../evidence/task-014-review.json): 8checksผ่าน, 749checksจาก14งานต้นทางผ่าน | ผ่านเฉพาะ M0 design |
| AC-02 | `python3 plan/checks/readiness.py`; ตรวจสูตร/27status/126skill/typed schemas/noTBDและข้อยืนยัน | [gate report](../evidence/task-014-review.json): 8checksผ่าน, 749checksจาก14งานต้นทางผ่าน | ผ่านเฉพาะ M0 design |
| AC-03 | `python3 plan/checks/readiness.py`; ตรวจDAG47งาน/19jobs36presets/refsและลิงก์ | [gate report](../evidence/task-014-review.json): 8checksผ่าน, 749checksจาก14งานต้นทางผ่าน | ผ่านเฉพาะ M0 design |
| AC-04 | `python3 plan/checks/readiness.py`; ตรวจ201AC→case/input/expected/method พร้อม134implementation casesยังไม่รัน | [gate report](../evidence/task-014-review.json): 8checksผ่าน, 749checksจาก14งานต้นทางผ่าน | ผ่านเฉพาะ M0 design |
| AC-05 | `python3 plan/checks/readiness.py`; ตรวจA-01–08 closure artifacts/17qualitytargetsและเจ้าของruntime evidence | [gate report](../evidence/task-014-review.json): 8checksผ่าน, 749checksจาก14งานต้นทางผ่าน | ผ่านเฉพาะ M0 design |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime
- 19 ตุลาคม 2026: ปรับตาม D-037 ให้บัฟหลายผู้ร่ายบวกกันไม่มีเพดาน; เพิ่มเคส/วิธีตรวจโดยยังไม่เริ่มงานหรือผ่านเกณฑ์

- ระหว่างตรวจรวมก่อนreview: ส่งTASK-013กลับแก้เวลาclaimต่ำกว่าหนึ่งวินาทีและรอผลตรวจใหม่ก่อนเดินgateต่อ

- รอบตรวจรวมแก้drytimingSageให้รวมWisdom164.64/cycle7344ms, exactcontenthashในcommand/receipt, และtrainingweaponไม่ใช้ลัดRarity/ore; gameplay/เซฟ/qualityยังรอผลruntimeจากงานเจ้าของ

- 19 ตุลาคม 2026: gateผ่าน8checksหลังตรวจ14งานต้นทาง749checksและ201AC mapping; ปิดdesign A-01–08 แต่134implementationACยังไม่รัน อนุญาตเริ่มTASK-015ตามคำสั่งผู้ใช้
