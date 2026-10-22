# TASK-101 — ไอคอน Upgrade EXP อาชีพ และใบธาตุจาก RO

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ

## งานที่ต้องรอก่อนหน้า

TASK-019, TASK-048, TASK-095, TASK-100 (done)

## เป้าหมายและผลส่งมอบ

ไอคอน Upgrade EXP อาชีพ และใบธาตุจาก RO ตามคำขอ22ต.ค.2026

## ขอบเขตและรายละเอียด

ใช้canonicaldata/sharedrulesและnativeROmetadata; ไม่รันbalancebatch ไม่อ่านprivateenv ไม่แตะownercloud/6173 ไม่มีSQLใหม่

## ขั้นตอนทำงาน

1. เก็บbefore/auditและเปลี่ยนauthorityเฉพาะส่วน
2. ต่อUI/metadataและตรวจfocusedrulesกับข้อมูลก่อนแก้
3. ตรวจมือถือจริงในisolatedChrome/build/publicdeployment แล้วreviewเกณฑ์

## เกณฑ์ตรวจรับ

- [x] AC-01: Nativeplus skilliconสำหรับUpgradeตามD-136/EXP/4ใบธาตุ/actualOriginprofessionemblems19โหลดได้และmappingตรงcatalog ไม่มีskill/item/customglyphfallbackสำหรับjobicons
- [x] AC-02: มือถือ320/390ไม่ล้นและpublicVercelส่งmapping/media/bundleตรงchecksum

## วิธีตรวจและหลักฐาน

Focused fixtures/static audit, isolatedChrome320/390 และpublicartifact SHA; เติมผลจริงก่อนdone

## Blocker / คำถาม

ไม่มี; ตัวเลขassistanttrialภายใต้คำขอ ไม่อ้างwhole-gamebalance

## บันทึกการทำงานและ review

เริ่ม22ต.ค.2026

- Local: M0/readiness8/build/type/boundaries/secrets/sourceassetchecks ผ่าน. 80unique focusedTSรวม378rawgoldensและmigration; ไม่มีbalancebatch. Staticauditเปลี่ยนเฉพาะAsuraSP/Blessingduration/Refineore คงFinger/ATK/gold/chance/ledger.

- Review23ต.ค.: 2/2ACผ่าน; publicVercel3groupsผ่าน API200SIN1/content/JS/6nativefilesSHA/manifest/login/nohostedwrites. Source`9f1bc77f8f73d4cf9331dd4be53e6e45fc83ccbf`. [หลักฐาน](../evidence/task-101-review.json)
- เก็บround1/2fixturesที่ผิดไว้: actorsเรียงตามIDไม่ใช่inputorder, immutablestateต้องclone, percentมีcomma และempty skill slotsถูกข้ามไม่เพิ่มSI; ไม่แก้productrulesเพื่อให้testผ่าน. Browserround1ใช้manifest.shell_visualsผิดชื่อจริงshell; finalตรวจ19actualdialogcomponents. Hostedround1public2groupsผ่านแต่temporaryPlaywrightหาย จึงติดตั้งtoolแยกในtmpและfinal3groupsผ่าน ไม่แก้เกณฑ์.

## Review failure23ต.ค.2026 — user rejected icon semantics

ผู้ใช้ปฏิเสธUpgrade lv_up_offและการนำskillartแทนอาชีพ. D-130selectionถูกยกเลิกสำหรับ2ส่วนนี้. รอบแก้ต้องใช้jobemblemจริงพร้อมcatalogmappingครบ19 ห้ามskill/item/customglyphfallback. Upgradeรอคำตอบtext-onlyหรือactualgameicon; sourceยังไม่พบที่ตรง. Preserveoldtechnicalpassเป็นประวัติ ไม่เท่ากับvisualacceptance.

D-136คำตอบล่าสุด: Upgradeให้หาskilliconที่มี+ได้ จึงใช้SM_MOVINGRECOVERY24px ตรวจภาพแล้ว; ปิดคำถามtext-only. Class19ใช้Origin UI_Common_Profession_Iconตามcatalogโดยตรง.

## Final review23ต.ค.2026

ActualChrome320/390/freshAuth-API-Postgres5groups,37Pythonassettests/M0/build/readiness8ผ่าน. PublicVercel3groupsตรวจ37iconpayloadSHA/bundles/pack/API200SIN1/anonymous401/login0writesผ่าน. Source`2d8ef07d16773ddb0a53874511d5a3d35c67521d`. [ผลตรวจ](../evidence/task-101-review.json). ภาพทดลองให้ผู้ใช้ดู ไม่อ้างว่าผู้ใช้อนุมัติหน้าตาแล้ว. ไม่มีSQL/env/content/save migrationใหม่.
