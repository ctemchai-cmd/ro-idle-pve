# TASK-125 — เปิด Hi-class พร้อม Awaken และด่านต่อบนเว็บ

Milestone: M5 · D154–155 · [design45](../design/45-hi-class-implementation.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-122, TASK-123, TASK-124.

## เป้าหมายและผลส่งมอบ
เปิด Hi-class พร้อม Awaken และด่านต่อบนเว็บ ตามdesign45;แยกการเตรียมและการเปิดจริงตามdependency.

## ขอบเขตและรายละเอียด
ไม่แตะownercloud/privateenv/6173และไม่รันbalancebatch. ตัวเลขใหม่เป็นauthoredbaseline;Hi-classต้องมีAwakenพร้อมก่อนTASK125เปิดจริง.

## ขั้นตอนการทำงาน
1. ตรวจสัญญาและauthorข้อมูล/กรณีผิดพลาดให้ครบ
2. ทำpure rules/schemaก่อนadapterและUI
3. ตรวจregression/กรณีผิดพลาด/หลักฐานตรงเกณฑ์
4. ส่งต่อintegrationTASK125ก่อนเปิดfeature

## เกณฑ์ตรวจรับ
- [x] AC-01: เปิดHi70/Awakenรายสกิล/levelcap90/บท10–12เมื่อถึงgateจริง;ไม่เปิดArtifact/Class3/Pet/Rune
- [x] AC-02: FreshlocalAuthAPI-SQL-mobile320390ผ่าน70→Hiรักษาบิลด์→Awaken→อัป→แลกเศษ→gate80→สกิลใหม่→ไฟต์→reload/slotisolation
- [x] AC-03: OldClass2save migration/ทุนเดิม/AFKfrozen/carry/backup/receipt replay/response lossไม่ทำprogressหรือเศษซ้ำ;ปรับbatchเซฟไม่เพิ่มrequests
- [x] AC-04: Fullappropriatechecks/filteredVercelbuild/packbudget→push→hostedpublichealth/artifactsและreleaseflagsตรงก่อนdone;ไม่เข้าบัญชีowner/ไม่รันbalancebatch

## วิธีตรวจและหลักฐาน
T125-AC-01–04 ในacceptance-matrix. Pure/unit/content/schema/build/boundaries;TASK125เป็นเจ้าของactualAuth/API-SQL/mobileและhostedrelease. ยังไม่ตรวจครบ.

## Blocker / คำถาม
ไม่มีคำถามผู้ใช้ค้างในกติกาD154–155;รอdependency.

## บันทึกการทำงานและ review
- 23ต.ค.2026 แตกงานตามกติกาที่ผู้ใช้ยืนยัน;ยังไม่done.

- 24ต.ค.2026 local validationผ่านแล้ว;624TS/root+filteredbuild/M0/actualAuth-API-SQL-mobile320390. ภาพและผลตรวจในtask-125-mobile-live.json;ยังรอpushและhostedpublicก่อนdone.

- Hostedผ่าน4groups source`fe14ac635`/VercelSUCCESS: API200SIN1/79ab9437…/Auth401/24bundleSHA/32jobs152skills/nativeChampionSniper90/Hunter750/mobile320390/0writes. ViewedhostedHunter/Sniper320. ปิดงานโดยไม่แตะownercloud/SQL/env/6173;บาลานซ์เป็นค่าทดลองรอผู้ใช้เล่นจริง.
