# TASK-118 — บท10–12พร้อมnativeบอสและrelease gates

Milestone: M4 · D151 · [design](../design/42-hi-chapters.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-019, TASK-020, TASK-025, TASK-040, TASK-108, TASK-117 (done).

## เป้าหมายและผลส่งมอบ
บท10–12พร้อมnativeบอสและrelease gates;รายละเอียดตามdesign.

## ขอบเขตและรายละเอียด
ตามdesignที่อ้าง ไม่มีownercloudwrite/6173restart/balancebatch.

## ขั้นตอนการทำงาน
1. ตรวจsource/contractsและเก็บbaseline
2. แยกdata/session/client/view ใช้sharedengineและpack
3. ตรวจtargeted/build/mobileจริง320/390และfailurecases
4. pushmain ตรวจpublicdeploymentก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: 330ด่าน12บท;150ใหม่เชื่อมครบ/15bossช่วง/180แถวเดิมและ25actors17programsเดิมเท่าfixture;generatorcurrentและlegacyตรง
- [x] AC-02: บท10–11ล็อกHi-classและcap,บท12ล็อกAwaken;UI/API/farmใช้กฎเดียว/dailyไม่นับบทล็อก;cap70และownerprogressเดิม
- [x] AC-03: enemy90checkpointได้แต่party71ไม่ได้;36nativeactors/2programsใหม่มีtraitsและeffectsจริง/interrupt/1x2x4ตรง;1bossต่อchallenge
- [ ] AC-04: Chrome320390ดู3บท50cellsล็อกและAPIrejectได้;runtime≤32MiB/build/M0/targeted/publicVercelผ่าน ไม่มีownerwriteหรือSQL

## วิธีตรวจและหลักฐาน
Case T118-AC-01–04 ใน acceptance-matrix.md;ทดสอบตามdesign;หลักฐาน plan/evidence/task-118-*. ผู้ตรวจ:Codex · รอบ1 localผ่าน/รอpublicproduction AC-04.

## Blocker / คำถาม
ไม่มี

## บันทึกการทำงานและ review
581fullTS:579ผ่าน/2historicalcountsแก้แล้วผ่าน12targeted;16finaltargetedผ่าน. M0/build/filteredbuild/assets271+60460+6926/actualAuthAPI-SQL-mobile6groupsผ่าน. ไม่มีownerwrite. รอVercel/publicก่อนdone.
