# TASK-026 — ทำ inventory อุปกรณ์และค่าต่อสู้จากของสวม

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [อาชีพ](../design/03-classes.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-023 — ทำ roster ทีม Status เลเวลและการเปลี่ยนคลาส

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- inventory/item instances/equip actions และหน้ากระเป๋า/สวมใส่
- การรวม equipment stats เข้าสู่ combat snapshot

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

รองรับหก slot และชนิดอาวุธตามอาชีพ แยก item จากการพัฒนา slot จัดการ lock/ย้ายของ/กระเป๋าเต็มตามสเปก และแสดง timing/stat preview ก่อนเปลี่ยน

## ขั้นตอนทำงาน

1. ทำ item instance/storage/equip rules โดยใช้ modifier/trigger/effect resolver ที่ผ่าน TASK-017 ตาม schema TASK-047 ไม่คำนวณไอเทมเป็นสูตรอีกชุด; definition/instance/slot source แยกตาม design/14
2. ทำ UI เปรียบเทียบ/สวม/ถอด/ย้าย/lock
3. ตรวจ NPC นอกทีมและ save persistence ของ item/slot

## เกณฑ์ตรวจรับ

- [x] AC-01: หก slot ใส่ตาม level/weapon restriction และไม่เกิด item instance ซ้ำเมื่อย้ายระหว่างตัว
- [x] AC-02: เปลี่ยนของใช้ stat ของชิ้นใหม่และคง Refine/Enchant/cards ที่ slot ของตัวเดิม
- [x] AC-03: กระเป๋าเต็ม/ของ lock/อาวุธผิดชนิดมีผลตาม spec ไม่ทำ item หาย
- [x] AC-04: ตัวเลข preview ตรง combat snapshot และ reload คง owner/equipment ถูกต้อง

## วิธีตรวจและหลักฐาน

ใช้ inventory fixtures และ browser equip/swap flows ตรวจ item IDs, resource ledger และ stat ที่ engine อ่าน

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `npm run check`; `RO_EVIDENCE_PREFIX=task-026 python3 scripts/test_auth_stack.py` | Six slots and all19weapon job mappings, level/slot rejects; actual off-team Mage borrows Acolyte staff through Chrome, original slot empty and one canonical instance. [review](../evidence/task-026-review.json) | ผ่าน |
| AC-02 | `npm run check`; `RO_EVIDENCE_PREFIX=task-026 python3 scripts/test_auth_stack.py` | Common60→Epic60 changes base190→285 only; Refine10/Enchant2/GoldCard5 stay on main slot; actual battle PATK equals UI, separate owners keepRefine4/2; empty slot dormant. [review](../evidence/task-026-review.json) | ผ่าน |
| AC-03 | `npm run check`; `RO_EVIDENCE_PREFIX=task-026 python3 scripts/test_auth_stack.py` | 500-item fixture retains exact pending drop and refuses purchase/claim; equip/unequip/unlock/salvage still usable. Protected batch rejects atomically; training discard zero; immutable removed IDs. [review](../evidence/task-026-review.json) | ผ่าน |
| AC-04 | `npm run check`; `RO_EVIDENCE_PREFIX=task-026 python3 scripts/test_auth_stack.py` | Shared compiler preview matches engine stats and skill CT/ACD; actual lost-purchase response reconciles one item/125gold once, reload preserves owners and progression, offline mutation disabled. [review](../evidence/task-026-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20ตุลาคม2026 · รอบ review: 2

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- 20ตุลาคม2026: เริ่มหลังTASK-025ผ่านครบM2 ทำshared inventory rules/assignment/lock/salvage/training purchase พร้อมequipment compilerที่ใช้ทั้งpreviewและStory โดยไม่เพิ่มimportย้อนทิศbuild→progression; Refine/Enchant/card commandsยังตามTASK-027 แต่compilerรักษาslot sourcesเมื่อเปลี่ยนของ

- ผ่าน4AC/220TS/build และreal local Auth/API/SQL/Chromeครบ9flow ดู [review](../evidence/task-026-review.json) / [runtime27](../design/27-equipment-runtime.md); round1พบตัวตรวจเทียบJSONkeyorderผิด แก้canonical comparisonแล้วรันทั้งชุดผ่าน ไม่มีการแก้เกณฑ์หนีผลตรวจ
