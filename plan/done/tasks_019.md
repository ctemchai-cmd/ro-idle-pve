# TASK-019 — ทำ runtime asset pack จาก metadata และ dependency จริง

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [อาชีพ](../design/03-classes.md), [Level design](../design/06-level-design.md), [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-015 — สร้างโครงโปรเจกต์และโหลดข้อมูลเกมที่ตรวจ schema ได้

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- ตัวคัด asset dependency และ manifest/checksum/size report
- pack สำหรับตัวละคร/ทุกสกิล/ฉาก/UI/เสียง/ฟอนต์ที่รุ่นแรกใช้

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

เริ่มจากเนื้อหา M0 แล้วตาม catalog/sidecar/ACT/STR/media ที่ deduplicate ให้ครบ เลือกเฉพาะของใช้งานจริง มี build entry ที่ทำซ้ำได้และโหลดส่วนหนักตามต้องใช้

## ขั้นตอนทำงาน

1. รวบรวม runtime IDs จากข้อมูลเกมและ preset
2. ทำ dependency closure/copy/hash/validation โดยตาม file.path/meta_path
3. วัดขนาด output และตรวจ recipe/missing dependency ก่อนนำไปใช้

## เกณฑ์ตรวจรับ

- [x] AC-01: ทุก runtime ID ของรุ่นแรก resolve ถึงไฟล์ครบ ไม่เดา path จาก shared media basename
- [x] AC-02: pack ไม่รวมคลังทั้งหมด archive เก่าหรือ effect ที่ยังมี missing_dependencies
- [x] AC-03: รายงานแยกขนาด source upload/build/runtime download และระบุสิ่งโหลดตอนแรกกับตามฉาก
- [x] AC-04: แก้ content refs แล้ว rebuild ได้ผล manifest ที่ตรวจความเปลี่ยนแปลง/ไฟล์หายได้

## วิธีตรวจและหลักฐาน

ตรวจ dependency closure และโหลด manifest ผ่าน HTTP ในเครื่อง; ไม่เปิดดูรูปทั้งคลังซ้ำและไม่เปลี่ยน source assets โดยไม่จำเป็น

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | all 126 skill/19 job/36 preset refs + HTTP SHA499 files | [review](../evidence/task-019-review.json): task-019-http.json / task-019-locator-tests.txt | ผ่าน |
| AC-02 | 8 pack negative/repeatability tests; original starter/native checks | [review](../evidence/task-019-review.json): task-019-pack-tests.txt / task-019-source-library.txt | ผ่าน |
| AC-03 | measure separate source/build/initial/lazy bytes | [review](../evidence/task-019-review.json): task-019-size-report.json / task-019-build.txt | ผ่าน |
| AC-04 | missing/extra media, unsafe ref, unknown presentation, repeatable fingerprint | [review](../evidence/task-019-review.json): task-019-pack-tests.txt | ผ่าน |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: ผ่าน 8 Python pack tests +3 locator tests และHTTP SHA499ไฟล์; pack249IDs/22,434,695bytesรวมmanifest; initialprofile+manifest1,582,210bytes ก่อนbootstrapgzip190,091bytes ตัวเลขแรกเข้าเป็นประมาณการ ไม่ใช่ browser network timing; source media/sidecarsไม่เปลี่ยน ไม่มีremote upload
