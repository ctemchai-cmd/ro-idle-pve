# TASK-127 — Sanctuary เป็น Pure HoT ที่แรงกว่าเพลงฮีล

Milestone: M4 · D157 · [design47](../design/47-sanctuary-hot.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-030, TASK-071, TASK-072, TASK-120 (done).

## เป้าหมายและผลส่งมอบ
Sanctuary ฮีลต่อเนื่องตั้งแต่ร่ายสำเร็จ ไม่มีฮีลก้อนแรกแยก แต่ทุกติ๊กแรงกว่า HoT ของ Bard/Dancer ที่พลังอ้างอิงเท่ากัน;คำอธิบายและวงฮีลตรงกับผลจริง.

## ขอบเขตและรายละเอียด
ใช้สถานะแยกจากregenerationเดิมเพื่อไม่กระทบเพลง/ต้นไม้/การ์ด. ใช้MATK/โบนัสฮีลเดิม,ทุก1sนาน6s,เริ่มทันที;กำลัง105–175%MATK/rank1–10. Bard/Dancerคงinstant+physicalHoTเดิม. ไม่รันบาลานซ์ทั้งเกม/ไม่แตะownerเซฟ/ไม่restart6173/ไม่SQL/envใหม่. Hi-classยังทำต่อTASK123–125.

## ขั้นตอนการทำงาน
1. ตรวจprogram/status/สูตรเพลงฮีลและSanctuary;กำหนดpureHoTและrankcurve
2. เพิ่มstatusเฉพาะtick_on_apply/คำอธิบายเริ่มทันที/คงstackingและวงฮีลshared
3. ตรวจrank1–10/tick0–5s/interrupt/SP/expiry/stack/1x2x4/checkpointและBardเดิม;อัปgoldenเฉพาะท่านี้
4. build/M0/realAuth-SQL-mobile320390→push→hostedpublicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: Sanctuaryมีเพียงapply_status ไม่มีopening_heal;เริ่มติ๊กที่cast_resolveแล้วทุก1sรวม6ครั้ง,105→175%MATKและทุกrankแรงกว่าเพลงHoTที่powerเท่ากัน;Bard/Dancer/genericregen125สกิลเดิมไม่เปลี่ยน
- [x] AC-02: sharedengine/โบนัสฮีล/independentstack/interruptไม่มีฮีลหรือคืนSP/expiry/1x2x4/checkpointตรงกัน;ไม่เปลี่ยนคิวCTACDหรือสูตรฮีล
- [ ] AC-03: รายละเอียดทุกrankแสดงMATK/ทุก1s/6s/เริ่มทันทีและวงฮีลตามstatusจริง;targeted/build/M0/realAuthAPI-SQL-mobile320390/hostedผ่านก่อนdone

## วิธีตรวจและหลักฐาน
T127-AC-01–03 ในacceptance-matrix;tests/game/sanctuary-hot.test.ts,healing-song.test.ts,classgoldens;disposablelocalAuth/SQL/Chromeและpublichostedไม่เข้าบัญชีowner.

## Blocker / คำถาม
ไม่มี

## บันทึกการทำงานและ review
เริ่ม23ต.ค.2026;ค่าพลังเป็นassistantbaselineตามidentityผู้ใช้ ไม่ใช่สูตรROOriginที่ถอดมาและไม่ใช่ผลsimulationทีมผู้ใช้.

- Local:21targeted + full604(600passed/4legacy-oraclefailures) +60focused全部ผ่านหลังแก้statuscount30/แยกD157จากsupportscaleเดิม/คงhistoricalbyteprojectionเฉพาะSanctuaryก่อน127;newtestล็อกค่าอื่นของสกิลเดิมทั้งหมด. ไม่เปลี่ยนgameplayเพื่อตามoracles. Fullfirstและfinalreportsเก็บแยก. Goldenเฉพาะ3Sanctuarycasesเปลี่ยน/375เดิมคง. Sourceaudit125สกิลเดิมคง.
- ActualAuth/API/Postgres/mobile3203904groupsผ่าน: Sanctuary24events/4alliesที่3677/4677/5677/6677/7677/8677ms ไม่มีopening;เพลงopening4+ticks20ต่อท่าคงเดิม/status105%MATK/rings/expiry/reducedmotion/0midbattlewrites. Viewed390. Build/M0/readiness8ผ่าน. รอfilteredbuild/push/hostedAC03.
