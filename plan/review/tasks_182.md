# TASK182 — เพดานเลเวลตามตัวละครอันดับ4

## งานที่ต้องรอก่อนหน้า
TASK-014 (done); ส่งพร้อม179–181

## ขอบเขต
นับตัวหลัก+NPCทั้งหมด รวมไม่ลงทีม. max=sort(level,desc)[3]+20 และยังติดเพดาน class/Break/release เดิม. กติกาใช้ตอนอัปเพิ่มเท่านั้น ไม่ลดเลเวลเก่าหรือคืนทุน.

## ขั้นตอน
1. shared pure cap
2. command + optimistic reducer + ปุ่มอัป1/อัปสูงสุดใช้ค่าเดียวกัน
3. ทดสอบลำดับ/off-team/bulk/rejection/old overcap

## เกณฑ์ตรวจรับ
- [x] AC-01: 100/90/80/60→80 และไม่นับแค่ทีม
- [x] AC-02: เกิน cap ไม่เสีย EXP/ทอง
- [x] AC-03: เลเวลเดิมเกิน cap ยังโหลดได้
- [ ] AC-04: UI/strict/build/hostedผ่าน

## ผลตรวจในเครื่อง
832 TS / 12 focused / native320390 5groups / M0 / strict root+filtered identical1733files ผ่าน. รอ commit/push และ hosted proof. ไม่มี SQL/envใหม่/owner access/6173restart.
