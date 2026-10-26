# TASK159 — การ์ดสมดุลตามบทบาท / TASK158 — Classic buttons

Local complete: Full748/748,focused16,newD183mechanics8,strict/rootbuild/M0/cardgeneratorcheckผ่าน. Native actualReact3groups:80cardinventory/14CardSheets/จริงร้านค้า/Classicstates320390/noerrors-writes. Sharedmath/effectpipeline audit480cases=80cards×Lv1/5×3equalbudgets,8matchedseedsต่อskill/heal,32ต่อnormalด้วยhit/crit/procจริง. ไม่ใช่fullfightDPSหรือglobalclasscalibration. [สรุปก่อนหลัง](summary.md),[CSV](audit.csv),audit.json.gzรายงานเต็ม.

ปรับpower79/80ใบ;Ghostringคงเดิม. 75ใบเติมrole/ปรับexplicitตัวเลข;auto-growthสำหรับflat/primaryลดเป็น30%เดิม. แก้ที่authoring card_power/card spec ใช้runtimeเดิม. คง80IDs/ภาพ73/slot/rarity/monstertraits/elementchart/loot/gacha/rates/costs/Refine/Enchant/ownedlevels/locks/ledger. Immutable save migration test preservesall80. ไม่มีSQL/env/owneraccess/6173restart. Pack798a928/raw33545187/initial1577418เดิม. Contentใหม่dcf03142aa5cfc839f905b4956c2534882064720209df335eb3a50a709d381ee. จบไฟต์แล้วใช้backup-updateflowเดิมก่อนเล่นcontentใหม่.

Utility:AGI+normaldamage/accuracy;evade+HP/normaldamage;statusimmunity+caster/HP baseline;specialistcardsคงconditionพร้อมunmatchedbenefit;HPแยกflat+guardกับHP%+healreceived. MVPutilityเติมcombatuseโดยไม่เพิ่มauto-revive. Imp/Abysmal/Andre/MAtkMVP/Incubusoutliersลดลงตามsummary. ค่าต่างหน่วยไม่ถูกรวมเป็นscoreหรือสัญญาว่าทุกบิลด์เท่ากัน.

ClassicCSSrecreation:beveledsilver/blue,4pxcorners/insetpressed/focus/disabled/danger/selected;คงmobilehitarea/layout/nativeicons/framelessskillicons. ตรวจshop/buttonsamplerและCardSheetsมือถือ;ปรับspeedselectedtextให้เข้มจากvisualreview. ไม่อ้างว่าเป็นoriginalbitmapskin.

Developmentfindings: firstauditใช้deadtargetทำให้heal0 จึงแก้targetHP1และguardbaseline>0ก่อนreportสุดท้าย. First748had14historicaloracles;ขอบเขตcardpowerเดิมถูกD183แทน จึงrestoreเฉพาะpowerfieldsจากfrozenbeforeเพื่อประวัติ และทดสอบcurrentrulesแยก. Final748/748ผ่าน. Newtestsmathใช้toleranceสำหรับfloatingpointและฐานDEFจริง;nativecurrenteffectsแยกจากcollapsednextlevel. ไม่แก้criteriaเพื่อซ่อนgameplayfailure.

VercelSUCCESS source`849ad9cebfc9cbd6e4eab17577af1d78e7380f11` ([deployment](https://vercel.com/chanon2/ro-idle-pve/8uryahdtZsoAwNwGYX2yVy4o9S5r));public4groups/24bundleSHA/newcontent+unchangedpack/login320390/Classiccontrastผ่านแล้ว. ทั้งสองงานdone. Browser/ownVite7513ปิดแล้ว. Usermodernassets/task108pngไม่แตะ.

Finalreview: GTBเพิ่มHP7.2%ที่LegendaryLv1คู่magicguard13.5%เพื่อไม่ด้อยกว่าMaya;KahobaselineP.ATK3.75%ตรงphysical-onlyprocเดิม. ไม่เปลี่ยนเงื่อนไขacceptedtypes.

Auditfinalcorrection:เก็บamountจากdamage/healeventsจริง;ไม่ใช้HPdeltaที่statusrecomputeอาจclampลง. พบอาการนี้ในMarina/Freezeของharnessที่เติมHPเกินmax;แก้ให้เริ่มHPจริงและวัดeventtotals. Normalใช้physical_roll/realcrit32matchedseeds;ไม่มีanalyticcritคูณprocปลอม. CSVใช้LFและgeneratedจากscriptเดียวกับgzip;ผลในsummary(สกิล/HP/SP)ยังตรง. Productไม่เปลี่ยนหลังtestedsource.
