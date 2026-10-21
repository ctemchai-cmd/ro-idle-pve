# TASK-027 — ทำ Refine Enchant และการ์ดประจำ slot

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [เลเวลและอุปกรณ์](../design/04-progression-and-equipment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน
- TASK-026 — ทำ inventory อุปกรณ์และค่าต่อสู้จากของสวม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- หน้าพัฒนา slot/ใส่ถอดอัปการ์ด
- ผล stat/effect จาก Refine/Enchant/card ใน combat

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ทำ Refine สูงสุด+10, Enchant และช่องการ์ด 1→2 ที่+5→3 ที่+10 ผูกกับแต่ละตัว ไม่ผูก item/ช่องทีม การ์ดซ้ำและผลทับซ้อนตามข้อมูลสเปก

## ขั้นตอนทำงาน

1. ทำ upgrade/roll/cost/socket validation และ atomic changes
2. ทำ UI preview/ถอดสลับ/อัปการ์ดและ slot growth
3. ตรวจผลใน engine และหลังเปลี่ยนของ/ถอด NPC

## เกณฑ์ตรวจรับ

- [x] AC-01: ช่องการ์ดปลดตรง +5/+10 และไม่เกิน Refine+10 ในรุ่นแรก
- [x] AC-02: Refine/Enchant/การ์ดยังคงที่ตัว/slot เมื่อเปลี่ยนของหรือถอดทีม
- [x] AC-03: ต้นทุน/การ์ดซ้ำ/stack ตรงข้อมูลและ retry ไม่กินของหรือเพิ่มระดับซ้ำ
- [x] AC-04: ผลเปลี่ยน ASPD/Cast Speed/สกิลตรง preview และ engine ตามphase snapshot/ความละเอียด1msและsafe-number domain โดยไม่เพิ่มเพดานบัฟ

## วิธีตรวจและหลักฐาน

ทดสอบ slot growth/card conflicts, เปลี่ยน item/NPC และ reload พร้อมเทียบ combat fixture ก่อนหลัง

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `npm run check`; `RO_EVIDENCE_PREFIX=task-027 python3 scripts/test_auth_stack.py` | Pure and actual Chrome4→5/9→10 gates; card capacity1→2→3, Refine+10 exact77000gold/275ore, max11 schema reject and no debit. [review](../evidence/task-027-review.json) | ผ่าน |
| AC-02 | `npm run check`; `RO_EVIDENCE_PREFIX=task-027 python3 scripts/test_auth_stack.py` | Shared slot compiler preserves independent character+slot investments through gear/NPC/card transfer and empty slots; actual off-team transfer retains mainRefine10 and each owner. [review](../evidence/task-027-review.json) | ผ่าน |
| AC-03 | `npm run check`; `RO_EVIDENCE_PREFIX=task-027 python3 scripts/test_auth_stack.py` | Card duplicates add independently,1→5 total7500gold/300dust; salvage20/40/80 byrarity only, protected batches atomic. Actual lost-responseRefine/refund and sameUUID card replay pay/refund once; old-price100gold/2dust archived in receipt. [review](../evidence/task-027-review.json) | ผ่าน |
| AC-04 | `npm run check`; `RO_EVIDENCE_PREFIX=task-027 python3 scripts/test_auth_stack.py` | Shared Precision primaryDEX→Cast Speed→SI/CT/ACD preview matches actual battleDEX2/Cast101.5 with manualDEX1 unchanged; bounded active ledger, no new speed/buff cap and existing timing/phase tests stay passing. [review](../evidence/task-027-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20ตุลาคม2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- TASK-014ตรวจรวม: แก้คำว่าเพดานความเร็วที่ค้างจากproposalให้ตรงD-037/สูตรจริง ไม่มีupperbuffcap; เกณฑ์ยังรอruntimevalidationตามเดิม

- 20ตุลาคม2026: เริ่มหลังTASK-026ผ่าน4AC/220tests/real local equipment flow เพิ่มslot/card reducers+preview และปิดruntime ledger-compactionตามsave-contracts: active scopesรวมactual-paid vector/historyออกreceipt ไม่สะสมrefundedrowsในaccount; ตัวตรวจเก่าปรับไปยืนยันimmutable refund receiptแทนJSONhistoryในเซฟ

- ชุดเฉพาะผ่าน227TS/buildและreal Auth/API/SQL/Chrome6flow:Refine response loss/ช่อง+5+10/cardsซ้ำ+ย้าย/Precision engine parity/old-price refund เก็บpreflight evidenceแยกไว้ กำลังตรวจregressionรวมก่อนย้ายreview/done

- ผ่าน4AC/227TS/buildและreal local full regression10flow รวมactualslots6flow; หลักฐานราคาเก่า/refundreceipt/slotowner/ภาพ390และ360อยู่ [review](../evidence/task-027-review.json), สัญญาruntime [28](../design/28-slot-and-card-runtime.md)
