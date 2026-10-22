# TASK-084 — ป้ายอัปเกรดกระชับและการเติบโต Call Spirit

Milestone: M4 · D-112/D-113

## งานที่ต้องรอก่อนหน้า

- TASK-068, TASK-079, TASK-083 (done)

## เป้าหมายและขอบเขต

เอา R/E นำหน้าป้าย Refine/Enchant ออก ให้ +5/5 โดยสีแยกเดิม และทำ Call Spirit ให้เลเวลมีผลชัดตามคำขอผู้ใช้: จำนวนบอล1–5 ตามLv.1–5 จากนั้น5ลูกและเพิ่มATKต่อลูก1.2–2%ที่Lv.6–10 จำนวนถือสูงสุด5 คง SP27→18/CT400ms/ACD700ms/ต้นทุนอัปเกรด/เลเวลที่เรียน/กติกาใช้บอลเดิม

โบนัสตามเลเวลสกิลที่เรียนของเจ้าของ ใช้ modifier resource ใน additive ATK bucket เดิม รวมบอลที่ได้จาก Spirit Combo; ไม่เพิ่มวงบัฟใหม่หรือคิดจากบอลที่จ่ายไปแล้ว บอลจากPassiveเมื่อไม่ได้เรียนCall Spiritยังใช้พื้นฐาน1% ไม่มี simulation/calibration ใหม่

## ขั้นตอนการทำ

1. ปรับ shared badge และ oracle เดิม ตรวจ render ของจริงแบบ disposable
2. เพิ่มเส้นจำนวนบอลและเปอร์เซ็นต์ พร้อม typed resource modifier ที่อ้างเลเวลสกิลและตรวจข้อมูลผิดก่อนรัน ไม่ hardcode Monk ใน engine
3. ใช้ helper เดียวใน recompute/snapshot/status projection/คำอธิบาย และตรวจ Lv.1–10/ใช้บอล/ขัดร่าย/ทีมแยกกัน
4. Build/M0/push/deploy/public proof แล้วทบทวนเกณฑ์ก่อนย้าย done

## ผลส่งมอบ

- Shared equipment labels + skill/resource curves และ validation
- คำอธิบาย/บัฟที่ตรงกติกาจริงและหลักฐาน focused/build/hosted

## เกณฑ์ตรวจรับ

- [x] AC-01: ป้าย Refine แสดง +5 และ Enchant แสดง 5 ไม่มี R/E นำหน้าทุกจุดที่ใช้ EquipmentProgress; สีฟ้า/ม่วงและคำอธิบายสำหรับ accessibility คงอยู่ ของที่ไม่สวมและระดับศูนย์ไม่มีป้ายสมมติ
- [x] AC-02: Call Spirit Lv.1–5 เพิ่มบอล 1–5 ลูกต่อครั้ง; Lv.6–10 เพิ่ม 5 ลูกและ ATK ต่อลูก 1.2/1.4/1.6/1.8/2% โดยสูงสุด 5 ลูก โบนัสอยู่ใน additive ATK bucket เดิมและคิดเฉพาะลูกที่เหลือหลังหักตอนเริ่มร่าย ไม่คืนเมื่อขัด
- [x] AC-03: โบนัสอิงเลเวลที่ตัวนั้นเรียน ไม่ยืมจากเพื่อน; คำอธิบาย/ตารางเลเวล/ไอคอนบัฟแสดงจำนวนและเปอร์เซ็นต์ตรง shared resource calculation รวมไม่มี Call Spirit ที่เรียนยังใช้พื้นฐาน1%จากบอล Passive
- [x] AC-04: Focused rule/description checks, M0/content/type/boundaries/build/secrets และ public Vercel source/UI/data/API/login/PWA ผ่านก่อน done; เก็บ skill levels/ค่าใช้จ่าย/paid ledger เดิมและใช้ backup/migration flow เดิม ไม่มี SQL/env/assets ใหม่หรือ balance batch

## วิธีตรวจและหลักฐาน

Render shared component ด้วย React, focused spirit/skill description/class tests, M0/build และ read-only public deployment smoke; หลักฐานบันทึก task-084-* ไม่รัน Auth suite เก่าทั้งชุดเพื่อข้อความป้าย

## Review

22 ต.ค.2026 ผ่านทุกAC [review](../evidence/task-084-review.json) / [actual hosted](../evidence/task-084-hosted.json) Source `e2323a28367c5ebc3636bb7e0f379dd725c24e39` VercelSUCCESS: https://vercel.com/chanon2/ro-idle-pve/ABK9Nud7EM3ACMubW6ZrdPEK9mdA

40focusedTS/M0/build/type/boundaries/secrets/generator/readiness8 และpublic3groupsผ่าน ไม่มีownerwrite/6173restart/SQL/env/assets/newbalancebatch. ActualisolatedChrome3groupsและReactrender5casesผ่าน เปิดภาพnative320/390+decimalstatus390ดูจริงแล้ว ค่าCall Spirit/Spirit Comboข้อความอ่านrankเจ้าของเดียวกับengine SP/ราคาเดิม
