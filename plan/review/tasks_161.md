# TASK-161 — สี RO Classic กับ UI Modern เดิม

Milestone:M4 · D185 · [design74](../design/74-classic-palette-modern-controls.md)

## งานที่ต้องรอก่อนหน้า
TASK-160 (done).

## ขอบเขต
เปลี่ยนpalettecontrols/brandเป็นwhite–silver–blueของROClassic โดยคงUIที่ผู้ใช้ยืนยัน.

## รายละเอียด
primaryblue/navytext,secondarywhite-blue,selectedblue/darkbattleblue. Keepshape12/8/spacing/type/hitarea/noinsetและsemanticcolors.

## ขั้นตอน
1. ตรวจD184และเปลี่ยนเฉพาะสี
2. ตรวจactualUI320390/states/geometryและbuild/M0
3. Publishและตรวจpublicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01:blueclassicpaletteบนshapeD184เดิม;shop/cards/states/mobile320390อ่านง่าย
- [ ] AC-02:rootbuild/M0/publicผ่าน;fivefingerprints/packเดิมและnoownerwrites

## วิธีตรวจ
Design74/nativeexistingharnessboundedtask161/build/M0/hosted+fingerprintcompare.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ยืนยันUIเดิมแล้วและขอเปลี่ยนสีชัดเจน.

## ผลตรวจ
Localnative3groups320390/rootbuild/M0ผ่าน;CSSdiffเฉพาะสี ทุกgameplayfingerprint/packเดิม รอpublicrelease.
