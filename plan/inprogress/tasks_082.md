# TASK-082 — เพิ่มน้ำหนักภาพท่าใหญ่ Asura และท่าโจมตีหลักหลายอาชีพ

Milestone: M4 · D-108 · Dependencies: TASK-019, TASK-020, TASK-079 (done)

## งานที่ต้องรอก่อนหน้า

- TASK-019, TASK-020, TASK-079 (done)

## ขอบเขตและรายละเอียด

ผู้ใช้ขอเอฟเฟกต์Asuraให้อารมณ์RO มีข้อความและจอสั่นเบาๆ รวมท่าโจมตีใหญ่ของอาชีพอื่น สร้างpresentationprofileและCanvasgeometryเฉพาะท่าที่เลือก ใช้nativeeffects/numbers/actor/soundเดิมเป็นฐาน ไม่แก้ท่าหรือสูตร ยึดactualhit+visualcontactที่มีอยู่ ไม่ทำcinematicหยุดเกม ไม่เปลี่ยนspeedcalculation คงdamagefocus/healเขียว/incomingแดง

Asuraปัจจุบันruntimepresentationอ้างpreparedBashrecipe5; nativeclientmetadataMO_EXTREMITYFIST skill271อธิบายlens1streaksและproceduralclientcode เสียงhitที่mappingระบุmissing ไม่อ้างว่ามีnativeAsuracomplete. งานนี้เป็นauthoredadaptationพร้อมstreak/impact/title ใช้ของlocalที่มีแล้ว ไม่downloadหรือเพิ่มpack

## ขั้นตอนและผลส่งมอบ

1. อ่านactualevent/contact/recipeและlocalAsurametadata แล้วกำหนดbigskillprofilesที่มีdamageจริงทุก6ต้นสาย
2. เพิ่มboundedpresentationcue, deterministicgeometry และreadabletitleที่wall-presentationclockแยกจากsharedengine
3. ผูกกับactualsuccessfulhit/firstimpactและขัดร่ายไม่ปล่อยfinisher รักษาreducedmotionและเดิมnormaldamage/projectile sync
4. ตรวจfixedfixtures/actualChrome realpackหลายอาชีพและ1×/2×/4×/reducedmotionก่อนbuild/deploy/review

## เกณฑ์ตรวจรับ

- [ ] AC-01: Asuraมีหมัดแสง/วงแรงกระแทก/ข้อความท่าใหญ่และworldshakeสั้นตรงvisualcontactจริง; ท่าใหญ่ที่เลือกจาก6ต้นอาชีพมีลักษณะเฉพาะตามhit/เวท/ฟัน/ศักดิ์สิทธิ์/ระเบิด โดยไม่อ้างexactROreconstruction
- [ ] AC-02: Triggerเฉพาะactualsuccessfuldamageและcast/actionที่ถูกต้อง ไม่เกิดจากcaststartที่ถูกขัด/normal/proc/heal/miss และAoE/multihitไม่spambanner; contactตรงnumbers/projectilesที่1×/2×/4×ไม่มีstate/RNG/eventchange
- [ ] AC-03: ข้อความอ่านได้เมื่อเร่งspeedด้วยเวลาภาพแยกจากgameclock; reducedmotionหยุดshake/พุ่ง/flash HUDไม่ขยับ คิวและparticlesbounded/mobile320/390ไม่ล้น ไม่ใช้globalrandomหรือโหลดassetเพิ่ม
- [ ] AC-04: Purepresentationchecks/type/boundaries/build/secretsผ่าน actualChromeทดสอบrealpack/contact/nohit/interrupt/multihit/reducedmotion+หลายท่าและตรวจภาพจริง ภาพไม่เพิ่มAPI/saveหรือเปลี่ยนrules/content/packจากTASK081
- [ ] AC-05: Push/deploy/publicnewpresentationbundle/API/hash/login/PWAผ่านก่อนdone ไม่มีownerwrite/6173restart/SQL/envหรือbalancebatchใหม่

## Review

รอหลักฐานจริง
