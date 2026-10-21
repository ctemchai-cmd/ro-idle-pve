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

- [x] AC-01: มีbefore/afterclick→paintของเมนูหลัก, Stats/Skills และสลับตัวละครบนCPU4×; median/p95ดีขึ้นโดยไม่มีAPIrequestเพื่อnavigate
- [x] AC-02: เปลี่ยนตัว/อัปเกรด/เซฟ/เปลี่ยนของแล้วยังเห็นค่าปัจจุบัน ไม่ใช้ข้อมูลเก่า และไม่มีlayout/consoleerrorใหม่
- [ ] AC-03: build/type/boundaries/secretsผ่าน contenthashเดิมถ้ากติกาไม่เปลี่ยน โค้ดขึ้นVercelพร้อมpublicsmoke; แยกfixturemetricsกับมือถือจริง

## วิธีตรวจและหลักฐาน

`scripts/test_navigation_live.cjs` + profiler/targetedUIchecks + build/hostedreadonly

## Blocker / คำถาม

ผู้ใช้ยืนยัน Android Chrome/PWA; matched500itemfixtureพบeagerDOM/forcedscrolllayout ไม่ใช่saveAPI แก้virtualrows+nativeper-route scrollcontainerแล้ว กำลังตรวจfunctional/deploy

Baseline actualtouch/CPU4x/Class2/500items/27samples กระเป๋า399–499ms/0APIrequests; emptybag15samples35–115msเป็นhistoricalscenarioแยก Round1หลังแก้functional selectorของharnessไม่ตรงชื่อสกิล (ไม่ใช่producterror) เก็บround1แยกก่อนรันใหม่ ไม่อ้างว่าปิดงานแล้ว

## ผลตรวจจริง

- Matched actualtouch/Chrome mobile/CPU4x/Class2/500items 27samples: overallmedian79→46ms, p95449→121ms; Backpackmedian449→120ms, Stats90→46ms, Skills158.5→99.5ms ทุกnavigation0APIrequests [comparison](../evidence/task-066-navigation-comparison.json) ผลมาจากdevelopmentbundleในfixture ไม่ใช่การวัดAndroidจริงของผู้ใช้
- VirtualGrid mount96cellsแทน500และเก็บความสูง/scrollrangeเดิม เลื่อนถึงชิ้นสุดท้าย/กรองหลังเลื่อน/320pxresize/bulkเลือก457ชิ้นรวมoffscreenผ่าน เลือกทั้งหมดใช้fullfilteredlist ไม่ใช่เฉพาะmountedrows ไม่มีcacheownerstate
- ใช้mainkeyตามview/characterแทนscrollTo effectเพื่อให้เริ่มต้นscroll0โดยไม่force synchronouslayout เดิม รอบStats/Skillเปลี่ยนตัวแล้วยังclear draftsตามกติกา
- ActualfreshAuth/PostgREST/SQL/ChromeยืนยันallocateINT→สลับกลับค่าตรง, upgradeskill→ไปกลับค่าตรง, equipoffscreenitem→badgeตรง/reloadยังตรง พร้อมlock/saveในกระเป๋า ไม่มีconsole/layoutoverflow [after](../evidence/task-066-navigation-touch-full-after.json)
- Build/type/boundaries/assets/content/secretsผ่าน content768e12a4…/packf57a0773…เดิม ไม่มีSQL/env/migrationใหม่ ไม่restart6173 รอVercel/publicsmokeก่อนAC03
