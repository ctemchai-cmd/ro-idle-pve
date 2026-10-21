# TASK-025 — ทำ Story ฟาร์มและวงจรเล่นที่เซฟได้

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [โหมดและเศรษฐกิจ](../design/05-modes-and-economy.md), [Level design](../design/06-level-design.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-018 — สร้าง headless runner และรายงาน simulation รุ่นแรก
- TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้
- TASK-024 — ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- vertical slice: ฟาร์ม→อัป→ท้าบอส→รับรางวัล→ปลดด่าน→โหลดต่อ
- ตัวควบคุม Story/progress stage/farm stage และผลแพ้ชนะ

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ใช้ Class 1/ด่านชุดแรกจาก M0 ที่ generic effects ของ TASK-017 รองรับ พิสูจน์วงจรหนึ่งช่วงก่อนขยายครบทุกอาชีพ/เนื้อหาใน TASK-029–034 และ TASK-041 แยกท้าบอสกับฟาร์มด่านผ่านแล้ว ให้รางวัล/ปลดด่าน atomic พร้อมผลต่อเซฟ รองรับทีมแพ้/หมดเวลาโดยท้าซ้ำได้

## ขั้นตอนทำงาน

1. ทำ stage selection/farm/challenge และ lifecycle ไฟต์
2. เชื่อมรางวัล/ดรอป/ปลดความคืบหน้ากับ save protocol
3. ทดลองวงจรผ่านด่าน แพ้ กลับฟาร์มและปิดเปิดเว็บ

## เกณฑ์ตรวจรับ

- [x] AC-01: ผู้เล่นเลือกด่านฟาร์มที่ผ่านแล้ว ท้าคู่ต่อสู้ท้ายด่าน และปลดด่านถัดไปเมื่อชนะจริง
- [x] AC-02: Story จบที่ทีมหมด/90 วินาที ตัวหลักล้มคนเดียวไม่แพ้ ฟื้น HP/SP ก่อนไฟต์ใหม่และ retry ฟรี
- [x] AC-03: รางวัลครั้งแรกกับรายได้ฟาร์มแยกกัน ปิด/refresh ระหว่างรับผลไม่รับของหรือปลดด่านซ้ำ
- [x] AC-04: วงจรใช้ภาพ/คิว/สกิลจริงและ reload ต่อได้ แต่ไม่ชนะบอสหรือปลดด่านเองระหว่างปิดเกม

## วิธีตรวจและหลักฐาน

browser walkthrough จากเซฟใหม่และเซฟค้างไฟต์ พร้อม retry/failure และตรวจ cloud ledger หลัง reload

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `npm run check`; `RO_EVIDENCE_PREFIX=task-025 python3 scripts/test_auth_stack.py` | Actual fresh-account browser firstclear unlocks1-2; pure stage factory covers80 rows with oneboss; farm locked until actual clear. No all-stage balance claim. [review](../evidence/task-025-review.json) | ผ่าน |
| AC-02 | `npm run check`; `RO_EVIDENCE_PREFIX=task-025 python3 scripts/test_auth_stack.py` | Shared engine tests plus real owner API/SQL server-owned main-death, all-dead and exact90s fixtures; main alone does not lose; retry fullHP/SP, free; late terminal lease rejected without mutation. [review](../evidence/task-025-review.json) | ผ่าน |
| AC-03 | `npm run check`; `RO_EVIDENCE_PREFIX=task-025 python3 scripts/test_auth_stack.py` | Actual Chrome drops terminal HTTP response after SQL commit; same pendingUUID/receipt reconciles once; firstclear250gold/400EXP/20crystal paid once; farm separately reserved and claimed; repeatboss no kill income. [review](../evidence/task-025-review.json) | ผ่าน |
| AC-04 | `npm run check`; `RO_EVIDENCE_PREFIX=task-025 python3 scripts/test_auth_stack.py` | Actual saved femaleMage/four-person build rendered with native actors/audio/Timeline; farm→Lv2/INT2→repeatboss; reload during1-2 retreats, never grants offline win;390/360/compact layouts verified. [review](../evidence/task-025-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20ตุลาคม2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- ปรับตามผู้ใช้20ตุลาคม2026 D-040/D-041: encounter factoryใช้บอสเดี่ยวเป็นค่าเริ่มต้น และทบทวนM0templateที่มีadds; เดโมทดลองSI3s/NA1.5sผ่านtiming profileในcheckpoint ต้องวัดร่วมกับpaceก่อนยกเป็นreleasebalance ดู [revision20](../design/20-combat-presentation.md) ห้ามนำtemplateเก่ามาเพิ่มaddsกลับเงียบ ๆ

- อัปเดต20ตุลาคม2026 D-043/D-044: formation เป็นจุดเกิด ไม่ล็อกตำแหน่งต่อสู้ ส่ง arena/spatial profile จาก build/encounter ไป shared engine; normal ต้องเดินเข้าระยะและหาเป้าใกล้สุด สกิลทุกระยะ UI ใช้ portrait shell/แผงทีม-Timeline-ตั้งค่าตาม [design21](../design/21-spatial-combat-and-mobile.md) ทบทวน encounter balance กับการเดินจริงในTASK-041

- ฐานTASK-022: ใช้ `reserveFarm`/shared seeded RNG และ command-only signed checkpoint/SaveController ตาม [protocol23](../design/23-save-runtime-protocol.md) ห้ามคำนวณรายได้ซ้ำจากkillหรือใช้snapshot upload งานนี้เชื่อม mode/rate/AFK UX จริงและตรวจหลักฐานของตน

- 20ตุลาคม2026: เริ่มหลังTASK-024ผ่าน4AC/208tests/real owner-save+skills ใช้compileCharacterSkills/characterBlueprint, canonical farm reservation และcheckpoint protocolเดิม ทำStorybossเดี่ยว/90s/firstclearครั้งเดียว/เลือกfarmที่ผ่านแล้ว ไม่มีAFKปลดด่าน

- ตรวจครบ4AC: 213TS/4native/build และreal local services+Chromeผ่าน; source hashes/วิธีทดสอบ/ข้อจำกัดอยู่ [review](../evidence/task-025-review.json) และ [runtime26](../design/26-story-runtime.md) main-death/defeat/90s ใช้server-owned fixturesแยกจากfresh-account walkthrough
- เตรียมเว็บส่วนตัว6173แบบfrozenM2พร้อมฐานเซฟถาวรใน`.local/play`; ทดสอบstop/restart/ย้ายdataแล้วคงเซฟ และไม่สร้างตัวละครแทนผู้ใช้ ดู [วิธีเล่น](../../docs/LOCAL-PLAY.md) ยังไม่มีhosted deployment
