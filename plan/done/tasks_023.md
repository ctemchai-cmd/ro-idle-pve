# TASK-023 — ทำ roster ทีม Status เลเวลและการเปลี่ยนคลาส

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [อาชีพ](../design/03-classes.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-016 — ทำไทม์ไลน์ต่อสู้ ตีปกติ และคิวสี่สกิล
- TASK-022 — ทำ cloud save, checkpoint และ reconnect ที่ไม่จ่ายของซ้ำ

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- หน้าเลือกเพื่อน/ตำแหน่ง/Status/level/Breakthrough/สลับสาย
- persistent roster และ validation ตาม progression data

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

สร้าง main+เพื่อนหกตัว เลือกสามคนไม่ซ้ำ Class 1 แต่ซ้ำ main ได้ หน้า 2/หลัง 2 ลงแต้มเองและอัปถึง 70 ตามข้อมูล สลับสาย/รีเซ็ตนอกไฟต์ฟรีโดยใช้ transaction เดียว ไม่โอนค่าของ NPC ผ่านช่องทีม

## ขั้นตอนทำงาน

1. ทำ roster/team validation และ progression actions
2. ทำ UI เลือกตัว/จัดหน้า-หลัง/ลงแต้ม/อัป/เปลี่ยนสาย
3. เชื่อม cloud และตรวจถอดใส่ NPC/สลับอาชีพไปกลับ

## เกณฑ์ตรวจรับ

- [x] AC-01: NPC Knight+Crusader อยู่พร้อมกันไม่ได้ แต่ main Knight+NPC Knight ได้; เลือกสมาชิก/ตำแหน่งได้ครบสี่คน
- [x] AC-02: NPC นอกทีมเก็บค่าของตนและเลือกกลับมาไม่หาย สมาชิกใหม่ไม่รับ progression ของช่องทีม; resources เลือกกดอัปตัวใดก็ได้รวมตัวนอกทีมตาม Q-021 ไม่ auto-level ตัวลงสนาม
- [x] AC-03: Breakthrough/แต้ม/status/cap70 ตรงข้อมูล ไม่มี auto AGI/DEX ตามอาชีพ และยังไม่ปลด Hi-class
- [x] AC-04: รีเซ็ต/สลับสายคืนทุนถูกต้อง ของผิดชนิดกลับกระเป๋า และ save/retry ไม่สร้างแต้ม/ทรัพยากรซ้ำ

## วิธีตรวจและหลักฐาน

เล่น flow roster/progression หลายครั้งแล้ว reload ตรวจ resource ledger และค่าของ NPC ทั้งเข้า/ออกทีม

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | Pure invalid Knight+Crusader NPC-origin case/main duplication and actual four-position team swaps; identity validation. | [review](../evidence/task-023-review.json) · [real browser](../evidence/task-023-roster-live-browser.json) · [201tests](../evidence/task-023-check.txt) | ผ่าน |
| AC-02 | Real off-team MageLv2/AGI2, two party replacements and reload: retained progression, MerchantLv1, no automatic EXP distribution. | [review](../evidence/task-023-review.json) · [real browser](../evidence/task-023-roster-live-browser.json) · [201tests](../evidence/task-023-check.txt) | ผ่าน |
| AC-03 | Pure exact costs to70/gates20-40-60/manual345points/no auto primary growth; actual Breakthrough20 independent from Dancer promotion; schema rejects71. | [review](../evidence/task-023-review.json) · [real browser](../evidence/task-023-roster-live-browser.json) · [201tests](../evidence/task-023-check.txt) | ผ่าน |
| AC-04 | Actual old-price100gold/20manual refund + exact request replay; preserved weapon instance/slot refine+4/enchant2, full-inventory and battle-locked atomic rejection tests. | [review](../evidence/task-023-review.json) · [real browser](../evidence/task-023-roster-live-browser.json) · [201tests](../evidence/task-023-check.txt) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- อัปเดต20ตุลาคม2026 D-043/D-044: formation เป็นจุดเกิด ไม่ล็อกตำแหน่งต่อสู้ ส่ง arena/spatial profile จาก build/encounter ไป shared engine; normal ต้องเดินเข้าระยะและหาเป้าใกล้สุด สกิลทุกระยะ UI ใช้ portrait shell/แผงทีม-Timeline-ตั้งค่าตาม [design21](../design/21-spatial-combat-and-mobile.md) ทบทวน encounter balance กับการเดินจริงในTASK-041

- 20ตุลาคม2026: เริ่มหลังTASK-022ผ่านครบ5AC ใช้pure account reducer + atomicCAS/signedcheckpoint/SaveControllerเดิม; ทำroster/level/Breakthrough/manualstatus/reset/jobเปลี่ยนพร้อมactual-paid ledger ไม่มีclass auto growth

- 20ตุลาคม2026: ผ่านครบ4AC/201tests/build + real local Auth/SQL/Chrome ตาม [review](../evidence/task-023-review.json) และ [runtime24](../design/24-character-progression.md) รูปหน้า360/390ไม่มีoverflow ปุ่มปรับแต้มอย่างน้อย44px ยังไม่ผูกทีมเซฟเข้าฉากStory (TASK-025)
