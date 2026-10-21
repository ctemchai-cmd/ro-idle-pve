# TASK-012 — ออกแบบหน้าจอและ flow ที่เล่นครบวงจร

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [เวลาและสกิล](../design/02-combat-and-skills.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-009 — ออกแบบอุปกรณ์ Refine Enchant และชุดการ์ด
- TASK-011 — ออกแบบด่าน บอส Tower และดันรายวันให้ครบรุ่นแรก

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- `plan/design/10-ui-and-player-flows.md`
- wireframe และรายการข้อความ/สถานะของแต่ละหน้า

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

ออกแบบหน้า login, ต่อสู้/Story, ทีม/เปลี่ยนสาย/Status, สกิล, inventory/slot/cards, Tower/รายวัน/gacha, AFK/เซฟ/ตั้งค่า รวม desktop/mobile และการอ่านเหตุผลแพ้ ไม่ใส่ข้อมูล implementation ลง flow ผู้เล่น

## ขั้นตอนทำงาน

1. ทำ user flow ตั้งแต่เข้าเกมจนเปลี่ยนบิลด์/ท้าบอสและกลับมารับ AFK
2. ออกแบบ wireframe พร้อมข้อมูล/ปุ่ม/สถานะ loading/error/empty และคำเตือนเฉพาะการทำลายข้อมูล
3. ตรวจเส้นทางด้วยตัวอย่างสี่คนและความก้าวหน้า NPC นอกทีม

## เกณฑ์ตรวจรับ

- [x] AC-01: ทุกระบบรุ่นแรกมีทางเข้า/ออกและ action ครบ ไม่ใช่หน้าโชว์อย่างเดียว
- [x] AC-02: แสดง HP/SP/คิว/CT/ACD และความเร็วที่เปลี่ยนก่อนลงแต้ม/เปลี่ยนของ พร้อมผลแพ้ที่ใช้แก้บิลด์ได้
- [x] AC-03: เน็ตขาด/เซฟค้าง/เซฟชน/หมด session มีสถานะตรงจริงและทางกลับมาเล่นโดยไม่จ่ายของซ้ำ
- [x] AC-04: มีแบบจอเล็กที่อ่านไทย/กดได้ และ tutorial ไม่บังคับจ่ายทรัพยากรผิดบิลด์

## วิธีตรวจและหลักฐาน

เดิน flow บน wireframe ด้วย checklist ผู้เล่นใหม่ กลับมาเล่น เปลี่ยน NPC และขาดเน็ต; เก็บภาพ/ข้อความที่ใช้ review

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/ui.py`; อ่านwireframes/ตารางหน้าจอครบและ40actions/34durable IDsในui-flows.json | [report](../evidence/task-012-review.json):10 checksและ7manualflowcases พร้อม [wireframes](../design/10-ui-and-player-flows.md) | ผ่านแบบ M0 |
| AC-02 | `python3 plan/checks/ui.py`; preview SI1500→1200/CT1000→800, HUDHP/SP/CT/ACD/queueและfailuremetrics | [report](../evidence/task-012-review.json):10 checksและ7manualflowcases พร้อม [wireframes](../design/10-ui-and-player-flows.md) | ผ่านแบบ M0 |
| AC-03 | `python3 plan/checks/ui.py`; networkcases7กรณีรวมresponseหาย/conflict/fullinventoryที่ยังsalvageได้ +manualrecovery/dayboundarycases | [report](../evidence/task-012-review.json):10 checksและ7manualflowcases พร้อม [wireframes](../design/10-ui-and-player-flows.md) | ผ่านแบบ M0 |
| AC-04 | `python3 plan/checks/ui.py`; wireframe360/390/844/1280, Thai14px/touch44px, tutorialข้ามได้ไม่บังคับบิลด์; ยังไม่ใช่browserrender | [report](../evidence/task-012-review.json):10 checksและ7manualflowcases พร้อม [wireframes](../design/10-ui-and-player-flows.md) | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: ส่งwireframes/screens/actions/policiesและตรวจ10checksพร้อมmanualflowreviewครบ4AC; แก้inventory-fullpolicyให้ยังย่อย/ผสมเพื่อเพิ่มช่องได้ ไม่มีการอ้างว่าทดสอบหน้าจอจริงแล้ว
