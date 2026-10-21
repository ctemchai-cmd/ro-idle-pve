# ขอบเขตรุ่นแรกและเส้นทางพัฒนาตัวละคร

วันที่: 19 ตุลาคม 2026 · เจ้าของ: TASK-001 · **baseline ที่ผู้ช่วยออกแบบจากข้อยืนยัน D-001–D-038**

กติกาที่ผู้ใช้ยืนยันยังอยู่ใน [decisions](../decisions.md) ตัวเลขต้นทุน/แต้มและจุดปลดด้านล่างเป็นแบบตั้งต้นเพื่อให้ TASK-002–013 ทำต่อได้ ไม่ใช่สูตรที่ถอดจาก Ragnarok Idle Adventure Plus หรือผลพิสูจน์ pace แล้ว ดูข้อมูลเต็มใน [progression.json](../data/progression.json)

## รุ่น Class 2 รวมอะไรบ้าง

| ส่วน | รุ่นแรก | ส่วนถัดไป |
| --- | --- | --- |
| ตัวละคร | main + roster NPC 6 ตัว, ทีม main+NPC3 หน้า2/หลัง2, เปลี่ยนสาย/ลงแต้มเอง | เพิ่มความสามารถภายใต้ตัวละครเดิม ไม่เพิ่ม NPC จากการแตกสาขา |
| อาชีพ | Class 1 หกสาย; Knight/Crusader/Priest/Monk/Hunter/Bard/Dancer/Wizard/Sage/Assassin/Rogue/Blacksmith/Alchemist | Hi-class/Awaken/Artifact ที่ Lv.70; Class 3 ที่ Lv.120 |
| การต่อสู้ | สี่ Active ไม่ซ้ำท่า, Passive อัตโนมัติ, คิวขนาน/CC/บัฟตามข้อยืนยัน | เพิ่มสกิลผ่าน effects/handlers/variants ชุดเดิม |
| ความก้าวหน้า | Lv.1–70, Breakthrough20/40/60, Skill cap ตามเลเวล | release cap เป็นข้อมูล ไม่ฝัง Lv.70 ใน engine |
| ของ/เงิน | อุปกรณ์หก slot, tier1/20/40/60, rarity7, Refine+10, Enchant/การ์ดประจำ slot, ผสม/อัป tier, กาชาการ์ด | tier80/100 เมื่อปลด cap; Pet/Rune เป็นอนาคต |
| โหมด | Story10ด่าน/บท, AFK12ชม, Infinity Tower, ดันบอสรายวันหลายหลอด | เพิ่ม encounter/reward/scaling ผ่านข้อมูลโหมด |
| ระบบเว็บ | Supabase email/password, online-primary, backup/reconnect, Vercel runtime pack | migration รองรับข้อมูลเพิ่ม |
| เครื่องมือ | engine/headless/replay/batch/metrics/A-B ชุดเดียวกับเกม | progression autoplay/search/dashboard เป็นส่วนต่อยอด |

จำนวนบท ศัตรู สกิล/การ์ด และค่ารายได้ทั้งชุดเป็นผลส่งมอบ TASK-003–011 ก่อน TASK-014 ไม่สร้างตัวเลขแทนเจ้าของงานเหล่านั้นใน TASK-001

## เริ่มเกมและ roster

1. หลังสร้างเซฟสำเร็จ รับ account-creation grant ครั้งเดียว: gold1,000, hero_exp1,600, skill_manual80, breakthrough_essence0, crystal0; การ reload/retry ไม่แจกใหม่
2. เลือก Class 1 ของ main ได้ทั้งหก เริ่ม main และ NPC ทั้งหกที่ Lv.1, primary stats ทั้งหกค่า=1, แต้มใช้ได้=0
3. เปิด NPC ทั้งหกตั้งแต่เริ่มเพื่อทดลองทีมได้ เลือกเพื่อนสามคนจากคนละ root ก่อนยืนยันลงไฟต์ main ซ้ำ root ของเพื่อนได้ ทุกคนมี persistent character ID ของตน
4. ให้ Class 1 เริ่มต้นอย่างน้อยสอง Active ที่เรียนแล้ว Lv.1 โดยต้นทุน grant=0; TASK-003–008 ระบุ ID/บทบาทจริง ไม่มีการแจกเลเวลสกิลเพิ่มตาม character level อัตโนมัติ ช่องว่าง/การเดินคิวเป็น TASK-002
5. Starter gear ใช้ Common tier1 ของแต่ละตัวตาม TASK-009 ให้ครั้งเดียวตอนสร้างเซฟด้วย instance IDs ไม่แจกอาวุธใหม่ทุกครั้งที่เปลี่ยนอาชีพ
6. เริ่มที่ Story1-1 ยังไม่มี farm stage ก่อนผ่านครั้งแรก เงินเริ่มต้นพออัปสี่ตัวถึง Lv.4 ได้ แต่การชนะต้นเกมต้องไม่พึ่งการกดอัปแบบเดียว: TASK-011 ต้องตรวจ team fixtures เริ่มต้นด้วย

NPC IDs คือ `npc_swordsman`, `npc_acolyte`, `npc_archer`, `npc_mage`, `npc_thief`, `npc_merchant` ส่วน main ใช้ `main` โดย root เปลี่ยนได้ NPC คง root ตลอด สาขา Bard/Dancer ยังอยู่บน `npc_archer` คนเดียว

## เลเวล ต้นทุน และ Breakthrough

ใช้ resources กลางบัญชีเลือกกดอัป `character_id` ใดก็ได้รวมตัวนอกทีม ไม่มี EXP จากการลงสนามไปทำ auto-level และไม่มี level sync ระหว่างตัวละคร

สำหรับเปลี่ยน Lv.L → L+1:

```text
hero_exp = 50L + 5L²
gold = 20L + 2L²
```

ตารางทุก transition1→2 จน69→70 อยู่ใน JSON ไม่มี transition ออกจาก70 ตัวเลขนี้เป็น baseline cost version `progression-costs-v1`; รายได้และเวลาได้แต่ละเป้าหมายต้องให้ TASK-010 ตรวจภายหลัง

| ถึงเลเวล | hero_exp สะสม/ตัว | gold อัปเลเวลสะสม/ตัว | แต้ม Status สะสม |
| ---: | ---: | ---: | ---: |
| 20 | 21,850 | 8,740 | 95 |
| 40 | 141,700 | 56,680 | 195 |
| 60 | 439,550 | 175,820 | 295 |
| 70 | 680,225 | 272,090 | 345 |

เริ่ม local level cap20 และเพิ่มด้วย Breakthrough:

| ทำเมื่อถึง | ค่า gold | ค่า essence | local cap หลังทำ | cap จริงรุ่นแรก |
| ---: | ---: | ---: | ---: | ---: |
| 20 | 5,000 | 20 | 40 | 40 |
| 40 | 25,000 | 100 | 60 | 60 |
| 60 | 100,000 | 400 | 80 | 70 |

`effective_cap = min(release_cap, unlocked_local_cap)` เก็บ gate IDs ที่ผ่าน แทนการเก็บค่า70เป็นเพดานถาวร เมื่อเปิด Hi-class ภายหลังจึงปลด release cap โดยไม่สร้าง Breakthrough70 ส่วน Breakthrough80/100 เป็นข้อมูลแพตช์อนาคต

เปลี่ยน Class 2 ได้ที่ Lv.20 นอกไฟต์ฟรี ไม่ต้องใช้ essence และไม่ต้องรอ Breakthrough20; หลังเปลี่ยนยัง Lv.20/cap20 จนทำ gate20 อีกระบบหนึ่ง การเปลี่ยน Hi-class70 และ Class3ที่120 ยังปิดในรุ่นแรก

ค่า Breakthrough รวม/ตัว = gold130,000 + essence520 ดังนั้นเส้นทางถึง70รวมการปลด cap = gold402,090 + hero_exp680,225 + essence520; สี่ตัวเท่ากันใช้ gold1,608,360 + hero_exp2,720,900 + essence2,080 ไม่รวม skill/gear/card investment

Essence ต้องหาได้จากฟาร์มที่เคลียร์แล้วตั้งแต่1-5 และดันรายวันเมื่อผ่าน1-10 เป็นทางเพิ่ม ไม่ผูกแหล่งเดียวไว้หลังด่านที่บังคับ Class 2/Breakthrough ก่อน TASK-010/011 ต้องให้แหล่งและต้นทุนผ่าน coverage นี้

## แต้ม Status ลงเอง

- primary STR/AGI/VIT/INT/DEX/LUK เริ่ม1เท่ากันทุกตัว/ทุกอาชีพ ~~ให้ 5 แต้มต่อเลเวล รวม 345 ที่ 70~~ **แก้ตาม D-057 (TASK-049):** ได้ 3 + floor(เลเวลใหม่/5) แต้มต่อเลเวล (Lv10 = 34, Lv20 = 91, Lv70 = 676) และทุก 10 แต้มของค่าสุดท้ายได้โบนัสที่ไม่กระทบจังหวะ (`combat-rules.json` → `primary_milestone_bonus`)
- ไม่มี level event ใดจัดแต้มแทน เพิ่ม AGI/DEX หรือให้ class growth โดยอัตโนมัติ สูตร HP/ATK พื้นฐานและการแปลง stats เป็นหน้าที่ TASK-002 และต้องไม่แอบเพิ่มความเร็วตามเลเวล
- manual allocation สูงสุด99ต่อ stat ในรุ่นแรก เป็นขอบเขตการลงแต้ม ไม่ใช่เพดานผลรวม stats หลังอุปกรณ์/บัฟ บัฟยังบวกไม่จำกัดตาม D-037/D-038
- ค่าเพิ่มจาก v→v+1 คือ `1 + floor((v-1)/10)` แต้ม: เพิ่มไปค่า2–11ใช้1/ขั้น,12–21ใช้2/ขั้น, ...92–99ใช้10/ขั้น
- reset นอกไฟต์คืนแต้มที่จ่ายจริงทั้งหมด ค่าปัจจุบันกลับ1; แต้มทั้งหมดต้องเท่ากับ `5×(level−1)` ไม่ขึ้นกับอาชีพที่สลับมา

ที่ Lv.70 หากลง stat เดียวสูงสุดได้79 ใช้344แต้มเหลือ1; ไม่ได้แปลว่าต้องลงแบบนี้เพื่อชนะ ตัวอย่างหลายบิลด์จริงให้ TASK-003–008 คำนวณตาม budget นี้

เพดานเลเวลสกิลตั้งต้นคือ `min(skill_definition_max, 1 + floor((character_level−1)/5))` ตัว Lv.1 จึงมี cap1 และตั้งแต่ Lv.46 จึงอัปสกิลที่ max10 ถึง10ได้ การปลดท่าจริงอ้างตารางอาชีพต่างหาก ไม่มี auto-upgrade เมื่อ cap เพิ่ม ส่วน Awaken ใช้ตาราง variant ใน milestone ของมัน ไม่ฝังเพดาน10ไว้ทุกสกิล

## ตารางปลดระบบ

| ระบบ | เปิดเมื่อ | เหตุผล |
| --- | --- | --- |
| Roster/Status/Skills/Inventory/Reset/Class1 switch | สร้างเซฟ | ทดลองได้ตั้งแต่ต้น ไม่ต้องสุ่มเพื่อน |
| Story | จัดทีมถูกต้องครบ4 | จุดเริ่มความคืบหน้า |
| Farm/Offline12h | ผ่าน1-1 | ฟาร์มได้เฉพาะด่านที่ผ่านแล้ว |
| Refine | ผ่าน1-5 | เริ่มลงทุน slot ก่อนเปลี่ยนคลาส |
| Daily resource bosses | ผ่าน1-10 | เพิ่มแหล่งทรัพยากรและ essence |
| Enchant | ผ่าน2-5 | เพิ่มตัวเลือกบิลด์ |
| Cards/Card gacha/Tower | ผ่าน2-10 | ขยายบิลด์และโจทย์ทีมหลังรู้วงจรหลัก |
| Breakthrough | ตัวที่จะอัปถึง20/40/60 | แยกการปลด cap ต่อคน |
| Class 2 | ตัวที่จะเปลี่ยนถึง20 | ไม่ผูก root ของ NPC เข้ากับ main |
| Hi-class/Awaken/Artifact/Class3/Pet/Rune | ไม่เปิดในรุ่นแรก | ไม่มีตู้สุ่มหรือปุ่มที่จ่ายของให้ระบบที่ยังใช้ไม่ได้ |

เงื่อนไข stage ใช้ highest-cleared Story ฝั่ง account ส่วนเงื่อนไข character ใช้ตัวที่ผู้เล่นเลือก ถ้า NPCนอกทีม Lv.20 ก็เปลี่ยน Class 2 ได้ ไม่อ้าง main level แทน

## คืนทุน สลับสาย และเวอร์ชันราคา

เลือก **refund ยอดที่จ่ายจริงจาก investment ledger** สำหรับ Status/Skill respec:

- แยก ledger ของแต่ละ character: `entry_id`, feature/skill ID, quantity/level change, paid resource vector, cost version, refund state และ refund command ID; starter grants มียอดจ่าย0
- แต้ม Status คืนเข้า `unspent_status_points` ของตัวเดิมให้เท่ากับยอด earned ตามเลเวลหลัง reset ค่าเป็น1 ไม่แปลงเป็นเงิน/ทรัพยากรกลาง แม้ราคาลงแต้มเปลี่ยนเวอร์ชันก็ไม่คำนวณคืนจากราคาใหม่ของ stat เดิม
- Reset skill คืนเฉพาะ investment ของสกิลที่ reset แล้วลบ paid progression ส่วนนั้น/กลับ starter grants ไม่เก็บ old upgraded skill ที่ได้รับเงินคืนแล้วไว้เรียกใช้ฟรี
- เปลี่ยน Class 1 ของ main หรือสาขา Class 2 นอกไฟต์ทำ full skill/stat reset + refund + เปลี่ยน job ใน command เดียว รักษา level/gates/slot progress/NPC identity
- NPC เปลี่ยนข้าม root ไม่ได้; main เปลี่ยนได้โดยยังคง level/cap ไม่ย้อนเป็น Lv.1 เมื่อสูงกว่า20เลือก Class2ที่มีสิทธิ์ได้ในการเปลี่ยนสายเดียวกัน
- Loadout preset เก็บความตั้งใจ เช่น stat/skill ID/ลำดับ ไม่เก็บทรัพย์สินหรือ paid levels อีกสำเนา เรียกกลับต้อง preview/validate/pay ด้วยงบปัจจุบัน ไม่รับเงินคืนพร้อมได้บิลด์เดิมฟรี
- คืนตาม cost v1 แม้เวลาปัจจุบันเป็น v2; การอัปครั้งถัดไปจ่าย v2 และ refund ถัดไปคืนเพียง v2 ที่จ่าย ไม่ประเมินยอดเก่าด้วยราคาใหม่
- คำขอ refund เดิม retry ไม่จ่ายซ้ำ การ mark ledger refunded/เงินเข้า/เลเวลสกิลเปลี่ยน/revision/receipt ต้อง commit พร้อมกัน รายละเอียด payload/SQLเป็น TASK-013/022
- ของที่ใส่ผิดอาชีพคืน inventory ด้วย item instance เดิม หากที่ว่างไม่พอ reject ทั้งคำสั่งก่อนเปลี่ยนอะไร ไม่กินของ/คืนบางส่วน/ล้าง slot progress การเปลี่ยน item ไม่ย้าย Refine/Enchant/cards ไปให้ตัวอื่น
- Character level/Breakthrough และ Refine/Enchant/card investments ไม่ถูกคืนจาก skill/stat respec ไม่มีการลด character level เพื่อแลก resources ในรุ่นแรก

ตัวอย่างบัญชีเริ่ม gold1,000/manual200 จ่าย v1 =100/20 แล้วเหลือ900/180: reset ได้กลับ1,000/200 แม้ v2 จะเป็น150/30หรือ60/12 การอัปใหม่แล้ว reset คืนได้ตรงยอดที่จ่ายใหม่ วนซ้ำไม่ทำทุนรวมเพิ่ม ดูเคส [progression JSON](../data/progression.json)

## เครื่องและหน้าจออ้างอิงสำหรับงานตรวจรับ

เป็น target profiles สำหรับออกแบบ ไม่ใช่รายงานว่าทดสอบบนเครื่องเหล่านี้แล้ว:

- Desktop: Apple M1/RAM8GB, viewport1280×720 CSS pixels/DPR1; Chrome และ Safari รุ่น stable ณ วันที่ตรวจ ต้องบันทึก build version จริง
- Mobile: Google Pixel6a/RAM6GB, viewport390×844 CSS pixels/DPR2, Chrome stable ณ วันที่ตรวจ; แนวตั้งเท่านั้นตาม D-052 (แนวนอนต้องขึ้นข้อความให้หมุนเครื่อง) และทดสอบ touch/ข้อความไทย
- ขั้นต่ำของ layout ต้องไม่มี horizontal scroll ที่360 CSS pixels และแสดงทั้ง4สมาชิก/คิวผ่านการย่อ/เลื่อนส่วน HUD ที่ออกแบบ ไม่ย่อข้อความจนอ่านไม่ได้
- เครือข่ายอ้างอิงโหลดแรก10Mbps/RTT100ms; local warm-cache แยกผล TASK-013 ระบุ byte/frame/memory/runner budgets และ TASK-042 วัดจริง ไม่อนุมานความลื่นจากการเปิด asset lab

## เกณฑ์ส่งต่อและหลักฐาน

TASK-002 ใช้ base stats/point budget/gates นี้ออกแบบ math; TASK-003–009 ใช้ unlock/สิทธิ์/ทรัพยากร; TASK-010 รับ cost baseline ไปออกแบบอัตรารายได้; TASK-011 ต้องไม่สร้าง resource/unlock deadlock; TASK-013 รับ ledger/state ownership ไปลงสัญญาเซฟ

ตรวจด้วย `python3 plan/checks/progression.py` เก็บผลที่ [task-001-review.json](../evidence/task-001-review.json) ผลตรวจเป็นการคำนวณ/อ่านแบบใน M0 ไม่ใช่ผลทดสอบ runtime, cloud หรือ balance simulation และไม่เปิด gate TASK-014 ด้วยงานนี้เพียงงานเดียว
