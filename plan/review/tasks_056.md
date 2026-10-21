# TASK-056 — UI มือถือกระชับและเปลี่ยนตัวละครจาก Stats / Skill (D-076)

Milestone: M3 · ประเภท: พัฒนา/ตรวจรับ UI · อ้างอิง: [game shell](../design/30-game-shell-ui.md), [D-076](../decisions.md)

## งานที่ต้องรอก่อนหน้า

- TASK-020, TASK-023, TASK-024, TASK-039 — renderer, roster, skills และวงจรหน้าจอที่ทำงานแล้ว

## เป้าหมายและผลส่งมอบ

- หน้าแรกไม่มีแถบรูปวงกลมตัวละครสี่ตัว
- หน้า Stats / Skill มีปุ่มก่อนหน้าและถัดไปที่มุมขวาบน เปลี่ยนตัวโดยไม่ต้องย้อนหน้าตัวละคร
- เมนู แผงข้อมูล และหน้าตัวละครเล็กลง ใช้พื้นที่มือถือได้มากขึ้น

## ขอบเขต

- รวม: presentation ใน `src/ui/game`, การทดสอบ Chrome บน stack แยก และเอกสาร/หลักฐาน
- นอกงาน: สูตร/ความเร็ว/ขนาดตัวในสนาม/เซฟ/อัตรารางวัล และการรีสตาร์ต 6173 ก่อนผู้ใช้อนุญาต

## รายละเอียด

ปรับ game shell ปัจจุบันของ TASK-048/055 ตามคำขอผู้ใช้ ไม่ถือว่าการแก้ครั้งนี้เป็นการยอมรับภาพของสองงานนั้น

ปุ่มเปลี่ยนตัวใช้ลำดับเดียวกับแถบหน้าตัวละคร: สมาชิกทีมก่อนตามตำแหน่ง จากนั้นตัวที่พักตาม roster; วนหัวท้ายครบเจ็ดตัวได้ อยู่หน้าเดิมและเปลี่ยน URL `c` ตามตัวที่เลือก ยกเลิก draft Status และโหมดเลือกช่องสกิลของตัวเก่าเมื่อเปลี่ยนตัว ไม่ส่งคำสั่งบันทึกเพียงเพราะกดเปลี่ยนตัว

ลดระยะห่างและขนาดแผงโดยจัด layout จริง ไม่ใช้ CSS zoom หรือเปลี่ยน viewport scale รักษาพื้นที่แตะ อ่านค่าและชื่อสกิลได้ และเลื่อนดูรายการยาวได้ หน้าสกิลจัดคิวไว้ใต้รายการและรายละเอียดตามคำแก้ D-077 รายละเอียดและรายการเลื่อนแยกกัน ส่วน Timeline เปิดใน sheet

## ขั้นตอนทำงาน

1. ตรวจ layout และ selectors เดิม พร้อมบันทึกการตัดสินใจ
2. ลบแถบหน้าทีม เพิ่ม navigation ร่วม และปรับความหนาแน่นของ UI
3. ตรวจ type/build/boundaries และ browser บนบัญชีทดสอบแยก 360×640, 390×844 และ desktop
4. ตรวจภาพจริง บันทึกผล ย้าย review เพื่อให้ผู้ใช้ตรวจ ก่อนขออัปเดต 6173

## เกณฑ์ตรวจรับ

- [x] AC-01: หน้าแรกไม่มี `.team-dock`/`.team-mini` และยังเปิดทีม/ตัวละคร/AFK/ท้าบอสได้
- [x] AC-02: ปุ่มก่อนหน้า/ถัดไปที่ Stats และ Skill วนครบ roster ตามลำดับทีมก่อน อยู่หน้าเดิม URL/ชื่อ/ค่า/สกิลตรงตัว และเปลี่ยนตัวไม่บันทึกเกม
- [x] AC-03: draft Status/เลือกช่องสกิลไม่ติดไปตัวใหม่; จัดคิวและอัปสกิล/Status หลังเปลี่ยนตัวส่งคำสั่งของตัวที่เลือกจริง
- [x] AC-04: ที่ 360×640 และ 390×844 หน้า Stats ปกติแสดงแถวแต้ม/ปุ่มยืนยันครบ และหน้า Skill เห็นคิวสี่ช่องใต้รายการ/รายละเอียดและเหนือปุ่ม Timeline โดยไม่ต้องเลื่อนหน้าหลัก; ทุกหน้าหลักไม่มี horizontal overflow/ปุ่มทับกัน ปุ่มเปลี่ยนตัวแตะได้อย่างน้อย 40×40 CSS px; รายการยาวยังเลื่อนดูครบ
- [x] AC-05: build/type/boundaries และ real local browser ผ่าน ไม่มี browser error; content hash และ API/DB/migrations คงเดิม
- [ ] AC-06: ผู้ใช้ยอมรับภาพบนมือถือจริง หลังอัปเดตเว็บส่วนตัวด้วยความยินยอม

- [x] AC-07: หน้าจอเกมใช้ CSPD แทน Cast Speed ข้อความเลือกไม่ได้ด้วยกดย้ำ/ลาก แต่ช่องกรอกยังพิมพ์แก้ไขได้
- [x] AC-08: ลูกศร SVG อยู่กึ่งกลางปุ่มทั้งสองแกน (คลาด ≤0.5px) ทุกขนาดที่ตรวจ และหน้าแรกไม่มีแถบแนะนำ/เป้าหมายเดิม

- [x] AC-09: แถบสถิติ/Timeline/ความเร็ว/ถอยทัพอยู่ใน boss card เป็นแถวเดียวไม่ชนแถบร่าย ทุกปุ่มทำงานผ่านไฟต์จริง; ไม่มี Emoji ที่มองเห็นใน UI เกมและชีต ใช้ SVG/native icons แทน

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | Chrome หน้า home และเมนูเดิม | แถบวงกลมหาย เหลือ AFK/ท้าบอสและเมนูหกปุ่ม; [รายงานล่าสุด](../evidence/task-056-polish-compact-ui.json) | ผ่าน |
| AC-02 | วนครบเจ็ดตัวทั้งสองหน้าและตรวจคำสั่ง/SQL | ลำดับถูก วนหัวท้ายได้ URL/job/index ตรง ไม่ส่งคำสั่งและ roster ไม่เปลี่ยน | ผ่าน |
| AC-03 | draft INT → เปลี่ยนตัว → allocate/upgrade/place | draft/picking ไม่ติดข้ามตัว อัป INT/สกิล/ช่อง 4 บันทึกเฉพาะ NPC ที่เลือกจริง | ผ่าน |
| AC-04 | 360×640 / 390×844 / 1280×800 × 10 หน้า + เลื่อนไปท้ายรายการ | 30 layouts ผ่าน ไม่มี horizontal overflow/ปุ่ม action ตัดบรรทัด/แถบ HUD ชนกัน; Stats/Skill หน้าปกติ page scroll = 0, arrows 40×40, คิวอยู่ใต้รายการ/รายละเอียดและเหนือ Timeline, รายการยาวเปิดดูครบ | ผ่าน |
| AC-05 | `npm run build`, actual upstream local Auth/API/SQL/Chrome, snapshot hashes | build/type/boundaries ผ่าน; browser 9 กลุ่มการตรวจ/30 layouts/0 error; content `14ffbc71…` และ server/migrations ตรง snapshot; [compatibility](../evidence/task-056-compatibility.json) | ผ่าน |
| AC-07 | กดย้ำ/ลากข้อความ และพิมพ์ RESET ในช่องกรอก (ไม่กดรีเซ็ต) | ไม่เกิด selection; input ยังพิมพ์ได้; ทุกหน้าใช้ CSPD | ผ่าน |
| AC-08 | วัด SVG/path center ทุก viewport + หน้า home | กึ่งกลางคลาด ≤0.5px ไม่มี guide/quest pill | ผ่าน |
| AC-09 | Daily จริง + คลิก Stats/Timeline/1→2→4→1/retreat | ไอคอนครบสี่ปุ่มใน boss card แถวเดียว ไม่มี Emoji ที่มองเห็น; server บันทึกถอยแล้ว; [toolbar](../evidence/task-056-battle-toolbar.json) | ผ่าน |
| AC-06 | ผู้ใช้ลองหน้าจอจริง | อัปเดต 6173 หลังผู้ใช้อนุญาตแล้ว รอผู้ใช้รับภาพ | ยังไม่ตรวจ |

ผู้ตรวจ: Codex self-review · วันที่: 21 ตุลาคม 2026 · รอบ review: 2 (แก้ D-077–080) · รอผู้ใช้ AC-06; อัปเดตชุดล่าสุดบน 6173 ตามผู้ใช้อนุญาตแล้ว

## Blocker / คำถาม

ผู้ใช้อนุญาตชุดล่าสุดในข้อความ "อัปเดตเลย" สำรองและอัปเดต UI D-077–080 พร้อมทรงผม D-079 แล้วด้วย `--refresh-compatible-snapshot --lan`; รอผู้ใช้ตรวจภาพ AC-06 การรีสตาร์ตครั้งถัดไปยังใช้กติกา D-072 / HANDOFF

## บันทึกการทำงานและ review

- 21 ต.ค. 2026: ผู้ใช้ขอ slot skill ด้านล่างเหมือนเดิม (D-077) กลับมาแก้ใน inprogress โดยย้าย DOM ของ loadout ใต้ skill-split เหนือ Timeline คง UI ส่วนอื่น เพิ่ม browser assertion ของตำแหน่งจริง รอตรวจรอบแก้

- 21 ตุลาคม 2026: รับคำขอ D-076 เริ่มตรวจ UI จริงและดำเนินงานบน source โดยแยกจากเซฟส่วนตัว

- รอบ 1: browser พบ Stats ล้น 52px ที่ 360×640 จึงกลับมาแก้ Base Stats เป็น label/value ในบรรทัดเดียวและย้ายคำอธิบายโบนัสเข้า Additional Stats; เก็บผลที่ไม่ผ่านใน `task-056-compact-ui-round1.json`
- รอบ 2: layout ทั้ง 30 หน้า/ขนาดผ่าน แต่ฮาร์เนสเลือก summary ของ nested details สองตัว จึงแก้ selector ให้ตรงลูกโดยตรง; เก็บ `task-056-compact-ui-round2.json` ไม่อ้างว่ารอบนั้นผ่านครบ
- รอบ 3: ผ่านทั้งหมด ตรวจภาพด้วยตาเฉพาะ home/Stats 360×640, Skill 390×844 (และ Buddy/Skill 360 รอบก่อน); ไม่ใช่การตรวจภาพบนมือถือจริงหรือ browser ทุกตระกูล ชุด browser ใช้ funded/Class2 fixture แยก ไม่อ้างเป็นความก้าวหน้าที่เล่นหาได้จริง

- ส่ง review: [สรุปการตรวจ](../evidence/task-056-review.json), [build](../evidence/task-056-build.txt), [real local stack](../evidence/task-056-local-stack.json); readiness 8/8 ผ่าน กระดาน 46/56 done, 1 inprogress, 4 review, 5 todo

- ผู้ใช้ตอบ "อัพเลย": สำรอง PG/เก็บ snapshot เก่า แล้วอัปเดตด้วย compatible refresh + LAN เซฟ revision2237/fingerprint เดิม ตรวจ Auth health/เว็บ200/frozen UI 8 ไฟล์ และ Chrome แบบ signed-out ทั้ง localhost/LAN JS-CSS 15 ไฟล์ต่อ origin ตรง snapshot 0 error; [refresh](../evidence/task-056-local-refresh.json), [smoke](../evidence/task-056-updated-preview-smoke.json)

- D-078: ผู้ใช้เพิ่ม CSPD/ปิดเลือกข้อความ/ลูกศรกึ่งกลาง/ลบคำแนะนำหน้าแรกในรอบแก้เดียวกัน เพิ่ม AC07–08 และ browser checks ของพฤติกรรมจริง

- D-080: ผู้ใช้เพิ่มการปรับแถบควบคุมไฟต์และใช้ Icon แทน Emoji ทุกหน้าจอ เพิ่ม AC09 และตรวจใน Daily จริงร่วมกับ 30-layout audit

- รอบ D-077–080: `RO_EVIDENCE_PREFIX=task-056 RO_COMPACT_ARTIFACT_TAG=task-056-polish RO_LOCAL_TEST_FOCUS=compact python3 scripts/test_auth_stack.py` ผ่านทั้งหมด 9 กลุ่ม/30 layouts/0 error ตรวจ Daily จริงและคิวล่าง/CSPD/selection/SVG center/ไม่มี home guide/ไม่มี Emoji; ภาพ `task-056-polish-compact-*` เก็บรอบเดิมไว้ไม่ทับ
- ตรวจภาพด้วยตารอบล่าสุด: ไฟต์ Daily 360×640, Skill 360×640, Stats 360×640 และภาพทรงผม bare/หมวกของ TASK-057; รอผู้ใช้ตรวจจริง
- ผู้ใช้ตอบ "อัปเดตเลย": อัปเดตชุด D-077–080 และ TASK-057 ด้วย compatible refresh + LAN สำรอง PG/เก็บ snapshot เก่า เซฟ 1 รายการ revision2622 และ fingerprint ตรงก่อน/หลัง content `14ffbc71…` เดิม pack ใหม่ `f57a0773…`; public manifest มี head preset36/unique36 ทุกไฟล์ UI ตรง frozen snapshot Chrome แบบ signed-out ทั้ง localhost/LAN bundle15ไฟล์ต่อ origin ตรง snapshot 0 error ไม่ใช้บัญชีส่วนตัว; [refresh](../evidence/task-056-polish-local-refresh.json), [smoke](../evidence/task-056-polish-updated-preview-smoke.json)
