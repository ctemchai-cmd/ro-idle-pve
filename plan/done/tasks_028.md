# TASK-028 — ทำการผสม rarity และอัป tier ที่รักษาการลงทุน

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-027 — ทำ Refine Enchant และการ์ดประจำ slot

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- fusion/tier-up actions และหน้าพรีวิวผล/วัตถุดิบ

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ผสมสามชิ้น rarity/tier/slot เดียวกัน อาวุธชนิดเดียวกัน และทางอัป tier ใช้วัตถุดิบตามตารางเพื่อคง rarity Refine/Enchant/cards เป็นข้อมูล slot ตามเดิม ไม่อนุญาตกินของสวม/lock โดยไม่มีกติกาที่สเปกระบุ

## ขั้นตอนทำงาน

1. ทำ recipe validation/selection และ atomic consume/create
2. ทำ preview รวมผลของการอัป tier/rarity ต่อ stat และต้นทุน
3. ทดสอบคำขอซ้ำ/กระเป๋าเต็ม/rarity สูงสุด/วัตถุดิบผิด

## เกณฑ์ตรวจรับ

- [x] AC-01: สูตรถูกสร้างหนึ่งชิ้นขั้นถัดไปและใช้วัตถุดิบสามชิ้นตามกติกา; สูตรผิดไม่เปลี่ยน inventory
- [x] AC-02: อัป tier รักษา rarity ด้วยต้นทุนจริง และไม่ล้าง Refine/Enchant/cards ประจำ slot
- [x] AC-03: ของ lock/สวมและกรณี Supreme/ข้าม tier จัดการตาม spec ไม่ทำของหาย
- [x] AC-04: retry/response หายไม่เพิ่มของหรือกินทุนซ้ำ และ preview ตรงผลจริง

## วิธีตรวจและหลักฐาน

ตรวจ inventory/resource ledger ก่อนหลังทุก recipe ทั้งสำเร็จและถูกปฏิเสธ แล้ว reload จาก cloud

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `npm run check`; `RO_EVIDENCE_PREFIX=task-028 python3 scripts/test_auth_stack.py` | All six rarity steps exact3→1, numeric floor14/16/19/23/28/35; mixed/duplicate/missing IDs/protected recipes reject atomically. Actual UI chooses qa_a/b/c and creates oneUncommon after response loss. [review](../evidence/task-028-review.json) | ผ่าน |
| AC-02 | `npm run check`; `RO_EVIDENCE_PREFIX=task-028 python3 scripts/test_auth_stack.py` | Tier1→20→40→60 costs26000gold/170ore and preserves ID/rarity/lock/owner/slot/card state. Actual lockedEpic1→20 base19→105/PATK+86 preview agrees with committed save after lost response. [review](../evidence/task-028-review.json) | ผ่าน |
| AC-03 | `npm run check`; `RO_EVIDENCE_PREFIX=task-028 python3 scripts/test_auth_stack.py` | Fusion excludes equipped/locked/training and rejectsSupreme; tier permits locked but requires wearerlevel and exact nexttier; training cannotupgrade. Actual500bag fusion frees2spaces, retains fixed pending reward and pays original instance once. [review](../evidence/task-028-review.json) | ผ่าน |
| AC-04 | `npm run check`; `RO_EVIDENCE_PREFIX=task-028 python3 scripts/test_auth_stack.py` | Shared resolvedEquipmentModifiers and reducer preview beforeconfirm; actual replayUUID for fusion/tier creates/consumes/debits once.390/360 Chrome and offline/reconnect pass; decreases highlighted inred. [review](../evidence/task-028-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20ตุลาคม2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 20ตุลาคม2026: เริ่มหลังTASK-027ผ่าน4AC/227tests/full local10flow ทำfusion/tier reducer+shared quotes+beforeconfirm preview; fuseห้ามของสวม/lock/training, tierคงID/rarity/locked/slotและตรวจlevelผู้สวม ไม่มีส่วนลดหรือสุ่มใหม่

- ผ่าน4AC/233TS/build/real local full regression11flow รวมgrowth5flow; shared stat/source/recipe และimmutable receiptsตรวจด้วยresponse-lossทั้งfusionและtier ดู [review](../evidence/task-028-review.json), [runtime29](../design/29-rarity-and-tier-runtime.md)
