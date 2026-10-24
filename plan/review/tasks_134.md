# TASK-134 — รับรางวัล Story/Tower อัตโนมัติในผลไฟต์

Milestone: M4 follow-up · D-164

## งานที่ต้องรอก่อนหน้า

TASK-025, TASK-035, TASK-098

## ขอบเขตและรายละเอียด

ทำตามคำขอล่าสุดของผู้ใช้บน shared contracts/runtime เดิม ไม่เพิ่ม SQL/env ไม่แก้ owner save หรือรีสตาร์ต6173. แยก pure rules จาก UI และใช้ค่า/receipt จริง.

## ขั้นตอน

1. ระบุ authority และ edge cases ก่อนแก้ พร้อมบันทึกกติกาใน design52
2. พัฒนา shared helper/reducer และ adapter/UI โดยไม่ทำสูตรซ้ำ
3. ตรวจเฉพาะกติกาที่เปลี่ยน พร้อม full regression/build และ isolated local stack
4. Review หลักฐานและ deploy/hosted ก่อน done

## เกณฑ์ตรวจรับ

- [x] AC-01: Story/Tower ชนะครั้งแรกจ่ายรางวัลทันทีใน battle finish เดียวพร้อม receipt/revision เดียว; ไม่มีปุ่มรับรางวัลและไม่ต้องเปิด AFK
- [x] AC-02: Story first clear ปิดและจ่ายช่วงฟาร์มเดิมอย่างถูกต้อง ย้าย frontier farm ใน commit เดียวโดยเคารพจุดเก่าที่ผู้เล่นเลือก; ไม่จ่ายซ้ำเมื่อ replay/reload/แพ้
- [x] AC-03: กระเป๋าเต็มไม่ทำผลไฟต์ค้างหรือรางวัลหาย: เก็บรางวัลชิ้นของไว้เป็น pending ที่กู้รับอัตโนมัติเมื่อมีพื้นที่; Auto หยุดพร้อมสาเหตุ
- [x] AC-04: Actual Auth/API/SQL/mobile/reload/response-loss proof และ tests/build ผ่าน; daily/AFKปกติยังคง flow เดิม

## หลักฐาน

plan/evidence/task-134-review.json (ยังไม่รัน)

## Blocker / คำถาม

ไม่มี

## Review

Local ผ่าน: 650 tests / actual Auth-API-SQL-mobile 7+2 กลุ่ม / root และ filtered build. ยังไม่ done: รอ source deploy และ public hosted proof. [หลักฐาน](../evidence/task-134-review.json)
