# TASK-030 — ทำชุดสกิลจริงครบสาย Acolyte / Priest / Monk

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้
- TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- runtime ของทุกสกิลจาก TASK-004
- scenario เฉพาะสายและภาพ/effect recipe ที่เชื่อมกับ pack

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

นำข้อมูลสกิลที่ review แล้วมาใช้จริงทั้ง Class 1/2 ของสายนี้ ครอบคลุม ฮีล/ล้าง/บัฟ/SP, ลูกแก้ว/คอมโบ/finisher และ Steel Body ใช้ shared engine ให้ runner วัดได้ ไม่ใส่กติกาสกิลลง renderer และไม่สร้างข้อมูลบาลานซ์อีกชุด

## ขั้นตอนทำงาน

1. ทำ effect/hook เฉพาะที่ generic engine ยังไม่มีจากสเปกเดิม
2. เชื่อมทุกสกิล/Passive/unlock/ภาพกับ loadout และ pack builder
3. ตรวจบิลด์ที่ออกแบบไว้ใน headless/browser และบันทึกสิ่งที่ต้องวัดบาลานซ์ภายหลัง

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิล Active/Passive ทุกท่าในข้อมูลสายนี้ execute ได้ ไม่มีปุ่มที่เรียนได้แต่ยังไม่ทำผล
- [x] AC-02: ฮีลเต็ม HP ยังใช้ตามคิว Monk ใช้/เก็บลูกแก้วถูกต้อง และ Steel Body มี trade-off ตามสเปก
- [x] AC-03: บิลด์ตัวอย่างทุกสาขาผ่านกรณีผลที่คำนวณไว้ ใช้ค่าจาก content bundle เดียวกับ simulation
- [x] AC-04: ผลที่ seed/input เดียวกันใน runner และ runtime ตรงกัน; metrics ระบุ actor/skill/proc และภาพไม่เปลี่ยนผล

## วิธีตรวจและหลักฐาน

รัน reference scenarios ของสายนี้ที่งบ/เลเวลเทียบกันได้ แล้วตรวจภาพเฉพาะท่าที่เพิ่ม พร้อมเก็บ seed/content hash และ event log

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `RO_TREE_EVIDENCE=plan/evidence/task-030-runtime.json node --import tsx --test tests/game/skills-acolyte.test.ts` (4 เคส AC-01) | 19 สกิลตรง golden 57 เคส (รวม tick ของ Sanctuary, โล่ Kyrie, Resurrection, Asura); Active 14 ท่า × Lv1–10 ร่ายจริงครบทุก effect ตามลำดับ (ชุบเพื่อนที่ตายจริง, ลูกแก้วเริ่ม 5); Passive 5 ท่ามีผล; หน้าสกิล Priest/Monk แสดงเฉพาะสายตัวเอง — [review](../evidence/task-030-review.json), [ค่าที่วัด](../evidence/task-030-runtime.json) | ผ่าน |
| AC-02 | เทสต์เดียวกัน (Heal เต็มเลือด, Monk/Asura ถูกขัด, Steel Body) | Heal ร่าย 9 ครั้งตามคิวแม้ทุกคนเลือดเต็ม (SP 162, overheal 12,672); ลูกแก้วอยู่ในช่วง 0–5 ทุกจุด, Asura ใช้ SP ทั้งหมดและลูกแก้ว 5; ถูก Stun ขัดที่ 3,686 ms แล้วไม่คืน SP 407 และไม่มีดาเมจ; Steel Body guard +0.4 / ASPD −30% และบอสหันมาตี Monk | ผ่าน |
| AC-03 | เทสต์เดียวกัน (dry trace + full fight) | `catalogQueueTrace` ของ 4 บิลด์ตรง queue_estimate; ไฟต์จริง Asura ใช้ SP ตามที่มีอยู่จริง (407 → 60/48) Spirit Combo เติมลูกแก้ว และ Steel Body ทำให้รอบถัดไปช้าลง | ผ่าน |
| AC-04 | เทสต์เดียวกัน (server + client session + runner) | ด่าน 6-20 seed 30: checkpoint และ 945 events ตรงกันทั้งสามทาง (digest `4804b1e3`), เซิร์ฟเวอร์ยืนยัน 89 checkpoint; tick ของ Sanctuary/โล่ Kyrie อ้าง cast ต้นทาง; `npm run check` 265 tests ผ่าน | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `7b54253e…` · [หลักฐาน](../evidence/task-030-review.json)

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 20 ตุลาคม 2026: engine รองรับทุก effect ของสายนี้แล้ว (ฮีล, HoT, โล่, ชุบ, ลูกแก้ว, ต้นทุน SP ทั้งหมด) สิ่งที่เพิ่มคือที่มาของ event: heal/shield/resource/status/revive มี `action_id`/`source_instance_id`/`effect_id` เพื่อให้ tick และผลย่อยอ้าง cast ต้นทางได้ (ไม่เปลี่ยนตัวเลขต่อสู้) harness กลางรองรับ heal/shield/revive/ลูกแก้ว/periodic golden แล้ว
- ข้อจำกัด: ไม่ได้เพิ่มภาพใหม่ และตัวเลขเป็นหลักฐานพฤติกรรม ไม่ใช่ผลบาลานซ์ (TASK-041)

