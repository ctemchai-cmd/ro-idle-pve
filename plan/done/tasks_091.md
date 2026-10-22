# TASK-091 — ตารางแพ้ชนะธาตุอิง Ragnarok Origin

Milestone: M4 · D-120

## งานที่ต้องรอก่อนหน้า

- TASK-002 (done)
- TASK-076 (done)
- TASK-087 (done)
- TASK-090 (done)

## เป้าหมายและขอบเขต

ผู้ใช้ยืนยันหมายถึงตารางแพ้ชนะธาตุจากRagnarok Origin ไม่ใช่เปลี่ยนระบบเกราะหรือธาตุของทุกสกิล ใช้ภาพในคู่มือROO Globalเป็นprimarysource ไม่ใช่PC4levels ภาพวันที่5พ.ค.2023; crosscheckROOCCompanionปัจจุบันตรงกันแต่ไม่อ้างทุกregion/patchเดียวกัน เก็บsourceimageเป็นevidenceไม่ใส่runtimepack

## ขั้นตอนการทำ

1. ตรวจแหล่งข้อมูล/พิกัดเดิมและบันทึกbefore
2. ปรับauthorityข้อมูล/sharedrendererตรงจุดและอัปเดตเอกสารปัจจุบัน
3. ทดสอบtargetedและrealmobile/nativeChromeโดยไม่ใช้owneraccount
4. Build/push/Vercel/publicproof→reviewdoneพร้อมอัปเดตบอร์ด

## ผลส่งมอบ

Canonicaldata/rendererและหลักฐานsource/rule/mobile/build/publicที่reproduceได้

## เกณฑ์ตรวจรับ

- [x] AC-01: ตารางครบ100คู่ตรงภาพElemental Effectivenessในคู่มือROO Global โดยแปลงโบนัสเป็นตัวคูณรวมและแถวโจมตี/คอลัมน์เกราะถูกต้อง เช่นFire→Earth175%,Fire→Fire25%,Fire→Water80%,Water→Wind90%,Neutral→Ghost70%,Holy→Undead175%; ระบุภาพ/วันที่/SHA/provenanceและgeneratorreproduceได้
- [x] AC-02: Engine/หัวตาราง/รายละเอียดคู่ที่เลือกอ่านชุดเดียวกันครบ100คู่; ไม่เปลี่ยนธาตุที่สกิล/การ์ด/อาวุธกำหนด ไม่เพิ่มelementlevelsหรือยกสูตรอื่นจากOrigin คงเซฟ/paidledger/slot/cardsและbackup/migrationflowเดิม ไม่ownerwrite/SQL/env/pack/newbalancebatch
- [x] AC-03: Generator/M0/element100pipeline+sourcegoldens/math/class/backup-migration checksและbuild/type/boundaries/secretsผ่าน พร้อมmobile320/390tableและVercelpublichash/source/login/PWAก่อนdone

## วิธีตรวจและหลักฐาน

plan/generators/element_chart.py --check, tests/game/element-presentation.test.ts100pipeline+22sourcegoldens, math/class/backup checks, scripts/test_call_spirit_growth.cjs prefixtask091, M0/build and hostedproof

Reviewผ่าน3/3AC · 22 ต.ค.2026 · source`79023b7dde42fc1327f3303290166c3d728e922d` VercelSUCCESS · [หลักฐาน](../evidence/task-091-review.json)
