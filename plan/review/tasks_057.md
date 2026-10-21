# TASK-057 — ทรงผมต่างกันตามอาชีพ (D-079)

Milestone: M3 · ประเภท: presentation/asset · อ้างอิง: [D-079](../decisions.md), [asset metadata](../../assets/ro/README.md)

## งานที่ต้องรอก่อนหน้า

- TASK-019 — runtime asset closure
- TASK-020 — ACT body/head/weapon renderer

## เป้าหมายและผลส่งมอบ

เลือกทรงผมมนุษย์ RO ที่มีอยู่แล้วให้ต่างกันทุก job/gender ที่รองรับ รวม 19 อาชีพ/36 preset แสดงเหมือนกันในฉากฟาร์ม/บอส หน้าเลือกอาชีพ หน้าตัวละครและ avatar

## ขอบเขต

- รวม: `actor-presentations.json` head refs, runtime pack, contact sheet/ภาพจริงและหลักฐาน
- นอกงาน: สุ่มหน้าตา ระบบเลือกทรง/ย้อมผม สเตตัส/สมการ/เซฟใหม่ และการแก้ภาพต้นฉบับ

## รายละเอียด

ของเดิมทุก preset ใช้ human head 1 ตามเพศ คลังมี 42 human styles ต่อเพศ เลือกทรงที่ต่างกันภายในเพศให้ตรงบุคลิกอาชีพ รวม Monk ทรงโกน หัวใช้ ACT anchor และ body clock เดิม ไม่แก้ตำแหน่งหัวด้วยค่าประมาณ runtime pack ไม่เกิน 27MiB และ content/rules hash ต้องคงเดิม

## ขั้นตอนทำงาน

1. อ่าน catalog/index/metadata แยก human heads จาก Doram ตรวจ status/dependencies/ACT
2. ดู contact sheet ของทรงที่เลือก เปลี่ยน head refs ของ 36 preset
3. ตรวจ source library/runtime pack/M0 และประกอบภาพด้วย renderer จริง
4. ส่ง review พร้อมหลักฐานและอัปเดตเว็บในชุด UI ที่ผู้ใช้กำลังตรวจ

## เกณฑ์ตรวจรับ

- [x] AC-01: 19 jobs/36 presets ใช้ human head ที่ resolve ได้ ไม่มีทรงซ้ำระหว่าง job ในเพศเดียวกัน และไม่มี missing dependencies
- [x] AC-02: body/head/weapon ประกอบและเล่น ACT idle/walk/attack/hurt/dead ซ้าย/ขวาได้ หัวไม่ลอยหรือแยกจาก body clock; หมวกยังใช้ anchor เดิม
- [x] AC-03: menu/avatar และสนามใช้ preset เดียวกัน เลือก Class 2 แล้วยังเห็นทรงประจำ job นั้น
- [x] AC-04: importer/library checks/runtime closure/build ผ่าน pack raw ≤27MiB และ content hash เดิม; ไม่เปลี่ยน source media/sidecars หรือสูตร
- [ ] AC-05: อัปเดต compatible snapshot และผู้ใช้ยอมรับภาพจริง โดยเก็บเซฟเดิม

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | selection manifest + metadata | 19 jobs/36 presets เป็น human head 36 ID ไม่ซ้ำภายในเพศ ไม่มี missing dependencies; [selection](../evidence/task-057-hairstyles-selection.json) | ผ่าน |
| AC-02–03 | native renderer samples + Chrome/menu/farm + ภาพ | 3,420 frame/facing/hat samples, 5 states × ซ้าย/ขวา × bare/Tier20, 36 preset และ avatar/menu/สนามใช้ head refs เดียวกัน; [renderer](../evidence/task-057-native-renderer.json), ภาพ contact sheets ตรวจด้วยตาทั้ง 36 idle pose พร้อม/ไม่มีหมวก | ผ่าน |
| AC-04 | source checks/assets build/M0/build/byte budgets | source library 60,460 ผ่าน (9 STR unresolved เดิมอยู่นอก selected pack), starter check ผ่าน, 4 native tests, M0 11/11, build ผ่าน; 656 assets / raw 26,693,726B <27MiB; content `14ffbc71…` เดิม pack `f57a0773…` | ผ่าน |
| AC-05 | compatible refresh + ผู้ใช้ลอง | อัปเดต 6173/LAN แล้ว เซฟ revision2622/fingerprint เดิม public pack/head refs ใหม่ตรง รอผู้ใช้รับภาพ | รอผู้ใช้ |

ผู้ตรวจ: Codex self-review · วันที่: 21 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ไม่มีคำถามด้านการเลือก asset ใช้ภาพเดิม เลือกสไตล์โดยผู้ช่วยภายใต้คำขอ D-079

## บันทึกการทำงานและ review

- 21 ต.ค.2026: ผู้ใช้ถามให้ทรงผมต่างกันตามอาชีพ พบทุก job ใช้ทรง 1 จึงอ่าน metadata และ contact sheet ของ human hair 42 แบบต่อเพศแล้วเลือก 36 preset ที่ไม่ซ้ำตาม job/gender

- ผลวัด runtime: raw รวม sidecars 26,693,726B, manifest 506,825B, initial 1,582,917B; source media/sidecars ไม่เปลี่ยน ไม่เพิ่มสูตร/สเตตัส ไม่ต้อง migrate เซฟ
- ตรวจภาพด้วยตา: `docs/screenshots/task-057-job-hairstyles.png` และ `task-057-heads-with-hats.png` เป็น idle เท่านั้น ส่วน automated renderer ตรวจทุก decoded body-clock frame ของ 5 states ทั้งสองทิศพร้อม/ไม่มีหมวก ไม่อ้างว่าได้ดูทุกเฟรมด้วยตา
- ผู้ใช้ตอบ "อัปเดตเลย": สำรองและอัปเดตพร้อม UI ด้วย `--refresh-compatible-snapshot --lan` แล้ว ตรวจเซฟเดิมตรงก่อน/หลังและ public pack `f57a0773…` มี36หัวไม่ซ้ำ Chrome localhost/LAN ผ่านไม่มี error; [refresh](../evidence/task-056-polish-local-refresh.json), [smoke](../evidence/task-056-polish-updated-preview-smoke.json) AC-05 ยังรอผู้ใช้ยอมรับภาพจริง
