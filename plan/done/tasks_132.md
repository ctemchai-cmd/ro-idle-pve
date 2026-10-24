# TASK-132 — ปรับ Hi-class สายดาเมจเข้าเป้า9–11k และลดต้นเหตุ Assassin

Milestone: M4 follow-up · ประเภท: พัฒนา/ตรวจรับ · D-162

## งานที่ต้องรอก่อนหน้า

- TASK-131 — frozen balance results และ patch ที่ขึ้นเว็บ
- TASK-130 — Awaken identities และ independent stacking

## เป้าหมายและขอบเขต

ระบุสาเหตุด้วย per-skill/crit/uptime และ controlled ablation แล้วปรับเฉพาะ contribution ที่เกิน ไม่ใส่ตัวคูณลดดาเมจตาม job ใน engine ไม่เปลี่ยน global crit/uncapped stacking/ราคา/ทุน/CT/ACD/SP/เซฟ; latestD163เพิ่มClass2AssassinและWhitesmithที่ยังต่ำกว่า9k

## ขั้นตอน

1. เก็บ frozen content ก่อนปรับและวัด actual engine โดยเอาส่วน ATK/penetration/Katar ออกทีละส่วน รวมถึงปรับ ratio/duration โดยใช้ของ/budget/seedเดิม
2. เลือกการปรับที่ลดส่วนเกินเล็กน้อย คงจุดเด่นคริและการคอมโบ บันทึกตัวเลขทุก rank ใน generator และคำอธิบายจาก program
3. เปรียบเทียบ fixed build ก่อนหลังและคัด candidate ใหม่ทั้ง solo/pressure/rank1–10 พร้อมตรวจ Class2/base ไม่ถูกรบกวน
4. targeted/full checks/build/คำอธิบายมือถือและ Vercel public proof ก่อน done

## เกณฑ์ตรวจรับ

- [x] AC-01: มี causal ablation และ per-skill/crit/uptime/overlap จริง ระบุแหล่งที่นำ พร้อมข้อจำกัดของ marginal comparisons
- [x] AC-02: ปรับเฉพาะ curve/effect ที่ระบุ ไม่มี job penalty หรือ buff cap/refresh; IDs/ราคา/ทุน/CT/ACD/SPเดิม; programอื่นนอกEP/HighCartTerminationไม่เปลี่ยน และ Awaken1ยังดีขึ้นจาก baseMax
- [x] AC-03: fixed A/B และ candidate re-screen หลายseed/solo/pressure/ช่วงAwaken; Hi90/Common60/4ActiveAw10 สายดาเมจ9อาชีพเฉลี่ย9–11k และClass2Assassinใกล้Hunter/Wizardที่gearเท่ากัน ไม่อ้างทุกencounterสมดุล
- [x] AC-04: regression/parity/stacking/descriptions/build/mobile/public release ผ่าน และบันทึกหลักฐาน

## วิธีตรวจและหลักฐาน

scripts/game/assassin-cause.ts / plan/evidence/task-132/diagnosis.json / tests/game/assassin-awaken-balance.test.ts / report ก่อนหลัง / native และ public browser

ผู้ตรวจ: Codex · รอบ review:1 · local ผ่าน 638 tests / native 5 groups / 3,338 ไฟต์; public hosted 4 groups ผ่าน: content hash,24bundle SHA, mobile320390, auth401, zero owner writes

## Blocker / คำถาม

ไม่มี ผู้ใช้ยืนยันเป้า Hi-class สายดาเมจ 9–11k และลด Class 2 Assassin ตาม D-163

## Steering ก่อนตรวจรับ

D163ผู้ใช้เปลี่ยนเป้าจากลดนิดเดียวเป็น9–11kเฉพาะHiสายดาเมจ และให้Class2Assassinลดด้วย. ปรับเฉพาะEPbaseATK14.4–30%/Aw33–36%11–12s; เพิ่มHighCartTermination10%เพื่อWSผ่าน9k. คงSonic/Katar/penetrationและroleของsupport/tank. เกณฑ์AC03เปลี่ยนตามคำสั่งล่าสุดก่อนวัดจริง ไม่ใช่ปรับเกณฑ์ซ่อนผลfail.

## ผลส่งมอบ

Source `8fe64ee6a` ขึ้น Vercel success; [รายงาน](../evidence/task-132/README.md), [review](../evidence/task-132-review.json), [hosted](../evidence/task-132-hosted.json). ทุก AC ผ่าน. ไม่มี SQL/env ใหม่ ไม่รีสตาร์ต6173. TASK041ยังเปิดเพื่อตรวจองค์ประกอบอื่นต่อ.
