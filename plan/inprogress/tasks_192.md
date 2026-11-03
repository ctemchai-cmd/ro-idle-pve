# TASK-192 — ทบทวนสกิลและบาลานซ์ทุกอาชีพ

Milestone: M4 · D212–214

## งานที่ต้องรอก่อนหน้า
TASK-014 (done), TASK-189 (done)

## ขอบเขต
ดู [design95](../design/95-random-artifacts-and-skill-audit.md). ไม่แก้บัญชีผู้เล่นจริง/SQL/env/6173.

## ขั้นตอน
1. Freeze baseline และตรวจ schema/ข้อมูลเดิม
2. ลงมือ shared rules/UI หรือ audit ตามขอบเขต
3. ตรวจ actual rules/receipts/native/mobile และเปรียบเทียบผล
4. Root + clean committed checkout build แล้วเผยแพร่และตรวจเว็บจริง

## เกณฑ์ตรวจรับ
- [ ] AC-01: baseline frozen/152 programs/32 jobs/equal gear/disjoint seeds
- [ ] AC-02: วิเคราะห์ต้นเหตุ OP/อ่อน/บทบาทซ้ำ พร้อมปรับที่โปรแกรมสกิล
- [ ] AC-03: วัดซ้ำดาเมจ/ทีม/ฮีล/CC และยืนยัน deterministic replay
- [ ] AC-04: คำอธิบายตรงกติกา/หลักฐานข้อจำกัด/build/Vercel ผ่าน
