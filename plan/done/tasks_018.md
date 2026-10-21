# TASK-018 — สร้าง headless runner และรายงาน simulation รุ่นแรก

Milestone: M1 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เวลาและสกิล](../design/02-combat-and-skills.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-017 — ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- คำสั่ง simulate/replay/batch พร้อม scenario/seed inputs
- ผล JSON/CSV และ regression scenarios อ้างอิง

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

รัน engine เดียวกับเกมแบบไม่มีภาพ/network รองรับหลาย scenario/seed, A/B ของข้อมูลสกิลหรือบิลด์ และอ่านผลระดับทีม/actor/skill รวมงบลงทุนใน report ยังไม่ทำ dashboard หรือ AI เล่นทั้งเกม

## ขั้นตอนทำงาน

1. สร้าง runner จาก shared engine พร้อม virtual time/seed/limit/trace toggle
2. ทำชุด scenario อ้างอิงกับ batch comparison และรูปแบบรายงาน
3. ตรวจการรวม metrics การ replay เคสผิดปกติ และวัด throughput ตั้งต้น

## เกณฑ์ตรวจรับ

- [x] AC-01: รันได้โดยไม่มี DOM/Supabase/เสียงและไม่เขียนเซฟจริง ใช้ content bundle เดียวกับ runtime
- [x] AC-02: input/seed เดียวกัน replay ได้ผลตรงกัน; batch ระบุ scenario/content hash/seed และ variant ครบ
- [x] AC-03: รายงาน win rate/เวลาจบ/DPS/effective heal/overheal/SP/cast/interrupt พร้อม damage breakdown/stat sources/status/CC resistance ที่มีผล และไม่ตัดสิน support จาก DPS อย่างเดียว
- [x] AC-04: A/B ใช้ seed ชุดเดียวกัน มี sample size/การกระจาย/ช่วงความไม่แน่นอนที่เหมาะสม และ benchmark เทียบ quality budgets ของ TASK-013 โดยระบุเครื่อง/ชุดข้อมูล/เวลา

- [x] AC-05: replay ผูก schema/content hash/rules version รวม event order/RNG ที่ใช้จริง; input เดิมในรุ่นที่รองรับให้ผลตรงกัน และรุ่นไม่รองรับถูกแจ้ง incompatible โดยไม่ใช้ข้อมูลล่าสุดแทนเงียบ ๆ

## วิธีตรวจและหลักฐาน

รัน reference scenarios ที่คำนวณจาก M0 และ batch หลาย seed เปรียบเทียบผลรวม/เวลา/ไฟล์ JSON-CSV พร้อม replay กรณีขอบ

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | Nodepure runner/importboundaries +6probes | [review/evidence](../evidence/task-018-review.json) | ผ่าน |
| AC-02 | exactseed/midcast/crossprocessreplay +batchmetadata | [review/evidence](../evidence/task-018-review.json) | ผ่าน |
| AC-03 | 144tests;team/actor/skill/source/status reports;JSON/CSV/gzip | [review/evidence](../evidence/task-018-review.json) | ผ่าน |
| AC-04 | 6x2x100matchedseeds +100forced90sbenchmark2.64s<=5s | [review/evidence](../evidence/task-018-review.json) | ผ่าน |
| AC-05 | content/rules/schema/RNGnegativefixtures andcrossprocessSHA | [review/evidence](../evidence/task-018-review.json) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 2

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime

- 19 ตุลาคม 2026: เริ่มหลังTASK-017ผ่าน135tests/typecheck/build; ทำreplay/batch/headlessก่อนเดโมเว็บTASK-020

- 19 ตุลาคม 2026: ผ่าน144tests/typecheck/boundaries/build;1200matchedruns/JSONCSVgzip;exactcrossprocessreplay;warm100x90s2.64sบนM1Pro ผ่านเป้า5s ดู [runner contract](../../docs/SIMULATION.md) เป็นcontrolledengineprobes ไม่ใช่สรุปบาลานซ์เนื้อหารุ่นจริง
