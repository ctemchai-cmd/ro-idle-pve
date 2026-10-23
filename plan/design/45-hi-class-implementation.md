# Hi-class — สัญญาก่อนเปิดใช้งาน

23 ต.ค.2026 · ต่อจาก [roadmap40](40-hi-class-roadmap.md), [บท10–12](42-hi-chapters.md) และ [สมุดสกิล44](44-skill-catalog-and-timeline.md). งานเริ่มจาก TASK-121; เอกสารนี้ไม่ใช่หลักฐานว่า Hi-class เล่นได้แล้ว.

## สิ่งที่ยืนยันแล้ว

เปลี่ยน Hi-class ที่70 โดยไม่สร้างBreakthrough70. เพิ่มอาชีพละ **2สกิล** รวม13อาชีพ/26ท่า;ท่าเดิมเต็มได้ก่อน70,ท่าใหม่เต็มได้ก่อน/ถึง90. Manual Status/ต้นสายNPC/4ช่องSI3s/คิวและการขัดร่ายเดิมทั้งหมด. Awakenคงภาพสกิลจริงและเพิ่มเส้นเรืองสีม่วงด้านใน.

D154–155:ผู้ใช้ยืนยันเลื่อนอาชีพสายเดิมรักษาบิลด์และ **Awakenได้เมื่อเป็นHi-class โดยต้องอัปสกิลเต็มก่อน**;กลับLv1และเสริม/เปลี่ยนเอฟเฟกต์. ความเข้าใจของผู้ช่วยว่าAwakenทุกท่ารอ90ถูกแก้แล้ว;แพตช์Hi-classต้องรวมAwaken. เศษขั้นใหม่อัปAwakenดรอปดันหลังๆ,รวมเศษเดิมเป็นใหม่และย่อยใหม่กลับเดิมได้. ตัวเลขunlock70/full88และunlock80/full89ในroadmapเป็นbaselineที่ผู้ช่วยเลือกได้ ไม่ใช่คำยืนยันตัวเลขของผู้ใช้.

## ผลตรวจโครงสร้างจริง

| ส่วน | ปัจจุบัน | ต้องทำก่อนเปิดจริง |
| --- | --- | --- |
| อาชีพ/สกิล | `allowedSkill` และcatalogสองหน้ารู้จักroot/currentเท่านั้น | ancestry Class1→Class2→Hi-class→Class3 จากแหล่งเดียว ไม่แจกท่าของสายพี่น้อง |
| schema | Account/commandรับ19jobs,max70;party checkpointmax70 | เพิ่ม13jobs,เพดานตามรุ่น,gate80และlocalcap100;อัปgenerated contractsพร้อมกัน |
| progression | level rows1–70,gate20/40/60 | rows71–89/90,gate80,แต้มmanual/ราคาที่ชัด;Class2หยุด70ถ้าต้องเป็นHiก่อนขึ้นต่อ |
| สกิล |126definitions/ราคาหกroot/378raw goldens | เพิ่ม26stableIDs+ราคาทุกรank+growthจากunlockแต่ละท่า;ข้อความจากresolvedprogram ไม่เขียนผลแยกมือ |
| เปลี่ยนอาชีพ | ทุกการเปลี่ยนรีเซ็ตStatus/สกิลและคืนทุน | แยกpromotionสายเดิมจากเปลี่ยนบิลด์ตามคำตอบ;NPCrootเดิม;อาวุธตรวจfit;Bard/Dancergenderคงเงื่อนไข |
| build/อุปกรณ์ | weapon compatibility/nativepreset19jobs | ผูกอาวุธกับ13jobใหม่,inheritfixedrootbonusเดิม;ไม่ให้bonus/speedอัตโนมัติเพราะเปลี่ยนเลเวล |
| ด่าน |330rowsแต่เปิด180;10–12รอfeatures/cap | เปิด10–11ตามHi/cap;12ยังต้องcap90แม้Awakenเปิดแล้ว;ราคาฟาร์ม/lootใหม่ต้องระบุbaseline ไม่อ้างว่าข้อมูลที่copyบท9บาลานซ์แล้ว |
| ภาพ | runtime32MiB,ใช้32,021,698B | nativebodyของ13อาชีพ24genderpresetsมีในlocalcoverage;ตรวจhead/weapon/actioncompatibility,skill+jobiconsจริงก่อนเลือก;ห้ามแทนด้วยภาพมั่วหรือเพิ่มbudgetเงียบๆ |
| save |10slots/actual-paid/refund/contentmigration | เซฟเดิมยังอ่านได้/ไม่หายทุน/ไม่auto-promote;ทดสอบ70→Hi→level80→reloadและrequestreplayด้วยบัญชีทิ้ง |
| Awaken | ยังไม่มีstate/command/material/variant | logicalIDคงเดิม,rank1หลังAwakenเหนือrank10ก่อนAwakenในบทบาทเดิม;ราคา/ledger/รีเซ็ต/preview/actualbattledefinitionใช้ตัวเดียว |
| เศษสกิล | walletมีskill_manualขั้นเดิม | เพิ่มawakening_shardพร้อมmigrationเริ่ม0/ไม่เติมย้อนหลัง;commandแลกสองทิศตรวจbatch/ทุน/overflowในtransactionเดียว;ดันช่วงหลังมีแหล่งจริง |

`battle-checkpoint` ยอมenemy120แล้ว แต่ยังจำกัดparty70;อย่าเอาการยอมenemy90มาอ้างว่าตัวละคร90พร้อม. Refine15/socket0–3และTier-upที่ยกเลิกแล้วไม่เกี่ยวกับการเลื่อนอาชีพ.

## อาชีพที่ต่อจากสายเดิม

| Class 2 | Hi-class | จุดที่ต้องคงไว้ |
| --- | --- | --- |
| Knight | Lord Knight | ดาเมจ/แทงก์และท่าเดิม |
| Crusader | Paladin | ป้องกัน/ปกป้อง/เวทHoly |
| Priest | High Priest | ฮีล/บัฟ/รักษาทีม |
| Monk | Champion | บอล/คอมโบ/Asura ใช้SPจริง |
| Hunter | Sniper | ธนู/เหยี่ยว/ดาเมจเป้าหมาย |
| Bard | Clown | P.ATK support/เพลง/เพศชาย |
| Dancer | Gypsy | P.ATK support/เพลง/เพศหญิง |
| Wizard | High Wizard | เวทพื้นที่/ธาตุ/CC |
| Sage | Professor | เวทเดี่ยว/สนับสนุน/ขัดเวท |
| Assassin | Assassin Cross | พิษ/ระเบิดดาเมจ |
| Rogue | Stalker | ลดพลังเป้าหมาย/Copy/CC |
| Blacksmith | Whitesmith | ดาเมจ/บัฟกายภาพทีม |
| Alchemist | Creator | ยา/พืช/ดาเมจพื้นที่ |

นี่เป็นชื่อและทิศทางที่เสนอสำหรับเกมนี้ ไม่ใช่การคัดลอกสูตร RO/Origin. ชื่อ/ผล26ท่าและartbindingต้องเขียนครบก่อนเปิด;ไม่ย้ายสกิลเดิมไปอาชีพใหม่จนผู้เล่นเสียของที่เรียนไว้.

## ฐาน catalog ร่วมกัน (TASK-121)

อ่าน `progression.class_tree` เป็นClass1→Class2ตามเดิม และ optional `job_advancements` เป็นรายการ `{job_id,parent_job_id,minimum_level}` สำหรับขั้นต่อไป. ไม่แก้ความหมายclass_treeและไม่เพิ่มflatlistอีกชุด. Catalog derive `id,root,parent,stage,minimumLevel,ancestors` แล้วตรวจparentครบ/ไม่cycle/IDไม่ซ้ำ/minimumlevelไม่ถอยหลัง. Rootของทุกขั้นได้จากparent,จึงเขียนข้ามrootไม่ได้.

Loaderสร้างcatalogครั้งเดียวเป็นimmutableส่วนหนึ่งของValidatedContent;progression/skill access/catalog/previewใช้ผลนี้ร่วมกัน. ไม่ใช้jobชื่อพิเศษในengine/DOMและไม่ใช้skilliconเป็นตัวบอกสาย. Optionaladvancementsที่ไม่มีในข้อมูลClass2ปัจจุบันทำให้ผล19jobsเดิม;การเพิ่มcatalogเพียงอย่างเดียวยังไม่ข้ามschema/releasegateหรือเปิดอาชีพให้เล่น.

การตรวจต้องมีfixtureHighและClass3หลายขั้นที่ใส่parentไม่ตามลำดับ,invalidgraph,สืบทอดเฉพาะancestor,passive/copy/loadoutrankเดิมและไม่แก้input. Gameplayใหม่ยังต้องมีชุดทดสอบของตนเอง ไม่อ้างfixturecatalogว่าเซฟHi-classผ่านแล้ว.

## ลำดับปล่อยงาน

1. TASK-121 ฐานcatalog/สืบทอด/ตรวจregressionของClass2 และบันทึกคำตอบ
2. งานเปิดHi-class:promotion/level71+/26ท่า/nativeart/ราคา/ข้อความ/บท10–11/บัญชีทิ้งครบloopและpublicpack budget ก่อนเปิดfeature
3. งานAwaken:variants+material+ทุนเก่า+upgrade+purpleglow เปิดตั้งแต่Hi-class;บท12ยังต้องcap90. ข้อ2–3ต้องพร้อมด้วยกันก่อนเปิดHi-classจริง

Artifactยังไม่ใช่ส่วนที่แถมเปิดด้วยflagHi-class. ต้องออกแบบไอเทม/slot/ราคา/skillpatchและมีtaskของตัวเอง;Class3/Pet/Runeคงอนาคต. ไม่รันbalancebatchเพราะผู้ใช้กำลังลองบาลานซ์เอง;ตรวจสูตร/โปรแกรม/คิว/1x2x4เป็นregressionได้.

## เศษสกิลและการคืนทุน (D155)

เศษเดิมยังใช้ `skill_manual`;เศษใหม่ใช้ stable resource ID `awakening_shard`. การAwakenไม่ลบทุนขั้นเดิม:เก็บpaidledgerก่อนและหลังแยกcostversion เพื่อรีเซ็ต/เปลี่ยนข้ามสายคืนสิ่งที่จ่ายจริง ไม่คืนตามราคาปัจจุบันหรือคำนวณย้อนด้วยอัตราแลก. การรวม/ย่อยเป็นconsumptionถาวร ไม่ใช่skillinvestmentที่คืนซ้ำได้.

Baselineเสนอสำหรับงานimplementation:10เศษเดิม→1เศษใหม่,1เศษใหม่→5เศษเดิม (เสีย50%เมื่อแลกวน). แสดงจำนวนก่อน/หลังและกดจำนวนมากได้ในคำสั่งเดียว. อัตราต้องเป็นpositive safeinteger;ไม่อนุญาตผลคูณสองทิศเกินหรือเท่าทุน. ราคาฝึก/ค่าปลุกและรายได้ดันต้องเขียนครบก่อนเปิด ใช้newresourceเดียวกับwallet/rewardvector/ledger/receipt/farmcarry/defaultmigration ไม่เติมแค่ปุ่มร้านค้า.

## TASK122 ฐานที่ทำแล้วแต่ยังไม่เปิด

`progression.hi_class`เก็บ13advancements/rows70–90/gate80/สองgrowthprofilesแบบinactive. `progressionData`ฉายrows/gatesใหม่เมื่อpromotion.hi_class_enabledเท่านั้น;loaderderivecatalog32ตอนเปิดและคืนcachedimmutableindexให้levelquotes. Dataปัจจุบันยังfalse/cap70/19อาชีพ. Row90มี1050manualpoints;70→90ใช้714850EXP/285940gold,gate80แยก400000gold+1600essence (authoredbaselineตามสูตรเดิม). ไม่เพิ่มgate70หรือprimary/speedอัตโนมัติ.

DirectClass2→ลูกHiในสายเดิมเก็บบิลด์ทั้งหมด;เปลี่ยนข้ามHiเมื่อเป็นHiแล้วใช้reset/refundเดิม. ก่อนเป็นHiต้องมาจากparentClass2;หลังLv70ไม่ลดกลับClass1/2เพื่อป้องกันstateอยู่เหนือclasscap ให้เลือกHiสายอื่นโดยตรง. NPCยังข้ามrootไม่ได้. Weaponcompatibility13แถวเตรียมตามparent,แต่ภาพ/26โปรแกรมและAwakenยังต้องTASK123–124. Account/command/checkpointschemasเตรียม90/gate80,serversemanticcapยัง70ในรุ่นปิดHi.

## รายการ26ท่าใหม่สำหรับTASK123

รายการต่อไปนี้เป็นชุดที่ผู้ช่วยเลือกให้ทำต่อ ไม่ใช่โปรแกรมที่เปิดเล่นแล้ว. ตัวตนอาชีพ/สกิลและiconตรวจจากlocal `library/skill-assets/<ID>.json`;ผลเกมและตัวเลขเป็นการดัดแปลงตามrole ไม่อ้างว่าเป็นสูตรROเดิม. ท่าแรกunlock70/full88,ท่าสองunlock80/full89. แต่ละท่ายังต้องมีรายละเอียด/ราคา/rank/typedprogram/ข้อความ/variantและหลักฐานก่อนTASK125เปิด.

| Hi-class | ท่า70 / source skill ID | ท่า80 / source skill ID | ทิศทางบิลด์ |
| --- | --- | --- | --- |
| Lord Knight | Aura Blade /355 | Spiral Pierce /397 | บัฟตนเอง/แทงต่อเนื่องเป้าเดียว |
| Paladin | Shield Chain /480 | Gospel /369 | โล่หลายhit/สนับสนุนป้องกันและฟื้นฟูทีม |
| High Priest | Assumptio /361 | Basilica /362 | ลดความเสียหาย/เขตปกป้องพร้อมshieldทีม |
| Champion | Palm Strike /370 | Chain Crush Combo /372 | ท่าใช้บอลโจมตีหยุดเป้า/คอมโบหลายhit ไม่แทนที่AsuraหรือFinger |
| Sniper | Falcon Assault /381 | Sharpshooting /382 | เหยี่ยวเดี่ยว/ยิงหมู่คริได้ |
| Clown | Arrow Vulcan /394 | Marionette Control /396 | ยิงต่อเนื่องด้วยเครื่องดนตรี/เสริมพลังทีม |
| Gypsy | Tarot Card of Fate /489 | Moonlit Water Mill /395 | debuffที่ใช้seededRNG/เพลงป้องกันฮีลP.ATK |
| High Wizard | Mystical Amplification /366 | Napalm Vulcan /400 | เสริมเวทตนเอง/เวทGhostหลายhit |
| Professor | Double Casting /482 | Soul Change /374 | เวทติดตามจากcast/ช่วยSPทีม |
| Assassin Cross | Soul Destroyer /379 | Meteor Assault /406 | พลังผสมเดี่ยว/กายภาพหมู่+CC |
| Stalker | Chase Walk /389 | Full Strip /476 | หลบรับ/เร่งตนเองและลดพลังศัตรู |
| Whitesmith | Cart Termination /485 | Maximum Overthrust /486 | รถเข็นดาเมจเดี่ยว/บัฟATKทีม |
| Creator | Acid Demonstration /490 | Full Chemical Protection /479 | เคมี/ลดเกราะและป้องกันdebuffทีม |

แหล่งตราอาชีพROOมีครบ13จากcatalog https://roocdb.com/data/classes/professions/asia/en.json (cache `/private/tmp/ro-task123-professions.json`). ชื่อภูมิภาคใช้Minstrel7202กับสายBard→Clown,Mastersmith6102ภายในWhiteSmith,และBiochemist6202ภายในCreator;ต้องบันทึกaliasในsidecarไม่เดาภาพแทน. BodyHigh24ชุดมีในlocalแต่weaponoverlayไม่มีโฟลเดอร์High2แยกในexport;ต้องตรวจการใช้parentoverlayกับbodyclock/ACT/anchorsจริงก่อนบันทึกว่ารองรับ ไม่อ้างจากชื่อclass.idอย่างเดียว.

## TASK124 implemented baseline (local; release125 still pending)

152Awaken variants retainstableIDs/icons and addfunctionalroleeffects. Rank1usesatleastoldMaxpowerplusnewdebuff/support/passivepotency;SteelBodyexplicit77–85%guard,notglobalbuffcap. SanctuaryremainsPureHoT;Bard/Dancerremainopening+HoT. Noautomaticstatsfrompromotion. Nativeiconsusepurpleinnerline/staticglowacrossskilllist/details/catalog/Timeline.

Awakenunlock25000gold+20awakening_shard;upgradesrank2–10cost2000×targetgold+5×targetshards,totalfullAwaken133000gold/290shards. Actualbaseledger`skill`andnew`skill_awaken`remainseparate;resetsrefundactualpaidoncewiththeiroriginalversions. Conversion10manual→1shardand1shard→5manual,batchsinglecommand,nonrefundable. Newessencedungeonchestsaward2shardsatphase1fromchapter9snapshot,scaleexisting20%perphase;noAFKshards/oldpendingchestsrepricing. NativeAbyssJewelFragmentartisadaptedcurrency,notclaimedofficialROAwakenitem.

Wallet/carry/frozenper_hour/claims/ledgergainnewkey0onmigration;actorsgainemptyawakened_skills. Historicalreceiptskeep8-keypayloadsvalidwithoutrewritingtheirhashes;newreceiptscontain9resources. NoSQLmigration:SupabaseRPCsalreadycommitopaqueJSONwithCAS/history/receipts. TASK125mustproveactuallegacybackup/migrate/replayand10-slotisolationbeforedeployment.
