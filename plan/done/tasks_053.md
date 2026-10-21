# TASK-053 — ไอเทมและการ์ดหลากหลาย + Option ตาม rarity 1/2/3/4/5 (D-068)

Milestone: M3 (งานแทรกตามคำขอผู้ใช้) · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง: [D-068](../decisions.md), [equipment](../design/18-equipment-and-rewards-baseline.md)

## งานที่ต้องรอก่อนหน้า

- TASK-026 — inventory และนิยามไอเทม
- TASK-027 — การ์ดประจำช่อง
- TASK-052 — Option สุ่มตาม rarity

## เป้าหมายและผลส่งมอบ

ทุก tier 1/20/40/60 มีไอเทมหลายแบบต่อช่อง (อาวุธ 2 แบบต่อประเภท, หมวก/เกราะ/ผ้าคลุม/รองเท้า 3 แบบ, เครื่องประดับ 4 แบบ = 36 ชนิดต่อ tier) และเตรียม tier 80 ไว้เป็นข้อมูลอนาคต การ์ด 60 ใบชื่อมอนสเตอร์ RO แบ่งตาม tier และ Option สุ่ม Rare 1 / Epic 2 / Legendary 3 / Immortal 4 / Supreme 5

## ขอบเขต

- รวมในงาน: ตัวสร้าง `plan/generators/items.py` (ไอคอนจาก RO item ID ใน `item-icons.json`), ข้อมูล equipment/cards/gacha/loot/strings, กาชาการ์ดตาม tier ของผู้เล่น, ดรอปฟาร์ม 36 ชนิด, ย้ายเซฟรีเฟรช pool, asset pack ใหม่, ตัวตรวจ/เทสต์
- อยู่นอกงาน: ไอเทม tier 80 ที่ใช้ได้จริง (รอเพดานเลเวล Hi-class), ภาพการ์ดเฉพาะตัว (ใช้หน้าการ์ดเดิมของช่องนั้น), เซ็ตโบนัส

## รายละเอียด

ไอเทมมาตรฐาน 60 ชิ้นและการ์ด 18 ใบเดิมคงไว้ทุก byte เพราะเซฟอ้างถึง แบบใหม่แลกพลังพื้นฐานบางส่วนกับโบนัสตามบทบาท โบนัส % โตตาม tier scale 1/1.5/2/2.5/3 เหมือน Option สุ่ม ไม่มี AGI/DEX/ความเร็ว ตัวเลขเป็น baseline ของผู้ช่วยและวัดด้วย journey ใน TASK-041

## ขั้นตอนทำงาน

1. ตัวสร้างข้อมูลและไอคอน
2. โค้ดกาชา/ดรอป/ย้ายเซฟ + ตัวตรวจ M0
3. asset pack และเทสต์ทั้งชุด
4. browser test และบันทึกหลักฐาน

## เกณฑ์ตรวจรับ

- [x] AC-01: tier 1/20/40/60 มี 36 ชนิดต่อ tier ครบ 6 ช่องทุกอาวุธ 2 แบบ ไอคอนมาจาก RO item ID จริงในคลัง และ tier 80 อยู่ใน `future_definitions` ที่ไม่ดรอป/ไม่สุ่ม
- [x] AC-02: การ์ด 60 ใบแบ่ง tier กาชาและรางวัลหอคอยให้การ์ด tier เดียวกับบทของผู้เล่น ไอเทม/การ์ดเดิมในเซฟใช้ต่อได้
- [x] AC-03: Option สุ่ม Rare 1 / Epic 2 / Legendary 3 / Immortal 4 / Supreme 5 ทุกทางที่ของเกิด
- [x] AC-04: asset pack อยู่ในงบ, ตัวตรวจ M0/เทสต์ทั้งชุดผ่าน และหน้ากระเป๋า/ร้านค้าแสดงไอเทม/การ์ดใหม่ใน browser test โดยไม่มี error

## วิธีตรวจและหลักฐาน

`python3 plan/generators/items.py --check`, M0 checks, `npm run check`, `npm run assets:check`, live shell test

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | items.py --check + m0 equipment check + นับข้อมูล | tier 1/20/40/60 มี 36 ชนิดต่อ tier ครบ 6 ช่อง อาวุธ 2 แบบ ไอคอนจาก RO item ID; tier 80 อยู่ใน future_definitions 36 ชิ้นไม่ดรอป/ไม่สุ่ม; `items.py --check` ตรง | ผ่าน |
| AC-02 | T037 AC-01 + T053 AC-02 (tower) + migration ใน live | การ์ด 60 ใบ (24/12/12/12) กาชาและกล่องการ์ดหอคอยให้ tier ตามบทของผู้เล่น (ทดสอบบท 1→1, 2→20, 4→40, 5→40) เซฟเก่าย้ายได้และของเดิมใช้ต่อ | ผ่าน |
| AC-03 | T052 AC-01 | Option สุ่ม Rare 1 / Epic 2 / Legendary 3 / Immortal 4 / Supreme 5 ทุกทางที่ของเกิด deterministic ต่อ seed | ผ่าน |
| AC-04 | pack build + npm test + live shell | pack 25.67 MiB raw ในงบ 27 MiB (D-070), M0 + 349 TS tests ผ่าน, live ร้านค้า/กระเป๋าสุ่มและแสดงของ/การ์ดใหม่พร้อม Option 0 browser error | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `6e7859d1…` · [หลักฐาน](../evidence/task-053-review.json)

## Blocker / คำถาม

ไม่มี

## บันทึกการทำงานและ review

- 20 ตุลาคม 2026: ผู้ใช้ขอความหลากหลายของไอเทม (ระดับ 20/40/60/80), การ์ดหลากหลาย และ Option 1/2/3/4… ตาม rarity สร้างงานและเริ่มทำ
- 20 ตุลาคม 2026: ปิดงาน: เติมเทสต์การ์ดหอคอยตาม tier (T053 AC-02) live ชุดเต็มผ่าน 33 checks
- 21 ตุลาคม 2026 (หลังปิดงาน): journey 25 วันพบบั๊ก — schema `options.maxItems` ยังเป็น 4 (จาก D-062) แต่ D-068 ให้ Supreme 5 แถว ของ Supreme (ดรอปฟาร์มบท 8 หรือผสม Immortal) ทำให้บัญชีไม่ผ่าน validation และคำสั่งถัดไปถูกปฏิเสธ แก้ schema ทั้ง inventory/pending_rewards เป็น 5 และเพิ่มเทสต์ที่ผ่าน `validateAccount` จริง (mutation-check: กลับเป็น 4 แล้วเทสต์ล้ม) — เทสต์เดิมตรวจแค่ตัวสุ่ม ไม่ได้ตรวจกับ schema เซฟ
