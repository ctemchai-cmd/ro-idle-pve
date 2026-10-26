# TASK-156 — การ์ดเวทระดับ MVP สองใบ

Milestone:M4 · D180 · [design69](../design/69-mvp-magic-cards.md)

## งานที่ต้องรอก่อนหน้า
TASK-155 (done);ใช้compiler/migrationเดิม.

## ขอบเขต
เพิ่มFallen Bishop4441/Time Holder4625เป็นLegendary MATK/SPtradeoff;ภาพจริง/คำอธิบาย/loot/gacha,ไม่แก้78ใบเดิมหรือทำbalancebatch.

## รายละเอียด
ตามdesign69;อัตราดรอป/rarity/pityเดิม คงoldAFKและ32MiB. ไม่มีengine/schema/SQL/envใหม่.

## ขั้นตอน
1. AuditPAtk/MAtkระดับสูงและตรวจprimaryROidentity/slot/art
2. Freeze78เดิม,เพิ่ม2specและregenชื่อ/pool/metadata/runtime
3. ตรวจactualeffects/RNG/oldAFK/gacha/native/source/build
4. Publishและตรวจเว็บจริงตามACครบก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01:2MVPจริงครบชื่อช่องภาพ/80cards/73portraits,78เก่า+raterulesคงเดิม,gacha/farm/oldAFKปลอดภัย
- [x] AC-02:MATK/SPtradeoff/ระดับ/stack/heal/physicalแยก/description/checkpointตรงกฎเดิม
- [x] AC-03:losslesspixel/source/native320390/32MiB/root-filteredbuild/M0/publicผ่าน ไม่มีownerwrites

## วิธีตรวจ
T156-AC01..03;tests/game/mvp-magic-cards.test.ts, native/hosted harness,sourcechecksและreview/evidence156.

## Blocker / คำถาม
ไม่มีคำถามค้าง;ผู้ใช้ขอเพิ่ม2ใบและระดับสูงแล้ว.

## ผลตรวจรับ
Source`4611a0f39` live/VercelSUCCESS;740full/17focused/native5/source311+60460+6926/root-filtered/M0/public4groups(4newnativefiles/24bundleSHA/login320390/0errors-writes)ผ่าน. ทุกACผ่าน;ดูevidence156/READMEและreview.json.
