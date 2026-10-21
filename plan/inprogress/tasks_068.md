# TASK-068 — แสดงสถานะต่อสู้และ Spirit Sphere ของ Monk

Milestone: M4 · อ้างอิง D-092

## งานที่ต้องรอก่อนหน้า

- TASK-030, TASK-034, TASK-066 (done)

## เป้าหมาย ขอบเขตและรายละเอียด

แสดง Buff/Debuff ด้วยnative skill icons, จำนวนชั้น, เวลาที่ชั้นถัดไปหมด, แตะดูแหล่งที่มา/ผล/expiryแต่ละinstance ทั้งฝ่ายเราและบอส รวมshieldที่ไม่ใช่status และลูกบอลSpiritหมุนรอบMonkตามresourceจริง0–5

ผู้ใช้ยืนยันATK+1%ต่อบอลที่ยังถืออยู่ บวกในderivedATKpercentbucketเดิม สูงสุด+5%ตามresourcecap5; หักบอลก่อนoffense snapshot จึงใช้1เหลือ4=+4%/ใช้5เหลือ0=+0% ไม่คืนเมื่อถูกขัด ไม่เพิ่มhiddencapให้buffs ไม่รันsimulation/calibration/balance suiteใหม่

## ขั้นตอนทำงาน

1. เพิ่มdata-driven held-resource modifierและrecomputeเมื่อgain/spend/reviveโดยใช้sharedengineเดิม
2. เพิ่มread-only status/resource projectionจากbattle state ไม่เดาจากcastanimation เก็บsource/expiryทุกinstance
3. วาดorbsสองชั้นหน้า/หลังตัวละคร; compactstatusiconsในสนามและfocus/bossstripsพร้อมdetail sheet
4. ตรวจเฉพาะunitของกติกาใหม่และUI/migration/build/deployจริง ไม่รันbalance simulation

## เกณฑ์ตรวจรับ

- [x] AC-01: ลูกบอลจริง0–5ให้ATK+0–5%ในbucketเดิม; cast snapshotหลังจ่าย1/5ลูกถูกต้อง, interruptionไม่คืน, reviveไม่มีโบนัสค้าง และUIเพิ่ม/ลดจำนวนตามengine
- [x] AC-02: Buff/Debuff/shieldแสดงicon/stack/expiry/sourceถูกต้อง, independentstacksไม่ถูกรวมเวลา/หายก่อนหมด, หมด/cleanse/dispelแล้วหาย; มือถือ320/390pxไม่ล้นและแตะอ่านได้
- [ ] AC-03: targeted unit/UI/build/migrationผ่าน, ไม่รันbalance simulation, ขึ้นGitHub/Vercelพร้อมpublicproofและแจ้งวิธีbacked-up save updateเมื่อcontenthashเปลี่ยน ไม่แตะเซฟ6173หรือownercloudwrite

## วิธีตรวจและหลักฐาน

Focused sphere/status unit tests, isolated actual Chrome+Auth/SQL UI, existing backup/migration tests, build/content/boundary/type/secrets, public hosted smoke ไม่มีowneraccount access

## Blocker / คำถาม

ไม่มี ผู้ใช้ยืนยันโบนัสเฉพาะบอลที่เหลือหลังจ่ายแล้ว

## ผลตรวจจริง

- Focused14testsผ่าน: held-resourceATK0–5%/additivebucket/หลังจ่าย1หรือ5ลูก/interruption/revive/independentBlessing2sources4effects/shields/expiry/readonlyprojection/orbitgeometry และexistingbackup/migrationguards ไม่ได้รันbalance/calibration/simulationrunner [unit](../evidence/task-068-targeted.txt)
- ActualfreshAuth/PostgREST/PostgreSQL/Chrome4กลุ่มผ่าน: Call5/5+5%, Finger0/5+0%, SteelBodybuff+debuff nativeicons, bossdebuff, Blessing2sources/4effectsพร้อมsource/expiry, 320pxไม่มีoverflow/partyoverlap และfarm4actors [UI](../evidence/task-068-status-live.json)
- M0data/specchecks/build/type/boundaries/assets/secretsผ่าน ไม่มีassetpackเพิ่ม packf57a0773…เดิม Contentเปลี่ยนเป็นf34a37a2aab92f2a9de8ad92b120ed3cb9e4be3749c70ac924e083130537600dเพราะกติกาATKใหม่; ownerใช้save.migrateแบบbackupก่อน ไม่เพิ่มSQL/env ไม่อ่าน/เขียนownerdataหรือrestart6173
- เก็บfailedroundไว้: unitfixtureเคยอ้างactorindexผิด/ปัดATKก่อนเวลาซึ่งขัดกับbaselinefloat และอ่านshieldก่อนCTครบ แก้fixtureexpectedตามสูตรเดิม ไม่แก้roundingเกม Browserround1พยายามlearnstarterBlessingซ้ำ แก้fixtureให้ข้ามสกิลที่เรียนแล้ว รอบจริงผ่านด้วยproductเดิม
- Referenceเทียบเฉพาะemulator: [rAthena battle_get_spiritball_damage](https://github.com/rathena/rathena/blob/master/src/map/battle.cpp) ใช้โบนัสคงที่จากจำนวนบอล (กรณีทั่วไป×3); ATK+1%เป็นการปรับของเกมเราที่ผู้ใช้ยืนยัน ไม่ใช่สูตรที่ยืนยันจากIdleAdventurePlus
- กำลังdeployและรอhostedproofก่อนAC03 ไม่มีผลบาลานซ์ชุดใหม่และไม่อ้างว่าทุกบิลด์สมดุลแล้ว
