# TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-023 — ทำ roster ทีม Status เลเวลและการเปลี่ยนคลาส

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- หน้า skills/upgrade/loadout และ preview เวลา/ค่า SP
- ข้อมูลสกิลต่อ character ที่คงอยู่ในเซฟ

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ทำ UI/ข้อมูล/validation การเรียนทุกสายตาม M0 และพิสูจน์การเชื่อม engine ด้วยสกิล Class 1/Passive ที่ generic effects ของ TASK-017 รองรับ เรียน/อัปตาม cap ใส่ Active สี่ช่อง แสดง timing ก่อนเลือก ผลเฉพาะอาชีพตรวจครบใน TASK-029–034 และ TASK-041 ไม่ใช้ความครบของ runtime ทุกสายเป็นเงื่อนไขย้อนกลับมาบล็อกงานนี้

## ขั้นตอนทำงาน

1. ทำ validation unlock/cap/cost/active-passive และเปลี่ยนลำดับ โดย Q-020 ห้าม logical skill เดียวกันซ้ำหลายช่อง
2. ทำหน้าแสดงรายละเอียด/preview คิวและการอัป
3. เชื่อมกับ roster/cloud/engine และทดสอบสลับตัว/สายด้วย Class 1 fixtures ที่ generic effects รองรับ; ระบุรายการผลเฉพาะสายที่ TASK-029–034 ต้องเติม

## เกณฑ์ตรวจรับ

- [x] AC-01: ตัวละคร Lv.ต่ำอัปข้าม skill cap ไม่ได้ คิดราคา/คืนทุนตามข้อมูลและ retry ไม่เสียของซ้ำ
- [x] AC-02: Active มีสี่ช่องเรียงวนได้และ logical skill เดียวกันใส่ได้หนึ่งช่องตาม Q-020; Passive ไม่กินช่องและส่งเข้าข้อมูล actor อัตโนมัติ; fixture Passive พื้นฐานมีผลจริง ส่วนผลเฉพาะสายตรวจใน TASK-029–034
- [x] AC-03: UI แสดง CT/ACD/SP/ผลต่างก่อนเปลี่ยน ไม่มีการตั้งเงื่อนไขใช้รายช่อง
- [x] AC-04: คิว/ระดับสกิลของ main และ NPC นอกทีมโหลดกลับได้ถูกต้อง และไม่เปิด Awaken ในรุ่นแรก

## วิธีตรวจและหลักฐาน

ตรวจค่าในหน้าจอกับข้อมูล/engine แล้วทดลองคิวจริง รวม SP ไม่พอและฮีลตอนเต็ม HP

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | 126 player price tables/max levels/branch/unlock/cap checked; real API rejectsLv3 atchar10/cap2, real lost-response upgrade pays50gold/10manual once; reset returns exact paid cost. | [review](../evidence/task-024-review.json) · [real browser](../evidence/task-024-skills-live-browser.json) · [208tests](../evidence/task-024-check.txt) | ผ่าน |
| AC-02 | Four ordered slots/empty slots/duplicate/passive/exclusive-copy group rejected; UI swaps IDs; actual engine automatically attaches learned Sword Mastery and increasesphysical_attack; cast order verified. | [review](../evidence/task-024-review.json) · [real browser](../evidence/task-024-skills-live-browser.json) · [208tests](../evidence/task-024-check.txt) | ผ่าน |
| AC-03 | Shared math CT/ACD/SP/level-effect deltas and only USED selector targets inUI; all class previews noNaN; actual mobileicons and before/after power140→148.89% tested; no conditional AI holding controls. | [review](../evidence/task-024-review.json) · [real browser](../evidence/task-024-skills-live-browser.json) · [208tests](../evidence/task-024-check.txt) | ผ่าน |
| AC-04 | Actual SQL+Chrome main loadout/levels/Passive and off-team MageLv6/FireBolt2/reversedslots survive reload; noAwaken. Offline disables spending and reconnect restores currentcloud. | [review](../evidence/task-024-review.json) · [real browser](../evidence/task-024-skills-live-browser.json) · [208tests](../evidence/task-024-check.txt) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- 20ตุลาคม2026: เริ่มหลังTASK-023ผ่าน4AC/201tests/real local roster มีtyped skill commands/actual-paid ledger/SaveControllerเดิมเป็นฐาน จะตรวจengineด้วยClass1/passiveทั่วไป ไม่อ้างผลเฉพาะทุกสายก่อนTASK-029–034

- 20ตุลาคม2026: ผ่าน4AC/208tests+7targeted/build และ real local Auth/SQL/Chrome save+roster+skills flows ตาม [review](../evidence/task-024-review.json) / [runtime25](../design/25-skill-runtime.md) รวม lost-response/off-team/Passive/loadout/refund/offline; ไม่อ้างว่าengineผลเฉพาะครบทุก126สกิลแล้ว
