# TASK-126 — ใส่อุปกรณ์ที่ดีกว่าทุกช่องในครั้งเดียว

Milestone: M4 · D156 · [design46](../design/46-equip-upgrades.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-026, TASK-063, TASK-096, TASK-116 (done).

## เป้าหมายและผลส่งมอบ
หน้าอุปกรณ์ตัวละครมีปุ่มใส่ของที่มีแจ้งเตือนดีกว่าครบทุกช่องในคลิกเดียว/คำสั่งเดียว.

## ขอบเขตและรายละเอียด
เฉพาะตัวละครที่เลือก ไม่ดึงของที่ใครสวมอยู่ ไม่เปรียบเทียบstat/options. เกณฑ์เดิมlevelก่อนrarityที่levelเท่ากัน;ช่องว่างได้ของที่เหมาะสม. Refine/Enchant/การ์ดคงที่slot. NoSQL/env/balancebatch/ownerwrite/6173restart. Hi-classงาน122–125ยังแยกและไม่เปิดก่อนพร้อม.

## ขั้นตอนการทำงาน
1. ย้ายกฎrecommendationเป็นpure build helperให้indicator/client/serverใช้ร่วม
2. เพิ่มequipment.equip_upgrades paramsแค่character_id/คำนวณจากstateจริง/atomicreceiptและoptimisticpreviewเดียว
3. เพิ่มปุ่มเล็กพร้อมจำนวนช่องในBuddy;ตรวจinbattle/ไม่มีของ/ต่างอาชีพ/ของคนอื่น/fullbag/ทุนเดิม
4. unit/build/readiness/realAuth-SQL-mobile320390/onewrite+reload→push→publicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: คำแนะนำกับserverใช้helperเดียวกัน;เทียบTierก่อนrarityเมื่อTierเท่ากัน/เฉพาะใส่ได้และยังไม่มีเจ้าของ/ไม่เลือกจากoptions/lockedยังใส่ได้
- [x] AC-02: คลิกเดียวเปลี่ยนเฉพาะช่องที่มีhintของตัวที่เลือก;หนึ่งatomiccommand/receipt/revision/optimisticpreview,ไม่แตะNPCอื่น/inventorypayload/ทุน/Refine/Enchant/cards และไม่ทำของหาย
- [x] AC-03: ไม่มีของ/actorหาย/inbattle/เกินlevel/อาวุธผิด/duplicate request/CASconflict/response lossมีผลที่ชัด;fullbagยังใส่ได้เพราะไม่เพิ่มinventory;ไม่มีpartialset
- [x] AC-04: ปุ่มmobile320390อ่านง่าย/ไม่ล้น/หายแจ้งเตือนเมื่อใส่แล้ว;targeted/build/boundaries/readiness/realAuth-SQL-mobile+hostedผ่านก่อนdone

## วิธีตรวจและหลักฐาน
T126-AC-01–04 ในacceptance-matrix. Unit pure selection/reducer/preview/schema/receipt replay;disposable realSQL/Auth/API/mobileต้องวัดหนึ่งcommandsPOST/หนึ่งrevision+reload. Hostedpublicไม่เข้าบัญชีowner.

## Blocker / คำถาม
ไม่มี

## บันทึกการทำงานและ review
- เริ่มจากคำขอผู้ใช้ระหว่างทำHi-class;ไม่ยกเลิกงานHi-class.

- Local18targeted/build/boundaries/M0และactualAuth/API/Postgres/Chrome320390ผ่านfinalr4:หนึ่งPOST/หนึ่งrevision/หนึ่งreceipt,ครบ6slots/ทุนและNPCคงเดิม/reload;ตอบกลับหลุด320ต้องกดเชื่อมต่อใหม่ตามofflinepolicyแล้วรับreceiptเดิมโดยไม่POSTซ้ำ. Viewed320. Failedharnessesเก็บ:r1ไม่เลือกเซฟหลังreload;r2กดnavซ้ำปิดBuddyที่URLจำไว้;r3คาดreconnectอัตโนมัติแทนปุ่มตามflowจริง. ไม่มีการแก้productformulaเพื่อตามtest. รอfilteredbuild/push/hostedAC04.

- Hosted:source76723725ae8190d8c4b2cbad9994f0f973ac9001 VercelSUCCESS https://vercel.com/chanon2/ro-idle-pve/AiKQ8BDGThi5juKKaoZg3jfPw8TG;public4groupsผ่านAPI200SIN1/currentcontent/packเดิม/ownerendpoints401/24bundleSHA/ปุ่มและcommandจริง/sharedTimeline-mobile0writes. Root+filteredbuild588375gzipเหมือนกัน;ไม่SQL/envหรือเข้าowneraccount.
