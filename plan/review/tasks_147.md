# TASK-147 — บอกระดับอุปกรณ์ที่ฟาร์มได้ตามด่าน

Milestone: M4 · D171 · design60

## งานที่ต้องรอก่อนหน้า
TASK-115, TASK-125, TASK-146

## ขอบเขตและผลส่งมอบ
หน้าแรก/แผนที่/AFK ระบุอุปกรณ์ Lv. ที่ฟาร์มได้ พร้อมตารางทุกบทแบบพับได้. อ่าน gear table ที่อ้างด้วย farm_rate_chapter; ช่วง AFK ที่บันทึกไว้ใช้ snapshot.gear_tier. ไม่เปลี่ยนดรอป/การ์ด/ราคา/เซฟ/บาลานซ์.

## ขั้นตอน
1. เทียบ gear table กับ snapshot และแยก card tier
2. เพิ่ม projection และ UI กระชับ อ่านทุกบทได้แม้ยังไม่ปลด
3. ตรวจทุกด่านเทียบ actual farm pool, มือถือ320/390/การพับและเลือกด่าน
4. Build/push/ตรวจ Vercel และ public artifacts

## เกณฑ์ตรวจรับ
- [x] AC-01: ระดับตรง actual farm snapshot/pool ครบ330ด่าน; หน้าด่านระบุด่านที่เลือก/ตารางทุกบท, หน้าแรกและAFKใช้ระดับ frozen snapshot; ไม่เดาระดับเมื่อไม่มีข้อมูล/ไม่ปะปนการ์ด
- [ ] AC-02: มือถือ320/390ไม่ล้นแนวนอน เปิดปิดตาราง/เลือกฟาร์ม/AFKได้; ไม่มี API เพิ่มจากการดูข้อมูล; build/typecheck และ Vercel public proof ผ่าน; content/pack/สูตรเดิม

## วิธีตรวจและหลักฐาน
Native Chrome actual Field + synthetic isolated account and captured commands; all330 stages compared with shared storyFarmSnapshot and definition_pool. Build, content/pack hash audit, public deployment health/bundle and native read-only browser.

รายงาน: plan/evidence/task-147-review.json

## Blocker / คำถาม
ไม่มี. ไม่แตะowner/AuthSQL/env/6173.

## ผลตรวจรอบ local

Native2groups:330actualsnapshot/pool,320390รวม14profilecases/frozenlegacy/no-farm/เลือกฟาร์มผ่าน;13targeted/typecheck/M0/rootbuildผ่าน. Contentdfefและpack44f4เดิม. รอpush/Vercel/publichostedก่อนปิดAC02.
