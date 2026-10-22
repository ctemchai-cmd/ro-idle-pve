# TASK-106 — ทดลองไอคอนสกิล modern ตามรายการผู้ใช้

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · design:35

## งานที่ต้องรอก่อนหน้า

TASK-019, TASK-024, TASK-030 (done)

## เป้าหมายและผลส่งมอบ

เปลี่ยน12logicalskill icons ตาม assets/modern/suggestion-migrate.txt; แสดงบนหน้าสกิล/สี่ช่อง/Timeline/buffรวมCallSpirit โดยไม่เปลี่ยนเกมเพลย์

## ขอบเขตและรายละเอียด

Acolyte4+Monk8ตามรายการ. Meditationคือacolyte_meditationที่Monkใช้ร่วมกัน ไม่สร้างสกิลใหม่. เก็บmetadata/source/hash/dimensions/explicitmapping. คัดเฉพาะ12ภาพลงruntimepack ไม่ลบหรือแก้ต้นฉบับของผู้ใช้ ไม่เอารูปmodernมาแทนjobemblems/Upgrade ไม่อ่านprivateenv/ownercloud ไม่restart6173

## ขั้นตอนทำงาน

1. อ่านรายชื่อ/inspect12ภาพตามmappingและเก็บsidecarsผ่านimporterlocalที่จำกัดassets/modern
2. เปลี่ยนpresentationiconrefsเท่านั้น พร้อมsourceauditเปรียบเทียบทุกfieldที่เหลือ
3. ตรวจM0/build/assets/importer/actualmobileและpublicartifact จดผลและภาพก่อนdone

## เกณฑ์ตรวจรับ

- [x] AC-01: ทั้ง12iconsตรงsourceที่ผู้ใช้ระบุและSHA/pixels/dimensions128pxเดิม; ไม่โหลดแอสเซตmodernทั้งคลัง; skilldefinitions/VFX/audio/status/formulas/enginecontenthashเดิม; Localpathescape/sourcechangeถูกปฏิเสธ
- [x] AC-02: actualมือถือ320/390หน้าสกิล/สี่ช่อง/Timeline/CallSpiritbadgeโหลดภาพใหม่ครบ ไม่มีoverflow/JSerror/inspectionwrite; build/assets/M0/readiness/publicVercelผ่าน พร้อมภาพให้ผู้ใช้ดู

## วิธีตรวจและหลักฐาน

Staticbeforeaudit+sourcehashchecks, importerunittest, realChromeactualcomponents/freshlocalAuthfixture และpublicreleaseSHA. เก็บtask-106-* ไม่ใช้owneraccount

## Blocker / คำถาม

ไม่มี — ใช้mappingผู้ใช้ตรงตัว ไม่อ้างว่าเป็นnativeROart

## บันทึกการทำงานและ review

เริ่ม23ต.ค.2026ตามคำขอทดลองภาพ. Nativeclass/Upgradeแก้ในTASK101แยกscope

## Final review23ต.ค.2026

ActualChrome320/390/freshAuth-API-Postgres5groups,37Pythonassettests/M0/build/readiness8ผ่าน. PublicVercel3groupsตรวจ37iconpayloadSHA/bundles/pack/API200SIN1/anonymous401/login0writesผ่าน. Source`2d8ef07d16773ddb0a53874511d5a3d35c67521d`. [ผลตรวจ](../evidence/task-106-review.json). ภาพทดลองให้ผู้ใช้ดู ไม่อ้างว่าผู้ใช้อนุมัติหน้าตาแล้ว. ไม่มีSQL/env/content/save migrationใหม่.
