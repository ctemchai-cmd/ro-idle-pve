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

- [ ] AC-01: Bard/Dancer Healing Song ทุกระดับใช้ P.ATK ผ่าน shared raw/heal pipeline ไม่มีarmor/critแบบdamage; ค่าอื่น/MusicLesson/stackingเดิม และ Priest Sanctuary ยังใช้ MATK
- [ ] AC-02: live aura มีเฉพาะผู้รับที่ยังมีชีวิตและมีperiodic healที่ยังactive หายเมื่อหมด/ล้าง/ตาย; มากกว่าหนึ่งinstanceยังทำงาน/หมดเวลาแยกตามเดิม ไม่มี extra heal/status/DBwriteจากrenderer; reduced motionใช้ภาพนิ่ง
- [ ] AC-03: หน้าskill/statusอธิบายฐานP.ATKจริง; focusedmath/lifecycle/rendererและactualChromeภาพ/expiryผ่าน, เพลงสองอาชีพค่าเท่ากัน ไม่รันbalance simulationหรือเปลี่ยนตัวคูณพร้อมกัน
- [ ] AC-04: M0/content/schema/build/type/boundaries/secrets/hostedผ่าน ไม่มีSQL/env/newmedia/ownerwrite/restart6173; แยกcontenthashใหม่จากTASK-070และใช้existingbackup-before-migrate ไม่อ้างว่าอัปเดตเซฟเจ้าของแล้ว

## วิธีตรวจและหลักฐาน

Focused per-skill fixture casts/HoT lifecycle, raw formula and presentation projection checks, actual isolated Auth/Postgres/mobileChrome and visual snapshots; runtime pack stays unchanged ไม่มีownercredentials

## Blocker / คำถาม

ไม่มี ผู้ใช้เลือก P.ATK โดยตรง ไม่ใช้ max(ATK,MATK) ตามข้อเสนอเก่า

## ผลตรวจจริง

ออกแบบแล้ว รอ TASK-070 live Chrome จบก่อนแก้ product/codegen ตามข้อกำหนด freeze
