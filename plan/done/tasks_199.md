# TASK-199 — Enchant ถึงเป้าหมายและรีออฟอัตโนมัติ

Milestone: M4 · D222

## งานที่ต้องรอก่อนหน้า
TASK-198 (done)

## ผลส่งมอบ

ผลส่งมอบ: [Design102](../design/102-enchant-and-option-targets.md)

## ขั้นตอน
1. ยืนยันและแก้ schema Enchant 11–20 ให้ตรง cap/ราคาเดิม
2. เลือกเป้าหมาย 5/10/15/20 พร้อมราคารวมและ preview โดยใช้ command เดิม
3. รีออฟเป้าหมายทีละแถวด้วย pool/RNG/ราคาเดิมใน command เดียว พร้อมยืนยันและสรุป
4. ตรวจ schema/ราคาคืนทุน/replay/ข้อจำกัดและ UI 320/390 แล้ว build/publish

## เกณฑ์ตรวจรับ
- [x] AC-01: API ยอมรับ Enchant 11–20; cap ตาม level และค่าใช้จ่าย/คืนทุนถูกต้อง
- [x] AC-02: เป้าหมาย Enchant ส่งครั้งเดียวและแสดงราคาทั้งหมด; ทุนไม่พอไม่หักบางส่วน
- [x] AC-03: รีออฟตรงการสุ่มเดิมจนพบเป้าหมาย/หินหมด/ครบเพดาน; แถวอื่นและชิ้นเดิมคงอยู่
- [x] AC-04: invalid/stale/pending/locked/inbattle ไม่เสียหิน; retry/response-loss ไม่หักซ้ำ
- [x] AC-05: ยืนยันใช้ผลสุดท้าย พร้อมจำนวนหินสูงสุดและสรุปจริง; mobile ไม่ล้น
- [x] AC-06: focused/full/build/clean committed/public checks ผ่าน; ไม่แตะเซฟเจ้าของ

Local review: Codex8November2026 · 925distinctTS/native11/root/M0/strict passed. Clean committed1736identical/public5groups passed. Vercel SUCCESS `3e74296cb`. Evidence: [TASK199](../evidence/task-199/README.md).
