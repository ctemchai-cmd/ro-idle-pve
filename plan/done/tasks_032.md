# TASK-032 — ทำชุดสกิลจริงครบสาย Mage / Wizard / Sage

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้
- TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- runtime ของทุกสกิลจาก TASK-006
- scenario เฉพาะสายและภาพ/effect recipe ที่เชื่อมกับ pack

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

นำข้อมูลสกิลที่ review แล้วมาใช้จริงทั้ง Class 1/2 ของสายนี้ ครอบคลุม เวทหมู่/พื้น/CC, Auto-bolt/เสริมธาตุ/Spell Breaker/Dispel ใช้ shared engine ให้ runner วัดได้ ไม่ใส่กติกาสกิลลง renderer และไม่สร้างข้อมูลบาลานซ์อีกชุด

## ขั้นตอนทำงาน

1. ทำ effect/hook เฉพาะที่ generic engine ยังไม่มีจากสเปกเดิม
2. เชื่อมทุกสกิล/Passive/unlock/ภาพกับ loadout และ pack builder
3. ตรวจบิลด์ที่ออกแบบไว้ใน headless/browser และบันทึกสิ่งที่ต้องวัดบาลานซ์ภายหลัง

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิล Active/Passive ทุกท่าในข้อมูลสายนี้ execute ได้ ไม่มีปุ่มที่เรียนได้แต่ยังไม่ทำผล
- [x] AC-02: Sage ไม่ตีระหว่าง CT; proc ไม่วน และ Wizard ground effect มี tick/เป้า/อายุตรงข้อมูล
- [x] AC-03: บิลด์ตัวอย่างทุกสาขาผ่านกรณีผลที่คำนวณไว้ ใช้ค่าจาก content bundle เดียวกับ simulation
- [x] AC-04: ผลที่ seed/input เดียวกันใน runner และ runtime ตรงกัน; metrics ระบุ actor/skill/proc และภาพไม่เปลี่ยนผล

## วิธีตรวจและหลักฐาน

รัน reference scenarios ของสายนี้ที่งบ/เลเวลเทียบกันได้ แล้วตรวจภาพเฉพาะท่าที่เพิ่ม พร้อมเก็บ seed/content hash และ event log

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `RO_TREE_EVIDENCE=plan/evidence/task-032-runtime.json node --import tsx --test tests/game/skills-mage.test.ts` | 19 สกิลตรง golden 57 เคส; Active ทุกเลเวลร่ายจริงครบทุก effect (Spell Breaker ขัดร่ายและดูด SP, Dispel ล้างบัฟศัตรู); Passive มีผลทุกเลเวล; หน้าสกิล Wizard/Sage แสดงเฉพาะสายตัวเอง — [review](../evidence/task-032-review.json), [ค่าที่วัด](../evidence/task-032-runtime.json) | ผ่าน |
| AC-02 | เทสต์เดียวกัน | Sage ตีปกติ 18 ครั้ง ไม่มีครั้งไหนอยู่ระหว่างร่าย; Auto-bolt 8 ครั้งมาจากการตีปกติทั้งหมด ไม่วนซ้ำ; Storm Gust tick ที่ +1000–4000 ms ไม่ tick ตอนหมดอายุ 5000 ms และสุ่ม Freeze แยกรายเป้า | ผ่าน |
| AC-03 | เทสต์เดียวกัน | dry trace ของ 4 บิลด์ตรง queue_estimate (Sage cast speed 164.64, รอบ 7,344 ms); ไฟต์จริงตรง dry รอบแรก และ Quagmire ทำให้ศัตรูตีช้าลงจริง (1999 vs 1399 ms) | ผ่าน |
| AC-04 | เทสต์เดียวกัน | ด่าน 6-20 seed 32 (สลับ npc_mage เข้าทีม): ชนะที่ 62210 ms checkpoint/RNG/647 events ตรงกันทั้งสามทาง (digest `db55e84a`); tick ของ frost field อ้าง cast ต้นทาง | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `7b54253e…` · [หลักฐาน](../evidence/task-032-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 20 ตุลาคม 2026: engine รองรับทุก effect ของสายนี้แล้ว; harness กลางเพิ่มการให้ศัตรูร่ายสกิลยาวและมีบัฟเมื่อทดสอบท่าขัด/ล้างบัฟ, golden periodic แบบ recursive, ตรวจ cast/attack speed rating และสลับ NPC สายนั้นเข้าทีมใน parity ข้อจำกัด: ไม่ได้เพิ่มภาพใหม่ ตัวเลขไม่ใช่ผลบาลานซ์ (TASK-041)

