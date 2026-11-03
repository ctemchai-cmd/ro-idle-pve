# TASK-190 — Artifact สุ่มสกิลและรีสกิล

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
- [x] AC-01: ทุกสีสุ่มครบ Active/Passive ในสายและคง legacy instance
- [x] AC-02: ผลรีสกิลคงที่/เลือกเดิมใหม่/receipt replay/ย่อย atomic
- [x] AC-03: ค่าสถานะกับ Passive ตรงระหว่าง UI และ shared engine; หินจากด่านและ Event
- [x] AC-04: native/strict/build/clean committed checkout/Vercel ผ่าน

ตรวจผ่านและเผยแพร่ source `54027489226e913842bb2b1612a6e6211706edce` · [Vercel](https://vercel.com/chanon2/ro-idle-pve/13w175EUcwDuDh8HA4jPzRJiUxDV) · [review](../evidence/task-190-review.json)
