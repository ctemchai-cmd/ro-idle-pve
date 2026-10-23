# TASK-117 — บท9 จำนวน50ด่านพร้อมบอสและมอนตามชนิดจริง

Milestone: M4 · D150 · [design41](../design/41-story-expansion.md)

## งานที่ต้องรอก่อนหน้า
TASK-011, TASK-019, TASK-025, TASK-040, TASK-108, TASK-110, TASK-114, TASK-115 (done).

## เป้าหมายและผลส่งมอบ
เล่นต่อจาก8-20ถึง9-50ได้ มี14enemy definitionsจากnativeassetsเดิม และ5ช่วงบอสต่างรูปแบบ;มีspecสำหรับต่อHi-classโดยไม่เปิดระบบที่ยังไม่ได้ออกแบบ.

## ขอบเขตและรายละเอียด
เพิ่มบท9และช่องทางข้อมูล;รักษา130ด่านเดิม/ทุกplayer skill/Tower/daily/rates1–8/ของและเซฟเดิม. ไม่เข้าบัญชีจริงหรือแก้ownercloud;ไม่ทำbalancebatch. Native14ชนิดอยู่ในpackแล้ว. ดูdesign41สำหรับกติกาธาตุ/traits/รางวัล/การ์ดและข้อเสนอnumeric.

## ขั้นตอนการทำงาน
1.สำรวจstage generator/enemy/skin coupling และchecksumข้อมูลเดิม เก็บbaseline
2.แยกexpansion spec,เพิ่มdefinitions/traits/50stages/rates9/loot9 และschema/content validation
3.ให้farmและboss UIใช้identityเดียวกับengineในด่านใหม่ ตรวจmobile320/390จริงบนisolatedAuth/API/Postgres
4.ตรวจgeneration/engine parity/rewards/migration/packbudget/build แล้วpushmainและpublicsmoke

## เกณฑ์ตรวจรับ
- [x] AC-01: 180ด่าน/9บท/9-1ต่อ8-20/50ด่านใหม่เชื่อมครบ/maxแนะนำ70;130แถวเดิมเท่าbaselineทุกfield;generatorcurrent+legacyreproducible
- [x] AC-02: native14ชนิดใหม่มีrotation3–4ท่า/traits/ธาตุ/ภาพตรงdefinition;checkpointบอส10/20/30/40/50ต่างกัน;ท่าใหญ่ทุก5ด่านขัดได้และengine/runtime1x2x4ตรงกัน;ท้าบอสมีตัวเดียว
- [x] AC-03: rewardchapter9ครบ/ฟาร์มTier60/การ์ด1–130คงpool+chanceเดิมและใหม่ไม่เกิน2%;migrationคงprogress/pending/cursor/RNG;dailychapter9schemaและcommandใช้ได้;ไม่มีSQLหรือTier/Hi-classเปิดใหม่
- [ ] AC-04: actualisolatedAPI+mobile320/390เลือก9-1/9-50และbattle/farmidentityถูก/firstclearครั้งเดียว/reloadใช้เซฟได้;nativepackไม่เพิ่มpayloadและไม่เกิน32MiB;M0/targeted/buildผ่าน;hostedpubliccontent/pack/bundlesตรงก่อนdone

## วิธีตรวจและหลักฐาน
ใช้oldstagesSHAและoldcardprofilesเป็นoracle;TSintegrationสร้างbattleจากข้อมูลจริง/1x2x4/interrupt/savevalidators. RealAuth/API/Postgres/Chromeบนบัญชีdisposableเท่านั้น;publichostedตรวจไม่loginหรือwrite. บันทึกplan/evidence/task-117-*พร้อมข้อจำกัด;ผลbalanceไม่อ้างจากsmoke.

ผู้ตรวจ: Codex self-review · วันที่23ต.ค.2026 · รอบreview0

## Blocker / คำถาม
ถามด่าน/เลเวลทีมปัจจุบันเพื่อช่วยเลือกช่วงความยาก;ไม่เป็นblockerของbaseline67–70ที่แจ้งแล้ว. Hi-class unlock/skill detailsยังอยู่roadmap40ไม่อยู่scopeนี้.

Localreview:572fullTSและ11targetedmode tests/build/M0/readiness8/assets271+60460/native32MiBbudgetผ่าน;actualAuth/API/Postgres/mobile320390สามgroupsผ่าน. r1ปุ่มปิดselectorเก่า,r2checkpointenvelopeผิด,r3fixtureไม่ใส่การ์ด/enchantหมดเวลาที่บอส26%;r4เพิ่มเฉพาะงบfixtureด้วยการ์ด12instances/Enchant10ตามกติกาจริงแล้วผ่าน ไม่มีเปลี่ยนgamepower. ข้อAC04ยังรอhosted.
