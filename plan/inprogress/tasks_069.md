# TASK-069 — เพิ่มพลังท่าใช้บอลและย่อไอคอนสถานะ

Milestone: M4 · อ้างอิง D-093/D-094

## งานที่ต้องรอก่อนหน้า

- TASK-030: สกิล Monk และต้นทุน SP/บอลจริง (done)
- TASK-040: สำรองและย้ายเซฟข้าม content (done)
- TASK-068: live status/resource UI (done)

## เป้าหมาย ขอบเขตและรายละเอียด

ผู้ใช้ย้ำว่า Call Spirits เสียหนึ่งช่องโจมตี จึงต้องช่วยให้ท่าที่ใช้บอลคุ้ม และเสนอเพิ่มตัวคูณท่าเหล่านั้นโดยไม่ OP/under ผู้ใช้ยังห้ามรัน balance simulation ใหม่

ค่าทดลองที่ assistant เสนอ: เพิ่ม raw-power coefficients ของ Triple Attack ×1.25 (ใช้1บอล), Finger Offensive ×2.25 (ใช้5บอล), Asura ×2.25 ทั้ง ATK/SP (ใช้5บอลและSPทั้งหมด) เทียบค่าก่อน D-093 ฝังใน level_parameters ไม่เพิ่มบัฟ/ตัวคูณส่วนกลางอีกชั้น ระดับ10จึงเป็น318.75%ATKรวม3hit /731.25%ATKรวม5hit /562.5%ATK+292.5%SPก่อนจ่ายตามลำดับ

คงโบนัสถือบอล1%จาก D-092 โดยใช้เฉพาะที่เหลือหลังจ่าย; ไม่เพิ่มCT/ACD/SP/จำนวนบอล/crit/เจาะเกราะ/จำนวนhit/ผลฟรีตอนร่ายถูกขัด สกิลไม่ใช้บอลไม่เปลี่ยน ความคุ้มต้องพิจารณา Call+finisher สองช่อง/เวลารวม/normal attacks/รายจ่ายSPและการสร้างบอลจากPassive ไม่ตัดสินจากตัวเลขหนึ่งhitหรือเทียบข้ามอาชีพแล้วอ้างbalance

ผู้ใช้ขอแก้ภาพหลังเห็นชุด068: ไอคอนสถานะ18px (ปุ่ม28×31px), บอลใช้nativeCallSpirits iconทุกจุด, เอาicon/statusbuttonออกจากfarmทั้งDOMและCanvas, แยกbossstatus/castจากmainbossbarให้ความสูงกรอบหลักคงเดิม ไม่แก้กติกาหรือซ่อนสถานะจริงจากengine

## ขั้นตอนทำงาน

1. บันทึกค่าก่อนปรับและตรวจต้นทุน/พลังด้วยพีชคณิตจากข้อมูลจริง แยกข้อสมมติจากผลเล่น
2. ปรับเฉพาะ3สกิลทุกระดับและgolden raw intentsที่ได้รับผล; หน้าสกิลแสดงจำนวนhitจากdefinition
3. ตรวจsharedformula/cast snapshot/SP/บอล/skip/interruption และbackup/migrationเฉพาะจุด ไม่รันrunner/calibration/balance batch
4. buildและตรวจVercelแบบsigned-out; แจ้งจบไฟต์ก่อนreload/สำรองแล้วอัปเดตเซฟ ไม่เขียนownerdata

## เกณฑ์ตรวจรับ

- [x] AC-01: ทุกระดับของ3สกิลได้coefficientsตามข้างต้นและgolden intentsตรง; ค่าใช้จ่าย/timing/hits/crit/armorและสกิลอื่นไม่เปลี่ยน, ไม่คูณโบนัสซ้ำในpipeline
- [x] AC-02: sharedengineใช้ATKหลังหักบอลและSPก่อนหักสำหรับAsuraจริง; บอลไม่พอข้าม/ถูกขัดไม่คืนหรือสร้างdamage; หน้าสกิลแสดงcoefficientsใหม่และจำนวนhit, existingbackup/migrationchecksผ่าน
- [ ] AC-03: มีmanualcost/powerreviewพร้อมสมมติฐานและข้อจำกัด ไม่รันbalance simulation; build/type/content/boundaries/secretsและhostedproofผ่าน, packเดิม/ไม่มีSQL/envใหม่ ไม่อ้างว่าบาลานซ์พิสูจน์ครบหรือเขียนเซฟเจ้าของแล้ว
- [x] AC-04: บัฟ/ดีบัฟicon18px, ใช้CallSpirits iconแทนวงกลมในcounter/party/details, ไม่มีstatuscontrols/iconsในfarm; bossstatusและcastอยู่นอกmainbarและความสูงmainbarไม่เปลี่ยนระหว่างสถานะ/cast, มือถือ320/390pxไม่มีoverlap/overflow รายละเอียดsource/expiry/stackยังอ่านได้

## วิธีตรวจและหลักฐาน

Focused tests/game/spirit-finisher.test.ts + spirit-status/save-backup เฉพาะกติกาเดิมที่ต้องคงไว้; staticraw-intent goldensและmanualequationsไม่เรียกbattle/simulationrunner; productionbuildและsigned-out publichostedchecks

## Blocker / คำถาม

ไม่มีคำถามหลักค้าง การลองเล่นและwhole-gamebalanceยังอยู่TASK-041 ไม่ปิดจากค่าทดลองนี้

## ผลตรวจจริง

- static review ยืนยันเปลี่ยนเฉพาะ3สกิล/40coefficients ทุกระดับ และ9golden raw-intents ค่าใช้จ่าย/เวลา/crit/armor/hits/สกิลอื่นคงเดิม [พีชคณิตและสมมติฐาน](../evidence/task-069-power-review.json) เป็นการเทียบแบบย่อ ไม่ใช่ผลบาลานซ์เกมจริง
- focused19checksผ่าน: 9goldens, newpower, actualcast snapshotหลังจ่าย/AsuraSPก่อนจ่าย, no hidden extra multiplier, sphere skip/interruption, skillUIhitcounts, held1%/statusprojection และexistingbackup/migration [unit](../evidence/task-069-targeted.txt)
- actualfreshAuth/PostgREST/Postgres/Chrome4กลุ่มผ่าน: nativeCallSpirit icon,18×18px, independentBlessing2sources/4effects, 320/390pxไม่มีoverlap/overflow, bossbarheight109pxทั้ง211samples/castfalse-true/status0–3, farmไม่มีDOMcontrols/badges [UI](../evidence/task-069-status-live.json) ตรวจภาพbattle/farmด้วยตาแล้ว ไม่แตะ6173/owneraccount
- M0checks/build/type/boundaries/assets/secretsผ่าน content6fbb9995048d6211bf56250dbc54a1215e0626ef6812a73e851f111cc489c6e2 packf57a0773…เดิม ไม่มีSQL/envเพิ่ม ไม่รันsimulation/calibration/balance runner
- Failurehistory: authoringdocsPythonliteralผิดทำgateขาด4cases แก้syntax/ลงทะเบียนให้ตรงเกณฑ์เดิม; initialtypecheckทดสอบใช้initializeAccountsignatureผิดและnarrowformulaไม่ครบ แก้fixture; unitUIfixtureเคยลบstarterlearnedskillsแต่ยังใส่slotเดิมจึงINVALID_SKILL_LOADOUT แก้fixtureให้เก็บstarter ไม่เปลี่ยนproduct/เกณฑ์ เก็บround1logsไว้แล้ว
- รอGitHub/Vercel/publichostedproofก่อนAC03; เจ้าของต้องจบไฟต์ก่อนreloadแล้วกดสำรองแล้วอัปเดตเซฟ ไม่ได้ทำmigrationแทน
