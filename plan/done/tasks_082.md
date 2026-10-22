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

- [x] AC-01: Asuraมีหมัดแสง/วงแรงกระแทก/ข้อความท่าใหญ่และworldshakeสั้นตรงvisualcontactจริง; ท่าใหญ่ที่เลือกจาก6ต้นอาชีพมีลักษณะเฉพาะตามhit/เวท/ฟัน/ศักดิ์สิทธิ์/ระเบิด โดยไม่อ้างexactROreconstruction
- [x] AC-02: Triggerเฉพาะactualsuccessfuldamageและcast/actionที่ถูกต้อง ไม่เกิดจากcaststartที่ถูกขัด/normal/proc/heal/miss และAoE/multihitไม่spambanner; contactตรงnumbers/projectilesที่1×/2×/4×ไม่มีstate/RNG/eventchange
- [x] AC-03: ข้อความอ่านได้เมื่อเร่งspeedด้วยเวลาภาพแยกจากgameclock; reducedmotionหยุดshake/พุ่ง/flash HUDไม่ขยับ คิวและparticlesbounded/mobile320/390ไม่ล้น ไม่ใช้globalrandomหรือโหลดassetเพิ่ม
- [x] AC-04: Purepresentationchecks/type/boundaries/build/secretsผ่าน actualChromeทดสอบrealpack/contact/nohit/interrupt/multihit/reducedmotion+หลายท่าและตรวจภาพจริง ภาพไม่เพิ่มAPI/saveหรือเปลี่ยนrules/content/packจากTASK081
- [x] AC-05: Push/deploy/publicnewpresentationbundle/API/hash/login/PWAผ่านก่อนdone ไม่มีownerwrite/6173restart/SQL/envหรือbalancebatchใหม่

## Review

22 ต.ค.2026: ผ่านทุกAC มี [review](../evidence/task-082-review.json) และ [actual hosted](../evidence/task-082-hosted.json) Source `517daa030` / Vercel SUCCESS ตรวจpublicnewbundleSHA/API/content/login/PWAแล้ว

RO-inspired authored Asura light-fist/radial shock and outlined caption plus15 profiles across6 roots/8 styles. Successful HP/shield impact only, same visualImpactMs as native numbers/projectiles, one cue per action, no cast-interrupt/miss/normal/proc/heal finisher. Ten actual native rigs passed contact/reduced motion/quiet farm; shared Asura checkpoints/events/RNG identical at1/2/4 and real interrupted cast has no finisher. Bounded420ms wall impact,750–1000ms caption and180ms subtle≤5intrinsic-pixel shake keep high-speed presentation readable without changing engine time. Farm retains world impact without banner/shake. Inspected actual320/390 Asura and native Meteor/GrandCross/SonicBlow images; no new media. This is an authored adaptation, not exact native RO Asura reconstruction.

Actualmobileเป็นChromeemulation ไม่ใช่เครื่องAndroidจริง ไม่มีownerwrite/6173restart/newSQL/env/assetsหรือbalancebatch อัตราการ์ดใหม่ใช้contentmigration/backupเดิมและคงoldfrozenintervalก่อนclaimแรก
