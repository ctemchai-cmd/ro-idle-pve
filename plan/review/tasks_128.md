# TASK-128 — Hunter ทำดาเมจบอสได้คุ้มขึ้น

Milestone: M4 · D-158 · งานเสริมระหว่าง TASK-125

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-031, TASK-107 (done).

## ขอบเขตและรายละเอียด
เพิ่มเฉพาะ Spiral Volley, Claymore, Rapid Fire; ไม่เปลี่ยนคิว SP ราคาหรือสกิลอาชีพอื่น ไม่รัน balance batch. ค่าพลังเป็น assistant baseline สำหรับให้ผู้ใช้ทดลองกับบอสเดี่ยว.

## ขั้นตอน
1. เทียบกำลังรวมต่อเป้าต่อครั้งกับสูตรเดิม
2. ปรับข้อมูลที่ใช้ร่วม runtime/headless และ Awaken ให้ไม่ถอยจาก base max
3. ตรวจทุก rank, ธาตุอาวุธ, จำนวน hit, ความเท่ากันที่1×/2×/4× และคำอธิบาย
4. build/ตรวจมือถือ/ขึ้นเว็บพร้อมชุด Hi-class ก่อนปิดงาน

## เกณฑ์ตรวจรับ
- [x] AC-01: Spiral Volley 3 hit รวม420→750%ATK/ธาตุอาวุธ, Claymore450→750%ATK, Rapid Fire4hitรวม630→1050%ATK; SP/CT/ACD/ราคาและ123สกิลเดิมไม่เปลี่ยน; Awakenต่อจากค่าที่ปรับแล้ว
- [x] AC-02: ทุกrank/เป้าเดี่ยวและหมู่/ธาตุ/interrupt/1×2×4×/checkpoint ตรง sharedengine; คำอธิบายและผลหลายhitจริง; updated goldensเฉพาะ9cases
- [ ] AC-03: build/checks/native mobile320390/hostedpublicตรงsourceใหม่;ไม่แตะownerเซฟ/SQL/env/6173และไม่รันbalance batch

## วิธีตรวจและหลักฐาน
tests/game/hunter-impact.test.ts; task-128-golden-authoring-audit.json; integration125และhostedpublic.

## บันทึก
24ต.ค.2026 ผู้ใช้ระบุHunterอ่อน โดยเฉพาะSpiral Volley และAoEเสียโอกาสบนบอสเดี่ยว. เดิมSpiralสูงสุด280% neutral/หนึ่งhit;Rapid895.7812%/Claymore639.8438%. ไม่แก้globalAoE multiplierหรืออาชีพอื่น.

- 24ต.ค.2026 local validationผ่านแล้ว;624TS/root+filteredbuild/M0/actualAuth-API-SQL-mobile320390. ภาพและผลตรวจในtask-125-mobile-live.json;ยังรอpushและhostedpublicก่อนdone.
