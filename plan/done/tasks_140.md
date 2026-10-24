# TASK-140 — Auto Battle แสดงผลชนะครั้งเดียวก่อนเปลี่ยนไฟต์

Milestone: M4 · Bug fix ตาม D164 / design52

## งานที่ต้องรอก่อนหน้า

TASK-135, TASK-139 (done)

## ขอบเขตและผลส่งมอบ

ล้างผลไฟต์เก่าเมื่อเริ่มchallengeใหม่ ให้Result→Warning→ไฟต์ใหม่ไม่ย้อนResultเดิม แม้APIหรือเตรียมภาพช้า. ไม่เปลี่ยนengine/เวลาSI/สกิล/รางวัล/เซฟ/แพ้3ครั้ง/เวลารอเดิม.

## ขั้นตอน

1. จำลองactualField/enginecheckpointsและtransportช้าให้พบป้ายเก่าย้อน
2. แก้ผลลัพธ์เก่าที่จุดเริ่มchallenge ไม่แก้ด้วยCSS/ตัดWarning
3. ตรวจStory/Tower,stopระหว่างintro,เริ่มไม่สำเร็จ,มือถือ320390/retryunit/build
4. review/deploy/publichostedก่อนย้ายdone

## เกณฑ์ตรวจรับ

- [x] AC-01: Story/Tower แสดงผลเก่าหนึ่งครั้ง แล้วWarning→ไฟต์ใหม่; ไม่มีผลเก่าย้อนเมื่อAPIหรือprepareช้ากว่า2100ms
- [x] AC-02: เริ่ม/จบครั้งเดียวต่อไฟต์; แพ้3ครั้ง/รับรางวัลเดิม/คิวและข้อมูลengineไม่เปลี่ยน
- [x] AC-03: หยุดระหว่างintroยกเลิกnextได้,เริ่มไม่สำเร็จหยุดAutoและปุ่มไม่ค้าง; UIมือถือ320390ไม่overflow
- [x] AC-04: meaningfulnative regression/unit/uncachedbuild+filtered/Vercel+hostedผ่าน;ไม่owner/SQL/env/6173

## วิธีตรวจและหลักฐาน

T140-AC01–04: plan/evidence/task-140-review.json; actualField+nativeenginecheckpoints/controlledtransport ไม่ใช่Auth/Supabase proof. ประวัติbaselineเก็บแยก.

## Blocker / คำถาม

ไม่มี

## ผล review

Nativebefore2/after4groups,unit4,M0readiness8,uncachedroot+filteredbuild,VercelSUCCESSsourcecb4aad4f7,hosted4groupsผ่าน. ไม่แก้engine/data/SQL/env/owner.
