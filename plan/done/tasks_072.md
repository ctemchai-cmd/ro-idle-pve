# TASK-072 — Healing Song ฟื้นเลือดทันทีและพยุงทีมได้ทัน

Milestone: M4 · ประเภท: ปรับกติกาจากผลเล่นจริง · อ้างอิง D-098

## งานที่ต้องรอก่อนหน้า

- TASK-031: Bard/Dancer shared effects (done)
- TASK-071: เพลง P.ATK และวง HoT (done)
- TASK-040: สำรองและย้ายเซฟเมื่อ content เปลี่ยน (done)

## เป้าหมายและผลส่งมอบ

ผู้ใช้รายงาน Monk สาย P.ATK ใช้ Heal ได้250 แต่ Bard สาย P.ATK เพลงได้25ต่อวินาที ฟื้นไม่ทันโดนโจมตี ต้องแก้ทั้งการเริ่มฮีลและอัตราต่อเนื่อง ไม่เพียงเปลี่ยนฐานพลัง

## ขอบเขตและรายละเอียด

Healing Song ทั้ง Bard/Dancer: เมื่อร่ายสำเร็จฮีลหมู่ทันที60–100% P.ATK จากนั้นใช้สถานะเดิม6s ฮีล30–50% P.ATKทุก1sจำนวน5ครั้ง รวม210–350%ต่อผู้รับก่อนโบนัส/overheal ตัวเลขเป็นข้อเสนอassistantจากfeedback ไม่ใช่สูตรROหรือผลfullbalance

ใช้สองeffectเดิม heal+apply_status ไม่แก้engine/formula/schema ไม่เปลี่ยนHeal/Sanctuary/ASPD/CT800/ACD1200/SP38/snapshot/stack/expiry/โบนัสฮีล ไม่มีฮีลที่cast_startหรือเมื่อร่ายถูกขัด และไม่เพิ่มtick_on_applyซ้ำ opening heal รอบนี้

เทียบพลังฐานเท่ากันกับHeal120–220%: opening50→45%ของHeal, total175→159%ต่อคนแต่ต้องรอ5s; SP38เทียบ18 ทำให้single-target healต่อSPยังต่ำกว่าHeal ส่วนเพลงได้ประโยชน์เมื่อหลายคนเจ็บพร้อมกัน ไม่อ้างว่ารู้stats/skilllevelของownerหรือว่าทุกบิลด์balanced

## ขั้นตอนทำงาน

1. เปลี่ยนlevel_parametersเพลงทั้งสองและเพิ่มopening healในdata; ปรับ6goldenintentsให้ตรงdataแต่แยกassertเลขเป้าหมายในfocusedtests
2. อธิบายฮีลทันที P.ATK + HoT ในหน้าskillจากeffectsจริง; คงวง/เวลาเดิม
3. ตรวจcastresolveทันที/5ticks/interruptไม่เกิดheal/MusicLesson/receivedbonus/stack/expiry/overheal และเทียบงบแบบclosed-form ไม่เรียกbalance runner
4. M0/build/type/boundaries/secrets/actualisolatedChrome/hosted; แนะนำexistingbacked-upmigrationหลังจบไฟต์ ไม่มีownerwrite/6173restart

## เกณฑ์ตรวจรับ

- [x] AC-01: เพลงทั้งสองอาชีพทุกระดับมีopening60–100%และHoT30–50% P.ATK/5ticksใน6s; openingเกิดเมื่อร่ายสำเร็จเท่านั้น ใช้sharedheal/bonus/overhealและstackเดิม ไม่เพิ่มtickหรือฮีลเมื่อถูกขัด
- [x] AC-02: UIแสดงopening P.ATKและHoTแยกชัด; actualChromeแสดงhealของเพลงตรงcastresolveก่อนtickแรก วงยังอยู่ตามstatus/หมดแล้วหาย ไม่มีextra saveจากภาพ
- [x] AC-03: focusedchecks/6goldens/M0/build/type/boundaries/secrets/hostedผ่าน; staticcost/burst/totalcomparisonระบุassumptions ไม่รันbalance simulation/ไม่อ้างwholegamebalance ไม่มีSQL/env/newassets/ownerwritesหรือrestart6173

## วิธีตรวจและหลักฐาน

`tests/game/healing-song.test.ts` ตรวจactualeffecttimeline/จำนวน/ฐาน/bonus/lifecycle/interrupt; `scripts/test_healing_ui_live.cjs` ใช้throwawaylocalAuth/Postgres/mobileChromeและrendererจริง; staticreportอ่านcoefficients/cost/timingจากdataอย่างเดียว; build/hostedแบบsignedout ไม่ใช้ownercredentials

## Blocker / คำถาม

ไม่มี ผู้ใช้ยืนยัน P.ATK/รายงานผลเล่นจริงแล้ว ไม่ต้องย้อนถามกติกาเดิม ห้ามrenewedbalance simulationตามคำขอที่ผ่านมา

## ผลตรวจจริง

- Focused6testsผ่าน ทั้งBard/Dancerทุกlevel/6goldens, openingทั้งทีมที่castresolve2300msและ5ticks3300–7300, over-heal, interruptไม่heal/SPไม่คืน, P.ATK/bonuses/stack/expiry/dispel/deaths/UI [targeted](../evidence/task-072-targeted.txt)
- ActualfreshAuth/PostgREST/Postgres/mobileChrome4กลุ่มผ่าน: เพลงทั้งสองresolve3476msมีopening4eventsทันที แล้วheal_tick20eventsต่อเพลงที่4476/5476/6476/7476/8476ms; วงค้าง/หมดแล้วหาย/motionปิด/320px/noextra save และไม่มีbrowsererrors [UI](../evidence/task-072-healing-live.json) / [stack](../evidence/task-072-local-stack.json)
- Static18rows/P.ATK125–1000/level1,4,10คำนวณfloorต่อpulse/nohealbonus/equalbases/allwounded พลังรวม210–350%ต่อคนก่อนปัด/โบนัส [comparison](../evidence/task-072-power-review.json) ไม่ใช่statsจริงของowner/ไม่วัดsurvivalหรือfullbalance
- M0/schema/manifest/codegen/build/type/boundaries/assets/secrets/readiness8ผ่าน content3a297403b070dfbe36027224ce3fc9229df14a12496bcd2f99ac3bb601859230 packf57a0773…เดิม [build](../evidence/task-072-build.txt) ไม่มีSQL/env/newassets/ownerwrite/restart6173 ไม่รันbalance runner
- source7167980afขึ้นVercelsuccessแล้วและactualhosted3กลุ่มผ่าน ปิดAC03/done ไม่แก้หลักฐานTASK-071ย้อนหลังให้เป็นผลของcoefficientsใหม่

- Hostedround1ใช้ชื่อhashไฟล์จากlocalไปหาในmanifestVercelที่productionenvต่างจึงNO_OPENING_HEAL_BUNDLE แก้harnessอ่านชื่อbundleจากhostedmanifestแล้วตรวจopening_heal/opening_power/physical_regenerationตรงactualcontenthashใหม่ ผ่านกับdeploymentเดิม ไม่แก้product/เกณฑ์ เก็บfailureแยก [hosted](../evidence/task-072-hosted.json)
