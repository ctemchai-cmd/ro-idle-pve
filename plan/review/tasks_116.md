# TASK-116 — เครื่องหมายของดีกว่าเป็นลูกศรขึ้นสองชั้นสีเขียว

Milestone: M4 · D149

## งานที่ต้องรอก่อนหน้า
TASK-096, TASK-112 (done).

## ขอบเขตและรายละเอียด
เปลี่ยนเฉพาะtagในรายการเปลี่ยนของเป็นSVGchevrons-upสีเขียว ไม่มีพื้นหลังbadge. จุดแจ้งบนช่องสวมและlogicrecommendationเดิม.

## ขั้นตอน
1.แก้data/sharedrulesหรือpresentationจากsourceจริง
2.ตรวจกรณีเปลี่ยนบท/saveเดิม/readonlyUIตามขอบเขต ไม่อ่านownerenvหรือเขียนownercloud
3.build/readinessและpushmain→publicsmoke→บันทึกผลและย้ายdone

## เกณฑ์ตรวจรับ
- [x] AC-01: รายการเปลี่ยนอุปกรณ์ใช้double-chevron-upสีเขียว ไม่มีข้อความดีกว่าที่มองเห็นและไม่มีป้ายแดง;มีaccessiblelabelเดิม
- [ ] AC-02: เกณฑ์เทียบเลเวล/rarityและการสวมไม่เปลี่ยน ตรวจmobile320/390และbuild/publicก่อนdone

## วิธีตรวจและหลักฐาน
TargetedTS+productionbuild/M0;disposablelocalAuth/API/Postgres/Chrome320390และpublicread-only ไม่restart6173/ไม่รันbalancebatch. ผลจริงเติมเมื่อรันเสร็จ

Localผ่าน:54targetedTS/M0/build/secrets223/actualAuthAPI-SQL-mobile3groups. ดู[review](../evidence/task-116-review.json). รอhostedก่อนปิดเกณฑ์สุดท้าย
