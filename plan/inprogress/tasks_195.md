# TASK-195 — ตัวตน/ธาตุบอสตรงภาพ และไอคอนธาตุชุดเดียวกัน

Milestone: M4 · D217

## งานที่ต้องรอก่อนหน้า
TASK-194 (done)

## ขอบเขต
[design98](../design/98-boss-identities-and-element-icons.md)

## ขั้นตอน
1. เทียบ75identityกับฐานROและผูก122ด่านที่เคยเปลี่ยนแต่ภาพ
2. ใช้identityเดียวกันในengine/UI/ธาตุ/การ์ด คงตัวเลขและกติกาเดิม
3. นำเข้าไอคอนธาตุOrigin10แบบ พร้อมsource/SHA
4. ทดสอบshared engine/native mobile/build/clean committed archive แล้วตรวจเว็บจริง

## เกณฑ์ตรวจรับ
- [ ] AC-01: ฐานข้อมูล75ชนิดมีหลักฐาน และ122ด่านตรงภาพ/ธาตุ/เผ่า/ขนาด
- [ ] AC-02: คงค่าสู้/คิว/รางวัล/โจมตี15%เดิม และfrozen/backupปลอดภัย
- [ ] AC-03: ไอคอนธาตุ10แบบชุดเดียวกัน native mobile320/390ไม่ล้น
- [ ] AC-04: tests/strict/M0/sourcepack/root/cleanGit/publicผ่าน

ผลตรวจ: ยังไม่ครบ
