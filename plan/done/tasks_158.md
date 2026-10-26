# TASK-158 — ปุ่มสไตล์ RO Classic

Milestone:M4 · [design](../design/71-classic-buttons.md)

## งานที่ต้องรอก่อนหน้า
TASK-157 (done).

## ขอบเขต
CSSปุ่มClassicเงินอมฟ้า/bevel/pressed/selected/danger/disabled/focus โดยคงhitarea/mobile/layout/actualassetsเดิม.

## รายละเอียด
ตามคำขอผู้ใช้26ตุลาคม2026;ใช้sharedhelpersและschemaเดิม.

## ขั้นตอน
1. ตรวจข้อมูลและออกแบบตามบทบาท
2. ปรับsourceที่ใช้generateจริง
3. ตรวจผลจริง/มือถือ/buildและpublish

## เกณฑ์ตรวจรับ
- [x] AC-01: ปุ่มทั่วไป/primary/danger/icon/tab/battleใช้skinClassicและสถานะชัดเจน
- [x] AC-02: mobile320390/pressed/focus/disabled/nativeหน้าจอจริง/rootbuild/publicผ่าน;ไม่แก้combat/save

## วิธีตรวจ
Evidence task-158/review,localnativeและpublicrelease.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ยืนยันเป้าปรับการ์ดเป็นผลรวมที่น่าเลือกตามบทบาท.

## ผลตรวจ
Localผ่านตามreviewและevidence159;VercelSUCCESS source849ad9ceb/public4groups/24bundleSHAผ่าน.
