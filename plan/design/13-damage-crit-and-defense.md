# สมการดาเมจ คริ และเกราะ: ฐานสำหรับคุยและวัดบาลานซ์

สถานะ: **ที่มา/ตัวอย่างสมการ; TASK-002 เลือก baseline ใน design/15 แล้ว** · อัปเดต 19 ตุลาคม 2026

ค่าที่ใช้ทำข้อมูลรุ่นแรกให้อ้าง [combat baseline](15-combat-baseline.md) และ [combat-rules.json](../data/combat-rules.json) ซึ่งกำหนด derived stats/crit/armor/guard/rounding/timing ครบ ข้อเสนอหรือกรณี illustrativeด้านล่างไม่ทับ baselineนี้ การปรับค่าต้อง versionและตรวจ reference casesใหม่

เกมต้นแบบหลักคือ Ragnarok Idle Adventure Plus สำหรับจังหวะจัดทีม/คิว/AFK และใช้ RO ภาคต่าง ๆ เป็นแรงบันดาลใจอาชีพ/สกิล ข้อมูลทางการของ [Ragnarok Idle Adventure Plus](https://www.gravity.co.kr/en/game/roip) ที่ตรวจรอบนี้ไม่แสดงสมการดาเมจย่อย จึงไม่อ้างว่าสูตรเสนอด้านล่างเป็นสูตรที่ถอดจากเกมต้นฉบับ

TASK-002 ต้องออกแบบและคำนวณกรณีอ้างอิงก่อนทำข้อมูลสกิล TASK-047 กำหนดว่าผลจากโมดูลแต่ละชนิดเข้าในขั้นไหน และ TASK-018/041 ใช้ simulation วัดความคุ้มค่าจริง ค่าทั้งหมดต้อง version เพื่อเปรียบเทียบก่อน/หลังได้

## Reference RO ที่ใช้ตรวจแนวทาง

อ้าง [rAthena status.cpp](https://github.com/rathena/rathena/blob/master/src/map/status.cpp) เป็นแหล่งปฐมภูมิของพฤติกรรม server emulator ไม่ใช่หลักฐานว่าทุกเซิร์ฟเวอร์ทางการใช้ตรงกัน: status ถูกอ่านตามชนิด เช่น Blessing ไม่ใช่บวกโบนัสหนึ่งชุดต่อผู้ร่ายทุกคน การรับ status ซ้ำมีเงื่อนไขระดับ/ข้อยกเว้นรายชนิด และบาง buff/debuff ยกเลิกกันตาม [status database](https://github.com/rathena/rathena/blob/master/db/re/status.yml)

Reference แสดงว่าต้นฉบับมี policy รายสถานะ แต่ผู้ใช้เลือกกติกาเกมเราแล้วใน Q-017/D-037: บัฟจากหลายตัวบวกเพิ่มได้ ไม่มีเพดานการซ้อนหรือผลรวม ไม่ใช้ strongest หรือ clamp รวมแอบแทน ส่วน debuff/Poison/CC ยังออกแบบ policy แยก

ด้านเกราะ โค้ด [rAthena battle.cpp](https://github.com/rathena/rathena/blob/master/src/map/battle.cpp) แยกแนว Classic กับ Renewal โดยเส้นทาง Renewal ปกติมีส่วน `Attack × (4000 + eDEF) / (4000 + 10 × eDEF) − sDEF` และมีข้อยกเว้นโจมตีหลายแบบ เราใช้รูปโค้งเป็น reference ได้ แต่ต้องออกแบบสเกล/ข้อยกเว้นให้เข้ากับ idle และงบ Lv.1–70 ของเรา

## แยกการซ้อนสถานะออกจากการคูณตัวเลข

มีสองขั้นที่ต้องตัดสินคนละเรื่อง:

1. Resolve status/stacking policy ก่อน ว่าสถานะซ้ำใดมีผลจริง ด้วยจำนวนชั้นและเวลาที่เหลือเท่าใด
2. นำ modifiers ที่มีผลเข้าสูตรกลางตามประเภทและขั้นที่ระบุ เช่น flat ATK, ATK%, skill damage%, damage taken%, mitigation ไม่ใช่คูณทุกชิ้นแยกอิสระ

ตัวอย่างโบนัสที่กติกาอนุญาตให้รวมใน ATK% กลุ่มเดียว: +10% กับ +20% ให้ `1 + 0.10 + 0.20 = 1.30` ไม่สร้างตัวคูณใหม่คนละตัว ส่วนโบนัสคนละขั้นอาจคูณกันโดยตั้งใจและต้องอยู่ในงบบาลานซ์ เช่น stat กับความแรงสกิล ไม่ใช่ว่าการคูณทุกชนิดเป็นสิ่งผิด

ผลรวมบัฟฝั่ง additive ไม่มี hard/soft cap หรือ diminishing returns ตาม D-037 เช่น ATK Up +120% กับ +130% รวม +250% ได้จริง แยกเวลา/source แล้วถอด contribution เมื่อหมดอายุ นิยามตัวเลขที่เป็น probability ให้อยู่ช่วง 0–1 หรือเวลาต้องเป็นบวกเป็นเรื่องหน่วย/ขอบเขตสมการ ไม่ใช่การอนุญาตให้จำกัดจำนวนหรือกำลังบัฟที่รวมกัน การเสนอ cap เฉพาะกลไกใหม่ต้องแยกอธิบาย ไม่ทำให้เป็นกฎซ่อนใน buff resolver

D-038: ร่ายซ้ำจากคนเดิมเพิ่มอีก contribution แยกอายุ ไม่ refresh ของเดิม การวัด uptime ต้องเก็บทั้งช่วงที่มีบัฟอย่างน้อยหนึ่งชั้นกับผลรวม magnitude ตามเวลา เพื่อไม่รายงาน 100% uptime แล้วมองข้ามผลที่ซ้อนกันหลายชั้น

## ลำดับคำนวณที่เสนอ

```text
manual primary stats + primary modifiers
  → derived ATK / MATK / HP / DEF / MDEF / speed
  → รวม flat และ percent modifiers ของ derived stats ตามชนิด
  → raw power ของสกิลหรือ hit
  → outgoing bonus ที่เข้าเงื่อนไขและธาตุ
  → hit / crit ตามกติกาที่ระบุ
  → effective DEF/MDEF และลดดาเมจ
  → guard / vulnerability ตามขั้นที่กำหนด
  → ปัดเศษ / ใช้โล่ / เปลี่ยน HP / ส่งเหตุการณ์และ metrics
```

นี่เป็นลำดับเสนอที่ M0 ต้องตรวจ โดยเฉพาะจุด flat reduction เทียบกับ crit/ธาตุและการปัดเศษ ห้ามเปลี่ยนลำดับโดยไม่มี content/rules version และ reference cases ที่ได้รับผล

```text
ATK = (baseATK + sum(flatATK)) × (1 + sum(activeATKPercent))
Raw = ATK × skillCoefficient + skillFlatPower
```

เวทใช้ MATK/ตัวคูณเวทและ MDEF ตามประเภท ไม่ใช้ DEF กายภาพแทนโดยอัตโนมัติ Primary stat modifier ไม่ถูกคิดซ้ำทั้งตอนแปลง STR→ATK และใน ATK อีกครั้ง ไม่มีการโต AGI/DEX ตามอาชีพอัตโนมัติ

## คริ

ต้องแยก chance, damage multiplier, resistance และ eligibility:

```text
pCrit = clamp(baseChance + statContribution + bonuses - targetResistance, 0, 1)
critMultiplier = baseCritMultiplier + sum(critMultiplierBonuses)
ExpectedCritFactor = 1 + pCrit × (critMultiplier - 1)
```

สูตรค่าเฉลี่ยข้างบนใช้กับ hit ที่สำเร็จแล้วและเงื่อนไขอื่นเหมือนกัน ถ้ากำหนดให้คริข้าม evade หรือมี guarantee ต้องคำนวณโอกาส hit ร่วมใหม่ ไม่ใช้ค่าเฉลี่ยนี้ทับทุกกรณี

ตัวอย่างเพื่ออ่านความคุ้ม: chance 30% และ multiplier 1.50 ให้ตัวคูณเฉลี่ย 1.15 หรือแรงขึ้นเฉลี่ย 15% สำหรับ hit ที่เข้าเงื่อนไข ค่านี้ไม่ใช่ค่า crit ที่ยืนยันของ RO Idle Adventure หรือค่าเริ่มต้นที่ล็อกแล้วของเรา

- Normal Attack/สกิลใด crit ได้ต้องประกาศในข้อมูลเป็นรายประเภท/ท่า รวม multi-hit ว่า roll ต่อ hit หรือ action
- Crit ไม่ควรได้รับ ignore DEF ฟรีโดยไม่มีนโยบายชัดเจน ต้องเทียบแนว RO ที่เลือกกับผลต่อ tank และบิลด์เจาะเกราะใน simulation
- DoT/HoT/ฮีล/reflect/proc ไม่ได้รับ crit ซ้ำอัตโนมัติจาก hit ต้นทาง ถ้าทำได้ต้องระบุ snapshot/จุด roll
- `+20% crit damage` ต้องระบุหน่วยว่าคูณค่าเดิมหรือเพิ่ม multiplier 0.20 เพื่อไม่ให้ tooltip กับ engine ตีความต่างกัน
- ตั้งสูตร LUK/HIT/FLEE/crit resist และเพดานตามงบต่อแต้ม ก่อนให้การ์ด/Passive เพิ่มหลายระบบพร้อมกัน

## เกราะและเจาะเกราะ

เสนอทดลองรูปโค้งที่เขียนพารามิเตอร์ได้:

```text
D1 = max(0, DEF × (1 - armorBreakPercent))
effectiveDEF = max(0, D1 × (1 - attackerPenetrationPercent) - flatPenetration)
ArmorMultiplier = 1 - maxArmorReduction × effectiveDEF / (effectiveDEF + K)
```

`maxArmorReduction=0.90` และ `K=400` ให้รูปโค้งเดียวกับส่วน eDEF ของ reference Renewal ด้านบน โดยยังไม่รวม sDEF/ข้อยกเว้น TASK-002เลือก K400/maxArmorReduction0.90 และ flat damage reductionแยกเป็น baseline; ไม่ยกข้อยกเว้น soft DEFเดิมมาโดยอัตโนมัติ ไม่ตั้ง DEF=100 ให้แปลว่าอมตะ 100%

Armor Break เป็น debuff ของเป้าที่ทีมได้ประโยชน์ ส่วน penetration เป็นคุณสมบัติการโจมตีของผู้โจมตี การรวมค่าต้อง resolve group/caps ก่อน และไม่ปล่อยให้ DEF ติดลบแล้วกลับไปเพิ่มดาเมจโดยไม่มีขั้น vulnerability ที่ชัดเจน

การลดดาเมจหลังเกราะและ vulnerability ต้องมี bucket/ขอบเขตสมการชัด ไม่ปล่อยให้ค่ารับดาเมจติดลบ และไม่ใช้ข้อเสนอนี้เป็น cap ผลรวมบัฟที่ผู้ใช้ยกเลิก TASK-002เลือก guard multiplier=max(0,1−sumGuard) จึงไม่เกิดดาเมจติดลบแม้ผลรวมบัฟเกิน100%; immunity effectsเฉพาะเป็น catalog TASK-047

## ตัวเลขตรวจมือชุดแรก

ใช้ Raw=200, ทุก hit สำเร็จ, crit 30%/1.50, maxArmorReduction=0.90/K=400 ไม่มีธาตุ/soft DEF/โล่/โบนัสอื่น และแสดงค่าก่อนปัดเศษ:

| effective DEF | ตัวคูณเกราะ | ไม่คริ | คริ | ค่าเฉลี่ยต่อ hit |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 1.00 | 200 | 300 | 230 |
| 200 | 0.70 | 140 | 210 | 161 |
| 400 | 0.55 | 110 | 165 | 126.5 |
| 800 | 0.40 | 80 | 120 | 92 |

ตารางนี้ตรวจเพียงพฤติกรรมสมการ ไม่พิสูจน์ว่า tank/คริสมดุลแล้ว ยังต้องคำนวณงบ stat/ต้นทุนและรอบการต่อสู้จริง

## ตรวจ OP/อ่อนจากไฟต์ทั้งรอบ

- เทียบ ATK/คริ/ASPD/เจาะเกราะ/HP/DEF ที่งบเท่ากัน ไม่เพิ่มค่าสเตตัสหนึ่งแล้วสรุปว่าแรงโดยไม่หักต้นทุน
- ASPD มีผลทั้ง Normal Attack และ SI ของเรา ส่วน CT/ACD/SP อาจจำกัดรอบสกิล จึงวัด DPS/เวลาจบ/SP stalls/ความอยู่รอดร่วมกับดาเมจต่อ hit
- ตรวจสกิลหลาย hit/หมู่ตามจำนวนเป้า และ DoT/proc/reflect ให้ไม่คูณ coefficient หรือ crit ซ้ำจากต้นทาง
- ตรวจค่าต่ำ/กลาง/สูง หลายเลเวล/rarity และผลรวมบัฟสูงเกิน 100% โดยไม่ clamp โดยเฉพาะทีมตัวบัฟหนึ่งตัวเทียบสองตัวที่งบเท่ากัน; ช่วงใกล้ cap ใช้เฉพาะค่าที่กติกาตัวเองมีขอบเขต ไม่เพิ่ม cap ให้การรวมบัฟ
- เก็บ damage breakdown แต่ละขั้นและสถานะที่มีผล เพื่ออธิบายว่าตัวเลขมาจากอะไรและ replay regression ได้
- ความสนุกของ Chain CC เป็นกติกาที่ยืนยันแล้ว ไม่แก้โดยแอบใส่ global immunity; เฉพาะบอสที่ออกแบบมี Passive สะสม CC Resistance จึงใช้กติกานั้น

เกณฑ์รับ TASK-002/047/014 ต้องรวม edge cases ทั้งเกราะศูนย์/สูง/เจาะเกราะ, crit=0/ใกล้cap, โล่, multi-hit/DoT, ลำดับบัฟ/หมดอายุ, rounding, proc และค่าสเตตัสผิดช่วง พร้อมผลคาดหวังที่คำนวณอิสระก่อนใช้ runner

ดู [โมดูลสกิลและสถานะ](12-effects-and-composition.md), [simulation](08-simulation-and-balance.md) และ [combat](02-combat-and-skills.md)
