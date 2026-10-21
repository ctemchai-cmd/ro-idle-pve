# TASK-050 — เครื่องมือย้ายเซฟระหว่างพัฒนา (ส่วนหนึ่งของ TASK-040)

Milestone: M3 (งานแทรกตามคำขอผู้ใช้) · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง design: [D-058](../decisions.md), [protocol23](../design/23-save-runtime-protocol.md)

## งานที่ต้องรอก่อนหน้า

- TASK-022 — cloud save/checkpoint/receipt/signature
- TASK-049 — กติกา D-057 (ตัวอย่างการเปลี่ยน content ที่ต้องย้ายเซฟ)
- สิ่งที่ต้องได้จากงานนั้น: validator, canonical hash และลายเซ็นแบบเดียวกับ API

## เป้าหมายและผลส่งมอบ

เปลี่ยน content/กติกาแล้วเซฟส่วนตัวย้ายตามได้โดยไม่ต้องเริ่มใหม่: `src/domain/account/migrate.ts`, `scripts/game/migrate-local-saves.ts`, `play_local.py --refresh-migrate-saves`, `tests/game/save-migration.test.ts`

## ขอบเขต

- รวมในงาน: การย้ายเซฟในเครื่อง (loopback) ระหว่างพัฒนา เติม field ใหม่/ปรับงบ Status/ตัดด่านที่ไม่มี/จบไฟต์ค้าง และตรวจด้วย validator ของเซิร์ฟเวอร์
- อยู่นอกงาน: export/import backup ของผู้เล่น, hosted/production migration, rollback UI (ยังเป็น TASK-040)

## รายละเอียด

การย้ายไม่สร้างความคืบหน้าใหม่: ของที่จ่ายเกินงบใหม่จะถูกคืน (refund) ไม่ถูกเก็บไว้แบบไม่มีทุน ไฟต์ค้างจบเสมอเพราะ checkpoint ไฟต์ข้ามเวอร์ชันไม่ได้ ถ้าเซฟใดไม่ผ่าน validator ทั้งชุดจะหยุดก่อนเปลี่ยน snapshot

## ขั้นตอนทำงาน

1. ฟังก์ชัน domain + unit tests
2. สคริปต์สร้าง SQL ที่ลงลายเซ็นและกันการแข่ง revision
3. โหมด play_local: สำรอง → build → ซ้อมย้าย → เปลี่ยน snapshot → migrations → ใส่ revision ใหม่
4. ทดสอบครบวงจรบน instance ชั่วคราวด้วยเซฟกติกาเก่าจริง

## เกณฑ์ตรวจรับ

- [x] AC-01: เซฟกติกาเก่า (งบ Status 5/เลเวล, ไม่มี `refine_failures`, ด่านที่ไม่มีแล้ว) ย้ายแล้วผ่าน `validateAccount`; ของที่เกินงบถูกคืน
- [x] AC-02: SQL ที่สร้างเพิ่ม 1 revision ต่อเซฟ ลงลายเซ็นตรงกับ API และข้ามเซฟที่เป็นเวอร์ชันปัจจุบัน; state ที่ไม่ผ่านทำให้ทั้งชุดหยุด
- [x] AC-03: บน instance ชั่วคราว เซฟ #461 (content `65b82feb…`) ย้ายเป็น #462 (content ปัจจุบัน) โหลดผ่านเซิร์ฟเวอร์จริง และส่งคำสั่งต่อได้ (FARM_RESERVED + REWARD_CLAIMED ×4 → #467) โดยไม่มี browser error

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `node --import tsx --test tests/game/save-migration.test.ts` | ผ่าน 2 เคส (ปรับงบ 65→61, คืนแต้ม 45 เกินงบ 34) — [review](../evidence/task-050-review.json) | ผ่าน |
| AC-02 | เทสต์เดียวกัน (ลายเซ็น/ข้าม/หยุดเมื่อ state เสีย) | ผ่าน | ผ่าน |
| AC-03 | `RO_LOCAL_PLAY_ROOT=.local/e2e RO_LOCAL_PLAY_PORT=6299 play_local.py` → ใส่เซฟเก่า → `--refresh-migrate-saves` → Chrome login + รับรางวัล | revision 461→462→467, errors 0; instance และสำเนาเซฟถูกลบหลังทดสอบ | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · [หลักฐาน](../evidence/task-050-review.json)

## Blocker / คำถาม

ไม่มี

## บันทึกการทำงานและ review

- path ของ scratchpad ยาวเกินขีดจำกัด Unix socket ของ PostgreSQL (103 ตัวอักษร) จึงใช้ `.local/e2e` สำหรับ instance ชั่วคราว
