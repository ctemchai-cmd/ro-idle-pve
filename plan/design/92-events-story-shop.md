# EXP, ร้านค้า, Event และ Story 13–15 — D206–208

ผู้ใช้ยืนยัน Eventสลับภารกิจสะสมแต้มกับบอสกิจกรรม และเพิ่มบท13–15ที่Lv100 ต้องเก่งขึ้นอีกระดับ ไม่เปิดClass3. เดิมเนื้อเรื่อง330ด่านจบ12-50;EXPเป็นdeterministic4900–9788/h ร้านEXP1000คงที่จึงไม่สัมพันธ์ราคาเลเวล.

## Economy
EXPฟาร์มเพิ่ม50%เป็น7350–14682/hก่อนบทใหม่;ทอง/การ์ด/เกียร์เรทเดิม. จ่ายfrozenwindowเดิมก่อนเรทใหม่. EXP/manual/ore/enchant/Breakแพ็กคิดจาก2ชั่วโมงของเรทบทที่เคยผ่านสูงสุดและไม่ต่ำกว่าgrantเดิม;ราคา/dailyrightsเดิม. Crystal10→50, carddust40→120,หิน2ก้อน/pack. ร้านแสดงจำนวนจริงและชั่วโมงอ้างอิง ใช้quote/max/reducerชุดเดียว. เพิ่มEssenceArtifact50/20000gold2ครั้งสำหรับผู้มีHi-class.

## Story
90ด่านใหม่ บทละ30;Lv100ตลอด/Tier100. 13เปิดจาก12-50. เป้าต้นบท13 HP+20%/ATK+10%จากบอส12ท้ายที่ใช้จริง,บท14–15เปิดด้วยHP+15%/ATK+8%จากบทก่อน;ทุก5ด่านHP×1.05/ATK×1.02. เวลา40sเหมือนStoryเดิมเพื่อไม่ลดDPScheckโดยการขยายเวลา. มอน/บอสใช้nativeidentity/ธาตุ/ขนาด/ชุดสกิลปัจจุบันหลากหลาย;ไม่copyสถิติจากROอ้างอิง. เดิม330rowsไม่แก้. รายได้บท13–15สูงขึ้น/Tier100คงเดิม;ค่าการ์ดและgachaคงใช้poolท้ายเดิม.

## Event
4templatesสลับMission/Bossตามสัปดาห์BangkokMonday,เริ่มรอบแรกสัปดาห์26Oct2026. หน้ากิจกรรมมีเวลาเหลือ/ภารกิจ/เช็กอิน/ร้านแลก;ไม่จำเป็นต้องมีผู้ดูแลเขียนรายสัปดาห์. ตัวชี้วัดคำนวณจากcommandที่commitจริง: farmsecondsที่รับแล้ว,จบไฟต์,ชนะstory,รับกล่องdaily,อัปเกรดสำเร็จ. ไม่ให้แต้มจากpreview/กดเริ่ม/retreat/replayreceipt. ภารกิจclaimครั้งเดียว,เช็กอิน1/dayพร้อมparticipation100ครั้งแรกของรอบ;ทุกวัน20.

บอสกิจกรรม5ระดับอิงstageanchors1-10/3-10/6-10/9-25/12-25,เปิดตามความคืบหน้าจริง. Nativebossรายสัปดาห์,หนึ่งตัว/90s/sharedengine. ไม่หักสิทธิ์เริ่ม,ไม่จำกัดลอง,จ่ายแต้มส่วนต่างbest-tierครั้งเดียว;จบข้ามรอบให้grace15นาทีจากไฟต์ที่เริ่มทัน.

แต้มสะสมแลก MVPcardจริงLegendaryแบบสุ่ม/อาวุธLegendaryตรงอาชีพTierตามgacha/ตั๋วArtifact/หินRarity/รีโรล/EXP. ราคาจัดให้เลือกของรางวัลหลัก ไม่กวาดทุกอย่างง่ายๆ. มีlimitรายรอบ,สุ่มเฉพาะตอนcommitและใช้UUIDเดิมเมื่อรีทราย;เต็มกระเป๋า/overflowไม่หักแต้ม. แต้มรอบก่อนแลกต่อได้อีก1สัปดาห์;เก็บแค่current+previous,ไม่mergewalletเมื่อrestore.

## Contracts / evidence
optionalaccount.eventsสองperiods,typedcommands(checkin/mission/redeem/start_event),battlekindevent. progressionเป็นpurequote/reducerรับperiodที่injectจากmodes;accountเชื่อมclock/commandmetricsและsettlement. clientใช้sharedfacade,UIไม่เขียนDBเอง. ไม่เพิ่มrequestวนอ่าน,ไม่เปลี่ยนcombat/mathและหลัก1/2/3time. Legacydailycompatต้องมีv2sealสำหรับ501รวม2a/b036โดยnormalizeเฉพาะmodeenumเพิ่มใหม่;ไม่ข้ามsignature/sourceproof. ไม่มีSQL/envใหม่หรือowner-saveaccess.

Final review: keep Story40s (90s would lower the required DPS despite larger HP). Event bosses remain90s. Event balance is derived from joined/check-in/claimed missions/best tier minus purchases; no mutable duplicate wallet. Restore unions rights and retains spending.
