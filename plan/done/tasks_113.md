# TASK-113 — ยกเลิกอัป Tier อุปกรณ์

Milestone:M4 · D146

## งานที่ต้องรอก่อนหน้า
TASK-028, TASK-040, TASK-111 (done). ผู้ใช้ให้เอาระบบอัปTierออกระหว่างงานperformance112 จัดทำร่วมpatchโดยไม่ปรับดรอปหรือพลังอุปกรณ์.

## ขอบเขต/รายละเอียด
ถอดปุ่ม/preview/คำอธิบายชวนอัปTier;ปิดคำสั่งequipment.tier_upด้วยรหัสที่ชัดเจนก่อนจ่ายทรัพยากร. ผู้ใช้ยืนยันกาชาอุปกรณ์ยังออกTierสูงได้เหมือนเดิม. อุปกรณ์Tierสูงต้องเป็นชิ้นใหม่จากการได้ของ ไม่ยกระดับdefinitionIDของชิ้นเดิม. ของเก่า/rarity/options/refine/enchant/cards/history/paidledgerเก็บครบ ไม่downgrade/refundเก่าหรือreroll. Fusionrarityไม่เปลี่ยนTier. บันทึกcontractretiredcommandเพื่อreplayreceiptเก่าได้ตามเดิม.

## ขั้นตอน
1.ปิดpolicyจากdataและserverpurequote/reducer;UIหยุดคำนวณtierpreview
2.ตรวจpendingUUID/oldreceiptคืนผลเดิมแต่คำสั่งใหม่ไม่หักทุนหรือแปลงของ
3.ทดสอบdropgearTier20/40/60ยังได้และใส่ตามเลเวลได้,migrationเก็บชิ้นที่เคยอัปTier,fulltargeted/build/realmobile+public

## เกณฑ์ตรวจรับ
- [x] AC-01:ไม่มีปุ่ม/preview/tierupcopyในproduct;APIใหม่ปฏิเสธก่อนwallet/itemsเปลี่ยน;fusionคนละTierยังไม่ได้
- [x] AC-02:oldtieritems/options/slotcards/ledgerคงเดิม,oldreceiptReplayเดิม,version/pending/migrationไม่ทำของหายหรือหักซ้ำ
- [x] AC-03:dropnewhigherTier/equipพร้อมUIเก็บค่าช่อง,tests/build/localAPI-mobile/publicผ่านโดยไม่มีownercloudwrite

## หลักฐาน
ปิด Tier ผ่าน policy จากdataร่วมquote/reducer, UIทั้ง/playและ/rosterไม่มีปุ่ม/preview;gacha20/40/60ยังสร้างของชิ้นใหม่. ActualAPIเก็บwallet/buildคงเดิมเมื่อreject/retry/oldreceipt และChrome320/390เปลี่ยนชิ้นใหม่คงRefine/Enchant.

ตรวจ local ผ่าน 23ต.ค.2026: 564TS/M0/readiness8/build และactualAuth/API/Postgres/Chrome320–390 ตาม [review](../evidence/task-113-review.json). ขึ้นVercelแล้ว source`8b6d64d40`;public4groupsผ่าน API200SIN1/newcontent/5bundleSHA/retiredTier+4slot rules/login0writes จึงปิดเกณฑ์ครบ
