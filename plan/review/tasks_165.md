# TASK-165 — ร้านหินรายวัน

Milestone:M4 · D189 · [design78](../design/78-crafting-shop.md)

## งานที่ต้องรอก่อนหน้า
TASK-139, TASK-163 (done).

## ขอบเขต
ผู้ใช้เลือกเฉพาะหินและร้านก่อน;ไม่เพิ่มEventในรอบนี้. ซื้อoption_stone8000goldวันละ3,rarity_stone20000goldวันละ2. เดิมทุกoffer/สิทธิ์ซื้อคงเดิม. Bangkokday00:00. stock/purchasesแยกตามเซฟ.

## รายละเอียด
เพิ่มtypedcrafting_grantในshopoffer ใช้purequote/max/reducer/CASเดิม. ทั้งbatchตรวจเงิน/stock/rightsก่อนจ่าย. buymaxคำสั่งเดียว. UIไอคอนหิน+จำนวนคงเหลือ/ในคลัง.

งบถ้าซื้อเต็ม2ชนิด=64000gold/วัน เทียบAFKบท6ประมาณ326052gold/12h. หินRarity2ต่อวัน→Epic→Legendary2วันต่อชิ้น/ทีม24ชิ้น48วันถ้าไม่มีdrop/fusionช่วย;หนึ่งตัว6ชิ้น12วัน. Immortal6วัน/Supreme15วันต่อชิ้นจากระดับก่อน. วางเป็นทางเสริมที่แน่นอน โดยระดับสูงยังใช้drop/fusionร่วมได้.

## ขั้นตอน
1. เก็บbaseline/ออกแบบและtypedcontracts
2. ทำsharedreducers/UI/migration
3. ตรวจunit/actualcommands/native/build/publicแล้วpublish

## เกณฑ์ตรวจรับ
- [x] AC-01: exactoffers/oldoffers/quote/max/overflow/no partial purchase
- [x] AC-02: Bangkokreset/2saves/reload/one revision/retry
- [ ] AC-03: nativeStore320390/icons/cost/stock/M0/build/public

## วิธีตรวจ
Disposablecommand/nativefixturesและevidenceเฉพาะงาน.

## Blocker / คำถาม
ไม่มี;ผู้ใช้กำหนดขอบเขตแล้ว.
