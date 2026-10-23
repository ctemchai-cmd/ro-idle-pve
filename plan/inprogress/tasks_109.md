# TASK-109 — ความยาก Story/Tower และ Refine สูงสุด +15

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · D-140/141/design38

## งานที่ต้องรอก่อนหน้า
TASK-027,035,040,105,108 (done)

## ขอบเขตและผลส่งมอบ
Storyเพิ่มแรงกดดันทุก5ด่าน โดยเฉพาะ6-5→6-10→6-15;Towerโจมตีหนักขึ้นเล็กน้อย;Refine5–10ยากขึ้น/11–15ต้องลุ้นและสูงสุด15/การ์ดรวม3ช่อง. คงความก้าวหน้า/สิทธิ์/ทรัพยากรเดิม. ไม่balancebatch/ownercloud/privateenv/6173restart.

## รายละเอียด
ยึดdesign38 ตัวเลขassistantbaselineไม่ใช่อัตราชนะที่วัดกับทีมเจ้าของ. ใช้data/generator/sharedreducers/schema/UIเดียวกัน. ผู้ใช้ยืนยันเริ่ม0ช่อง/ปลดที่+5/+10/+15;ย้ายการ์ดที่ช่องล็อกคืนกระเป๋าโดยเก็บinstance/levelเดิม.

## ขั้นตอน
1. Archiveก่อนแก้และตรวจcalibrationจริง/ทุก5ด่าน/รอยต่อ
2. AuthoridempotentStorygrowth/Tower+25% และคุมเพียงHP/attackไม่แอบเพิ่มspeed/CC
3. ขยายRefine15พร้อมstrictschemas/quotes/pity/sockets/migration/UI
4. ทดสอบarithmetic/sharedengine/roll-boundaries/receipts/migration/actualChrome/build/publicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: chapter3ขึ้นไปHP/P.ATKไม่ลดข้ามด่าน;ทุก5ด่านโตตามprofile โดย6-10/6-15 HP≥1.45×และATK≥1.20×ด่านก่อน5;heavyคง4s/ขัดได้/คิวเดิม
- [x] AC-02:TowerATKจากสูตรเดียวเพิ่มประมาณ25%ทุกชั้นรวม100+;HP/เกราะ/ความเร็ว/รางวัล/สิทธิ์เดิม
- [x] AC-03:Refine1–4แน่นอน/5–10ลดเรต/11–15เรตต่ำกว่า/สูงสุด15;ทุกขั้นมีราคาและpityUIตรงsharedrule ปัดเปอร์เซ็นต์ไม่กลบ0.5pp
- [x] AC-04:การ์ดสูงสุด3ช่อง/จุดปลดตรงคำตอบ;เซฟเดิมเก็บของ/การ์ด/Refine/Enchant/เงิน/เลเวลและของเดิมที่ติดอยู่ไม่สูญหาย
- [x] AC-05:rollต่ำกว่า/เท่าขอบเรต/guarantee/insufficient funds/inbattle/refine16/receipt-replay/savedRefine15ผ่าน;ค่าstat/preview/serverตรงกัน
- [ ] AC-06:generator/M0/readiness/build/targeted/actualChrome320-390/publicVercelผ่านพร้อมหลักฐานก่อนdone

## วิธีตรวจและหลักฐาน
task-109-* arithmeticและfixedfixturesเท่านั้น ไม่มีrenewedbalancebatch;เก็บfailureจริงและแก้โดยไม่ลดเกณฑ์.

## Blocker / คำถาม
ไม่มีคำถามค้าง;จุดปลดยืนยัน0→1@5→2@10→3@15.

Localผ่าน545TS/M0/readiness8/build/actualAuth-API-SQL-Chrome3groups320/390;Refine15sameUUIDreplayไม่จ่ายซ้ำ/ใส่ช่องสาม/โหลดกลับผ่าน. PublicVercelpendingก่อนdone. Evidence task-109-tests/source-audit/ui-live/local-stack. R1selector3freecards ambiguousแก้เฉพาะharnessใช้Commonexact;R2และR3passed. Noownerwrites/SQL/env/6173restart/balancebatch.
