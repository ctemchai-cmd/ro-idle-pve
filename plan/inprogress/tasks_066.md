# TASK-066 — ลดเวลาเปลี่ยนหน้าเกมบนมือถือ

Milestone: M4 · อ้างอิง D-090

## งานที่ต้องรอก่อนหน้า

- TASK-023, TASK-028 (done)

## เป้าหมาย ขอบเขตและรายละเอียด

ผู้ใช้รายงานคลิกเปลี่ยนหน้าแต่ละหน้ารอ0.5–1s ให้profileactualmenu click→paint แยกnetworkกับCPU/renderก่อนแก้ ไม่ใช้การเลื่อนเวลาแสดงผลหรือเปลี่ยนระบบเซฟมาอ้างว่าหน้าลื่นขึ้น คงเลย์เอาต์มือถือแนวตั้งและflowเดิม

## ขั้นตอนทำงาน

1. เก็บbaseline actualUI/CPU4x/HTTPcount และcallprofileในfreshstack
2. แก้เฉพาะงานซ้ำหรือrenderที่profileชี้; cacheต้องหมดอายุเมื่อstate/build/packเปลี่ยนและไม่เก็บownerข้ามบัญชี
3. วัดซ้ำ matchedroutes/fixture/CPUเท่ากัน ตรวจfunctionalityและbuild/deployจริง

## เกณฑ์ตรวจรับ

- [ ] AC-01: มีbefore/afterclick→paintของเมนูหลัก, Stats/Skills และสลับตัวละครบนCPU4×; median/p95ดีขึ้นโดยไม่มีAPIrequestเพื่อnavigate
- [ ] AC-02: เปลี่ยนตัว/อัปเกรด/เซฟ/เปลี่ยนของแล้วยังเห็นค่าปัจจุบัน ไม่ใช้ข้อมูลเก่า และไม่มีlayout/consoleerrorใหม่
- [ ] AC-03: build/type/boundaries/secretsผ่าน contenthashเดิมถ้ากติกาไม่เปลี่ยน โค้ดขึ้นVercelพร้อมpublicsmoke; แยกfixturemetricsกับมือถือจริง

## วิธีตรวจและหลักฐาน

`scripts/test_navigation_live.cjs` + profiler/targetedUIchecks + build/hostedreadonly

## Blocker / คำถาม

ยังต้องprofileเพื่อระบุสาเหตุ ไม่เดาว่ามาจากDB; emptybagbaselineเป็นเพียงหนึ่งscenario ต้องประเมินinventory/learnedskillsที่เป็นตัวแทนก่อนสรุป

Baseline actualemptybag/CPU4x เมนู15clicksได้35–115msและ0APIrequest ยังไม่reproduce0.5–1sของผู้ใช้ ต้องตรวจtouchinput/populatedbagก่อนอ้างว่าพร้อม มีบั๊กTASK067เร่งด่วนแทรกก่อน
