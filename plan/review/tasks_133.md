# TASK-133 — คำอธิบาย P.ATK/M.ATK และ Impo/Loud บัฟเวท

Milestone: M4 follow-up · D-164

## งานที่ต้องรอก่อนหน้า

TASK-130, TASK-132

## ขอบเขตและรายละเอียด

ทำตามคำขอล่าสุดของผู้ใช้บน shared contracts/runtime เดิม ไม่เพิ่ม SQL/env ไม่แก้ owner save หรือรีสตาร์ต6173. แยก pure rules จาก UI และใช้ค่า/receipt จริง.

## ขั้นตอน

1. ระบุ authority และ edge cases ก่อนแก้ พร้อมบันทึกกติกาใน design52
2. พัฒนา shared helper/reducer และ adapter/UI โดยไม่ทำสูตรซ้ำ
3. ตรวจเฉพาะกติกาที่เปลี่ยน พร้อม full regression/build และ isolated local stack
4. Review หลักฐานและ deploy/hosted ก่อน done

## เกณฑ์ตรวจรับ

- [x] AC-01: คำอธิบาย shared ของทุกสกิล/ทุก rank/Timeline ระบุ P.ATK หรือ M.ATK ตามสูตรจริง ไม่มี ATK หรือพลังโจมตีที่กำกวม
- [x] AC-02: Impositio และ Loud Voice เพิ่ม M.ATK เท่ากับ P.ATK ในทุก rank รวม Awaken; ค่าเดิม/เวลา/ราคา/ทุน/คิว/independent stacking คงเดิม
- [x] AC-03: ตรวจ actual engine ว่า stats ทั้งสองเพิ่ม/ซ้อน/หมดตามเวลา และ UI มือถือแสดงผลตรง program; regression/build ผ่าน

## หลักฐาน

plan/evidence/task-133-review.json (ยังไม่รัน)

## Blocker / คำถาม

ไม่มี

## Review

Local ผ่าน: 650 tests / actual Auth-API-SQL-mobile 7+2 กลุ่ม / root และ filtered build. ยังไม่ done: รอ source deploy และ public hosted proof. [หลักฐาน](../evidence/task-133-review.json)
