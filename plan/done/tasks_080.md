# TASK-080 — ขยายภาพการ์ดเต็มกรอบและแสดงช่องการ์ดบนอุปกรณ์

Milestone: M4 · D-106 · Dependencies: TASK-073, TASK-079, TASK-027 (done)

## งานที่ต้องรอก่อนหน้า

- TASK-073, TASK-079, TASK-027 (done)

## ขอบเขตและรายละเอียด

ผู้ใช้ขอภาพการ์ดใหญ่เต็มช่องแล้วmaskตามขอบมน แทนการย่อภาพ3:4ไว้กลางช่อง และแสดงกรอบการ์ดเล็กบนiconอุปกรณ์ สีตามqualityBronze/Silver/Gold ช่องว่างเทา ตามcapacityRefineและownerของslotจริง ของที่ยังไม่ได้ใส่ไม่มีการ์ดประจำitem ไม่เปลี่ยนrules/saveหรือassets งานใบธาตุก่อนหน้านี้เป็นข้อเสนอ ยังไม่เริ่มทำ

## ขั้นตอนและผลส่งมอบ

1. ตรวจsourceและการผูกข้อมูลเดิม แล้วปรับจุดแสดงผล/เรทตามขอบเขต
2. ตรวจownershipหรือfrozenrewardcutoverด้วยfixedfixtures และตรวจstaticmathเฉพาะที่เปลี่ยน
3. ตรวจbuild/M0ตามข้อมูลที่เปลี่ยน และactualmobile320/390ด้วยAuth/SQLทดสอบชั่วคราว
4. Push/deploy ตรวจpublicproduction แล้วสรุปหลักฐาน/ย้ายdone

## เกณฑ์ตรวจรับ

- [x] AC-01: Bag/picker/socketภาพใหญ่เต็มmaskขอบมนด้วยcover รายละเอียดการ์ดยังเห็นเต็มใบ; E/lock/grade/levelกดและอ่านได้ที่320/390px ตรวจภาพจริง
- [x] AC-02: Iconอุปกรณ์Buddy/slot summary/bag/equipment pickerแสดงempty/filledBronze-Silver-Goldตรงowner+slotและcapacity1/2/3ตามRefine; เปลี่ยนของไม่ย้ายcardprogressไปกับitem
- [x] AC-03: Projection/UIไม่มีsaveเพิ่มหรือแก้state/สูตร/SQL/env/assets; ไม่เพิ่มAPIสำหรับดูรูปหรือกรอบ และไม่ทำระบบใบธาตุที่ยังเป็นข้อเสนอ
- [x] AC-04: Focusedownershipchecks/build/type/boundaries/secrets/readinessและactualdisposablemobile/hostedผ่าน พร้อมpushและตรวจnewbundlesก่อนdone

## Review

22 ต.ค.2026: ผ่านทุกAC มี [review](../evidence/task-080-review.json) และ [actual hosted](../evidence/task-082-hosted.json) Source `517daa030` / Vercel SUCCESS ตรวจpublicnewbundleSHA/API/content/login/PWAแล้ว

Native card art fills rounded cover masks in bag/picker/socket at320/390px; portrait detail remains3:4. E/lock/grade/level stay visible. Small Bronze/Silver/Gold/empty frames project actual character slot ownership and unlocked1/2/3 sockets. Free gear has no attached card progression; moving gear retains each character slot investment. Actual mobile geometry, real image review and zero inspection mutations passed.

Actualmobileเป็นChromeemulation ไม่ใช่เครื่องAndroidจริง ไม่มีownerwrite/6173restart/newSQL/env/assetsหรือbalancebatch อัตราการ์ดใหม่ใช้contentmigration/backupเดิมและคงoldfrozenintervalก่อนclaimแรก
