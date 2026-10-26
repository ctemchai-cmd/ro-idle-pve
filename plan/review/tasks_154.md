# TASK-154 — เลือกย่อยการ์ดหลายใบในกระเป๋า

Milestone: M4 · D178 · design67

## งานที่ต้องรอก่อนหน้า
TASK-027, TASK-153 (done)

## ขอบเขตและผลส่งมอบ
แท็บการ์ดในกระเป๋ามีโหมดเลือกหลายใบ/เลือกทั้งหมดตามตัวกรอง/ล้างที่เลือก;แสดงจำนวนและผงรวม;ถามยืนยันก่อนส่งcard.salvageคำสั่งเดียว. ใช้confirmationร่วมกับย่อยทีละใบ. การ์ดล็อก/สวมอยู่เลือกไม่ได้.

## รายละเอียด
[design67](../design/67-bulk-card-salvage.md). รายการยืนยันล็อกIDsที่เลือก ตรวจstateล่าสุดทุกใบและไม่ย่อยบางส่วนเงียบๆ. เปลี่ยนตัวกรองล้างการเลือก;ไม่ปะปนgear/card. รองรับ500ใบตามschemaเดิม. ไม่แก้ราคา/สูตร/เรท/เซฟ/API.

## ขั้นตอน
1. ตรวจbatchcommandเดิม/แยกโหมดgearกับcard
2. ขยายsharedconfirmationและbulkselectionพร้อมmobilelayout
3. ทดสอบactualReact+reducers320390/500cardsและsingle-card153เดิม/atomicexistingtests
4. Rootbuild/M0/push/publicก่อนdone

## เกณฑ์ตรวจรับ
- [ ] AC-01: เลือก/ยกเลิก/เลือกทั้งหมดที่กรองได้ตามจริง;ล็อกและใส่อยู่เลือกไม่ได้;เปลี่ยนfilterไม่ย่อยของซ่อน;แสดงใบ/ผงรวม/ยืนยันพร้อมเตือนการ์ดอัปเลเวล
- [ ] AC-02: Cancelไม่ส่งคำสั่ง;ยืนยัน500ใบเป็น1command;กดย้ำไม่ซ้ำ/failedคงselection/เปลี่ยนstateแล้วป้องกันpartial;single-cardเดิม/TS/mobile/build/publicผ่าน ไม่มีownerwrites

## วิธีตรวจและหลักฐาน
T154-AC01/02;nativeactualReactพร้อมsharedreducerในmemoryและexisting slot-progression.test.ts;strictbuild/read-onlypublic. plan/evidence/task-154-review.json.

## Blocker / คำถาม
ไม่มี.

## ผลตรวจlocal

BulkUI4groupsและsingle-card/gachaเดิม4groups320390ผ่าน. 500ใบrender102cell/confirm8preview/เลือกครบ500/1command+1syntheticrevisionและผงรวมตรงreducer. Cancel/Escape/failed/liveprotectedchange/filterresetผ่าน. Existingatomic slot-progression testsผ่าน. รอbuild/publicก่อนdone.
