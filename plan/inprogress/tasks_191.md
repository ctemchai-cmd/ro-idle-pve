# TASK-191 — Artifact jewelry และ UI มือถือ

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
- [ ] AC-01: 13 jewelry จริงครบอาชีพ; native media เดิมและ pack ไม่เกิน32MiB
- [ ] AC-02: รายละเอียดแยก stats/skill/rarity; ผลรีสกิลกลับมาเลือกต่อได้
- [ ] AC-03: bulk เลือกเอง/กรอง/ยืนยันรายการและยอดคืน; ปุ่มไม่หลุดหน้าจอ
- [ ] AC-04: mobile320390/root/clean committed checkout/Vercel ผ่าน
