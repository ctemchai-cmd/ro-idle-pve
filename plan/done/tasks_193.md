# TASK-193 — ลดผล ASPD ต่อคิวและอธิบาย Artifact/ทรัพยากร

Milestone: M4 · D215

## งานที่ต้องรอก่อนหน้า
TASK-192 (done)

## ขอบเขต
[design96](../design/96-queue-haste-and-artifact-clarity.md)

## ขั้นตอน
1. Freeze inputและเพิ่มversioned SI profile
2. ใช้shared timingในengine/UI/runner
3. แก้คำอธิบายและทรัพยากร Artifact
4. ตรวจrules/native320390/build/cleanGit/publish

## เกณฑ์ตรวจรับ
- [x] AC-01: ลดผล ASPD เฉพาะ SI เป็น25% ของส่วนเกิน100; ตีปกติ/CT/ACD/4ช่องคงเดิม
- [x] AC-02: live builder/UI/Timeline/headless/checkpoint/interrupt/1x2x3xตรงกัน; legacy profileคงผลเดิม
- [x] AC-03: Artifactสกิลเดียวกันยังต่างตามRarity/Lv/ดาว; คำอธิบายระบุผลจริง
- [x] AC-04: ผลึก Artifact แยกจากแก่น Breakthrough; ทรัพยากร3ชนิดมี native icon/ยอดจริง/มือถือ320390
- [x] AC-05: strict/tests/root+clean committed archive/Vercel/publicผ่าน

ตรวจผ่านและขึ้น Vercel source`16bd9aae609732bcae62aebc6efb3f99e6adc396` · [Deployment](https://vercel.com/chanon2/ro-idle-pve/3vKsfrgPP9Eih5ggwLA4tfAp92pZ) · [review](../evidence/task-193-review.json)
