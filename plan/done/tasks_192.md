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
- [x] AC-01: baseline frozen/152 programs/32 jobs/equal gear/disjoint seeds
- [x] AC-02: วิเคราะห์ต้นเหตุ OP/อ่อน/บทบาทซ้ำ พร้อมปรับที่โปรแกรมสกิล
- [x] AC-03: วัดซ้ำดาเมจ/ทีม/ฮีล/CC และยืนยัน deterministic replay
- [x] AC-04: คำอธิบายตรงกติกา/หลักฐานข้อจำกัด/build/Vercel ผ่าน

ตรวจผ่านและเผยแพร่ source `54027489226e913842bb2b1612a6e6211706edce` · [Vercel](https://vercel.com/chanon2/ro-idle-pve/13w175EUcwDuDh8HA4jPzRJiUxDV) · [review](../evidence/task-192-review.json)
