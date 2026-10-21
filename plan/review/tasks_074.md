# TASK-074 — Option อุปกรณ์อ่านเป็นบรรทัดและเลือกอาวุธเฉพาะอาชีพ

Milestone: M4 · อ้างอิง D-100

## งานที่ต้องรอก่อนหน้า

- TASK-026, TASK-053: equipment/options (done)
- TASK-066: mobile UI/virtualized inventory (done)

## เป้าหมายและผลส่งมอบ

ผู้ใช้ขอOptionเสริมเรียงบรรทัดสวยมีสี และตอนเลือกสวมอาวุธให้มีเฉพาะอาชีพตัวเองใช้ได้ เปลี่ยนpresentation/filterเท่านั้นไม่เปลี่ยนroll/value/rarity/ราคา/เซฟ

## ขั้นตอนทำงาน

1. SharedOptionLinesเป็นรายการหนึ่งstatต่อบรรทัด label/valueชิดคนละด้าน ใช้สีอ่านง่าย/ตัวเลขตรงกันทุกหน้า ปรับสีnegative/percentตามค่าจริงและหน้าmobile320pxไม่ล้น
2. ChangeSheetweaponfilterจากweapon_compatibility+definition.weapon_type รวมอาวุธlevelสูงที่อาชีพถูกแต่ยังเตือนlevelตามเดิม; เปลี่ยนตัวละคร/คลาสแล้วlistตรง ไม่มีผลกับกระเป๋ารวม
3. ตรวจactualChromefixtureมีหลายfamily/options1–5line ตรวจequipจริงและreload ภาพมือถือ/หน้ารายละเอียดก่อนpush/hosted ไม่มีgameplaycontentchangeจากงานนี้เอง

## เกณฑ์ตรวจรับ

- [x] AC-01: Optionทุกบรรทัดแยกlabel/valueและมีสีชัดทั้งรายละเอียดในbag/ช่องอุปกรณ์/เลือกเปลี่ยนของ ค่าตรงsharedmodifierเดิม ไม่เปลี่ยนroll/เซฟ หน้า320/390pxไม่ล้นและไม่มีemojiใหม่
- [x] AC-02: หน้าเลือกอาวุธแสดงเฉพาะfamilyที่jobใส่ได้ แม้ของต่างfamilyจะlevelสูง/อยู่กับเพื่อน; ของfamilyถูกแต่levelสูงยังบอกเงื่อนไขได้ สลับตัวละคร/คลาสแล้วfilterตรง ใส่และreloadค่าตรง
- [ ] AC-03: actualisolatedmobileChrome/productionbuild/type/boundaries/secrets/hostedผ่าน ไม่มีSQL/env/ownerwrite/restart6173หรือเพิ่มAPIจากการดู/กรอง

## วิธีตรวจและหลักฐาน

ActualisolatedAuth/Postgres/mobileChrome withmultiweapon/optionsfixture ตรวจDOM/bounds/ค่าจริง/equip/reload และภาพที่เปิดดูจริง; build/hosted ไม่เพิ่มtestที่เลียนCSS

## Blocker / คำถาม

ไม่มี

## ผลตรวจจริง

ผ่านactualmobileChromeบน320/390pxทุกOption1–5บรรทัด/หลายfamily/equip/reload/ไม่มีinspectionAPI และbuild/type/boundaries/secrets รอhostedหลังpush

หลักฐาน: `plan/evidence/task-073-074-ui-live.json`, `task-073-local-stack.json`, `task-073-card-targeted.txt`, `task-073-rules.txt`, `task-073-build.txt`, `task-073-presentation.txt` และภาพในevidenceที่เปิดดูจริง; ACที่รอhostedยังไม่ผ่าน
