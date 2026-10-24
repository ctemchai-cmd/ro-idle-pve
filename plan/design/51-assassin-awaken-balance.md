# Assassin Cross และกรอบ DPS — D162/D163 / TASK132

ผู้ใช้ขอหาต้นเหตุและลดAssassinCross จากนั้นยืนยันเฉลี่ย9,000–11,000DPSเฉพาะHi-classสายดาเมจ โดยใช้Lv90/Common60/4ActiveAw10ตามbenchmarkเดิม และขอให้Class2Assassinที่นำเล็กน้อยลดด้วย

## สาเหตุที่วัด

224 actual engine fights บนfrozen99a55: 2 selected builds(solo/pressure) ×7 probes×16seeds. Cost/queue/SP/gear/primaryเหมือนกัน

- Enchant Poison เดิมClass2max43.75%/10s; Aw10กลายเป็น63.4375%/14.5s เพราะgenericcurveขยายทั้ง magnitude และduration×1.45. บัฟยกทั้งnormal/direct/procsและเกิดช่วงซ้อนก่อนหมด
- Solo uptime97.9%, overlapอย่างน้อย2ชั้น29.8%, ATKbonusเฉลี่ยจากสกิล80.96%; pressure overlap77.96%/ATKbonusเฉลี่ย111.54%
- ปิดเฉพาะATK contributionโดยเก็บeffect/คิว/roll: solo14282→7994, pressure22127→12184. ปิดเฉพาะpenetration:13617/20941; ปิดKatarcritmodifier:13436/21445. Marginal effectsมีinteraction จึงไม่บวกส่วนต่างเข้าด้วยกัน
- สัดส่วนcriticalในdiagnosisเป็นdamage-event fractionรวมpassiveที่คริไม่ได้ ไม่ใช่สูตรcritChance. คงKatar/สูตรcrit/sharedstackingไว้

## การปรับจริง

- Enchant Poison base: ATK14.4→30% (เดิม21→43.75%); duration5→10s/SP/CT/ACDเดิม
- Awaken: ATK33→36%, duration11→12s; ยังมากกว่าbaseMaxใหม่ทุกrank. Penetration12→24%/6sเดิม. ข้อเสนอทดลอง52.5%ถูกแทนเมื่อผู้ใช้ระบุเป้า9–11kและให้ลดClass2ด้วย
- Whitesmith Cart Termination power×1.10เฉพาะสกิลHighเพื่อขยับบิลด์ที่ต่ำกว่า9k; ไม่เพิ่มบัฟทีม
- เป้า9อาชีพ:AssassinCross/Sniper/LordKnight/Stalker/HighWizard/Champion/Creator/Professor/Whitesmith. Clown/Gypsy/HighPriest/Paladinรักษาบทบาทฮีล/บัฟ/แทงค์ ไม่บังคับDPS9k

ใช้authoredcurvesและexplicitAwakenpolicyในgenerator ไม่ใส่job penalty/strongest buff/refresh/cap/diminishing return. ทุกapplicationยังอิสระ/ซ้อนได้ตามกติกาเดิม. ไม่เปลี่ยนราคา/ทุน/IDs/สกิลอื่น/primarygrowth/ความยากด่าน

## การวัด

- Fresh re-screen3seeds12901–12903 และ16heldout22901–22916:9HighDDที่Aw10,AssassinCross/Whitesmithทั้งbaseและAw1,Class2Assassinทุกgear1/20/40/60
- FixedA/Bใช้ผู้ชนะเก่า131บนfrozen99a55และcurrent0ac โดยassertinitialstats/price/primaryตรงกัน. แยกผลเลือกบิลด์ใหม่ออกจากผลบัฟตัวเลข
- เป้าเป็นค่าเฉลี่ยในbenchmarkนี้ ไม่ใช่clampDPSในruntimeและไม่รับประกันทุกseed/ธาตุ/การ์ด/ทีม. TASK041ยังเปิด
