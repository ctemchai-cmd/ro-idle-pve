# TASK-119 — หน้าPreviewสกิลทุกอาชีพ

Milestone: M4 · D152 · [design](../design/43-skill-preview.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-019, TASK-020, TASK-025, TASK-040, TASK-108, TASK-117 (done).

## เป้าหมายและผลส่งมอบ
หน้าPreviewสกิลทุกอาชีพ;รายละเอียดตามdesign.

## ขอบเขตและรายละเอียด
ตามdesignที่อ้าง ไม่มีownercloudwrite/6173restart/balancebatch.

## ขั้นตอนการทำงาน
1. ตรวจsource/contractsและเก็บbaseline
2. แยกdata/session/client/view ใช้sharedengineและpack
3. ตรวจtargeted/build/mobileจริง320/390และfailurecases
4. pushmain ตรวจpublicdeploymentก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: 19jobs126skillsรวมinherited/passive/copy;เลือกรankและpresetได้/queryvalid/defaultinvalidปลอดภัย;ทุกskillranks1/maxresolveด้วยengineจริง
- [x] AC-02: Activeแสดงcast/VFX/audioจริง/Passiveไม่มีfakecast;heal/buff/summon/spheres/SpellBreakerมีบริบท;ไม่เรียกSaveControllerหรือaccountcommands
- [x] AC-03: Chrome320390ไม่ล้น/เลือกเร็วไม่เห็นsceneเก่าทับ/playpause/replay/speed/visibility/audio/กลับเกมได้;ไม่มีAPIwrites
- [ ] AC-04: lazyrouteไม่เพิ่มgamebootstrap/targeted/build/boundariesและpublicVercelผ่าน;assetsไม่downloadภายนอก/ไม่เปลี่ยนbalanceหรือownerstate

## วิธีตรวจและหลักฐาน
Case T119-AC-01–04 ใน acceptance-matrix.md;ทดสอบตามdesign;หลักฐาน plan/evidence/task-119-*. ผู้ตรวจ:Codex · รอบ1 localผ่าน/รอpublicproduction AC-04.

## Blocker / คำถาม
ไม่มี

## บันทึกการทำงานและ review
581fullTS:579ผ่าน/2historicalcountsแก้แล้วผ่าน12targeted;16finaltargetedผ่าน. M0/build/filteredbuild/assets271+60460+6926/actualAuthAPI-SQL-mobile6groupsผ่าน. ไม่มีownerwrite. รอVercel/publicก่อนdone.
