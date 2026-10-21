# TASK-052 — Option สุ่มบนอุปกรณ์ตามระดับ (Rare 1 แถว, Epic 2 แถว …)

Milestone: M3 (งานแทรกตามคำขอผู้ใช้) · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง: [D-062](../decisions.md), [equipment](../design/18-equipment-and-rewards-baseline.md)

## งานที่ต้องรอก่อนหน้า

- TASK-026 — inventory และนิยามไอเทม
- TASK-028 — ผสม rarity/อัป tier
- TASK-050 — ย้ายเซฟ (schema ไอเทมเปลี่ยน)

## เป้าหมายและผลส่งมอบ

ไอเทม rarity Rare ขึ้นไปมี option สุ่มตามจำนวนแถว ใช้ใน resolve ค่าพลังทุกจุด และแสดงใน UI

## ขอบเขต

- รวมในงาน: schema option บน item instance, pool/ค่าตาม tier, สุ่มตอนไอเทมเกิด (drop/ผสม/กาชา), อัป tier คง option, ย้ายเซฟเดิม, UI รายละเอียดไอเทม
- อยู่นอกงาน: ระบบ reroll/lock option แบบเสียเงิน (เป็นงานต่อยอด)

## รายละเอียด

จำนวนแถว Common/Uncommon 0, Rare 1, Epic 2, Legendary 3, Immortal 3, Supreme 4 และ pool ไม่มี ASPD/ความเร็วร่าย ค่าเป็น baseline ของผู้ช่วย การสุ่มเป็น deterministic จาก RNG ฝั่งเซิร์ฟเวอร์

## ขั้นตอนทำงาน

1. ข้อมูลและ schema ใน plan/data พร้อมตัวตรวจ
2. reducer/คำสั่งฝั่ง domain + unit tests
3. UI และ browser test
4. บันทึกหลักฐานและ acceptance

## เกณฑ์ตรวจรับ

- [x] AC-01: ไอเทมที่เกิดใหม่ทุกทางมีจำนวนแถว option ตาม rarity ค่าอยู่ในช่วงของ tier และผลเหมือนเดิมเมื่อ replay seed เดียวกัน
- [x] AC-02: option เข้า resolveStats ทั้งไฟต์จริง/preview/simulation และไม่มี option ด้านความเร็ว
- [x] AC-03: อัป tier คง option และค่าโตตาม tier ส่วนผสมแล้วสุ่มใหม่ เซฟเดิมย้ายผ่าน validator
- [x] AC-04: UI แสดง option ในกระเป๋า/ช่องสวม/หน้าเปลี่ยนของ และ browser test ผ่าน

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `node --import tsx --test tests/game/gacha-shop.test.ts` | จำนวนแถวตาม rarity ทุกทางที่เกิดของ ค่าอยู่ในช่วง seed เดิมผลเดิม | ผ่าน |
| AC-02 | gacha-shop.test T052 AC-02 | option เข้า pipeline เดียวกันครั้งเดียว ไม่มีสายความเร็ว | ผ่าน |
| AC-03 | gacha-shop.test T052 AC-03 | อัป tier คงค่าสุ่มและโต ×1.5 ผสมสุ่มใหม่ เซฟเก่าย้ายได้คงที่ | ผ่าน |
| AC-04 | live `test_game_shell_live.cjs` (STORE/backpack) | กระเป๋า/ช่องสวมแสดง ✦ option ผ่าน browser จริง | ผ่าน |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · content `ab45f216…` · [หลักฐาน](../evidence/task-052-review.json)

## Blocker / คำถาม

ไม่มี ตัวเลขเป็น baseline ของผู้ช่วยตาม D-061–D-063

## บันทึกการทำงานและ review

- 20 ตุลาคม 2026: สร้างงานตามคำขอผู้ใช้; ยังไม่ได้ลงมือ
- 20 ตุลาคม 2026: ทำ option สุ่มตาม rarity (D-062) ใน `item-options.ts` ทุกทางที่สร้างของ (ดรอป/กาชา/ผสม) เข้า pipeline เดียว พร้อม migration และ UI `OptionLines` ผ่าน gacha-shop.test และ live
