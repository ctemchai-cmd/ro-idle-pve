# TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน

Milestone: M1 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [อาชีพ](../design/03-classes.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-016 — ทำไทม์ไลน์ต่อสู้ ตีปกติ และคิวสี่สกิล

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- effect/target/status/proc framework ตาม data contracts
- metrics events สำหรับดาเมจ/ฮีล/ป้องกัน/สกิลและ CC

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

รองรับ heal/overheal/shield, buff/debuff/DoT, provoke/targeting, interrupt/stun/cleanse/dispel และ Passive ตามข้อมูล generic แยก hook สำหรับกลไกเฉพาะอาชีพที่จะทำใน M3

## ขั้นตอนทำงาน

1. ทำ ordered effect handlers/status lifecycle/modifier/targeting ตาม TASK-047 พร้อม trace เจ้าของผลและ named formula registry ที่ simulation ใช้ร่วมกัน
2. ทำการยกเลิก cast event เมื่อถูกขัด รองรับ Chain CC ปกติและ Passive สะสม CC Resistance เฉพาะบอสที่ข้อมูลกำหนด
3. ตรวจขอบเขต proc/จำนวน event/สถานะตายและ metrics รวม

## เกณฑ์ตรวจรับ

- [x] AC-01: สตั้นก่อนร่ายไม่กินช่อง; ขัดหลังเริ่มไม่คืน SP/ย้อนคิว และ cast event เก่าไม่ออกผลภายหลัง
- [x] AC-02: ฮีลเลือก HP% ต่ำสุดแต่ยังใช้ตอนเต็ม; การเลือกแนวหน้า/Provoke/เป้าหายตรง spec
- [x] AC-03: stack/refresh/cleanse/dispel/หมดอายุตรง catalog, บัฟบวกไม่มี cap และคนเดิมร่ายซ้ำเพิ่ม instance แยกอายุตาม D-037/D-038; skill/item/card ใช้ pipeline เดียว outcomes ผูกแต่ละ target/hit; Chain CC ปกติ ไม่มี global immunity และบอสมี resistance เฉพาะข้อมูลกำหนด
- [x] AC-04: Passive ไม่กิน Active slot, proc ไม่วนไม่จบ และแยก effective heal/overheal/การป้องกันใน metrics

## วิธีตรวจและหลักฐาน

ทดสอบผลซ้อน/เป้าตาย/CC ซ้ำ/บัฟหมด, หมู่ A hit/B miss ไม่สตัน B, hit ที่ shield รับทั้งหมดตาม policy และถอน trait source เดียวไม่ลบอีกแหล่ง ตรวจยอด metrics กับ event log ที่รู้ผลคาดหวัง

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | real cast/CC/Stale-token/locked completion traces | [135tests + build/review](../evidence/task-017-review.json) | ผ่าน |
| AC-02 | lowestHP/fullheal/Provoke/front/missing target traces | [135tests + build/review](../evidence/task-017-review.json) | ผ่าน |
| AC-03 | 27statuses;independentbuffgolden;source removal;AoE outcomes;chainCC/optionalResistance | [135tests + build/review](../evidence/task-017-review.json) | ผ่าน |
| AC-04 | Passive0slots/ancestry/root-battlelimits;heal-shield-CC metrics | [135tests + build/review](../evidence/task-017-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 4

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation
- 19 ตุลาคม 2026: ปรับตาม D-037 ให้บัฟหลายผู้ร่ายบวกกันไม่มีเพดาน; เพิ่มเคส/วิธีตรวจโดยยังไม่เริ่มงานหรือผ่านเกณฑ์
- 19 ตุลาคม 2026: Q-022/D-038 ยืนยันคนเดิมร่ายซ้ำเพิ่ม independent instance แยกอายุ; ไม่มีคำถามชุด Q-001–Q-022 ค้าง งานยังอยู่ todo

- 19 ตุลาคม 2026: เริ่มหลัง TASK-016 ผ่าน; ทำ shared effect/status/selector/proc ก่อน runner และเดโมเว็บตาม TASK-020

- 19 ตุลาคม 2026: ผ่าน135tests/typecheck/boundaries/build; เพิ่มcheckpointproc countersและbattle_starttimerพร้อมrefreshM0schema evidence; ดู [engine contract](../../docs/COMBAT-ENGINE.md) Summonfactory/copy/ครบทุกclassยังเป็นงานM3ตามscope ไม่ได้อ้างว่า126สกิลเล่นครบหรือบาลานซ์แล้ว
