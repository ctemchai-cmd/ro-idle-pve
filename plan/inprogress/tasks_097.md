# TASK-097 — เลขเหลืองสะสมเฉพาะสกิล Multi Hit

Milestone: M4 · D-126 · ประเภท: combat presentation

## งานที่ต้องรอก่อนหน้า

- TASK-020 (done)

## ขอบเขตและผลส่งมอบ

ผู้ใช้ขอเลขสีเหลืองที่เด้งสะสมทีละฮิต เช่น100→200→300 และย้ำเฉพาะสกิลMultiHit เช่นFinger Offensive/Bolt. ใช้ native bitmap digits เดิมย้อมสีด้วย renderer โดยไม่แก้ไฟล์รูป/เพิ่มasset. เลขรายฮิต/คริ/ฮีล/ดาเมจเข้าเดิมยังทำงาน

## รายละเอียด

รวมเฉพาะ damage origin=skill ที่มีหลาย hit ต่อ `(actor,skill,action_id,target)` และแสดงเฉพาะตัวโฟกัส ใช้ amount จริง ไม่รวมตีปกติ/single-hit/DoT/proc/reflect หรือหลายเป้าของAoEฮิตเดียว. ยอดเพิ่มตามvisualimpactเดียวกับเลขขาว; native/projectile staggerเดิมคงไว้ ท่าที่ทุกhitซ้อนเวลาเดียวกันใช้ fallback90ms ต่อhitเพื่อแสดงทีละจังหวะ เฉพาะpresentation ไม่มีการเลื่อนHP/CC/ทรัพยากรในengine. ยอดเด้งเมื่อเพิ่ม ค้าง1000msและfade400msหลังฮิตล่าสุดตามbattleclock; reducedmotionไม่มีเด้งและใช้eventtime. เปลี่ยนcastเริ่มยอดใหม่ต่อเป้าและไม่วางเลขเก่าทับกัน ใช้history bounded128groups ไม่มีเซฟ/สูตร/contractเพิ่ม

อ้างอิงการแยก Combo/yellow และ animation จาก [roBrowser](https://github.com/vthibault/roBrowser/blob/master/src/Renderer/Effects/Damage.js); จังหวะและตำแหน่งเป็นpresentationของเกมเรา

## ขั้นตอน

1. เพิ่มตัวรวมเฉพาะdirectmulti-hitและnative yellow number kind
2. ต่อcontact/fallback timing/โฟกัส/expiryในBattleRenderer โดยไม่เปลี่ยนengineหรือsave
3. ตรวจpuregroupingและactualBolt/Finger/DoubleStrafe/single-hit/interrupt/speed/reducedmotion/mobile แล้วbuild/deploy/publicreview

## เกณฑ์ตรวจรับ

- [x] AC-01: directmulti-hit100×3 แสดง100→200→300เมื่อถึงvisualcontact ไม่มีนับซ้ำต่อframe/replay แยกcast/ตัวร่าย/เป้า; normal/single-hit/DoT/proc/reflect/heal/AoEฮิตเดียวไม่ขึ้นเลขเหลือง และใช้amountจริง
- [x] AC-02: actualengineBolt/Finger/DoubleStrafeมีเลขขาวรายฮิตและเหลืองสะสมตามimpact; โฟกัส/reducedmotion/hold-fade/mobile320–390ทำงาน และspeed1/2/4กับการขัดร่ายไม่เปลี่ยนevents/RNG/checkpoint ไม่เขียนsaveหรือAPIจากrenderer
- [ ] AC-03: focusedtests/build/type/boundaries/secrets/readinessและpublicVercelJS/CSS/หน้าloginผ่าน contenthash/runtimepackเดิม ไม่มีSQL/env/เซฟmigration

## วิธีตรวจและหลักฐาน

AC-01 ใช้purecasesของMultiHitNumbers/ordinals; AC-02 ใช้nativepack+sharedengineในisolatedChrome ตรวจframeStats/pixelสี/contactและภาพ320/390 พร้อมเปรียบเทียบstateก่อน/หลังวาด; AC-03 ใช้build/runtime/readinessและsigned-out publicSHA proof

## Blocker / คำถาม

ไม่มี

## บันทึกการทำงานและ review

- 19focused/build/type/boundaries/secrets/readiness8ผ่าน ActualnativeChrome4groupsผ่าน: Bolt3/Finger5/DoubleStrafe2ตรงimpact, controlled100→200→300/pixels549/alpha maskเดิม, focus/reducedmotion/hold-fade/engine1x2x4/interrupt/Bashsingle/normal/noAPIwrites และ320/390. เปิดภาพmobile320/Fingerดูแล้ว
- ภาพรอบแรกเห็นเลขเหลืองชนกับ white flight จึงขยับไปband y−255/clamp40 และเพิ่มactualdrawseparation assertion; finalผ่าน. Harnessเตรียม Mage spriteคืนหลังสลับหลายอาชีพก่อนจับภาพควบคุม. เก็บround1/before-spacingreportsเดิมไว้
- Content/packเดิม ไม่มีengine/contracts/save/asset payloadเปลี่ยน รอVercel public proofก่อนAC-03/done
