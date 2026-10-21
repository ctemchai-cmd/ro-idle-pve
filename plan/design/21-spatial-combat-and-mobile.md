# ตำแหน่งจริงและหน้าต่อสู้แนวตั้ง — 20 ตุลาคม 2026

คำยืนยัน D-043/D-044: ใช้ตำแหน่งและระยะจริงใน shared engine ตีปกติเลือกศัตรูใกล้สุดแล้วเดินเข้าระยะ ส่วนสกิลใช้ได้ทุกระยะ ไม่มีการรอระยะก่อนเริ่มร่าย UI เน้นมือถือแนวตั้ง ลดขนาดตัวละครและความรก ใช้เลขฮีลสีเขียว

เอกสารนี้แก้พฤติกรรมสนามที่เคยวาง actor ตาม formation ตายตัวใน TASK-020 หน้า/หลังยังเป็นตำแหน่งเริ่มต้นและข้อมูลทีม ไม่ใช่พิกัดที่ล็อกตลอดไฟต์ รายละเอียดตัวเลขด้านล่างเป็น baseline ต้นแบบที่ผู้ช่วยเลือก ยังไม่ใช่สูตรที่ยืนยันว่าตรงกับ Ragnarok Idle Adventure Plus

## สัญญา engine และ checkpoint

- `BattleInput.arena = {width, height, step_ms: 50}` เปิดการจำลองตำแหน่ง ทุก actor ต้องมี `spatial = {x, y, move_speed, radius, normal_range}` ระยะวัดจากศูนย์กลางเท้าสองตัว หน่วยเป็น world units ไม่ขึ้นกับขนาดจอ ความเร็วหน่วย world units/วินาที
- Checkpoint เก็บ arena และ spatial เพิ่ม `previous_x/previous_y/updated_at/moving/target_id` เพื่อให้โหลดกลางทางและวาดภาพต่อเนื่องได้ ทั้งหมดตรวจ closed JSON schema; runtime ตรวจขอบสนาม ค่าไม่ finite ช่วงความเร็ว ระยะ และตัวอ้างอิงก่อน restore
- Legacy benchmark/checkpoint ที่ไม่มี arena/spatial ยังใช้ abstract formation ตามเดิม ไม่แอบเพิ่มพิกัดให้เซฟเก่า การใช้ content/rules hash คนละรุ่นยังถูกปฏิเสธตามกติกา compatibility เดิม
- `motion_tick` หนึ่ง timer ต่อ actor ที่มีชีวิต ผูก life epoch เริ่มทุก 50ms ตั้งแต่สร้างหรือฟื้นคืนชีพ ไม่สร้าง tick จากจำนวนครั้งที่ UI เรียก `advanceUntil` actor ที่เกิด/ฟื้นนอกจังหวะไม่ทำให้ตัวอื่นเดินเพิ่ม
- ใน timestamp เดียวกัน: expiry/periodic → cast completion/trigger/death → movement → เริ่มสกิลที่พร้อม → normal attack → trigger/death/terminal เหมือน phases เดิมเพิ่ม movement ที่ phase4 สถานะที่เพิ่งเกิดมีผลก่อนเดิน
- `moveActors` อ่านตำแหน่ง snapshot ก่อนเดินทั้งกลุ่ม เปลี่ยนพิกัดพร้อมกันและมี separation สองรอบเรียง stable actor ID ค่าเก็บทศนิยม6ตำแหน่ง ไม่มี RNG และไม่เรียก DOM/wall clock
- ศัตรูใกล้สุดใช้ Euclidean distance; เสมอกันใช้ actor ID เป้าตาย/เลิก targetable เปลี่ยนเป้าได้ใน tick ถัดไป Provoke ที่ source ยังมีชีวิตและ life epoch ตรงบังคับเป้าได้ตามเดิม สกิลยังใช้ selectors ของตัวเอง เช่น lowest HP/all/front_first ไม่เปลี่ยนฮีลเป็นเลือกศัตรูใกล้สุด
- เดินเฉพาะ actor ที่เปิด normal attack หยุดระหว่างร่าย/ตาย/hard CC ส่วน silence ยังเดินได้และ SI/ACD ยังเดินต่อ ระหว่าง SI/ACD เดินเข้าประชิดได้ ไม่มี global CC immunity ใหม่
- เมื่อ normal พร้อมแต่ยังไม่ถึงระยะ ให้เก็บ readiness เดิมและเดินต่อ เมื่อถึงระยะโจมตีหนึ่งครั้งแล้วตั้ง interval ใหม่ ไม่สะสมดาเมจย้อนหลัง ระยะตรวจที่เหตุการณ์ตีจริง รวม world coordinates ใน event เพื่อพิสูจน์ระยะและตรึงต้นทาง projectile
- สกิลไม่ถูกจำกัดระยะและไม่เพิ่มเงื่อนไข AI รอจังหวะ SP/การใช้ช่องยังเกิดตอนเริ่มร่าย ไม่คืนเมื่อถูกขัด ไม่เปลี่ยนกฎ stun หรือสี่ช่องตามคิว

## การวาดภาพ

Renderer อ่านพิกัดจาก view และ interpolate ระหว่าง movement snapshots ด้วย presentation clock ไม่มีการคำนวณการเดิน/การเลือกเป้าอีกชุด รูปเดินวน ACT ทุกเฟรมพร้อมหัว/อาวุธตาม body clock หันซ้ายขวาจากเป้าปัจจุบันและพลิกทั้ง rig เลือก attack/hurt/dead ตาม events เหมือนเดิม

เดโมเริ่ม arena720×820 ผู้เล่น scale1.35 บอส1.9 มอนทั่วไป1.35 เทียบรอบก่อน2.6/3.6 ขนาดจริงในจอขึ้นกับ camera fit เลือกชื่อแสดงเฉพาะตัวโฟกัส ศัตรูแสดงชื่อ/HP ใน HUD ด้านบนเพื่อไม่ชนชื่อระหว่างประชิด Cast bars ยังอยู่เหนือ actor และ Timeline ดูคิวของทุกตัวได้

Projectile เก็บต้นทางที่ยิงไว้จาก event และติดตามปลายทางที่ขยับได้ ภาพเดิน/ลูกศร/เอฟเฟกต์ไม่ตัดสินผล damage เวลา impact ยังเป็น presentation delay ตามสัญญารอบ5 เลข heal เป็น native bitmap digits ชุดเดียวกับดาเมจ ย้อมเขียวและเพิ่ม pixel plus ไม่แสดง +0 จาก overheal มีวงแสงและอนุภาคฮีลที่ผู้รับ

## Mobile UI

หน้าหลักใช้กรอบแนวตั้งไม่เกิน480px สูงตาม `dvh` บน desktop แสดงกรอบเดียวกลางจอ:

1. Header ชื่อฉาก/เลขด่าน/เสียง
2. สนามและ HP ศัตรู เวลา ปุ่มหยุด/ความเร็ว
3. แถบสมาชิก4คนสำหรับเลือกตัวโฟกัส พร้อม HP/SP ย่อ
4. คิว4สกิลของตัวโฟกัส แตะดู SP/เวลาร่าย/ACD; กด “จัดคิว” แล้วแตะสองช่องเพื่อสลับและเริ่มไฟต์ใหม่
5. เมนูผจญภัย/ทีม/Timeline/ตั้งค่า เปิด native dialog พร้อมปิด/Escape/วน focus/คืน focus และเลื่อนภายใน ไม่วาง debug log/ตัวเลือกทั้งหมดบนหน้าหลัก

Timeline ยังคำนวณจากสำเนา engine และขยับทุก RAF มีปุ่มหยุดเวลาภายในแผง ไม่หยุดเวลาเพียงเพราะเปิดเมนู ตั้งค่ารวมฉาก4แบบ/Seed/เริ่มใหม่/เสียง/animation/FPS/พักวาด/log/ลิงก์ Auth เฉพาะปุ่มที่ทำงานจริง ไม่แสดงกระเป๋า/กาชาที่ยังไม่ได้ทำ

อ้างอิงภาพหน้าจอผู้เผยแพร่จาก [Google Play](https://play.google.com/store/apps/details?id=com.gravitygamehub.roidle.aos) สำหรับองค์ประกอบแนวตั้งและหน้ารายละเอียดแยก เป็นการปรับให้เหมาะกับต้นแบบนี้ ไม่ใช่การคัดลอก UX หรืออ้างว่าตรวจระบบเดินของเกมอ้างอิงจาก screenshots แล้ว

## การต่อยอดและข้อจำกัด

TASK-023/025 ต้องสร้าง spatial profile จาก build/encounter factory แล้วส่ง engine ไม่คำนวณระยะซ้ำใน UI การเพิ่ม summon/pet ต้องมี profile, life epoch และ motion timer ตาม actor factory กลาง ห้ามใช้ตำแหน่งวาดเป็นกติกาตี ระยะ/ความเร็วเป็นข้อมูลบิลด์ แยกจาก AGI/DEX จนกว่าจะออกแบบ modifier ที่ยืนยันแล้ว

Simulation บันทึก initial checkpoint พร้อม geometry เทียบ A/B ต้องใช้ arena/spawn/enemies/timing/seed/budget เดียวกัน ส่วนระยะโจมตี/ความเร็วของตัวผู้เล่นสามารถเป็นความต่างของ build ที่ตั้งใจทดสอบได้ ทุก run ใช้ engine นี้เหมือนกัน

เป็นสนามเปิด ไม่มีสิ่งกีดขวาง/navmesh/การชนกำแพงซับซ้อน separation เป็น local steering และไม่มีการพิสูจน์ว่าไม่เกิดวงล้อมติดขัดสำหรับ encounter ทุกขนาด/องค์ประกอบ ต้องทดสอบ encounter/content จริงใน TASK-041 ไม่อ้างว่า balance เดิมผ่านโดยอัตโนมัติหลังเพิ่มระยะ การวัด Chrome viewport ไม่แทน Safari หรือมือถือจริงใน TASK-042 และ UI นี้ยังเป็น sandbox ไม่ใช่วงจร progression/save ที่เสร็จแล้ว

ปรับภาพรอบ7: ชื่อ Timeline คอลัมน์68px ใช้ชื่อสั้น/อาชีพสองบรรทัด พร้อม title/accessibleชื่อเต็ม เส้นตอนนี้และ track ใช้ CSS variables ร่วมกัน เพิ่ม special_sfx normal orb ให้ Mage/Wizard/Sage ผ่าน config เดิม ไม่เปลี่ยนกติกา engine หรือ UI ส่วนอื่น

ปรับภาพรอบ9ตามผู้ใช้: คิว4สกิลใช้ภาพ56pxบนพื้นโปร่ง เอากรอบการ์ดออก ใช้ตัวแบ่งแนวตั้งสั้นๆกับขีดใต้ช่องถัดไปแทนกรอบเน้น แถวdockสูงตามเนื้อหาเพื่อไม่บังแถบเวลารอคิว Timelineใช้ช่องว่างแยกactor เอาเส้นขอบแถวและเส้นพาดหลังสกิลออก เก็บแกนวินาที/CT-ACD/เส้นตอนนี้และกฎengineเดิม หลักฐานอยู่ [round9](../evidence/task-020-icon-dock-review.json)

ปรับภาพรอบ10ตามผู้ใช้: Timelineเหลือicon+เวลาเริ่ม ชื่อสกิลอยู่ในtooltip/accessible labelและรายละเอียดเมื่อแตะ แต่ละactorมีเส้นแนวนอนผ่านกึ่งกลางicon ไม่ใช่เส้นคั่นขอบแถว เส้นgridแนวตั้งเป็นเส้นประopacity0.3และเส้นตอนนี้เป็นเส้นประอ่อน ตำแหน่งใช้engine projectionเดิม

สกิลแรกใช้SIตามASPDเหมือนทุกรอบ ก่อนหน้านี้เดโมให้AGI/DEX1ทุกคนจึงเริ่มเท่ากัน รอบ10ใส่บิลด์ตัวอย่างลงแต้มเอง45แต้มต่อตัวที่Lv10 (Lv20ยังใช้แต้มเดิม) เพื่อให้เห็นคิวต่างกัน ไม่ใช่classgrowth/สุ่มเวลาหรือoffsetภาพ ArcherASPD122.5เริ่ม2449ms, Main110เริ่ม2728ms, Mage105เริ่ม2858ms, Acolyte101.25เริ่ม2963ms ดู [round10](../evidence/task-020-timeline-cast-review.json) ไม่ใช่ผลbalanceรุ่นสุดท้าย

รอบ11ผู้ใช้รับgameplayและขอfocusให้นุ่มขึ้น: ใช้portraitบนradialhighlight/จุดfocus ไม่มีกรอบการ์ด ตัวเลข/แรงสะท้อนภาพ/ท่าตายรอcontactframeตามACTattack sound event (fallbackกลางclip) ลูกกระสุนรอreleaseframeแล้วจึงเดินtravel/staggerเดิมและขึ้นเลขเมื่อถึงเป้า ปรับเสียงimpactตามภาพด้วย เป็นpresentationdelayเท่านั้น HP/HUD/metrics/engineยังเป็นcanonical ไม่แก้ผลโจมตีหรือASPDใหม่ ดู [round11](../evidence/task-020-focus-impact-review.json)

## D-070 ภาพการต่อสู้ตรง RO (TASK-054, 20 ต.ค. 2026)

ชั้น presentation เท่านั้น เวลา/สูตรเกมไม่เปลี่ยน

- **อาวุธ**: overlay ตาม `equipment.json weapon_compatibility` RO วาดอาวุธแต่ละประเภทในกลุ่มท่าโจมตีเดียว (มีด/คทา/ดาบ = action 86, กระบอง/ธนู Class 2 = 94) preset จึงระบุ `attack_source_action_index` ที่อาวุธแสดงจริง และ `attack_variant_indices` ใช้ได้เฉพาะอาวุธที่ไม่มีภาพ (Monk สนับมือ: 86/94/46 วนตามลำดับ) ท่าที่เลือกถูกจำต่อ event เพื่อให้เวลาสัมผัสกับท่าที่วาดตรงกัน สกิลใช้ท่าหลักเสมอ
- **ลูกธนู**: เสียง ACT ของธนูอยู่ตอนง้าง ลูกออก frame 4 ทุกร่าง (`attack_release_frame: 4`) ใช้ทั้งตีปกติและสกิลธนู
- **ชื่อสกิล**: ทุก `cast_start` (รวมสกิลไม่มีเวลาร่าย) แสดง `ชื่อ!!` ในกรอบเหนือผู้ใช้ นาน max(1.5 วิ, เวลาร่าย+1 วิ) อันใหม่แทนอันเก่าของคนเดิม หายเมื่อตาย; หลอดร่ายคงไว้และป้าย ขัดร่ายได้/ไม่ได้ ของศัตรูคงเดิม
- **ตัวเลข**: `numberFlight` 800 ms ขึ้นสูงสุดที่ 45% แล้วตกลงต่ำกว่าจุดเริ่ม เอียงซ้าย/ขวาตาม sequence ขนาด 1.4→0.55 จางช่วง 30% สุดท้าย; ขาออกตามตัวที่โฟกัส, ฝั่งเราโดนตีขึ้นเลขแดงขนาด 0.8 (`frameStats.incoming` แยกจาก `frameStats.damage`)
- **เอฟเฟกต์สกิล**: `combat-visuals.json impacts[presentation_id] = {meta, scale, start_ms, lead_ms, stagger_ms, lift}` เล่น STR จริงต่อ (เป้า, ฮิต) ณ เวลาเดียวกับเลขของฮิตนั้น; ไม่มี projectile ใช้ contact+lead+hit×stagger (Lightning Bolt: STR `lightning` 3 ครั้งห่าง 220 ms) ฮิตที่ลงพร้อมกันรวมเป็นภาพเดียว สกิลที่มี impact ไม่วาด recipe procedural ซ้ำ ไฟล์ STR ที่ผูก 22 ไฟล์ (firehit1, freeze, lightning, windhit1, earthhit, holyhit, arrowstorm, hit, provoke, concentration, maemor, cartrevolution, loud, pierce, brandish, holy_cross, sonicblow, crashearth, sanctuary, spell, enc_fire, claymore) เลือกจากภาพ preview ที่ render ด้วย `drawEffect` จริง; ภาพ ACT sprite effect (fireball/icemine/soule) ไม่ใช้เพราะ render ผิดสเกล สกิลที่ RO วาดด้วยโค้ด client (Heal/Blessing/Increase AGI ฯลฯ) ยังใช้ recipe procedural
- **Bolt ตกจากฟ้า**: projectile `path: 'sky'` + `shape: 'spear'` เริ่มสูง 360px เหนือเป้า เร่งลง (t²) แบ่งเลนตาม count; Fire/Cold Bolt 3 ลูกห่าง 130 ms แล้วระเบิด firehit1/freeze, Meteor ใช้ orb ตกจากฟ้า
- **งบ pack**: raw cap 27 MiB (D-070) effect โหลดเฉพาะสกิลในไฟต์ (`AssetPack.prepare`) initial profile นับเฉพาะ impact ของสกิล Lv.1 ทั้งสี่สาย

