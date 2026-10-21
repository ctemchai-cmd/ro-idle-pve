# TASK-020 — เชื่อม renderer กับ combat engine และ HUD ต่อสู้

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [รูปแบบเกมและทีม](../design/01-game.md), [เวลาและสกิล](../design/02-combat-and-skills.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-018 — สร้าง headless runner และรายงาน simulation รุ่นแรก
- TASK-019 — ทำ runtime asset pack จาก metadata และ dependency จริง

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- หน้าต่อสู้ใช้ actor/effect/audio จริงจาก pack พร้อม BGM/SFX แยกระดับเสียง
- ปุ่ม DPS/Healing/Tank รายตัวจาก canonical checkpoint; RO Blue palette กับ modern mobile UX ตาม D-045/D-046
- HUD HP/SP/คิว/CT/ACD/interrupt และ adapter แยกจาก engine
- ตำแหน่งจริง/เดินเข้าระยะ normal/เป้าใกล้สุด/Provoke ใน shared engine; สกิลทุกระยะ; portrait UI และ native healเลขเขียวตาม D-043/D-044
- Timeline แยกแถวทุก actor บนแกนวินาทีร่วมกัน พร้อมเวลาเริ่มใต้สกิล/เส้นตอนนี้/CT-ACD/การคาดการณ์จาก engine เดิมตามคำขอ19ตุลาคม2026

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ต่อ renderer lab กับ game events ให้ตัวละครหันขวา/พลิกทั้ง actor เมื่อหันซ้าย อาวุธ/หัวสอดคล้อง ACT และ effect recipe เห็นสองฝ่ายร่ายพร้อมกัน แต่แอนิเมชันไม่เป็นผู้ตัดสินดาเมจหรือเวลา

Timeline ต้องหยุดตามเกม เปลี่ยนคิวแล้วสร้าง projection ใหม่ และแยกภาพคาดการณ์ด้วยเส้นประ อ่านค่า start/resolve/interrupt/skip และ ACD จาก engine; ไม่เขียนสูตร SI/CT/ACD ซ้ำใน UI และไม่เปลี่ยน checkpoint/RNG/history ของไฟต์สด

## ขั้นตอนทำงาน

1. ทำ renderer adapter โหลด actor/ฉาก/effect และ fallback ที่ระบุได้
2. ผูก animation/HUD กับ event/state ของ engine
3. ตรวจผลเทียบกับ headless ที่ seed/input เดียวกันและความถี่การวาดต่างกัน

## เกณฑ์ตรวจรับ

- [x] AC-01: ตัวละคร/อาวุธ/attachment หันถูกและสถานะหลัก idle/attack/cast/hit/death อ่านได้
- [x] AC-02: เห็นคิวและ cast bar ของแต่ละคน/บอส พร้อมสัญญาณขัดได้หรือไม่
- [x] AC-03: ปรับ FPS/ปิดภาพ/พักวาดแล้วผล combat ตรงกับ shared engine ตาม clock policy
- [x] AC-04: โหลดภาพ/เสียง/font จาก pack ได้ครบ ไม่มี runtime request ไปแหล่งภาพต้นทาง

## วิธีตรวจและหลักฐาน

ทดสอบใน browser ด้วย scenario ตรงกับ runner เก็บภาพช่วงสำคัญและผล compare; แยก automated checks จากการดูภาพจริง

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | native4+ACTcontact tests; inspected softfocus/windup/contact screenshots | [round11](../evidence/task-020-focus-impact-review.json) | ผ่าน |
| AC-02 | 2browsercases:fouractor focus360/390;actualnormalhit before/atcontact and projectilearrival | [round11](../evidence/task-020-focus-impact-review.json) | ผ่าน |
| AC-03 | 184TS/renderer checkpoint unchanged; reducedmotion immediate; prior9browserparity remains history | [round11](../evidence/task-020-focus-impact-review.json) | ผ่าน |
| AC-04 | currentbuild/assets/content/type/boundaries/secrets;pack unchanged fromround10 decodeproof | [round11](../evidence/task-020-focus-impact-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 20 ตุลาคม 2026 · รอบ review: 11

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: เริ่มหลังTASK-018/019done; เชื่อมlocalbattle demoก่อนcloud/Storyloop ยังไม่มีbrowserหลักฐาน

- 19 ตุลาคม 2026: ผ่าน150TStests+2nativegoldens/typecheck/boundaries/build;ChromeactualUI/360poses/180exactmirror/9parityruns/media decodeผ่านและstaticproductionrecoveryผ่าน มีเดโม4ฉากที่ไม่สร้างsave/rewards ดู [วิธีเปิด/ขอบเขต](../../docs/BATTLE-DEMO.md) Safari/มือถือจริง/performanceและcloudยังไม่ผ่านในงานนี้

- Reopen 19 ตุลาคม 2026: ผู้ใช้พบหัวแยก/โยกทุกตัวและanimationไม่ลื่น ตรวจพบ head idle frame0 แต่bodyยังวน3anchors; ตรวจเพิ่มclipถูกตัด650ms/โดนตีresetposeถี่ พร้อมเพิ่มTimelineแต่ละactor/skill/timeตามคำขอล่าสุด ต้องแก้และตรวจหลายเฟรมก่อนกลับdone หลักฐานเดิมเป็นประวัติ ไม่เขียนทับ

- 19 ตุลาคม 2026 รอบ4: แก้หัว/bodyframeร่วมกันและความยาวclipตามACT; เพิ่มTimelineจากengineที่ไม่แตะไฟต์สด ตรวจ648idle pixel comparisons/626attack images/313mirrorคู่/9parityruns และ156TStests+4native/buildผ่าน ดูภาพgallery40poses/ฉาก18s/Timelinedesktop-mobileแล้ว เก็บround3เดิมเป็นประวัติและใช้ [round4](../evidence/task-020-animation-timeline-review.json) เป็นหลักฐานล่าสุด ยังไม่รวมSafari/มือถือจริง/performancebudgetsหรือเซฟTASK-022

- Reopen 20 ตุลาคม 2026 รอบ5: ผู้ใช้รายงาน Timeline/animation ยังสะดุด ต้องวัดการเคลื่อนจริง เพิ่มเลขดาเมจสไตล์RO/กรองตัวโฟกัส/projectileจากต้นทางถึงเป้า ปรับฉากบอสเดี่ยวและทดลองช่องว่างสกิลมากขึ้น เก็บround4เดิมเป็นประวัติ ยังไม่ถือว่าผ่านรอบใหม่นี้

- 20 ตุลาคม 2026 รอบ5: ผ่าน [combat polish review](../evidence/task-020-combat-polish-review.json) หลังวัดTimeline120/120เฟรมที่เคลื่อนจริง ใช้ROdigits+nativecritbg/กรองดาเมจผู้โฟกัส/projectileและบอสเดี่ยว ทดลองSI3s/NA1.5sผ่านcheckpointprofile ไม่มีการเปลี่ยนwallclockหรือstatอัตโนมัติ ผลengine/RNG/metricsตรง9parityruns 164TStests+4native+29Python/buildผ่าน อ่าน [revision20](../design/20-combat-presentation.md) สำหรับสัญญาและขอบเขต ยังไม่ใช่releasebalanceหรือผลมือถือจริง/Safari

- Reopen20ตุลาคม2026รอบ6: ผู้ใช้ขอเลิกตำแหน่งยืนตายตัว/เข้าใกล้ตี/เป้าใกล้สุด ลดขนาดตัวละคร ใช้healเลขเขียว และUIมือถือแนวตั้งเป็นหลักอิงROIdleAdventure กำลังยืนยันกติกาเดิน/ระยะในengineระหว่างทำUI;ไม่ถือว่ารอบ5เป็นหลักฐานของระบบใหม่

- 20ตุลาคม2026รอบ6: ผ่าน [mobile/spatial review](../evidence/task-020-mobile-spatial-review.json) หลังยืนยันสกิลทุกระยะ/normalต้องเดิน เพิ่มsharedspatial engine/checkpoint/nearest+Provoke ลดขนาดactor/เดินACTพร้อมrig/greenheal และportraitUIแยกแผง ทีม-Timeline-ตั้งค่า ผ่าน170TS+4native/6browserchecks/9parityruns มีภาพและhash ขอบเขตเป็นChromeemulation/sandbox ยังไม่ใช่production/มือถือจริง/เซฟถาวร ดู [design21](../design/21-spatial-combat-and-mobile.md)

- Reopen20ตุลาคม2026รอบ7: ผู้ใช้พอใจภาพรวม ขอเฉพาะย่อชื่อ/คอลัมน์ Timeline และเพิ่มลูกเวทย์ในการตีปกติของ Mage; รักษาส่วนอื่นตามรอบ6 ตรวจ pack ใหม่เพราะ combat_visuals เป็น input ของ pack hash

- 20ตุลาคม2026รอบ7: ผ่าน [targeted review](../evidence/task-020-timeline-caster-review.json) ย่อคอลัมน์ชื่อTimeline68px ชื่อสั้น+อาชีพและคงชื่อเต็มสำหรับtitle/aria เพิ่มลูกเวทย์ตีปกติMage/Wizard/Sageผ่านconfigเดิม ตรวจ3browsercases/170TStests/buildและmedia decodeครบ ไม่เปลี่ยนengineหรือขยายscopeส่วนอื่น เก็บround6เป็นประวัติ

- Reopen20ตุลาคม2026รอบ8: ผู้ใช้ขอ Sound/Theme BGM และปุ่มดู DPS/Healing/Tank รายตัว เพิ่มสถิติรับดาเมจใน checkpoint เพื่อไม่ต้องสะสมจากภาพหรือเสียข้อมูลเมื่อโหลดกลางไฟต์ พร้อม audio mixer/volume controls

- 20ตุลาคม2026รอบ8: ผ่าน [audio/statistics/modern RO Blue review](../evidence/task-020-audio-statistics-review.json) พร้อม179TS+4native/5browserchecks/3themes/build เพิ่มincoming countersในcheckpointและใช้metricRatesร่วมUI/headless รักษาactor/timingเดิม ปรับฟอนต์/ไอคอน/ปุ่ม/แท็บเป็นmodernโดยเก็บสีขาวเทาฟ้า ผู้ใช้เลือก03;ไม่ใช้กรอบbevel/แถบหัวหน้าต่างแบบเก่า ตรวจเสียงจากplayback/waveform ไม่ใช่subjective listening ไม่มีมือถือจริง/Safari/productionหรือเซฟถาวรในงานนี้

- Reopen20ตุลาคม2026รอบ9: ผู้ใช้ขอสกิลเป็นไอคอนใหญ่เอากรอบสี่เหลี่ยมออก ใช้ตัวแบ่งบางๆ และเอาเส้นคั่นระหว่างactorในTimelineออก ตรวจเฉพาะpresentation/interactionที่เปลี่ยน ไม่ใช้ผลรอบ8แทนภาพใหม่นี้

- 20ตุลาคม2026รอบ9: ผ่าน [targeted CSS review](../evidence/task-020-icon-dock-review.json) ไอคอน56pxแบบไร้กรอบ/ตัวแบ่งสั้น/ขีดช่องถัดไป Dockสูงตามเนื้อหาและcaptionไม่ถูกnavบัง เอาเส้นแนวนอนระหว่างactorและtrackbaselineออก ตรวจ3browsercasesที่360/390/desktopพร้อมbuild ไม่เขียนสูตรหรือแก้engine;179TS/native/audioของรอบ8คงเป็นหลักฐานเดิม ไม่ได้รันใหม่

- Reopen20ตุลาคม2026รอบ10: ผู้ใช้ขอTimelineแนวตั้งจาง/เส้นประ เส้นแนวนอนผ่านไอคอนของactor และเหลือicon+เวลา ตรวจสกิลแรกอิงASPDรายตัวพร้อมเพิ่มเสียงเริ่มร่ายnative ต้องพิสูจน์ด้วยengineและaudioจริงก่อนdone

- 20ตุลาคม2026รอบ10: ผ่าน [Timeline/casting review](../evidence/task-020-timeline-cast-review.json) icon+time/railรายactor/verticalเส้นประจาง เดโมใช้บิลด์ลงแต้มเอง45แต้มจึงเห็นSIแรกต่างตามASPD Engineส่งcast_duration_msให้nativebeginspellactorchannelและยกเลิกเสียงเมื่อcastจบ/ถูกขัด ตรวจ182TS+4native+29Python/3browsercases/assetchecks/build ไม่มีclassgrowthหรือoffsetTimeline9browserparityrunsยังเป็นประวัติรอบ6

- Reopen20ตุลาคม2026รอบ11: ผู้ใช้รับgameplayเป็นฐานแล้ว ขอแถบfocusตัวละครให้นุ่มขึ้น หลังแก้ให้เดินงานระบบอื่นต่อ โดยไม่เปลี่ยนcombatที่ยอมรับแล้ว

- 20ตุลาคม2026รอบ11: ผ่านsoftfocus/impacttiming184TS+4native/2browsercases/build อิงเฟรมเสียงattackในACTเป็นcontactmarker ตัวเลข/targetreaction/death/VFXรอcontactหรือลูกกระสุนถึงเป้า ไม่เปลี่ยนcombat/pack ผู้ใช้ยอมรับgameplayเป็นฐานแล้วและสั่งเดินระบบอื่นต่อ
