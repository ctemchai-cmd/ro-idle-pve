# D179 — เติมการ์ดเวทและโบนัสต่อการโจมตีแบบประกอบได้

26 ตุลาคม2026 · TASK155 · ผู้ใช้ยืนยันผสมM.ATKทั่วไป/เจาะMDEF/โบนัสสกิลเฉพาะ

Audit73ใบเดิม:positiveM.ATK3/P.ATK13;M.ATKไม่มีในweapon/accessory. เพิ่ม5identityจริงจากrAthenaRenewal:Scaraba4505(accessory),Necromancer4440(weapon),Agav4409(armor),Siroma4416(accessory),Imp4433(accessory). ภาพตรงROitemIDเท่านั้น. ไม่แก้73นิยามเดิม. Referencehttps://github.com/rathena/rathena/blob/master/db/re/item_db_etc.yml;ค่าต่อไปเป็นadaptationสำหรับidle/cardpower ไม่ใช่สูตรROPCตรงตัว.

Authored raw beforeD103power/rarity/level:ScarabaM.ATK12,+SP-1%(tier20Rare);NecromancerINT1+magic-onlyMDEFpen6%(tier40Rare);AgavM.ATK15%/DEF-5(tier40Rare);SiromaColdBolt damage40%(tier20Uncommon);ImpFireBolt damage40%(tier40Rare). Siroma/Impไม่ลดCTเพื่อให้จังหวะคิวไม่เปลี่ยนเงียบๆ. Necroและbonusdamageผ่านfactor1.75เดิมครั้งเดียว;Scarabaflatสร้างgrowth21%ด้วยกฎcard_powerเดิม;Agavadd_percentคง15%เหมือนpercentmodifierเก่า. Runtimeคูณrarityและcardlevelเหมือนทุกใบ;คำอธิบายใช้ค่าที่resolveแล้ว. ตัวเลขถูกเลือกให้specializedBoltแรงกว่าgenericMAtkต่อสกิลที่ตรง แต่genericครอบทุกเวท/ฮีลที่อิงMAtk. ไม่มีการรับประกันDPSรวมทุกบิลด์หรือfullbalancebatch.

Item.combat_bonusesเป็นoptionalarray{id,damage_types,origins,skill_ids?,damage_bonus?,penetration_bonus?}. item/checkpointsourceใช้schemaร่วม;loaderตรวจskillIDs/ซ้ำ/เงื่อนไข;permanent_sourcesเก็บprofileที่scaleแล้วตอนประกอบbattle. Purehelperรวมเฉพาะmatchingdamage/origin/stableskillID. effects.damageเพิ่มoutgoinglaneและpenetrationในoffenseเฉพาะhitก่อนmitigation ไม่มีแก้actorstat/snapshot/RNG ไม่มีสร้างproc/hitปลอม. ค่าบวกเป็นadditive;ไม่ตั้งstackcapใหม่. Oldsourceที่ไม่มีprofileใช้เส้นทางเดิม. Spellbonusใช้mage_cold_bolt/fire_boltIDsเดิมจึงรวมAwakenแต่ไม่ขยายไปAoEหรือสกิลอื่น/normal/proc/reflect. Magicpenใช้normal/skill/periodicเฉพาะmagical ไม่เพิ่มphysical/heal.

Gachaและfarmเพิ่มdefinitionพร้อมweightnormal1000ตามระบบเดิม,rareprobabilityและcarddropcountไม่เปลี่ยน. Futurefarmprofileรับนิยามใหม่;unpaidAFK/pendingreward/oldIDs/banks/ledger/slotsต้องคงไว้ผ่านbackupmigrationเดิม. Monstertraitsใช้identityจริงที่ตรวจได้ไม่แก้enemies. NoSQL/env.

Assetbudgetคง32MiB/initial<=1621492. เตรียมภาพ5ใบและวัดlosslessrecompressionselectedstaticWebPmethod6/exactเท่านั้นเพื่อชดเชยbytes. ทุกpixelRGBA/dimensionต้องเท่าก่อน;เก็บhashauditและmetadata/provenance/timing/notes. ห้ามลดresolution/quality/เปลี่ยนanimation. Catalog/indexesและruntimeต้องregenerate/checkก่อนpublish.

AC01:5genuineIDs/art/rarities/slots/knownskillreferences,73olddefinitionvaluesunchanged,allUItextsrealresolvedpower,loot/gachapools/ratesและexistingunpaidfarmwindowตรวจได้.
AC02:sharedpipelineactualequippedcards>MATKหรือdamageจริงตามเงื่อนไข;ScarabahealMATK/Necromagic-only/SiromaColdonly/ImpFireonly/Aw/3stacks/cardlevel1-5/RNGunchanged/noextraevents/checkpointroundtrip;invalidprofiledatarejected.
AC03:RGBAexactandpack32MiB/initialbudget/sourcechecks/native320390/build+filtered/publicก่อนdone. Noownerwrites/fullbalancebatch.
