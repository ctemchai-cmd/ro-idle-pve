# TASK-071 — Healing Song ใช้ P.ATK และวงฮีลต่อเนื่อง

Milestone: M4 · อ้างอิง D-096/D-097 · เริ่มออกแบบ22 ตุลาคม2026

## งานที่ต้องรอก่อนหน้า

- TASK-017: shared effects/heal/status lifecycle (done)
- TASK-031: Bard/Dancer เท่ากันและ healing song (done)
- TASK-068: live status projection (done)
- TASK-040: backed-up save migration (done)

## เป้าหมาย ขอบเขตและรายละเอียด

ผู้ใช้ระบุว่า Healing Song ของ Bard/Dancer ต้องอิง P.ATK และขอวงฮีลค้างระหว่างบัฟ HoT ทำงาน

ใช้ raw formula physical_power ที่มีอยู่ใน effect heal (ขยาย whitelist ของ heal เท่านั้น ไม่เพิ่มระบบคูณหรือสูตรซ้ำ) และเพิ่ม physical_regeneration จาก template regeneration เดิม เปลี่ยนเฉพาะ Healing Song สองอาชีพ คงpower10–20%ต่อtick/5ticks/6s/SP38/CT800/ACD1200/independentstacks/MusicLesson/targethealingbonusesเดิม PriestSanctuaryและHoT MATK อื่นไม่เปลี่ยน

วงฮีลเป็น read-only presentation จาก active status ที่มี periodic heal แสดงใต้ผู้รับที่ยังมีชีวิต หายเมื่อไม่มีHoTเหลือจริง ไม่อิงชื่อสกิล/casttimer ไม่เพิ่ม heal ticks/status duration หรือคูณจำนวนวงตามstack ใช้game presentation clockและmotion settingเดิม ไม่เพิ่มasset downloads/DBwrites

## ขั้นตอนทำงาน

1. ปรับcomposition validationและเพิ่มphysical HoT statusจากtemplateเดิม; Bard/Dancerเรียน/อัปและgolden intentsตรงกันทุกระดับ
2. เพิ่มhealing aura projectionจากstatusdefinitionที่มีperiodic heal และวาดวง+อนุภาคใต้actorตามตำแหน่งจริง ไม่ใช้wall clock/randomness
3. แสดงคำอธิบาย P.ATK ในหน้าskill/status; ทดสอบP.ATKสูง/MATKต่ำและกรณีกลับกัน, MusicLesson/รับฮีล/overheal/stack/expiry/cleanse/ผู้รับตาย/casterตายตามlifecycleเดิม
4. actualChromeตรวจเพลง/วงต่อเนื่อง/หมดแล้วหาย, build/M0checks/hosted และแจ้งbacked-upmigration ไม่รันbalance simulation

## เกณฑ์ตรวจรับ

- [x] AC-01: Bard/Dancer Healing Song ทุกระดับใช้ P.ATK ผ่าน shared raw/heal pipeline ไม่มีarmor/critแบบdamage; ค่าอื่น/MusicLesson/stackingเดิม และ Priest Sanctuary ยังใช้ MATK
- [x] AC-02: live aura มีเฉพาะผู้รับที่ยังมีชีวิตและมีperiodic healที่ยังactive หายเมื่อหมด/ล้าง/ตาย; มากกว่าหนึ่งinstanceยังทำงาน/หมดเวลาแยกตามเดิม ไม่มี extra heal/status/DBwriteจากrenderer; reduced motionใช้ภาพนิ่ง
- [x] AC-03: หน้าskill/statusอธิบายฐานP.ATKจริง; focusedmath/lifecycle/rendererและactualChromeภาพ/expiryผ่าน, เพลงสองอาชีพค่าเท่ากัน ไม่รันbalance simulationหรือเปลี่ยนตัวคูณพร้อมกัน
- [x] AC-04: M0/content/schema/build/type/boundaries/secrets/hostedผ่าน ไม่มีSQL/env/newmedia/ownerwrite/restart6173; แยกcontenthashใหม่จากTASK-070และใช้existingbackup-before-migrate ไม่อ้างว่าอัปเดตเซฟเจ้าของแล้ว

## วิธีตรวจและหลักฐาน

Focused per-skill fixture casts/HoT lifecycle, raw formula and presentation projection checks, actual isolated Auth/Postgres/mobileChrome and visual snapshots; runtime pack stays unchanged ไม่มีownercredentials

## Blocker / คำถาม

ไม่มี ผู้ใช้เลือก P.ATK โดยตรง ไม่ใช้ max(ATK,MATK) ตามข้อเสนอเก่า

## ผลตรวจจริง

- Focused8testsผ่าน (5เพลง/HoTlifecycle+3history): P.ATKสูง/MATKต่ำและสลับกัน, Songทั้งสองอาชีพทุกระดับ+6goldens, 5ticks, MusicLesson/receivedbonus, independentstacks, expiry/dispel/ผู้รับตาย/ผู้ร่ายตาย, UIคำอธิบายและgeometrydeterministic ดู [targeted](../evidence/task-071-targeted.txt)
- ActualfreshAuth/PostgREST/Postgres/mobileChrome4กลุ่มผ่าน: Bard/Dancer+Sanctuaryจริงทำให้ผู้รับทั้ง4มี3HoTinstancesแต่4วง, ตรวจกับrenderer761frames/ตรงprojectionทุกframe; หมดบัฟ10049msทุกคนยังมีชีวิตวงหายหมด, motionปิดใช้วงนิ่ง, P.ATKในdetails, 320pxไม่ล้น ไม่มีbattle.advance/finishระหว่างดู [UI](../evidence/task-071-healing-live.json) / [stack](../evidence/task-071-local-stack.json) ภาพhot-active/hot-expiredเปิดดูแล้ว
- M0/data/schema/manifest/codegen/build/type/boundaries/assets/secretsผ่าน Content9473f672c88c569f98a7f44de7c7c6cc7a3deeaa1c427526614cb5d181cb9fdf/packf57a0773…เดิม [build](../evidence/task-071-build.txt) / [M0](../evidence/task-071-m0.txt)
- Buildround1–2พบreadonlytypeของpassivemodifiersในtestfixture แก้cloneเป็นmutabletestinput ไม่เปลี่ยนproduct/เกณฑ์ เก็บfailurelogsไว้ Finalbuild/targetedผ่าน
- ไม่รันbalance/calibration/simulationrunner ไม่แตะ6173/ownerdata ไม่มีSQL/env/newassets Source eaa8c0a0d pushmain/Vercelsuccessและactualpublichosted3กลุ่มผ่านแล้ว ปิดAC04/done การเปลี่ยนcontentใช้existingสำรองแล้วอัปเดตเซฟหลังจบไฟต์ ไม่อ้างว่าownerทำแล้ว

- Hostedround1ตรวจmarkerในpackchunkผิดตำแหน่ง Viteย้ายrendererไปsharedskill-timelinechunk ตรวจlocalcompiledไฟล์ยืนยันแล้วแก้harnessselector ไม่เปลี่ยนproduct/เกณฑ์ รันpublicproofกับdeploymentเดิมผ่าน3กลุ่ม เก็บround1failureแยก [hosted](../evidence/task-071-hosted.json) / [deployment](../evidence/task-071-github-deployment.json)
