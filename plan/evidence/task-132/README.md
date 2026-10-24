# ผลปรับ Assassin และกรอบ Hi-class DPS — 24 ต.ค.2026

วัดจริง **3,338 ไฟต์**: แยกสาเหตุ 224 ไฟต์, คัดบิลด์และเทียบก่อน–หลัง 2,986 ไฟต์, ตรวจ Hunter/Wizard เพิ่ม 128 ไฟต์ ใช้ engine เดียวกับเกมและข้อมูลจำลอง โดยไม่ได้เข้าบัญชีผู้เล่น.

ก่อน `99a5516d6a1ea601c2c92edf52020ae3df11f611799a1d9930e84089c240b43e` → หลัง `0ac01fa6e97f1463cac3bacd72ae0a05249b0e728ed71541180ecfdab8470d46`

## สาเหตุและการแก้

- Enchant Poisonเพิ่มATKทั้งnormal/สกิลและขยายช่วงซ้อนเมื่อAwaken; จาก43.75%/10sเป็น63.4375%/14.5s จึงยกกำลังทั้งตัว ไม่ใช่เพียงดาเมจของSonic Blow
- ปิดเฉพาะATK contributionโดยคงeffect/SP/queue/RNG: solo14282→7994; ปิดKatarcritmodifier13436 และปิดEPpenetration13617. ผลmarginalมีinteractionและไม่บวกกัน
- BaseEnchantPoison14.4–30% (เดิม21–43.75%)/durationเดิม5–10s; Awaken33–36%/11–12s. คงpenetration12–24%6s, independentstacking, crit, hits, CT/ACD/SP, priceและทุน
- เพิ่มCartTerminationของHighWhitesmith10%เฉพาะpower เพื่อให้บิลด์ที่ใช้สกิลHighผ่าน9k; ไม่เพิ่มบัฟทีม
- ไม่มีjobdamagepenalty/hiddenclamp/strongestbuff/refresh/capในruntime; เป็นการปรับauthoredcurvesเท่านั้น

## Hi-class สายดาเมจ — ค่าเฉลี่ยทุกอาชีพอยู่ในช่วง 9,000–11,000 DPS

ใช้ Lv.90, อุปกรณ์ Common Lv.60 ครบหกช่อง, Active Awaken Lv.10 ทั้งสี่ช่อง และ Passive ระดับปกติ สู้บอสธาตุกลาง 90 วินาที ไม่มีการ์ด Refine, Enchant, options หรือใบธาตุ

คัดบิลด์ด้วย 3 seed (12901–12903) แล้วตรวจด้วยอีก 16 seed (22901–22916) ตารางแสดงบิลด์ที่ดีที่สุดในชุดที่ลองของแต่ละรุ่น ส่วนการเทียบบิลด์เดิมก่อน–หลังเก็บแยกใน JSON.

| อาชีพ | DPS ก่อน | DPS หลัง | DPS จากสกิลหลัง | ช่วง 95% จาก RNG |
| --- | ---: | ---: | ---: | --- |
| assassin_cross | 14,282 | 10,909 | 8,636 | 10,870–10,948 |
| sniper | 10,750 | 10,750 | 8,654 | 10,683–10,817 |
| lord_knight | 10,403 | 10,403 | 7,629 | 10,347–10,460 |
| stalker | 10,330 | 10,330 | 7,990 | 10,105–10,556 |
| high_wizard | 10,238 | 10,238 | 9,846 | 10,235–10,241 |
| champion | 9,368 | 9,368 | 7,491 | 9,246–9,490 |
| whitesmith | 8,825 | 9,189 | 5,255 | 9,179–9,199 |
| creator | 9,086 | 9,086 | 8,750 | 9,084–9,088 |
| professor | 9,007 | 9,007 | 8,552 | 8,967–9,047 |

Whitesmith ขยับจาก 8,825 → 9,189 ผ่านบิลด์ใหม่ที่ใช้ Cart Termination ผู้ชนะเก่าใช้สี่ท่าของ Blacksmith และยังทำ DPS เท่าเดิม จึงต้องแยกผลจากการเลือกบิลด์ออกจากการเพิ่มพลังของสกิล.

## Class 2 Assassin ใกล้ Hunter/Wizard

ทุกแถวใช้ตัวละคร Lv.70 และอุปกรณ์ Common ครบหกช่อง เปลี่ยนเฉพาะระดับอุปกรณ์ Hunter/Wizard ตรวจซ้ำบนข้อมูลรุ่นใหม่นี้ด้วย 16 seed เช่นกัน.

| ของ Lv. | Assassin ก่อน | Assassin หลัง | Hunter หลัง | Wizard หลัง |
| --- | ---: | ---: | ---: | ---: |
| 1 | 3,359 | 3,044 | 3,006 | 3,113 |
| 20 | 3,796 | 3,440 | 3,403 | 3,448 |
| 40 | 4,282 | 3,880 | 3,842 | 3,854 |
| 60 | 4,799 | 4,348 | 4,313 | 4,299 |

## ขอบเขต

เป้าเป็นค่าเฉลี่ยของbenchmark ไม่ใช่บังคับDPSในเกม. แต่ละseed/บิลด์/ธาตุ/การ์ด/refine/ทีมมีผล; CIสะท้อนRNGไม่รวมความไม่แน่นอนของการเลือกbuild. HighPriest/Clown/Gypsy/Paladinรักษาบทบาทฮีล/บัฟ/แทงค์ ไม่บังคับ9k. ทดสอบHighbase/Aw1สำหรับAssassinCross/Whitesmithด้วย. TASK041ยังไม่ปิด.

[ผลแยกseed/fixedA-B/re-screen](results.json) · [causal probes](diagnosis.json) · [Class2comparators](comparators.json) · [replayinputs](replays.tar.gz)

```sh
node --import tsx scripts/game/assassin-cause.ts
# ทำworker0/1/2 แล้วmerge
node --import tsx scripts/game/targeted-class-balance.ts run --worker 0 --workers 3
node --import tsx scripts/game/targeted-class-balance.ts merge --workers 3
node --import tsx scripts/game/targeted-class-balance.ts comparators
```

## ตรวจและเผยแพร่

ผ่าน 638/638 TypeScript tests, native browser 5 กลุ่ม, root/filtered Vercel build และ public hosted 4 กลุ่ม (24 bundle SHA, คำอธิบายสกิลจริง, จอ320/390, ไม่มี error หรือเขียนเซฟ). Source `8fe64ee6a` deploy สำเร็จแล้ว. [ผลตรวจ](../task-132-review.json) · [hosted](../task-132-hosted.json)
