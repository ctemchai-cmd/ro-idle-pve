# TASK-130 — Awaken เสริมเอกลักษณ์สกิล ไม่เติมต้านสถานะแบบเหมารวม

Milestone: M5 · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง D-160, design/49-awaken-identities.md

## งานที่ต้องรอก่อนหน้า

TASK-124/125/128/129 (done): Awaken152 variants, ราคาและเซฟเดิม, Hunterล่าสุด และ frozen balance baseline79ab9437

## เป้าหมายและขอบเขต

ผู้ใช้ขอให้ Awaken ได้ประโยชน์ชัดตามสกิล เช่น ลด/เจาะเกราะ เพิ่มดาเมจสกิล คริเรท/คริดาเมจ เพิ่มhit และผลฮีล/ป้องกันที่เหมาะสม แทน fallback ต้านสถานะ10%ในสกิลทั่วไป

คง stable IDs, rank/cost/ledger/เศษ/CT/ACD/คิว/ภาพnative+purpleglow/uncapped independent stacking และสกิลที่ยังไม่Awakenทั้งหมด; การต้านสถานะที่เป็นเอกลักษณ์เดิมเช่น Full Chemical Protection ยังมีได้ แต่ไม่ใช่โบนัสใหม่เพียงอย่างเดียว

## ขั้นตอน

1. ตรวจ152variantsและกำหนด gain รายสกิลแบบตรวจได้; ประเมินhitรวมไม่เพิ่มหลายเท่าเพียงเพราะเปลี่ยนจำนวนhit
2. ใช้ typed effect/status/modifier เดิมหรือเพิ่มdefinitionที่จำเป็น ไม่ใส่เงื่อนไขเฉพาะชื่อสกิลในengine/UI
3. สร้างทุกrankและคำอธิบายจากprogramจริง เก็บbaselineก่อนปรับ/ตรวจbase definitionsและราคาไม่เปลี่ยน
4. ตรวจแรงจริง/ผลใหม่/หลายhit/conditional/เวลา/interrupt/1x2x4/checkpoint/เซฟเก่า; วัดเทียบbaselineที่เก็บด้วยseedเดิม
5. build/จริงบนbrowserมือถือ/ปล่อยVercelและตรวจpublic ตามworkflowเดิม ไม่เข้าowneraccount ไม่restart6173

## เกณฑ์ตรวจรับ

- [x] AC-01: 152variantsมีgainเฉพาะหน้าที่ตรวจได้ ไม่มีgeneric+10%CCresistanceเป็นโบนัสใหม่เดี่ยว; โบนัสจริงขึ้นตามrankและมีตารางอธิบายรายสกิล
- [x] AC-02: active+passive representative oracle และทุก152variant actual sharedengine/1x2x4/checkpointผ่าน; hitรวม/โอกาส/การขัด/ช่วงเวลา/targetsถูกต้อง
- [x] AC-03: base152นิยาม/ราคา/Awakenเศษ/ทุน/IDs/nativeicons/queueเดิม; อธิบายสกิล/สมุดสกิล/Timelineตรงผลจริงและไม่มีคำอธิบายตกหล่น
- [ ] AC-04: targeted/full checksตามความจำเป็น/build/boundaries/native mobile/public deploymentผ่าน และผลbefore-afterอ้างcontent hashแยกจากTASK129ชัด

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง |
| --- | --- | --- |
| AC-01–04 | generator manifest / targeted tests / actual engine parity / build / mobile / hosted | รอตรวจ |

ผู้ตรวจ: Codex · วันที่:24ต.ค.2026 · รอบreview:0

## Blocker / คำถาม

ไม่มี ผู้ใช้ให้ตัวอย่างทิศทางและอนุญาตแก้โดยตรง ไม่ต้องขอเลือกทุกรายสกิล

## Local review รอบ1

- ครบ152identity / base152+ราคา+ภาพไม่เปลี่ยน / 631TSเต็มผ่าน; 57focusedผ่าน; engine152×1x2x4/checkpointผ่าน; typed per-effect penetrationแก้ปัญหาcastsnapshotด้วยscopeเฉพาะeffectไม่แก้snapshot
- Root+filteredbuild623450gzip/PWAf0b6febad1da48ff/packb9a9280aเหมือนกัน. Filteredครั้งแรกติดsystemPythonXcodeที่เครื่อง เปลี่ยนPATHใช้Python3.12.10ตัวเดียวกับrootแล้วผ่าน ไม่แก้productเพื่อซ่อนerror
- Nativeสมุดสกิล32jobs/rank10/7representatives/Timeline/6hit/purpleNative390320ผ่าน4groups/0writes; viewed320. Harnessแก้selectorที่ซ้อนกัน ไม่แก้UIเพียงเพื่อผ่าน
- Paired832ไฟต์ newhash9ae8e3b2… actualinitialstats+ต้นทุนเท่ากันทุกseed. [ผล](../evidence/task-130-high-90-awaken10-comparison.json)
- AC04ยังรอcommit/push/VercelSUCCESS/publicproofก่อนdone ไม่มีownerเซฟหรือ6173ถูกแตะ
