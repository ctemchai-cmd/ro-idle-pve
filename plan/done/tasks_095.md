# TASK-095 — คืนไอคอนร้านค้า RO เดิมเวอร์ชันสี

Milestone: M4 · D-124 · ประเภท: ปรับ UI

## งานที่ต้องรอก่อนหน้า

- TASK-094 (done)

## ขอบเขตและผลส่งมอบ

ผู้ใช้ต้องการภาพถุงเงินเดิม แค่เปลี่ยนจากสีเทาเป็นสีปกติ จึงใช้ native `bank_1` แทน `bank_3` และยกเลิก SVG หน้าร้านที่เพิ่มใน TASK-094. ใช้ขนาด/สถานะ active และการเปิดร้านเดิม ไม่ปรับระบบร้านค้าหรือข้อมูลเกม

## ขั้นตอน

1. อ่าน sidecar และดูภาพ bank_1/3 เพื่อยืนยันว่าเป็นรูปเดียวกันต่างสถานะสี
2. เปลี่ยน presentation mapping และคืน img ใน BottomBar; ลบ component/CSS ที่เลิกใช้ แล้ว rebuild runtime pack
3. ตรวจ BottomBar จริงที่ 320/390px ทั้งก่อนและหลังแตะร้านค้า, build และตรวจไฟล์สาธารณะหลัง deploy

## เกณฑ์ตรวจรับ

- [x] AC-01: BottomBar ใช้ภาพถุงเงิน native bank_1 สีปกติทั้ง inactive/active; แตะเปิดร้านได้ ขนาดไม่ล้นมือถือ 320/390px และไม่มี browser error
- [x] AC-02: runtime pack/build ผ่านและเว็บ Vercel ส่ง mapping/ภาพสีตรง checksum; content hash กติกาเกมไม่เปลี่ยน

## วิธีตรวจและหลักฐาน

AC-01: isolated Chrome เปิด component/CSS/AssetPack จริง ตรวจ src/filter/click และภาพหน้าจอ 320/390. AC-02: build/runtime artifact verification และ public manifest/media SHA หลัง Vercel Ready. งานภาพขนาดเล็กนี้ไม่เพิ่ม unit test หรือรัน combat/Auth suites ซ้ำ

## Blocker / คำถาม

ไม่มี

## บันทึกการทำงานและ review

- เห็น bank_1 เป็นถุงเงินสีทอง และ bank_3 เป็นถุงเงินเทา จากภาพจริง 36×36 และ metadata

- Chrome320/390 ผ่าน รูป native36px แสดง30px ไม่มี grayscale ทั้ง inactive/active และแตะเลือก store ได้; build/runtime/readiness8 ผ่าน content hash เดิม
- Browserรอบแรกอ่านขนาดก่อน active transition จากรอบ320จบที่390 จึงรอ render/transition แล้วตรวจซ้ำผ่านทั้งคู่ เก็บรายงานรอบแรกไว้ ไม่เปลี่ยน product code หรือเกณฑ์
- Public Vercel proof 3กลุ่มผ่าน: native bank_1/matching SHA, shellไม่มี StoreSVG, content hashเดิม/API/login/PWA; source`7dceccafe2638c61a2e93b332483f7d56400bfaa` VercelSUCCESS
- Reviewผ่าน2/2AC · 22 ต.ค.2026 · [หลักฐาน](../evidence/task-095-review.json)
