# TASK-049 — ปรับกติกาตาม D-057: ด่านย่อย, Refine มีโอกาส, Status แบบ RO และเริ่มเซฟใหม่

Milestone: M3 (งานแทรกตามคำขอผู้ใช้) · ประเภท: ออกแบบ+พัฒนา/ตรวจรับ · อ้างอิง design: [D-057](../decisions.md), [design18](../design/18-equipment-and-rewards-baseline.md), [design19](../design/19-encounters-and-modes-baseline.md), [design09](../design/09-release-scope.md)

## งานที่ต้องรอก่อนหน้า

- TASK-014 — gate M0 (ข้อมูลที่แก้ต้องผ่าน checks/manifest เดิม)
- TASK-023 — Status/เลเวล runtime
- TASK-025 — Story/farm runtime
- TASK-027 — Refine/slot runtime
- TASK-048 — game shell (UI แสดงผลกติกาใหม่)
- สิ่งที่ต้องได้จากงานนั้น: reducers/commands/checks เดิมที่ขยายได้โดยไม่สร้างสูตรชุดที่สอง

## เป้าหมายและผลส่งมอบ

- Story มีบท 1–3 = 10 ด่าน, บท 4–8 = 20 ด่าน (130 ด่าน) บทอนาคต 9+ = 50; สร้างจาก generator ที่ commit ไว้ (`plan/generators/stages.py`) ซึ่งสร้างไฟล์ 8×10 ที่ review แล้วได้ตรงทุก byte
- Refine ทีละขั้น: +1–+4 สำเร็จ 100% จากนั้น 80/65/50/40/30/20% มีโอกาสสะสม +10% ต่อครั้งที่พลาด (รีเซ็ตเมื่อสำเร็จ) พลาดเสียแค่ราคาขั้นนั้น ระดับไม่ลด; ผลสุ่มจาก seed ที่เซิร์ฟเวอร์ใส่ต่อคำสั่ง
- Status: ได้แต้มต่อเลเวล 3 + floor(เลเวล/5) (Lv10 = 34, Lv20 = 91, Lv70 = 676) และโบนัสทุก 10 แต้มของค่าสุดท้าย STR→ATK+5, AGI→การหลบ+1%, VIT→HP+50, INT→MATK+8, DEX→ความแม่นยำ+1%, LUK→คริ+1% โดยไม่แตะ ASPD/ความเร็วร่าย
- เซฟส่วนตัวเดิมสำรองเป็นไฟล์แล้วเริ่มใหม่ (ผู้ใช้เลือก)

## ขอบเขต

- รวมในงาน: ข้อมูล plan/data ที่เกี่ยวข้อง, generators, M0 checks/reports/manifest, readiness ที่รองรับงานหลัง 047, domain/client/UI, เทสต์, เว็บเล่นส่วนตัว
- อยู่นอกงาน: จูนตัวเลขบาลานซ์ (TASK-041), migration เซฟข้าม content อัตโนมัติ (TASK-040), บทที่ 9 ขึ้นไป

## รายละเอียด

ตัวเลขโอกาส/pity/โบนัส/แต้มเป็น baseline ของผู้ช่วยตามที่ผู้ใช้อนุญาตใน D-057 ราคาต่อขั้นของ Refine คงเดิม ทำให้ค่าใช้จ่ายคาดหวังของ Refine +10 ทั้ง 24 ช่องเพิ่มเป็นประมาณ 2.14 เท่า (checkpoint ใน economy.json เปลี่ยนเป็นค่าคาดหวังและขยายช่วงรับได้เป็น 4,800 นาที โดยระบุว่าเป็นผลของ D-057) รางวัลผ่านด่านแรกคูณ 10/N เพื่อให้ยอดรวมต่อบทเท่าเดิม

## ขั้นตอนทำงาน

1. เขียน generator ด่านและพิสูจน์ว่าสร้างไฟล์เดิมได้ byte-identical แล้วสร้าง layout ใหม่
2. ปรับ progression/combat-rules/slot-progress/economy/skills builds/fixtures/schema และ checks แล้วรันรายงานใหม่ + build_manifest + readiness
3. แก้ domain (resolveStats โบนัส, refine roll/pity, ค่าเริ่มต้น `refine_failures`) client และ UI
4. ปรับเทสต์และเพิ่มเทสต์กติกาใหม่ รัน npm check/build/asset checks/live walkthrough
5. สำรองและรีเซ็ตเซฟส่วนตัว แล้วรีเฟรช snapshot

## เกณฑ์ตรวจรับ

- [x] AC-01: `stages.json` มี 130 ด่านตาม layout 10/10/10/20×5 บอสท้ายบทอยู่ที่ด่านสุดท้ายของบท ยอด crystal/gold/EXP ต่อบทเท่าเดิม และ `plan/generators/stages.py --legacy --check` ยืนยันว่าสูตรสร้างไฟล์ 8×10 เดิมได้ตรงทุก byte
- [x] AC-02: Refine ทีละขั้นตามตารางโอกาส; พลาดได้ receipt `REFINE_FAILED` ที่ commit แล้ว เสียราคาขั้นนั้น ระดับไม่ลด และ `refine_failures` เพิ่ม; สำเร็จรีเซ็ตเป็น 0; ผลสุ่มมาจาก seed ฝั่งเซิร์ฟเวอร์และ replay request เดิมไม่สุ่มใหม่
- [x] AC-03: แต้ม Status ตามสูตร RO และโบนัสทุก 10 แต้มเข้าค่าพลังผ่าน `resolveStats` ตัวเดียวกับ engine โดย ASPD/ความเร็วร่ายของค่าหลักเดียวกันไม่เปลี่ยน
- [x] AC-04: M0 checks ทุกตัว + build_manifest + readiness ผ่าน, `npm run check`/build/asset checks/live walkthrough ผ่าน และ UI แสดงโอกาส Refine/ผลพลาด/แต้มตามกติกาใหม่
- [x] AC-05: เซฟส่วนตัวเดิมถูกสำรองเป็น `pg_dump` และ JSON ก่อนรีเซ็ต เว็บ 6173 รันกติกาใหม่และผู้เล่นสร้างตัวละครใหม่ได้

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/generators/stages.py --legacy --check`, `python3 plan/checks/levels.py` | สร้างไฟล์ 8×10 เดิมได้ตรงทุก byte; 130 ด่าน, บอสท้ายบทที่ด่านสุดท้าย, ยอดรางวัลต่อบทเท่าเดิม; levels 153 checks — [review](../evidence/task-049-review.json) | ผ่าน |
| AC-02 | `tests/game/slot-progression.test.ts` (seed สำเร็จ/พลาด) | REFINE_FAILED commit เสีย 5000 ทอง/25 แร่ ระดับไม่ลด, pity ถึง 100% หลังพลาด 8 ครั้งที่ +10, ข้ามขั้นถูกปฏิเสธ, ไม่มี seed ถูกปฏิเสธ | ผ่าน |
| AC-03 | `plan/checks/progression.py`, `combat.py`, `tests/game/rules-d057.test.ts` | Lv10/20/70 = 34/91/676; โบนัสทุก 10 แต้มถูกต้องและ ASPD/ร่ายเท่าเดิม | ผ่าน |
| AC-04 | M0 checks ทุกตัว + `build_manifest.mjs` + `readiness.py`, `npm run check` (242), `npm run build`, asset/renderer tests, live walkthrough 13/13 | ผ่านทั้งหมด browser errors 0 | ผ่าน |
| AC-05 | `play_local.py --reset-saves-for-new-content` + read-only login | สำรอง SQL + JSON เซฟ #461 แล้วล้างเซฟ, เว็บ 6173 ใช้ content `01876ded…`, ล็อกอินเห็นหน้าสร้างตัวละคร | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · [หลักฐาน](../evidence/task-049-review.json)

## Blocker / คำถาม

ไม่มี ผู้ใช้ตอบครบใน D-057 ตัวเลขที่ผู้ช่วยตั้งเป็น baseline ให้จูนใน TASK-041

## บันทึกการทำงานและ review

- 20 ต.ค. 2026: รัน `plan/checks/readiness.py` แล้วพบว่าสคริปต์เขียนทับ `evidence/task-014-review.json` ทุกครั้งที่รัน; สถานะ gate จริงตอนนั้นไม่ผ่านอยู่แล้ว (มี TASK-048 ที่ readiness ยังไม่รู้จัก และรายงาน TASK-012 เก่าเพราะ design10 เปลี่ยนตาม D-052) งานนี้แก้ readiness ให้รองรับงานหลัง 047 แล้วรันใหม่
