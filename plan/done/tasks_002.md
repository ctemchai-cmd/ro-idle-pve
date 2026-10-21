# TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-001 — กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- อัปเดต `plan/design/02-combat-and-skills.md`
- `plan/data/combat-rules.json` และกรณีคำนวณอ้างอิง
- ลำดับ damage breakdown/หน่วย/เพดานของ ATK%, skill coefficient, crit, DEF/MDEF, penetration, guard, vulnerability และโล่ ตาม `plan/design/13-damage-crit-and-defense.md`

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

ระบุสูตร Status→ATK/MATK/HP/SP/DEF/ASPD/Cast Speed, hit/crit/ธาตุ, SI/CT/ACD/ตีปกติ พร้อมเพดาน Q-019 กำหนดคิวเดินระหว่าง Stun และรอที่ Action แล้ว; ออกแบบ ACD หลังถูกขัด/เมื่อ speed เปลี่ยน/normal-attack clock ที่เหลือ รวมลำดับเหตุการณ์เวลาเดียวกันและระบบ seed/virtual clock สำหรับ engine เดียวกับเกม ใช้ readiness/action restrictions แยกตาม design/14

## ขั้นตอนทำงาน

1. ออกแบบสูตรดาเมจ/ป้องกัน/hit/crit/ธาตุ/ฟื้น HP-SP และลำดับ bucket/rounding/caps พร้อมกรอบรับ status/CC ตามคำยืนยัน; catalog/policy รายสถานะเป็นงานต่อใน TASK-047
2. เขียนไทม์ไลน์คำนวณมือของ SP ไม่พอ สตั้นก่อน/ระหว่างร่าย CT=0 ช่องว่าง เป้าตาย บัฟ speed ระหว่างนับเวลา และการตาย/หมดเวลาที่เกิดพร้อมกัน
3. กำหนดเวลาเกม/ลำดับเหตุการณ์/RNG-state/rules version ที่ serialize ได้สำหรับ runner พร้อมตาราง sensitivity ของ ATK/คริ/เกราะ/เจาะเกราะ/ASPD ที่งบเท่ากันก่อนทำข้อมูลสกิล

## เกณฑ์ตรวจรับ

- [x] AC-01: สูตร stat/ดาเมจ/ฮีล/ฟื้น HP-SP/เวลา มีหน่วย ลำดับ flat-percent-multiplier/crit/DEF-MDEF/penetration/guard/shield/rounding และเพดาน; ระบุ eligibility ของ crit/หลาย hit/DoT โดยไม่คิดซ้ำหรือขึ้นกับ FPS
- [x] AC-02: ตีปกติได้ใน SI/ACD หยุดตอน CT ไม่มี cooldown แยก และ SP ไม่พอข้ามแล้วรอช่องถัดไป
- [x] AC-03: เริ่มร่ายนับใช้และหัก SP ไม่คืนเมื่อถูกขัด; สตั้นไม่กินช่องที่ยังไม่เริ่มและไม่ย้อนช่องที่เริ่มแล้ว; SI/ACD เดินถึง action gate ระหว่าง Stun หายแล้วร่ายเมื่อใช้ได้ ไม่เริ่ม SI ใหม่หรือสะสม action ยิงชดเชย
- [x] AC-04: มี case ID/input/ผลคาดหวังครบไทม์ไลน์เดิมและ damage breakdown ที่ crit/เกราะ/เจาะเกราะเป็นศูนย์-กลาง-ใกล้cap, โล่/multi-hit/DoT; เทียบงบและ DPS ต่อรอบคิวรวม ASPD/SP โดยแยก reference RO ออกจากสูตรเสนอ

## วิธีตรวจและหลักฐาน

ผลส่งมอบจริง: [baseline](../design/15-combat-baseline.md), [rules](../data/combat-rules.json), [cases](../data/combat-cases.json), [ตัวตรวจ](../checks/combat.py), [ผล review](../evidence/task-002-review.json)

review สูตรและไทม์ไลน์ด้วยการคำนวณอิสระ เทียบ D-004/D-013–D-019 และสัญญาใน design/08

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | ตรวจ derived8สูตร/ธาตุ100คู่/hit-crit/เกราะ-เจาะ-guard-โล่/roundingและresource bounds ตาม cases; python3 plan/checks/combat.py --write-report | plan/evidence/task-002-review.json: AC-01 pass, 72 checks overall | ผ่าน M0 design review |
| AC-02 | คำนวณ SI/CT/ACD/normal pause/CT0/SPไม่พอ/เป้าหาย/phase order ตาม expected traces; python3 plan/checks/combat.py --write-report | plan/evidence/task-002-review.json: AC-02 pass, 72 checks overall | ผ่าน M0 design review |
| AC-03 | ตรวจ action gate/cast-token/หักSP/ไม่คืน/interruptible และ CC ที่ไม่กินช่องที่ยังไม่เริ่ม; python3 plan/checks/combat.py --write-report | plan/evidence/task-002-review.json: AC-03 pass, 72 checks overall | ผ่าน M0 design review |
| AC-04 | เทียบ STR/AGI/LUKงบเท่ากัน6บิลด์ รวมSP demand/armor0–ใกล้asymptote/crit0–100%/LCG state/replay fields; python3 plan/checks/combat.py --write-report | plan/evidence/task-002-review.json: AC-04 pass, 72 checks overall | ผ่าน M0 design review |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 2

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- 19 ตุลาคม 2026: ส่ง review สูตร/clock/RNG/phase order/เป้าหาย/interrupt และ69เคสคำนวณ/trace contracts ไม่ใช่ผลรัน engine

- 19 ตุลาคม 2026: reviewรอบ1 พบSPregenติดลบได้เมื่อ debuffต่ำกว่า−100% และยังไม่ระบุ rounding/minimumของMaxHP/SPครบ เก็บ findingsใน task-002-review-round1.json แล้วกลับ inprogressเพื่อแก้ AC-01 โดยไม่ลดเกณฑ์

- 19 ตุลาคม 2026: reviewรอบ2 ผ่าน72เคสคำนวณ/trace contractsหลังแก้ findings; ย้ายเข้าdone ไม่ใช่การรับรอง engine/runtimeหรือบาลานซ์จริง
