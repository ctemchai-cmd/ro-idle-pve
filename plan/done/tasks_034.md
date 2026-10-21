# TASK-034 — ทำชุดสกิลจริงครบสาย Merchant / Blacksmith / Alchemist

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้
- TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง
- TASK-026 — ทำ inventory อุปกรณ์และค่าต่อสู้จากของสวม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- runtime ของทุกสกิลจาก TASK-008
- scenario เฉพาะสายและภาพ/effect recipe ที่เชื่อมกับ pack

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

นำข้อมูลสกิลที่ review แล้วมาใช้จริงทั้ง Class 1/2 ของสายนี้ ครอบคลุม บัฟอาวุธ/เกราะแตก/กายภาพหมู่, สารเคมี/DoT และ Plant ใช้ shared engine ให้ runner วัดได้ ไม่ใส่กติกาสกิลลง renderer และไม่สร้างข้อมูลบาลานซ์อีกชุด

## ขั้นตอนทำงาน

1. ทำ effect/hook เฉพาะที่ generic engine ยังไม่มีจากสเปกเดิม
2. เชื่อมทุกสกิล/Passive/unlock/ภาพกับ loadout และ pack builder
3. ตรวจบิลด์ที่ออกแบบไว้ใน headless/browser และบันทึกสิ่งที่ต้องวัดบาลานซ์ภายหลัง

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิล Active/Passive ทุกท่าในข้อมูลสายนี้ execute ได้ ไม่มีปุ่มที่เรียนได้แต่ยังไม่ทำผล
- [x] AC-02: Plant มีเจ้าของ จำนวน/อายุ/tick จำกัด ฮีล/ดาเมจ/สถิติไม่ถูกนับซ้ำ และบัฟ Blacksmith มีผลตามชนิดที่ระบุ
- [x] AC-03: บิลด์ตัวอย่างทุกสาขาผ่านกรณีผลที่คำนวณไว้ ใช้ค่าจาก content bundle เดียวกับ simulation
- [x] AC-04: ผลที่ seed/input เดียวกันใน runner และ runtime ตรงกัน; metrics ระบุ actor/skill/proc และภาพไม่เปลี่ยนผล

## วิธีตรวจและหลักฐาน

รัน reference scenarios ของสายนี้ที่งบ/เลเวลเทียบกันได้ แล้วตรวจภาพเฉพาะท่าที่เพิ่ม พร้อมเก็บ seed/content hash และ event log

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `RO_TREE_EVIDENCE=plan/evidence/task-034-runtime.json node --import tsx --test tests/game/skills-merchant.test.ts` | 19 สกิลตรง golden 57 เคส; Active ทุกเลเวลร่ายจริงครบทุก effect รวมเรียกต้นไม้ที่ทำงานจริง; สกิลใช้ SP ไม่หักทอง; Passive มีผลทุกเลเวล; หน้าสกิล Blacksmith/Alchemist แสดงเฉพาะสายตัวเอง — [review](../evidence/task-034-review.json), [ค่าที่วัด](../evidence/task-034-runtime.json) | ผ่าน |
| AC-02 | เทสต์เดียวกัน | ทำระบบ summon ใน engine แล้ว: Hell Plant มีพร้อมกันไม่เกิน 2 อยู่ 6,500 ms ทำงานที่ +1000–6000 แทนตัวเก่าสุดได้ ดาเมจ 1560 ลงบัญชีเจ้าของครั้งเดียว; Healing Plant มี 1 ต้นและฮีลเพื่อนที่เลือดน้อย; เจ้าของตายแล้วต้นไม้หายทันที; บัฟ Blacksmith เพิ่ม ASPD/ATK กายภาพ ไม่แตะเวท | ผ่าน |
| AC-03 | เทสต์เดียวกัน | dry trace ของ 4 บิลด์ตรง queue_estimate; ไฟต์จริงตรง dry ยกเว้น Adrenaline เร่ง; ต้นไม้ไม่เกินจำนวนและไม่กลายเป็นสมาชิกทีมคนที่ 5 | ผ่าน |
| AC-04 | เทสต์เดียวกัน | ด่าน 6-20 seed 34 (สลับ npc_merchant เข้าทีม): ชนะที่ 79023 ms, checkpoint/RNG/989 events ตรงกันทั้งสามทาง (digest `b561cb9b`) รวม checkpoint ที่มีต้นไม้; ต้นไม้ทำงานครั้งเดียวต่อ tick | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `4a790102…` · [หลักฐาน](../evidence/task-034-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 20 ตุลาคม 2026: ทำ summon actor factory ใน engine (owner-bound, ไม่ถูกเลือกเป็นเป้า, periodic tick, หมดอายุแบบ exclusive, replace_oldest, หายเมื่อเจ้าของตาย/จบไฟต์, ถูกลบออกจาก checkpoint, มีจุดพิกัดคงที่ในฉากจริง) พร้อม validation ของ checkpoint, event `summon`/`despawn`, render view `summon_of` และ renderer วาดต้นไม้แบบ procedural ข้างเจ้าของ ข้อจำกัด: ไม่มีภาพต้นไม้ native ตัวเลขไม่ใช่ผลบาลานซ์ (TASK-041)

