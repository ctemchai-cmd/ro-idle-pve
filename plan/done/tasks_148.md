# TASK-148 — อุปกรณ์ Lv.80/100 และเพดาน Hi-class Lv.100

Milestone: M4 · D172 · design61

## งานที่ต้องรอก่อนหน้า
TASK-115, TASK-125, TASK-147

## ขอบเขตและผลส่งมอบ
เพิ่มอุปกรณ์36แบบต่อTier80/100และเพดานตัวละครHi100ตามผู้ใช้ยืนยัน. บท11Lv80/บท12Lv100,บท1–10เดิม. กาชาใช้อุปกรณ์ตามบทที่ผ่านครบเหมือนเดิม. ของใหม่ต้องดรอป/กาชา;ไม่เปิดอัปTier. ของเก่า/Refine/Enchant/cards/ราคาสกิล/ตารางAwaken/อัตราดรอป/สกิล/ศัตรูเดิม.

## ขั้นตอน
1. Freeze authored/runtime เดิมและออกแบบระดับ/ตัวเลข/pool/compatibility
2. ขยายgenerator/schema/level table/option scale และmedia referencesจริงโดยคงbudget
3. ตรวจ330stage/farm-gacha/ใส่ของ/level100/migration-frozen-window/replay/compatibility
4. Native320390/asset/build/root-filtered/publicVercel;ตรวจครบก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: มี36แบบทุกTier1/20/40/60/80/100;ระดับ80/100มีstats/role/optionsเพิ่มตามสูตร;ครบ10weapon families/6slots/nativeicons;ฟาร์ม11→80/12→100และกาชาอ่านตารางเดียวกัน;อัตรา/การ์ด/ของเดิมไม่เปลี่ยน
- [x] AC-02: Hiเลเวล91–100ใช้ทรัพยากรและแต้มmanualถูกต้อง,gate80/ไม่มีgate90/Class2cap70/Class3ปิด;ของ80/100ใส่ตามrequired_levelและอาชีพ;เซฟเก่าย้ายผ่านflowสำรองเดิม/ช่วงAFKเก่าคงรางวัล/คำสั่งซ้ำไม่แจกเพิ่ม/slot investmentsคงอยู่
- [x] AC-03: หน้าตารางฟาร์ม/กระเป๋า/ใส่ของ/อัปเลเวลแสดงตรงข้อมูลจริงที่320390;packbudget32MiBและroot-filteredbuildผ่าน;push/VercelSUCCESS/publicproofผ่าน

## วิธีตรวจและหลักฐาน
Frozen148before, typed actual account commands and migration, seeded farm/gacha, native synthetic Field/equipment UI320390; no owner AuthSQL/env. Report plan/evidence/task-148-review.json.

## Blocker / คำถาม
ไม่มี. ผู้ใช้ยืนยันขยายเพดาน100แล้ว. ไม่restart6173/ไม่owner writes/ไม่balance batch.

## ผลตรวจ local

707TSทั้งหมด/39scope-recheck/27targeted/nativeFarm2+Gear2ผ่าน. 330pools/16profiles/13Highjobs/actual signed migration+claim+receipt replay, rootbuild/M0/304starter60460libraryผ่าน. filtered finalผ่าน; รอpublicVercelก่อนAC03.

## ผลส่งมอบ

Sourcec058aceb1 VercelSUCCESS/publichosted4groupsผ่าน(healthSIN1/auth401/content2c85/packb1e9/24bundleSHA+cap100และgear/nativewardrobe/login320390/0errors-writes).707TS/native4/root-filtered/assetchecksผ่าน. TASK148done. ไม่SQL/env/owner/6173 changes.
