# การ์ด RO และดรอปจากฟาร์ม — D-099 / TASK-073

22 ต.ค.2026 · ใช้ชื่อ/ภาพ/ช่อง/จุดเด่นจากROจริง ตัวเลขสำหรับidle/quality/levelเป็นbaselineของเกมนี้ ไม่ใช่reverse-engineered RO Idle

## Catalog และการอ้างอิง

66ใบ: คง60definitionIDsเดิมเพื่อรักษาinventory/level/quality/lock และเพิ่มMini6 (Mastering/VagabondWolf/DragonFly/Angeling/Ghostring/Deviling) ทุกใบเก็บROitemID/monsterID/sourceURL/sourcegrade/originalslot/คำอธิบายดัดแปลง ไม่ให้AbysmalKnightเป็นMVP Sourcefactsใช้ [RO official Poring](https://ro.gnjoy.com/guide/runemidgarts/itemview.asp?ID=4001&itemSeq=5) และ [rAthena pre-re item database](https://github.com/rathena/rathena/blob/master/db/pre-re/item_db_etc.yml) / [monster database](https://github.com/rathena/rathena/blob/master/db/pre-re/mob_db.yml) โดยrAthenaคือemulator ไม่ใช่official Idle

Card artใช้cardbmpจริงจาก [ragassets](https://github.com/adsonpleal/ragassets) endpoint illust/card/ROitemID.png เก็บlocal/meta/checksum/provenance ไม่runtimehotlink ไม่ใช้skillsymbolsแทน SourceRGBA300×400คงไว้แบบlosslessWebP เหตุที่ไม่มีartในlibraryเดิมคือimporterรับitem/collectionแต่ไม่รับcardbmp Runtimecap32MiBเพื่อภาพที่โหลดตามการใช้งาน คงinitialprofile8MiBและvirtualizedbag

เกมมี6ช่องไม่มีshield จึงmapการ์ดshieldไปarmor ส่วนอื่นตามRO การ์ดใดเปลี่ยนช่องจะถอดคืนกระเป๋าตอนmigration ไม่ลบinstance/level/rarity/lock ไม่ย้ายRefine/Enchantตามการ์ด

## Shared combat extensions ที่จำเป็นต่อจุดเด่นการ์ด

เพิ่มผ่านtypedcontracts/data/default0 ไม่hardcodeชื่อการ์ดในengine:

- `defense_element` optionalบนitemและpermanent source สำหรับDokebi/EvilDruid/Angeling/Ghostring ใช้elementchartเดิม เมื่อหลายใบกำหนดธาตุใช้แหล่งท้ายในลำดับslot/socketที่compileแบบstable ไม่เอาค่าธาตุมาบวก; legacy sourcesไม่มีfieldใช้element tagเดิม ไม่มีarmor levelแบบPC
- ratio stats `<element>_resistance` สำหรับ10ธาตุในchart(neutral/water/earth/fire/wind/poison/holy/dark/ghost/undead) ปรับdamageที่ไม่ใช่trueด้วยmax(0,1-resist)ก่อนguard ใช้รวมแบบบวกในbucketเดิม ไม่clampmagnitudeที่เก็บ ค่าnegativeเป็นจุดอ่อน Cardquality/levelเพิ่มค่าดีและลดขนาดค่าลบตามกติกาด้านล่าง
- `freeze_resistance`/`silence_resistance`/`blind_resistance` ปรับโอกาสเฉพาะstatusนั้น (blindใช้accuracy_down) เพิ่มจากcontrolresistanceเดิม แล้วclampเฉพาะprobability ไม่เพิ่มglobalbossimmunity/diminishingreturns และไม่เปลี่ยนduration/queue/chainCC
- `magical_guard_percent` ลดเฉพาะmagicaldamage, `sp_cost_percent` ปรับfixedSPก่อนตรวจ/หักที่caststart (modeall_currentยังจ่ายหมดตามเดิม), `interrupt_resistance` ใช้เฉพาะeffectinterruptโดยตรง ไม่ยกเว้นhardCC; zeroไม่กินRNGเพิ่ม
- `move_speed_percent` คูณmotion50msเดิม ไม่เพิ่มASPD/CSPD/levelgrowth ไม่rangegateสกิล, `revive_hp_bonus`/`revive_sp_bonus` เพิ่มrecoveryratioตอนreviveโดยHP/SPไม่เกินmax ไม่สร้างreviveใหม่เอง
- Trigger optional `accepted_damage_types` filterphysical/magical/trueจากProgramContextที่damageeffectระบุ ไม่เดาจากอาชีพต้นทาง ใช้ให้Mayaสะท้อนเฉพาะmagicและHydra/Drainliar/Minorous/Kaho/Abysmalbonusprocเฉพาะphysical Normal/skillacceptedแต่proc/reflectไม่วน

โบนัสตามrace/size/elementใช้Trigger.when(has_tag event_target) + event_damage_power บนsharedpipeline ไม่ใช้target-dependentmodifier.whenที่recomputeStatsปัจจุบันมีเพียงself context เพิ่มtagaliasesที่ถูกschemaเช่นrace_demihuman/size_large/element_waterจากreference monster catalog ข้อมูลธาตุเดิมelement:waterยังอยู่ Procเป็นดาเมจเสริมตามHPdamageจริง ไม่อ้างเป็นPCpre-armor multiplierเดียวกัน

DarkLord/StormyKnight/Hatii/Baphomet/Marinaใช้typednormal-hit/damage-receivedprocที่มีอยู่แล้ว เก็บsource attribution/metrics/ancestry ไม่เสียskill slotใหม่ ไม่ตั้งAIholdingconditions อัตรา/พลังnormalizeและแสดงผลที่ใช้จริงกับผู้เล่น ไม่อ้างว่าจำลองผลPCทุกส่วนเช่นperfectdodge,Endurewalkdelay,consumabledropsหรือrefinecombosที่ไม่อยู่ในเกมนี้

## Farm profile และเซฟ

เพิ่มoptional `card_drops` frozenprofileในfarm.rate_snapshot: chance_per_million, definition_pool(arrayเรียงstable), definition_weights(record), quality_weights(bronze/silver/gold) และversion ไม่เพิ่มcarryclockใหม่ ใช้drop_carry_ms/รอบ5minเดียวกับgear แต่cardrollแยกจากlootRNGที่persist ภาพkill/FPS/fastforwardไม่เปลี่ยนreward

Stageordinal0..129เพิ่มcardchance1→2% ทุก5นาที (`card_farm_v2`, D-107/TASK-081 แทน20→40%ของTASK-073) คิด12ชั่วโมงมี144รอบ เฉลี่ย1.44→2.88ใบ ไม่ใช่รับประกัน1–3ใบต่อครั้ง ไม่มีpity ส่วนqualitybronze85→15%,silver14→50%,gold1→35%แบบlinearพร้อมintegerweightsที่รวม1,000,000คงเดิม poolเป็นทุกtierที่ปลดล็อกแล้วแต่เพิ่มweightให้tierหลัง Miniเริ่มบท2+ MVPบท6+และหายากกว่าnormal ไม่รับประกันrollหลังดีกว่าทุกroll

reserveFarmสร้างfixedcarditem `${claimId}_card_${dropIndex}` level1/lockedfalseและrarityจากprofileในpendingclaimเดิม retry/fullbagต้องจ่ายinstanceเดียว ไม่reroll Oldsnapshotไม่มีcardprofileไม่retroactiveให้card; farm.claimติดตั้งprofileใหม่หลังsettleoldunpaidintervalและเก็บpendingเดิม untouched ไม่มีSQL/envใหม่

เมื่ออัปเดตจากv1เป็นv2 การย้ายcontentคงfrozenprofileเดิมถ้ากฎ/gear poolเดิมยังเข้ากัน ช่วงสะสมก่อนclaimแรกจึงยังใช้v1และอาจได้หลายใบอีกครั้ง จากนั้นติดตั้งv2สำหรับเวลาถัดไป ไม่ย้อนหลังลดของในกระเป๋าหรือpending และไม่เปลี่ยนgacha/cardpower/grade/quality/อุปกรณ์/ทอง/ทรัพยากร

TASK-080 ขยายcard artในbag/picker/socketด้วยcover+roundedmask รายละเอียดเปิดภาพ3:4เต็มใบ กรอบการ์ดเล็กบนiconอุปกรณ์อ่านowner+slotprogressจริง: เทาเมื่อว่าง และBronze/Silver/Goldเมื่อใส่การ์ด capacity1/2/3ตามRefine0/5/10 ของที่ไม่ได้ใส่ไม่มีcardprogressติดไปกับitem ไม่เพิ่มAPIหรือstate

## การตรวจรับ

Focusedmechanics/cardcatalog/slotmigration/farmRNGpartition/cap/response-replay/fullbag และactualisolatedAuth/Postgres/mobileChrome แสดงearnedcard/claim/slot/reload พร้อมภาพจริงและoption/weaponfilterจากTASK-074 Assetchecks/M0/build/type/boundaries/secrets/hosted ไม่รันbalance simulationใหม่และไม่อ้างequal-budgetwhole-gamebalance

## คุณภาพ/เลเวลและการแสดงผล

ตัวคูณคุณภาพ Bronze1/Silver1.2/Gold1.5 × เลเวล1–5 (1/1.25/1.5/1.75/2) ค่าที่เป็นประโยชน์คูณตัวคูณนี้ ส่วนค่าที่เป็นโทษหารตัวคูณนี้ เพื่อให้การอัปไม่เพิ่มข้อเสีย เช่น GTB เพิ่ม SP costน้อยลงเมื่ออัปสูง `higher_is_better` ในstat-definitionsบอกทิศทาง (damage_taken_bonus/sp_cost_percent ยิ่งต่ำยิ่งดี) การปัดderivedstatsยังใช้pipelineเดิม

Procที่มีpower/formulaparameterหรือbuffmagnitudeปรับpowerเพียงชั้นเดียว โดยคงchance/duration/limitเดิม Procutilityล้วนเช่นfreezeไม่มีpowerให้ปรับจึงเพิ่มchanceแทนและclampเฉพาะprobability ไม่คูณทั้งpowerและchanceพร้อมกัน ไม่มีการคูณcardจากrarityของอุปกรณ์อีกครั้ง UIแสดงผลปัจจุบันและเปิดดูหลังอัปได้

ข้อมูลอ้างอิงอยู่ `plan/generators/cards-spec.json` การgenerateitemsต้องผ่านcard_catalog.pyเสมอ Sourcefactsและการจับdrop-owner/Class/MvpExpอยู่ `plan/evidence/task-073-source-audit.json` ไม่ใช้ลักษณะภาพหรือคำว่าbossของencounterจัดgrade

Profilebuilderอยู่domain/modes/farm-card-profile (กติกาด่าน), cardOriginsอ่านที่content/card-catalog และrandomdrop/weightedchoiceอยู่domain/rewards จึงไม่เพิ่มimportย้อนmodes→rewards ซอฟต์แวร์เกม/runner/previewใช้pipelineเดียว ไม่เพิ่มสูตรเฉพาะUIหรือSQL
