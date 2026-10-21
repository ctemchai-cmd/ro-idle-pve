# TASK-033 — ทำชุดสกิลจริงครบสาย Thief / Assassin / Rogue

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้
- TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง
- TASK-029 — ทำชุดสกิลจริงครบสาย Swordsman / Knight / Crusader
- TASK-030 — ทำชุดสกิลจริงครบสาย Acolyte / Priest / Monk
- TASK-031 — ทำชุดสกิลจริงครบสาย Archer / Hunter / Bard / Dancer
- TASK-032 — ทำชุดสกิลจริงครบสาย Mage / Wizard / Sage
- TASK-034 — ทำชุดสกิลจริงครบสาย Merchant / Blacksmith / Alchemist

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- runtime ของทุกสกิลจาก TASK-007
- scenario เฉพาะสายและภาพ/effect recipe ที่เชื่อมกับ pack

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

นำข้อมูลสกิลที่ review แล้วมาใช้จริงทั้ง Class 1/2 ของสายนี้ ครอบคลุม คริ/พิษสะสม/ระเบิด/execute, Strip/Expose/interrupt และท่าลอก whitelist ใช้ shared engine ให้ runner วัดได้ ไม่ใส่กติกาสกิลลง renderer และไม่สร้างข้อมูลบาลานซ์อีกชุด

## ขั้นตอนทำงาน

1. ทำ effect/hook เฉพาะที่ generic engine ยังไม่มีจากสเปกเดิม
2. เชื่อมทุกสกิล/Passive/unlock/ภาพกับ loadout และ pack builder
3. ตรวจบิลด์ที่ออกแบบไว้ใน headless/browser และบันทึกสิ่งที่ต้องวัดบาลานซ์ภายหลัง

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิล Active/Passive ทุกท่าในข้อมูลสายนี้ execute ได้ ไม่มีปุ่มที่เรียนได้แต่ยังไม่ทำผล
- [x] AC-02: Rogue ลอกได้เฉพาะรายการอนุญาตในหนึ่ง Active slot ไม่สร้างช่องที่ห้า/เรียกวน; พิษ Assassin แยกเจ้าของและ stack ถูก
- [x] AC-03: บิลด์ตัวอย่างทุกสาขาผ่านกรณีผลที่คำนวณไว้ ใช้ค่าจาก content bundle เดียวกับ simulation
- [x] AC-04: ผลที่ seed/input เดียวกันใน runner และ runtime ตรงกัน; metrics ระบุ actor/skill/proc และภาพไม่เปลี่ยนผล

## วิธีตรวจและหลักฐาน

รัน reference scenarios ของสายนี้ที่งบ/เลเวลเทียบกันได้ แล้วตรวจภาพเฉพาะท่าที่เพิ่ม พร้อมเก็บ seed/content hash และ event log

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `RO_TREE_EVIDENCE=plan/evidence/task-033-runtime.json node --import tsx --test tests/game/skills-thief.test.ts` | 24 สกิล (รวม copy 5 ท่า) ตรง golden 72 เคส; Active ทุกเลเวลร่ายจริงครบทุก effect; Passive มีผลทุกเลเวล; หน้าสกิล Assassin/Rogue แสดงเฉพาะสายตัวเอง และ Detonate มีคำอธิบายจริงแล้ว — [review](../evidence/task-033-review.json), [ค่าที่วัด](../evidence/task-033-runtime.json) | ผ่าน |
| AC-02 | เทสต์เดียวกัน | copy ของ Rogue เหมือนสกิลต้นฉบับทุกเลเวล (SP ×1.25) ใส่ได้ท่าเดียวต่อ loadout ไม่มี copy ซ้อน; Detonate ระเบิดเฉพาะพิษของตัวเอง (raw = ชั้นของตัวเอง × 120) และไม่แตะพิษของเพื่อน | ผ่าน |
| AC-03 | เทสต์เดียวกัน | dry trace ของ 4 บิลด์ตรง queue_estimate; ไฟต์จริง Quick Step เร่งรอบถัดไป และ Rogue ลดเกราะ/พลังโจมตี/เปิดจุดอ่อนให้ทีม | ผ่าน |
| AC-04 | เทสต์เดียวกัน | ด่าน 6-20 seed 33 (สลับ npc_thief เข้าทีม): checkpoint และ 602 events ตรงกันทั้งสามทาง (digest `9b4b0daa`); tick ของพิษอ้าง cast ของ Assassin | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `4a790102…` · [หลักฐาน](../evidence/task-033-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 20 ตุลาคม 2026: engine รองรับทุก effect ของสายนี้แล้ว (detonate handler มีอยู่) เพิ่มคำอธิบาย Detonate ในหน้าสกิล และ harness ตรวจ golden ของ handler ครบ ข้อจำกัด: ไม่ได้เพิ่มภาพใหม่ ตัวเลขไม่ใช่ผลบาลานซ์ (TASK-041)

