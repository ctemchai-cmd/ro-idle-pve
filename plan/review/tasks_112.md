# TASK-112 — ความลื่น โหลด เปลี่ยนหน้า และอัปเกรดมือถือ

Milestone:M4 · D144 · งานperformanceเฉพาะที่ผู้ใช้จัดลำดับก่อนบาลานซ์/Hi-class

## งานที่ต้องรอก่อนหน้า
TASK-019, TASK-020, TASK-039, TASK-066, TASK-111 (done).

## ขอบเขต/รายละเอียด
TASK-041ผู้ใช้ทดสอบเอง ไม่บล็อกงานนี้ตามD144. TASK-042เป็นfullqualitygateรวมSafari/stress/RGBA;รายงานจาก112นำไปใช้ได้แต่ไม่ถือ042doneโดยไม่มีหลักฐานครบ.
วัดbaselineproduction/Chromeมือถือ390×844,CPU4x/network10Mbps100ms,matchedfixture500itemsและbuildเดิม. แยกcoldJS/validation/assetloading,navpointer→paint,upgradepreview→confirmed/networkDB. แก้คอขวดจากprofileคงengine/content/economy/saveguarantees. ไม่อ่านenvเจ้าของ/ไม่ใช้ownercloudsave/ไม่restart6173. Hi-classแค่บันทึกdesign40ตอนนี้.

## ขั้นตอน
1.profileactualcurrentbundle/isolatedteststate ก่อนแก้;เก็บtimings/callprofile/networkcounts
2.ตัดvalidation/compute/render/assetงานซ้ำที่ชี้ได้;cacheเฉพาะimmutabledefinitionsหรือimmutablebuildidentity,ไม่cacheAuthownerstateข้ามเซฟ
3.วัดmatchedbeforeafterและตรวจinvalidateเมื่อสลับเซฟ/อัป/เปลี่ยนของ;serverHTTPยังเป็นsaveเดิม
4.targetedtests/build/boundaries+actualmobile/API/SQLregressionsและpublicdeploy;บันทึกสิ่งที่วัดไม่ได้ตรงไปตรงมา

## เกณฑ์ตรวจรับ
- [x] AC-01: baseline/afterloadfirst/cachedพร้อมnetwork/build/CPUและbytes,profileชี้rootcauseจริง;ไม่เรียกfixtureว่าAndroidผู้ใช้
- [x] AC-02: matchednav500items+Stats/Skills/character switchดีขึ้นหรืออยู่≤150msp95บนCPU4x,0navigationAPI,no staleafterupgrade/equipment/save switch
- [x] AC-03: deterministicupgradeเห็นpreviewก่อนreply,pending/replay/confirmationหลักเดิม;แยกCPU/hash/DB/networkและไม่อ้างlocalเป็นcloudlatency
- [ ] AC-04: render/farm/Boss/SFX/memoryเหมาะสมและengineoutcomeunchanged;targeted/build/actualUI/sharedsave/publicproofผ่านโดยไม่แตะบาลานซ์หรือownerdata

## ผล/หลักฐาน
Productionmatchedfixture: cold12523→4699ms/cached8949→4342ms,navp9595→107ms(ยัง≤150)และ0API,upgradepreview503→398msก่อนreply;60sfarmmax649.8→83.4ms. Actual500items/scroll/filter/bulk/equip/level/skillsและ10save-switchpassed. ข้อจำกัดfullTASK042/actualAndroid/cloudtimingยังเปิดอยู่ ดูperformance-summaryและreview.

ตรวจ local ผ่าน 23ต.ค.2026: 564TS/M0/readiness8/build และactualAuth/API/Postgres/Chrome320–390 ตาม [review](../evidence/task-112-review.json). รอ public deployment จึงปิดเกณฑ์สุดท้าย
