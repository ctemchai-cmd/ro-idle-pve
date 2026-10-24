# TASK-135 — Auto Battle ด่านและหอคอยจนแพ้ครบกำหนด

Milestone: M4 follow-up · D-164

## งานที่ต้องรอก่อนหน้า

TASK-025, TASK-035, TASK-022 (TASK-134 เป็นงานร่วม release ที่ตรวจ integration พร้อมกัน)

## ขอบเขตและรายละเอียด

ทำตามคำขอล่าสุดของผู้ใช้บน shared contracts/runtime เดิม ไม่เพิ่ม SQL/env ไม่แก้ owner save หรือรีสตาร์ต6173. แยก pure rules จาก UI และใช้ค่า/receipt จริง.

## ขั้นตอน

1. ระบุ authority และ edge cases ก่อนแก้ พร้อมบันทึกกติกาใน design52
2. พัฒนา shared helper/reducer และ adapter/UI โดยไม่ทำสูตรซ้ำ
3. ตรวจเฉพาะกติกาที่เปลี่ยน พร้อม full regression/build และ isolated local stack
4. Review หลักฐานและ deploy/hosted ก่อน done

## เกณฑ์ตรวจรับ

- [x] AC-01: เริ่ม/หยุด Auto ได้ใน Story และ Tower; ชนะแล้วรอ confirmed settlement ก่อนเข้าสู่ด่านหรือชั้นถัดไป อิง frontier จริง
- [x] AC-02: แพ้/หมดเวลาทำ retry ด่านเดิมตามจำนวนที่ยืนยันและ reset ตัวนับเมื่อชนะ; receipt เดิม/ rerender ไม่ทำ retry ซ้ำ
- [x] AC-03: กดหยุดยกเลิกการเริ่มไฟต์ถัดไปทันที ปล่อยไฟต์ปัจจุบันจบ; เปลี่ยนหน้า/เซฟ/reload/เน็ตขาด/กระเป๋าเต็ม/error หยุดอย่างชัดเจน ไม่เกิด background command loop
- [x] AC-04: ใช้ combat engine เดิม/ความเร็ว1x2x4เดิม และ UI ปุ่มไม่ล้น320/390; actual browser/API/SQLหลายชนะ-แพ้/หยุด-ฟื้นเน็ต/reloadผ่าน

## หลักฐาน

plan/evidence/task-135-review.json (ยังไม่รัน)

## Blocker / คำถาม

ไม่มี ผู้ใช้ยืนยัน “3 ครั้งติด” แล้ว: แพ้รวมสามไฟต์ติดกันและ reset หลังชนะ.

## Review

Local ผ่าน: 650 tests / actual Auth-API-SQL-mobile 7+2 กลุ่ม / root และ filtered build. Source `7a76b40cc` ขึ้น Vercel success และ public hosted4groups/24bundleSHA/mobile320390 ผ่านแล้ว; ไม่มี owner write/SQL/env ใหม่. ทุกเกณฑ์ผ่าน done. [หลักฐาน](../evidence/task-135-review.json)
