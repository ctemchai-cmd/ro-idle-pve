# บท 9 และทางต่อ Hi-class — 23 ตุลาคม 2026

D150: ผู้ใช้ต้องการด่าน บอส และมอนหลากหลายขึ้นเพื่อเตรียม Hi-class. TASK117 เพิ่มบท9ก่อน โดยไม่เปิด Hi-class หรือเปลี่ยนเพดาน70. จำนวน50ด่านเป็น baseline ของผู้ช่วยตาม D057 ที่กำหนดบทใหม่ไว้50ด่าน; ยังไม่มีข้อมูลทีมปัจจุบันของผู้ใช้ ตัวเลขความยากเป็นค่าเริ่มต้นให้ลองเล่น ไม่ใช่ผลชนะที่วัดแล้ว.

## รุ่นที่เล่นได้รอบนี้

ต่อจาก8-20เป็น9-1ถึง9-50 รวม180ด่าน. เลเวลแนะนำ67–70; ฝั่งผู้เล่นยังClass2/max70/manualstats. บท1–8ทั้ง130แถวต้องคงเดิมทุกfield รวมstats,skills,rewards,unlock,ฉาก,เพลง. หนึ่งไฟต์ท้าบอสมีบอสเดียว. ไม่แก้Tower/dailyหรือท่าผู้เล่นรอบนี้.

| ช่วง | ธีม | ตัวอย่างมอน | บอสท้ายช่วง | จุดที่ผู้เล่นจัดทีมรับมือ |
| --- | --- | --- | --- | --- |
| 9-1–10 | ประตูปราสาท | Raydric/Khalitzburg/Orc Zombie | Orc Lord | ลดเกราะ,สตั้น,บัฟป้องกัน |
| 9-11–20 | หอภาพต้องสาป | Dark Frame/Whisper/Jakk | Dracula | ใบ้,ธาตุGhost/Fire,ฟื้นHP |
| 9-21–30 | สุสาน | Ancient Mummy/Wraith/Ghoul | Osiris | พิษ,ใบ้,เกราะUndead |
| 9-31–40 | โบสถ์ร้าง | Raydric/Khalitzburg/Penomena | Doppelganger | หลายHit,เร่งATK,ลดเกราะ |
| 9-41–50 | บัลลังก์มืด | Dark Frame/Khalitzburg/Ancient Mummy | Dark Lord | เวทหมู่,สายฟ้า,ขัดท่าใหญ่ |

แต่ละชนิดมีdefinition/rotationของตัวเองจากeffect primitivesเดิม. ท่าศัตรูดัดแปลงจากเกมเรา ไม่อ้างว่าเป็นAIหรือสูตรจริงของRO. สกิล3ท่าสำหรับมอนทั่วไปและ4ท่าสำหรับบอสใหญ่ ก่อนแทนช่องแรกด้วยheavy castทุก5ด่าน. ท่าร่ายใหญ่ยัง4วินาที/ขัดได้;ไม่มีglobalCCimmunity. เฉพาะDark Lordท้ายบทมีoptional adaptive passiveเดิม. คิว4ช่องรวมช่องว่างเหมือนผู้เล่น.

Art/animationใช้native14ชนิดที่อยู่ในruntime packแล้ว ไม่เพิ่มatlasหรือเพลงลงstartup. ธาตุ/เผ่า/ขนาด14ชนิดอ้างเฉพาะidentityจาก[rAthena mob database](https://raw.githubusercontent.com/rathena/rathena/master/db/re/mob_db.yml); elementระดับ1–4ของPCไม่ยกมาใช้ เกมยังใช้ตารางRO Originเดิม. มีแหล่งข้อมูลแยกในexpansion spec; legacy Osirisใช้ธาตุเดิมในเกม.

## การเติบโตและรางวัล

เริ่มstatsจาก8-20 แล้วเพิ่มHPอย่างน้อย1.08และATK1.04ต่อ5ด่าน ปัดขึ้นต่อขั้น;MATKใช้budgetเดียวกับATK. ไม่เพิ่มASPD/CSPDเอง. DEFใช้level×6+8ตามฐานเดิม. ค่าอ้างอิง67–70เป็นแนวทาง ไม่ใช่เงื่อนไขห้ามเข้า. ท่า/ธาตุทำให้แต่ละด่านต่างกันได้แม้statsเพิ่มต่อเนื่อง.

Firstclearทั้งบทใช้gold202500/EXP324000/manual900/Crystal200 กระจาย50ด่านตามสูตร2500c²/4000c²/100c/200ต่อบทเดิม. ฟาร์มบท9ใช้รายได้เท่าบท8 อุปกรณ์/การ์ดTier60 น้ำหนัก/โอกาส/กาชาเดิม. ไม่เปิดTierใหม่ล่วงหน้า.

เพิ่มchance_ramp_stage_count=130ในloot.cards: ด่านเดิมใช้ordinal/129เหมือนก่อน เพิ่มด่านไม่ทำให้อัตราการ์ดบทเดิมลดลง; ด่านใหม่ใช้เพดาน2%เดิม. Frozen/pending rewards,cursor,carry,RNGและของที่ได้รับคงเดิม ใช้signed migrationเดิมหลังจบไฟต์ ไม่มีSQLใหม่.

## สัญญาที่ต่อยอดได้

Generatorแยกส่วนlegacy130ที่สอบเทียบแล้ว ออกจากexpansion specที่มีchapter/scenery/level-range/growth/farm roster/boss checkpoints. เพิ่มบทภายหลังผ่านdata ไม่คัดลอกbranchในengine. stage.enemy_identity=definitionให้UI/farmใช้ชื่อ ภาพ ธาตุ และrotationจากdefinitionเดียวกัน ไม่สุ่มภาพคนละชนิดมาทับ. เผ่า/ขนาดของfarm mobsส่งเป็นtagsเข้าengineเช่นเดียวกับบอส เพื่อให้การ์ดทำงานตรงชนิด.

Schemachapterเป็นpositive safe integer แทนเพดาน8;content loaderต้องตรวจchapter→farmrate→gear/cardtierครบก่อนเล่น. ไม่ยอมรับบทที่ไม่มีตารางรายได้หรือpool. Dailyใช้highestclearedchapterตามกติกาเดิม;schemaต้องเซฟchapter9ได้ด้วยโดยไม่resetสิทธิ์หรือHPวันเดิม.

## เตรียมแพตช์ Hi-class

บท10+ยังไม่เปิดในรอบนี้. ออกแบบเนื้อหาLv70–89สำหรับสองสกิลใหม่และLv90สำหรับAwakenตามdesign40 ก่อนเปิดเพดาน: ต้องมีรายได้/ราคา70–90,gearTierใหม่,ชื่อ/ผลสองสกิลและAwakenvariants. ใช้generator/definition/typed skillsเดิมและเพิ่มmonster kitsตามโซน. ไม่ผูกการปลดHi-classกับการเคลียร์9-50โดยพลการ. Artifactต้องออกแบบสัญญาและเนื้อหาของตัวเอง.
