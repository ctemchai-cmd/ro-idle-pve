# TASK-029 — ทำชุดสกิลจริงครบสาย Swordsman / Knight / Crusader

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้
- TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง
- TASK-026 — ทำ inventory อุปกรณ์และค่าต่อสู้จากของสวม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- runtime ของทุกสกิลจาก TASK-003
- scenario เฉพาะสายและภาพ/effect recipe ที่เชื่อมกับ pack

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

นำข้อมูลสกิลที่ review แล้วมาใช้จริงทั้ง Class 1/2 ของสายนี้ ครอบคลุม provoke/สวนกลับ/ท่าหนักและการคุ้มกันรับดาเมจแทน ใช้ shared engine ให้ runner วัดได้ ไม่ใส่กติกาสกิลลง renderer และไม่สร้างข้อมูลบาลานซ์อีกชุด

## ขั้นตอนทำงาน

1. ทำ effect/hook เฉพาะที่ generic engine ยังไม่มีจากสเปกเดิม
2. เชื่อมทุกสกิล/Passive/unlock/ภาพกับ loadout และ pack builder
3. ตรวจบิลด์ที่ออกแบบไว้ใน headless/browser และบันทึกสิ่งที่ต้องวัดบาลานซ์ภายหลัง

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิล Active/Passive ทุกท่าในข้อมูลสายนี้ execute ได้ ไม่มีปุ่มที่เรียนได้แต่ยังไม่ทำผล
- [x] AC-02: Knight สายจู่โจม/แทงก์และ Crusader คุ้มกัน/ดาเมจมีพฤติกรรมตาม spec ที่ต่างกัน
- [x] AC-03: บิลด์ตัวอย่างทุกสาขาผ่านกรณีผลที่คำนวณไว้ ใช้ค่าจาก content bundle เดียวกับ simulation
- [x] AC-04: ผลที่ seed/input เดียวกันใน runner และ runtime ตรงกัน; metrics ระบุ actor/skill/proc และภาพไม่เปลี่ยนผล

## วิธีตรวจและหลักฐาน

รัน reference scenarios ของสายนี้ที่งบ/เลเวลเทียบกันได้ แล้วตรวจภาพเฉพาะท่าที่เพิ่ม พร้อมเก็บ seed/content hash และ event log

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `RO_TREE_EVIDENCE=plan/evidence/task-029-runtime.json node --import tsx --test tests/game/skills-swordsman.test.ts` (4 เคส AC-01) | 19 สกิลตรง golden 57 เคส; Active 15 ท่า × Lv1–10 ร่ายจริงใน engine (seed 1, 60 วินาที) ทุก effect เกิดกับเป้าที่ถูกตามลำดับ; Passive 4 ท่า × Lv1–10 เปลี่ยนค่าพลัง/Reflect proc จริง; หน้าสกิล Knight/Crusader แสดงเฉพาะสายตัวเองพร้อมคำอธิบายผลและภาพใน pack — [review](../evidence/task-029-review.json), [ค่าที่วัด](../evidence/task-029-runtime.json) | ผ่าน |
| AC-02 | เทสต์เดียวกัน (role encounter seeds 1–5 และ Devotion) | Striker DPS 668 vs แทงก์ 200; แทงก์ดึงบอสตี 12 ครั้ง สวนกลับ 3,356; Guardian รับแทน 1,064 บัฟเกราะครบ 4 คน; Holy striker DPS 596 vs Guardian 93; Devotion 30/70 และ 50/50/0 รอบเดียว | ผ่าน |
| AC-03 | เทสต์เดียวกัน (dry trace + full fight) | `catalogQueueTrace` ของ 4 บิลด์ตรง queue_estimate ทุกค่า รวม Passive ถาวร ไม่รวมบัฟชั่วคราว; ในไฟต์จริง Two-Hand Quicken ทำให้ striker ร่ายท่าถัดไปเร็วขึ้น (2682 vs 2906 ms) ส่วนบิลด์อื่นรอบแรกตรง dry | ผ่าน |
| AC-04 | เทสต์เดียวกัน (server commands + client session + runner) | ด่าน 6-20 seed 29: final checkpoint และ 1,117 events ตรงกันทั้งสามทาง (digest `c77f329e`), เซิร์ฟเวอร์ยืนยัน 89 checkpoint, metrics แยก owner:skill รวม proc/reflect; `npm run check` 254 tests ผ่าน | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `5302fe90…` · [หลักฐาน](../evidence/task-029-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 20 ตุลาคม 2026: engine generic รองรับทุก effect/status ของสายนี้อยู่แล้ว ไม่ต้องเพิ่ม hook เฉพาะ; เพิ่ม `src/domain/build/queue-trace.ts` (dry trace แบบ pure) และ harness ร่วม `tests/game/class-skills.ts` สำหรับ TASK-030–034 (golden comparator จะ fail ทันทีถ้าเจอ key ที่ยังไม่ตรวจ)
- ข้อจำกัด: ไม่ได้เพิ่มภาพใหม่ — ไอคอนแยกรายท่า แต่เอฟเฟกต์ในสนามใช้ recipe ตามกลุ่ม (burst/buff) ร่วมกัน; ตัวเลข role เป็นหลักฐานพฤติกรรม ไม่ใช่ผลบาลานซ์ (Lv70 ไม่มีของ แทงก์ทั้งสองตายใน 60 วินาทีของ probe และทีม 6-20 ที่มีเพื่อน Lv1 หมดเวลา) — ส่งต่อ TASK-041

