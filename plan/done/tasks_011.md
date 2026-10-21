# TASK-011 — ออกแบบด่าน บอส Tower และดันรายวันให้ครบรุ่นแรก

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [Level design](../design/06-level-design.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation
- TASK-010 — ออกแบบเศรษฐกิจ ดรอป กาชา และเป้าหมายเวลาสะสม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- `plan/data/stages.json`, `enemies.json`, `tower.json`, `daily-bosses.json`
- ตาราง coverage ด่าน/กลไก/ช่วงเลเวล/รางวัล/บิลด์ตัวอย่าง

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

ระบุจำนวนบทจริงของรุ่น Lv.1–70 แล้วทำครบสิบด่านต่อบท รวม enemy queue/Status/ฉาก/เพลง/รางวัลและเงื่อนไขปลด Tower ใช้ patterns/scaling และจำนวนชั้นข้อมูลเริ่มต้นที่ระบุได้ ดันมี 3 ครั้ง/บอส/วัน 60 วินาทีและ HP/phase สะสมในวัน

## ขั้นตอนทำงาน

1. เลือกขนาดเนื้อหาและจุดปลดที่สัมพันธ์กับ cap และ pace
2. ทำข้อมูลทุกด่าน/โหมดและ interruption matrix: เน็ตขาด/reload/พักแท็บ/ข้ามวัน/patch ระหว่างไฟต์ มีผลต่อ HP/attempt/กล่อง/รางวัล/การกลับเข้าอย่างไร ไม่ใช้สามบทตัวอย่างเป็นข้อสรุปอัตโนมัติ
3. ออกแบบ scenario/budget ตัวอย่างที่แก้กลไกได้อย่างน้อยสองทาง พร้อมช่วงเวลาจบไฟต์/อัตราชนะเป้าหมายของกลุ่มโจทย์สำหรับวัดใน M4

## เกณฑ์ตรวจรับ

- [x] AC-01: จำนวนบท/ด่าน/ชั้นที่ลงรุ่นแรกระบุแน่นอน และข้อมูลทุก entry ใช้ได้โดยไม่มี TBD สำคัญ
- [x] AC-02: Story 90 วินาที ทีมหมด/หมดเวลาแพ้ ตัวหลักตายคนเดียวไม่จบ; ไม่บังคับสกิลที่ยังไม่ปลด
- [x] AC-03: บอสเด่นมีสัญญาณ กลไกและวิธีแก้อย่างน้อยสองแนว ไม่บังคับการ์ดหายากหรืออาชีพเดียว
- [x] AC-04: Tower first-clear ไม่รีเซ็ต; ดันกล่องมี scaling/รางวัล/รีเซ็ต 00:00 Asia/Bangkok และกรณีข้ามวันชัดเจน

## วิธีตรวจและหลักฐาน

review ตาราง coverage/unlock/resource กับข้อมูล M0 คำนวณ scenario อ้างอิงก่อนมี simulator แล้วเก็บรายการที่ต้องวัดจริงใน M4

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/levels.py`; ตรวจ80stages/11enemy archetypes/8skill schemas/local media และ100Tower rowsกับgenerator | [report](../evidence/task-011-review.json):103 checks ผ่านและ [baseline19](../design/19-encounters-and-modes-baseline.md) | ผ่านแบบ M0 |
| AC-02 | `python3 plan/checks/levels.py`; 90sboundary89999/90000, mainตายคนเดียว, bothwipe, retryฟรี และskillunlockไม่เกินrecommendedlevel | [report](../evidence/task-011-review.json):103 checks ผ่านและ [baseline19](../design/19-encounters-and-modes-baseline.md) | ผ่านแบบ M0 |
| AC-03 | `python3 plan/checks/levels.py`; bossแปดตัวมี2strategiesพร้อมIDsที่ปลดทันและCommongear budget/TTK targets; ยังไม่วัดTTKจริง | [report](../evidence/task-011-review.json):103 checks ผ่านและ [baseline19](../design/19-encounters-and-modes-baseline.md) | ผ่านแบบ M0 |
| AC-04 | `python3 plan/checks/levels.py`; Towerfirstclearไม่reset, daily3boss×3attempts, phaseHP11200ตัวอย่าง และcross-midnightticket19→20ไม่เขียนวันใหม่ | [report](../evidence/task-011-review.json):103 checks ผ่านและ [baseline19](../design/19-encounters-and-modes-baseline.md) | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: ลงด่าน/ศัตรู/โหมดครบbaselineและตรวจ103checks+manualmechanic review; checkerพบตัวอย่างรับมือบท3อ้างสกิลLv40ที่ยังไม่ปลด จึงแก้เป็นตัวเลือกที่ปลดทันแล้วผ่านก่อนdone ไม่ใช้ผลschemaอ้างว่าbalanceผ่าน
