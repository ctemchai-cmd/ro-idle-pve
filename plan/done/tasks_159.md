# TASK-159 — บาลานซ์การ์ดตามบทบาทและความหายาก

Milestone:M4 · [design](../design/72-card-role-balance.md)

## งานที่ต้องรอก่อนหน้า
TASK-155, TASK-156 (done).

## ขอบเขต
ตรวจ80ใบ;ลดATK/genericdamageที่สูง,เติมsecondarybenefitให้AGI/evasion/status/specialist/HP/MVPutility โดยคงidentity/rates/cost/ownedinstances.

## รายละเอียด
ตามคำขอผู้ใช้26ตุลาคม2026;ใช้sharedhelpersและschemaเดิม.

## ขั้นตอน
1. ตรวจข้อมูลและออกแบบตามบทบาท
2. ปรับsourceที่ใช้generateจริง
3. ตรวจผลจริง/มือถือ/buildและpublish

## เกณฑ์ตรวจรับ
- [x] AC-01: audit80ใบ/Lv1–5/roles/ก่อนหลังมีหลักฐาน;ไม่บังคับทุกใบDPSเท่ากัน
- [x] AC-02: ลดoutlierและเพิ่มประโยชน์conditional/utilityผ่านsharedengine;ไม่แก้สกิล/มอน/rarity/สูตรหลัก
- [x] AC-03: เซฟ/การ์ดเดิม/ต้นทุน/ดรอป/รางวัล/packเดิม;คำอธิบายตรงค่าจริงและmigrationเดิม
- [x] AC-04: targeted/full/build/M0/native/publicผ่านก่อนdone

## วิธีตรวจ
Evidence task-159/review,localnativeและpublicrelease.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ยืนยันเป้าปรับการ์ดเป็นผลรวมที่น่าเลือกตามบทบาท.

## ผลตรวจ
Localผ่านตามreviewและevidence159;VercelSUCCESS source849ad9ceb/public4groups/24bundleSHAผ่าน.
