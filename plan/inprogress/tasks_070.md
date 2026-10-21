# TASK-070 — Timeline และ Log ย้อนหลังหลังจบไฟต์

Milestone: M4 · อ้างอิง D-095

## งานที่ต้องรอก่อนหน้า

- TASK-020: Timeline และภาพต่อสู้ (done)
- TASK-025, TASK-035, TASK-036: ผล Story/Tower/Daily (done)
- TASK-060: เซฟตอนเริ่ม/จบ ไม่เขียนระหว่างไฟต์ (done)

## เป้าหมาย ขอบเขตและรายละเอียด

ผู้ใช้ต้องการดู Timeline แบบเลื่อนย้อนหลังหลังจบ เพื่อวิเคราะห์การเรียงสกิล เพิ่มปุ่มในผล Story/Tower/Daily ทั้งชนะ/แพ้/หมดเวลา เปิดแผนภาพตั้งแต่ต้นถึงจบและ Log สกิลเรียงตามเวลา เลือกตัวละคร/แตะรายการดูรายละเอียดเวลา/ผล/ผู้ขัดร่ายได้

เก็บเฉพาะ cast_start/cast_resolve/cast_interrupt/sp_skip/sphere_skip ที่ session เล่นจริงไว้ในหน่วยความจำ ไม่เรียก forecast หรือ balance simulation ใหม่ ไม่เขียน DB/local save เพิ่ม และไม่แก้สูตร/ความเร็ว/คิว/รางวัล เก็บเฉพาะไฟต์ปัจจุบันจนกลับไปฟาร์ม เปลี่ยนไฟต์ หรือรีโหลด รุ่นนี้ไม่ใช่คลัง replay ข้าม session

ประวัติแสดงช่วงร่ายที่เกิดจริงและจังหวะขัด/skip ไม่สร้าง ACD จากการเดา: recorded entries ไม่แสดงแถบ/ตัวเลข ACD เพราะ event contract เดิมไม่บันทึกข้อมูลนั้น Timeline สดและ forecast เดิมยังใช้ engine เดิม

## ขั้นตอนทำงาน

1. เก็บ skill events จากผล advance เดิม; confirm/อ่านซ้ำไม่เพิ่ม log ซ้ำ
2. แปลง events เป็น recorded timeline แบบ pure เก็บลำดับเวลาเดียวกันและการขัดร่ายตาม action_id
3. เพิ่มผลไฟต์→Timeline ย้อนหลัง, native horizontal scroll/zoom/แถบเลื่อนเวลา และ Log เรียงเวลา พร้อมกรองตัวละคร
4. ตรวจ rule/session แบบเล็ก, Chrome มือถือบน stack แยก และ build/hosted โดยไม่แตะ owner save หรือ preview6173

## เกณฑ์ตรวจรับ

- [x] AC-01: ประวัติมาจาก events ที่เล่นแล้วเท่านั้น; เวลา/slot/resolve/interrupt/skip/ผู้ขัดถูกต้อง รวม instant/equal-time/pendingตอนจบ; ไม่มี future events/การรัน engine จากการเปิดประวัติ/confirm log ซ้ำ
- [x] AC-02: ผล Story/Tower/Daily มีปุ่ม Timeline ย้อนหลัง; เลื่อนต้น→กลาง→ท้ายและซูมได้ ชื่อแถวยังคงอยู่; เลือกสกิลดูผล/เวลาและ Log เรียงตามเวลา กรองตัวละครได้; ปิดกลับผลเดิมโดยไม่เริ่มไฟต์หรือรับรางวัล
- [x] AC-03: Chrome มือถือ320/390px ใช้ touch scroll ได้ ไม่มีหน้าเว็บล้น; actual terminal→review ไม่เพิ่ม commands/revision/daily quota รักษา result และ statistics เดิม; ระบุว่าเป็นประวัติไฟต์นี้ในหน่วยความจำ
- [ ] AC-04: targeted tests/build/type/boundaries/content/hostedผ่าน content/packเดิม ไม่มีSQL/env/migration/ownerwrite/restart6173 และไม่รัน balance simulation ใหม่

## วิธีตรวจและหลักฐาน

Synthetic skill event trace + short SavedBattleSession tests; isolated actual Auth/Postgres/Chrome battle results and touch interactions; production build and signed-out hosted artifact proof ไม่มี owner credentials

## Blocker / คำถาม

ไม่มี ขอบเขตไฟต์ปัจจุบันเพียงพอสำหรับคำขอ ไม่เพิ่มการเก็บประวัติข้าม reload โดยพลการ

## ผลตรวจจริง

- Focused3checksผ่าน actualequal-time/start/resolve/interrupt/skip/pending/source attribution และSavedBattleSessionconfirm/อ่านซ้ำไม่duplicate/ไม่forecast [unit](../evidence/task-070-targeted.txt)
- ActualfreshAuth/PostgREST/Postgres/mobileChrome4กลุ่มผ่าน: Daily60s4x→history native touchscrollถึงmax2124px, zoom/start/end, stickylabels, precise3decimaldetail, Log150rowsตามเวลา2.772–59.900s/filtermain/verticaltouch, 320/390pxไม่ล้น; Tower/Storywin/Storydefeatเปิดreview+statsกลับresultเดิม ไม่มีextra commands/revision/quota [UI](../evidence/task-070-history-live.json)
- Build/type/boundaries/assets/secrets/readinessผ่าน content6fbb9995048d6211bf56250dbc54a1215e0626ef6812a73e851f111cc489c6e2/packf57a0773…เดิม ไม่มีSQL/env/migration/ownerwrite/restart6173 ไม่รันbalance simulation
- แก้accessibleชื่อSheetด้วยaria-labelledby/useId หลังactualbrowserรอบแรกหาdialogตามชื่อไม่ได้ ไม่ผ่อนเกณฑ์; unitfixtureเคยใส่undefinedaction_idและfixtureweakteamเคยเหลือ1คนขัดparty4 แก้fixturesให้ถูกและเก็บround1ไว้แล้ว
- ดูภาพtimeline/logด้วยตาแล้ว กำลังpush/deployก่อนAC04 ผู้ใช้จบไฟต์แล้วreloadเพื่อรับUI ไม่มีsave.migrateสำหรับงาน070เอง
