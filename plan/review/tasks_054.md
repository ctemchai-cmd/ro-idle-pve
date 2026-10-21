# TASK-054 — ภาพการต่อสู้ให้ตรง RO: อาวุธ, ท่าโจมตี, จังหวะลูกธนู, เอฟเฟกต์สกิลจริง, ชื่อสกิล, ตัวเลขดาเมจ (D-070)

Milestone: M3 (งานแทรกตามคำขอผู้ใช้) · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง: [D-070](../decisions.md), [spatial/mobile](../design/21-spatial-combat-and-mobile.md), [game shell](../design/30-game-shell-ui.md)

## งานที่ต้องรอก่อนหน้า

- TASK-019 — runtime asset pack
- TASK-020 — browser battle renderer
- TASK-048 — game shell `/play`

## เป้าหมายและผลส่งมอบ

ผู้ใช้แจ้ง (20 ต.ค. 2026): Monk ถือกระบองแทนสนับมือ, ท่าโจมตีมีท่าเดียว, ลูกธนูออกตอนเพิ่งง้าง, เอฟเฟกต์สกิลหลายท่าไม่ใช่ของจริง (เช่น Bolt), ชื่อสกิลไม่ขึ้นเมื่อไม่มีหลอดร่าย (Bash ไม่เคยขึ้น), ตัวเลขดาเมจควรโค้งขึ้นแล้วตกและหดแบบ RO และเร็วกว่าเดิม, ตัวละครฝั่งเราโดนตีควรมีเลข งานนี้แก้ทั้งหมดในชั้น presentation เท่านั้น ไม่แตะสูตร/เวลาเกม

## ขอบเขต

- รวมในงาน: overlay อาวุธตาม `weapon_compatibility` (monk สนับมือ, acolyte/priest คทา, alchemist กระบอง, assassin มีด), วนท่าโจมตีเฉพาะท่าที่อาวุธยังแสดง, frame ปล่อยลูกธนู, ชื่อสกิลทุกครั้งที่เริ่มใช้, ตัวเลขแบบ RO + เลขแดงฝั่งเรา, เอฟเฟกต์ STR ของจริง 22 ไฟล์ผูกกับ 28 presentation, Bolt ตกจากฟ้า, งบ pack
- อยู่นอกงาน: ชุด costume/ร่าง Hi-class, effect ที่ RO วาดด้วยโค้ด client (เช่น Heal/Blessing) ซึ่งไม่มีไฟล์ STR ในคลัง, ปรับ balance

## รายละเอียด

RO วาด overlay อาวุธแต่ละประเภทในกลุ่มท่าโจมตีเดียว (มีด/คทา/ดาบใน group 10 = action 86, กระบอง/ธนู Class 2 ใน group 11 = 94) จึงสลับท่าแบบสุ่มไม่ได้เพราะอาวุธจะหาย สนับมือของ Monk ไม่มีภาพ (RO ต่อยมือเปล่า) จึงวน 3 ท่า 86/94/46 ได้ เสียง ACT ของธนูอยู่ตอนง้าง (frame 1–2) ลูกจริงออก frame 7 ทุกร่าง (frame 4–6 คือดึงสายสุด) ธนู/ฮันเตอร์จึงมี `attack_release_frame: 7` และท่าโจมตีเล่นเร็วขึ้นเมื่อ ASPD สูงกว่าความยาวท่า เพื่อไม่ให้เริ่มง้างรอบใหม่ก่อนลูกออก Effect ต่อฮิตอยู่ใน `combat-visuals.json` `impacts` (key = presentation id ให้ Rogue copy ใช้ร่วม) เวลาเดียวกับเลขดาเมจของฮิตนั้น Lightning Bolt ใช้ STR `lightning` จริง 3 ครั้งห่าง 220 ms, Fire/Cold Bolt เป็นหอกธาตุตกจากฟ้าแล้วระเบิด `firehit1`/`freeze`, Arrow Shower ใช้ `arrowstorm`

## ขั้นตอนทำงาน

1. contact sheet ท่า/อาวุธ แล้วแก้ preset
2. renderer: ท่าโจมตี, release frame, ชื่อสกิล, ตัวเลข, impact
3. เลือก effect จริงด้วยภาพ preview แล้วผูกข้อมูล + pack
4. unit/browser test, หลักฐานภาพ, ผู้ใช้ตรวจหน้าตา

## เกณฑ์ตรวจรับ

- [x] AC-01: ทุก preset ถืออาวุธประเภทเดียวกับ `weapon_compatibility` และทุกท่าโจมตีที่ preset ใช้ยังแสดงอาวุธ (ยกเว้นอาวุธที่ไม่มีภาพเลย) Monk วน 3 ท่า อาชีพอื่นคงท่าที่อาวุธแสดง
- [x] AC-02: ลูกธนูของ archer/hunter ทั้งสองเพศออกที่ frame 7 (700 ms × อัตราเร่งท่าเมื่อ ASPD สูง) ไม่ใช่ตอนง้าง วัดใน browser กับ shared engine จริง
- [x] AC-03: ทุกสกิลที่เริ่มใช้ (รวมสกิลไม่มีเวลาร่ายเช่น Bash) แสดงชื่อเหนือผู้ใช้อย่างน้อย 1.5 วินาที
- [x] AC-04: ตัวเลขดาเมจโค้งขึ้น-ตก-เอียงข้าง-หดตัวใน 0.8 วินาที, ฝั่งเราที่โดนตีมีเลขสีแดง, เลขยังผูกกับ event จริงและเวลากระทบเดิม
- [x] AC-05: เอฟเฟกต์ STR จริงจากคลังเล่นต่อฮิตสำหรับ Bolt และสกิลที่ map ไว้ Fire/Cold Bolt ตกจากฟ้า pack อยู่ในงบ raw 27 MiB (D-070) และ first battle ≤8 MiB, เทสต์ทั้งชุด/build ผ่าน
- [ ] AC-06: ผู้ใช้ตรวจหน้าตาในเกมแล้วยอมรับ

## วิธีตรวจและหลักฐาน

`node --import tsx --test tests/game/impact-timing.test.ts tests/game/presentation-fidelity.test.ts`, `npm test`, `npm run build`, `python3 -m unittest tests.test_runtime_assets tests.test_preparation_pack`, `RO_PREVIEW_URL=<isolated vite> node scripts/test_presentation_fidelity.cjs`

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | impact-timing test ตรวจทุก 36 preset ว่าท่าที่ใช้แสดงอาวุธ + browser monk cycle | monk `attack/attack2/attack3`, assassin ย้าย 94→86 เพราะมีดแสดงใน 86 เท่านั้น | ผ่าน |
| AC-02 | browser harness วัดเวลาที่ลูกธนูแต่ละดอกปรากฏหลัง normal_attack, contact sheet เฉพาะ overlay ธนู | รอบ 2: 8 ดอก 700–708 ms, unit test ทั้ง 4 ร่าง = 700 ms + ทดสอบเร่งท่าเมื่อยิงถี่ (×0.6 ที่ห่าง 600 ms) | ผ่าน (รอบ 1 ที่ frame 4 ผู้ใช้แจ้งว่ายังออกตอนง้าง — ผิดจริง แก้แล้ว) |
| AC-03 | browser harness นับเวลาที่ชื่อแต่ละสกิลถูกวาด | 12 สกิลที่ใช้ทุกตัวมีชื่อ, Bash 1500 ms, Cataclysm 5000 ms | ผ่าน |
| AC-04 | unit `numberFlight` + browser นับเฟรมเลขออก/เข้า | outgoing 409 เฟรม, incoming แดง 278 เฟรม, `docs/screenshots/presentation-numbers.png` | ผ่าน |
| AC-05 | presentation-fidelity test, browser impact count, pack build, live shell suite | impact 7 ชนิดเล่นใน demo, pack 25.67 MiB raw / initial 1.56 MB, 343 TS tests + 11 py tests + build ผ่าน, live `/play` 27 checks/55 ภาพ/0 error เห็นชื่อสกิลและเลขแดงในเกมจริง (`docs/screenshots/task-048-heavy-cast-390.png`) | ผ่าน |
| AC-06 | ผู้ใช้เปิดเกมดู | รอผู้ใช้ | ยังไม่ตรวจ |

ผู้ตรวจ: Claude self-check · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · [หลักฐาน browser](../evidence/task-054-presentation.json)

## Blocker / คำถาม

ไม่มี (รอผู้ใช้ตรวจภาพ AC-06)

## บันทึกการทำงานและ review

- 20 ตุลาคม 2026: ผู้ใช้แจ้งปัญหาภาพ 7 ข้อ สร้างงานและแก้ครบ ใส่ review รอผู้ใช้ดูหน้าตา ฮาร์เนสเก่า test_focus_impact/test_combat_polish/test_mobile_spatial/test_timeline_caster_polish ขับ UI `/` เดิม (`.companion`) ที่ถูกแทนแล้ว จึงรันเป็น regression ไม่ได้ หลักฐานเดิมไม่ถูกเขียนทับ
- 20 ตุลาคม 2026 (รอบ 2): ผู้ใช้แจ้งว่าธนูยังออกตอนง้าง ตรวจ contact sheet เฉพาะ overlay ธนูขยายใหญ่ พบว่า frame 4–6 คือดึงสายสุด และสายดีดตรงที่ frame 7 ทุกร่าง (archer/hunter ชาย/หญิง) การอ่าน frame 4 รอบแรกผิด แก้เป็น 7 และเพิ่มการเร่งท่าตาม ASPD
