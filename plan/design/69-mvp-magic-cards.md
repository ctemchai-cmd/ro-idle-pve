# D180 — การ์ด M.ATK ระดับ MVP อีกสองใบ

26 ตุลาคม2026 · TASK156. ผู้ใช้ขอเพิ่มอีก2ใบและเน้นระดับสูง พร้อมเทียบกับP.ATK.

Audit78ใบก่อนแก้: Common20/Uncommon21/Rare20/Epic4/Legendary13. Positive derivedPAtk13 vsMATK6 (นับcard_power growthด้วย;5ใบเวทที่เพิ่มครั้งก่อนมีทั้งdamageและpenetrationจึงไม่เท่าจำนวนMATK). Epic1PAtk/0MATK;Legendary0PAtk/0MATK,แต่TurtleGeneralphysical22.05%/DarkLordmagical9.45%เมื่อLv1Legendary. DarkLordรับดาเมจก่อนจึงสุ่มcounter,StormyKnightเป็นmagicprocตอนnormalhit. ไม่สรุปจากจำนวนใบว่าDPSสมดุล.

เพิ่มFallen Bishop Hibram4441/monster1871/รองเท้า และTime Holder4625/monster3074/อาวุธ. ทั้งคู่MVP/Legendary/Tier60ตามlootเดิม. ชื่อภาพช่องMATK/SPtradeoffอิงprimaryrAthena re/item_db_etc.yml;MVPยืนยันจากpre-re1871และre3074mob data (MvpExp/Mvp:true). ค่าต่อไปadaptationในเกมเรา ไม่อ้างสูตรPCตรงตัว:
- Fallen Bishop rawMATK+25%,MaxSP−15%;Lv1LegendaryจริงMATK+45%,SP−8.333%;Lv5MATK+90%,SP−4.167%. ไม่เพิ่มbonusเฉพาะเผ่า/CT.
- Time Holder rawMATK+20%,SPcost+10%;Lv1LegendaryจริงMATK+36%,SPcost+5.556%;Lv5MATK+72%,SPcost+2.778%. ไม่เพิ่มCT/ASPD.

ใช้add_percentMATKเดิม,การscaleผลบวกและลดโทษตามrarity/levelเดิม ไม่มีengine/schema/savecommandใหม่. ช่วยทั้งdamageเวท/ฮีลที่อิงMATK,ไม่เพิ่มPATKหรือฮีลที่อิงPATK. Optional race effectsของต้นฉบับไม่เพิ่มเพื่อให้generalตามคำขอล่าสุด. ไม่แก้78ใบเก่า/ราคา/rates/skill/enemyหรือทำbalancebatch.

Gachaเพิ่ม2identityน้ำหนักMVP10,Legendaryรวม3%/pityไม่เปลี่ยน. FarmMVPยังเริ่มchapter6และใช้Tier60distributionเดิม;oldfrozenpool/RNG/pendingรับของเก่าก่อนclaimแล้วเริ่มpoolใหม่ผ่านmigrationD179เดิม. NoSQL/env/ownerwrites.

ภาพจริง300×400exactRGBA/sidecarพร้อมsourcehash;คงpack32MiB/initial<=1579562. ถ้าจำเป็นให้losslessmethod6recompressเฉพาะstaticที่วัดประหยัดได้ พร้อมauditตรวจpixel/geometry/metadata ไม่ลดresolution/quality/animations/เพิ่มงบ. Sidecarทั้งหมดต้องคงJSON.parseค่ากับsource. Runtime manifestตัดเฉพาะpresentation.provenanceกับicon_asset_idที่ไม่อยู่ในSkillPresentation contractและไม่มีconsumer (iconresolveจากicon_meta_path);ต้นฉบับplan/presentationsและsidecarเก็บครบ. เก็บvisual/audio/recipeทุกfieldเดิม,ทดสอบprojectionเทียบsourceชัดเจน. ไม่เปลี่ยนmediaหรือanimationเพื่อการprojection.

AC01: exactly2MVP/realIDs/slots/art,80cards/73portraits,78oldcards/rates/pityเดิม;farm/gachaเข้าถึงและunpaidmigrationคงเดิม.
AC02: compileequipจริงMATK/Sptradeoff/Lv1–5/stack/physical-vs-magic/heal/descriptions/checkpoint1x2x4ใช้กฎเดิม;boundedmechanicalchecksไม่balancebatch.
AC03: sourcepixels/native320390/32MiB/root-filteredbuild/M0/publicactualart+bundleSHAผ่านก่อนdone. ไม่restart6173/ไม่เข้าบัญชีผู้ใช้.
