# เกณฑ์ตรวจรับและกรณีอ้างอิง

19 ตุลาคม 2026 · TASK-014 · 201 ACจาก47tasks มีinput/expected/methodครบใน [acceptance cases](data/acceptance-cases.json)

M0passedหมายถึงข้อมูล/สเปกผ่านself-reviewพร้อมหลักฐาน ส่วนcaseงานพัฒนายังเป็นnot_run_implementation ต้องเก็บผลรันจริงก่อนdone การมีแถวนี้ไม่ใช่ผลทดสอบเกม/schema/DBที่ยังไม่ได้สร้าง

Case IDใช้ TXXX-AC-YY คงเดิมเมื่อย้ายtask Folderเป็นstatusจริง รูปJSONเก็บcriterionเต็ม/subclauses, sources, setup, expectedและverification อ่านคู่scope/ขั้นตอนของแต่ละtask Runtimecaseต้องบันทึกseed/content/rules/implementation/asset hashesตามที่ใช้จริง ห้ามนำรายงานM0แทนruntimeproof

| Case / Task | Input / วิธีตรวจ | ผลที่คาดหวัง | หลักฐานตอนสร้างmatrix |
| --- | --- | --- | --- |
| `T001-AC-01` [TASK-001](done/tasks_001.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | มีเส้นทาง Lv.1–70 พร้อมเงื่อนไขเลเวล/Breakthrough/Class 2 และไม่สร้าง Breakthrough ที่ 70 | [M0 report](evidence/task-001-review.json) |
| `T001-AC-02` [TASK-001](done/tasks_001.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ไม่มีการเพิ่ม STR/AGI/VIT/INT/DEX/LUK ตามอาชีพอัตโนมัติ ระบุค่าตั้งต้นและแต้มลงเองชัดเจน | [M0 report](evidence/task-001-review.json) |
| `T001-AC-03` [TASK-001](done/tasks_001.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | NPC ทั้งหกมีข้อมูลพัฒนาของตน ใช้ resources เลือกกดอัปตัวใดก็ได้รวมตัวนอกทีม ไม่ auto-level หรือโอนค่าจากช่องทีม | [M0 report](evidence/task-001-review.json) |
| `T001-AC-04` [TASK-001](done/tasks_001.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | รีเซ็ต/สลับสายรักษาเลเวล คืนทุนตาม ledger/policy ที่ระบุ พร้อมเคส cost v1→v2 ที่ไม่สร้างทรัพยากรเพิ่มหรือหาย; Lv.70 ยังไม่เปลี่ยน Hi-class ในรุ่นแรก | [M0 report](evidence/task-001-review.json) |
| `T002-AC-01` [TASK-002](done/tasks_002.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | สูตร stat/ดาเมจ/ฮีล/ฟื้น HP-SP/เวลา มีหน่วย ลำดับ flat-percent-multiplier/crit/DEF-MDEF/penetration/guard/shield/rounding และเพดาน; ระบุ eligibility ของ crit/หลาย hit/DoT โดยไม่คิดซ้ำหรือขึ้นกับ FPS | [M0 report](evidence/task-002-review.json) |
| `T002-AC-02` [TASK-002](done/tasks_002.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ตีปกติได้ใน SI/ACD หยุดตอน CT ไม่มี cooldown แยก และ SP ไม่พอข้ามแล้วรอช่องถัดไป | [M0 report](evidence/task-002-review.json) |
| `T002-AC-03` [TASK-002](done/tasks_002.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | เริ่มร่ายนับใช้และหัก SP ไม่คืนเมื่อถูกขัด; สตั้นไม่กินช่องที่ยังไม่เริ่มและไม่ย้อนช่องที่เริ่มแล้ว; SI/ACD เดินถึง action gate ระหว่าง Stun หายแล้วร่ายเมื่อใช้ได้ ไม่เริ่ม SI ใหม่หรือสะสม action ยิงชดเชย | [M0 report](evidence/task-002-review.json) |
| `T002-AC-04` [TASK-002](done/tasks_002.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | มี case ID/input/ผลคาดหวังครบไทม์ไลน์เดิมและ damage breakdown ที่ crit/เกราะ/เจาะเกราะเป็นศูนย์-กลาง-ใกล้cap, โล่/multi-hit/DoT; เทียบงบและ DPS ต่อรอบคิวรวม ASPD/SP โดยแยก reference RO ออกจากสูตรเสนอ | [M0 report](evidence/task-002-review.json) |
| `T003-AC-01` [TASK-003](done/tasks_003.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้ | [M0 report](evidence/task-003-review.json) |
| `T003-AC-02` [TASK-003](done/tasks_003.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้ | [M0 report](evidence/task-003-review.json) |
| `T003-AC-03` [TASK-003](done/tasks_003.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทั้งสองสาขามีอย่างน้อยสองบิลด์ที่เปลี่ยนบทบาทได้โดยไม่ใช้สกิลอนาคต | [M0 report](evidence/task-003-review.json) |
| `T003-AC-04` [TASK-003](done/tasks_003.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์ | [M0 report](evidence/task-003-review.json) |
| `T004-AC-01` [TASK-004](done/tasks_004.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้ | [M0 report](evidence/task-004-review.json) |
| `T004-AC-02` [TASK-004](done/tasks_004.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้ | [M0 report](evidence/task-004-review.json) |
| `T004-AC-03` [TASK-004](done/tasks_004.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ฮีลปล่อยตามคิวแม้ HP เต็ม; Monk มีข้อแลกเปลี่ยนชัดเจนระหว่างแทงก์กับดาเมจ | [M0 report](evidence/task-004-review.json) |
| `T004-AC-04` [TASK-004](done/tasks_004.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์ | [M0 report](evidence/task-004-review.json) |
| `T005-AC-01` [TASK-005](done/tasks_005.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้ | [M0 report](evidence/task-005-review.json) |
| `T005-AC-02` [TASK-005](done/tasks_005.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้ | [M0 report](evidence/task-005-review.json) |
| `T005-AC-03` [TASK-005](done/tasks_005.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Bard/Dancer ไม่สร้าง NPC Archer คนที่สอง และฮีล/บัฟเพลงมีจุดต่างจาก Priest | [M0 report](evidence/task-005-review.json) |
| `T005-AC-04` [TASK-005](done/tasks_005.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์ | [M0 report](evidence/task-005-review.json) |
| `T006-AC-01` [TASK-006](done/tasks_006.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้ | [M0 report](evidence/task-006-review.json) |
| `T006-AC-02` [TASK-006](done/tasks_006.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้ | [M0 report](evidence/task-006-review.json) |
| `T006-AC-03` [TASK-006](done/tasks_006.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Auto-bolt และ proc ไม่อนุญาตตีปกติระหว่าง CT และไม่เรียกสกิลวนไม่สิ้นสุด | [M0 report](evidence/task-006-review.json) |
| `T006-AC-04` [TASK-006](done/tasks_006.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์ | [M0 report](evidence/task-006-review.json) |
| `T007-AC-01` [TASK-007](done/tasks_007.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้ | [M0 report](evidence/task-007-review.json) |
| `T007-AC-02` [TASK-007](done/tasks_007.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้ | [M0 report](evidence/task-007-review.json) |
| `T007-AC-03` [TASK-007](done/tasks_007.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ท่าลอกใช้หนึ่งในสี่ Active ไม่เพิ่มช่องที่ห้า และ Rogue มีคุณค่าต่อทีมแยกจากดาเมจส่วนตัวของ Assassin | [M0 report](evidence/task-007-review.json) |
| `T007-AC-04` [TASK-007](done/tasks_007.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์ | [M0 report](evidence/task-007-review.json) |
| `T008-AC-01` [TASK-008](done/tasks_008.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Active/Passive ทุกท่าที่ลงรุ่นแรกมีค่าที่จำเป็นครบ ไม่มี TBD ในฟิลด์ที่ engine ต้องใช้ | [M0 report](evidence/task-008-review.json) |
| `T008-AC-02` [TASK-008](done/tasks_008.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกสาขา Class 2 มีอย่างน้อยสองบิลด์พร้อมคิวสี่ Active และ Passive อัตโนมัติ ระบุ stat/skill allocation และคำนวณต้นทุน/skill cap ตาม Lv.1–70 ได้ | [M0 report](evidence/task-008-review.json) |
| `T008-AC-03` [TASK-008](done/tasks_008.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Plant/สิ่งเรียกมีจำนวน อายุ tick และเจ้าของผลชัดเจน ไม่สร้าง actor หรือ proc ได้ไม่จำกัด | [M0 report](evidence/task-008-review.json) |
| `T008-AC-04` [TASK-008](done/tasks_008.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ cast-start/ผลสำเร็จ/proc/stack และ asset recipe ของแต่ละท่า แยกข้อมูลภาพจากค่าบาลานซ์ | [M0 report](evidence/task-008-review.json) |
| `T009-AC-01` [TASK-009](done/tasks_009.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ครบหก slot และ weapon ของทุก Class 1/2 พร้อมค่าที่ใช้ได้ที่ Lv.70; tier 80/100 ยังไม่ดรอปในรุ่นแรก | [M0 report](evidence/task-009-review.json) |
| `T009-AC-02` [TASK-009](done/tasks_009.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ผสมสามชิ้น rarity/tier/slot เดียวกันและชนิดอาวุธเดียวกัน; อัป tier รักษา rarity ด้วยต้นทุนที่ระบุ | [M0 report](evidence/task-009-review.json) |
| `T009-AC-03` [TASK-009](done/tasks_009.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Refine/Enchant/การ์ดไม่ย้ายตาม item หรือช่องทีม; การ์ด 1 ช่องเริ่มต้น/2 ที่ +5/3 ที่ +10 | [M0 report](evidence/task-009-review.json) |
| `T009-AC-04` [TASK-009](done/tasks_009.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ catalog/ระดับ/ผลซ้อนการ์ดแยกจาก rarity อุปกรณ์ ใช้ stat/modifier/trigger/effect กลางพร้อม source attribution และกติกาของสวม/ล็อกไม่ถูกกิน | [M0 report](evidence/task-009-review.json) |
| `T010-AC-01` [TASK-010](done/tasks_010.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทรัพยากรทุกชนิดมีแหล่งและการใช้ ไม่ติดเพราะวัตถุดิบที่ยังไม่มีโหมดให้หา | [M0 report](evidence/task-010-review.json) |
| `T010-AC-02` [TASK-010](done/tasks_010.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | มี checkpoints ของบิลด์/งบอ้างอิง ระบุช่วงเวลาสะสมที่ยอมรับเป็นตัวเลขสำหรับการพัฒนาระดับครึ่งชั่วโมงและเป้าหมายใหญ่ข้ามวัน พร้อมการคำนวณรองรับ | [M0 report](evidence/task-010-review.json) |
| `T010-AC-03` [TASK-010](done/tasks_010.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | คิดต้นทุน Supreme จาก Common 729 ชิ้นร่วมกับ higher-rarity drops และทางอัป tier ไม่ล้างการลงทุน | [M0 report](evidence/task-010-review.json) |
| `T010-AC-04` [TASK-010](done/tasks_010.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | กาชามี pool/rates/pity/duplicate conversion ชัดเจน ผลรวมอัตราถูกต้อง และไม่มี Pet/Artifact ที่ยังใช้ไม่ได้ | [M0 report](evidence/task-010-review.json) |
| `T011-AC-01` [TASK-011](done/tasks_011.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | จำนวนบท/ด่าน/ชั้นที่ลงรุ่นแรกระบุแน่นอน และข้อมูลทุก entry ใช้ได้โดยไม่มี TBD สำคัญ | [M0 report](evidence/task-011-review.json) |
| `T011-AC-02` [TASK-011](done/tasks_011.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Story 90 วินาที ทีมหมด/หมดเวลาแพ้ ตัวหลักตายคนเดียวไม่จบ; ไม่บังคับสกิลที่ยังไม่ปลด | [M0 report](evidence/task-011-review.json) |
| `T011-AC-03` [TASK-011](done/tasks_011.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | บอสเด่นมีสัญญาณ กลไกและวิธีแก้อย่างน้อยสองแนว ไม่บังคับการ์ดหายากหรืออาชีพเดียว | [M0 report](evidence/task-011-review.json) |
| `T011-AC-04` [TASK-011](done/tasks_011.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Tower first-clear ไม่รีเซ็ต; ดันกล่องมี scaling/รางวัล/รีเซ็ต 00:00 Asia/Bangkok และกรณีข้ามวันชัดเจน | [M0 report](evidence/task-011-review.json) |
| `T012-AC-01` [TASK-012](done/tasks_012.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ทุกระบบรุ่นแรกมีทางเข้า/ออกและ action ครบ ไม่ใช่หน้าโชว์อย่างเดียว | [M0 report](evidence/task-012-review.json) |
| `T012-AC-02` [TASK-012](done/tasks_012.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | แสดง HP/SP/คิว/CT/ACD และความเร็วที่เปลี่ยนก่อนลงแต้ม/เปลี่ยนของ พร้อมผลแพ้ที่ใช้แก้บิลด์ได้ | [M0 report](evidence/task-012-review.json) |
| `T012-AC-03` [TASK-012](done/tasks_012.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | เน็ตขาด/เซฟค้าง/เซฟชน/หมด session มีสถานะตรงจริงและทางกลับมาเล่นโดยไม่จ่ายของซ้ำ | [M0 report](evidence/task-012-review.json) |
| `T012-AC-04` [TASK-012](done/tasks_012.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | มีแบบจอเล็กที่อ่านไทย/กดได้ และ tutorial ไม่บังคับจ่ายทรัพยากรผิดบิลด์ | [M0 report](evidence/task-012-review.json) |
| `T013-AC-01` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | สเปก module/import และ public interfaces แยก engine/สูตรพัฒนาจาก DOM/network/เวลาเครื่อง กำหนด shared rules ของ game/simulation และตัวอย่าง input-output โดยผลทดสอบ import จริงเป็นหน้าที่ TASK-015/018 | [M0 report](evidence/task-013-review.json) |
| `T013-AC-02` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | schema เก็บ NPC นอกทีม/slot/เงิน/claims/version ครบ พร้อม expected_revision และ retry request เดิม | [M0 report](evidence/task-013-review.json) |
| `T013-AC-03` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | reconnect มีวิธีเลือกระหว่าง checkpoint กับ cloud โดยไม่ merge เงิน/ของและไม่รับช่วง AFK ซ้ำ | [M0 report](evidence/task-013-review.json) |
| `T013-AC-04` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ระบุ RLS/บัญชีส่วนตัว/กู้รหัสผ่าน/test isolation/migration/rollback/Vercel pack โดยไม่มี credentials และมี quality budgets เป็นตัวเลขพร้อมเงื่อนไขวัดที่ TASK-018/042 ใช้ตัดสินผ่านได้ | [M0 report](evidence/task-013-review.json) |
| `T013-AC-05` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | มี authority matrix และ command/receipt protocol ที่เลือกระบุ source of truth ชุดเดียวต่อ wallet/inventory/progression; ID เดิม/payload ต่าง, response หาย, revision ชน และ cursor มีผลที่คาดหวังชัดเจน | [M0 report](evidence/task-013-review.json) |
| `T013-AC-06` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | เลือกรูปแบบคำนวณ AFK/upgrade/gacha และ persist ที่ไม่คัดลอกสูตรบาลานซ์ TS/SQL คนละชุด พร้อม schema/content/rules compatibility, ID migration และ refund ledger/policy เมื่อราคาเปลี่ยน | [M0 report](evidence/task-013-review.json) |
| `T013-AC-07` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | interruption matrix ทุกโหมดกำหนด durable/transient state, resume หรือ restart, attempt/reward/HP/clock/RNG/event ที่เกี่ยวข้อง และ reward-rate snapshot เมื่อ balance patch ระหว่าง AFK | [M0 report](evidence/task-013-review.json) |
| `T013-AC-08` [TASK-013](done/tasks_013.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | module/import graph และ public contracts มีตัวอย่าง build variant/actor เพิ่ม/ย้าย slot ที่ไม่แก้ shared definitions ไม่ผูกจำนวน battle actors กับ NPC3 และระบุ checks/fixtures/API test route ที่ทำได้ก่อน public Preview | [M0 report](evidence/task-013-review.json) |
| `T047-AC-01` [TASK-047](done/tasks_047.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | Skill/Item/Status/Modifier/Trigger/Predicate มี schema/ชนิด/หน่วย/ID อ้างอิงชัดเจน ประกอบผลหลายฝ่าย/หลายขั้นได้; outcomes ต่อ target/hit ทำให้ A hit/B miss ไม่เอาผล A ไปสตัน B; unknown refs/params/outcome scope ถูกตรวจพบ | [M0 report](evidence/task-047-review.json) |
| `T047-AC-02` [TASK-047](done/tasks_047.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | status มี polarity/tags/source/duration/tick/stack/expiry/cleanse/dispel/on-death ครบ; บัฟรวมไม่มี cap ตาม D-037, reapply คนเดิมเพิ่ม instance แยกอายุ/ID ตาม D-038 ไม่ทับ/refresh/เลือก strongest แทนข้อยืนยัน | [M0 report](evidence/task-047-review.json) |
| `T047-AC-03` [TASK-047](done/tasks_047.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ไอเทม/Passive/การ์ด/status เข้าสูตรกลางตาม bucket/ลำดับเดียวกัน ผลรวมบัฟไม่มี hard/soft cap; ถอด/หมดอายุคำนวณกลับจาก source ไม่สะสม stat ผิดหรือคูณซ้ำ | [M0 report](evidence/task-047-review.json) |
| `T047-AC-04` [TASK-047](done/tasks_047.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | มีเคสตรวจมือครบผลผสม/เป้าหมาย/when/DoT/โล่/บัฟซ้ำ/Chain CC และ optional boss resistance โดยคงการปล่อยตามคิว/หัก SP/cast-start เดิม | [M0 report](evidence/task-047-review.json) |
| `T047-AC-05` [TASK-047](done/tasks_047.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | formula/handler อ้างด้วย ID มี typed context/params ใช้ clock/RNG/effect pipeline ร่วมกับ simulation ไม่มี function text/eval/แก้ HP ข้าม pipeline และกัน proc วนได้ตาม contract | [M0 report](evidence/task-047-review.json) |
| `T047-AC-06` [TASK-047](done/tasks_047.md) | canonical data and independent review cases listed in task evidence; preserve original inputs/expected values | ตัวอย่าง skill variant เปลี่ยน params/เพิ่ม effect ด้วย stable ID และลำดับ stage/priority โดยไม่แก้ตัวละครอื่นหรือ A/B baseline; patch ชน/อ้าง effect หายต้องมีผล error ชัดเจน ไม่ต้องสร้าง implementation Awaken/Artifact เพื่อผ่านงานนี้ | [M0 report](evidence/task-047-review.json) |
| `T014-AC-01` [TASK-014](done/tasks_014.md) | all14 M0 prerequisites done, fresh reports/hashes, release manifest, all201matrixrows and design closure | all14 prerequisite reports pass | M0 gateผ่าน8checks |
| `T014-AC-02` [TASK-014](done/tasks_014.md) | all14 M0 prerequisites done, fresh reports/hashes, release manifest, all201matrixrows and design closure | no blocking unknown data/refs/units/timing/transactions; confirmed decisions preserved | M0 gateผ่าน8checks |
| `T014-AC-03` [TASK-014](done/tasks_014.md) | all14 M0 prerequisites done, fresh reports/hashes, release manifest, all201matrixrows and design closure | DAG valid, runtime refs resolve | M0 gateผ่าน8checks |
| `T014-AC-04` [TASK-014](done/tasks_014.md) | all14 M0 prerequisites done, fresh reports/hashes, release manifest, all201matrixrows and design closure | 201 ACs have inputs/expected/methods and numeric pace/performance targets | M0 gateผ่าน8checks |
| `T014-AC-05` [TASK-014](done/tasks_014.md) | all14 M0 prerequisites done, fresh reports/hashes, release manifest, all201matrixrows and design closure | A01–A08 design closed with runtime owners | M0 gateผ่าน8checks |
| `T015-AC-01` [TASK-015](done/tasks_015.md) | fresh checkout, install lockfile, no env secrets | dev starts, build/typecheck exit0; documented commands reproduce | ผ่าน implementation; ดู report งาน |
| `T015-AC-02` [TASK-015](done/tasks_015.md) | all released definitions plus composition negative_cases | 126skills/60equipment/18cards load; unknown IDs/units/params/outcome/patch collisions fail with field pointers | ผ่าน implementation; ดู report งาน |
| `T015-AC-03` [TASK-015](done/tasks_015.md) | import domain in Node without window/document/fetch/Supabase globals | import succeeds, no IO side effects | ผ่าน implementation; ดู report งาน |
| `T015-AC-04` [TASK-015](done/tasks_015.md) | production build selection from release-content-manifest | hash emitted, whole library/archive absent, data/provenance versions recorded | ผ่าน implementation; ดู report งาน |
| `T015-AC-05` [TASK-015](done/tasks_015.md) | inject forbidden network/DOM import and mutate frozen definition | boundary check fails on forbidden import and mutation; valid pure module passes | ผ่าน implementation; ดู report งาน |
| `T016-AC-01` [TASK-016](done/tasks_016.md) | combat-cases.timeline_cases kind=parallel with two casting actors | both cast starts same timestamp; each resolves at own CT end | ผ่าน implementation; ดู report งาน |
| `T016-AC-02` [TASK-016](done/tasks_016.md) | normal_pause, instant, sp_skip, empty_slots, SI/ACD cases | NA only SI/ACD, no skill cooldown, no-SP skips then new SI, null slots scan<=4 | ผ่าน implementation; ดู report งาน |
| `T016-AC-03` [TASK-016](done/tasks_016.md) | same timestamp completion/timeout/death plus interrupted SP cases | cast start spends once, locked completions both emit, 90000 timeout precedes damage, old tokens invalid | ผ่าน implementation; ดู report งาน |
| `T016-AC-04` [TASK-016](done/tasks_016.md) | same input/seed1 twice and virtual90s run | event order/state hashes equal; virtual time advances without waiting90s wallclock | ผ่าน implementation; ดู report งาน |
| `T017-AC-01` [TASK-017](done/tasks_017.md) | action_gate/interrupted CC and stale cast event | pre-cast stun leaves slot, begun cast remains spent; interrupted event emits no damage later | ผ่าน implementation;135tests/review TASK-017 |
| `T017-AC-02` [TASK-017](done/tasks_017.md) | resolve_selector vs locked target, full-heal, provoke source dies | lowest HP%, front ordering and retarget policies match expected; full HP still spends SP/overheal | ผ่าน implementation;135tests/review TASK-017 |
| `T017-AC-03` [TASK-017](done/tasks_017.md) | composition cases: independent buffs, expiry/tick, AoE A-hit/B-miss, CC with/without reactive trait | 156/288/252/216/120 buff trace; only A stunned; normal chain CC; resistance only from equipped trait; source removals recompute | ผ่าน implementation;135tests/review TASK-017 |
| `T017-AC-04` [TASK-017](done/tasks_017.md) | learned passive with normal-hit proc, reflect ancestry, shields/heal | Passive consumes0slots; ancestor reentry rejected/sibling allowed; metrics split HP/shield/effective/overheal | ผ่าน implementation;135tests/review TASK-017 |
| `T018-AC-01` [TASK-018](done/tasks_018.md) | Node runScenario with same validated content as browser, production repository disabled | no DOM/audio/Supabase/file-save side effects | ผ่าน implementation;144tests/runner report TASK-018 |
| `T018-AC-02` [TASK-018](done/tasks_018.md) | battle-initial-case + real serialized checkpoint at midcast and seed1 | restore vs uninterrupted event order/RNG/metrics equal; reports include variant and hashes | ผ่าน implementation;144tests/runner report TASK-018 |
| `T018-AC-03` [TASK-018](done/tasks_018.md) | single-target, AoE, healer, guard, SP-starved, CC-resistance fixtures | report contains team/actor/skill DPS,HPS,overheal,absorbed,SPskips,casts,interrupts and sources | ผ่าน implementation;144tests/runner report TASK-018 |
| `T018-AC-04` [TASK-018](done/tasks_018.md) | 100 matched seeds each variant; 100 forced90s warm benchmark on M1 profile | paired seed results/sample counts/interval estimates reported; warm100fights<=5s, no claim of significance from one seed | ผ่าน implementation;144tests/runner report TASK-018 |
| `T018-AC-05` [TASK-018](done/tasks_018.md) | wrong content hash/rules/RNG vs supported versions | explicit INCOMPATIBLE; supported replay exact, never latest fallback | ผ่าน implementation;144tests/runner report TASK-018 |
| `T019-AC-01` [TASK-019](done/tasks_019.md) | actor-presentations36presets, all skill/item/card/enemy/background/music refs | all IDs resolve via sidecar file.path; ACT/STR texture closure complete, no basename inference | ผ่าน implementation; ดู report งาน |
| `T019-AC-02` [TASK-019](done/tasks_019.md) | selected dependency closure plus known nine missing STR negatives | missing assets rejected; no archives/full library copied | ผ่าน implementation; ดู report งาน |
| `T019-AC-03` [TASK-019](done/tasks_019.md) | source/build/first-load/whole-pack byte manifests | separate byte totals; initial<=8MiB and selected pack<=25MiB targets, other quality checks later | ผ่าน implementation; ดู report งาน |
| `T019-AC-04` [TASK-019](done/tasks_019.md) | change one asset ref, rebuild twice, delete selected texture in temporary fixture | stable manifest for same inputs, changed hash for ref change, missing dependency diagnostic | ผ่าน implementation; ดู report งาน |
| `T020-AC-01` [TASK-020](done/tasks_020.md) | party and enemies idle/normal/cast/hurt/dead, left/right with attachments | body+head+weapon flip together, metadata action/anchor/timing and attack_source_action_index match | ผ่าน implementation รอบ11; [focus/impact review](evidence/task-020-focus-impact-review.json) |
| `T020-AC-02` [TASK-020](done/tasks_020.md) | four actors concurrent casts plus boss interruptible/uninterruptible | HUD displays actual SI/CT/ACD/SP/next slot, boss telegraph and interrupt flag | ผ่าน implementation รอบ11; [focus/impact review](evidence/task-020-focus-impact-review.json) |
| `T020-AC-03` [TASK-020](done/tasks_020.md) | same seed/scenario at render30/60FPS/render-off and pause-draw | core event/hash/metrics equal for same credited game time | ผ่าน implementation รอบ11; [focus/impact review](evidence/task-020-focus-impact-review.json) |
| `T020-AC-04` [TASK-020](done/tasks_020.md) | browser network trace selected pack only | all images/audio/font decode, no external asset-host requests/404 | ผ่าน implementation รอบ11; [focus/impact review](evidence/task-020-focus-impact-review.json) |
| `T021-AC-01` [TASK-021](done/tasks_021.md) | local Supabase Mailpit signup/login/logout/password recovery/session expiry | email/password flows work and expired session returns login without granting new account wallet | ผ่าน implementation;real local Auth/SMTP/SQL/167tests report TASK-021 |
| `T021-AC-02` [TASK-021](done/tasks_021.md) | owner A, owner B, anon direct REST/RPC plus server-bound command | A reads own and mutates via API only; B/anon denied, direct privileged writes denied | ผ่าน implementation;real local Auth/SMTP/SQL/167tests report TASK-021 |
| `T021-AC-03` [TASK-021](done/tasks_021.md) | fresh local/test DB apply migrations and separate preview env | migration clean; preview/reset cannot alter production rows | ผ่าน implementation;real local Auth/SMTP/SQL/167tests report TASK-021 |
| `T021-AC-04` [TASK-021](done/tasks_021.md) | inspect browser build and tracked files; configured callbacks per env | no service/signing secret shipped; own email/reset callback returns correct environment | ผ่าน implementation;real local Auth/SMTP/SQL/167tests report TASK-021 |
| `T022-AC-01` [TASK-022](done/tasks_022.md) | account-initial-case; mutate main/NPC/off-team/slot/inventory then load | all fields/versions survive, no party-slot progression transfer | ผ่าน implementation;195tests/real local SQL+Auth+Chrome [review](evidence/task-022-review.json) |
| `T022-AC-02` [TASK-022](done/tasks_022.md) | architecture protocol cases commit/retry/ID-reuse/revision collision | one commit only, old rev409, replay original receipt, changed payload409 | ผ่าน implementation;195tests/real local SQL+Auth+Chrome [review](evidence/task-022-review.json) |
| `T022-AC-03` [TASK-022](done/tasks_022.md) | disconnect before/after send and before/after receipt; then reconnect | new durable progress paused, pending ID looked up first, latest cloud replaces stale prediction | ผ่าน implementation;195tests/real local SQL+Auth+Chrome [review](evidence/task-022-review.json) |
| `T022-AC-04` [TASK-022](done/tasks_022.md) | farm 1h reserve, response loss, second device retry then 30m later claim | same interval reserved/paid once; next reward only new30m; old checkpoint cannot reset cursor | ผ่าน implementation;195tests/real local SQL+Auth+Chrome [review](evidence/task-022-review.json) |
| `T022-AC-05` [TASK-022](done/tasks_022.md) | UI action set34 and deliberate direct DB/autosave-wallet write attempt | all mutations through command boundary; direct writes denied; committed wallet/cursor not overwritten | ผ่าน implementation;195tests/real local SQL+Auth+Chrome [review](evidence/task-022-review.json) |
| `T023-AC-01` [TASK-023](done/tasks_023.md) | NPC Knight+Crusader from same root and mainKnight+NPCknight | first selection rejected, main duplicate accepted, four unique character IDs/positions | ผ่าน implementation;201tests/actual local roster [review](evidence/task-023-review.json) |
| `T023-AC-02` [TASK-023](done/tasks_023.md) | upgrade off-team NPC using hero_exp then swap several NPCs | only selected character levels; old NPC investments retained; no EXP auto distribution | ผ่าน implementation;201tests/actual local roster [review](evidence/task-023-review.json) |
| `T023-AC-03` [TASK-023](done/tasks_023.md) | levels19/20/40/60/70, manual AGI/DEX values unchanged | Class2 at20, cap70, gates20/40/60 only, no Hi70 or automatic primary/speed growth | ผ่าน implementation;201tests/actual local roster [review](evidence/task-023-review.json) |
| `T023-AC-04` [TASK-023](done/tasks_023.md) | class/stat/skill reset paid100 at old price150, incompatible weapon, full inventory, repeat IDs | refund100 once and earned points only; move same weapon ID or reject whole command, no free upgraded preset | ผ่าน implementation;201tests/actual local roster [review](evidence/task-023-review.json) |
| `T024-AC-01` [TASK-024](done/tasks_024.md) | character1/20/40/70 skill target above/below cap | caps1/4/8/10; price from rows, no retry double debit; learnLv1free only explicit action | ผ่าน implementation;208tests+real local skills [review](evidence/task-024-review.json) |
| `T024-AC-02` [TASK-024](done/tasks_024.md) | four Active distinct vs duplicate logical skill/copy group and learned basic Passive | four slots only, duplicate rejected, passive automatic once learned with effect in actor snapshot | ผ่าน implementation;208tests+real local skills [review](evidence/task-024-review.json) |
| `T024-AC-03` [TASK-024](done/tasks_024.md) | open skill upgrade/loadout preview including CastSpeed changes | CT/ACD/SP/effect delta shown from shared rules; no per-slot HP/boss-cast hold UI | ผ่าน implementation;208tests+real local skills [review](evidence/task-024-review.json) |
| `T024-AC-04` [TASK-024](done/tasks_024.md) | save/reload off-team NPC skill levels/queue and v1 features | exact independent loadout restored; Awaken remains disabled | ผ่าน implementation;208tests+real local skills [review](evidence/task-024-review.json) |
| `T025-AC-01` [TASK-025](done/tasks_025.md) | clear1-1 then choose cleared1-1 farm vs locked1-3; boss victory1-2 | only cleared farm allowed; actual victory unlocks next stage | ผ่าน implementation;213tests+real local Story/API/Chrome [review](evidence/task-025-review.json) |
| `T025-AC-02` [TASK-025](done/tasks_025.md) | main dead with3alive, teamdead, enemy kill89999/90000; retry | main death not loss, all dead/timeout loss, retry full HP/SP free | ผ่าน implementation;213tests+real local Story/API/Chrome [review](evidence/task-025-review.json) |
| `T025-AC-03` [TASK-025](done/tasks_025.md) | first-clear reward fixed claim, disconnect at commit/response, replay | clear/reward registered once; farm interval independent and not kill-paid | ผ่าน implementation;213tests+real local Story/API/Chrome [review](evidence/task-025-review.json) |
| `T025-AC-04` [TASK-025](done/tasks_025.md) | browser vertical slice then close/reload while boss running | real sprites/queue work; active attempt abort policy, no offline stage wins | ผ่าน implementation;213tests+real local Story/API/Chrome [review](evidence/task-025-review.json) |
| `T026-AC-01` [TASK-026](done/tasks_026.md) | six slots, level/tier, sword/bow/staff restrictions, item moved across NPCs | one item assignment only; wrong job/level rejected | ผ่าน implementation;220tests+real equipment/SQL/Chrome [review](evidence/task-026-review.json) |
| `T026-AC-02` [TASK-026](done/tasks_026.md) | CommonSword60→EpicSword60 with refine10/cards unchanged | base285 vs190; slot modifiers unchanged; separate owners retained | ผ่าน implementation;220tests+real equipment/SQL/Chrome [review](evidence/task-026-review.json) |
| `T026-AC-03` [TASK-026](done/tasks_026.md) | 500items, locked item, incompatible weapon and pending reward | no loss or partial debit; space-making actions remain enabled | ผ่าน implementation;220tests+real equipment/SQL/Chrome [review](evidence/task-026-review.json) |
| `T026-AC-04` [TASK-026](done/tasks_026.md) | preview then committed battle snapshot and reload | same resolved numbers and owner IDs, no implicit stat mutation | ผ่าน implementation;220tests+real equipment/SQL/Chrome [review](evidence/task-026-review.json) |
| `T027-AC-01` [TASK-027](done/tasks_027.md) | refine4→5 and9→10, attempt11 | card capacities1→2→3; max10 rejection without debit | ผ่าน implementation;227tests+actual slot/card/SQL/Chrome [review](evidence/task-027-review.json) |
| `T027-AC-02` [TASK-027](done/tasks_027.md) | swap item and move NPC/team slots after refine/enchant/card allocation | investment remains character+equipment slot; new NPC not inheriting | ผ่าน implementation;227tests+actual slot/card/SQL/Chrome [review](evidence/task-027-review.json) |
| `T027-AC-03` [TASK-027](done/tasks_027.md) | upgrade/salvage distinct duplicate cards, same-request replay | exact cardrarity/level/dust values; additive independent sources; once-only debit | ผ่าน implementation;227tests+actual slot/card/SQL/Chrome [review](evidence/task-027-review.json) |
| `T027-AC-04` [TASK-027](done/tasks_027.md) | EnchantPrecision incrementsDEX and shared preview | SI/CT/ACD use same formulas, phase snapshot maintained; buffs uncapped, minimum interval1ms | ผ่าน implementation;227tests+actual slot/card/SQL/Chrome [review](evidence/task-027-review.json) |
| `T028-AC-01` [TASK-028](done/tasks_028.md) | 3 matching CommonSword20 vs wrong tier/kind/locked/equipped/training/duplicate ID | valid creates1UncommonSword20 and consumes3; invalid inventory unchanged | ผ่าน implementation;233tests+actual fusion/tier/SQL/Chrome [review](evidence/task-028-review.json) |
| `T028-AC-02` [TASK-028](done/tasks_028.md) | SupremeTier20 upgraded40 then60 with paid rows | same instance/rarity, own slot investments unchanged | ผ่าน implementation;233tests+actual fusion/tier/SQL/Chrome [review](evidence/task-028-review.json) |
| `T028-AC-03` [TASK-028](done/tasks_028.md) | fuse Supreme or skip tier or consume worn/locked/training item | reject before mutation; no item loss | ผ่าน implementation;233tests+actual fusion/tier/SQL/Chrome [review](evidence/task-028-review.json) |
| `T028-AC-04` [TASK-028](done/tasks_028.md) | response dropped after fusion/tier commit, retry same ID | original output IDs/cost once; preview equals server result | ผ่าน implementation;233tests+actual fusion/tier/SQL/Chrome [review](evidence/task-028-review.json) |
| `T029-AC-01` [TASK-029](done/tasks_029.md) | ตามตารางหลักฐานในไฟล์งาน | 19 สกิลตรง golden 57 เคส; Active ทุกเลเวลร่ายจริงครบทุก effect ตามลำดับ; Passive ทุกเลเวลมีผล; หน้าสกิลไม่มีปุ่มที่เรียนได้แต่ไม่ทำผล | [review](evidence/task-029-review.json) |
| `T029-AC-02` [TASK-029](done/tasks_029.md) | ตามตารางหลักฐานในไฟล์งาน | Knight striker/แทงก์สวนกลับ และ Crusader คุ้มกัน/ดาเมจศักดิ์สิทธิ์ต่างกันใน encounter เดียวกัน (seeds 1–5); Devotion 30/70 และ 50/50/0 รอบเดียว | [review](evidence/task-029-review.json) |
| `T029-AC-03` [TASK-029](done/tasks_029.md) | ตามตารางหลักฐานในไฟล์งาน | dry `catalogQueueTrace` ของ 4 บิลด์ตรง M0 queue estimate รวม Passive ถาวร; ไฟต์จริงใช้ผลจริง (Quicken เร่งรอบถัดไป) | [review](evidence/task-029-review.json) |
| `T029-AC-04` [TASK-029](done/tasks_029.md) | ตามตารางหลักฐานในไฟล์งาน | server commands, client session (render ทุกเฟรม) และ runner ได้ checkpoint/1,117 events/metrics เดียวกัน (6-20 seed 29) | [review](evidence/task-029-review.json) |
| `T030-AC-01` [TASK-030](done/tasks_030.md) | ตามตารางหลักฐานในไฟล์งาน | 19 สกิลตรง golden 57 เคส; Active ทุกเลเวลร่ายจริงครบ (ฮีล/HoT/โล่/ชุบ/ลูกแก้ว/Asura); Passive ทุกเลเวลมีผล | [review](evidence/task-030-review.json) |
| `T030-AC-02` [TASK-030](done/tasks_030.md) | ตามตารางหลักฐานในไฟล์งาน | Heal ร่ายตามคิวแม้เลือดเต็ม (overheal); ลูกแก้ว ≤5, Asura ใช้ SP ทั้งหมด ถูกขัดไม่คืน; Steel Body guard 0.4 / ช้าลง 30% และดึงบอส | [review](evidence/task-030-review.json) |
| `T030-AC-03` [TASK-030](done/tasks_030.md) | ตามตารางหลักฐานในไฟล์งาน | dry trace ของ 4 บิลด์ตรง queue estimate; ไฟต์จริงใช้ผลจริง (Asura ตาม SP ที่มี, Spirit Combo, Steel Body slow) | [review](evidence/task-030-review.json) |
| `T030-AC-04` [TASK-030](done/tasks_030.md) | ตามตารางหลักฐานในไฟล์งาน | server, client session และ runner ได้ checkpoint/945 events/metrics เดียวกัน (6-20 seed 30); tick อ้าง cast ต้นทาง | [review](evidence/task-030-review.json) |
| `T031-AC-01` [TASK-031](done/tasks_031.md) | ตามตารางหลักฐานในไฟล์งาน | 26 สกิลตรง golden 78 เคส; Active/Passive ทุกเลเวลทำงานจริง; Falcon ติดเฉพาะตีปกติ | [review](evidence/task-031-review.json) |
| `T031-AC-02` [TASK-031](done/tasks_031.md) | ตามตารางหลักฐานในไฟล์งาน | Bard/Dancer เป็นเพื่อน Archer คนเดิม รูป/อาวุธถูกต้อง ค่าเกมเท่ากัน; เพลงซ้อน stack แยกและหมดอายุแยก | [review](evidence/task-031-review.json) |
| `T031-AC-03` [TASK-031](done/tasks_031.md) | ตามตารางหลักฐานในไฟล์งาน | dry trace ของ 6 บิลด์ตรง queue estimate; ไฟต์จริง Battle Song เร่งจังหวะ | [review](evidence/task-031-review.json) |
| `T031-AC-04` [TASK-031](done/tasks_031.md) | ตามตารางหลักฐานในไฟล์งาน | server, client session และ runner ได้ checkpoint/910 events/metrics เดียวกัน (6-20 seed 31) | [review](evidence/task-031-review.json) |
| `T032-AC-01` [TASK-032](done/tasks_032.md) | ตามตารางหลักฐานในไฟล์งาน | 19 สกิลตรง golden 57 เคส; Active/Passive ทุกเลเวลทำงานจริง (ขัดร่าย/Dispel/field/endow/Auto-bolt) | [review](evidence/task-032-review.json) |
| `T032-AC-02` [TASK-032](done/tasks_032.md) | ตามตารางหลักฐานในไฟล์งาน | ไม่ตีระหว่างร่าย; Auto-bolt ติดเฉพาะตีปกติไม่วน; frost field tick 1000–4000 ไม่ใช่ 5000 และ Freeze แยกเป้า | [review](evidence/task-032-review.json) |
| `T032-AC-03` [TASK-032](done/tasks_032.md) | ตามตารางหลักฐานในไฟล์งาน | dry trace 4 บิลด์ตรง (cast speed 164.64 รอบ 7344; หลัง D-061 เป็น 179.2 / 6978); Quagmire ทำให้ศัตรูช้าลงจริง | [review](evidence/task-032-review.json) |
| `T032-AC-04` [TASK-032](done/tasks_032.md) | ตามตารางหลักฐานในไฟล์งาน | server, client session และ runner ได้ checkpoint/RNG/647 events เดียวกัน (6-20 seed 32) | [review](evidence/task-032-review.json) |
| `T033-AC-01` [TASK-033](done/tasks_033.md) | ตามตารางหลักฐานในไฟล์งาน | 24 สกิลตรง golden 72 เคส; Active/Passive ทุกเลเวลทำงานจริง; copy เท่าต้นฉบับ | [review](evidence/task-033-review.json) |
| `T033-AC-02` [TASK-033](done/tasks_033.md) | ตามตารางหลักฐานในไฟล์งาน | copy ได้ท่าเดียวต่อ loadout ไม่ซ้อน; Detonate ใช้เฉพาะพิษของตัวเอง ไม่แตะของเพื่อน | [review](evidence/task-033-review.json) |
| `T033-AC-03` [TASK-033](done/tasks_033.md) | ตามตารางหลักฐานในไฟล์งาน | dry trace 4 บิลด์ตรง; Rogue debuff ให้ทีม Assassin พิษเฉพาะตัว | [review](evidence/task-033-review.json) |
| `T033-AC-04` [TASK-033](done/tasks_033.md) | ตามตารางหลักฐานในไฟล์งาน | server, client session และ runner ได้ checkpoint/602 events เดียวกัน (6-20 seed 33) | [review](evidence/task-033-review.json) |
| `T034-AC-01` [TASK-034](done/tasks_034.md) | ตามตารางหลักฐานในไฟล์งาน | 19 สกิลตรง golden 57 เคส; Active/Passive ทุกเลเวลทำงานจริงรวม summon; ไม่หักทองระหว่างไฟต์ | [review](evidence/task-034-review.json) |
| `T034-AC-02` [TASK-034](done/tasks_034.md) | ตามตารางหลักฐานในไฟล์งาน | Plant มีเจ้าของ จำนวน/อายุ/tick ตามข้อมูล แทนตัวเก่า/เจ้าของตายแล้วหาย ดาเมจลงเจ้าของครั้งเดียว; บัฟ Blacksmith ถูกชนิด | [review](evidence/task-034-review.json) |
| `T034-AC-03` [TASK-034](done/tasks_034.md) | ตามตารางหลักฐานในไฟล์งาน | dry trace 4 บิลด์ตรง; summon ไม่เกินจำนวน ไม่เพิ่มช่องทีม | [review](evidence/task-034-review.json) |
| `T034-AC-04` [TASK-034](done/tasks_034.md) | ตามตารางหลักฐานในไฟล์งาน | server, client session และ runner ได้ checkpoint/RNG/989 events เดียวกัน (6-20 seed 34) ไม่มีดาเมจ/ฮีลของต้นไม้ซ้ำ | [review](evidence/task-034-review.json) |
| `T035-AC-01` [TASK-035](done/tasks_035.md) | ตามตารางหลักฐานในไฟล์งาน | ตัวสร้างชั้นเดียว HP ตามสูตร เริ่มไฟต์จริง | [review](evidence/task-035-review.json) |
| `T035-AC-02` [TASK-035](done/tasks_035.md) | ตามตารางหลักฐานในไฟล์งาน | first clear ครั้งเดียว ซ้ำ/แพ้/ล็อกไม่จ่าย | [review](evidence/task-035-review.json) |
| `T035-AC-03` [TASK-035](done/tasks_035.md) | ตามตารางหลักฐานในไฟล์งาน | ไม่รีเซ็ตข้ามวัน reload ได้ | [review](evidence/task-035-review.json) |
| `T035-AC-04` [TASK-035](done/tasks_035.md) | ตามตารางหลักฐานในไฟล์งาน | ชั้นสูงปลอดภัย ไม่มีการเร่งความเร็วแฝง | [review](evidence/task-035-review.json) |
| `T036-AC-01` [TASK-036](done/tasks_036.md) | ตามตารางหลักฐานในไฟล์งาน | 3×3 ต่อวัน HP ต่อเนื่อง ไม่คืนสิทธิ์ | [review](evidence/task-036-review.json) |
| `T036-AC-02` [TASK-036](done/tasks_036.md) | ตามตารางหลักฐานในไฟล์งาน | กล่องต่อหลอด หลอดถัดไปเก่งขึ้น | [review](evidence/task-036-review.json) |
| `T036-AC-03` [TASK-036](done/tasks_036.md) | ตามตารางหลักฐานในไฟล์งาน | ตัดวันตาม Asia/Bangkok ฝั่ง server | [review](evidence/task-036-review.json) |
| `T036-AC-04` [TASK-036](done/tasks_036.md) | ตามตารางหลักฐานในไฟล์งาน | ไม่จ่ายซ้ำ ไม่ย้อน client=server | [review](evidence/task-036-review.json) |
| `T037-AC-01` [TASK-037](done/tasks_037.md) | ตามตารางหลักฐานในไฟล์งาน | pool/อัตรา/ราคาตรงข้อมูล | [review](evidence/task-037-review.json) |
| `T037-AC-02` [TASK-037](done/tasks_037.md) | ตามตารางหลักฐานในไฟล์งาน | ตัดเงิน/ได้ของ/pity พร้อมกัน | [review](evidence/task-037-review.json) |
| `T037-AC-03` [TASK-037](done/tasks_037.md) | ตามตารางหลักฐานในไฟล์งาน | seed เดิมผลเดิม ของซ้ำตามกติกา | [review](evidence/task-037-review.json) |
| `T037-AC-04` [TASK-037](done/tasks_037.md) | ตามตารางหลักฐานในไฟล์งาน | pity 10/20/30 counter โหลดกลับได้ | [review](evidence/task-037-review.json) |
| `T038-AC-01` [TASK-038](done/tasks_038.md) | ตามตารางหลักฐานในไฟล์งาน | 1/12/20 ชม. = 3600/43200/43200 ทอง ไม่ปลดด่าน | [review](evidence/task-038-review.json) |
| `T038-AC-02` [TASK-038](done/tasks_038.md) | ตามตารางหลักฐานในไฟล์งาน | รับซ้ำ/cursor เก่า ไม่จ่ายซ้ำไม่ย้อน | [review](evidence/task-038-review.json) |
| `T038-AC-03` [TASK-038](done/tasks_038.md) | ตามตารางหลักฐานในไฟล์งาน | ช่วงออนไลน์/AFK ไม่ทับ ข้ามวันไม่รีเซ็ต | [review](evidence/task-038-review.json) |
| `T038-AC-04` [TASK-038](done/tasks_038.md) | ตามตารางหลักฐานในไฟล์งาน | สูตร pure = settlement จริง เศษครบ | [review](evidence/task-038-review.json) |
| `T038-AC-05` [TASK-038](done/tasks_038.md) | ตามตารางหลักฐานในไฟล์งาน | snapshot freeze ตอนแพตช์/ย้ายด่าน retry ได้ผลเดิม | [review](evidence/task-038-review.json) |
| `T039-AC-01` [TASK-039](done/tasks_039.md) | ตามตารางหลักฐานในไฟล์งาน | flow ผู้เล่นใหม่ครบจาก UI | [review](evidence/task-039-review.json) |
| `T039-AC-02` [TASK-039](done/tasks_039.md) | ตามตารางหลักฐานในไฟล์งาน | สรุปผลแยกเหตุ ไม่ใช้คะแนนพลัง | [review](evidence/task-039-review.json) |
| `T039-AC-03` [TASK-039](done/tasks_039.md) | ตามตารางหลักฐานในไฟล์งาน | ค่าจริง ขาดเน็ตไม่ใช้ทรัพยากร | [review](evidence/task-039-review.json) |
| `T039-AC-04` [TASK-039](done/tasks_039.md) | ตามตารางหลักฐานในไฟล์งาน | เสียง/จอเล็ก/โฟกัส/Hi-class ยังไม่เปิด | [review](evidence/task-039-review.json) |
| `T040-AC-01` [TASK-040](done/tasks_040.md) | ตามตารางหลักฐานในไฟล์งาน | export/restore ได้ค่าครบ | [review](evidence/task-040-review.json) |
| `T040-AC-02` [TASK-040](done/tasks_040.md) | ตามตารางหลักฐานในไฟล์งาน | migrate มี backup ไฟล์เสีย/รุ่นใหม่ไม่ทำเซฟเสีย | [review](evidence/task-040-review.json) |
| `T040-AC-03` [TASK-040](done/tasks_040.md) | ตามตารางหลักฐานในไฟล์งาน | ไม่ข้าม revision/owner ไม่รับ AFK/ของซ้ำ | [review](evidence/task-040-review.json) |
| `T040-AC-04` [TASK-040](done/tasks_040.md) | ตามตารางหลักฐานในไฟล์งาน | เห็นสิ่งที่เปลี่ยน กู้ได้จริง ไม่โชว์สำเร็จก่อน cloud | [review](evidence/task-040-review.json) |
| `T040-AC-05` [TASK-040](done/tasks_040.md) | ตามตารางหลักฐานในไฟล์งาน | compatibility matrix + refund ตามราคาที่จ่าย | [review](evidence/task-040-review.json) |
| `T041-AC-01` [TASK-041](inprogress/tasks_041.md) | all126skilldefs/19jobs/80stages/70cap with26builds | release content complete and roles playable; record fixes, not schema-only claims | ยังไม่ตรวจ implementation |
| `T041-AC-02` [TASK-041](inprogress/tasks_041.md) | levels10/20/40/70, five encounter types, matchedseeds1..500 and equal-spent fixturebank | statpoints34/88/180/258 peractor at eachlevel, budget mismatch rejected, A/B paired inputs/hashes reported | ยังไม่ตรวจ implementation |
| `T041-AC-03` [TASK-041](inprogress/tasks_041.md) | one vs two support with equalstat/skill/gear bank and repeated buffs | report team DPS/uptime/SP/survival/time and uncertainty/outliers; no buff cap inserted to force balance | ยังไม่ตรวจ implementation |
| `T041-AC-04` [TASK-041](inprogress/tasks_041.md) | all8chapterbosses two strategies and Common/no-card reference budgets | measured medianTTK1–6intro/5–35early/20–85later and >=80%success across500seeds and economycheckpoint ranges or documented balance fixes; no one-class/rare-card lock | ยังไม่ตรวจ implementation |
| `T042-AC-01` [TASK-042](todo/tasks_042.md) | coldcache10Mbps100ms, M1/Pixel profiles, release build | bootstrap<=350KiB gzip, firstbattle<=8MiB/10sdesktop15smobile, cached<=3s, selectedpack<=25MiB | ยังไม่ตรวจ implementation |
| `T042-AC-02` [TASK-042](todo/tasks_042.md) | 16actors×40statuses/16VFX,10swarmup+60smeasure then repeated scene switches | framep95<=20/35ms, Chromepeakheap<=160MiB, decodedRGBA<=64MiB, resources unloaded | ยังไม่ตรวจ implementation |
| `T042-AC-03` [TASK-042](todo/tasks_042.md) | same seed before/after render optimization and browser request trace | exact engine/event/metric equality; no404/missing textures | ยังไม่ตรวจ implementation |
| `T042-AC-04` [TASK-042](todo/tasks_042.md) | Vercel actual build/deploy byte report | library/archive absent; declaredbudgets and observed hostlimits both met, no assumed pass | ยังไม่ตรวจ implementation |
| `T043-AC-01` [TASK-043](todo/tasks_043.md) | documented clean build and isolated VercelPreview deployment | reproducible version/manifest, no temp sourcearchives/secrets | ยังไม่ตรวจ implementation |
| `T043-AC-02` [TASK-043](todo/tasks_043.md) | real PreviewURL auth/battle/claim/save/reload/deeplink | complete vertical flow with actual backend, no404 | ยังไม่ตรวจ implementation |
| `T043-AC-03` [TASK-043](todo/tasks_043.md) | Preview/testreset with separate env and callback | production rows unchanged and callback correct | ยังไม่ตรวจ implementation |
| `T043-AC-04` [TASK-043](todo/tasks_043.md) | network trace and deployment metadata | all runtime files localpack, sourcehost0requests, bytes/build/content IDs recorded | ยังไม่ตรวจ implementation |
| `T044-AC-01` [TASK-044](todo/tasks_044.md) | new and migrated/backedup isolated RC saves plus test-only acceleratedfixtures | reach keygates/classes/modes and restore correctly without granting production shortcuts | ยังไม่ตรวจ implementation |
| `T044-AC-02` [TASK-044](todo/tasks_044.md) | alldecisions/cap70/slots/queue/SP/CC/modes/pity/AFK/collision checklist | all invariants pass on exact RCversion; no duplicatedurable rewards | ยังไม่ตรวจ implementation |
| `T044-AC-03` [TASK-044](todo/tasks_044.md) | same full scenario/seed+versions headless vs browser | same state/events/metrics, report provenance retained | ยังไม่ตรวจ implementation |
| `T044-AC-04` [TASK-044](todo/tasks_044.md) | all201AC actual evidence/buglist on RC | no progression blocker/save loss/duplication/user-confirmation conflict unresolved; missing evidence stays notdone | ยังไม่ตรวจ implementation |
| `T044-AC-05` [TASK-044](todo/tasks_044.md) | A01–A08 runtime-owned suites and exact source/build hashes | real boundaries/RLS/receipts/replay/variants/actors/migration/interruption proofs exist; document audit alone insufficient | ยังไม่ตรวจ implementation |
| `T045-AC-01` [TASK-045](todo/tasks_045.md) | production deployment of approved RC with own email account | real URL login/play/save-load works | ยังไม่ตรวจ implementation |
| `T045-AC-02` [TASK-045](todo/tasks_045.md) | production envcheck/manifest/secret scan | production vs Preview isolation, no privileged secret/full library | ยังไม่ตรวจ implementation |
| `T045-AC-03` [TASK-045](todo/tasks_045.md) | postdeploy reversible smoke against realaccount | no404/criticalerror; no synthetic test grants left in actual save | ยังไม่ตรวจ implementation |
| `T045-AC-04` [TASK-045](todo/tasks_045.md) | record build/content/schema/migration + latest backup/compatible rollback exercise | version traceable, rollback does not undo committed wallets; report only tests actually performed | ยังไม่ตรวจ implementation |
| `T046-AC-01` [TASK-046](todo/tasks_046.md) | current runbook from new browser/profile for owner | user canopen/login/find backup/recovery steps | ยังไม่ตรวจ implementation |
| `T046-AC-02` [TASK-046](todo/tasks_046.md) | offline headlessbatch example + replay outlier command | reproducible version/seed results, no production repository invoked | ยังไม่ตรวจ implementation |
| `T046-AC-03` [TASK-046](todo/tasks_046.md) | taskboard001–045+047 evidence hashes and remainingdefects | all prerequisite tasks done with validated ACs; deployment alone does not close release | ยังไม่ตรวจ implementation |
| `T046-AC-04` [TASK-046](todo/tasks_046.md) | M5roadmap and extensionpoints | Hi70/Awaken/Artifact separate; Class3120/Pet/Rune/long-playSim/dashboard explicitly future, not silently shipped | ยังไม่ตรวจ implementation |
| `T048-AC-01` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | HUD สูงไม่เกิน 80px ที่ 390×844 และหน้าหลักมีปุ่มท้าบอสขวาล่างเหนือ bottom bar ที่มี 5 ช่อง (Store/Crafting ล็อก กดแล้วแจ้งเตือน ไม่เปิดหน้า) | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-02` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | ฉากหน้าหลักวน ตี→เดิน ด้วย shared engine และ skin ตามบท โดยไม่ส่ง command และไม่แก้ account state | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-03` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | ท้าบอส→ไฟต์จริง→การ์ดผลลัพธ์รับรางวัลครั้งเดียว→กลับฟาร์ม; หีบ AFK รับฟาร์มกับ claim ที่เกิดใน chain เดียว | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-04` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | หน้า Buddy มีช่อง 3 ซ้าย/3 ขวา, Stats/Skill/Upgrade และแถบตัวละคร 7 ตัว; แตะช่องมี Upgrade (ราคาใช้/มี + ค่าก่อน→หลัง) และ Change (เรียง Level แล้ว Rarity) | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-05` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | หน้า Stats/Skill/Backpack/Team ตามแบบผู้ใช้ทำคำสั่งจริงได้ (ลงแต้ม, อัปเลเวล, [E] ในกระเป๋า, จัดทีม) และไม่มี browser error | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-06` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | 360×740 และ 1280×800 ไม่มี horizontal overflow; deep link `?v=buddy` เปิดหน้าตัวละคร | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-07` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | เว็บเล่นส่วนตัวที่มีเซฟได้ UI ใหม่โดย content_hash/migration/server code เท่าเดิม สำรองฐานข้อมูลก่อน และ revision ไม่เปลี่ยนจากการเปิดดู | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-09` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | (D-052) มือถือแนวนอนแสดงข้อความให้หมุนเครื่องและหยุดวาดฉาก; มือถือแนวตั้งและ desktop ไม่เห็นข้อความนี้ | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-10` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | (D-053, รอบผู้ใช้ทดลอง) ไอคอนอาชีพแสดงข้างชื่อตัวละคร; หน้าจัดทีมเป็นตาราง 2×2 ตรงแนว; หน้าสถิติในไฟต์มีสไตล์; ปุ่มถอยทัพไม่กระพริบระหว่าง boss clock commit | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-11` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | (D-054) "รับทั้งหมด" ทำให้ pending_rewards ว่างแม้มี claim จากการชนะบอส/รางวัล Story ค้าง; WARNING ขึ้นก่อนไฟต์บอส; slider เพลง/เอฟเฟกต์ปรับได้และจำค่า | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-12` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | (D-055) หมวก/ผ้าคลุมที่สวมโผล่บนตัวละครทั้งในฉากต่อสู้และหน้า UI ตาม Tier; content_hash เท่าเดิม และ pack ยังไม่เกินงบ | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-13` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | (D-056) หน้า Status ที่ 390×844 ไม่ต้องเลื่อน; Timeline คิวร่างในหน้าสกิลแสดงทั้งทีม; เมนูดันเจี้ยนเปิด hub 2 โหมด; การ์ดผลลัพธ์เปิดสถิติได้; ปุ่มล่าง 6 ช่อง | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T048-AC-08` [TASK-048](review/tasks_048.md) | ตามตารางหลักฐานในไฟล์งาน | ผู้ใช้ยอมรับหน้าตาและ flow (review ด้วยตาโดยผู้ใช้) | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T049-AC-01` [TASK-049](done/tasks_049.md) | ตามตารางหลักฐานในไฟล์งาน | `stages.json` มี 130 ด่านตาม layout 10/10/10/20×5 บอสท้ายบทอยู่ที่ด่านสุดท้ายของบท ยอด crystal/gold/EXP ต่อบทเท่าเดิม และ `plan/generators/stages.py --legacy --check` ยืนยันว่าสูตรสร้างไฟล์ 8×10 เดิมได้ตรงทุก byte | [review](evidence/task-049-review.json) |
| `T049-AC-02` [TASK-049](done/tasks_049.md) | ตามตารางหลักฐานในไฟล์งาน | Refine ทีละขั้นตามตารางโอกาส; พลาดได้ receipt `REFINE_FAILED` ที่ commit แล้ว เสียราคาขั้นนั้น ระดับไม่ลด และ `refine_failures` เพิ่ม; สำเร็จรีเซ็ตเป็น 0; ผลสุ่มมาจาก seed ฝั่งเซิร์ฟเวอร์และ replay request เดิมไม่สุ่มใหม่ | [review](evidence/task-049-review.json) |
| `T049-AC-03` [TASK-049](done/tasks_049.md) | ตามตารางหลักฐานในไฟล์งาน | แต้ม Status ตามสูตร RO และโบนัสทุก 10 แต้มเข้าค่าพลังผ่าน `resolveStats` ตัวเดียวกับ engine โดย ASPD/ความเร็วร่ายของค่าหลักเดียวกันไม่เปลี่ยน | [review](evidence/task-049-review.json) |
| `T049-AC-04` [TASK-049](done/tasks_049.md) | ตามตารางหลักฐานในไฟล์งาน | M0 checks ทุกตัว + build_manifest + readiness ผ่าน, `npm run check`/build/asset checks/live walkthrough ผ่าน และ UI แสดงโอกาส Refine/ผลพลาด/แต้มตามกติกาใหม่ | [review](evidence/task-049-review.json) |
| `T049-AC-05` [TASK-049](done/tasks_049.md) | ตามตารางหลักฐานในไฟล์งาน | เซฟส่วนตัวเดิมถูกสำรองเป็น `pg_dump` และ JSON ก่อนรีเซ็ต เว็บ 6173 รันกติกาใหม่และผู้เล่นสร้างตัวละครใหม่ได้ | [review](evidence/task-049-review.json) |
| `T050-AC-01` [TASK-050](done/tasks_050.md) | ตามตารางหลักฐานในไฟล์งาน | เซฟกติกาเก่า (งบ Status 5/เลเวล, ไม่มี `refine_failures`, ด่านที่ไม่มีแล้ว) ย้ายแล้วผ่าน `validateAccount`; ของที่เกินงบถูกคืน | [review](evidence/task-050-review.json) |
| `T050-AC-02` [TASK-050](done/tasks_050.md) | ตามตารางหลักฐานในไฟล์งาน | SQL ที่สร้างเพิ่ม 1 revision ต่อเซฟ ลงลายเซ็นตรงกับ API และข้ามเซฟที่เป็นเวอร์ชันปัจจุบัน; state ที่ไม่ผ่านทำให้ทั้งชุดหยุด | [review](evidence/task-050-review.json) |
| `T050-AC-03` [TASK-050](done/tasks_050.md) | ตามตารางหลักฐานในไฟล์งาน | บน instance ชั่วคราว เซฟ #461 (content `65b82feb…`) ย้ายเป็น #462 (content ปัจจุบัน) โหลดผ่านเซิร์ฟเวอร์จริง และส่งคำสั่งต่อได้ (FARM_RESERVED + REWARD_CLAIMED ×4 → #467) โดยไม่มี browser error | [review](evidence/task-050-review.json) |

TASK-015ตรวจจริงแล้ว: [report](evidence/task-015-review.json) 51tests/freshinstall/build/localhost; runtimeACที่ยังไม่รันเหลือ129ข้อ

TASK-016ตรวจจริงแล้ว: [report](evidence/task-016-review.json) 93tests/typecheck/buildผ่าน เหลือ125implementationACยังไม่รัน

TASK-019ตรวจจริงแล้ว: [report](evidence/task-019-review.json) pack/locator/HTTP/buildผ่าน; รวม80ACผ่าน (M0 design67 + implementation13), เหลือ121implementationACยังไม่รัน

TASK-017ผ่าน: [report](evidence/task-017-review.json);84ACผ่าน (M0 design67 + implementation17), เหลือ117implementationACยังไม่รัน

TASK-018ผ่าน [report](evidence/task-018-review.json):89ACผ่าน (M0design67+implementation22), เหลือ112implementationACยังไม่รัน

TASK-020ผ่าน [report](evidence/task-020-review.json):93ACผ่าน (M0design67+implementation26), เหลือ108implementationACยังไม่รัน

TASK-021ผ่าน [report](evidence/task-021-review.json):97ACผ่าน (M0design67+implementation30), เหลือ104implementationACยังไม่รัน การตรวจAuthเป็นบริการจริงแบบself-hostedในเครื่อง ไม่มีhosted/production proof

TASK-020เปิดแก้ regression หัวแยกตามผู้ใช้แล้วผ่านรอบ4: [หลักฐานล่าสุด](evidence/task-020-animation-timeline-review.json) ครอบคลุมหลายเฟรม/Timeline/shared-engine parity;round3คงไว้เป็นประวัติ จำนวนACรวมไม่เปลี่ยน

20ตุลาคม2026: TASK-020ผ่านรอบ5หลังแก้การเคลื่อนTimelineจริง/ROnumbers/focus/projectiles/บอสเดี่ยว/ทดลองSI3s ดู [หลักฐานล่าสุด](evidence/task-020-combat-polish-review.json) 201ACและจำนวนงานไม่เพิ่ม; TASK-022ยังไม่ครบ

20ตุลาคม2026รอบ6: TASK-020ผ่าน [mobile/spatial review](evidence/task-020-mobile-spatial-review.json) หลังยืนยันสกิลทุกระยะ/normalเดินเข้าระยะ เพิ่มphysics/checkpoint/portraitUI/greenheal; 170TStests+4native/6browserchecks/9parityruns จำนวน201ACเท่าเดิม TASK-022ยังไม่ครบ

20ตุลาคม2026รอบ7: [Timeline/caster review](evidence/task-020-timeline-caster-review.json) ตรวจเฉพาะชื่อTimelineแบบย่อและลูกเวทย์ตีปกติ170TStests+3browserchecks/buildผ่าน จำนวนงาน/ACเท่าเดิม ไม่มีการเปลี่ยนกฎต่อสู้

20ตุลาคม2026รอบ8: เพิ่ม canonical DPS/Healing/Tank, native BGM/SFX พร้อม volume และRO Blueแบบmodernตามผู้ใช้ ผ่าน179TStests+4native/5audio-statistics browserchecks/3themes/build ดู [round8](evidence/task-020-audio-statistics-review.json) จำนวน201ACเท่าเดิม;9parityrunsเป็นหลักฐานประวัติรอบ6 ไม่อ้างว่ารันใหม่ในรอบนี้ TASK-022ยังไม่ครบ

20ตุลาคม2026รอบ9: ผู้ใช้ขอไอคอนสกิลใหญ่ไร้กรอบและTimelineไร้เส้นคั่นactor ผ่าน [targeted browser/build review](evidence/task-020-icon-dock-review.json) 3browsercases;engine/renderer sourceไม่เปลี่ยนจึงเก็บ179TS/native/mediaรอบ8เป็นหลักฐานเดิม จำนวนงาน/201ACเท่าเดิม

20ตุลาคม2026รอบ10: [Timeline/casting review](evidence/task-020-timeline-cast-review.json) ตรวจicon+time/rails/softdashedgrid,ASPDเปิดสกิลแรกด้วยmanualbuilds และnativebeginspellactorchannels ผ่าน182TS+4native+29Python/3browserchecks/build จำนวน201ACเท่าเดิม ไม่เพิ่มclassgrowthหรือclaimว่า9browserparityrunsรอบ6รันใหม่

20ตุลาคม2026: TASK-022ผ่านครบ5ACด้วย195tests/build และ real local CAS/rollback/farm/battle/Chrome lost-response/two-tab/offline ตาม [review](evidence/task-022-review.json) ไม่ใช่hostedหรือmode game loopครบ

20ตุลาคม2026 TASK-023ผ่าน4AC: pure progression และ real owner-save/Chrome roster/manual points/refund/Breakthrough/mobile ดู [review](evidence/task-023-review.json)

20ตุลาคม2026 TASK-024ผ่าน4AC: skill price/cap/learnedPassive/loadouts/preview/actualsave/reload/offline ตาม [review](evidence/task-024-review.json) effectsเฉพาะรายสายยังรอTASK-029–034

20ตุลาคม2026 TASK-025ผ่าน4AC: Storybossเดี่ยว/firstclear/farm/actualbuild/prediction/reload-retreat ตาม [review](evidence/task-025-review.json) ข้อแพ้/90sเป็นserver-owned probes;fresh browser flowไม่มีgame grant

20ตุลาคม2026 TASK-026ผ่าน4AC: inventory/gear assignment/lock/salvage/training purchase/central gear+slot compiler ตาม [review](evidence/task-026-review.json) boundary fixturesระบุชัดไม่อ้างเล่นหาได้จริง

20ตุลาคม2026 TASK-027ผ่าน4AC: Refine/Enchant/card/actual-paid compaction+refund receipts ตาม [review](evidence/task-027-review.json) ไม่มีrandomEnchantหรือhiddenbuffcap

20ตุลาคม2026 TASK-028ผ่าน4AC: fusion/tier/protected recipes/fullbag/pending/response loss ตาม [review](evidence/task-028-review.json) ไม่นำgrant fixtureมาอ้างเป็นฟาร์มจริง
| `T051-AC-01` [TASK-051](done/tasks_051.md) | ตามตารางหลักฐานในไฟล์งาน | ร้านค้าหักเงิน/ลิมิตรายวันถูก | [review](evidence/task-051-review.json) |
| `T051-AC-02` [TASK-051](done/tasks_051.md) | ตามตารางหลักฐานในไฟล์งาน | กาชาอุปกรณ์ seed/pity ถูก | [review](evidence/task-051-review.json) |
| `T051-AC-03` [TASK-051](done/tasks_051.md) | ตามตารางหลักฐานในไฟล์งาน | ของกาชาเข้าระบบอุปกรณ์เดิมได้ | [review](evidence/task-051-review.json) |
| `T051-AC-04` [TASK-051](done/tasks_051.md) | ตามตารางหลักฐานในไฟล์งาน | Store บนมือถือผ่าน browser จริง | [review](evidence/task-051-review.json) |
| `T052-AC-01` [TASK-052](done/tasks_052.md) | ตามตารางหลักฐานในไฟล์งาน | แถวตาม rarity ค่าในช่วง deterministic | [review](evidence/task-052-review.json) |
| `T052-AC-02` [TASK-052](done/tasks_052.md) | ตามตารางหลักฐานในไฟล์งาน | เข้า resolveStats ครั้งเดียว ไม่มีความเร็ว | [review](evidence/task-052-review.json) |
| `T052-AC-03` [TASK-052](done/tasks_052.md) | ตามตารางหลักฐานในไฟล์งาน | tier คง/โต ผสมสุ่มใหม่ migration ผ่าน | [review](evidence/task-052-review.json) |
| `T052-AC-04` [TASK-052](done/tasks_052.md) | ตามตารางหลักฐานในไฟล์งาน | UI แสดง option ผ่าน browser | [review](evidence/task-052-review.json) |
| `T053-AC-01` [TASK-053](done/tasks_053.md) | ตามตารางหลักฐานในไฟล์งาน | tier 1/20/40/60 มี 36 ชนิดต่อ tier ครบ 6 ช่อง อาวุธ 2 แบบ ไอคอนจาก RO item ID และ tier 80 อยู่ใน future_definitions ที่ไม่ดรอป/ไม่สุ่ม | [review](evidence/task-053-review.json) |
| `T053-AC-02` [TASK-053](done/tasks_053.md) | ตามตารางหลักฐานในไฟล์งาน | การ์ด 60 ใบแบ่ง tier กาชาและหอคอยให้การ์ด tier เดียวกับบทของผู้เล่น ของเดิมในเซฟใช้ต่อได้ | [review](evidence/task-053-review.json) |
| `T053-AC-03` [TASK-053](done/tasks_053.md) | ตามตารางหลักฐานในไฟล์งาน | Option สุ่ม Rare 1 / Epic 2 / Legendary 3 / Immortal 4 / Supreme 5 ทุกทางที่ของเกิด | [review](evidence/task-053-review.json) |
| `T053-AC-04` [TASK-053](done/tasks_053.md) | ตามตารางหลักฐานในไฟล์งาน | asset pack อยู่ในงบ ตัวตรวจ/เทสต์ทั้งชุดผ่าน และกระเป๋า/ร้านค้าแสดงของใหม่ใน browser test | [review](evidence/task-053-review.json) |
| `T054-AC-01` [TASK-054](review/tasks_054.md) | ตามตารางหลักฐานในไฟล์งาน | ทุก preset ถืออาวุธตาม weapon_compatibility และทุกท่าโจมตีที่ใช้ยังแสดงอาวุธ Monk วน 3 ท่า | ตรวจเองผ่านใน review (ปิดเมื่อ AC-06 ผ่าน); ดู [หลักฐาน](evidence/task-054-presentation.json) |
| `T054-AC-02` [TASK-054](review/tasks_054.md) | ตามตารางหลักฐานในไฟล์งาน | ลูกธนู archer/hunter ทั้งสองเพศออก frame 4 (400 ms) ไม่ใช่ตอนง้าง | ตรวจเองผ่านใน review (ปิดเมื่อ AC-06 ผ่าน); ดู [หลักฐาน](evidence/task-054-presentation.json) |
| `T054-AC-03` [TASK-054](review/tasks_054.md) | ตามตารางหลักฐานในไฟล์งาน | ทุกสกิลที่เริ่มใช้รวมสกิลไม่มีเวลาร่ายแสดงชื่อเหนือผู้ใช้อย่างน้อย 1.5 วินาที | ตรวจเองผ่านใน review (ปิดเมื่อ AC-06 ผ่าน); ดู [หลักฐาน](evidence/task-054-presentation.json) |
| `T054-AC-04` [TASK-054](review/tasks_054.md) | ตามตารางหลักฐานในไฟล์งาน | ตัวเลขดาเมจโค้งขึ้น-ตก-เอียง-หดใน 0.8 วินาที ฝั่งเราโดนตีมีเลขแดง ผูกกับ event จริง | ตรวจเองผ่านใน review (ปิดเมื่อ AC-06 ผ่าน); ดู [หลักฐาน](evidence/task-054-presentation.json) |
| `T054-AC-05` [TASK-054](review/tasks_054.md) | ตามตารางหลักฐานในไฟล์งาน | เอฟเฟกต์ STR จริงเล่นต่อฮิตสำหรับ Bolt/สกิลที่ map, Fire/Cold Bolt ตกจากฟ้า, pack ≤27 MiB raw, first battle ≤8 MiB, เทสต์/build ผ่าน | ตรวจเองผ่านใน review (ปิดเมื่อ AC-06 ผ่าน); ดู [หลักฐาน](evidence/task-054-presentation.json) |
| `T054-AC-06` [TASK-054](review/tasks_054.md) | ตามตารางหลักฐานในไฟล์งาน | ผู้ใช้ตรวจหน้าตาในเกมและยอมรับ | รอผู้ใช้ตรวจภาพ |
| `T055-AC-01` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | ตั้งค่ามีปุ่มรีเซ็ตเซฟที่เปิดฟอร์มพิมพ์ RESET ทันที flow สำรองก่อน/undo เดิมไม่เปลี่ยน | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-02` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | กระเป๋ากรอง Rarity/Level และเลือกย่อยเฉพาะของที่กรอง ไม่สวม ไม่ล็อก | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-03` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | ดันรายวันคงกติกา P-07 ตามผู้ใช้ และบอกชัดเมื่อเลือดต่อจากรอบก่อน | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-04` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | ปุ่ม 1×/2×/4× เซิร์ฟเวอร์ให้เวลา × speed ผ่าน command path ปฏิเสธค่าอื่น ไฟต์จริงเร็วตามที่เลือก | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-05` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | ตัวละคร/มอนใหญ่ขึ้นราว 12% ในฉากบอสและฟาร์ม | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-06` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | ผู้ใช้ลองแล้วยอมรับ | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-07` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | ใส่สกิลแบบเลือกสกิล → สวมใส่/ย้ายช่อง → แตะช่อง บันทึกทันที สลับเมื่อย้าย แทนที่เมื่อเป็นสกิลใหม่ ถอดออกได้ | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-08` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | สถิติแยกรายสกิลแบบซ่อน/แสดง ผลรวมเท่ายอดตัวละคร และหน้าตัวละครเรียงตัวในทีมก่อนพร้อมกรอบเขียว | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |
| `T055-AC-09` [TASK-055](review/tasks_055.md) | ตามตารางหลักฐานในไฟล์งาน | เว็บส่วนตัวเปิดจากมือถือในวง LAN แบบ http ไม่ต้องลงใบรับรอง DB/Auth ยังอยู่ loopback sign-up ปิด fallback crypto/lock ให้ผลเท่าเดิม | ยังไม่ตรวจในเมทริกซ์ (ดูไฟล์งาน) |

21 ตุลาคม 2026 TASK-056: UI กระชับ/เปลี่ยนตัวใน Stats-Skill ผ่านการตรวจอัตโนมัติ ยังรออัปเดตเว็บส่วนตัวและผู้ใช้รับภาพ (AC-06); สถานะรวมยังเป็น review

| `T056-AC-01` [TASK-056](review/tasks_056.md) | isolated Chrome/API/SQL + build ตามไฟล์งาน | หน้าแรกไม่มี `.team-dock`/`.team-mini` และยังเปิดทีม/ตัวละคร/AFK/ท้าบอสได้ | [หลักฐาน](evidence/task-056-compact-ui.json); self-check ผ่าน รอ AC-06 |
| `T056-AC-02` [TASK-056](review/tasks_056.md) | isolated Chrome/API/SQL + build ตามไฟล์งาน | ปุ่มก่อนหน้า/ถัดไปที่ Stats และ Skill วนครบ roster ตามลำดับทีมก่อน อยู่หน้าเดิม URL/ชื่อ/ค่า/สกิลตรงตัว และเปลี่ยนตัวไม่บันทึกเกม | [หลักฐาน](evidence/task-056-compact-ui.json); self-check ผ่าน รอ AC-06 |
| `T056-AC-03` [TASK-056](review/tasks_056.md) | isolated Chrome/API/SQL + build ตามไฟล์งาน | draft Status/เลือกช่องสกิลไม่ติดไปตัวใหม่; จัดคิวและอัปสกิล/Status หลังเปลี่ยนตัวส่งคำสั่งของตัวที่เลือกจริง | [หลักฐาน](evidence/task-056-compact-ui.json); self-check ผ่าน รอ AC-06 |
| `T056-AC-04` [TASK-056](review/tasks_056.md) | isolated Chrome/API/SQL + build ตามไฟล์งาน | ที่ 360×640 และ 390×844 หน้า Stats ปกติแสดงแถวแต้ม/ปุ่มยืนยันครบ และหน้า Skill เห็นคิวสี่ช่องโดยไม่ต้องเลื่อนหน้าหลัก; ทุกหน้าหลักไม่มี horizontal overflow/ปุ่มทับกัน ปุ่มเปลี่ยนตัวแตะได้อย่างน้อย 40×40 CSS px; รายการยาวยังเลื่อนดูครบ | [หลักฐาน](evidence/task-056-compact-ui.json); self-check ผ่าน รอ AC-06 |
| `T056-AC-05` [TASK-056](review/tasks_056.md) | isolated Chrome/API/SQL + build ตามไฟล์งาน | build/type/boundaries และ real local browser ผ่าน ไม่มี browser error; content hash และ API/DB/migrations คงเดิม | [หลักฐาน](evidence/task-056-compact-ui.json); self-check ผ่าน รอ AC-06 |
| `T056-AC-06` [TASK-056](review/tasks_056.md) | isolated Chrome/API/SQL + build ตามไฟล์งาน | ผู้ใช้ยอมรับภาพบนมือถือจริง หลังอัปเดตเว็บส่วนตัวด้วยความยินยอม | รอผู้ใช้ |

21 ต.ค.2026 D-078/079 เพิ่มการตรวจ UI และทรงผมตามอาชีพ; ยังไม่ปิด user visual acceptance

| `T056-AC-07` [TASK-056](review/tasks_056.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | หน้าจอเกมใช้ CSPD แทน Cast Speed ข้อความเลือกไม่ได้ด้วยกดย้ำ/ลาก แต่ช่องกรอกยังพิมพ์แก้ไขได้ | รอรอบตรวจล่าสุด |
| `T056-AC-08` [TASK-056](review/tasks_056.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | ลูกศร SVG อยู่กึ่งกลางปุ่มทั้งสองแกน (คลาด ≤0.5px) ทุกขนาดที่ตรวจ และหน้าแรกไม่มีแถบแนะนำ/เป้าหมายเดิม | รอรอบตรวจล่าสุด |
| `T057-AC-01` [TASK-057](review/tasks_057.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | 19 jobs/36 presets ใช้ human head ที่ resolve ได้ ไม่มีทรงซ้ำระหว่าง job ในเพศเดียวกัน และไม่มี missing dependencies | รอรอบตรวจล่าสุด |
| `T057-AC-02` [TASK-057](review/tasks_057.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | body/head/weapon ประกอบและเล่น ACT idle/walk/attack/hurt/dead ซ้าย/ขวาได้ หัวไม่ลอยหรือแยกจาก body clock; หมวกยังใช้ anchor เดิม | รอรอบตรวจล่าสุด |
| `T057-AC-03` [TASK-057](review/tasks_057.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | menu/avatar และสนามใช้ preset เดียวกัน เลือก Class 2 แล้วยังเห็นทรงประจำ job นั้น | รอรอบตรวจล่าสุด |
| `T057-AC-04` [TASK-057](review/tasks_057.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | importer/library checks/runtime closure/build ผ่าน pack raw ≤27MiB และ content hash เดิม; ไม่เปลี่ยน source media/sidecars หรือสูตร | รอรอบตรวจล่าสุด |
| `T057-AC-05` [TASK-057](review/tasks_057.md) | metadata/native ACT/isolated Chrome ตามไฟล์งาน | อัปเดต compatible snapshot และผู้ใช้ยอมรับภาพจริง โดยเก็บเซฟเดิม | รอรอบตรวจล่าสุด |

| `T056-AC-09` [TASK-056](review/tasks_056.md) | ไฟต์ Daily/Chrome/SQL จริง | แถบสถิติ/Timeline/ความเร็ว/ถอยทัพอยู่ใน boss card เป็นแถวเดียวไม่ชนแถบร่าย ทุกปุ่มทำงานผ่านไฟต์จริง; ไม่มี Emoji ที่มองเห็นใน UI เกมและชีต ใช้ SVG/native icons แทน | รอรอบตรวจล่าสุด |

21 ต.ค.2026: TASK-056 รอบ D-077/078/080 ผ่าน isolated Chrome/API/SQL รวม 30 layouts + Daily จริง; TASK-057 ผ่าน 36 unique head presets/3,420 native samples/library checks/งบ pack แยก review รอการอัปเดต 6173 และ user visual acceptance


## Cloud transfer และรอบบันทึกต่อสู้เพิ่มเติม

| Case / Task | วิธีตรวจ | ผลคาดหวัง | สถานะ |
| --- | --- | --- | --- |
| `T058-AC-01` [TASK-058](inprogress/tasks_058.md) | signed fixture/operator SQL/private helper/hosted ตามเกณฑ์ในงาน | source tip ถูกต้อง → state/hash/revision คงเดิมและ signature ผูก target UID; source เสีย/ผิด version/active battle ถูกปฏิเสธ | ยังไม่ครบ hosted |
| `T058-AC-02` [TASK-058](inprogress/tasks_058.md) | signed fixture/operator SQL/private helper/hosted ตามเกณฑ์ในงาน | SQL รันใน project/account ที่ถูกต้องและว่าง → atomic save/history/receipt; ผิด marker/ไม่มี Auth user/มีเซฟแล้ว/collision ล้มโดยไม่ทับ; ส่งซ้ำหลังเล่นต่อไม่ย้อนเซฟ | ยังไม่ครบ hosted |
| `T058-AC-03` [TASK-058](inprogress/tasks_058.md) | signed fixture/operator SQL/private helper/hosted ตามเกณฑ์ในงาน | helper เก็บ backup/context/SQL/key file ไว้ใน .local ด้วย private permissions ไม่แก้ source DB และไม่พิมพ์ secrets/state หรือส่งขึ้น Git | ยังไม่ครบ hosted |
| `T058-AC-04` [TASK-058](inprogress/tasks_058.md) | signed fixture/operator SQL/private helper/hosted ตามเกณฑ์ในงาน | fresh PostgreSQL fixture ใช้ migrations จริง นำเข้าแล้ว API checkpoint ตรวจ signature ผ่านและคำสั่งถัดไปบันทึกได้; AFK cursor/ledger/pending rewards รักษาไว้ | ยังไม่ครบ hosted |
| `T058-AC-05` [TASK-058](inprogress/tasks_058.md) | signed fixture/operator SQL/private helper/hosted ตามเกณฑ์ในงาน | hosted Supabase/Vercel จริงใช้ sign-in ไม่มี sign-up บัญชีปลายทางเห็นเซฟเดิมและเล่นต่อ/reload ได้ โดยตรวจ source/target summary และเก็บ source backup | ยังไม่ครบ hosted |
| `T058-AC-06` [TASK-058](inprogress/tasks_058.md) | replacement unit/PostgreSQL9กลุ่ม/actualsourceexport | exact idle revision1/hash/content/HMACก่อนarchive; rollback/replay/Authprivacy/frozenvalidatorตรงรุ่น | ผ่าน local operator evidence; ยังไม่เขียนcloud |
| `T059-AC-01` [TASK-059](done/tasks_059.md) | scheduler/sharedAPI/isolatedChrome | 4s request cadence/latency/continuous prediction/single writer | ผ่าน tests32ข้อ/Chrome4กลุ่ม/build contenthashเดิม |
| `T059-AC-02` [TASK-059](done/tasks_059.md) | scheduler/sharedAPI/isolatedChrome | speed1/2/4/settlement/one reward | ผ่าน tests32ข้อ/Chrome4กลุ่ม/build contenthashเดิม |
| `T059-AC-03` [TASK-059](done/tasks_059.md) | scheduler/sharedAPI/isolatedChrome | offline/reconnect/refresh/immediate player commands/content hash | ผ่าน tests32ข้อ/Chrome4กลุ่ม/build contenthashเดิม |
| `T060-AC-01` [TASK-060](done/tasks_060.md) | Unit/sharedAPI/isolatedChromeตามงาน | ไฟต์ยาว>15sและเปลี่ยนความเร็วระหว่างไฟต์ → revision/checkpointยังอยู่จุดเริ่มและไม่มีPOSTกลางไฟต์; จบส่งfinishครั้งเดียว/ผลตรงsharedreplay | ผ่าน45tests/Chrome/API/SQL/build/hostedsmoke ไม่ใช่ownercloudproof |
| `T060-AC-02` [TASK-060](done/tasks_060.md) | Unit/sharedAPI/isolatedChromeตามงาน | Story/Tower/daily win/loss/timeoutและmanualretreat → rewards/HP/chests/day/attemptsถูกต้อง; tooearly/expired/foreign/forged fieldsไม่จ่าย; receipt replay/response lossไม่จ่ายซ้ำ | ผ่าน45tests/Chrome/API/SQL/build/hostedsmoke ไม่ใช่ownercloudproof |
| `T060-AC-03` [TASK-060](done/tasks_060.md) | Unit/sharedAPI/isolatedChromeตามงาน | offline/refreshไม่จำลองบอสย้อนหลัง; pure engineยังแยกจากnetwork; tests/build/schema/migrationผ่านและdeployตรวจbundleจริงโดยไม่แตะเซฟส่วนตัว | ผ่าน45tests/Chrome/API/SQL/build/hostedsmoke ไม่ใช่ownercloudproof |
| `T061-AC-01` [TASK-061](done/tasks_061.md) | Unit/sharedAPI/isolatedChromeตามงาน | เริ่มใหม่จากเซฟมีdailyprogress → rosterLv1/Storyใหม่และdaily_recordsว่าง มีbackupก่อนและredo receiptไม่ทำซ้ำ; restoreยังมีcountersจากเกมที่กู้ | ผ่าน45tests/Chrome/API/SQL/build/hostedsmoke ไม่ใช่ownercloudproof |
| `T061-AC-02` [TASK-061](done/tasks_061.md) | Unit/sharedAPI/isolatedChromeตามงาน | locked legacy reset saveมีdailyprogress → previewไม่เขียน; migrateมีbackupก่อนแล้วล้างเฉพาะdailycarryover ตัวละคร/เงิน/ของ/Story/Towerเดิม; unlocked saveคงdailyprogress | ผ่าน45tests/Chrome/API/SQL/build/hostedsmoke ไม่ใช่ownercloudproof |
| `T061-AC-03` [TASK-061](done/tasks_061.md) | Unit/sharedAPI/isolatedChromeตามงาน | build/migration testsผ่านและเผยแพร่บนVercel ไม่มีการอ่านloginหรือแก้DB6173 และไม่อ้างว่าซ่อมcloudsaveก่อนเจ้าของกดmigration | ผ่าน45tests/Chrome/API/SQL/build/hostedsmoke ไม่ใช่ownercloudproof |
| `T062-AC-01` [TASK-062](done/tasks_062.md) | productionChrome/SW/CDP/build/hostedreadonly | manifestถูกต้อง start_url/play, standalone, portrait, icons192/512/maskableและApple180; Chromeอ่านmanifest/workerได้ ไม่มีinstallabilityerrorที่เกิดจากartifact | ผ่านChrome6กลุ่ม/build/readiness8/hosted3กลุ่ม ไม่มีownerwrite |
| `T062-AC-02` [TASK-062](done/tasks_062.md) | productionChrome/SW/CDP/build/hostedreadonly | offline navigationได้หน้ารอเชื่อมต่อ; onlineAPIยังผ่านnetworkและไม่cacheแม้GET/privateheader; authcallbackไม่ถูกเก็บ; SWupdateไม่auto reloadและไม่แตะlocalStorage/เซฟ | ผ่านChrome6กลุ่ม/build/readiness8/hosted3กลุ่ม ไม่มีownerwrite |
| `T062-AC-03` [TASK-062](done/tasks_062.md) | productionChrome/SW/CDP/build/hostedreadonly | installbuttonใช้usergestureกับdeferredpromptครั้งเดียว; iOS/manualguideใช้งานได้; standaloneไม่โชว์ปุ่มซ้ำ; safe-areaมือถือไม่ล้น | ผ่านChrome6กลุ่ม/build/readiness8/hosted3กลุ่ม ไม่มีownerwrite |
| `T062-AC-04` [TASK-062](done/tasks_062.md) | productionChrome/SW/CDP/build/hostedreadonly | build/type/boundaries/secretguardผ่าน contenthash768e12a4เดิม; Vercelmanifest/worker/icons/headersจริงผ่านโดยไม่มีownercloudwrite/6173restart | ผ่านChrome6กลุ่ม/build/readiness8/hosted3กลุ่ม ไม่มีownerwrite |
| `T063-AC-01` [TASK-063](done/tasks_063.md) | sharedAPI/controller/isolatedChrome/build/hostedreadonly | confirmedcommandบนsharedpathใช้POSTเดียวในกรณีปกติ ได้DBverifiedcheckpointโดยไม่GETreceipt/checkpointซ้ำ; legacyfallbackไม่lookupknownreceipt | ผ่าน37tests/Chrome8กลุ่ม/build/readiness8/hosted3 ไม่มีownerwrite |
| `T063-AC-02` [TASK-063](done/tasks_063.md) | sharedAPI/controller/isolatedChrome/build/hostedreadonly | UUIDpersistก่อนส่ง, response loss/retryจ่ายครั้งเดียว; wrongowner/stalerevision/hash/schema/signatureและoffline/readonlyไม่ถูกยอมรับ; recovery/migration/battleยังถูกต้อง | ผ่าน37tests/Chrome8กลุ่ม/build/readiness8/hosted3 ไม่มีownerwrite |
| `T063-AC-03` [TASK-063](done/tasks_063.md) | sharedAPI/controller/isolatedChrome/build/hostedreadonly | actualisolatedAuth/Postgres/Chromeทดสอบหลายmutationและnetworkdelay วัดrequestcount/latencyก่อนหลังด้วยbudgetเดียวกัน ไม่ใช้ownercloudsave | ผ่าน37tests/Chrome8กลุ่ม/build/readiness8/hosted3 ไม่มีownerwrite |
| `T063-AC-04` [TASK-063](done/tasks_063.md) | sharedAPI/controller/isolatedChrome/build/hostedreadonly | build/type/boundaries/secretsผ่าน contenthash768e12a4เดิม; deployedAPIมีServer-Timing/region และhostedsmokeผ่าน ไม่เพิ่มSQL/envหรือrestart6173 | ผ่าน37tests/Chrome8กลุ่ม/build/readiness8/hosted3 ไม่มีownerwrite |
| `T064-AC-01` [TASK-064](inprogress/tasks_064.md) | sharedsave/freshDB/actualmobileclick/heldrequest/build/hostedreadonly | ordinaryrecurringcommandใช้RPC2รอบ(+Auth1) ไม่มีreceiptassert/load/reloadHTTPซ้ำ และcheckpointมาจากDBtransactionจริง | 20targeted/Chrome6กลุ่ม/build/readiness8/hosted3ผ่าน; cloudSQL007ยังไม่ติดตั้ง |
| `T064-AC-02` [TASK-064](inprogress/tasks_064.md) | sharedsave/freshDB/actualmobileclick/heldrequest/build/hostedreadonly | displaypreviewไม่เปลี่ยนcheckpoint/backup; response lossคืนค่าที่แสดงและreconcileUUIDเดิมไม่หักซ้ำ; optionalRPCหายใช้legacyได้ แต่DBerrorไม่fallbackเขียนซ้ำ และใช้transaction/guardsเดิมโดยไม่เขียนเซฟเจ้าของ | 20targeted/Chrome6กลุ่ม/build/readiness8/hosted3ผ่าน; cloudSQL007ยังไม่ติดตั้ง |
| `T064-AC-03` [TASK-064](inprogress/tasks_064.md) | sharedsave/freshDB/actualmobileclick/heldrequest/build/hostedreadonly | actualmobileUIกดอัป+1แสดงLv.11ก่อนปล่อยserverrequestที่holdไว้ ภายใน1sรวมautomationบนCPUthrottle4×; ปล่อยrequestแล้วsave/reloadยังLv.11 พร้อมServer-TimingแยกDB/compute ไม่มีownerdata | 20targeted/Chrome6กลุ่ม/build/readiness8/hosted3ผ่าน; cloudSQL007ยังไม่ติดตั้ง |
| `T064-AC-04` [TASK-064](inprogress/tasks_064.md) | sharedsave/freshDB/actualmobileclick/heldrequest/build/hostedreadonly | build/type/boundaries/secrets/contenthashเดิม/hostedsmokeผ่าน ผู้ใช้ติดตั้งSQL007และมีหลักฐานfastpathบนcloudก่อนdone ไม่อ้างผลlocalhostแทนมือถือจริง | 20targeted/Chrome6กลุ่ม/build/readiness8/hosted3ผ่าน; cloudSQL007ยังไม่ติดตั้ง |
| `T065-AC-01` [TASK-065](done/tasks_065.md) | actualSDKES256/JWKScounter+freshHS256Auth+build+hostedreadonly | actual SDK ES256 verification ใช้ JWKS HTTP1ครั้งแล้วคำขอถัดไปไม่ติดต่อ Auth; verified identityถูกต้อง และผิด signature/expiry/issuer/audience/roleไม่ยอมรับ | ผ่าน SDK/local/build/hostedจริง |
| `T065-AC-02` [TASK-065](done/tasks_065.md) | actualSDKES256/JWKScounter+freshHS256Auth+build+hostedreadonly | local HS256 upstream Auth/PostgREST API sign-in/owner-save/retryยังผ่านด้วย SDKfallback และไม่มี ownercloudwrite/6173restart | ผ่าน SDK/local/build/hostedจริง |
| `T065-AC-03` [TASK-065](done/tasks_065.md) | actualSDKES256/JWKScounter+freshHS256Auth+build+hostedreadonly | build/type/boundaries/secretsผ่าน contenthashเดิม; โค้ดขึ้น Vercelและpublicsmokeผ่าน ไม่มีenv/SQLใหม่ ไม่อ้างตัวเลขphoneที่ยังไม่วัด | ผ่าน SDK/local/build/hostedจริง |
| `T066-AC-01` [TASK-066](done/tasks_066.md) | realChrome/freshAuthDB/targetedproof/build/hostedreadonly | มีbefore/afterclick→paintของเมนูหลัก, Stats/Skills และสลับตัวละครบนCPU4×; median/p95ดีขึ้นโดยไม่มีAPIrequestเพื่อnavigate | ผ่าน matchedChrome/local saves/build/hostedจริง ไม่มีownerwrite |
| `T066-AC-02` [TASK-066](done/tasks_066.md) | realChrome/freshAuthDB/targetedproof/build/hostedreadonly | เปลี่ยนตัว/อัปเกรด/เซฟ/เปลี่ยนของแล้วยังเห็นค่าปัจจุบัน ไม่ใช้ข้อมูลเก่า และไม่มีlayout/consoleerrorใหม่ | ผ่าน matchedChrome/local saves/build/hostedจริง ไม่มีownerwrite |
| `T066-AC-03` [TASK-066](done/tasks_066.md) | realChrome/freshAuthDB/targetedproof/build/hostedreadonly | build/type/boundaries/secretsผ่าน contenthashเดิมถ้ากติกาไม่เปลี่ยน โค้ดขึ้นVercelพร้อมpublicsmoke; แยกfixturemetricsกับมือถือจริง | ผ่าน matchedChrome/local saves/build/hostedจริง ไม่มีownerwrite |
| `T067-AC-01` [TASK-067](inprogress/tasks_067.md) | realChrome/freshAuthDB/targetedproof/build/hostedreadonly | ทุกfinalremainder1–49msของ60/90sเดินถึงdeadline; actualdailyUIจบและส่งfinishครั้งเดียว ไม่ค้าง/ไม่retreatเอง | กำลังตรวจ ไม่มีownerwrite |
| `T067-AC-02` [TASK-067](inprogress/tasks_067.md) | realChrome/freshAuthDB/targetedproof/build/hostedreadonly | finish/reload/recoveryไม่เสียสิทธิ์เพิ่มและไม่รับรางวัลซ้ำ; targetedchecks/build/contenthashเดิมผ่าน และdeploy/publicsmokeจริง | กำลังตรวจ ไม่มีownerwrite |
| `T067-AC-03` [TASK-067](inprogress/tasks_067.md) | realChrome/freshAuthDB/targetedproof/build/hostedreadonly | ผู้ใช้ได้คืนสิทธิ์รอบเสียที่ระบุ โดยมีbackup/receiptและไม่เปลี่ยนความก้าวหน้าหรือดันอื่น; ถ้ายังทำไม่ได้ระบุข้อมูล/การเข้าถึงที่ขาด ไม่อ้างคืนแล้ว | กำลังตรวจ ไม่มีownerwrite |

| `T068-AC-01` [TASK-068](done/tasks_068.md) | focused sphere/status + mobileChrome/migration/build/hosted | ลูกบอลจริง0–5ให้ATK+0–5%ในbucketเดิม; cast snapshotหลังจ่าย1/5ลูกถูกต้อง, interruptionไม่คืน, reviveไม่มีโบนัสค้าง และUIเพิ่ม/ลดจำนวนตามengine | ผ่าน14targeted/Chrome4กลุ่ม/build/migration/hosted3 ไม่รันbalance simulation |
| `T068-AC-02` [TASK-068](done/tasks_068.md) | focused sphere/status + mobileChrome/migration/build/hosted | Buff/Debuff/shieldแสดงicon/stack/expiry/sourceถูกต้อง, independentstacksไม่ถูกรวมเวลา/หายก่อนหมด, หมด/cleanse/dispelแล้วหาย; มือถือ320/390pxไม่ล้นและแตะอ่านได้ | ผ่าน14targeted/Chrome4กลุ่ม/build/migration/hosted3 ไม่รันbalance simulation |
| `T068-AC-03` [TASK-068](done/tasks_068.md) | focused sphere/status + mobileChrome/migration/build/hosted | targeted unit/UI/build/migrationผ่าน, ไม่รันbalance simulation, ขึ้นGitHub/Vercelพร้อมpublicproofและแจ้งวิธีbacked-up save updateเมื่อcontenthashเปลี่ยน ไม่แตะเซฟ6173หรือownercloudwrite | ผ่าน14targeted/Chrome4กลุ่ม/build/migration/hosted3 ไม่รันbalance simulation |

| `T069-AC-01` [TASK-069](done/tasks_069.md) | focusedrules/staticmath/mobileChrome/build/hosted | ทุกระดับของ3สกิลได้coefficientsตามข้างต้นและgolden intentsตรง; ค่าใช้จ่าย/timing/hits/crit/armorและสกิลอื่นไม่เปลี่ยน, ไม่คูณโบนัสซ้ำในpipeline | ผ่าน19targeted/Chrome4/staticmath/build/hosted3 ไม่รันbalance simulation |
| `T069-AC-02` [TASK-069](done/tasks_069.md) | focusedrules/staticmath/mobileChrome/build/hosted | sharedengineใช้ATKหลังหักบอลและSPก่อนหักสำหรับAsuraจริง; บอลไม่พอข้าม/ถูกขัดไม่คืนหรือสร้างdamage; หน้าสกิลแสดงcoefficientsใหม่และจำนวนhit, existingbackup/migrationchecksผ่าน | ผ่าน19targeted/Chrome4/staticmath/build/hosted3 ไม่รันbalance simulation |
| `T069-AC-03` [TASK-069](done/tasks_069.md) | focusedrules/staticmath/mobileChrome/build/hosted | มีmanualcost/powerreviewพร้อมสมมติฐานและข้อจำกัด ไม่รันbalance simulation; build/type/content/boundaries/secretsและhostedproofผ่าน, packเดิม/ไม่มีSQL/envใหม่ ไม่อ้างว่าบาลานซ์พิสูจน์ครบหรือเขียนเซฟเจ้าของแล้ว | ผ่าน19targeted/Chrome4/staticmath/build/hosted3 ไม่รันbalance simulation |
| `T069-AC-04` [TASK-069](done/tasks_069.md) | focusedrules/staticmath/mobileChrome/build/hosted | บัฟ/ดีบัฟicon18px, ใช้CallSpirits iconแทนวงกลมในcounter/party/details, ไม่มีstatuscontrols/iconsในfarm; bossstatusและcastอยู่นอกmainbarและความสูงmainbarไม่เปลี่ยนระหว่างสถานะ/cast, มือถือ320/390pxไม่มีoverlap/overflow รายละเอียดsource/expiry/stackยังอ่านได้ | ผ่าน19targeted/Chrome4/staticmath/build/hosted3 ไม่รันbalance simulation |

| `T070-AC-01` [TASK-070](done/tasks_070.md) | recordedtrace/mobileChrome/build/hosted | ประวัติมาจาก events ที่เล่นแล้วเท่านั้น; เวลา/slot/resolve/interrupt/skip/ผู้ขัดถูกต้อง รวม instant/equal-time/pendingตอนจบ; ไม่มี future events/การรัน engine จากการเปิดประวัติ/confirm log ซ้ำ | ผ่าน3targeted/Chrome4/build/hosted3 ไม่มีextra save/forecast |
| `T070-AC-02` [TASK-070](done/tasks_070.md) | recordedtrace/mobileChrome/build/hosted | ผล Story/Tower/Daily มีปุ่ม Timeline ย้อนหลัง; เลื่อนต้น→กลาง→ท้ายและซูมได้ ชื่อแถวยังคงอยู่; เลือกสกิลดูผล/เวลาและ Log เรียงตามเวลา กรองตัวละครได้; ปิดกลับผลเดิมโดยไม่เริ่มไฟต์หรือรับรางวัล | ผ่าน3targeted/Chrome4/build/hosted3 ไม่มีextra save/forecast |
| `T070-AC-03` [TASK-070](done/tasks_070.md) | recordedtrace/mobileChrome/build/hosted | Chrome มือถือ320/390px ใช้ touch scroll ได้ ไม่มีหน้าเว็บล้น; actual terminal→review ไม่เพิ่ม commands/revision/daily quota รักษา result และ statistics เดิม; ระบุว่าเป็นประวัติไฟต์นี้ในหน่วยความจำ | ผ่าน3targeted/Chrome4/build/hosted3 ไม่มีextra save/forecast |
| `T070-AC-04` [TASK-070](done/tasks_070.md) | recordedtrace/mobileChrome/build/hosted | targeted tests/build/type/boundaries/content/hostedผ่าน content/packเดิม ไม่มีSQL/env/migration/ownerwrite/restart6173 และไม่รัน balance simulation ใหม่ | ผ่าน3targeted/Chrome4/build/hosted3 ไม่มีextra save/forecast |

| `T071-AC-01` [TASK-071](done/tasks_071.md) | physicalHoT/lifecycle/Chrome/build/hosted | Bard/Dancer Healing Song ทุกระดับใช้ P.ATK ผ่าน shared raw/heal pipeline ไม่มีarmor/critแบบdamage; ค่าอื่น/MusicLesson/stackingเดิม และ Priest Sanctuary ยังใช้ MATK | ผ่าน8targeted/Chrome4/M0/build/hosted3 ไม่มีextra save/balance simulation |
| `T071-AC-02` [TASK-071](done/tasks_071.md) | physicalHoT/lifecycle/Chrome/build/hosted | live aura มีเฉพาะผู้รับที่ยังมีชีวิตและมีperiodic healที่ยังactive หายเมื่อหมด/ล้าง/ตาย; มากกว่าหนึ่งinstanceยังทำงาน/หมดเวลาแยกตามเดิม ไม่มี extra heal/status/DBwriteจากrenderer; reduced motionใช้ภาพนิ่ง | ผ่าน8targeted/Chrome4/M0/build/hosted3 ไม่มีextra save/balance simulation |
| `T071-AC-03` [TASK-071](done/tasks_071.md) | physicalHoT/lifecycle/Chrome/build/hosted | หน้าskill/statusอธิบายฐานP.ATKจริง; focusedmath/lifecycle/rendererและactualChromeภาพ/expiryผ่าน, เพลงสองอาชีพค่าเท่ากัน ไม่รันbalance simulationหรือเปลี่ยนตัวคูณพร้อมกัน | ผ่าน8targeted/Chrome4/M0/build/hosted3 ไม่มีextra save/balance simulation |
| `T071-AC-04` [TASK-071](done/tasks_071.md) | physicalHoT/lifecycle/Chrome/build/hosted | M0/content/schema/build/type/boundaries/secrets/hostedผ่าน ไม่มีSQL/env/newmedia/ownerwrite/restart6173; แยกcontenthashใหม่จากTASK-070และใช้existingbackup-before-migrate ไม่อ้างว่าอัปเดตเซฟเจ้าของแล้ว | ผ่าน8targeted/Chrome4/M0/build/hosted3 ไม่มีextra save/balance simulation |

| `T072-AC-01` [TASK-072](done/tasks_072.md) | focusedheal/interrupt/staticbudget/Chrome/build/hosted | เพลงทั้งสองอาชีพทุกระดับมีopening60–100%และHoT30–50% P.ATK/5ticksใน6s; openingเกิดเมื่อร่ายสำเร็จเท่านั้น ใช้sharedheal/bonus/overhealและstackเดิม ไม่เพิ่มtickหรือฮีลเมื่อถูกขัด | ผ่าน6focused/Chrome4/static18/M0/build/hosted3 ไม่มีbalance runner |
| `T072-AC-02` [TASK-072](done/tasks_072.md) | focusedheal/interrupt/staticbudget/Chrome/build/hosted | UIแสดงopening P.ATKและHoTแยกชัด; actualChromeแสดงhealของเพลงตรงcastresolveก่อนtickแรก วงยังอยู่ตามstatus/หมดแล้วหาย ไม่มีextra saveจากภาพ | ผ่าน6focused/Chrome4/static18/M0/build/hosted3 ไม่มีbalance runner |
| `T072-AC-03` [TASK-072](done/tasks_072.md) | focusedheal/interrupt/staticbudget/Chrome/build/hosted | focusedchecks/6goldens/M0/build/type/boundaries/secrets/hostedผ่าน; staticcost/burst/totalcomparisonระบุassumptions ไม่รันbalance simulation/ไม่อ้างwholegamebalance ไม่มีSQL/env/newassets/ownerwritesหรือrestart6173 | ผ่าน6focused/Chrome4/static18/M0/build/hosted3 ไม่มีbalance runner |

| `T073-AC-01` [TASK-073](done/tasks_073.md) | card/farm/migration/mobileUI/build/hosted | 66ใบมีชื่อมอนสเตอร์ RO / ROitemID / monsterID / sourcegradeและlocalcardartถูกตัว ไม่มีชื่อสมมติหรือskillsymbol; sourceกับadaptationแยกชัด และMVP/Miniไม่จัดจากการเดาชื่อ | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |
| `T073-AC-02` [TASK-073](done/tasks_073.md) | card/farm/migration/mobileUI/build/hosted | ฟาร์มออนไลน์/AFKได้การ์ดตามseededreservation/5minroll/profileของด่าน; ด่านหลังเปิดpool/qualityดีขึ้น โอกาสถูกแสดงตามdata; splitinterval/12hcap/retry/fullbag/oldpendingไม่จ่ายซ้ำหรือreroll | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |
| `T073-AC-03` [TASK-073](done/tasks_073.md) | card/farm/migration/mobileUI/build/hosted | การ์ดเดิมทั้ง60IDsยังอยู่ level/quality/lock/inventoryไม่หาย; migrationถอดเฉพาะใบที่ช่องไม่ตรงกลับกระเป๋า snapshotเก่าไม่retroactiveดรอป และeffect/triggerที่เพิ่มทำงานในsharedpipeline | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |
| `T073-AC-04` [TASK-073](done/tasks_073.md) | card/farm/migration/mobileUI/build/hosted | UIเห็นภาพจริง/ชื่อ/Normal-Mini-MVP/slot/ผล ทั้งbag/slot/gacha/reward; actualChrome claimและใส่การ์ดผ่าน M0/assets/build/type/boundaries/secrets/hosted ไม่มีownerwrite/6173restart/balance simulation Rawpack≤32MiBและinitial≤8MiB | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |
| `T074-AC-01` [TASK-074](done/tasks_074.md) | card/farm/migration/mobileUI/build/hosted | Optionทุกบรรทัดแยกlabel/valueและมีสีชัดทั้งรายละเอียดในbag/ช่องอุปกรณ์/เลือกเปลี่ยนของ ค่าตรงsharedmodifierเดิม ไม่เปลี่ยนroll/เซฟ หน้า320/390pxไม่ล้นและไม่มีemojiใหม่ | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |
| `T074-AC-02` [TASK-074](done/tasks_074.md) | card/farm/migration/mobileUI/build/hosted | หน้าเลือกอาวุธแสดงเฉพาะfamilyที่jobใส่ได้ แม้ของต่างfamilyจะlevelสูง/อยู่กับเพื่อน; ของfamilyถูกแต่levelสูงยังบอกเงื่อนไขได้ สลับตัวละคร/คลาสแล้วfilterตรง ใส่และreloadค่าตรง | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |
| `T074-AC-03` [TASK-074](done/tasks_074.md) | card/farm/migration/mobileUI/build/hosted | actualisolatedmobileChrome/productionbuild/type/boundaries/secrets/hostedผ่าน ไม่มีSQL/env/ownerwrite/restart6173หรือเพิ่มAPIจากการดู/กรอง | ผ่าน implementation/actual mobile/hosted · ดู task-073/074-review.json |

| `T075-AC-01` [TASK-075](done/tasks_075.md) | browserHTTPcache/headers/build/hosted | `/ro/manifest.json` และqueryvariantsบนproductionเป็นno-store; hashedmedia/metadataยังimmutableและexactbytesเดิม Headerpatternไม่ครอบstablemanifest | ผ่าน actualHTTPcache/hosted · task-075-review.json |
| `T075-AC-02` [TASK-075](done/tasks_075.md) | browserHTTPcache/headers/build/hosted | Chromeที่มีoldmanifestfreshimmutableอยู่ในHTTPcacheยังโหลดexpectedcurrentpack/scene/nativecardได้โดยไม่clearcache/storage และreloadอีกครั้งได้; wrongpackhashยังreject ไม่มีgameplay/content/schema/packhashเปลี่ยน | ผ่าน actualHTTPcache/hosted · task-075-review.json |
| `T075-AC-03` [TASK-075](done/tasks_075.md) | browserHTTPcache/headers/build/hosted | build/type/boundaries/secrets/targetedchecksและactualhostedmobileassets startupผ่าน พร้อมบันทึกrootcause/ข้อจำกัด ไม่เขียนownerเซฟ/ไม่restart6173 | ผ่าน actualHTTPcache/hosted · task-075-review.json |

| `T076-AC-01` [TASK-076](done/tasks_076.md) | element/projection/mobile/build/hosted | ป้าย/คำอธิบายตรง authored skill effects ทั้ง126ท่า รวม Fire/Cold Bolt, Storm Gust, Envenom, Falcon, Auto Bolt, Hell Plant, Detonate, Heal/Healing Song; หลายธาตุแยกชัดและ graph มี cycle ไม่วนไม่จบ | ผ่าน local/actualhosted · task-076-review.json |
| `T076-AC-02` [TASK-076](done/tasks_076.md) | element/projection/mobile/build/hosted | เกราะบอสตรง checkpoint ทุกโหมดและ priority card/source ล่าสุด→enemy tag→Neutral; Fire Endow เปลี่ยนธาตุอาวุธแต่ไม่เปลี่ยนเกราะหรือ fixed spell; projection ไม่แก้ state/RNG/timing/damage | ผ่าน local/actualhosted · task-076-review.json |
| `T076-AC-03` [TASK-076](done/tasks_076.md) | element/projection/mobile/build/hosted | UI จริงบน mobile Chrome320/390px อ่านธาตุสกิล/บอสได้ ไม่ล้น ไม่ต้องบันทึกเมื่อเปิดดู และไม่มี browser error; ตรวจภาพจริง | ผ่าน local/actualhosted · task-076-review.json |
| `T076-AC-04` [TASK-076](done/tasks_076.md) | element/projection/mobile/build/hosted | build/type/boundaries/secrets ผ่าน content/packhashเดิม; push/deploy และ public smoke ผ่าน ไม่มี SQL/env/migration/owner-write/6173restart/balance simulation | ผ่าน local/actualhosted · task-076-review.json |

| `T077-AC-01` [TASK-077](done/tasks_077.md) | static/engine/source/migration/mobile/hosted | สกิลโจมตีทุกอาชีพรวมPassive/DoT/copy/summonและdamage procการ์ดใช้สัดส่วนพลังกลางเดียวกัน มีตารางก่อน/หลังตามCT/SP/hit/เป้า; utility/heal072/คิว/CC/stackและด่านเดิมคงไว้ | ผ่าน local/actualhosted · task-077-review.json |
| `T077-AC-02` [TASK-077](done/tasks_077.md) | static/engine/source/migration/mobile/hosted | skill/normalโบนัสเลือกชนิดการโจมตีถูกและรวม additiveกับoutgoingเดิมครั้งเดียว; periodic/passive/summonรับค่าตามsnapshot; item/cardprocไม่รับ skillbonusซ้ำ; default0เก่าไม่เปลี่ยนdamage/crit/เกราะ/ธาตุ/regen และhealไม่ถูกคูณ | ผ่าน local/actualhosted · task-077-review.json |
| `T077-AC-03` [TASK-077](done/tasks_077.md) | static/engine/source/migration/mobile/hosted | gear variantและoptions/cardเลือกเสริมคนละบิลด์ได้จริงผ่านsharedsources; stat preview/คำอธิบายมีชื่อไทย/หน่วย%; retainIDs/tiers/rarity/rolls/slotprogressและ66ROcardidentity มีตัวอย่างflat+%scaledlateและcountercard/weakness | ผ่าน local/actualhosted · task-077-review.json |
| `T077-AC-04` [TASK-077](done/tasks_077.md) | static/engine/source/migration/mobile/hosted | existing migrationรักษาwallet/paidledger/inventoryIDs/rarity/levels/options/slot/cards/pendingrewards/farmcursorครบ; ไม่แก้owner,ไม่SQL/env/newassets ไม่เปลี่ยนต้นทุน/ฟาร์ม/กาชา และไม่รันbalance/calibration | ผ่าน local/actualhosted · task-077-review.json |
| `T077-AC-05` [TASK-077](done/tasks_077.md) | static/engine/source/migration/mobile/hosted | focused tests/M0/content/schema/boundaries/type/build/secretsผ่าน; actualmobile320/390 skill/gear/cardแสดงผลที่ตรงengine/ไม่มีread-onlysave และpublichostednewbundles/hash/Auth/PWAผ่าน พร้อมระบุว่าเป็นtrialbaselineไม่ใช่whole-gamebalanceproof | ผ่าน local/actualhosted · task-077-review.json |

| `T078-AC-01` [TASK-078](done/tasks_078.md) | role-power/static/effect/mobile/hosted | heal/HoT/shield/revive/HP/DEF/guardและsupportทุกอาชีพที่เข้าเกณฑ์scale1.75จากbaselineครั้งเดียว รวมcopies/summons; damage077ไม่เพิ่มซ้ำและมีbefore/after audit | ผ่าน local/actualhosted · task-078-review.json |
| `T078-AC-02` [TASK-078](done/tasks_078.md) | role-power/static/effect/mobile/hosted | engineให้Heal/เพลง/โล่/ลดdamage/HPและstackตามค่าที่คาดไว้จริง; SP/คิว/CC/เวลาเดิม การ์ดprimaryมีderived%ที่โตตามบิลด์ อาวุธทุกตระกูลให้ผลแยกจากการ์ดตามTier | ผ่าน local/actualhosted · task-078-review.json |
| `T078-AC-03` [TASK-078](done/tasks_078.md) | role-power/static/effect/mobile/hosted | focusedchecks/378goldens/M0/type/boundaries/build/secretsผ่าน ไม่มีownerwrite/SQL/env/newassets/เศรษฐกิจหรือด่านเปลี่ยน ไม่มีbalancebatchใหม่ | ผ่าน local/actualhosted · task-078-review.json |
| `T078-AC-04` [TASK-078](done/tasks_078.md) | role-power/static/effect/mobile/hosted | actualmobile320/390แสดงHeal/Kyrie/Endure/HealingSong/CardINTตรงสูตรและไม่มีinspection save; actualdeployAPI/newdata/login/PWAผ่าน จึงย้ายdone | ผ่าน local/actualhosted · task-078-review.json |

| `T079-AC-01` [TASK-079](done/tasks_079.md) | resolveddescription/mobile/build/hosted | ภาพการ์ด bag/socket/picker ไม่ล้นกรอบที่320/390px สัดส่วน3:4คงเดิม ขอบมนและbadgeไม่ถูกตัด ตรวจภาพจริง | ผ่าน local/actualhosted · task-079-review.json |
| `T079-AC-02` [TASK-079](done/tasks_079.md) | resolveddescription/mobile/build/hosted | Call Spirit/Provoke บอกผลและ SP ของLv.1–10ตรงนิยาม; Fire Endow บอกธาตุ/ระยะเวลา/เป้าหมายและผลต่อweapon/fixedspell/armor; Enchant Poison ไม่อ้างว่าเปลี่ยนธาตุ | ผ่าน local/actualhosted · task-079-review.json |
| `T079-AC-03` [TASK-079](done/tasks_079.md) | resolveddescription/mobile/build/hosted | สกิลทุกสายแสดงdelta SP/CT/ACD/effectของเลเวลถัดไปตรงresolver รวมcost-only/lockedcap/max/passive/sp-all ไม่มีmutation/NaN และhashcontent/packเดิม | ผ่าน local/actualhosted · task-079-review.json |
| `T079-AC-04` [TASK-079](done/tasks_079.md) | resolveddescription/mobile/build/hosted | focusedchecks/build/type/boundaries/secretsและactualmobile/hostedผ่าน ไม่มีinspection save/ownerwrite/SQL/env/newassets/6173restart/balance simulation | ผ่าน local/actualhosted · task-079-review.json |

| `T080-AC-01` [TASK-080](done/tasks_080.md) | cardUI/farm/static/mobile/hosted | Bag/picker/socketภาพใหญ่เต็มmaskขอบมนด้วยcover รายละเอียดการ์ดยังเห็นเต็มใบ; E/lock/grade/levelกดและอ่านได้ที่320/390px ตรวจภาพจริง | [ผ่าน review](evidence/task-080-review.json) |
| `T080-AC-02` [TASK-080](done/tasks_080.md) | cardUI/farm/static/mobile/hosted | Iconอุปกรณ์Buddy/slot summary/bag/equipment pickerแสดงempty/filledBronze-Silver-Goldตรงowner+slotและcapacity1/2/3ตามRefine; เปลี่ยนของไม่ย้ายcardprogressไปกับitem | [ผ่าน review](evidence/task-080-review.json) |
| `T080-AC-03` [TASK-080](done/tasks_080.md) | cardUI/farm/static/mobile/hosted | Projection/UIไม่มีsaveเพิ่มหรือแก้state/สูตร/SQL/env/assets; ไม่เพิ่มAPIสำหรับดูรูปหรือกรอบ และไม่ทำระบบใบธาตุที่ยังเป็นข้อเสนอ | [ผ่าน review](evidence/task-080-review.json) |
| `T080-AC-04` [TASK-080](done/tasks_080.md) | cardUI/farm/static/mobile/hosted | Focusedownershipchecks/build/type/boundaries/secrets/readinessและactualdisposablemobile/hostedผ่าน พร้อมpushและตรวจnewbundlesก่อนdone | [ผ่าน review](evidence/task-080-review.json) |

| `T081-AC-01` [TASK-081](done/tasks_081.md) | cardUI/farm/static/mobile/hosted | ทุก130ด่านchance1–2%ทุก300000msเพิ่มตามordinal; staticexpectation12h144rolls=1.44–2.88ใบ ไม่มีpity/guaranteeหรือkill/speedinput | [ผ่าน review](evidence/task-081-review.json) |
| `T081-AC-02` [TASK-081](done/tasks_081.md) | cardUI/farm/static/mobile/hosted | เปลี่ยนเฉพาะfarmchance/version/documentation ไม่แตะquality/grade/tierweights/cardpower/gacha/gear/resource/dropinterval; owned/pendingitemsเดิมคงbytevalues | [ผ่าน review](evidence/task-081-review.json) |
| `T081-AC-03` [TASK-081](done/tasks_081.md) | cardUI/farm/static/mobile/hosted | Oldfrozenv1intervalใช้profileเดิมจนreserveครั้งเดียว แล้วfarm.claimติดตั้งv2; retry/split/fullbag/12hcapไม่reroll/จ่ายซ้ำ และoldno-cardไม่retroactive | [ผ่าน review](evidence/task-081-review.json) |
| `T081-AC-04` [TASK-081](done/tasks_081.md) | cardUI/farm/static/mobile/hosted | Focusedfarm/migrationchecks/M0/build/type/boundaries/secretsและactualmobilefarmrates/hostednewdataผ่าน ไม่มีownerwrite/6173restart/SQL/env/newassetsหรือbalancebatchใหม่ | [ผ่าน review](evidence/task-081-review.json) |

| `T082-AC-01` [TASK-082](done/tasks_082.md) | cinematic/contact/mobile/build/hosted | Asuraมีหมัดแสง/วงแรงกระแทก/ข้อความท่าใหญ่และworldshakeสั้นตรงvisualcontactจริง; ท่าใหญ่ที่เลือกจาก6ต้นอาชีพมีลักษณะเฉพาะตามhit/เวท/ฟัน/ศักดิ์สิทธิ์/ระเบิด โดยไม่อ้างexactROreconstruction | [ผ่าน review](evidence/task-082-review.json) |
| `T082-AC-02` [TASK-082](done/tasks_082.md) | cinematic/contact/mobile/build/hosted | Triggerเฉพาะactualsuccessfuldamageและcast/actionที่ถูกต้อง ไม่เกิดจากcaststartที่ถูกขัด/normal/proc/heal/miss และAoE/multihitไม่spambanner; contactตรงnumbers/projectilesที่1×/2×/4×ไม่มีstate/RNG/eventchange | [ผ่าน review](evidence/task-082-review.json) |
| `T082-AC-03` [TASK-082](done/tasks_082.md) | cinematic/contact/mobile/build/hosted | ข้อความอ่านได้เมื่อเร่งspeedด้วยเวลาภาพแยกจากgameclock; reducedmotionหยุดshake/พุ่ง/flash HUDไม่ขยับ คิวและparticlesbounded/mobile320/390ไม่ล้น ไม่ใช้globalrandomหรือโหลดassetเพิ่ม | [ผ่าน review](evidence/task-082-review.json) |
| `T082-AC-04` [TASK-082](done/tasks_082.md) | cinematic/contact/mobile/build/hosted | Purepresentationchecks/type/boundaries/build/secretsผ่าน actualChromeทดสอบrealpack/contact/nohit/interrupt/multihit/reducedmotion+หลายท่าและตรวจภาพจริง ภาพไม่เพิ่มAPI/saveหรือเปลี่ยนrules/content/packจากTASK081 | [ผ่าน review](evidence/task-082-review.json) |
| `T082-AC-05` [TASK-082](done/tasks_082.md) | cinematic/contact/mobile/build/hosted | Push/deploy/publicnewpresentationbundle/API/hash/login/PWAผ่านก่อนdone ไม่มีownerwrite/6173restart/SQL/envหรือbalancebatchใหม่ | [ผ่าน review](evidence/task-082-review.json) |

| `T083-AC-01` [TASK-083](done/tasks_083.md) | source/fixedrarity/migration/drop/mobile/hosted | 66IDsมีfixedrarityตามweak/strong/Elite/Mini/MVPครบ SourceMini6=MVP11ถูกต้อง AbysmalKnightเป็นEliteไม่ใช่MVP ไม่มีImmortal/Supremeสร้างในรุ่นนี้; same monsterทุกสำเนาระดับเดียวกัน | [ผ่าน review](evidence/task-083-review.json) |
| `T083-AC-02` [TASK-083](done/tasks_083.md) | source/fixedrarity/migration/drop/mobile/hosted | Inventory/pending/assignment/level/lock/ledgerคงเดิม migrationidempotent; oldpower/procs/penalties/salvagedustไม่ด้อยลง ไม่มีdoublemultiplierหรือลบของ | [ผ่าน review](evidence/task-083-review.json) |
| `T083-AC-03` [TASK-083](done/tasks_083.md) | source/fixedrarity/migration/drop/mobile/hosted | Farmchance1–2%/5minและ12hcapเดิม frozenoldchance/pool/quality/RNGเก็บก่อนclaimครั้งเดียว จากนั้นv3fixedrarity; gachaRare+10/Legendary30pityคงcounterและราคา/Towerfixedcards/retry/fullbagถูกต้อง | [ผ่าน review](evidence/task-083-review.json) |
| `T083-AC-04` [TASK-083](done/tasks_083.md) | source/fixedrarity/migration/drop/mobile/hosted | Bag/picker/socket/equipmentcardframes/detail/farm/revealใช้สีเทาเขียวฟ้าม่วงทองตามactualcardrarity ภาพเต็มmask กรอง/เรียงและElite/Mini/MVPอ่านได้ที่320/390px ไม่มีinspectionwrite | [ผ่าน review](evidence/task-083-review.json) |
| `T083-AC-05` [TASK-083](done/tasks_083.md) | source/fixedrarity/migration/drop/mobile/hosted | Focusedtypedmath/migration/drop/gacha/slots checks, M0/build/type/boundaries/secretsและactualmobile/Auth/API/SQLผ่าน มีภาพจริงและจำกัดscopeไม่อ้างwholebalance/physicalAndroid | [ผ่าน review](evidence/task-083-review.json) |
| `T083-AC-06` [TASK-083](done/tasks_083.md) | source/fixedrarity/migration/drop/mobile/hosted | Push/VercelSUCCESS/publicnewdata/UI/CSS/API/hash/login/PWAผ่านก่อนdone ไม่มีownercloudwrite/6173restart/newSQL/env/assetsหรือbalancebatch | [ผ่าน review](evidence/task-083-review.json) |
| `T083-AC-07` [TASK-083](done/tasks_083.md) | actualmobilelonglist/owner/progress | Add Cardว่างก่อน/สวมท้ายตามเจ้าของจริง ป้ายสวมอยู่ชัด คำอธิบายอยู่ข้างรูป และปุ่มใส่/ย้ายตรึงมองเห็นแม้รายการยาวที่320/390px; R+Refine/EEnchantแสดงจากslotownerโดยไม่ทับframe/ป้ายอื่น ไม่มีAPIขณะดู/เลื่อนหรือย้ายprogressตามitem | [ผ่าน review](evidence/task-083-review.json) |

| `T084-AC-01` [TASK-084](done/tasks_084.md) | render/resource/skilllevel/build/hosted | ป้าย Refine แสดง +5 และ Enchant แสดง 5 ไม่มี R/E นำหน้าทุกจุดที่ใช้ EquipmentProgress; สีฟ้า/ม่วงและคำอธิบายสำหรับ accessibility คงอยู่ ของที่ไม่สวมและระดับศูนย์ไม่มีป้ายสมมติ | [ผ่าน review](evidence/task-084-review.json) |
| `T084-AC-02` [TASK-084](done/tasks_084.md) | render/resource/skilllevel/build/hosted | Call Spirit Lv.1–5 เพิ่มบอล 1–5 ลูกต่อครั้ง; Lv.6–10 เพิ่ม 5 ลูกและ ATK ต่อลูก 1.2/1.4/1.6/1.8/2% โดยสูงสุด 5 ลูก โบนัสอยู่ใน additive ATK bucket เดิมและคิดเฉพาะลูกที่เหลือหลังหักตอนเริ่มร่าย ไม่คืนเมื่อขัด | [ผ่าน review](evidence/task-084-review.json) |
| `T084-AC-03` [TASK-084](done/tasks_084.md) | render/resource/skilllevel/build/hosted | โบนัสอิงเลเวลที่ตัวนั้นเรียน ไม่ยืมจากเพื่อน; คำอธิบาย/ตารางเลเวล/ไอคอนบัฟแสดงจำนวนและเปอร์เซ็นต์ตรง shared resource calculation รวมไม่มี Call Spirit ที่เรียนยังใช้พื้นฐาน1%จากบอล Passive | [ผ่าน review](evidence/task-084-review.json) |
| `T084-AC-04` [TASK-084](done/tasks_084.md) | render/resource/skilllevel/build/hosted | Focused rule/description checks, M0/content/type/boundaries/build/secrets และ public Vercel source/UI/data/API/login/PWA ผ่านก่อน done; เก็บ skill levels/ค่าใช้จ่าย/paid ledger เดิมและใช้ backup/migration flow เดิม ไม่มี SQL/env/assets ใหม่หรือ balance batch | [ผ่าน review](evidence/task-084-review.json) |

| `T085-AC-01` [TASK-085](done/tasks_085.md) | towergrowth/save/build/hosted | ใช้เส้นHP cubic และATK quadraticเดียวกันทุกชั้น รวม100→101 ชั้น21HP24,750/ATK273แทน6,228/52 ชั้น1ยังใกล้เดิม; floor_rows100แถวตรงgenerator runtime เกินsafeintegerปฏิเสธชัดเจน ไม่มีเกมจบที่100 | [ผ่าน review](evidence/task-085-review.json) |
| `T085-AC-02` [TASK-085](done/tasks_085.md) | towergrowth/save/build/hosted | เก็บhighest_cleared_floor/first-clear receipts/pending rewards/รางวัล/40s/unlock2-10/CC/skill cycle/ASPD/CSPD/DEFเดิม ไม่รีเซ็ตชั้นหรือเพิ่มรางวัลย้อนหลัง บอสlevel capไม่หยุดnumeric scaling | [ผ่าน review](evidence/task-085-review.json) |
| `T085-AC-03` [TASK-085](done/tasks_085.md) | towergrowth/save/build/hosted | Numeric growth/source diff และ focusedTower progression/replay/migration checks/M0/build ผ่าน พร้อม Vercelpublicnewtowerdata/API/hash/login/PWA ไม่อ้างwhole-game balanceหรือผลเล่นทีมจริงของผู้ใช้ ไม่มีSQL/env/ownerwrite/balancebatchใหม่ | [ผ่าน review](evidence/task-085-review.json) |

| `T086-AC-01` [TASK-086](done/tasks_086.md) | skilltext/delta/mobile/build/hosted | คำอธิบายสกิลหลักกระชับ โดย Call Spirit/Provoke/endowไม่ย้ำเงื่อนไขยาวทุกเลเวล; จำนวนบอล/โบนัส/ระยะเวลา/โอกาส/ฮิต/ธาตุ/ต้นทุนยังตรงresolver และเงื่อนไขเฉพาะอ่านได้ในส่วนพับเงื่อนไขสกิล | [ผ่าน review](evidence/task-086-review.json) |
| `T086-AC-02` [TASK-086](done/tasks_086.md) | skilltext/delta/mobile/build/hosted | ผลอัปเลเวลทั้ง126สกิลแสดงเฉพาะข้อความที่เปลี่ยน ใช้รูปแบบตัวเลขเดิม→ใหม่กับหน่วยร่วม ไม่มีการตัดคำ/ซ่อนผลเปลี่ยน/ทำตัวเลขติดลบผิดความหมาย; ระดับที่เปลี่ยนจริงมีdeltaที่อ่านได้ | [ผ่าน review](evidence/task-086-review.json) |
| `T086-AC-03` [TASK-086](done/tasks_086.md) | skilltext/delta/mobile/build/hosted | Existing description/element/rule checksและbuild/type/boundaries/secretsผ่าน พร้อมactualmobile320/390/current+next+table+notesและpublicnewUI/API/login/PWA; content/pack/เกม/เซฟเดิม ไม่มีownerwrite/SQL/env/assets/balancebatch | [ผ่าน review](evidence/task-086-review.json) |

| `T087-AC-01` [TASK-087](done/tasks_087.md) | elementmatrix/mobile/build/hosted | ตารางธาตุครบ10×10=100คู่จาก combat-rules.json ชุดเดียวกับengine แถวโจมตี/คอลัมน์เกราะระบุชัด ตัวเลขเปอร์เซ็นต์/legendตรงตัวคูณจริง รวมHoly→Undead150%,Fire→Earth125%,Fire→Water75%,Neutral→Ghost75% | [ผ่าน review](evidence/task-087-review.json) |
| `T087-AC-02` [TASK-087](done/tasks_087.md) | elementmatrix/mobile/build/hosted | เปิดจากหน้าสกิลและป้ายเกราะบอส/ตัวโฟกัส เลือกคู่ธาตุอ่านสรุปได้ ตารางเลื่อนแนวนอนพร้อมหัวแถว/คอลัมน์คงที่ ใช้ได้320/390px ปิด/Escape/คืนfocusถูกต้อง มีtextร่วมสีและไม่มีAPI/saveขณะดู | [ผ่าน review](evidence/task-087-review.json) |
| `T087-AC-03` [TASK-087](done/tasks_087.md) | elementmatrix/mobile/build/hosted | Focused matrix/pipeline/presentation checksและbuild/type/boundaries/secretsผ่าน พร้อมactualmobileและpublicnewUI/API/login/PWA ไม่เปลี่ยน100ค่าตาราง/สูตร/ธาตุสกิล/content/pack/เซฟ ไม่มีSQL/env/assets/ownerwrite/balancebatch | [ผ่าน review](evidence/task-087-review.json) |

| `T088-AC-01` [TASK-088](done/tasks_088.md) | save/deadline/replay/realstack/mobile/hosted | คำขอเซฟ/อ่านreceipt/checkpointรวมรอtokenและbodyมีdeadline15s/AbortSignal ไม่ค้างsaving/loadingตลอดไป; timeoutตอนเขียนตรวจreceiptและreconcileคำสั่งUUIDเดิมอัตโนมัติครั้งเดียว ไม่เพิ่มหักทอง/หินหรือสุ่มตีบวกซ้ำ | [ผ่าน review](evidence/task-088-review.json) |
| `T088-AC-02` [TASK-088](done/tasks_088.md) | save/deadline/replay/realstack/mobile/hosted | visibility/reconnectระหว่างwriteไม่แทรกepochจนทิ้งผลสำเร็จ; ใช้validcachedtokenและยอมรับsame-userrefreshใหม่โดยไม่ทำfalse signed_out คงexpiry/logout/401; late reply/failed recovery/offline/disposeไม่ทับcheckpointใหม่ pendingและbackupเดิมคง เมื่อrecoverแล้วกลับreadyและเริ่มไฟต์/ทำรายการต่อได้ | [ผ่าน review](evidence/task-088-review.json) |
| `T088-AC-03` [TASK-088](done/tasks_088.md) | save/deadline/replay/realstack/mobile/hosted | ในSheetที่กำลังตีบวก/ทำรายการมีข้อความเมื่อรอนานและปุ่มตรวจผลใหม่เมื่อผิดพลาด กดได้โดยไม่ต้องปิดเกม; focusedreplay/timeout/transport+actualdisposableAuth/API/SQL/Chromeheldreply+build/hostedผ่าน ไม่แตะownerเซฟ/6173/SQL/env | [ผ่าน review](evidence/task-088-review.json) |

| `T089-AC-01` [TASK-089](done/tasks_089.md) | goldincome/frozenfarm/daily/save/realstack/hosted | ทองฟาร์มทั้ง8บทและTreasurychestเพิ่ม3เท่าจากbaselineก่อนpatchจริง Generatorreproduceได้ รายได้EXP/manual/หิน/essence/dust/lootและราคาตีบวก/Enchant/level/skill/โอกาส/pityเดิม ไม่มีบัฟทองจากsalvageเพื่อสร้างarbitrage | [ผ่าน review](evidence/task-089-review.json) |
| `T089-AC-02` [TASK-089](done/tasks_089.md) | goldincome/frozenfarm/daily/save/realstack/hosted | wallet/pendingreward/paidledger/จำนวนของ/ชั้น/สิทธิ์รายวันเก่าไม่ถูกคูณหรือรีเซ็ต ช่วงAFKที่frozenเก่าจ่ายตามrateเดิมครั้งเดียวแล้วติดตั้งrateใหม่3เท่าให้เวลาถัดไป Claimreplayไม่จ่ายซ้ำ12hcap/carry/RNGเดิม | [ผ่าน review](evidence/task-089-review.json) |
| `T089-AC-03` [TASK-089](done/tasks_089.md) | goldincome/frozenfarm/daily/save/realstack/hosted | มีsourcebeforeafterและอัตราทองต่อหินเทียบต้นทุนอย่างชัดเจน ตัวเลขเป็นbaselineทดลองไม่อ้างbalanceครบ; generator/M0/focusedfarm/daily/save/migration/buildและactualdisposableUI/API/SQL/publicproofผ่าน ไม่มีownerwrite/SQL/env/assets/balancebatch | [ผ่าน review](evidence/task-089-review.json) |

| `T090-AC-01` [TASK-090](done/tasks_090.md) | pending/migration/backup/replay/mobile/hosted | pendingที่มีreceiptยืนยันแล้วถูกปลดเมื่อmigrationpreviewrevisionถึงreceipt; no-receiptคำสั่งที่APIตอบ409CONTENT_VERSION_MISMATCHเก็บUUID/paramsเดิมในlocalbackupแล้วไม่replayข้ามรุ่น สามารถกดbackup+migrateสำเร็จหนึ่งครั้งพร้อมsignedbackupเดิมครบ | [ผ่าน review](evidence/task-090-review.json) |
| `T090-AC-02` [TASK-090](done/tasks_090.md) | pending/migration/backup/replay/mobile/hosted | unknown/network/timeout/401/5xx/stalepreview/storagefailureไม่ล้างpendingหรือหักของซ้ำ; maintenanceแสดงตรวจผลรายการค้างหรือwriterแทนWRITER_NOT_READYรัว และmigratereplyloss/retryใช้UUIDเดิม ไม่สร้างmigration/backupsซ้ำ | [ผ่าน review](evidence/task-090-review.json) |
| `T090-AC-03` [TASK-090](done/tasks_090.md) | pending/migration/backup/replay/mobile/hosted | Focused controller/API/backup/build/type/boundaries/secretsและactualdisposableAuth/API/SQL/mobile320/390 plusVercelpublicproofผ่าน คงwallet/roster/items/paidledger/dailyquotaตามmigrationเดิม ไม่มีownercloudwrite/privateenvread/6173restart/SQL/env/content/packเปลี่ยน | [ผ่าน review](evidence/task-090-review.json) |

| `T091-AC-01` [TASK-091](done/tasks_091.md) | source/pipeline/presentation/mobile/build/hosted | ตารางครบ100คู่ตรงภาพElemental Effectivenessในคู่มือROO Global โดยแปลงโบนัสเป็นตัวคูณรวมและแถวโจมตี/คอลัมน์เกราะถูกต้อง เช่นFire→Earth175%,Fire→Fire25%,Fire→Water80%,Water→Wind90%,Neutral→Ghost70%,Holy→Undead175%; ระบุภาพ/วันที่/SHA/provenanceและgeneratorreproduceได้ | [ผ่าน implementation](evidence/task-091-review.json) |
| `T091-AC-02` [TASK-091](done/tasks_091.md) | source/pipeline/presentation/mobile/build/hosted | Engine/หัวตาราง/รายละเอียดคู่ที่เลือกอ่านชุดเดียวกันครบ100คู่; ไม่เปลี่ยนธาตุที่สกิล/การ์ด/อาวุธกำหนด ไม่เพิ่มelementlevelsหรือยกสูตรอื่นจากOrigin คงเซฟ/paidledger/slot/cardsและbackup/migrationflowเดิม ไม่ownerwrite/SQL/env/pack/newbalancebatch | [ผ่าน implementation](evidence/task-091-review.json) |
| `T091-AC-03` [TASK-091](done/tasks_091.md) | source/pipeline/presentation/mobile/build/hosted | Generator/M0/element100pipeline+sourcegoldens/math/class/backup-migration checksและbuild/type/boundaries/secretsผ่าน พร้อมmobile320/390tableและVercelpublichash/source/login/PWAก่อนdone | [ผ่าน implementation](evidence/task-091-review.json) |

| `T092-AC-01` [TASK-092](done/tasks_092.md) | source/pipeline/presentation/mobile/build/hosted | ข้อความท่าใหญ่ทุกprofileใช้ตำแหน่งใหม่40%ของความสูงcanvasแทน25% ลดระยะห่างจากตัวละครในportrait320/390 โดยไม่เปลี่ยนชื่อ/ขนาด/สี/ระยะเวลาแสดงและไม่เพิ่มกรอบหรือUIรก | [ผ่าน implementation](evidence/task-092-review.json) |
| `T092-AC-02` [TASK-092](done/tasks_092.md) | source/pipeline/presentation/mobile/build/hosted | Nativeeffects/เลขdamage/impactcontact/จอสั่น/reducedmotion/ซ่อนในfarm/interruptและผลต่อสู้x1x2x4เหมือนเดิม เปลี่ยนเฉพาะoverlayposition ไม่แก้engine/skillpower/audio/สูตร/เซฟ | [ผ่าน implementation](evidence/task-092-review.json) |
| `T092-AC-03` [TASK-092](done/tasks_092.md) | source/pipeline/presentation/mobile/build/hosted | ExistingrealnativefinisherChromeตรวจ10ท่าครบ6สายและmobile320/390 พร้อมภาพอ่านตำแหน่งจริง/build/type/boundaries/secrets/publicbundleproofผ่าน ไม่มีownerwrite/6173restart/SQL/env/assets/balancebatch | [ผ่าน implementation](evidence/task-092-review.json) |

| `T093-AC-01` [TASK-093](done/tasks_093.md) | catalog/effect/reward/migration/mobile/build/hosted | Angeling/Deviling เป็นMVP/LegendaryตามOrigin; รักษา66stableIDs/รูปต้นทาง/ช่อง/เลเวล/ล็อก/paidledgerและassignment เซฟเก่าย้ายเป็นทองโดยไม่ล้างของ | [ผ่าน implementation](evidence/task-093-review.json) |
| `T093-AC-02` [TASK-093](done/tasks_093.md) | catalog/effect/reward/migration/mobile/build/hosted | เพิ่ม7Puppet Iเป็นdistinctdefinitionsพร้อมvariant/parent/sourceและRare; ไม่ใช้Holyarmor/ASPD/splashของใบจริง มีeffectsรุ่นรองผ่านcompositionเดิม พลังlevel/rarityและprocไม่คูณซ้ำ; รวม73definitions/66nativeportraits | [ผ่าน implementation](evidence/task-093-review.json) |
| `T093-AC-03` [TASK-093](done/tasks_093.md) | catalog/effect/reward/migration/mobile/build/hosted | Farm/Tower/gachaสร้างPuppetได้ตามcatalogและtier/variantgate โดยอัตราการ์ดรวมยังเฉลี่ย1.44–2.88ใบต่อ12h ราคา/pity/oldfrozenrewards/RNGpartition/cap/UUIDreplayไม่เปลี่ยน | [ผ่าน implementation](evidence/task-093-review.json) |
| `T093-AC-04` [TASK-093](done/tasks_093.md) | catalog/effect/reward/migration/mobile/build/hosted | ภาพPuppetสีจางเฉพาะภาพ/กรอบRareยังชัด/ป้ายPUPPETแยกจากMVPบนbag/picker/socket/details/reveal/farm; mobile320/390ไม่ล้น Focused/build/M0/readinessและactualisolatedChrome/saveflow/publicVercelผ่านก่อนdone ไม่ownerwrite/6173restart/SQL/env/newassets/balancebatch | [ผ่าน implementation](evidence/task-093-review.json) |

| `T094-AC-01` [TASK-094](done/tasks_094.md) | schema/command/element/replay/migration/mobile/build/hosted | ร้านค้ามีใบไฟ/น้ำ/ดิน/ลม ซื้อด้วยทองและเก็บstockแยกจากwallet/gear/card; เลือกmain/NPCเพื่อเตรียมได้ สลับหรือยกเลิกก่อนเริ่มคืนใบที่จอง ไม่มีหัก/ซื้อซ้ำจากresponse-lossหรือUUIDreplay | [ผ่าน implementation](evidence/task-094-review.json) |
| `T094-AC-02` [TASK-094](done/tasks_094.md) | schema/command/element/replay/migration/mobile/build/hosted | ใบที่เตรียมมีผลหนึ่งไฟต์Story/Tower/Dailyถัดไปของตัวนั้นและใช้จริงเฉพาะสมาชิกทีมเมื่อเริ่มสำเร็จ; invalidstart/ตัวสำรองไม่เสียใบ ท่าธาตุweaponและตีปกติรับธาตุใหม่ ส่วนfixedelementไม่เปลี่ยน statusendowสกิลยังoverrideตามpipelineเดิม การคำนวณx1/x2/x4ตรงกัน | [ผ่าน implementation](evidence/task-094-review.json) |
| `T094-AC-03` [TASK-094](done/tasks_094.md) | schema/command/element/replay/migration/mobile/build/hosted | เซฟเก่าเติมstock/queueว่างผ่านbackup/migrateเดิม โดยไม่ล้างinventory/paidledger/AFK/pity/characters; stock/queueถูกvalidateและpersist พร้อมserverreceipt ไม่มีSQL/envหรือownerwrite | [ผ่าน implementation](evidence/task-094-review.json) |
| `T094-AC-04` [TASK-094](done/tasks_094.md) | schema/command/element/replay/migration/mobile/build/hosted | ไอคอนร้านค้าเป็นสีและเข้าร้านได้; ใบธาตุใช้ไอคอนแยกสี/ตัวละคร+stock/คิวเตรียมชัด; ป้ายธาตุสกิลใช้SVGที่สื่อธาตุ/compactอ่านง่ายและตามอาวุธแสดงธาตุที่เตรียมได้ ตรวจmobile320/390/build/focused/actualisolatedAPI-save/publicVercelก่อนdone | [ผ่าน implementation](evidence/task-094-review.json) |

| `T095-AC-01` [TASK-095](done/tasks_095.md) | Native icon/mobile/build/hosted | BottomBar ใช้ภาพถุงเงิน native bank_1 สีปกติทั้ง inactive/active; แตะเปิดร้านได้ ขนาดไม่ล้นมือถือ 320/390px และไม่มี browser error | [ผ่าน implementation](evidence/task-095-review.json) |
| `T095-AC-02` [TASK-095](done/tasks_095.md) | Native icon/mobile/build/hosted | runtime pack/build ผ่านและเว็บ Vercel ส่ง mapping/ภาพสีตรง checksum; content hash กติกาเกมไม่เปลี่ยน | [ผ่าน implementation](evidence/task-095-review.json) |

| `T096-AC-01` [TASK-096](done/tasks_096.md) | Level/rarity/fit/mobile/build/hosted | ของที่ใส่ได้/ยังไม่มีคนสวม เตือนเมื่อเลเวลไอเท็มสูงกว่า หรือเลเวลเท่ากันแต่ rarity สูงกว่า; ช่องว่างเตือนเมื่อมีของใส่ได้ ของเท่ากัน/เลเวลต่ำกว่าแม้ Supreme/ผิดอาชีพ/เลเวลไม่ถึง/ของเพื่อนไม่เตือน ออปชัน/ค่าพัฒนาช่องไม่เกี่ยวกับเกณฑ์และเซฟไม่ถูกแก้ | [ผ่าน implementation](evidence/task-096-review.json) |
| `T096-AC-02` [TASK-096](done/tasks_096.md) | Level/rarity/fit/mobile/build/hosted | จุดแดงเล็กที่ช่องถูกต้องบนมือถือ320/390 ไม่บัง rarity/Refine/Enchant/การ์ด; เปิดรายการแล้วของที่แนะนำอยู่บนสุดพร้อมป้าย สวมแล้ว/สลับตัวละครแล้วคำเตือนอัปเดต ไม่มี network write จากการแสดงคำเตือน และตรวจ500item/CPU4xเพื่อกัน UI หน่วง | [ผ่าน implementation](evidence/task-096-review.json) |
| `T096-AC-03` [TASK-096](done/tasks_096.md) | Level/rarity/fit/mobile/build/hosted | targeted rules/build/type/boundaries/secrets/readiness และ public Vercel bundle/หน้า login ผ่าน content hash/pack เดิม ไม่มี SQL หรือเซฟ migration เพิ่ม | [ผ่าน implementation](evidence/task-096-review.json) |

| `T097-AC-01` [TASK-097](done/tasks_097.md) | MultiHit/native/contact/mobile/build/hosted | directmulti-hit100×3 แสดง100→200→300เมื่อถึงvisualcontact ไม่มีนับซ้ำต่อframe/replay แยกcast/ตัวร่าย/เป้า; normal/single-hit/DoT/proc/reflect/heal/AoEฮิตเดียวไม่ขึ้นเลขเหลือง และใช้amountจริง | [ผ่าน implementation](evidence/task-097-review.json) |
| `T097-AC-02` [TASK-097](done/tasks_097.md) | MultiHit/native/contact/mobile/build/hosted | actualengineBolt/Finger/DoubleStrafeมีเลขขาวรายฮิตและเหลืองสะสมตามimpact; โฟกัส/reducedmotion/hold-fade/mobile320–390ทำงาน และspeed1/2/4กับการขัดร่ายไม่เปลี่ยนevents/RNG/checkpoint ไม่เขียนsaveหรือAPIจากrenderer | [ผ่าน implementation](evidence/task-097-review.json) |
| `T097-AC-03` [TASK-097](done/tasks_097.md) | MultiHit/native/contact/mobile/build/hosted | focusedtests/build/type/boundaries/secrets/readinessและpublicVercelJS/CSS/หน้าloginผ่าน contenthash/runtimepackเดิม ไม่มีSQL/env/เซฟmigration | [ผ่าน implementation](evidence/task-097-review.json) |

| `T098-AC-01` [TASK-098](done/tasks_098.md) | rules/API/migration/mobile/build/hosted | 10กล่องจ่ายรวมครั้งเดียว/replayไม่ซ้ำ; missing/fullbag/overflow ย้อนทั้งชุด; UIไม่มีloopHTTP | [ผ่าน implementation](evidence/task-098-review.json) |
| `T098-AC-02` [TASK-098](done/tasks_098.md) | rules/API/migration/mobile/build/hosted | build/type/boundaries/secrets/readinessผ่าน; actualisolatedChrome+publicVercelตรวจcode/artifactที่ปล่อยจริง | [ผ่าน implementation](evidence/task-098-review.json) |
| `T099-AC-01` [TASK-099](done/tasks_099.md) | rules/API/migration/mobile/build/hosted | 18linesต่างกัน/serverตรวจslot; +0/1/5/10ต้นปลายผ่านsharedpipeline; migrationรักษาทุน/refund/ระดับ/ของ/การ์ด | [ผ่าน implementation](evidence/task-099-review.json) |
| `T099-AC-02` [TASK-099](done/tasks_099.md) | rules/API/migration/mobile/build/hosted | build/type/boundaries/secrets/readinessผ่าน; actualisolatedChrome+publicVercelตรวจcode/artifactที่ปล่อยจริง | [ผ่าน implementation](evidence/task-099-review.json) |
| `T100-AC-01` [TASK-100](done/tasks_100.md) | rules/API/migration/mobile/build/hosted | 12hcap/quantization/splitclaim; frozenoldrateรักษา; gearครึ่งcardเดิม; UI320/390ราคา/rates/icon/ข้อความTowerถูกต้อง | [ผ่าน implementation](evidence/task-100-review.json) |
| `T100-AC-02` [TASK-100](done/tasks_100.md) | rules/API/migration/mobile/build/hosted | build/type/boundaries/secrets/readinessผ่าน; actualisolatedChrome+publicVercelตรวจcode/artifactที่ปล่อยจริง | [ผ่าน implementation](evidence/task-100-review.json) |

| `T101-AC-01` [TASK-101](done/tasks_101.md) | fixedrules/mobile/build/hosted | Upgradeมี+ตามผู้ใช้/EXP/4ใบธาตุเดิม/19actualOriginjobemblemsตรงcatalog ไม่ใช้skill/item/customfallback | [ผ่าน implementation](evidence/task-101-review.json) |
| `T101-AC-02` [TASK-101](done/tasks_101.md) | fixedrules/mobile/build/hosted | มือถือ320/390ไม่ล้นและpublicVercelส่งmapping/media/bundleตรงchecksum | [ผ่าน implementation](evidence/task-101-review.json) |

| `T102-AC-01` [TASK-102](done/tasks_102.md) | fixedrules/mobile/build/hosted | ตัดhow-toและคำแนะนำซ้ำในทุกหน้า คงค่าจริง ราคา เงื่อนไขและคำเตือน; cardlevelแสดงเลขล้วน | [ผ่าน implementation](evidence/task-102-review.json) |
| `T102-AC-02` [TASK-102](done/tasks_102.md) | fixedrules/mobile/build/hosted | เลือกสกิล/ใส่ช่อง สวมของและupgradeยังทำงานบนมือถือ ไม่มีoverflow/error | [ผ่าน implementation](evidence/task-102-review.json) |

| `T103-AC-01` [TASK-103](done/tasks_103.md) | fixedrules/mobile/build/hosted | Asura SP ratioทุกเลเวลเท่าของเดิม×4; ATK/Finger/cost/CT/ACD/สเฟียร์เหมือนเดิม; pre-cost SPจริง/ขัดร่ายไม่คืน | [ผ่าน implementation](evidence/task-103-review.json) |
| `T103-AC-02` [TASK-103](done/tasks_103.md) | fixedrules/mobile/build/hosted | UIและsharedengineตรงcoefficientsใหม่1102.5–2047.5%SP; focused/build/deployผ่าน ไม่มีbalancebatch | [ผ่าน implementation](evidence/task-103-review.json) |

| `T104-AC-01` [TASK-104](done/tasks_104.md) | fixedrules/mobile/build/hosted | Lv1–10 duration5500→10000ms step500ทั้งATK/MATK; magnitude/cost/timingคงเดิม | [ผ่าน implementation](evidence/task-104-review.json) |
| `T104-AC-02` [TASK-104](done/tasks_104.md) | fixedrules/mobile/build/hosted | แต่ละinstanceหมดเวลาตัวเอง/recastเพิ่มstack; UIleveldescriptionตรงและbuild/deployผ่าน | [ผ่าน implementation](evidence/task-104-review.json) |

| `T105-AC-01` [TASK-105](done/tasks_105.md) | fixedrules/mobile/build/hosted | Refineใช้8×target oreแทน5×target รวม440oreถึง+10; gold77000/chance/pity/modifiers/cardgatesไม่เปลี่ยน | [ผ่าน implementation](evidence/task-105-review.json) |
| `T105-AC-02` [TASK-105](done/tasks_105.md) | fixedrules/mobile/build/hosted | success/failureจ่ายstepcostใหม่ครั้งเดียว insufficientfundsไม่เปลี่ยนstate; oldprogress/paidledgerไม่reprice; UI/build/deployผ่าน | [ผ่าน implementation](evidence/task-105-review.json) |

| `T106-AC-01` [TASK-106](done/tasks_106.md) | usermapping/importer/mobile/build/hosted | 12iconsตรงexplicitmapping/exactsourcebytes128px; gameplay/VFX/audio/contenthashเดิม; localpathescapeและsourcechangeถูกปฏิเสธ | [ผ่าน implementation](evidence/task-106-review.json) |

| `T106-AC-02` [TASK-106](done/tasks_106.md) | usermapping/importer/mobile/build/hosted | realmobile320/390 skill/loadout/timeline/spherebadgeโหลดใหม่/ไม่ล้น/ไม่มีwriteหรือerror; build/M0/assets/publicผ่านพร้อมภาพ | [ผ่าน implementation](evidence/task-106-review.json) |

| `T107-AC-01` [TASK-107](done/tasks_107.md) | userfile/sharedengine/mobile/public | AC-01ตามdesign36/tasks107 | [ผ่าน implementation](evidence/task-107-review.json) |
| `T107-AC-02` [TASK-107](done/tasks_107.md) | userfile/sharedengine/mobile/public | AC-02ตามdesign36/tasks107 | [ผ่าน implementation](evidence/task-107-review.json) |
| `T107-AC-03` [TASK-107](done/tasks_107.md) | userfile/sharedengine/mobile/public | AC-03ตามdesign36/tasks107 | [ผ่าน implementation](evidence/task-107-review.json) |
| `T107-AC-04` [TASK-107](done/tasks_107.md) | userfile/sharedengine/mobile/public | AC-04ตามdesign36/tasks107 | [ผ่าน implementation](evidence/task-107-review.json) |
| `T107-AC-05` [TASK-107](done/tasks_107.md) | userfile/sharedengine/mobile/public | AC-05ตามdesign36/tasks107 | [ผ่าน implementation](evidence/task-107-review.json) |
| `T107-AC-06` [TASK-107](done/tasks_107.md) | userfile/sharedengine/mobile/public | AC-06ตามdesign36/tasks107 | [ผ่าน implementation](evidence/task-107-review.json) |

| `T108-AC-01` [TASK-108](done/tasks_108.md) | audit/effects/Chrome/hosted | AC-01ตามdesign37 | [ผ่าน implementation](evidence/task-108-review.json) |
| `T108-AC-02` [TASK-108](done/tasks_108.md) | audit/effects/Chrome/hosted | AC-02ตามdesign37 | [ผ่าน implementation](evidence/task-108-review.json) |
| `T108-AC-03` [TASK-108](done/tasks_108.md) | audit/effects/Chrome/hosted | AC-03ตามdesign37 | [ผ่าน implementation](evidence/task-108-review.json) |
| `T108-AC-04` [TASK-108](done/tasks_108.md) | audit/effects/Chrome/hosted | AC-04ตามdesign37 | [ผ่าน implementation](evidence/task-108-review.json) |
| `T108-AC-05` [TASK-108](done/tasks_108.md) | audit/effects/Chrome/hosted | AC-05ตามdesign37 | [ผ่าน implementation](evidence/task-108-review.json) |
| `T108-AC-06` [TASK-108](done/tasks_108.md) | audit/effects/Chrome/hosted | AC-06ตามdesign37 | [ผ่าน implementation](evidence/task-108-review.json) |

| `T109-AC-01` [TASK-109](done/tasks_109.md) | design38/fixedfixtures/mobile/public | AC-01ตามdesign38 | ผ่าน runtime/local+hosted · [review](evidence/task-109-review.json) |
| `T109-AC-02` [TASK-109](done/tasks_109.md) | design38/fixedfixtures/mobile/public | AC-02ตามdesign38 | ผ่าน runtime/local+hosted · [review](evidence/task-109-review.json) |
| `T109-AC-03` [TASK-109](done/tasks_109.md) | design38/fixedfixtures/mobile/public | AC-03ตามdesign38 | ผ่าน runtime/local+hosted · [review](evidence/task-109-review.json) |
| `T109-AC-04` [TASK-109](done/tasks_109.md) | design38/fixedfixtures/mobile/public | AC-04ตามdesign38 | ผ่าน runtime/local+hosted · [review](evidence/task-109-review.json) |
| `T109-AC-05` [TASK-109](done/tasks_109.md) | design38/fixedfixtures/mobile/public | AC-05ตามdesign38 | ผ่าน runtime/local+hosted · [review](evidence/task-109-review.json) |
| `T109-AC-06` [TASK-109](done/tasks_109.md) | design38/fixedfixtures/mobile/public | AC-06ตามdesign38 | ผ่าน runtime/local+hosted · [review](evidence/task-109-review.json) |

| `T110-AC-01` [TASK-110](done/tasks_110.md) | D142/static+mobile+public | Seven exactPaladin mappings with byteidentical source/export/runtime andactualmobile;all126logicalskillprograms unchanged | ผ่านlocal+hosted · [review](evidence/task-110-review.json) |
| `T110-AC-02` [TASK-110](done/tasks_110.md) | D142/static+mobile+public | Story6-5/10/15=71992/86392/103674HP and2299/2485/2687ATK;Tower21HP24750ATK300;monotonic/reduced andpreservedrewards/CC/Refine/sockets | ผ่านlocal+hosted · [review](evidence/task-110-review.json) |
| `T110-AC-03` [TASK-110](done/tasks_110.md) | D142/static+mobile+public | Assets/M0/build/targeted/freshAuth-API-SQL/mobile/publicnewcontent+newpack+7iconSHA/login0writes passed | ผ่านlocal+hosted · [review](evidence/task-110-review.json) |

| `T111-AC-01` [TASK-111](done/tasks_111.md) | localupgrade/unit/mobile/public | LegacySQLupgrade preservesstate/signature/history/receipt/battle/backup bytes;10boundeduniqueownerslots;14argcompat/rerunnableSQL008 | ผ่าน implementation/local/public; SQL008ผู้ใช้ยืนยันติดตั้ง |
| `T111-AC-02` [TASK-111](done/tasks_111.md) | localupgrade/unit/mobile/public | 10distinctsaves/authJWT/headerboundaries/RLS/crossslotreceiptresetbackupisolation/2RPCunchanged | ผ่าน implementation/local/public; SQL008ผู้ใช้ยืนยันติดตั้ง |
| `T111-AC-03` [TASK-111](done/tasks_111.md) | localupgrade/unit/mobile/public | Actual10slotmobilechooser320/390/newclasses/settings/currentnumber/switchguards/reload | ผ่าน implementation/local/public; SQL008ผู้ใช้ยืนยันติดตั้ง |
| `T111-AC-04` [TASK-111](done/tasks_111.md) | localupgrade/unit/mobile/public | Localbackup/pending/lock/late-replyisolation+legacykey+12hper-slot+oldSQLfallback | ผ่าน implementation/local/public; SQL008ผู้ใช้ยืนยันติดตั้ง |
| `T111-AC-05` [TASK-111](done/tasks_111.md) | localupgrade/unit/mobile/public | Targeted/full/M0/build+actualfreshupgradeAPI-SQL-mobile/publicproof;SQL008deliverable/cloudactivationnotassumed | ผ่าน implementation/local/public; SQL008ผู้ใช้ยืนยันติดตั้ง |
| `T112-AC-01` [TASK-112](done/tasks_112.md) | profile/unit/mobile/public | baseline/afterloadfirst/cachedพร้อมnetwork/build/CPUและbytes,profileชี้rootcauseจริง;ไม่เรียกfixtureว่าAndroidผู้ใช้ | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T112-AC-02` [TASK-112](done/tasks_112.md) | profile/unit/mobile/public | matchednav500items+Stats/Skills/character switchดีขึ้นหรืออยู่≤150msp95บนCPU4x,0navigationAPI,no staleafterupgrade/equipment/save switch | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T112-AC-03` [TASK-112](done/tasks_112.md) | profile/unit/mobile/public | deterministicupgradeเห็นpreviewก่อนreply,pending/replay/confirmationหลักเดิม;แยกCPU/hash/DB/networkและไม่อ้างlocalเป็นcloudlatency | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T112-AC-04` [TASK-112](done/tasks_112.md) | profile/unit/mobile/public | render/farm/Boss/SFX/memoryเหมาะสมและengineoutcomeunchanged;targeted/build/actualUI/sharedsave/publicproofผ่านโดยไม่แตะบาลานซ์หรือownerdata | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T113-AC-01` [TASK-113](done/tasks_113.md) | profile/unit/mobile/public | ไม่มีปุ่ม/preview/tierupcopyในproduct;APIใหม่ปฏิเสธก่อนwallet/itemsเปลี่ยน;fusionคนละTierยังไม่ได้ | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T113-AC-02` [TASK-113](done/tasks_113.md) | profile/unit/mobile/public | oldtieritems/options/slotcards/ledgerคงเดิม,oldreceiptReplayเดิม,version/pending/migrationไม่ทำของหายหรือหักซ้ำ | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T113-AC-03` [TASK-113](done/tasks_113.md) | profile/unit/mobile/public | dropnewhigherTier/equipพร้อมUIเก็บค่าช่อง,tests/build/localAPI-mobile/publicผ่านโดยไม่มีownercloudwrite | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T114-AC-01` [TASK-114](done/tasks_114.md) | unit/API/mobile/public | instant0ACD/ASPD100/SI3000,ช่อง0ท่าเดียวcastที่3000/15000/27000;ช่อง2ท่าเดียวfirst9000;มีnormalhitsระหว่างช่องว่าง,allnullไม่cast | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T114-AC-02` [TASK-114](done/tasks_114.md) | unit/API/mobile/public | CT/ACDจริง+speed snapshot/SPskip/CCไม่เปลี่ยนหลักเดิม;checkpointresume/1x2x4/headless/runtime/serverและTimelineeventตรงกัน | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T114-AC-03` [TASK-114](done/tasks_114.md) | unit/API/mobile/public | unit/targeted/fullappropriate/build/M0/localmobileAPI/publicผ่านพร้อมอธิบายcontentmigration;ไม่มีแก้power/lootหรือownercloudsave | ผ่าน implementation/local/public; actualAndroid/cloudlatencyยังไม่อ้าง |
| `T115-AC-01` [TASK-115](done/tasks_115.md) | targeted/build/localmobile/public | ตารางอุปกรณ์1/1/20/40/40/60/60/60ใช้กับfarmและequipmentgacha;ทุกด่านบท2ได้poolLv1และบท3Lv20 ไม่เพิ่มTier10 | ผ่าน targeted/build/localAPI-SQL-mobile/public |
| `T115-AC-02` [TASK-115](done/tasks_115.md) | targeted/build/localmobile/public | การ์ดfarm/gacha/Towerคงpoolและchanceเดิม;ของเดิมและpendingTier20คงครบ,migrationเปลี่ยนfuturefarmchapter2เป็นTier1โดยไม่ล้างcursor/carry/RNG | ผ่าน targeted/build/localAPI-SQL-mobile/public |
| `T115-AC-03` [TASK-115](done/tasks_115.md) | targeted/build/localmobile/public | targetedrules/build/M0และเว็บproductioncontent/lootSHA/packตรง ผ่านก่อนdone | ผ่าน targeted/build/localAPI-SQL-mobile/public |
| `T116-AC-01` [TASK-116](done/tasks_116.md) | targeted/build/localmobile/public | รายการเปลี่ยนอุปกรณ์ใช้double-chevron-upสีเขียว ไม่มีข้อความดีกว่าที่มองเห็นและไม่มีป้ายแดง;มีaccessiblelabelเดิม | ผ่าน targeted/build/localAPI-SQL-mobile/public |
| `T116-AC-02` [TASK-116](done/tasks_116.md) | targeted/build/localmobile/public | เกณฑ์เทียบเลเวล/rarityและการสวมไม่เปลี่ยน ตรวจmobile320/390และbuild/publicก่อนdone | ผ่าน targeted/build/localAPI-SQL-mobile/public |

| `T117-AC-01` [TASK-117](done/tasks_117.md) | generator/TS/localAuth/mobile/public | 180ด่าน/9บท/9-1ต่อ8-20/50ด่านใหม่เชื่อมครบ/maxแนะนำ70;130แถวเดิมเท่าbaselineทุกfield;generatorcurrent+legacyreproducible | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/public |
| `T117-AC-02` [TASK-117](done/tasks_117.md) | generator/TS/localAuth/mobile/public | native14ชนิดใหม่มีrotation3–4ท่า/traits/ธาตุ/ภาพตรงdefinition;checkpointบอส10/20/30/40/50ต่างกัน;ท่าใหญ่ทุก5ด่านขัดได้และengine/runtime1x2x4ตรงกัน;ท้าบอสมีตัวเดียว | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/public |
| `T117-AC-03` [TASK-117](done/tasks_117.md) | generator/TS/localAuth/mobile/public | rewardchapter9ครบ/ฟาร์มTier60/การ์ด1–130คงpool+chanceเดิมและใหม่ไม่เกิน2%;migrationคงprogress/pending/cursor/RNG;dailychapter9schemaและcommandใช้ได้;ไม่มีSQLหรือTier/Hi-classเปิดใหม่ | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/public |
| `T117-AC-04` [TASK-117](done/tasks_117.md) | generator/TS/localAuth/mobile/public | actualisolatedAPI+mobile320/390เลือก9-1/9-50และbattle/farmidentityถูก/firstclearครั้งเดียว/reloadใช้เซฟได้;nativepackไม่เพิ่มpayloadและไม่เกิน32MiB;M0/targeted/buildผ่าน;hostedpubliccontent/pack/bundlesตรงก่อนdone | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/public |
| `T118-AC-01` [TASK-118](done/tasks_118.md) | TS/build/mobile/public | 330ด่าน12บท;150ใหม่เชื่อมครบ/15bossช่วง/180แถวเดิมและ25actors17programsเดิมเท่าfixture;generatorcurrentและlegacyตรง | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T118-AC-02` [TASK-118](done/tasks_118.md) | TS/build/mobile/public | บท10–11ล็อกHi-classและcap,บท12ล็อกAwaken;UI/API/farmใช้กฎเดียว/dailyไม่นับบทล็อก;cap70และownerprogressเดิม | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T118-AC-03` [TASK-118](done/tasks_118.md) | TS/build/mobile/public | enemy90checkpointได้แต่party71ไม่ได้;36nativeactors/2programsใหม่มีtraitsและeffectsจริง/interrupt/1x2x4ตรง;1bossต่อchallenge | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T118-AC-04` [TASK-118](done/tasks_118.md) | TS/build/mobile/public | Chrome320390ดู3บท50cellsล็อกและAPIrejectได้;runtime≤32MiB/build/M0/targeted/publicVercelผ่าน ไม่มีownerwriteหรือSQL | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T119-AC-01` [TASK-119](done/tasks_119.md) | TS/build/mobile/public | 19jobs126skillsรวมinherited/passive/copy;เลือกรankและpresetได้/queryvalid/defaultinvalidปลอดภัย;ทุกskillranks1/maxresolveด้วยengineจริง | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T119-AC-02` [TASK-119](done/tasks_119.md) | TS/build/mobile/public | Activeแสดงcast/VFX/audioจริง/Passiveไม่มีfakecast;heal/buff/summon/spheres/SpellBreakerมีบริบท;ไม่เรียกSaveControllerหรือaccountcommands | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T119-AC-03` [TASK-119](done/tasks_119.md) | TS/build/mobile/public | Chrome320390ไม่ล้น/เลือกเร็วไม่เห็นsceneเก่าทับ/playpause/replay/speed/visibility/audio/กลับเกมได้;ไม่มีAPIwrites | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T119-AC-04` [TASK-119](done/tasks_119.md) | TS/build/mobile/public | lazyrouteไม่เพิ่มgamebootstrap/targeted/build/boundariesและpublicVercelผ่าน;assetsไม่downloadภายนอก/ไม่เปลี่ยนbalanceหรือownerstate | ผ่าน TS/build/filteredbuild/localAuthAPI-SQL/mobile/native/public |
| `T120-AC-01` [TASK-120](done/tasks_120.md) | TS/build/mobile/public | สมุดสกิลภายในเกมเข้าได้จากSettings/หน้าสกิล/เปลี่ยนอาชีพ;19jobs126skillsรวมinherit/passive/copy/ยังไม่เรียน เลือกrank/searchอ่านผลได้และไม่มีลิงก์เปิดแท็บใหม่ในเมนูเกม | ผ่าน TS/build/localAuthAPI-SQL/mobile/public |
| `T120-AC-02` [TASK-120](done/tasks_120.md) | TS/build/mobile/public | Timeline draft/live/หลังจบและLogแตะดูรายละเอียดได้;ใช้actualactor resolveddefinitionและrankจากsessionพร้อมเวลา/ผลเดิม,missingไม่เดา;ปิดกลับTimelineได้โดยไม่หยุดหรือresetไฟต์ | ผ่าน TS/build/localAuthAPI-SQL/mobile/public |
| `T120-AC-03` [TASK-120](done/tasks_120.md) | TS/build/mobile/public | อ่านcatalog/Timelineไม่มีsavecommandsหรือsimulationใหม่/ไม่มีbody-VFX-audioโหลดจากcatalog;สกิลคิวอาชีพทุนและcontent/packhashไม่เปลี่ยน;nativeicons320390/focus/Escape/เลือกเร็วไม่stale | ผ่าน TS/build/localAuthAPI-SQL/mobile/public |
| `T120-AC-04` [TASK-120](done/tasks_120.md) | TS/build/mobile/public | targeted/build/boundaries/readiness/actualAuthAPI-SQL-mobileและpublicproductionผ่านก่อนdone ไม่SQL/env/ownerwrite/balancebatch | ผ่าน TS/build/localAuthAPI-SQL/mobile/public |

| `T121-AC-01` [TASK-121](done/tasks_121.md) | job graph/skill inheritance/build | catalog สร้าง19อาชีพเดิมตามลำดับเดิม และ fixture4ขั้นคืน ancestry ที่ถูกต้อง;ปฏิเสธ parentหาย/cycle/duplicate/cross-root โดยไม่แก้ input | ผ่าน targeted/build/boundaries |
| `T121-AC-02` [TASK-121](done/tasks_121.md) | job graph/skill inheritance/build | การเรียน/validate/compile/สมุดสกิล/preview ใช้ ancestry เดียวกัน;Hi-classfixtureสืบทอดClass1+Class2ของตน ไม่ได้ท่าสายพี่น้อง/ต่างroot | ผ่าน targeted/build/boundaries |
| `T121-AC-03` [TASK-121](done/tasks_121.md) | job graph/skill inheritance/build | Class2จริง19อาชีพ126สกิล/cap70/lockedบท10–12/ทุนและloadoutเดิมคงพฤติกรรม;targeted tests/typecheck/build/boundariesผ่าน | ผ่าน targeted/build/boundaries |
| `T121-AC-04` [TASK-121](done/tasks_121.md) | job graph/skill inheritance/build | design45 ระบุรายการต้องทำก่อนเปิดHi-class/คำตอบที่ยังรอ/26ท่าใหม่/ภาพ/อัปเลเวล/เซฟ/Awaken และไม่อ้างว่าHi-classเสร็จจากฐานโครงสร้าง | ผ่าน targeted/build/boundaries |

| `T122-AC-01` [TASK-122](done/tasks_122.md) | Hi-class/Awaken integration | ActiveHi fixtureเลื่อนสายเดิมที่70โดยไม่เปลี่ยนStatus/สกิล/loadout/equipment/ทุน;ต่ำ70/ปิดfeature/inbattle/ข้ามrootNPCถูกปฏิเสธ | ผ่าน594full/23focused/build/M0;Hiยังปิด |
| `T122-AC-02` [TASK-122](done/tasks_122.md) | Hi-class/Awaken integration | Level71–90ใช้ต้นทุน/แต้มmanualที่คำนวณได้,gate80แยกจากpromotionและไม่มีgate70;Class2ยังcap70 | ผ่าน594full/23focused/build/M0;Hiยังปิด |
| `T122-AC-03` [TASK-122](done/tasks_122.md) | Hi-class/Awaken integration | Schemaรองรับ13Hi jobs/90/gate80แต่รุ่นปัจจุบันยังปิดHiและcap70;เซฟClass2ยังผ่านและไม่มีauto-promote | ผ่าน594full/23focused/build/M0;Hiยังปิด |
| `T122-AC-04` [TASK-122](done/tasks_122.md) | Hi-class/Awaken integration | Targeted progression/schema/build/boundariesและlegacyregressionผ่าน;ไม่เปิดreleaseก่อนสกิล/ภาพ/Awakenและintegrationครบ | ผ่าน594full/23focused/build/M0;Hiยังปิด |
| `T123-AC-01` [TASK-123](done/tasks_123.md) | Hi-class/Awaken integration | 13Hi professionsมี2stable skillsต่ออาชีพครบprogram/rank1–10/ราคา/ชื่อ/คำอธิบายจริง;unlock70และ80/full88และ89 | ผ่านcontent/art/rank/goldens/localbuild;รอ125เปิดจริง |
| `T123-AC-02` [TASK-123](done/tasks_123.md) | Hi-class/Awaken integration | Nativebody/head/weapon/actionของ24genderpresetsและjob/skilliconsตรงต้นทาง;packไม่เกิน32MiBหรือมีทางปรับลดที่ตรวจได้ | ผ่านcontent/art/rank/goldens/localbuild;รอ125เปิดจริง |
| `T123-AC-03` [TASK-123](done/tasks_123.md) | Hi-class/Awaken integration | ทุกprogramใช้sharedtypedpipeline/สถานะ/ธาตุ/คิวเดิมและมีdistinctrole;สกิลเดิมไม่ถูกย้าย/ลบทิ้ง | ผ่านcontent/art/rank/goldens/localbuild;รอ125เปิดจริง |
| `T123-AC-04` [TASK-123](done/tasks_123.md) | Hi-class/Awaken integration | Content/golden/targeted1x2x4/build/metadata/nativepreviewผ่าน;ไม่อ้างว่าบาลานซ์ทีมผู้ใช้แล้วและยังไม่เปิดreleaseเดี่ยว | ผ่านcontent/art/rank/goldens/localbuild;รอ125เปิดจริง |
| `T124-AC-01` [TASK-124](done/tasks_124.md) | Hi-class/Awaken integration | Hi+สกิลMaxจึงAwakenได้;logicalID/loadoutเดิม/กลับrank1/คงทุนเดิม/variantเพิ่มหรือเปลี่ยนผลและเก่งกว่าก่อนAwakenMax | ผ่านpure rules/migration/ledger/152parity/nativecomponents;125เปิดจริง |
| `T124-AC-02` [TASK-124](done/tasks_124.md) | Hi-class/Awaken integration | เศษใหม่ดรอปดันช่วงหลัง/รวมเดิม→ใหม่/ย่อยใหม่→เดิมเป็นbatchatomic;ไม่มีวงแลกเพิ่มของ/overflow/คืนทุนซ้ำ | ผ่านpure rules/migration/ledger/152parity/nativecomponents;125เปิดจริง |
| `T124-AC-03` [TASK-124](done/tasks_124.md) | Hi-class/Awaken integration | อัปAwakenใช้variantราคาและเศษใหม่/ledgercostversionจริง;รีเซ็ตคืนbase+Awakenจริงครั้งเดียวและmigrationเซฟเก่าไม่สูญหายหรือแจกเศษย้อนหลัง | ผ่านpure rules/migration/ledger/152parity/nativecomponents;125เปิดจริง |
| `T124-AC-04` [TASK-124](done/tasks_124.md) | Hi-class/Awaken integration | หน้าสกิล/สมุด/Timelineแสดงvariant/rank/ผลจริงพร้อมpurpleinnerglow/nativeicon;runtime/headless/checkpoint/1x2x4ใช้definitionเดียวกัน | ผ่านpure rules/migration/ledger/152parity/nativecomponents;125เปิดจริง |
| `T125-AC-01` [TASK-125](done/tasks_125.md) | Hi-class/Awaken integration | เปิดHi70/Awakenรายสกิล/levelcap90/บท10–12เมื่อถึงgateจริง;ไม่เปิดArtifact/Class3/Pet/Rune | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |
| `T125-AC-02` [TASK-125](done/tasks_125.md) | Hi-class/Awaken integration | FreshlocalAuthAPI-SQL-mobile320390ผ่าน70→Hiรักษาบิลด์→Awaken→อัป→แลกเศษ→gate80→สกิลใหม่→ไฟต์→reload/slotisolation | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |
| `T125-AC-03` [TASK-125](done/tasks_125.md) | Hi-class/Awaken integration | OldClass2save migration/ทุนเดิม/AFKfrozen/carry/backup/receipt replay/response lossไม่ทำprogressหรือเศษซ้ำ;ปรับbatchเซฟไม่เพิ่มrequests | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |
| `T125-AC-04` [TASK-125](done/tasks_125.md) | Hi-class/Awaken integration | Fullappropriatechecks/filteredVercelbuild/packbudget→push→hostedpublichealth/artifactsและreleaseflagsตรงก่อนdone;ไม่เข้าบัญชีowner/ไม่รันbalancebatch | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |

| `T126-AC-01` [TASK-126](done/tasks_126.md) | batch equipment | คำแนะนำกับserverใช้helperเดียวกัน;เทียบTierก่อนrarityเมื่อTierเท่ากัน/เฉพาะใส่ได้และยังไม่มีเจ้าของ/ไม่เลือกจากoptions/lockedยังใส่ได้ | ผ่าน localmobile/onecommand/reconnect/reload/hosted |
| `T126-AC-02` [TASK-126](done/tasks_126.md) | batch equipment | คลิกเดียวเปลี่ยนเฉพาะช่องที่มีhintของตัวที่เลือก;หนึ่งatomiccommand/receipt/revision/optimisticpreview,ไม่แตะNPCอื่น/inventorypayload/ทุน/Refine/Enchant/cards และไม่ทำของหาย | ผ่าน localmobile/onecommand/reconnect/reload/hosted |
| `T126-AC-03` [TASK-126](done/tasks_126.md) | batch equipment | ไม่มีของ/actorหาย/inbattle/เกินlevel/อาวุธผิด/duplicate request/CASconflict/response lossมีผลที่ชัด;fullbagยังใส่ได้เพราะไม่เพิ่มinventory;ไม่มีpartialset | ผ่าน localmobile/onecommand/reconnect/reload/hosted |
| `T126-AC-04` [TASK-126](done/tasks_126.md) | batch equipment | ปุ่มmobile320390อ่านง่าย/ไม่ล้น/หายแจ้งเตือนเมื่อใส่แล้ว;targeted/build/boundaries/readiness/realAuth-SQL-mobile+hostedผ่านก่อนdone | ผ่าน localmobile/onecommand/reconnect/reload/hosted |

| `T127-AC-01` [TASK-127](done/tasks_127.md) | Sanctuary PureHoT | Sanctuaryมีเพียงapply_status ไม่มีopening_heal;เริ่มติ๊กที่cast_resolveแล้วทุก1sรวม6ครั้ง,105→175%MATKและทุกrankแรงกว่าเพลงHoTที่powerเท่ากัน;Bard/Dancer/genericregen125สกิลเดิมไม่เปลี่ยน | ผ่านtargeted/legacy-regression/mobile/hosted |

| `T127-AC-02` [TASK-127](done/tasks_127.md) | Sanctuary PureHoT | sharedengine/โบนัสฮีล/independentstack/interruptไม่มีฮีลหรือคืนSP/expiry/1x2x4/checkpointตรงกัน;ไม่เปลี่ยนคิวCTACDหรือสูตรฮีล | ผ่านtargeted/legacy-regression/mobile/hosted |

| `T127-AC-03` [TASK-127](done/tasks_127.md) | Sanctuary PureHoT | รายละเอียดทุกrankแสดงMATK/ทุก1s/6s/เริ่มทันทีและวงฮีลตามstatusจริง;targeted/build/M0/realAuthAPI-SQL-mobile320390/hostedผ่านก่อนdone | ผ่านtargeted/legacy-regression/mobile/hosted |

| `T128-AC-01` [TASK-128](done/tasks_128.md) | Hunter boss damage | Spiral Volley 3 hit รวม420→750%ATK/ธาตุอาวุธ, Claymore450→750%ATK, Rapid Fire4hitรวม630→1050%ATK; SP/CT/ACD/ราคาและ123สกิลเดิมไม่เปลี่ยน; Awakenต่อจากค่าที่ปรับแล้ว | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |

| `T128-AC-02` [TASK-128](done/tasks_128.md) | Hunter boss damage | ทุกrank/เป้าเดี่ยวและหมู่/ธาตุ/interrupt/1×2×4×/checkpoint ตรง sharedengine; คำอธิบายและผลหลายhitจริง; updated goldensเฉพาะ9cases | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |

| `T128-AC-03` [TASK-128](done/tasks_128.md) | Hunter boss damage | build/checks/native mobile320390/hostedpublicตรงsourceใหม่;ไม่แตะownerเซฟ/SQL/env/6173และไม่รันbalance batch | ผ่าน624TS/actualAuthSQL-mobile/hosted4groups |



| `T129-AC-01` [TASK-129](done/tasks_129.md) | fixture ทุกตัวผ่าน validation; มี Class2 13/High13 และทุก gear tier ที่ขอ, สี่ช่องไม่ซ้ำ, manual points จริง, ไม่มีบัฟ stat ฟรี | shared engine / tests / reports | ผ่าน |

| `T129-AC-02` [TASK-129](done/tasks_129.md) | matched seeds/boss/gear/level/rank; training แยก pressure/team; ดาเมจ normal+skills รวมเท่ากับ owner รวม summon และ effective heal ไม่รวม overheal | shared engine / tests / reports | ผ่าน |

| `T129-AC-03` [TASK-129](done/tasks_129.md) | หลายบิลด์/สรุป mean+ช่วงความไม่แน่นอน/held-out seeds, skill breakdown+resource skips+survival; replay ทำซ้ำได้ | shared engine / tests / reports | ผ่าน |

| `T129-AC-04` [TASK-129](done/tasks_129.md) | รายงาน JSON/CSV/HTML/Markdown ระบุ content hash, command, เงื่อนไข/ต้นทุน/ข้อจำกัด; tests/typecheck/boundaries ผ่าน ไม่มี gameplay/owner save mutation | shared engine / tests / reports | ผ่าน |

| `T130-AC-01` [TASK-130](done/tasks_130.md) | 152variantsมีgainเฉพาะหน้าที่ตรวจได้ ไม่มีgeneric+10%CCresistanceเป็นโบนัสใหม่เดี่ยว; โบนัสจริงขึ้นตามrankและมีตารางอธิบายรายสกิล | shared engine / tests / reports | ผ่าน631TS/832paired/native+hosted4groups |

| `T130-AC-02` [TASK-130](done/tasks_130.md) | active+passive representative oracle และทุก152variant actual sharedengine/1x2x4/checkpointผ่าน; hitรวม/โอกาส/การขัด/ช่วงเวลา/targetsถูกต้อง | shared engine / tests / reports | ผ่าน631TS/832paired/native+hosted4groups |

| `T130-AC-03` [TASK-130](done/tasks_130.md) | base152นิยาม/ราคา/Awakenเศษ/ทุน/IDs/nativeicons/queueเดิม; อธิบายสกิล/สมุดสกิล/Timelineตรงผลจริงและไม่มีคำอธิบายตกหล่น | shared engine / tests / reports | ผ่าน631TS/832paired/native+hosted4groups |

| `T130-AC-04` [TASK-130](done/tasks_130.md) | targeted/full checksตามความจำเป็น/build/boundaries/native mobile/public deploymentผ่าน และผลbefore-afterอ้างcontent hashแยกจากTASK129ชัด | shared engine / tests / reports | ผ่าน631TS/832paired/native+hosted4groups |

## TASK-131 — Boss focus และ balance

| Case | Task | เกณฑ์ | Input / Expected / วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T131-AC-01` | TASK-131 | สกิลหมู่ยังตีหลายเป้าได้ พลังเพิ่มเฉพาะ resolve ที่มีศัตรู living/targetable ตัวเดียว; ฝั่งฝ่ายเดียวกัน/ตัวตาย/untargetable ไม่นับ; direct/periodic snapshot ไม่บวกซ้ำและไม่เพิ่มให้ normal/heal | tests/game/boss-focus.test.ts / scripts/game/boss-focus-audit.ts / shared engine + native UI | passed_implementation |
| `T131-AC-02` | TASK-131 | ราคา/ทุน/IDs/เลเวล/CT/ACD/SP/interrupt/4-slot/uncapped buffs เดิม; descriptions แสดง bonus จริง และทุกการเปลี่ยนข้อมูลระบุได้ | tests/game/boss-focus.test.ts / scripts/game/boss-focus-audit.ts / shared engine + native UI | passed_implementation |
| `T131-AC-03` | TASK-131 | มี fixed A/B และ candidate re-screen หลายระดับ/gear/seed พร้อม total/skill/team DPS; รายงานผลและข้อจำกัดตามจริง ไม่ปิด TASK041 จาก dummy ตัวเดียว | tests/game/boss-focus.test.ts / scripts/game/boss-focus-audit.ts / shared engine + native UI | passed_implementation |
| `T131-AC-04` | TASK-131 | targeted/full regression/build/boundaries/mobile/public deployment ผ่านพร้อมหลักฐาน | tests/game/boss-focus.test.ts / scripts/game/boss-focus-audit.ts / shared engine + native UI | passed_implementation |

## TASK-132 — Assassin Cross ต้นเหตุบาลานซ์

| Case | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T132-AC-01` | TASK-132 | มี causal ablation และ per-skill/crit/uptime/overlap จริง ระบุแหล่งที่นำ พร้อมข้อจำกัดของ marginal comparisons | actual ablation / fixed A-B / tests / browser | passed_implementation |
| `T132-AC-02` | TASK-132 | ปรับเฉพาะ curve/effect ที่ระบุ ไม่มี job penalty หรือ buff cap/refresh; IDs/ราคา/ทุน/CT/ACD/SPเดิม; programอื่นนอกEP/HighCartTerminationไม่เปลี่ยน และ Awaken1ยังดีขึ้นจาก baseMax | actual ablation / fixed A-B / tests / browser | passed_implementation |
| `T132-AC-03` | TASK-132 | fixed A/B และ candidate re-screen หลายseed/solo/pressure/ช่วงAwaken; Hi90/Common60/4ActiveAw10 สายดาเมจ9อาชีพเฉลี่ย9–11k และClass2Assassinใกล้Hunter/Wizardที่gearเท่ากัน ไม่อ้างทุกencounterสมดุล | actual ablation / fixed A-B / tests / browser | passed_implementation |
| `T132-AC-04` | TASK-132 | regression/parity/stacking/descriptions/build/mobile/public release ผ่าน และบันทึกหลักฐาน | actual ablation / fixed A-B / tests / browser | passed_implementation |

## TASK-133 — คำอธิบาย P.ATK/M.ATK และ Impo/Loud บัฟเวท

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T133-AC-01` | TASK-133 | คำอธิบาย shared ของทุกสกิล/ทุก rank/Timeline ระบุ P.ATK หรือ M.ATK ตามสูตรจริง ไม่มี ATK หรือพลังโจมตีที่กำกวม | Shared tests/local/hosted browser | passed_implementation |
| `T133-AC-02` | TASK-133 | Impositio และ Loud Voice เพิ่ม M.ATK เท่ากับ P.ATK ในทุก rank รวม Awaken; ค่าเดิม/เวลา/ราคา/ทุน/คิว/independent stacking คงเดิม | Shared tests/local/hosted browser | passed_implementation |
| `T133-AC-03` | TASK-133 | ตรวจ actual engine ว่า stats ทั้งสองเพิ่ม/ซ้อน/หมดตามเวลา และ UI มือถือแสดงผลตรง program; regression/build ผ่าน | Shared tests/local/hosted browser | passed_implementation |

## TASK-134 — รับรางวัล Story/Tower อัตโนมัติในผลไฟต์

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T134-AC-01` | TASK-134 | Story/Tower ชนะครั้งแรกจ่ายรางวัลทันทีใน battle finish เดียวพร้อม receipt/revision เดียว; ไม่มีปุ่มรับรางวัลและไม่ต้องเปิด AFK | Shared tests/local/hosted browser | passed_implementation |
| `T134-AC-02` | TASK-134 | Story first clear ปิดและจ่ายช่วงฟาร์มเดิมอย่างถูกต้อง ย้าย frontier farm ใน commit เดียวโดยเคารพจุดเก่าที่ผู้เล่นเลือก; ไม่จ่ายซ้ำเมื่อ replay/reload/แพ้ | Shared tests/local/hosted browser | passed_implementation |
| `T134-AC-03` | TASK-134 | กระเป๋าเต็มไม่ทำผลไฟต์ค้างหรือรางวัลหาย: เก็บรางวัลชิ้นของไว้เป็น pending ที่กู้รับอัตโนมัติเมื่อมีพื้นที่; Auto หยุดพร้อมสาเหตุ | Shared tests/local/hosted browser | passed_implementation |
| `T134-AC-04` | TASK-134 | Actual Auth/API/SQL/mobile/reload/response-loss proof และ tests/build ผ่าน; daily/AFKปกติยังคง flow เดิม | Shared tests/local/hosted browser | passed_implementation |

## TASK-135 — Auto Battle ด่านและหอคอยจนแพ้ครบกำหนด

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T135-AC-01` | TASK-135 | เริ่ม/หยุด Auto ได้ใน Story และ Tower; ชนะแล้วรอ confirmed settlement ก่อนเข้าสู่ด่านหรือชั้นถัดไป อิง frontier จริง | Shared tests/local/hosted browser | passed_implementation |
| `T135-AC-02` | TASK-135 | แพ้/หมดเวลาทำ retry ด่านเดิมตามจำนวนที่ยืนยันและ reset ตัวนับเมื่อชนะ; receipt เดิม/ rerender ไม่ทำ retry ซ้ำ | Shared tests/local/hosted browser | passed_implementation |
| `T135-AC-03` | TASK-135 | กดหยุดยกเลิกการเริ่มไฟต์ถัดไปทันที ปล่อยไฟต์ปัจจุบันจบ; เปลี่ยนหน้า/เซฟ/reload/เน็ตขาด/กระเป๋าเต็ม/error หยุดอย่างชัดเจน ไม่เกิด background command loop | Shared tests/local/hosted browser | passed_implementation |
| `T135-AC-04` | TASK-135 | ใช้ combat engine เดิม/ความเร็ว1x2x4เดิม และ UI ปุ่มไม่ล้น320/390; actual browser/API/SQLหลายชนะ-แพ้/หยุด-ฟื้นเน็ต/reloadผ่าน | Shared tests/local/hosted browser | passed_implementation |

## TASK-136 — เพดานสกิลและคืนทุนส่วนเกิน

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T136-AC-01` | TASK-136 | Class2全rankตามunlock+40,30→70/40→80;Class1/Hiและราคา/programเดิม | Unit/actuallocal/hosted | passed_implementation |
| `T136-AC-02` | TASK-136 | ลดเฉพาะrankเกินและคืนทุนจริงครั้งเดียว,lowerledger/loadout/Aw/NPCคงเดิม | Unit/actuallocal/hosted | passed_implementation |
| `T136-AC-03` | TASK-136 | legacyprice/overflow failatomic,backup-CAS-replay/10slotsแยกจริง | Unit/actuallocal/hosted | passed_implementation |
| `T136-AC-04` | TASK-136 | UI320390 cap/full/next,tests/build/filtered/hostedhashตรง | Unit/actuallocal/hosted | passed_implementation |

## TASK-137 — Grimtooth625%และรักษาAssassinCrossในกรอบDPS

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T137-AC-01` | TASK-137 | Grimtoothbase375–625%P.ATK/Aw687.5–906.25%,AoE/focus/Expose/cost/queueเดิม;otherchangesเฉพาะผลเกินกรอบที่วัดจริง | Shared/native/hosted | passed_implementation |
| `T137-AC-02` | TASK-137 | matchedbefore-afterของAssassin70และAssX90/หลายชุดรวมGrim/seedคัดและตรวจแยก/commongear60/bossเดิม;HiDDmean9–11kหรือต้องแก้จุดเกินเฉพาะสกิล | Shared/native/hosted | passed_implementation |
| `T137-AC-03` | TASK-137 | base/Awrankall/effectivehit/speed1x2x4/checkpoint/ราคาและsavedskilllevelsไม่เปลี่ยน;historicalguardยังเข้มและfulltests/buildผ่าน | Shared/native/hosted | passed_implementation |
| `T137-AC-04` | TASK-137 | nativecatalog/Timeline/mobile320390คำอธิบาย625ตรงprogram;deploy/hostedhashตรงก่อนdone | Shared/native/hosted | passed_implementation |

## TASK-138 — แสดงขนาดบอสให้ตรงกับการ์ดตีขนาด

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T138-AC-01` | TASK-138 | ใช้ขนาดจริงsmall/medium/largeจากmonster_traitsและliveactorTagsไม่อนุมานจากsprite;Story/Tower/Dailyครบ | Shared/native/hosted | passed_implementation |
| `T138-AC-02` | TASK-138 | การ์ดsizeconditionalยังคิดตามtagตรงกับข้อความแสดง;missing/invalidไม่เดาเป็นlarge;ไม่เปลี่ยนstats/traits/cardrateหรือสูตร | Shared/native/hosted | passed_implementation |
| `T138-AC-03` | TASK-138 | หน้าต่อสู้/เลือกบอสก่อนเริ่มแสดงขนาดอ่านได้บน320390โดยไม่ทำbossbarรก;ไม่มีการเขียนเซฟจากการดู | Shared/native/hosted | passed_implementation |
| `T138-AC-04` | TASK-138 | tests/buildและnative/mobile/hostedผ่าน;ไม่มีowner/SQL/env/6173restart | Shared/native/hosted | passed_implementation |

## TASK-139 — ร้าน/แลกเศษ/Panel

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T139-AC-01` | TASK-139 | แลกเศษสกิลมีtab/flow/nativeicons/quantity/spacingและปุ่ม44pxอ่านง่าย320390,รวม10→1/ย่อย1→5เดิม;กรอกผิด/เงินไม่พอ/กดย้ำไม่สร้างหลายคำสั่ง | Shared/HTTP/mobile/hosted | passed_implementation |
| `T139-AC-02` | TASK-139 | ข้อความCrystalจากAFK/หาCrystalถูกเอาออกจากร้าน/การ์ด/อุปกรณ์ทั้งหมด ไม่มีช่องว่างทิ้งไว้ | Shared/HTTP/mobile/hosted | passed_implementation |
| `T139-AC-03` | TASK-139 | Crystal20ครั้งต่อวัน×10Crystal/25000gold;แพ็กวัสดุ10ครั้ง/วัน,Gold2500/3000/4000/5000,scroll6000/99สิทธิ์;grantเดิม/nonGoldpriceเดิม/ซื้อไปแล้วไม่นับใหม่ | Shared/HTTP/mobile/hosted | passed_implementation |
| `T139-AC-04` | TASK-139 | แลกทั้งหมดคิดmin(เงิน,โควตา,ขีดจำกัด,capacity)ด้วยsharedquote;1command/receipt/revision,20Crystalexchangeและ99scrollได้ในครั้งเดียว;overflow/ขาดเงิน/replay/dayrollไม่จ่ายซ้ำหรือหักบางส่วน | Shared/HTTP/mobile/hosted | passed_implementation |
| `T139-AC-05` | TASK-139 | Panelร้าน/แลกเศษ/หอคอย/ดัน/กาชา/Refine/Stats/เลือกอาชีพใช้white-blue surfacesสอดคล้อง ไม่แตะrarity/glow/ข้อมูลต่อสู้และmobileportrait | Shared/HTTP/mobile/hosted | passed_implementation |
| `T139-AC-06` | TASK-139 | unit/actualreducerและHTTP-receipt+mobile320390interaction/pending/reject/overflow/build+filtered/hostedผ่านก่อนdone;ไม่SQL/env/owner/6173 | Shared/HTTP/mobile/hosted | passed_implementation |

## TASK-140 — ผลเก่าไม่ย้อนระหว่างAuto

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T140-AC-01` | TASK-140 | Story/Tower แสดงผลเก่าหนึ่งครั้ง แล้วWarning→ไฟต์ใหม่; ไม่มีผลเก่าย้อนเมื่อAPIหรือprepareช้ากว่า2100ms | Native/unit/build/hosted | passed_implementation |
| `T140-AC-02` | TASK-140 | เริ่ม/จบครั้งเดียวต่อไฟต์; แพ้3ครั้ง/รับรางวัลเดิม/คิวและข้อมูลengineไม่เปลี่ยน | Native/unit/build/hosted | passed_implementation |
| `T140-AC-03` | TASK-140 | หยุดระหว่างintroยกเลิกnextได้,เริ่มไม่สำเร็จหยุดAutoและปุ่มไม่ค้าง; UIมือถือ320390ไม่overflow | Native/unit/build/hosted | passed_implementation |
| `T140-AC-04` | TASK-140 | meaningfulnative regression/unit/uncachedbuild+filtered/Vercel+hostedผ่าน;ไม่owner/SQL/env/6173 | Native/unit/build/hosted | passed_implementation |

## TASK-141 — HUDบอสและพื้นที่ดาเมจ

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T141-AC-01` | TASK-141 | HPบอสและข้อมูลย่อสูงไม่เกิน52px และลดพื้นที่ด้านบนอย่างน้อยครึ่งหนึ่งเทียบเดิมที่320390;ธาตุ/ขนาด/HPยังอ่านหรือเปิดรายละเอียดได้ | Native/build/hosted | passed_implementation |
| `T141-AC-02` | TASK-141 | ย้ายสถิติ/Timeline/speed/retreat/Autoเป็นแถวเดียวในdockล่าง;ปุ่มอย่างน้อย36pxและAuto/แพ้0of3ยังชัด;แถบทีม/สถานะไม่ทับกัน | Native/build/hosted | passed_implementation |
| `T141-AC-03` | TASK-141 | actualnativeบน320x640/390x844เห็นwhite/yellowdamageจากengineและcaptureglyphbounds;ตรวจไม่ให้HP/controlsบังตัวเลขในตัวอย่างและเปิดปุ่มหลักได้ ไม่มีhorizontaloverflow | Native/build/hosted | passed_implementation |
| `T141-AC-04` | TASK-141 | uncachedroot+filteredbuild/M0/publichostedผ่าน;ไม่เปลี่ยนengine/สูตร/การเซฟ/ข้อมูลและไม่owner/SQL/env/6173 | Native/build/hosted | passed_implementation |
| `T141-AC-05` | TASK-141 | หน้าจบStory/Tower/Dailyจัดปุ่มหลัก44px/รอง36pxเป็นกลุ่ม;แยกbodyเลื่อนกับfooterที่เห็นเสมอบน320x568/390x844;next/retry/team/exit/Stats/Timelineและlocked/pending/Autoคงcallbacksเดิม | Native/build/hosted | passed_implementation |

## TASK-142 — บทบาทสกิลแยกกัน

| ID | Task | เกณฑ์ | วิธีตรวจ | สถานะ |
| --- | --- | --- | --- | --- |
| `T142-AC-01` | TASK-142 | BlessingรวมASPDของIncreaseAGIและแยกแกนบัฟจากImpo;RuwachHolyMATKโจมตี+ลดDEF/MDEFพร้อมicon/effectถูกชนิด | Audit/engine/native/hosted | passed_implementation |
| `T142-AC-02` | TASK-142 | auditทั้ง152base/Awakenและแก้กลุ่มซ้ำจริงให้มีบทบาทต่างกัน รวมEndure/AutoGuard;sharedancestry/copyspell/pairedhealsต้องระบุเหตุผลหรือแยกจังหวะโดยคงidentity | Audit/engine/native/hosted | passed_implementation |
| `T142-AC-03` | TASK-142 | ทุกrank1–10มีความก้าวหน้าและAwaken1ดีกว่าbaseMaxในผลหลักรวม;อธิบายP.ATK/M.ATK/DEF-MDEF/เป้าหมาย/ระยะเวลา/CCให้ตรงจริง | Audit/engine/native/hosted | passed_implementation |
| `T142-AC-04` | TASK-142 | ใช้sharedengine/statuspipeline;buffindependent/noaggregatecap/normal4slot/SPcaststart/retryrulesเดิม;นอกscopebyteเท่าเดิมและprice/timing/unlockไม่เปลี่ยน | Audit/engine/native/hosted | passed_implementation |
| `T142-AC-05` | TASK-142 | เซฟเดิมคงskillrank/slot/Awaken/paidledgerและแปลงversionผ่านbackupflow,oldreceiptsยังอ่านได้;ไม่owner/SQL/env/6173 | Audit/engine/native/hosted | passed_implementation |
| `T142-AC-06` | TASK-142 | meaningfulactualeffects/fulltests/M0/assets/root+filteredbuild/nativeUI/hostedผ่านก่อนdone;รายงานขอบเขตไม่อ้างglobalbalanceจากแค่unit | Audit/engine/native/hosted | passed_implementation |

## TASK-143 — Modern migration v2 icons

| Case | Task | Criterion | Verification | Status |
| --- | --- | --- | --- | --- |
| `T143-AC-01` | TASK-143 | ไอคอน21รายการตรงพาธmigration-v2.txtรวมRuwach/20Hi;มีprovenance/sidecar/sourceSHAไม่เดาไฟล์ | source/schema/engine/native/build/hosted | passed_implementation |
| `T143-AC-02` | TASK-143 | คง152logicalIDs/ต้นทุน/ranks/Awakenและmediaที่ไม่เกี่ยวข้อง;AssCross/StalkerมีpurpleVFXตามคำขอ | source/schema/engine/native/build/hosted | passed_implementation |
| `T143-AC-03` | TASK-143 | runtimepackdependencyครบและอยู่ในbudget,assetchecks+sourcebindingtestsผ่าน | source/schema/engine/native/build/hosted | passed_implementation |

## TASK-144 — Hi-class v2 composable skills

| Case | Task | Criterion | Verification | Status |
| --- | --- | --- | --- | --- |
| `T144-AC-01` | TASK-144 | ปรับ20Hi skillsตามmigration-v2รวมAssumptio/BondFate/Aura/Spiral/Champion/HW/Professor/Stalker/WS/Creator;GospelและCartTerminationคงผลเดิมเว้นภาพ | source/schema/engine/native/build/hosted | passed_implementation |
| `T144-AC-02` | TASK-144 | BondFateลิงก์10sเลือกเพื่อนพลังสูงสุดล็อกเป้าเพิ่มlaneสูงสุดด้วย40–60%casterMATKและฮีลทันที80%MATK/วิพร้อมเส้นเชื่อม | source/schema/engine/native/build/hosted | passed_implementation |
| `T144-AC-03` | TASK-144 | Gateจ่าย5ballsและSPตอนเริ่มร่าย,HPถึง1%เมื่อเกิดดาเมจคิดจากเสียจริง;DoubleCastingสุ่มสูงก่อนและเฉพาะBolt;ChaseWalkตามคำตอบผู้ใช้ | source/schema/engine/native/build/hosted | passed_implementation |
| `T144-AC-04` | TASK-144 | ทุกphase/rank/Awakenมีคำอธิบายและผลจริง;พฤติกรรมใช้typedcomposition+seededengineร่วมruntime/headless/checkpoint | source/schema/engine/native/build/hosted | passed_implementation |
| `T144-AC-05` | TASK-144 | คงIDs/skillledger/cap/costอื่น/4slots/CC/SPrules;oldsavebackup/replay/migrationไม่reset | source/schema/engine/native/build/hosted | passed_implementation |

## TASK-145 — Hi-class v2 review and release

| Case | Task | Criterion | Verification | Status |
| --- | --- | --- | --- | --- |
| `T145-AC-01` | TASK-145 | วัดactualbefore-afterแบบboundedmatchedseed/equalbudget/bossเดียวกัน,รายงานtotalDPS/skilldamage/HPcost/supportไม่ตัดสินsupportด้วยsoloDPS | source/schema/engine/native/build/hosted | passed_implementation |
| `T145-AC-02` | TASK-145 | ทดสอบmechanics/invalidschemas/expiry/death/multihits/interruption/1x2x4/checkpoint/oldreceiptsพร้อมfullTSและM0 | source/schema/engine/native/build/hosted | passed_implementation |
| `T145-AC-03` | TASK-145 | native320390ครบภาพ/description/Link/Timeline/HPsacrifice/multihitและpurpleVFX;root+filteredbuild/assetsผ่าน | source/schema/engine/native/build/hosted | passed_implementation |
| `T145-AC-04` | TASK-145 | pushและVercelSUCCESSพร้อมpublichostedตรวจcontent/pack/API/bundles/mobile;ไม่owner/SQL/env/6173restart | source/schema/engine/native/build/hosted | passed_implementation |

## TASK-146 — Native ultimate VFX/readable numbers

| Case | Task | Criterion | Method | Status |
| --- | --- | --- | --- | --- |
| `T146-AC-01` | TASK-146 | design59/TASK146AC01 | Native/checksum/replay/build/hosted | passed_implementation |
| `T146-AC-02` | TASK-146 | design59/TASK146AC02 | Native/checksum/replay/build/hosted | passed_implementation |
| `T146-AC-03` | TASK-146 | design59/TASK146AC03 | Native/checksum/replay/build/hosted | passed_implementation |
| `T146-AC-04` | TASK-146 | design59/TASK146AC04 | Native/checksum/replay/build/hosted | passed_implementation |

## TASK-147 — ระดับอุปกรณ์ฟาร์ม

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T147-AC-01` | TASK-147 | design60/AC01 | Native/all stages actual pool | passed_implementation |
| `T147-AC-02` | TASK-147 | design60/AC02 | Mobile/build/public | passed_implementation |

## TASK-148 — ของ80/100และHi cap100

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T148-AC-01` | TASK-148 | design61/AC01 | Typed/native/build/public | passed_implementation |
| `T148-AC-02` | TASK-148 | design61/AC02 | Typed/native/build/public | passed_implementation |
| `T148-AC-03` | TASK-148 | design61/AC03 | Typed/native/build/public | passed_implementation |

## TASK-149 — วงออร่าเพลง

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T149-AC-01` | TASK-149 | design62/AC01 | Native/status/build/public | passed_implementation |
| `T149-AC-02` | TASK-149 | design62/AC02 | Native/status/build/public | passed_implementation |

## TASK-150 — ตัวเลขและแอสเซ็ตพื้น

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T150-AC-01` | TASK-150 | design63/AC01 | Native/flight/engine parity | passed_implementation |
| `T150-AC-02` | TASK-150 | design63/AC02 | Ground audit/build/public | passed_implementation |

## TASK-151 — พื้นสกิลnative

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T151-AC-01` | TASK-151 | design64/AC01 | actual status/native fields | passed_implementation |
| `T151-AC-02` | TASK-151 | design64/AC02 | native/lossless/assets/build/public | passed_implementation |

## TASK-152 — เลขใหญ่/เด้งกระแทก

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T152-AC-01` | TASK-152 | design65/AC01 | native comparison/flight | passed_implementation |
| `T152-AC-02` | TASK-152 | design65/AC02 | existing checks/build/public | passed_implementation |

## TASK-153 — ยืนยันย่อย/สุ่มต่อและพื้นออร่า

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T153-AC-01` | TASK-153 | design66/AC01 | native/UI/source/build/public | passed_implementation |
| `T153-AC-02` | TASK-153 | design66/AC02 | native/UI/source/build/public | passed_implementation |
| `T153-AC-03` | TASK-153 | design66/AC03 | native/UI/source/build/public | passed_implementation |

## TASK-154 — ย่อยการ์ดหลายใบ

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T154-AC-01` | TASK-154 | design67/AC01 | UI/TS/build/public | passed_implementation |
| `T154-AC-02` | TASK-154 | design67/AC02 | UI/TS/build/public | passed_implementation |

## TASK-155 — การ์ดเวทผสม

| Case | Task | Expected | Verification | Status |
| --- | --- | --- | --- | --- |
| `T155-AC-01` | TASK-155 | design68/AC01 | data/engine/native/build/public | not_run_implementation |
| `T155-AC-02` | TASK-155 | design68/AC02 | data/engine/native/build/public | not_run_implementation |
| `T155-AC-03` | TASK-155 | design68/AC03 | data/engine/native/build/public | not_run_implementation |
