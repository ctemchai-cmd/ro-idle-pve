# TASK-162 — ปรับทีมหลังแพ้ไปหน้าสกิล

Milestone:M4 · D186 · [design75](../design/75-defeat-skill-navigation.md)

## งานที่ต้องรอก่อนหน้า
TASK-141, TASK-161 (done).

## ขอบเขต
เปลี่ยนnavigationปุ่มปรับทีมบนหน้าผลแพ้จากteamเป็นskills.

## รายละเอียด
คงclose/stopAuto/actorselectionตามShell.goเดิม,label/icon/layoutและปุ่มอื่นไม่เปลี่ยน.

## ขั้นตอน
1. ตรวจResultCardและroute
2. เปลี่ยนtarget+ปรับexistingnativeoracle/evidenceแยก
3. ตรวจnative/build/M0/publicและpublish

## เกณฑ์ตรวจรับ
- [x] AC-01:Story/Towerแพ้กดปรับทีมcloseแล้วgo(skills);existingresultcallbacks16modesผ่าน320390
- [ ] AC-02:rootbuild/M0/publicผ่าน;fivefingerprints/packเดิมและnoownerwrites

## วิธีตรวจ
Design75/existingresultnative+publicharnessboundedtask162.

## Blocker / คำถาม
ไม่มี;ผู้ใช้กำหนดปลายทางชัดเจน.

## ผลตรวจ
Localnative2groups/16cases/rootbuild/M0ผ่าน,fingerprintsเดิม;รอpublicrelease.
