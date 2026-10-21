# TASK-015 — สร้างโครงโปรเจกต์และโหลดข้อมูลเกมที่ตรวจ schema ได้

Milestone: M1 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-014 — ตรวจสเปกรวมก่อนเริ่มเขียนเกม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- โครง source/build/test ตามสถาปัตยกรรมที่เลือก
- content loader, schema validation และข้อมูล M0 ที่ version ไว้

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ตั้ง TypeScript/Vite และ UI/tooling ตาม TASK-013 แยก domain/combat, rendering, persistence และ simulation ให้ import แยกได้ โหลดข้อมูล M0 เป็น content bundle เดียวที่ทั้งเกมและ runner ใช้

## ขั้นตอนทำงาน

1. ตั้งโครงและคำสั่ง dev/typecheck/test/build ตามสเปก พร้อม module boundary checks และวิธีรัน API/adapter ทดสอบบนเครื่องถ้า architecture เลือกใช้ โดยไม่รอ TASK-043
2. ทำ loader ตรวจ ID/reference/schema/content version และ error ที่หาที่มาได้
3. นำเข้าข้อมูล M0 โดยคง asset metadata แยกจาก gameplay

## เกณฑ์ตรวจรับ

- [x] AC-01: ติดตั้งจากขั้นตอนที่ระบุแล้ว dev/build/typecheck ทำงานได้ใน checkout ใหม่
- [x] AC-02: ข้อมูล M0 ทุกชุดโหลดได้และตรวจพบ ID ซ้ำ/อ้างอิงหาย/typed params หรือ units ผิด/outcome scope ผิด/patch conflict ตาม TASK-047 พร้อม definition/effect/field ต้นทาง ไม่ข้าม effect ที่ไม่รู้จักเงียบ ๆ
- [x] AC-03: import domain/combat ใน process ไม่มี browser ได้ ไม่มี Supabase/Canvas side effect
- [x] AC-04: ไม่ copy assets ทั้งคลังเข้า build และมีขั้นตอนระบุ content version ของ output

- [x] AC-05: บังคับ import boundaries ตาม TASK-013 ได้: pure domain ไม่ดึง DOM/Canvas/network/เวลาเครื่อง, UI ไม่เขียน DB โดยตรง และ content definition ไม่ถูก mutate; มีกรณีละเมิดที่ check จับได้จริง

## วิธีตรวจและหลักฐาน

ใช้คำสั่งโครงการที่บันทึกไว้ ตรวจ build และ fixture ข้อมูลผิดจริงเพื่อยืนยัน error ที่เป็นประโยชน์

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | clean directory: npm ci --offline + npm run check/build; localhostHTTP200 | [review report](../evidence/task-015-review.json), [checks](../evidence/task-015-checks.txt), [clean build](../evidence/task-015-clean-build.txt) | ผ่าน |
| AC-02 | 31reviewedinvalidinputs+NaN/prototype/schema/semantic/patchcases; allcatalogsload | [review report](../evidence/task-015-review.json), [checks](../evidence/task-015-checks.txt), [clean build](../evidence/task-015-clean-build.txt) | ผ่าน |
| AC-03 | Nodeimportsmoke+ASTchecks; combatengineยังTASK-016 | [review report](../evidence/task-015-review.json), [checks](../evidence/task-015-checks.txt), [clean build](../evidence/task-015-clean-build.txt) | ผ่าน |
| AC-04 | dist/content-version.json+buildinventory ไม่มีpayloadassets | [review report](../evidence/task-015-review.json), [checks](../evidence/task-015-checks.txt), [clean build](../evidence/task-015-clean-build.txt) | ผ่าน |
| AC-05 | 10ASTnegativefixtures+immutablemutation+localAPI/memoryreceiptfixtures | [review report](../evidence/task-015-review.json), [checks](../evidence/task-015-checks.txt), [clean build](../evidence/task-015-clean-build.txt) | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- 19 ต.ค. 2026: สร้างTypeScript6/Vite8/React19/Ajv2020, immutablecontent/types/hash/ASTboundariesและlocalAPI ตรวจ51tests+freshinstall/build/devผ่าน ไม่มีcombatengine/SQL/remoteinfraในงานนี้ มีrawchunkwarningแต่gzip189539bytes เก็บข้อจำกัดในreport
