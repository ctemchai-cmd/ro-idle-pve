# ชุดเนื้อหา Class 1/2 และสัญญาเพิ่มเติม

19 ตุลาคม 2026 · M0 TASK-003–008 · ดัดแปลงบทบาทและชื่อจาก RO; ตัวเลข/ผลสกิลเป็น baseline ของเกมนี้ ยังไม่ใช่ผลเล่นหรือสูตร reference ที่ยืนยัน

อ่านข้อมูลรายสายจาก `plan/data/skills/<root>.json` และ presentation refs จาก `plan/data/presentations/<root>.json` แยกค่าบาลานซ์จากภาพ/เสียง Root มี Active4/Passive1; แต่ละสาขา Class2 เพิ่ม Active5/Passive2 เป็นรายการที่เลือกลงรุ่นแรก ไม่ใช่ทุก skill ID ที่อยู่ใน RO PC ทุกแพตช์ Rogue มี copied Active variants เพิ่มจาก whitelist ที่ระบุและใช้ได้ครั้งละหนึ่งช่อง

## การเรียน อัป และ reset

Active สองท่าแรกของแต่ละ root ปลด Lv.1 ฟรี; ท่าที่3/4 ปลด5/10 Passiveแรกปลด10 Class2 สองท่าแรก/Passiveแรกปลด20 อีกสองท่ากับ Passiveที่สองปลด30 ท่าสุดท้ายปลด40 เมื่อเปลี่ยน Class2 ยังใช้ root skills ได้ แต่ใช้สกิลสาขาอื่นไม่ได้ การปลดไม่auto-learn/auto-upgrade: ผู้ใช้กดเรียนด้วยskill.upgrade target_level1ที่ราคา0เอง หลังเรียนPassiveแล้วจึงมีผลอัตโนมัติ เพื่อไม่ให้CastSpeedpassiveเพิ่มจากการเลเวลขึ้นโดยไม่ได้เลือก

ทุกท่า max10; cap=`min(10,1+floor((characterLv−1)/5))` ไม่ auto-upgrade จึง cap1/4/8/10 ที่ Lv.1/20/40/70 ตามลำดับ การปลด/เรียนLv1ฟรีหลังถึงเงื่อนไข ไม่คืนทุนจาก free grant อัป n→n+1 ใช้ gold50n+manual10n สำหรับ root และสองเท่าสำหรับ Class2 ทุกแถว1→10อยู่ใน catalog ไม่ใช้ function text ท่าที่ผลคงที่ เช่น Provoke/Call Spirits/Dispel ลด SPหนึ่งแต้มต่อ skill level โดย Lv.1เสียมากกว่า Lv.10เก้าแต้ม; passive Spirit Comboเพิ่มโอกาสได้ลูกแก้ว ตัวตรวจปฏิเสธ paid upgradeที่ resolved behaviorเหมือนระดับก่อนหน้า เพื่อไม่ให้จ่ายวัตถุดิบแล้วไม่ได้ผล

Main/NPC ใช้ต้นทุนเดียวกัน บิลด์ตัวอย่างทุกสาขามีอย่างน้อยสองแบบที่ Lv.70 พร้อมค่าหก stat จริง, แต้มที่ใช้/เหลือจาก345, skill levels/ต้นทุนรวม และคิว Active4ไม่ซ้ำ Passiveที่เรียนใช้ให้อัตโนมัติ การเปลี่ยนสาย/รีเซ็ตคืน paid ledger ของจริงตาม progression.json ไม่คืนราคาปัจจุบันและไม่เก็บ skill level เดิมไว้ใช้ฟรีจาก preset

คิวตัวอย่างเป็นdry timing previewที่รวมlearned permanent Passiveแต่ไม่รวมtemporary Active buffs และสมมติทรัพยากรพอ ไม่ใช่ sustained DPS ไม่ซ่อนกรณี SP/sphereขาด: runtimeจะข้ามช่องและเริ่ม SIถัดไปตามbaseline15 เช่น Monkหลังใช้ Asura อาจไม่พร้อม Triple Attack หากลูกแก้วไม่พอ จึงต้องวัด passive gain/ความเร็ว/SPจริงใน engine ภายหลัง และอาจปรับคิวหรือเลือก Finger Offensive แทน Asura

## เพิ่มข้อมูลผ่านโมดูลเดิม

[class-status-effects.json](../data/class-status-effects.json) ต่อจาก catalog20สถานะเดิมด้วย counter stance, devotion, attack/accuracy down, venom, chemical burn และ frost field ใช้ independent instance/expiry โดยไม่เพิ่มเพดานบัฟ ตัวลดความแม่นยำ/ATKรับ ratioติดลบผ่าน add_flat/add_percent เพื่อไม่ต้องเก็บ expression สำหรับลบค่า

Counter stance ใช้ damage_received trigger ที่รับ normal/skill แล้วคืน physical damage เป็น proc; ไม่ขัดคิวไป cast skill อีกรอบและไม่สวน reflect/proc วน สถานะ DoT/fieldติดที่เป้าเป็นระยะในรุ่นแรก ยังไม่มี free-position ground geometry Native Storm Gust เป็นการวาดภาพประกอบ ส่วน hit/freeze/tick engineกำหนดจากข้อมูล ไม่ตัดสินจากเฟรมภาพ

## Devotion รับแทนโดยรักษายอดดาเมจ

Provoke เปลี่ยนผู้ถูกเลือกเป็นเป้า ไม่มีการย้าย HP loss Devotion เป็น status ที่มี typed `damage_redirect` และ source_death=remove; ใช้ได้กับเพื่อนฝ่ายเดียวกันที่มี sourceอื่นยังมีชีวิต ถ้าร่ายครอบตัวเอง instanceนั้นไม่ส่งกลับหาตัวเอง

หลังคำนวณ/ปัด incoming damage P ตาม mitigation ของเป้าเดิม ก่อนหักโล่ ให้รวม ratioของ linksที่มีผลทั้งหมดแบบบวกโดยไม่ capค่า ratioที่เก็บ จากนั้น `transfer_total=min(P,floor(P×sum_ratio))` และเป้าเดิมเหลือ `P−transfer_total` การส่งต่อจึงไม่สร้าง damage เพิ่ม แม้ผลรวมratioเกิน100% (เทียบกับ guard ที่ไม่เปลี่ยน damage เป็น heal เมื่อเกิน100%)

แบ่ง transfer_total ตามสัดส่วน ratio ของแต่ละ instance floorก่อน แล้วแจกเศษที่เหลือตาม instance ID หนึ่งแต้มต่อ instance จนครบ ถ้าหลาย instance มีผู้รับเดียวกันให้รวม share ของผู้รับนั้นก่อนหักโล่ ส่งผ่านโล่/HPของผู้รับ ไม่มี armor/crit/guardรอบสอง และไม่มี redirect รอบสอง Origin=transfer ไม่รับเข้าพวก reflect/counter ที่ whitelistแค่ normal/skill ผู้สร้าง damage ยังคือ attacker/action เดิม พร้อม link sourceสำหรับ metrics

ตัวอย่าง P100/link.3 → ผู้คุ้มกัน30/เป้า70; links.6+.6 → 50/50/เป้า0; P7/link.3 → 2/เป้า5 ผู้คุ้มกันมีHPน้อยไม่ส่ง overkillส่วนเกินกลับไปเป้า และเมื่อ sourceตาย linkถูกถอนสำหรับ hitถัดไป ผลรวมบัฟไม่ถูก clamp; เฉพาะ HP lossจริง/overkillแยกตามbaseline15

Status schemaเพิ่ม optional damage_redirect โดยข้อมูลเดิมยังผ่าน; trigger origin enumเพิ่ม transfer สูตรหลักยังอยู่ที่ combat-rules.json จุดนี้ต้องมี runtime case ใน TASK-017/029/044 และผลตรง runner ไม่สร้าง special-caseด้วยชื่อสกิลใน renderer

## ข้อต่างที่ใช้ตรวจรายสาย

- Knight: คิวเร่งตี/หลายฮิตกับคิว Provoke/Counter/Endure ต่างบทบาท; Crusaderแยก Holy burst กับ Devotion/ทีมDEF มีการเสียคิวโจมตีเพื่อคุ้มกัน
- Priestฮีลแรงเป็นครั้งและโล่ ส่วน Bard/Dancerฟื้นหมู่เป็นช่วงและเพลงบัฟ/debuff ไม่เก็บ Healไว้รอHPต่ำ Bard/Dancerมีพลังเชิงระบบเท่ากัน ต่างภาพ/ชื่อ และยังเป็น NPC Archerตัวเดิม ไม่ได้คนเพิ่ม
- Monkใช้ spheresสูงสุด5เป็น combat resource; Call Spirits/normal procสร้างลูกแก้ว การขาดลูกแก้วใช้กฎ skipเช่นเดียวกับ SP Steel Bodyแลกความถี่ตี/สกิลหนึ่งช่องกับ guard/provoke ไม่ได้เพิ่ม auto AGI/VITตามอาชีพ
- Hunterแยก mark/rapid hitsจาก traps/หมู่; Falconรับเฉพาะ Normal Attack hitจึงไม่ procจากตัวเอง
- Wizardเน้นร่ายหมู่/สถานะเป็นช่วง; SageAuto-boltรับเฉพาะ normal originและไม่ได้ตีขณะCT Spell Breakerออกตามคิว ไม่รอ bosscast; การจัดความเร็วจึงมีผลกับจังหวะขัด
- Assassinเน้น crit/poisonของตนเอง; detonateลบเฉพาะ own-sourceVenom Rogueลดเกราะ/ATK/Exposeให้ทีม ท่าลอกเป็น whitelistที่ materialize effects แบบimmutable ใช้ Activeหนึ่งช่อง, copy groupได้สูงสุดหนึ่ง, SPceil(source×1.25), ใช้ capของตัวเองและไม่ดึง paid skill levelจากเจ้าของต้นฉบับ
- Roguecopy_whitelistเป็นruntimefieldนอกnotes; generated_skill_idsบอกห้าท่าที่เป็นderiveddefinitionsจากsourceSkill Sourceprogramเป็นผู้กำหนดeffects/timing/levelcurves ส่วนRogueกำหนดcost/สิทธิ์/copygroup Compilerสร้างสำเนาและตรวจเทียบmaterializedM0fixtures ไม่แก้ตัวต้นฉบับ และไม่ปล่อยcopyเก่าค้างเมื่อsourceเปลี่ยนโดยไม่ผ่านvalidation
- Blacksmithเสริมกายภาพ/ทำลายเกราะ Alchemistมีเวทสารเคมีและ plantsจำนวนจำกัด Mammoniteรุ่นนี้ใช้ SP ไม่มีการเผา walletทองจาก coreต่อhit Plantไม่อยู่ใน roster ไม่กันผลแพ้ทีม, ownerตาย/จบไฟต์ลบ, ไม่มี recursive spawn trigger

## Monk: ต้นทุนเตรียมท่าและลูกบอล (D-092/D-093, 21 ต.ค.2026)

โบนัสขณะถือบอลคือ ATK+1% ต่อบอลใน derived bucket เดิม หักบอลก่อน offense snapshot จึงใช้5ลูกแล้วไม่มีโบนัสถือบอลเหลือ ความคุ้มของท่าที่ใช้บอลอยู่ใน coefficients ของท่านั้น ไม่สร้าง global multiplier เพิ่ม

ค่าทดลองที่ assistant เสนอหลังผู้ใช้ขอเพิ่มพลังอย่างสมเหตุผล: Triple Attack raw power ×1.25, Finger Offensive ×2.25, Asura ทั้ง ATK และ SP term ×2.25 เทียบข้อมูลก่อน D-093 ปรับทุกระดับโดยคง SP/บอล/CT/ACD/crit/armor/hits เดิม ระดับ10ได้318.75% ATK รวม3hit, 731.25% ATK รวม5hit และ562.5% ATK+292.5% SP ก่อนจ่ายตามลำดับ ไม่ใช่ค่าที่ผู้ใช้ระบุเองหรือสูตร RO reference

ประเมิน Call+finisher เป็นสองช่องรวมเวลา/normal attacks และ SP ไม่ตัดสินจาก damage หนึ่งhit Asura กิน SP ทั้งหมด จึงไม่สมมติว่าทุกรอบมี SP เต็ม; Passive Spirit Combo อาจลดความจำเป็น Call แต่ไม่รับประกันบอลครบตอนถึงคิว ผู้ใช้ห้ามรัน simulation ใหม่ในรอบนี้ ใช้ static arithmetic และ focused rule/UI checks เท่านั้น ผลบาลานซ์จริง/โหลดเอาต์อยู่ TASK-041 และ feedback ผู้เล่น ยังไม่ปิดจากการเพิ่มตัวคูณ

## Healing Song และวงฮีลต่อเนื่อง (D-096/D-097, 22 ต.ค.2026)

Bard/Dancer Healing Song ใช้ P.ATK โดยตรงผ่าน `physical_power` ใน effect ชนิด `heal`; ไม่ใช้ MATK หรือค่าสูงสุดของสองฐาน และไม่ผ่านเกราะ/คริ/โบนัส damage การแก้นี้คง power10–20% ต่อ tick, interval1s, duration6s, SP38/CT800/ACD1200, โบนัส Music Lesson และโบนัสรับฮีลเดิม ไม่มี tick ตอน apply และ expiry ชนะ tick เวลาเดียวกัน จึงได้5ticks รวม50–100% P.ATK ต่อผู้รับก่อนโบนัส ไม่ใช่ผลสมดุลที่วัดจาก simulation

`physical_regeneration` ใช้ lifecycle/stacking/source snapshot เช่นเดียวกับ `regeneration` แต่เปลี่ยนสูตร raw ของ periodic heal เท่านั้น Priest Sanctuary ยังใช้ MATK แต่ละ application มี expiry แยกตามเดิมและไม่ถูก renderer รวมทิ้ง

วงเขียวใต้ผู้รับเป็น authored procedural indicator จากสถานะ periodic heal ที่ยัง active จริง ไม่ hardcode ชื่อสกิล ผู้รับหลาย HoT แสดงวงเดียวแต่ engine ยังคำนวณทุก instance วงหายเมื่อไม่มี HoT เหลือ/ผู้รับตาย และตามตำแหน่ง actor จริง ใช้ presentation clock เดียวกับภาพอื่น; motion ปิดใช้ภาพนิ่ง ไม่สร้าง heal ticks หรือ DB writes เพิ่ม ไม่อ้างว่าเป็น native STR ของ RO

## ภาพ เสียง และหลักฐาน

ทุกท่ามี icon ID/sidecarที่อ่านจาก skill-assets indexจริงและตรวจไฟล์/sha256 เสียง/VFXเลือก prepared recipeที่ dependencyพร้อม; ท่าที่ไม่มีสูตรเฉพาะใช้ familyที่เข้าลักษณะและระบุว่า authored adaptation ไม่อ้างว่าเป็น nativeeffectของท่านั้น การตรวจนี้ไม่เปิดอ่านรูปใหม่และไม่เพิ่ม visual-reviewครอบคลุมทุกเฟรม

`python3 plan/checks/classes.py --root swordsman` ตรวจ schemaทุกระดับ, unlock/cap/cost1–70, stat budget/คิว, metadata/mediaที่เลือก และเคสเฉพาะสาย รายงานอยู่ใน `plan/evidence/task-003-review.json` และเลขงานของแต่ละสาย การดู DPS/uptime/SP stallsและการเปรียบเทียบสองบิลด์ต้องทำด้วย shared engineใน M1/M4 ไม่ใช้การผ่าน schemaเป็นหลักฐานว่าสมดุลแล้ว

ข้อแก้จากTASK-014: ตัวอย่างSageAuto-boltต้องรวมWisdomCastSpeed12% จึงได้rating164.64และdrycycle7344ms ไม่ใช่ใช้primaryอย่างเดียว การทดสอบqueue_estimateคือpurepreviewภายใต้assumptionsดังกล่าว ไม่เอาconstanttraceนี้ไปบังคับfullfightที่temporarybuffเปลี่ยนเวลาช่วงถัดไปตามปกติ
