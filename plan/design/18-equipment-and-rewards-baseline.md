# อุปกรณ์และทรัพยากรรุ่นแรก

19 ตุลาคม 2026 · M0 baseline ของเกมนี้ ตัวเลขรอวัดกับ shared engine/หลาย encounter

> **D-057 (TASK-049):** Refine มีโอกาสพลาดแล้ว (ดูแถว Refine ใน [design28](28-slot-and-card-runtime.md) และ `slot-progress.json` → `refine.success_chance_by_target`/`pity`) checkpoint `team_24_slots_refine10` ใน economy.json เป็นค่าใช้จ่ายคาดหวัง (~2.14 เท่า) และขยายช่วงรับได้เป็น 4,800 นาที ให้ TASK-041 จูน

## อุปกรณ์และแหล่งพัฒนา

[equipment.json](../data/equipment.json) มี60 definitions: Tier1/20/40/60 แต่ละ tierมีอาวุธ10ชนิดและ armor5slot อาวุธตาม job mappingครบ19 jobs รวมClass1 ไม่มี tier80/100ดรอป Armorไม่แยกอาชีพ; Rarity7ขั้น multiplier1/1.12/1.28/1.5/1.8/2.2/2.7 เฉพาะ base flat modifiersของ item ไม่คูณค่าจาก Refine/Enchant/การ์ดซ้ำ

**D-059 (20 ต.ค. 2026): ยกเลิกชุดเริ่มต้นแล้ว บัญชีใหม่ไม่มีของสวมใส่เลย ได้ของจาก drop และอาวุธฝึกหัด ข้อความเดิมด้านล่างเก็บไว้เป็นประวัติ** Starter CommonTier1หกชิ้นให้ครั้งเดียวต่อ character creation ไม่แจกใหม่จากเปลี่ยนอาชีพ อาวุธClass2ชนิดใหม่ซื้ออาวุธฝึกหัดCommonTier1แบบเลือกชนิดได้125ทอง จึงไม่ติดรอrandomdropเพื่อเริ่ม Monk/Sage/Bard/Dancer/Alchemist อาวุธฝึกหัดใส่ได้ตามjobแต่ผสม/อัปtierไม่ได้และทิ้งคืน0 ไม่ใช้เป็นแหล่งแร่หรือซื้อ729ชิ้นแล้วข้ามไปSupremeราคาถูก Normaldrops/starterที่มีจำกัดยังใช้fusionตามปกติ แสดงข้อจำกัดนี้ก่อนซื้อ; อาวุธเดิมไม่ถูกลบหรือสร้างใหม่ทับassignment

Inventory500 item/card instances; currencies/materialsแยก wallet ไม่กินช่อง ห้ามกินของสวม/ล็อกใน fusion/salvage/duplicate conversion ตรวจ IDsไม่ซ้ำและ ownershipทุกชิ้นก่อน mutation Fusion3ชิ้นต้อง rarity/tier/slot/weaponkindเหมือนกัน สูงสุดSupreme ไม่ทำ fusionข้ามtier อัปtierรักษา instance ID/rarity และใช้ cost rowsที่ระบุ ไม่ล้างslot investment

ถ้า rewardต้องใช้ช่องที่ไม่พอ ให้เก็บผลชนะเป็น pending reward claimที่มี claim ID/content snapshot แล้วเปิด inventoryจัดของก่อนรับ การreserveclaimกับaccrualcursorต้องcommitพร้อมกันเพื่อไม่สร้างช่วงเวลาเดิมซ้ำ ส่วนflagจ่ายสำเร็จเปลี่ยนพร้อมwallet+itemsเท่านั้น ห้ามทิ้งgearหรือสุ่มใหม่ตอนretry รายละเอียด envelope/เพดานpendingอยู่ [architecture](11-technical-architecture.md)

## Refine/Enchant/การ์ด

[slot-progress.json](../data/slot-progress.json) ผูก `(character_id,equipment_slot)` ไม่ผูก itemหรือpartyposition ถ้าไม่มีของในslot ค่าลงทุนพักไว้; เปลี่ยน itemแล้วได้ค่าเดิม เปลี่ยนNPCต้องใช้ค่าของNPCใหม่ Refineสูงสุด10ไม่พัง/ไม่ลดขั้น ค่าบวกต่อระดับใช้ modifierกลางและต้นทุนทุกขั้นระบุในข้อมูล

Enchantเลือกหนึ่งสายจาก offense/vitality/precisionและอัปได้10 ไม่มีการสุ่ม reroll รุ่นแรก Precisionเพิ่มDEX จึงแสดงผลต่อ Cast Speed/SIก่อนยืนยัน การเปลี่ยนสายคืนเฉพาะpaid ledgerของสายเดิมและเริ่มสายใหม่จากศูนย์ ไม่ได้คืนทรัพยากรจาก grantหรือค่าจากราคาใหม่

การ์ดหนึ่งช่องเริ่มต้น สองที่Refine5 สามที่Refine10 มี [cards.json](../data/cards.json) 18 definitions/สามแบบต่อslot, rarity Bronze/Silver/Goldแยกจากrarityอุปกรณ์, maxlevel5 แต่ละinstanceมีเลเวลเอง การ์ดชื่อเดียวกันหลายinstanceใส่ได้และบวกกันตามsource ไม่มี strongest-only

กาชาให้ card instanceใหม่เสมอ จึงมีสำเนาใส่หลายตัวละครได้ ผู้เล่นเลือกย่อยการ์ดที่ไม่ได้ใส่และไม่ล็อกเป็นcard_dust20/40/80ตามrarityเพื่ออัปใบที่ต้องการ ไม่ autoย่อยสำเนาที่อยากเก็บ สวม/ถอดฟรีนอกไฟต์; instanceเดียวห้ามอยู่สองslot/สองcharacterพร้อมกัน Sourceitemicon/illustrationของการ์ดเป็นภาพการ์ดทั่วไปที่แชร์กัน จึงเลือกsymbollocalที่ต่างกัน18ชิ้นมาประกอบหน้าcardpanelของต้นแบบ ไม่อ้างว่ามีnativecardportrait18ภาพหรือเป็นผลการ์ดเดิมของRO

ตัวอย่าง CommonSwordTier60มีPATK190; Refine10เพิ่ม80; CardฐานPATK8/Level5×2/Gold×1.5เพิ่ม24 รวม294ผ่านsourceaggregationเดียว EpicSwordTier60เฉพาะbase=285 Refine10หนึ่งslotใช้gold77,000/ore275 Enchant10ใช้gold115,500/dust165 การทำครบทุกslotทั้งทีมเป็นเป้าหมายหลายวัน ไม่บังคับก่อนClass2

## การตรวจและงานถัดไป

`python3 plan/checks/equipment.py` ตรวจ78definitionsกับItem schema/assetrefs, compatibility/tier/fusionnegativecases/slotowner/cardrarity และตัวเลขตัวอย่าง หลักฐานนี้เป็น M0 ไม่ใช่ inventory transactionที่ทำงานแล้ว TASK-026–028/044ต้องทดสอบassignment/rollback/refundจริง

## ฟาร์มและเป้าหมายงบ

[economy.json](../data/economy.json) ระบุแปดทรัพยากรและ ratesต่อชั่วโมงแปดบท Farmเกิดที่ด่านที่ผ่านและเลือกไว้เท่านั้น เดินระหว่าง Story/Tower/dailyต่อเนื่องด้วย rateเดียว ห้ามนับ kill visualเป็นเงินฟาร์มเพิ่ม EXPเป็นwalletresourceให้เลือกกดอัปตัวละคร ไม่ใช่เลเวลอัตโนมัติ Ore/Essenceเริ่มที่1-5ก่อนBreakthrough20 Dustเริ่ม2-5ก่อนEnchant; crystalไม่มีฟาร์มAFK

เก็บเศษด้วยจำนวนเต็ม: `divmod(elapsed_ms×rate_per_hour+carry,3600000)` จึง claimถี่แม้ต่ำกว่าหนึ่งวินาทีแล้วไม่ได้เปรียบหรือเสียเศษ Claimหนึ่งชั่วโมงเท่ากับหกครั้ง10นาที AFKจ่ายเฉพาะช่วงไม่เคยรับสูงสุด12ชั่วโมง; ถ้าไป20ชั่วโมงจ่ายช่วงล่าสุด12ชั่วโมงและย้ายsettled cursorถึงเวลาปัจจุบัน แปดชั่วโมงที่เกินไม่ย้อนมารับซ้ำ การเปลี่ยน rate/patchและnetworkretryใช้ snapshot/cursorสัญญาTASK-013

ตัวอย่างเริ่มเงินที่ใช้กับเป้าหมายนั้นเป็นศูนย์และมี farm chapterดังกล่าวแล้ว:

| เป้าหมาย | คำนวณเวลา | ช่วงรับได้ |
| --- | ---: | ---: |
| หนึ่งตัว Lv4→10 ที่บท1 | 3305EXP/150ต่อนาที=22.03นาที | 20–30นาที |
| ทีมสี่ตัว Lv39→40 ที่บท4 | max(EXP17.37,ทอง21.84)=21.84นาที | 15–35นาที |
| สองClass2skills Lv7→8 ที่บท4 | manuals280/10ต่อนาที=28นาที | 20–35นาที |
| Breakthrough40สี่ตัวที่บท4 | essence400/.8=500นาที | 6–12ชั่วโมง |
| Breakthrough60สี่ตัวที่บท6 | essence1600/2=800นาที | 8–16ชั่วโมง/หลายclaim |
| Refine10ครบ24slotที่บท6 | ore6600/3=2200นาที | 24–60ชั่วโมง |

นี่เป็นงบสะสมเมื่อเข้าถึงจุดฟาร์มนั้นแล้ว ไม่ใช่เวลาที่พิสูจน์ว่าเล่นไปถึงบทนั้นได้จริง และนำรายได้ก้อนเดียวไปใช้สองเป้าหมายพร้อมกันไม่ได้ First-clear/daily/salvageช่วยลดเวลาสะสม; power/การผ่านด่านจริงต้องวัดM4

## Loot, Supreme และกาชา

[loot.json](../data/loot.json) ให้ gearหนึ่งชิ้นต่อเวลาฟาร์ม300วินาที โดยเลือกรarityและdefinitionด้วย RNGของclaimที่บันทึกแล้ว ไม่สุ่มใหม่ตอนretry Template15แบบต่อtierมีโอกาสเท่ากัน Tierดรอปผูกบท1/20/40/60ตามข้อมูล แทนการใช้ระดับmainซึ่งทำให้เปลี่ยนตัวหลักแล้วอัตราฟาร์มเพี้ยน

Common→Supremeต้อง729ชิ้นชนิดเดียวหากไม่มีhigherdrops อัตราที่มีhigherdropsให้Common-equivalent3.0606ต่อdropโดยเฉลี่ย; สำหรับtemplateเป้าหมายหนึ่งใน15และdropทุก5นาที throughput729หน่วยใช้ประมาณ17,864นาที เป็นเพียงขอบเขตจากค่าเฉลี่ย ไม่ใช่expected stopping timeหรือการันตีSupreme เพราะสุ่มและการผสมจำนวนเต็ม อัปtierรักษาrarityเพื่อให้ชิ้นเดิมใช้ต่อได้ เป้าหมายSupremeเป็นoptionallong-term ไม่บังคับเนื้อเรื่อง

[gacha.json](../data/gacha.json) เปิดเฉพาะการ์ด18ใบ ทอย100crystal/ครั้งหรือ1000/สิบครั้ง ไม่มีส่วนลดที่ทำให้singleเสียเปรียบ OddsBronze75%/Silver22%/Gold3%; พลาดGold29ครั้งให้Goldครั้งถัดไป และBronze9ครั้งให้Silver-or-betterครั้งถัดไปตามสัดส่วน22:3 โดยตรวจGoldpityก่อน Multi-pullรันสิบsingleตามลำดับในtransactionเดียว

ทุกpullใช้quality drawหนึ่งและdefinition drawหนึ่ง แม้guaranteeก็ consume qualitydrawเพื่อreplayตรงกัน Countersผูกบัญชี/pool, Goldresetทั้งคู่, SilverresetBronzeและเพิ่มGoldmiss การ์ดซ้ำได้instanceใหม่ ไม่แอบย่อยของที่อยากใส่หลายคน Crystalมาจากfirst-clear20/ด่าน, Towerfirst-clearตามข้อมูล และdailyobjective100/วันหลัง2-10ที่ไม่บังคับชนะเมื่อทีมติดด่าน ไม่มีเงินจริง/Pet/Artifactpoolในรุ่นแรก

`python3 plan/checks/economy.py` ตรวจresourceflow/งบ6จุด/เศษAFK/729-equivalent/odds/pity boundaries กฎด่าน/บอสเป็นTASK-011 การตรวจค่าเฉลี่ยไม่แทนการวัดprogressionหลายวันด้วยengineในอนาคต


22ต.ค.2026 D-127–129: กติกา reward batch / Refineflat+percent / Enchantรายslot / CrystalAFKและgearchance ใช้ [design34](34-reward-slot-economy-tuning.md) และcanonicaldataล่าสุดเหนือค่าตัวอย่างเก่า
