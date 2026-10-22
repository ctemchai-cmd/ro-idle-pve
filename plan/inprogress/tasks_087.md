# TASK-087 — ตารางธาตุครบทุกคู่ในเกม

Milestone: M4 · D-116

## งานที่ต้องรอก่อนหน้า

- TASK-076 (done)

## เป้าหมายและขอบเขต

เพิ่มตารางธาตุ10×10ที่อ้างข้อมูลเกมจริง ไม่คัดตารางROภาคอื่นมาทับสูตร ผู้ใช้เปิดจากหน้าสกิลหรือแตะเกราะธาตุในไฟต์ได้ มีตัวเลือกธาตุโจมตี/เกราะ สรุปเปอร์เซ็นต์ พร้อมfullmatrixที่เลื่อนดูได้บนมือถือ หัวแถว/คอลัมน์คงที่ แยก100%=ปกติ/>100%=ได้เปรียบ/<100%=เสียเปรียบโดยมีข้อความร่วมสี

อธิบายตามอาวุธว่าใช้ธาตุอาวุธปัจจุบัน และตารางเป็นตัวคูณธาตุก่อนเกราะ/ต้านธาตุ/บัฟ ไม่ปรับสูตรหรือสกิลใด ไม่เพิ่มnetworkเมื่อดู

## ขั้นตอนการทำ

1. ตรวจchartจริงและทิศทางในsharedEffectPipeline
2. ทำread-onlyprojection100ค่าและmodalพร้อมเลือกคู่/scroll/stickyaxes/accessibility
3. ผูกหน้าสกิลและarmorbadges ทดสอบ100ค่ากับpipelineจริงและmobile320/390
4. Build/push/deploy/publicproofก่อนreviewdone

## ผลส่งมอบ

- ตารางธาตุเต็มและคู่ที่เลือกอ่านง่ายในเกม
- focused/mobile/hosted evidence

## เกณฑ์ตรวจรับ

- [ ] AC-01: ตารางธาตุครบ10×10=100คู่จาก combat-rules.json ชุดเดียวกับengine แถวโจมตี/คอลัมน์เกราะระบุชัด ตัวเลขเปอร์เซ็นต์/legendตรงตัวคูณจริง รวมHoly→Undead150%,Fire→Earth125%,Fire→Water75%,Neutral→Ghost75%
- [ ] AC-02: เปิดจากหน้าสกิลและป้ายเกราะบอส/ตัวโฟกัส เลือกคู่ธาตุอ่านสรุปได้ ตารางเลื่อนแนวนอนพร้อมหัวแถว/คอลัมน์คงที่ ใช้ได้320/390px ปิด/Escape/คืนfocusถูกต้อง มีtextร่วมสีและไม่มีAPI/saveขณะดู
- [ ] AC-03: Focused matrix/pipeline/presentation checksและbuild/type/boundaries/secretsผ่าน พร้อมactualmobileและpublicnewUI/API/login/PWA ไม่เปลี่ยน100ค่าตาราง/สูตร/ธาตุสกิล/content/pack/เซฟ ไม่มีSQL/env/assets/ownerwrite/balancebatch

## วิธีตรวจและหลักฐาน

Existingelement-presentation100pairpipeline, actualmobile modal/scroll/focus/zeroAPI + build/publicproof เก็บ task-087-* หรือshared086087 evidence
