# TASK-092 — เลื่อนข้อความท่าใหญ่ลงใกล้สนามต่อสู้

Milestone: M4 · D-121

## งานที่ต้องรอก่อนหน้า

- TASK-082 (done)

## เป้าหมายและขอบเขต

ผู้ใช้แจ้งข้อความท่าใหญ่สูงเกินไป เลื่อนsharedoverlayจาก25%ลง40%ของสนามแนวตั้ง ใกล้ตัวละครและอยู่ใต้HUDบนมากขึ้น เป็นpresentationเท่านั้น

## ขั้นตอนการทำ

1. ตรวจแหล่งข้อมูล/พิกัดเดิมและบันทึกbefore
2. ปรับauthorityข้อมูล/sharedrendererตรงจุดและอัปเดตเอกสารปัจจุบัน
3. ทดสอบtargetedและrealmobile/nativeChromeโดยไม่ใช้owneraccount
4. Build/push/Vercel/publicproof→reviewdoneพร้อมอัปเดตบอร์ด

## ผลส่งมอบ

Canonicaldata/rendererและหลักฐานsource/rule/mobile/build/publicที่reproduceได้

## เกณฑ์ตรวจรับ

- [ ] AC-01: ข้อความท่าใหญ่ทุกprofileใช้ตำแหน่งใหม่40%ของความสูงcanvasแทน25% ลดระยะห่างจากตัวละครในportrait320/390 โดยไม่เปลี่ยนชื่อ/ขนาด/สี/ระยะเวลาแสดงและไม่เพิ่มกรอบหรือUIรก
- [ ] AC-02: Nativeeffects/เลขdamage/impactcontact/จอสั่น/reducedmotion/ซ่อนในfarm/interruptและผลต่อสู้x1x2x4เหมือนเดิม เปลี่ยนเฉพาะoverlayposition ไม่แก้engine/skillpower/audio/สูตร/เซฟ
- [ ] AC-03: ExistingrealnativefinisherChromeตรวจ10ท่าครบ6สายและmobile320/390 พร้อมภาพอ่านตำแหน่งจริง/build/type/boundaries/secrets/publicbundleproofผ่าน ไม่มีownerwrite/6173restart/SQL/env/assets/balancebatch

## วิธีตรวจและหลักฐาน

scripts/test_finishers.cjs prefixtask092 ใช้sharedengine fixedfixtures/nativepack/realCanvasวัดbaselineและscreenshots พร้อมx1x2x4/interrupt/reducedmotion ไม่runbalancebatch
