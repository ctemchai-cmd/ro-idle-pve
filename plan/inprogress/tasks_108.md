# TASK-108 — ฮีลหมู่ Priest ผลอัปสกิล ชุดท่ามอน และไอคอน

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · D-139/design37

## งานที่ต้องรอก่อนหน้า
TASK-107, TASK-035, TASK-036, TASK-040 (done)

## ขอบเขตและผลส่งมอบ
ทองใช้ craft-resources/16.webp; Priest Resurrection เปลี่ยน Happiness Heal ฮีลหมู่ใหญ่ priest/14.webp โดยคง ID/เลเวลเดิม; สกิลที่เพิ่มระดับแล้วลดแค่ SP ต้องเพิ่มผลสกิลด้วย; ไอคอนธาตุใช้ภาพ assets; มอนมีชุดท่าหลากหลายบางตัว3–4ท่า; ป้ายผู้สวมการ์ด/อุปกรณ์แสดงตราอาชีพจริงตามที่ผู้ใช้ยืนยัน.

## รายละเอียด
ยึด design37. ตัวเลขที่ผู้ใช้ไม่ได้กำหนดเป็น assistant baseline; ไม่รัน balance batch. ไม่แก้สูตรกลาง/เวลา/CC/เซฟเจ้าของ/SQL/env/6173. ภาพต้นทางคง bytes และมี metadata/provenance. เก็บ stable126skill IDs/ทุนเดิม.

## ขั้นตอน
1. บันทึก before และ audit resolved126×10; ตรวจภาพ/metadata แล้วนำเข้าเฉพาะที่เลือก
2. แก้ generator ของสกิล/มอนแบบ idempotent และ description จากข้อมูลจริง
3. ใช้ภาพธาตุและตราผู้สวมผ่าน AssetPack ใน UI มือถือ
4. ทดสอบ effect/queue/speed/migration/จริงบน Chrome/build/assets แล้ว push และตรวจ Vercel

## เกณฑ์ตรวจรับ
- [x] AC-01: ทอง/ฮีล Priest ตรงสองภาพที่ขอ; ธาตุครบ10+weapon เป็นภาพที่เลือก มี SHA/metadata และไม่เปลี่ยนตารางธาตุ
- [x] AC-02: Happiness Heal ฮีลทุกเพื่อนที่ยังมีชีวิตตาม MATK ทุกระดับ; ไม่ revive;126IDs/เลเวล/ทุน/SP/CT/ACDเดิม
- [x] AC-03: resolved audit ทุกสกิลไม่เหลือ SP-only;5ท่าที่พบเพิ่มผลจริงทุกระดับและ descriptions ตรง
- [x] AC-04: Story/Tower/Daily มีหลายชุดท่า รวม3–4ท่า; ไม่มีซ้ำช่อง; ใช้ shared engine/SP/interrupt ตามเดิม; heavy castยังเปิดก่อนและใช้ค่า calibration เดิมโดยไม่เอา heavy MATK ไปคูณท่าเบา
- [x] AC-05: การ์ด/ไอเทมที่ใส่อยู่แสดงชื่อ+ตราอาชีพจริงทุกจุด และ mobile320/390ไม่ล้น
- [ ] AC-06: focused/shared-speed/migration/assets/build/readiness/actualChrome/hostedผ่านพร้อมหลักฐานก่อนdone

## วิธีตรวจและหลักฐาน
task-108-* audit, arithmetic/effect fixtures, real Chrome selected UI and enemy rotations, public SHA/API/Auth gate. เก็บผลที่ไม่ผ่านก่อนแก้ ไม่เปลี่ยนเกณฑ์เพื่อซ่อน failure.

## Blocker / คำถาม
ไม่มี; ผู้ใช้ยืนยัน attribution หมายถึงผู้สวมใส่การ์ด/อุปกรณ์.

## บันทึก
เริ่ม23ต.ค.2026; พบ SP-only5ท่า Provoke/HellPlant/AnkleSnare/BardEncore/DancerEncore.

Local23ต.ค.:101uniqueTS/38Python/M0/readiness8/build/assets271-60460-6926ผ่าน. ActualAuth/API/SQLและmobile320/390ผ่าน native6borrowed skills+PriestHeal recipe/soundจริง; owneremblemsmain/offteam/card/gear/picker. R1runtimealiasbugแก้และมีnegativebuildtest;R2/R3เป็นharnessscene/navigationแก้และเก็บfailure. ไม่balancebatch/ownerwrite/6173restart. รอpublicAC06ก่อนdone.
