# TASK-048 — ปรับหน้าจอ /play เป็น game shell แบบมือถือ

Milestone: M3 (งานแทรกตามคำขอผู้ใช้) · ประเภท: พัฒนา/ตรวจรับ UI · อ้างอิง design: [design30](../design/30-game-shell-ui.md), [D-051](../decisions.md), [design10](../design/10-ui-and-player-flows.md)

## งานที่ต้องรอก่อนหน้า

- TASK-020 — renderer/HUD ต่อสู้ (BattleRenderer, pack)
- TASK-022 — save controller/receipt/reconnect
- TASK-023, TASK-024 — roster/Status/สกิล/คิว
- TASK-025 — Story/farm/battle commands
- TASK-026, TASK-027, TASK-028 — อุปกรณ์ ช่อง การ์ด rarity/Tier
- สิ่งที่ต้องได้จากงานนั้น: คำสั่งและ preview functions เดิมทั้งหมด งานนี้ไม่เพิ่มหรือแก้กติกาเกม

## เป้าหมายและผลส่งมอบ

ผู้เล่นเปิด `/play` แล้วได้หน้าตาเกมมือถือตาม D-051: HUD ทรัพยากรเล็ก, ฉากทีมเดินตีมอนตามด่าน, ปุ่มท้าบอสขวาล่าง, หีบ AFK, เมนูล่าง 5 ช่อง (2 ช่องล็อก), หน้า Buddy/Stats/Skill/Backpack/Team ตามแบบที่ผู้ใช้วาด และเว็บเล่นส่วนตัวที่มีเซฟอยู่แล้วได้ UI ใหม่โดยเซฟไม่หาย

ไฟล์หลัก: `src/ui/game/*`, `src/client/farm-scene.ts`, `src/renderer/shell.ts`, `src/renderer/shell-visuals.json`, ส่วนเลื่อนฉาก/zoom ใน `src/renderer/battle.ts`, `scripts/build_runtime_assets.py`, `scripts/play_local.py`, `scripts/test_game_shell_live.cjs`, `tests/game/farm-scene.test.ts`

## ขอบเขต

- รวมในงาน: layout/navigation/sheets/theme ของ `/play`, ฉากฟาร์มแบบ presentation, ไอคอนเมนู/ทรัพยากร/มอนใน runtime pack, onboarding สร้างตัวละครใน shell, refresh แบบ compatible สำหรับเว็บเล่นส่วนตัว
- อยู่นอกงาน: กติกา/ตัวเลข/คำสั่งใหม่, Store/Crafting จริง, Tower/daily/gacha/AFK UX เต็ม (TASK-035–038), tutorial/เสียงรวม (TASK-039), performance budget (TASK-042), migration เซฟข้าม content (TASK-040)

## รายละเอียด

ฉากหน้าหลักเป็น presentation: `FarmWaveSession` สร้าง BattleInput จาก team/build ในเซฟกับแถว `enemy_add_*` ของด่านฟาร์ม (หรือบอส×0.25 HP/×0.6 ATK เมื่อไม่มีลูกน้อง) แล้วรัน `createBattle/advanceUntil` เดิม ผลไม่ถูกส่งหรือบันทึก รางวัลฟาร์มยังมาจาก `farm.claim` ตามเวลา ไอคอน/skin มอนเป็นข้อมูล renderer ที่อยู่นอก content_hash ทุกปุ่มที่เปลี่ยนเซฟส่ง command เดิมและรอ receipt เหมือน UI เก่า

## ขั้นตอนทำงาน

1. เพิ่ม shell visuals เข้า pack builder แล้ว rebuild pack โดย content_hash ต้องคงเดิม
2. ทำ farm wave session + test และเพิ่มการเลื่อนฉาก/zoom แบบ presentation ใน renderer
3. ทำ shell, HUD, bottom bar, field (ฟาร์ม/บอส/ผลลัพธ์/แผนที่/หีบ AFK), Buddy, Upgrade/Change sheets, Stats, Skill, Backpack, Team, onboarding
4. ตรวจ typecheck/boundaries/unit tests/build และเดิน flow จริงบน loopback stack แยกพร้อมภาพหน้าจอ
5. เพิ่ม `--refresh-compatible-snapshot` แล้วอัปเดตเว็บส่วนตัวพร้อมสำรองฐานข้อมูล

## เกณฑ์ตรวจรับ

- [x] AC-01: HUD สูงไม่เกิน 80px ที่ 390×844 และหน้าหลักมีปุ่มท้าบอสขวาล่างเหนือ bottom bar ที่มี 5 ช่อง (Store/Crafting ล็อก กดแล้วแจ้งเตือน ไม่เปิดหน้า)
- [x] AC-02: ฉากหน้าหลักวน ตี→เดิน ด้วย shared engine และ skin ตามบท โดยไม่ส่ง command และไม่แก้ account state
- [x] AC-03: ท้าบอส→ไฟต์จริง→การ์ดผลลัพธ์รับรางวัลครั้งเดียว→กลับฟาร์ม; หีบ AFK รับฟาร์มกับ claim ที่เกิดใน chain เดียว
- [x] AC-04: หน้า Buddy มีช่อง 3 ซ้าย/3 ขวา, Stats/Skill/Upgrade และแถบตัวละคร 7 ตัว; แตะช่องมี Upgrade (ราคาใช้/มี + ค่าก่อน→หลัง) และ Change (เรียง Level แล้ว Rarity)
- [x] AC-05: หน้า Stats/Skill/Backpack/Team ตามแบบผู้ใช้ทำคำสั่งจริงได้ (ลงแต้ม, อัปเลเวล, [E] ในกระเป๋า, จัดทีม) และไม่มี browser error
- [x] AC-06: 360×740 และ 1280×800 ไม่มี horizontal overflow; deep link `?v=buddy` เปิดหน้าตัวละคร
- [x] AC-07: เว็บเล่นส่วนตัวที่มีเซฟได้ UI ใหม่โดย content_hash/migration/server code เท่าเดิม สำรองฐานข้อมูลก่อน และ revision ไม่เปลี่ยนจากการเปิดดู
- [x] AC-09: (D-052) มือถือแนวนอนแสดงข้อความให้หมุนเครื่องและหยุดวาดฉาก; มือถือแนวตั้งและ desktop ไม่เห็นข้อความนี้
- [x] AC-10: (D-053, รอบผู้ใช้ทดลอง) ไอคอนอาชีพแสดงข้างชื่อตัวละคร; หน้าจัดทีมเป็นตาราง 2×2 ตรงแนว; หน้าสถิติในไฟต์มีสไตล์; ปุ่มถอยทัพไม่กระพริบระหว่าง boss clock commit
- [x] AC-11: (D-054) "รับทั้งหมด" ทำให้ pending_rewards ว่างแม้มี claim จากการชนะบอส/รางวัล Story ค้าง; WARNING ขึ้นก่อนไฟต์บอส; slider เพลง/เอฟเฟกต์ปรับได้และจำค่า
- [x] AC-12: (D-055) หมวก/ผ้าคลุมที่สวมโผล่บนตัวละครทั้งในฉากต่อสู้และหน้า UI ตาม Tier; content_hash เท่าเดิม และ pack ยังไม่เกินงบ
- [x] AC-13: (D-056) หน้า Status ที่ 390×844 ไม่ต้องเลื่อน; Timeline คิวร่างในหน้าสกิลแสดงทั้งทีม; เมนูดันเจี้ยนเปิด hub 2 โหมด; การ์ดผลลัพธ์เปิดสถิติได้; ปุ่มล่าง 6 ช่อง
- [ ] AC-08: ผู้ใช้ยอมรับหน้าตาและ flow (review ด้วยตาโดยผู้ใช้)

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py` (HOME_FARM, VIEWPORTS) | [shell-live](../evidence/task-048-shell-live.json), ภาพ `docs/screenshots/task-048-home-*.png` | ผ่าน |
| AC-02 | `node --import tsx --test tests/game/farm-scene.test.ts` + live HOME_FARM รอ `data-farm-phase=walk` | 4/4 tests; ภาพ home-fight/home-walk | ผ่าน |
| AC-03 | live BOSS_1_1, AFK_STAGE ตรวจ `game_saves` หลังรับ | first clear 1-1 รับครั้งเดียว, ไม่มี farm claim ค้าง | ผ่าน |
| AC-04 | live BUDDY: นับ gear tiles/roster cards, เปิด slot/upgrade/change/character sheets, อัปเลเวล | ภาพ buddy/slot-*/character-upgrade | ผ่าน (Refine ไม่ได้กดเพราะบัญชีใหม่ไม่มีแร่ ปุ่มแสดงราคาแดงถูกต้อง) |
| AC-05 | live STATS/SKILLS/BACKPACK_TEAM | INT +1 บันทึกจริง, [E] badge, formation 4, browser_errors 0 | ผ่าน |
| AC-06 | live VIEWPORTS | ไม่มี overflow, ภาพ home-360/home-1280/buddy-360 | ผ่าน |
| AC-07 | `play_local.py --refresh-compatible-snapshot` + read-only Chrome smoke ที่ 6173 | ready.json `compatible_refresh:true`, hash `65b82feb…`, backup `.local/play/backups/before-compatible-snapshot-refresh-*.sql`, revision 79 คงเดิม, commands 0, errors 0 | ผ่าน |
| AC-09 | live VIEWPORTS: context มือถือ 844×390 (isMobile/hasTouch) เทียบ 390×844 และ desktop 1280×800 | `.rotate-lock` แสดง/เกมซ่อนเฉพาะมือถือแนวนอน; ภาพ `docs/screenshots/task-048-rotate-844x390.png` | ผ่าน |
| AC-10 | live BOSS_1_1: สุ่มดูปุ่มถอยทัพ 12 ครั้งก่อนจบไฟต์, ตรวจ computed style ของ statistics; VIEWPORTS: `?v=team` ที่ 1280 นับ class icon 4 | ภาพ boss-statistics-390, team-1280, buddy-390; หายไป 0/12 | ผ่าน |
| AC-11 | live: ชนะ 1-2 แล้วกด "กลับไปฟาร์ม" โดยไม่รับ → เปิดหีบ → รับทั้งหมด → ตรวจ `pending_rewards` ใน DB; รอ `.boss-intro` หลังกดท้าบอส; เลื่อน slider เอฟเฟกต์เป็น 35% แล้วตรวจ localStorage | pending 0, gold เพิ่ม; ภาพ boss-intro/afk-sheet/settings-volume | ผ่าน |
| AC-12 | `npm run assets:build/check` (479 assets/845 files/24.1MB ≤ 25MiB), live walkthrough + ภาพ home/buddy | ตัวละครใส่ Hat + กระเป๋านักผจญภัยจากของเริ่มต้น Lv1 | ผ่าน |
| AC-13 | live STATS (`scrollHeight ≤ clientHeight`), SKILLS (timeline rows ≥4), BACKPACK_TEAM (dungeon hub), BOSS (สถิติจากการ์ดผลลัพธ์) | ผ่าน 13/13 checks, browser errors 0; ภาพ stats/skills-timeline/dungeon | ผ่าน |
| AC-08 | ผู้ใช้เปิด http://127.0.0.1:6173/play | รอผู้ใช้ | ยังไม่ตรวจ |

ผู้ตรวจ: Claude self-check (AC-01–07) · วันที่: 20 ต.ค. 2026 · รอบ review: 1 · รายละเอียดคำสั่ง/hash: [review](../evidence/task-048-review.json)

## Blocker / คำถาม

รอผู้ใช้ดูหน้าตาจริง (AC-08) ทางเลือกที่ผู้ช่วยตัดสินใจเองอยู่ในตาราง design30 และเปลี่ยนได้

## บันทึกการทำงานและ review

- รอบแรกของ live walkthrough พบ sprite ในการ์ดเลือกอาชีพ/จัดทีมถูกครอปหัว และ EXP glyph ถูกตัดในการ์ดผลลัพธ์ แก้ footY/scale และ CSS แล้วรันใหม่ผ่าน
- ผู้ใช้กำหนดแนวตั้งเท่านั้น (D-052) เพิ่มข้อความให้หมุนเครื่องเมื่อถือมือถือแนวนอน และตัดการตรวจแนวนอนออกจาก design09/10 และ TASK-039/042
- ผู้ใช้ทดลองแล้วแจ้ง 3 จุด: หน้าจัดทีมเพี้ยน (คอลัมน์เหลื่อม/ป้ายแนวตั้ง) → ทำเป็นตาราง 2×2; หน้าสถิติไม่มีสไตล์ (CSS เดิมมาจาก story-page ที่ลบไป) → ย้ายสไตล์ statistics/timeline เข้า game.css; ปุ่มถอยทัพกระพริบ (save status เป็น 'loading' ทุก commit ของ boss clock) → นับ loading เป็น online และให้ถอยทัพรอ writer ว่างด้วย `submitWhenReady` พร้อมเพิ่มไอคอนอาชีพตามคำขอ
- รอบทดลองที่ 2 ของผู้ใช้: หน้ารางวัลฟาร์มยาวและรับแล้วรายการค้างไม่หาย (claim จากการชนะบอส/เปลี่ยนด่านฟาร์ม) → ปุ่มรับทั้งหมด; ขอ WARNING ก่อนบอส; เสียงดัง → slider ระดับเสียง
- รอบทดลองที่ 3: ไอคอนทีมหน้าหลัก, สีสายอาชีพ, หน้า Status ไม่ต้องเลื่อน, ฟาร์มตามด่านล่าสุด, เมนูดันเจี้ยน, เอฟเฟกต์ Refine, บอสหน้าตาหลากหลาย, Timeline ในหน้าสกิล (D-056) ส่วนกติกาด่านย่อย/Refine โอกาส/Status แยกเป็นงานใหม่ตาม D-057
- สคริปต์ live เก่าของ TASK-022–028 อ้าง selector ของ UI เก่า จึงเป็นหลักฐานประวัติ; `/play` ปัจจุบันตรวจด้วย `test_game_shell_live.cjs`
- 20 ต.ค. 2026 รอบแก้ที่ 4 (ผู้ใช้ทดลองแล้วขอเพิ่ม): (1) D-060 Timeline แสดง ⚡ บนสกิลที่ขัดร่ายศัตรูสำเร็จ และ ✕ + ไอคอนจาง + แถบลายทางบนสกิลที่ถูกขัด โดยอ่านผู้ขัดจาก `cast_interrupt.action_id` ของ engine (เทสต์ `D-060` ใน `tests/game/timeline.test.ts`); (2) D-059 บัญชีใหม่ไม่มีของสวมใส่ (ช่องว่าง ซื้ออาวุธฝึกหัด 125 ทองแล้วสวมได้); (3) หน้าตัวละคร การ์ดเพื่อน 7 ใบเปลี่ยนจากแถบเลื่อนข้างที่ถูกตัดขอบเป็นกริด 4+3 ในกรอบจอ — live test แยก (`RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell`) ผ่านทุกข้อ browser errors 0 รวมเช็กใหม่ `ROSTER_CARD_OVERFLOW`, `D059_STARTER_GEAR_PRESENT`, `TRAINING_WEAPON_EQUIP` ([ผล](../evidence/task-048-shell-live.json)) ยังรอผู้ใช้ตรวจหน้าตา (AC-08)
