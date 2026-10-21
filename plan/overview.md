# ภาพรวมแผนและความคืบหน้า

อัปเดต: 21 ตุลาคม 2026 · ระยะปัจจุบัน: **46/57 งานผ่าน done; TASK-041 บาลานซ์อยู่ inprogress; TASK-048/054/055/056/057 อยู่ review รอผู้ใช้ตรวจภาพ; อัปเดต UI D-077–080 และทรงผม D-079 บน 6173/LAN แล้ว สำรองและตรวจเซฟเดิมครบ**

เกมเว็บเล่นคนเดียวอ้างอิง Ragnarok Idle Adventure Plus จัดทีม main + NPC 3 คน คิว Active ตัวละสี่ช่อง ทำงานพร้อมกัน ฟาร์มทรัพยากรแล้วกดท้าบอส ใช้ Supabase เซฟหลักด้วยอีเมล/รหัสผ่าน ออนไลน์เป็นหลักพร้อมเซฟสำรองในเครื่อง และ deploy เว็บบน Vercel

Source ทั้งโปรเจกต์เผยแพร่ที่ [ctemchai-cmd/ro-idle-pve](https://github.com/ctemchai-cmd/ro-idle-pve) สาขา `main` แล้ว รวมคลัง assets และ selected runtime artifact โดยกันเซฟ/credentials ออก เตรียม `vercel.json` และ [คู่มือ deploy](../docs/DEPLOYMENT.md) แล้ว แต่ยังไม่มี hosted Supabase/Vercel verification; TASK-043/045/046 คงสถานะเดิม

รุ่นแรกมี Class 1/2 และสูงสุด Lv.70 รอ Hi-class/Awaken/Artifact ใน milestone ถัดไป ส่วน Class 3 ที่ Lv.120 / Pet / Rune เป็นอนาคต Breakthrough ทุก 20 แยกจากการเปลี่ยนคลาส ไม่มีรอบพิเศษที่ 70

Q-001–Q-022 ตอบแล้ว: บัฟบวกกันไม่มีเพดานและคนเดิมร่ายซ้ำเพิ่มชั้นแยกอายุ, Chain CC ปกติ, Stun ปล่อยคิวเดินถึง Action, Active เดิมหนึ่งช่อง และ resources เลือกกดอัปตัวละคร ใช้ P-01–P-09 เป็นฐานตามคำแก้ของผู้ใช้ เพิ่มข้อกำหนด simulation แบบเร็วเพื่อวัดอาชีพ/สกิลด้วย engine เดียวกับเกม ดู [ข้อสรุป](decisions.md), [ประเด็นก่อนแตกงาน](pre-task-review.md) และ [simulation](design/08-simulation-and-balance.md)

ผลตรวจความชัดเจน/ความครอบคลุมและจุดที่ปรับ: [task audit](task-audit.md) เกณฑ์ตัวเลขและเคสอ้างอิงเป็นผลส่งมอบ M0 ที่ต้องทำก่อนเริ่ม implementation

ผลตรวจสถาปัตยกรรม: [architecture audit](architecture-audit.md) ปิดสัญญา A-01–A-08 ระดับ design ใน TASK-013/014 แล้ว แต่ผล runtime/DB/browser ยังต้องพิสูจน์ตามงานเจ้าของ ไม่รับประกันว่าจะไม่มี technical debt

แบบฉบับอ้างอิงล่าสุดอยู่ [design index](design/README.md) และ [data index](data/README.md) ครบ progression/combat/composition/126skills/60gear/18cards/80Story stages/เศรษฐกิจ/UX/cloud contracts ตัวเลขเป็น baseline ที่ต้องวัดและปรับกับ runtime

การต่อยอดใช้ typed effects/targets/outcomes, patchesด้วยstable IDs, immutable definition/build/instance และmodule/account contractsใน [baseline16](design/16-composition-baseline.md), [classes](design/17-class-content-contracts.md), [architecture](design/11-technical-architecture.md) และ16schemas ไม่มีสูตรเกมซ้ำในUIหรือSQL; ตำแหน่งจริง/normalระยะใกล้/สกิลทุกระยะและUIมือถือแนวตั้งแก้ตาม [design21](design/21-spatial-combat-and-mobile.md)

ผลตรวจ M0: 14งานต้นทางรวม749checksผ่าน และ [TASK-014 gate](evidence/task-014-review.json) ผ่าน8checks; [acceptance matrix](acceptance-matrix.md) ผูก201ACกับinput/expected/method โดย67ACผ่านระดับdesignและ75ACของimplementationยังไม่รัน; TASK-015–028ผ่าน59ACจริง หลักฐานM0แยกจากruntime/DB/browser evidenceในแต่ละงาน

## กระดานงาน

| สถานะ | จำนวนไฟล์ tasks_*.md | งานปัจจุบัน |
| --- | ---: | --- |
| todo | 5 | ออกแบบ/พัฒนา/ตรวจรับตามรายการด้านล่าง |
| inprogress | 1 | TASK-041 บาลานซ์/level design |
| review | 5 | [TASK-048](review/tasks_048.md) game shell /play รอผู้ใช้ตรวจหน้าตา (AC-08), [TASK-054](review/tasks_054.md) ภาพการต่อสู้ตรง RO รอผู้ใช้ตรวจ (AC-06), [TASK-055](review/tasks_055.md) คำขอระหว่างลองเล่น รอผู้ใช้ (AC-06), [TASK-056](review/tasks_056.md) UI D-076–078/080 อัปเดตแล้วรอผู้ใช้ตรวจภาพ (AC-06), [TASK-057](review/tasks_057.md) ทรงผม D-079 อัปเดตแล้วรอผู้ใช้ตรวจ (AC-05) |
| done | 46 | ผ่าน review ตามหลักฐานในแต่ละงาน |

Progress ของกระดาน: **46/57 งานผ่าน done** ไม่รวมงานเตรียม assets ที่ทำก่อนเริ่มใช้กระดาน ตำแหน่งไฟล์เป็นสถานะจริง ID คงเดิม เมื่อย้ายไฟล์ให้อัปเดตจำนวนและลิงก์ในเอกสารนี้

TASK-001–014 และ TASK-047 อยู่doneครบM0 TASK-015–028ผ่านแล้ว รอบภาพล่าสุด [TASK-020รอบ11](evidence/task-020-focus-impact-review.json) ผ่าน184TStests+4native/build/Chrome: focusนุ่มไร้กรอบและdamage numbersตรงnative ACTcontact/ลูกธนู-ลูกเวทย์กระทบ ภาพไม่เปลี่ยนผลcombat Runtimepack252IDs/505files/35audioรวม22.5MB

หลักฐานภาพก่อนหน้าเก็บตามinputhash: [รอบ6มือถือ/เดิน](evidence/task-020-mobile-spatial-review.json), [รอบ8เสียง/สถิติ](evidence/task-020-audio-statistics-review.json), [รอบ9icons](evidence/task-020-icon-dock-review.json), [รอบ10Timeline/เสียงร่าย](evidence/task-020-timeline-cast-review.json) ไม่อ้างว่าทุกรอบรันใหม่พร้อมกัน

[TASK-022](done/tasks_022.md) ผ่าน5AC/195tests/build และreal local Auth/PostgREST/SQL/SMTP/Chrome: atomicCAS/immutable receipts/signed checkpoint/backup/locks/offline/lost response รวมshared farm reservation12hและDB-time battle checkpoints ดู [review](evidence/task-022-review.json) และ [protocol23](design/23-save-runtime-protocol.md) ไม่มีhosted projectหรือVerceldeploy บางเคสใช้server-owned fixtures; Storyผ่านTASK-025แล้ว; Tower/daily/fullAFK UXยังตามTASK-035/036/038

[TASK-023](done/tasks_023.md) ผ่าน4AC/201tests/build/real local roster flow มีหน้า `/roster` จัดทีม/อัปเพื่อนนอกทีม/manualStatus/Breakthrough/เปลี่ยนคลาส/refund ตาม [review](evidence/task-023-review.json) และ [runtime24](design/24-character-progression.md) [TASK-024](done/tasks_024.md) ผ่าน208tests+7targeted/real local skills ตาม [review](evidence/task-024-review.json) [TASK-025](done/tasks_025.md) ผ่าน213tests+4native/build/real SQL+Chrome: Story/farm/ทีมเซฟ/ผลชนะ-แพ้/90s/reload-retreat ตาม [review](evidence/task-025-review.json) มี [เว็บส่วนตัวพร้อมเซฟถาวร](../docs/LOCAL-PLAY.md) [TASK-026](done/tasks_026.md) ผ่าน220tests/build/real SQL+Chromeครบinventory/equip/lock/salvage/training purchase ตาม [review](evidence/task-026-review.json) [TASK-027](done/tasks_027.md) ผ่าน227tests/build/real full10flow:Refine/Enchant/cards/ledgerตาม [review](evidence/task-027-review.json) [TASK-028](done/tasks_028.md) ผ่าน233tests/build/real full11flow:rarity/tier/response-loss/fullbag ตาม [review](evidence/task-028-review.json) ต่อสกิลเฉพาะทุกสายTASK-029–034

[TASK-048](review/tasks_048.md) (แทรกตามคำขอผู้ใช้ D-051): `/play` เป็น game shell แบบมือถือตาม [design30](design/30-game-shell-ui.md) — HUD เล็ก, ทีมเดินตีมอนตามบทด้วย shared engine (presentation ไม่ให้รางวัล), ปุ่มท้าบอสขวาล่าง, หีบ AFK, เมนู กระเป๋า/ทีม/ตัวละคร/ร้านค้า🔒/คราฟต์🔒, หน้า Buddy/Stats/Skill/Backpack/Team ใหม่ ผ่าน237tests/build/boundaries และ live walkthrough บน loopback stack ([หลักฐาน](evidence/task-048-review.json)) content_hash เท่าเดิม Runtime pack 319IDs/638files/23.1MB เว็บส่วนตัวอัปเดตด้วย `--refresh-compatible-snapshot` โดยเซฟ #79 คงเดิม รอผู้ใช้ตรวจหน้าตา

[TASK-049](done/tasks_049.md) (D-057 ผู้ใช้ตอบคำถาม): Story บท 1–3 = 10 ด่าน บท 4–8 = 20 ด่าน (130), Refine ทีละขั้นมีโอกาสพลาด+pity (พลาดเสียแค่วัตถุดิบ), Status ได้ 3+floor(เลเวล/5) แต้มต่อเลเวลและโบนัสทุก 10 แต้มที่ไม่กระทบจังหวะสกิล; M0 checks/manifest/readiness รันใหม่ผ่าน, content_hash ใหม่ `01876ded…`, 242 tests + live 13/13 ([หลักฐาน](evidence/task-049-review.json)); เซฟส่วนตัว #461 สำรองแล้วเริ่มใหม่

[TASK-050](done/tasks_050.md) (D-058): ย้ายเซฟข้าม content ได้แล้ว — `play_local.py --refresh-migrate-saves` สำรอง ซ้อมย้ายด้วยโค้ดใหม่ แล้วเขียน revision ที่ลงลายเซ็น ทดสอบด้วยเซฟกติกาเก่าจริง (#461→#462→#467) ([หลักฐาน](evidence/task-050-review.json))

[TASK-029](done/tasks_029.md): สกิลสาย Swordsman/Knight/Crusader ทั้ง 19 ท่าทำงานจริงทุกเลเวลบน engine เดียวกับ runner/runtime; บิลด์ตัวอย่างทั้ง 4 ตรง dry trace และแสดงบทบาทต่างกัน; server/client/runner ตรงกันทุก event ([หลักฐาน](evidence/task-029-review.json)) — harness ร่วม `tests/game/class-skills.ts` ใช้ต่อกับ TASK-030–034

[TASK-030](done/tasks_030.md): สกิลสาย Acolyte/Priest/Monk ทั้ง 19 ท่าทำงานจริงทุกเลเวล รวมฮีลตอนเลือดเต็ม (overheal), ลูกแก้ว ≤5, Asura ถูกขัดไม่คืน SP และ Steel Body; event ทุกชนิดอ้าง cast ต้นทางได้ ([หลักฐาน](evidence/task-030-review.json))

[TASK-031](done/tasks_031.md): สกิลสาย Archer/Hunter/Bard/Dancer ทั้ง 26 ท่าทำงานจริงทุกเลเวล; Bard/Dancer เป็นเพื่อน Archer คนเดิมที่ค่าเกมเท่ากัน, Falcon ติดเฉพาะตีปกติ, เพลงซ้อนเป็น stack แยก ([หลักฐาน](evidence/task-031-review.json))

[TASK-032](done/tasks_032.md): สกิลสาย Mage/Wizard/Sage ทั้ง 19 ท่าทำงานจริงทุกเลเวล; Sage ไม่ตีระหว่างร่าย, Auto-bolt ติดเฉพาะตีปกติไม่วน, Storm Gust tick 1–4 วินาทีและ Freeze แยกเป้า ([หลักฐาน](evidence/task-032-review.json))

[TASK-034](done/tasks_034.md): สกิลสาย Merchant/Blacksmith/Alchemist ทั้ง 19 ท่าทำงานจริง พร้อมระบบ summon ใน engine (ต้นไม้มีเจ้าของ/จำนวน/อายุ/tick และหายเมื่อเจ้าของตาย) ([หลักฐาน](evidence/task-034-review.json))

[TASK-033](done/tasks_033.md): สกิลสาย Thief/Assassin/Rogue ทั้ง 24 ท่าทำงานจริงทุกเลเวล; copy ของ Rogue เท่าต้นฉบับใส่ได้ท่าเดียว, Detonate ใช้เฉพาะพิษของตัวเอง ([หลักฐาน](evidence/task-033-review.json)) — สกิลครบทั้ง 6 สายแล้ว

[TASK-038](done/tasks_038.md): AFK 12 ชม. พิสูจน์ครบ (เพดาน, ไม่จ่ายซ้ำ, ข้ามวัน, สูตรเดียวกับเซิร์ฟเวอร์, snapshot อัตรา) ([หลักฐาน](evidence/task-038-review.json))

[TASK-035](done/tasks_035.md): Infinity Tower จากตัวสร้างชั้นเดียว first clear ครั้งเดียว ไม่รีเซ็ตข้ามวัน ชั้นสูงปลอดภัย + live browser ([หลักฐาน](evidence/task-035-review.json))

[TASK-036](done/tasks_036.md): ดันเจี้ยนรายวัน 3 บอส×3 ครั้ง HP ต่อเนื่อง กล่องต่อหลอด ตัดวัน Bangkok ฝั่ง server + live browser ([หลักฐาน](evidence/task-036-review.json))

[TASK-037](done/tasks_037.md): กาชาการ์ด seed ฝั่งเซิร์ฟเวอร์ pity 10/30 ไม่สุ่มซ้ำเมื่อ retry + live browser ([หลักฐาน](evidence/task-037-review.json))

[TASK-051](done/tasks_051.md): ร้านค้า + กาชาอุปกรณ์ (D-063) ลิมิตรายวัน pity ของกาชาเข้าระบบอุปกรณ์เดิม + live browser ([หลักฐาน](evidence/task-051-review.json))

[TASK-052](done/tasks_052.md): Option สุ่มตาม rarity (D-062) ทุกทางสร้างของ เข้า pipeline เดียว tier คงค่า migration ผ่าน + live ([หลักฐาน](evidence/task-052-review.json))

[TASK-053](done/tasks_053.md): ไอเทม 36 ชนิดต่อ tier, การ์ด 60 ใบตาม tier, Option 1/2/3/4/5 (D-068) ผ่านเทสต์ + live ([หลักฐาน](evidence/task-053-review.json))

[TASK-039](done/tasks_039.md): flow เล่นครบจาก UI สรุปการต่อสู้รายคน ไกด์ผู้เล่นใหม่ ขาดเน็ตไม่ใช้ทรัพยากร โฟกัส/Hi-class + live 23 checks ([หลักฐาน](evidence/task-039-review.json))

[TASK-040](done/tasks_040.md): สำรอง/ส่งออก/ตรวจไฟล์/ย้ายรุ่น/กู้เซฟเสีย/เริ่มใหม่+ย้อนครั้งเดียว ไม่ย้อน AFK/สิทธิ์รายวัน (D-064) + PostgreSQL + live ([หลักฐาน](evidence/task-040-review.json))

## ลำดับงานและจุดตรวจ

| Milestone | ผลที่ต้องได้ | จำนวนงาน | done |
| --- | --- | ---: | ---: |
| M0 | ออกแบบข้อมูลและตรวจสเปกรวม | 15 | 15 |
| M1 | แกนต่อสู้และ headless simulation | 4 | 4 |
| M2 | วงจรเกม ภาพ และ cloud save | 7 | 7 |
| M3 | อุปกรณ์และสกิลครบทุกสาย + game shell (TASK-048) + กติกา D-057 (TASK-049) + ย้ายเซฟ (TASK-050) + ร้านค้า/กาชาอุปกรณ์ (TASK-051) + Option สุ่ม (TASK-052) + ไอเทม/การ์ดหลากหลาย (TASK-053) + ภาพการต่อสู้ตรง RO (TASK-054) + คำขอระหว่างลองเล่น (TASK-055) | 19 | 14 |
| M4 | โหมด บาลานซ์ ตรวจรับ และ deploy | 12 | 6 |

TASK-001–013 และ TASK-047 ออกแบบข้อมูล/สูตร/โมดูลสถานะ/สกิลครบหกสาย/อุปกรณ์/เศรษฐกิจ/ด่าน/UX/สถาปัตยกรรม (ลำดับแกนคือ TASK-001 → 002 → 047 → ข้อมูลสกิล/ไอเทม) จากนั้น TASK-014 ตรวจรวมทั้งหมดก่อนเริ่มเขียนเกมตามความต้องการออกแบบก่อน coding งานพัฒนา TASK-015–046 มี gate นี้ใน dependency

หลังผ่าน gate งานย่อยรอเฉพาะผลส่งมอบที่ต้องใช้จริง Preview deploy ทำได้เมื่อวงจรหลักพร้อม ส่วนการปล่อย production อยู่หลังตรวจรับรุ่นครบ ข้อมูล M0 ใช้การอ่าน/คำนวณเป็นหลักฐานก่อนมี runner แล้วจึงวัดและปรับจริงใน M1/M4

Hi-class/Awaken/Artifact เป็น M5 ถัดจากรุ่นแรก ยังไม่สร้าง task implementation ของแพตช์นั้นก่อนออกแบบสกิล/เนื้อหาให้ชัด ส่วน progression simulation เตรียม pure rules/virtual clock ไว้ ระบบ autoplay หลายวัน/ค้นบิลด์/dashboard เป็นส่วนต่อยอด

## แผนตามระบบ

| ส่วน | สิ่งที่ตกลง/เตรียมแล้ว | งานที่ต้องทำ | เอกสาร |
| --- | --- | --- | --- |
| Assets | คลังและ metadata พร้อมเป็นฐานต้นแบบ | pack252IDsผ่านdependency/HTTP byte checks; ตรวจ decode/ภาพจริงในTASK-020 | [รายงาน](../assets/ro/prepared/README.md) |
| ทีมและวงจรเล่น | main+NPC3, roster6, ไม่ซ้ำ Class1 ระหว่าง NPC, หน้า2/หลัง2 | ผ่านTASK-023/025; tutorial/flowครบTASK-039 | [รูปแบบเกม](design/01-game.md) |
| ต่อสู้ | สูตร/หน่วย/timer/event order และ traces ผ่าน M0 72 checks | ผ่านTASK-016–018; specialized effects/whole-game balanceยังM3/M4 | [combat baseline](design/15-combat-baseline.md) |
| โมดูลสถานะ/สกิล/ไอเทม | 16schemas/36stats/27statuses/10primitives/6formulas ตรวจแบบผ่าน | coreผ่านTASK-017; specialized actorfactoryตามTASK-034 | [composition baseline](design/16-composition-baseline.md) |
| อาชีพ | 126skills/26examplebuilds ครบ6สาย | implementationสกิล/ทดสอบกับengineทุกสาย | [class contracts](design/17-class-content-contracts.md) |
| อุปกรณ์และการ์ด | 60gear/18cards/6slots/rarity7/Refine+10 มีราคาครบ | ผ่านTASK-026–028; แหล่งสุ่มการ์ดTASK-037 | [equipment baseline](design/18-equipment-and-rewards-baseline.md) |
| โหมดและเศรษฐกิจ | rates/cost/drop/pity/AFK12h/daily policiesครบ | Story/farm/gearผ่าน; Tower/daily/gacha/AFK12h/paceยังM4 | [equipment/economy](design/18-equipment-and-rewards-baseline.md) |
| Level design | Story 130 ด่าน (10/10/10/20×5 ตาม D-057, generator `plan/generators/stages.py`)/100Tower rows+generator/3daily bosses | Story factory ผ่าน; whole-mode balance TASK-041 | [encounters](design/19-encounters-and-modes-baseline.md) |
| UX/cloud/deploy | wireframes/34commands/account-receipt-checkpoint schemas/reconnect/version policies | localAuth/API/RLS/pack/browserผ่าน; hostedPreview/productionTASK-043/045 | [architecture](design/11-technical-architecture.md) |
| Simulation | shared engine/headless/seed/virtual clock/metrics เป็นข้อกำหนด | runner/replay/batch A-B และรายงานเทียบหลายสถานการณ์ | [Simulation](design/08-simulation-and-balance.md) |

## รายการ task ทั้งหมด

ทุกไฟล์เริ่มใน todo อ้าง dependency ด้วย ID เพื่อให้ย้ายไฟล์ได้โดยไม่เปลี่ยนตัวงาน รายละเอียดขอบเขต ขั้นตอน และเกณฑ์ AC อยู่ในไฟล์แต่ละงาน

| Task | Milestone | ผลลัพธ์ | ต้องรอ |
| --- | --- | --- | --- |
| [TASK-001](done/tasks_001.md) | M0 | กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร | ไม่มี |
| [TASK-002](done/tasks_002.md) | M0 | ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation | TASK-001 |
| [TASK-047](done/tasks_047.md) | M0 | ออกแบบแค็ตตาล็อกสถานะและโมดูลร่วมของสกิล/ไอเทม | TASK-002 |
| [TASK-003](done/tasks_003.md) | M0 | เขียนข้อมูลสกิลครบสาย Swordsman → Knight / Crusader | TASK-001, TASK-002, TASK-047 |
| [TASK-004](done/tasks_004.md) | M0 | เขียนข้อมูลสกิลครบสาย Acolyte → Priest / Monk | TASK-001, TASK-002, TASK-047 |
| [TASK-005](done/tasks_005.md) | M0 | เขียนข้อมูลสกิลครบสาย Archer → Hunter / Bard / Dancer | TASK-001, TASK-002, TASK-047 |
| [TASK-006](done/tasks_006.md) | M0 | เขียนข้อมูลสกิลครบสาย Mage → Wizard / Sage | TASK-001, TASK-002, TASK-047 |
| [TASK-007](done/tasks_007.md) | M0 | เขียนข้อมูลสกิลครบสาย Thief → Assassin / Rogue | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-008, TASK-047 |
| [TASK-008](done/tasks_008.md) | M0 | เขียนข้อมูลสกิลครบสาย Merchant → Blacksmith / Alchemist | TASK-001, TASK-002, TASK-047 |
| [TASK-009](done/tasks_009.md) | M0 | ออกแบบอุปกรณ์ Refine Enchant และชุดการ์ด | TASK-001, TASK-002, TASK-047 |
| [TASK-010](done/tasks_010.md) | M0 | ออกแบบเศรษฐกิจ ดรอป กาชา และเป้าหมายเวลาสะสม | TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009 |
| [TASK-011](done/tasks_011.md) | M0 | ออกแบบด่าน บอส Tower และดันรายวันให้ครบรุ่นแรก | TASK-002, TASK-010 |
| [TASK-012](done/tasks_012.md) | M0 | ออกแบบหน้าจอและ flow ที่เล่นครบวงจร | TASK-009, TASK-011 |
| [TASK-013](done/tasks_013.md) | M0 | กำหนดสถาปัตยกรรม runtime, cloud save และ simulation | TASK-001, TASK-002, TASK-009, TASK-010, TASK-011, TASK-012, TASK-047 |
| [TASK-014](done/tasks_014.md) | M0 | ตรวจสเปกรวมก่อนเริ่มเขียนเกม | TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013, TASK-047 |
| [TASK-015](done/tasks_015.md) | M1 | สร้างโครงโปรเจกต์และโหลดข้อมูลเกมที่ตรวจ schema ได้ | TASK-014 |
| [TASK-016](done/tasks_016.md) | M1 | ทำไทม์ไลน์ต่อสู้ ตีปกติ และคิวสี่สกิล | TASK-015 |
| [TASK-017](done/tasks_017.md) | M1 | ทำเป้าหมาย สถานะ Passive และผลสกิลพื้นฐาน | TASK-016 |
| [TASK-018](done/tasks_018.md) | M1 | สร้าง headless runner และรายงาน simulation รุ่นแรก | TASK-017 |
| [TASK-019](done/tasks_019.md) | M2 | ทำ runtime asset pack จาก metadata และ dependency จริง | TASK-015 |
| [TASK-020](done/tasks_020.md) | M2 | เชื่อม renderer กับ combat engine และ HUD ต่อสู้ | TASK-018, TASK-019 |
| [TASK-021](done/tasks_021.md) | M2 | ตั้ง Supabase Auth ฐานข้อมูลเซฟและสิทธิ์เจ้าของ | TASK-015 |
| [TASK-022](done/tasks_022.md) | M2 | ทำ cloud save, checkpoint และ reconnect ที่ไม่จ่ายของซ้ำ | TASK-021 |
| [TASK-023](done/tasks_023.md) | M2 | ทำ roster ทีม Status เลเวลและการเปลี่ยนคลาส | TASK-016, TASK-022 |
| [TASK-024](done/tasks_024.md) | M2 | ทำการเรียน อัป และจัดคิวสกิลสี่ช่อง | TASK-017, TASK-023 |
| [TASK-025](done/tasks_025.md) | M2 | ทำ Story ฟาร์มและวงจรเล่นที่เซฟได้ | TASK-018, TASK-020, TASK-024 |
| [TASK-026](done/tasks_026.md) | M3 | ทำ inventory อุปกรณ์และค่าต่อสู้จากของสวม | TASK-017, TASK-023 |
| [TASK-027](done/tasks_027.md) | M3 | ทำ Refine Enchant และการ์ดประจำ slot | TASK-017, TASK-026 |
| [TASK-028](done/tasks_028.md) | M3 | ทำการผสม rarity และอัป tier ที่รักษาการลงทุน | TASK-027 |
| [TASK-048](review/tasks_048.md) | M3 | ปรับ /play เป็น game shell แบบมือถือตาม D-051 | TASK-020, TASK-022–028 |
| [TASK-049](done/tasks_049.md) | M3 | กติกา D-057: ด่านย่อย 10/20, Refine มีโอกาส+pity, Status แบบ RO+โบนัสทุก 10, เริ่มเซฟใหม่ | TASK-014, TASK-023, TASK-025, TASK-027, TASK-048 |
| [TASK-050](done/tasks_050.md) | M3 | เครื่องมือย้ายเซฟระหว่างพัฒนา (ส่วนหนึ่งของ TASK-040, D-058) | TASK-022, TASK-049 |
| [TASK-029](done/tasks_029.md) | M3 | ทำชุดสกิลจริงครบสาย Swordsman / Knight / Crusader | TASK-017, TASK-020, TASK-024, TASK-026 |
| [TASK-030](done/tasks_030.md) | M3 | ทำชุดสกิลจริงครบสาย Acolyte / Priest / Monk | TASK-017, TASK-020, TASK-024 |
| [TASK-031](done/tasks_031.md) | M3 | ทำชุดสกิลจริงครบสาย Archer / Hunter / Bard / Dancer | TASK-017, TASK-020, TASK-024 |
| [TASK-032](done/tasks_032.md) | M3 | ทำชุดสกิลจริงครบสาย Mage / Wizard / Sage | TASK-017, TASK-020, TASK-024 |
| [TASK-033](done/tasks_033.md) | M3 | ทำชุดสกิลจริงครบสาย Thief / Assassin / Rogue | TASK-017, TASK-020, TASK-024, TASK-029, TASK-030, TASK-031, TASK-032, TASK-034 |
| [TASK-034](done/tasks_034.md) | M3 | ทำชุดสกิลจริงครบสาย Merchant / Blacksmith / Alchemist | TASK-017, TASK-020, TASK-024, TASK-026 |
| [TASK-051](done/tasks_051.md) | M3 | ร้านค้า (Store) และกาชาอุปกรณ์ (D-063) | TASK-022, TASK-026, TASK-037, TASK-052 |
| [TASK-052](done/tasks_052.md) | M3 | Option สุ่มบนอุปกรณ์ตามระดับ (D-062) | TASK-026, TASK-028, TASK-050 |
| [TASK-053](done/tasks_053.md) | M3 | ไอเทมหลายแบบต่อ tier, การ์ด 60 ใบ, Option 1/2/3/4/5 (D-068) | TASK-026, TASK-027, TASK-052 |
| [TASK-054](review/tasks_054.md) | M3 | อาวุธ/ท่าโจมตี/ลูกธนู/เอฟเฟกต์สกิลจริง/ชื่อสกิล/ตัวเลขแบบ RO (D-070) | TASK-019, TASK-020, TASK-048 |
| [TASK-055](review/tasks_055.md) | M3 | ปุ่มรีเซ็ตเซฟ, กรองย่อยของ, ป้ายเลือดดัน, ปุ่มเร่ง 1×/2×/4×, ตัวละครใหญ่ขึ้น (D-071) | TASK-036, TASK-040, TASK-048 |
| [TASK-056](review/tasks_056.md) | M3 | UI กระชับ/ลบวงกลมทีมหน้าแรก/เปลี่ยนตัวใน Stats-Skill (D-076) | TASK-020, TASK-023, TASK-024, TASK-039 |
| [TASK-057](review/tasks_057.md) | M3 | ทรงผมแยก 19 อาชีพ/36 preset (D-079) | TASK-019, TASK-020 |
| [TASK-035](done/tasks_035.md) | M4 | ทำ Infinity Tower ที่ขยายชั้นจากข้อมูลได้ | TASK-025, TASK-026 |
| [TASK-036](done/tasks_036.md) | M4 | ทำดันรายวันบอสหลายหลอดและรีเซ็ตวัน | TASK-025, TASK-022 |
| [TASK-037](done/tasks_037.md) | M4 | ทำกาชาการ์ดพร้อมอัตรา pity และของซ้ำ | TASK-022, TASK-027 |
| [TASK-038](done/tasks_038.md) | M4 | ทำรางวัล AFK 12 ชั่วโมงด้วยสูตรที่จำลองแยกได้ | TASK-025, TASK-022 |
| [TASK-039](done/tasks_039.md) | M4 | ประกอบหน้าจอ เสียง tutorial และ flow เล่นครบ | TASK-020, TASK-024, TASK-025, TASK-027, TASK-028, TASK-035, TASK-036, TASK-037, TASK-038 |
| [TASK-040](done/tasks_040.md) | M4 | ทำสำรองเซฟ ย้าย schema และเครื่องมือกู้คืน | TASK-022, TASK-028, TASK-036, TASK-037, TASK-038 |
| [TASK-041](inprogress/tasks_041.md) | M4 | เติมเนื้อหาครบและปรับบาลานซ์ด้วย simulation | TASK-018, TASK-025, TASK-028, TASK-029, TASK-030, TASK-031, TASK-032, TASK-033, TASK-034, TASK-035, TASK-036, TASK-037, TASK-038 |
| [TASK-042](todo/tasks_042.md) | M4 | ตรวจขนาดโหลด ความลื่น และจอที่รองรับ | TASK-019, TASK-020, TASK-039, TASK-041 |
| [TASK-043](todo/tasks_043.md) | M4 | ตั้ง build/deploy และ Vercel Preview ที่แยกเซฟทดสอบ | TASK-019, TASK-021, TASK-025 |
| [TASK-044](todo/tasks_044.md) | M4 | ตรวจรับรุ่น Class 2 บน release candidate | TASK-040, TASK-041, TASK-042, TASK-043 |
| [TASK-045](todo/tasks_045.md) | M4 | deploy Production และตรวจบัญชี/เซฟจริง | TASK-044 |
| [TASK-046](todo/tasks_046.md) | M4 | ส่งมอบรุ่นแรกและจัดจุดต่อ Hi-class/งานอนาคต | TASK-045 |

## เกณฑ์ความพร้อม

- [x] บันทึกบรีฟและคำตอบ Q-001–Q-016 รวมข้อแก้ Hi-class70/Class3ที่120/รุ่นแรกcap70
- [x] กำหนด Supabase email-password, ออนไลน์หลัก/สำรองในเครื่อง และ Vercel
- [x] เพิ่ม shared engine/headless simulation และช่องทางต่อยอดจำลอง progression
- [x] แตก 47 task พร้อม dependency/ขอบเขต/ขั้นตอน/เกณฑ์ตรวจรับและช่องเก็บหลักฐาน
- [x] แยกงานออกแบบ M0 และ gate ก่อน implementation ไม่บังคับ simulator ก่อนงานสร้างมัน
- [x] ตรวจไฟล์จริง: 47 ID ไม่ซ้ำ, 201 เกณฑ์รวม (ผ่านแล้ว126ข้อ: M0 design67 + implementation59), dependency ไม่วน, งานพัฒนาทุกงานรอ TASK-014 และลิงก์ local ใน Markdown ที่ตรวจครบ 88 ไฟล์ไม่มีปลายทางหาย
- [x] อ่านขั้นตอน/AC ครบทุกงานและแก้ dependency ของ runner/renderer, ขอบเขต vertical slice และผู้ส่งมอบเกณฑ์ตัวเลขแล้ว
- [x] เพิ่ม TASK-047 หลังสมการ ก่อนสกิล/ไอเทม และแก้เกณฑ์ CC ให้ตรงคำตอบผู้ใช้
- [x] ปรับแบบการประกอบ/ส่วนขยายพร้อม JSON ตัวอย่าง และบันทึก Q-019–Q-021; TASK-026 รอ shared effects TASK-017 ก่อนรวม item traits
- [x] Q-017: บัฟจากหลายตัวบวกกันไม่มีเพดานตาม D-037; เก็บเวลา/source แยก
- [x] Q-022: คนเดิมร่ายบัฟเดิมซ้ำเพิ่ม instance แต่ละชั้นหมดเวลาเองตาม D-038; catalog รุ่นแรกผ่าน TASK-047; ทดสอบผลจริงใน engine ภายหลัง
- [x] M0 ทำจริงและทุกสูตร/ชุดสกิล/ตารางเนื้อหา/UX/cloud contracts ผ่าน review รวม TASK-014
- [x] A-01–A-08 ปิดระดับdesign; runtime evidenceยังรอTASK-015/018/020/022/038/040/044
- [ ] Runtime/โหมด/เซฟทำงานครบและ simulation วัดบาลานซ์ได้
- [ ] ตรวจรับ release candidate/deploy production และส่งมอบครบ
- [x] ผู้ใช้สั่งทำต่อเนื่อง; ผ่านgateแล้วเริ่มTASK-015 โดยไม่สร้างremote infrastructure

บันทึกส่งต่องานระหว่าง agent: [HANDOFF](HANDOFF.md) (ล่าสุด 20 ต.ค. 2026 · Claude Code ทำ TASK-048) · ดู [workflow](workflow.md), [แม่แบบ task](task-template.md) และ [แผนเดิมสำหรับอ้างอิง](../docs/PLAN.md)
