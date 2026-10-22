# TASK-079 — ภาพการ์ดเข้ากรอบและคำอธิบายผลอัปสกิล

Milestone: M4 · D-105 · Dependencies: TASK-073, TASK-024, TASK-076, TASK-078 (done)

## งานที่ต้องรอก่อนหน้า

- TASK-073, TASK-024, TASK-076, TASK-078 (done)

## ขอบเขตและรายละเอียด

ปรับรูปการ์ดในกระเป๋า/ช่องการ์ด/ตัวเลือกให้พอดีกับกรอบมน โดยไม่บัง badge และคงสัดส่วนภาพ ผู้ใช้ถามแหล่งเปลี่ยนธาตุและความต่าง Lv.1–5 ของ Call Spirit/Provoke ให้แสดงผลจากนิยามจริง ทั้งสกิลที่เปลี่ยนพลังและสกิลที่ลด SP อย่างเดียว ระบุผลบัฟ/ระยะเวลา/ขอบเขตธาตุและการยั่วยุ ห้ามเปลี่ยนค่าสกิลหรือสร้าง endow เพิ่มในงาน UI นี้

## ขั้นตอนและผลส่งมอบ

1. อ่าน weaponElement/status/skill programs และแก้ card image geometry ที่ 320/390px
2. เพิ่ม description และ read-only resolved level comparison ใช้ shared resolver, SP modifier และเวลาเดียวกับ preview; lazy เฉพาะสกิลที่เลือก
3. แสดงการเปลี่ยนเลเวลถัดไปโดยไม่ต้องเปิด details และตารางเทียบทุกเลเวลที่เปิดดูได้
4. ตรวจ focused description tests/type/boundaries/build และ actual disposable Auth/mobile Chrome; push/deploy ตรวจ public login/PWA

## เกณฑ์ตรวจรับ

- [ ] AC-01: ภาพการ์ด bag/socket/picker ไม่ล้นกรอบที่320/390px สัดส่วน3:4คงเดิม ขอบมนและbadgeไม่ถูกตัด ตรวจภาพจริง
- [ ] AC-02: Call Spirit/Provoke บอกผลและ SP ของLv.1–10ตรงนิยาม; Fire Endow บอกธาตุ/ระยะเวลา/เป้าหมายและผลต่อweapon/fixedspell/armor; Enchant Poison ไม่อ้างว่าเปลี่ยนธาตุ
- [ ] AC-03: สกิลทุกสายแสดงdelta SP/CT/ACD/effectของเลเวลถัดไปตรงresolver รวมcost-only/lockedcap/max/passive/sp-all ไม่มีmutation/NaN และhashcontent/packเดิม
- [ ] AC-04: focusedchecks/build/type/boundaries/secretsและactualmobile/hostedผ่าน ไม่มีinspection save/ownerwrite/SQL/env/newassets/6173restart/balance simulation

## Review

รอหลักฐานการตรวจจริง
