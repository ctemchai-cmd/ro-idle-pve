# TASK-114 — ช่องสกิลว่างใช้เวลารอจริง

Milestone:M4 · D147

## งานที่ต้องรอก่อนหน้า
TASK-016, TASK-018, TASK-020, TASK-024, TASK-060, TASK-111 (done). ทำหลังmatchedperformancecomparison112เพื่อไม่ให้engineเปลี่ยนระหว่างbefore/after.

## ขอบเขต/รายละเอียด
คิวrotationคง4ช่องรวมnull ไม่skipoccupiedsearch. ทุกช่องใช้SIตามASPDsnapshot;ช่องว่างไม่ร่าย/ไม่หักSP/ไม่มีCTหรือACDที่แต่งขึ้น ตีปกติและเดินตามเดิม. all-nullใช้normal_onlyเหมือนเดิมไม่สร้างtimersเปล่า. สกิลเริ่มต้นช่องหลังต้องรอช่องหน้าที่ว่างด้วย. กติกาเดียวทุกrotationactor/player+enemy;periodicsummonไม่ใช้rotation. SPไม่พอยังข้ามช่องแล้วเริ่มSIถัดไป,CC/interruption/castspendเดิม. Timeline/headless/browser/serverreplayใช้engineเดียวกัน.

## ขั้นตอน
1.เปลี่ยนoccupiedเป็นเพียงตรวจว่ามีท่าหรือไม่,consumeemptyที่Actiongateโดยไม่ข้ามSI
2.ทดสอบ1/2/4skills+leading/trailingholes/allnull/ASPD/SP/CC/aftercast+normalclock+checkpointcontinue
3.actual1x2x4events/RNG/interrupts/TImeline+serverterminalmatch;schema/contenthashmigrationปกติ,ไม่เขียนownerdata

## เกณฑ์ตรวจรับ
- [x] AC-01:instant0ACD/ASPD100/SI3000,ช่อง0ท่าเดียวcastที่3000/15000/27000;ช่อง2ท่าเดียวfirst9000;มีnormalhitsระหว่างช่องว่าง,allnullไม่cast
- [x] AC-02:CT/ACDจริง+speed snapshot/SPskip/CCไม่เปลี่ยนหลักเดิม;checkpointresume/1x2x4/headless/runtime/serverและTimelineeventตรงกัน
- [x] AC-03:unit/targeted/fullappropriate/build/M0/localmobileAPI/publicผ่านพร้อมอธิบายcontentmigration;ไม่มีแก้power/lootหรือownercloudsave

## หลักฐาน
6เคสเฉพาะตรวจslot0/leadingholes/2–4slots/allnull/ASPD/CT/ACD/SP/CC/revive/checkpoint. Actualbrowser1/2/4xตรงheadlessครบevents/RNG,Timelineและ3interruptsตรงกัน;actualsavedStory runtimeทำนายdefeat14.7sตรงserverfinish.

ตรวจ local ผ่าน 23ต.ค.2026: 564TS/M0/readiness8/build และactualAuth/API/Postgres/Chrome320–390 ตาม [review](../evidence/task-114-review.json). ขึ้นVercelแล้ว source`8b6d64d40`;public4groupsผ่าน API200SIN1/newcontent/5bundleSHA/retiredTier+4slot rules/login0writes จึงปิดเกณฑ์ครบ
