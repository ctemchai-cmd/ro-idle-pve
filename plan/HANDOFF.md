# Handoff ระหว่าง agent

ไฟล์นี้บันทึกงานที่ agent ตัวหนึ่งทำแล้ว เพื่อให้ตัวถัดไป (Codex/Claude) ทำต่อได้ทันที อ่านคู่กับ [overview](overview.md) และ [AGENTS.md](../AGENTS.md) ล่าสุดอยู่บนสุด



## 22 ต.ค.2026 · Codex — TASK-083 done fixed monster rarity/Add Card ขึ้นVercelแล้ว

- **SOURCE 641a7813ca24ea69eb43193f9a6cf2472daec02f push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/7TFNKYsQGR76CTBqB4T2eYJ3UGRp actualpublichealth200/content0b7d1db6…/regionSG/checkpoint401/newUI-data-CSS manifestSHA/login/PWA3groupsผ่าน task083-hosted/github-deployment.json Task0837ACdone Board69/83done,inprogress4เดิม(041/058/064/067),review5,todo5 M4done29/38
- Userคำแก้ล่าสุดแทนrandomqualityต่อcopy: 20Common weakgray/20Uncommon stronggreen/9RareEliteblue/6EpicMinipurple/11LegendaryMVPgold fixedmonsteridentity ใช้rAthena pre-re sourceLevel/Class/MvpExp verified; Normalcutoffs<=20/<=45/>45เป็นgamebaseline ไม่claimROทุกภาคมีสีตรงนี้ AbysmalKnightNormalEliteไม่MVP FutureImmortal/Supremeenabledfalse
- Sharedcard-rarityในdomain/buildเป็นauthorityของfixedrarity/power/salvage/migration; legacy_qualityfloor=max(newmult,old1/1.25/1.5)ก่อนlevelและmaxdust ไม่double ไม่loss IDs/level/lock/slots/ledger/pity/oldpending. Benefits/penalties/procผ่านsharedpipelineเดิม Currentpower1/1.25/1.5/1.65/1.8 Data-diffยืนยันbasecardeffects/art/66IDs/costs/equipment unchanged
- Farmv3freeze perdefinitionrarity คงchance1–2%/5min(1.44–2.88expected/12h)และ3drawhit/1drawmissทำgearRNGไม่เปลี่ยน Oldv1/v2คงchance/pool/qualityก่อนclaimแรกพร้อมfloorแล้วติดตั้งv3. Towerfixedrarityตามdefinition. กาชาall66เลือก50/25/20/2/3matchingrarityแทนgearTier ราคา100/1000/10Rare+/30Legendarypityใช้oldcounter namesคงprogress Future0%ไม่show UI
- AddCardfreeก่อน/wornท้ายownerbadgesเขียว+nativeart/inlineeffectdescription/pinnedassign-movefooter รายการกับdetailscrollแยก ไม่เพิ่มconfirm/networkตอนดู. CompactR+10/E7ทั่วgeariconsตามactualslotowner (bagย่อ+10/E7) ไม่ทับlock/cardframes (bagmini horizontal5px) Freegearไม่มีprogress. CardSheet/5rarityfilters/socket/farmfinds/gacharevealใช้itempalette bordersครบ
- 63focusedTS/9new tests/990legacy powercases/M0/generator/build/type/boundaries/secrets/readiness8ผ่าน ActualAuth/API5+Chrome5groups: realsignedoldcontentbackup/migration151cards/pity/frozen, colors320/390, 85+longlist/4worn/owner/description/footer/0readonlywrites, actualNPCElite→main+Lv2/reload/R10E7คง, actual100crystalMVPpity/old20%farm→v3 1%/replay/reload. เปิดfinalAddCard320/390/gear/moved/MVPgacha/farmfinds320ดูจริง ไม่physicalAndroid/wholebalanceproof
- เก็บfailscodegenstaleM0/oldGoldoracle/oldflat+48slotassert/round1wrongVagabondgarmentfixture/round2actualbaglockoverlap+fix. Firstfunctionalsuccesscapturedgachamidanimation/พบfarm-revealยังไม่มีบางrarityborder จึงเพิ่มborderจริงและรอdecode/animationแล้วfinal5groupsผ่าน ไม่แก้expectedหลอกผ่าน ดูtask083-review.json
- **Content0b7d1db6bfecff6e0ab6406ad14bdad96b63e54d4d7e269e9d886c724f73931a /packc7e45b1fac44ffbb036d4b02a1bebc698b734fc21fc7c701c401b9a821cc1be2 /30,640,189B** ไม่มีnewSQL/env/assets/ownerwrite/6173restart/newbalancebatch ผู้ใช้reloadหลังจบไฟต์และbackup/migrateตามflowเดิม ไม่มีdirectcloudrepair CardOldrateจ่ายได้claimแรก Userใบธาตุยังproposalไม่ทำ
- Finaldocsclosureจะpushตามหลังsourceที่ตรวจแล้ว ไม่มีproductเปลี่ยน. Readinessหลังmoveก่อนจบ อย่าปิดoldownerpending/reviewงานอื่น


## 22 ต.ค.2026 · Codex — TASK-083 final localผ่าน พร้อมpush/deploy

- FinalactualAuth/API5+Chrome5groupsผ่านทั้งหมด task083-ui-live.json /local-stack.json (scopecontrolledmobile320/390 ไม่ใช่ownerphone), รวมsignedmigration/exactbackup151cards, colors/filters/allframes, longAddCard/4wornท้าย/inlineeffect/pinnedaction/zeroinspectionwrites, actualNPCElitecardassign+upgrade/reload/slotR10-E7คง, actual100crystalMVPpityและfrozen20%→v3 1%/retry/reload
- Finalpolishกาชาและfarmfindsมีactualborder2var--rcทุกrarityแล้ว harnessรอcompletedanimation+decodednativeimage ตรวจgold/farmcolorsผ่าน เปิดfinalMVPgacha/Farmfinds320ดูจริงแล้วพร้อมภาพAddCard320/390/gear/moved. Productพักนิ่งได้ commit/push now ยังTASK083inprogressต้องVercel/hostedproofก่อนdone
- Final63focusedTS/M0/generator--check/build/type/boundaries/secrets/readiness8ผ่าน content0b7d1db6bfecff6e0ab6406ad14bdad96b63e54d4d7e269e9d886c724f73931a packc7e45b…เดิม Data/catalog/migrationรายละเอียดsectionถัดไป NoSQL/env/assets/ownerwrite/6173restart/newbalancebatch
- Sourceparent26ffa73f4 currentnewfilesallours. ต้องsourcecommit→push→VercelSUCCESS→RO_EVIDENCE_PREFIX=task-083 RO_EXPECT_CONTENT_HASH=0b7d1db6bfecff6e0ab6406ad14bdad96b63e54d4d7e269e9d886c724f73931a RO_DEPLOY_COMMIT=<source> node scripts/test_save_latency_hosted.cjs→passedreview7AC/movedone/board69/83 M4done29/38/readiness8→docscommit. อย่าปิดold041/058/064/067/review5


## 22 ต.ค.2026 · Codex — TASK-083 local5groupsผ่านแล้ว เก็บfinalframe screenshotต่อ

- Final63focused/M0/buildผ่าน0b7d1db6… packc7e45b…เดิม ActualdisposableAuth/API5+browser5groupsผ่าน task083-ui-live-pre-reveal-polish.json: realsignedoldcontentmigration+exactbackup/all151owned/pending/pity/frozenprofile, 5nativeborders+filters320/390, longAddCard85+rows/4wornbottom/ownerbadge/inlineeffects/pinnedaction, singleactualNPCElite→main+Lv2/reload, guaranteedMVPgacha100crystalและold20%claim→v3 1%/replay/reload ทั้งหมดผ่าน ไม่มีownerwrite/6173restart
- Retainround1wrongfixtureVagabondWolfgarmentในweapon แก้NPCเป็นAbysmalweaponไม่relaxrules. Round2เจอrealR+10bagbadgeทับlock3px แก้compactbagซ่อนRเหลือ+10คู่E7, cardframeshorizontal5px, lockleftและequippedcardgradeลงเพื่อไม่ชนE. Finalround3ผ่าน5groups และภาพAddCard320/390/gearprogress/moved320ดูจริงแล้ว ยังไม่ได้push
- ManualimageQAพบgacha screenshotยังอยู่ต้นanimationและพบnon-Legendarygacha/farmfindsยังไม่มีactualrarityborder จึงเพิ่มCSSborder2var--rcบนgachaและcard-find-artwrapper (productpresentationonly) พร้อมharnessรอanimation+img.decodeและตรวจactualgold/farmborder. Finalbuildผ่านแล้ว contenthashยัง0b7d1db6… ตอนนี้**actualstackรอบ4กำลังรัน** ห้ามแก้product/codegenจนจบ. ต้องดูfinalgachareveal/farmfindsภาพก่อนcommit/push. 63numericchecksไม่ต้องรันซ้ำเพื่อCSSอีก ไม่มีbalancebatch
- Canonicaldesign31ล่าสุด+schema/cardrarityfloor/factories/ownedui allimplementedตามsectionถัดไป Board68/83done/083inprogress ยังไม่ทำreviewpassed/ไม่deploy083. Sourceparent26ffa73f4 previous082closure. Hostedharness083พร้อมตรวจdata/card_farm_v3/card_rarity_v3/maxLegendary/inlinefooter/progress/manifestSHA/loginPWA ใช้explicitcontenthash0b7d1db6bfecff6e0ab6406ad14bdad96b63e54d4d7e269e9d886c724f73931a


## 22 ต.ค.2026 · Codex — TASK-083 กำลังทำ fixed monster rarity + Add Card UX

- Userล่าสุดแทนคำตอบสุ่ม7rarityต่อcopy: มอนอ่อนCommonเทา/เก่งUncommonเขียว/EliteRareฟ้า/MiniEpicม่วง/MVPLegendaryทอง ปัจจุบันสูงสุดLegendary Immortal/SupremeเตรียมIDแต่disabled. D109/T083 authoredspec66rows sourceLevel/Class/MvpExpจากprimaryrAthena pre-re cutoffsNormal<=20/<=45/>45เป็นgamebaseline:20Common20Uncommon9Rare6Epic11Legendary AbysmalKnightNormal/Elite ไม่MVP
- เพิ่มdomain/build/card-rarity sharedauthority fixedrarity/power/salvage/migration: inventory+pendingเปลี่ยนclassแต่instance/level/lock/slot/ledgerคง เติมlegacy_qualityเดิมเฉพาะoldcards ใช้max(newmultiplier,oldquality)floorไม่คูณซ้ำ ต้นทุน/definitions/effects/art/idsเดิม. Activepower1/1.25/1.5/1.65/1.8 ดรอปใหม่ไม่มีlegacybonus 7canonicalIDs+3legacyIDsในschemaเพื่ออ่านbackupsเท่านั้น Futureสองระดับไม่สร้าง
- farmv3freeze definition_rarities ไม่สุ่มqualityอีก คง1–2%/5min/cap12h/grade+Tierpoolsเดิม และกิน3draw/hitเหมือนoldจึงgearRNGไม่สลับ Oldfrozenv1/v2เก็บchance/pool/qualitydrawและfloorจนclaimแรกแล้วติดตั้งv3. Towercardตามdefinitionrarity กาชาchoose50/25/20/2/3rarityแล้วmatchingmonsterจากall66 (ไม่gearTier) ราคา100/1000/Rare+10/Legendary30pity คงoldnamedcountersไม่reset UIไม่showfuture0%
- Userเพิ่มD110/111ในTASK083AC07: Add Cardว่างก่อน/สวมท้ายownerbadgeเขียวชัด/descriptionข้างรูป/เฉพาะlistscroll+fixedfooter(ใส่/ย้ายอยู่เสมอ;details/compare/upgradefold). CompactEquipmentProgressR+refine/Elevelตามslotจริงทั่วgearicons; bag3mini-cardframeshorizontal5pxและlockย้ายซ้ายเพื่อไม่ทับR/E; freegearไม่มีprogress. MemoizecardInventoryตามstate/slot Cardsใช้itempalette5สี/rarityfilters/ELITElabel/detailเอาTierออกไม่สับสนcardlevel
- M0+manifest/build/type/boundaries/secretsผ่าน content **0b7d1db6bfecff6e0ab6406ad14bdad96b63e54d4d7e269e9d886c724f73931a** /packc7e45b…เดิม. **63focusedTS** รวม9newcatalog/migration990powercases/frozenRNG/gacha/ownersort +existingfarm/gacha/slot/towerผ่าน ไม่balancebatch NoSQL/env/assets/ownerwrite/6173restart. Data-diffยืนยันbasecardeffects/equipment/lootchance unchanged Sourcefacts/reporttask083-source-classification/data-diff
- FirstactualfreshAuth/API5passed; real signed old-save migration+exactbackup/no-preview-write/all151cards/pity/frozenprofileผ่าน และ5nativebordercolors/filter320/390ผ่าน. BrowserหยุดLONG_ADD_CARD WORN_OWNER_LABELSเพราะ**fixtureใส่VagabondWolfgarmentcardในweapon** productmigrationคืนถูกช่อง จึงแก้fixtureNPCเป็นAbysmalKnightweaponcard ไม่relaxslotrules. retain task083-ui-live-round1/live-stack-round1/ui-failure-round1. เปิดfailureภาพAddCardและgearprogress390ดูจริง หน้าตาดี descriptions+footerอยู่ด้านล่างแล้ว
- **กำลังรันactualAuthstackรอบ2** sessionตรวจจากcurrenttools; scripts/test_card_rarity_live.cjs +scripts/game/card-rarity-ui-fixture.ts +RO_LOCAL_TEST_FOCUS=card_rarity. Freezeproduct/codegenขณะlive. ต้องจบactual5groups/ดูภาพ320/390/แก้สิ่งที่failจริงก่อนpush. Hostedharness083เพิ่มใหม่ตรวจdata/card_farm_v3/5colors/fixedfooter/progress/sha/login/PWAแล้ว ยังไม่push/deployหรือdone Board68/83done,inprogress5(083+old4),review5,todo5 M4done28/38
- Retaincodegenround1staleM0(รีวิวก่อนgenerateจึงแก้ถูก), M0round1assertoldGoldpityที่ลืมrenameแก้testnotrules, first47TS46pass/1oldslotfixtureexpectedflat+48staleตั้งแต่077percentcards แก้verifydistinctsources+exactsharedmodifiersและnewnumericpowercases ไม่แก้productเพื่อผ่าน; typecheckunusedprops/fixturesแก้แล้ว เก็บlogsแยก
- ถัดไปหลังactualpass: finaltargeted/readiness必要/buildถ้าproductเปลี่ยน→commit/push→Vercelstatus→RO_EVIDENCE_PREFIX=task-083 RO_EXPECT_CONTENT_HASH=<finalgenerated> RO_DEPLOY_COMMIT=<source> node scripts/test_save_latency_hosted.cjs→review7AC/movedone/board69/83 M4done29/38/readiness8→docscommit. ไม่ปิดold041/058/064/067/review5. Userใบธาตุยังproposalไม่ทำ


## 22 ต.ค.2026 · Codex — TASK-080/081/082 done ขึ้น Vercel แล้ว

- **SOURCE 517daa0305f2b591ffdc8a6c267d68017f45e4e7 push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/Cm78SLSRNFyyN5ftWCphD2rXhTE9 actualpublichealth200/content7b2a0267…/regionSG/checkpoint401/newUI-CSS-data-rendererSHA/login/PWA3groupsผ่าน task-082-hosted.json task-082-github-deployment.json. 080081082ย้ายdoneทุกACแล้ว Board68/82done,inprogress4เดิม(041/058/064/067),review5,todo5,M4done28/37 ไม่ปิดงานรอowner
- 080ภาพcardใหญ่เต็มroundedcovermask+mini cardframesBronze/Silver/Gold/emptyตามactualslotowner/refinecapacity. ActualfreshAuth/API5/SQL/mobile320/390สามgroupsผ่านพร้อมoldfrozenrewardclaim/replay/reload/stage8-20→2%. รูปcard/bag/picker320ดูจริงแล้ว ไม่มีreadonlysave
- 081 versioncard_farm_v2 chance1–2%/5min expected1.44–2.88/12hตามuserasync ไม่guarantee ไม่เปลี่ยนquality/grade/pool/gear/gacha/cardstats/owned/pending. Migrationเดิมเก็บoldv1profileและclaimครั้งแรกยังsettleold20–40%ได้ จากนั้นv2 เริ่มเวลาถัดไป ไม่retroactiveลดของ contentใหม่7b2a026768c31cf63c7e50510a26e7be840cdcc4010ac6cfb27cf078d8707e91 ผู้ใช้จบไฟต์/reloadและbackup/migrateตามflowเดิม ไม่มีSQL/envใหม่
- 082 Asura+bigattacks15profiles/8styles/6roots renderer-only actualdamage/shieldabsorb+action_id+visualImpactMsเดิม ขัด/miss/normal/proc/healไม่ขึ้น onebanner/action. Wall750–1000msอ่าน×4 impact420ms/shake≤5intrinsicpx180ms HUD/titleนิ่ง/reducedmotionstatic Farmimpactยังมีแต่ซ่อนbanner/shake NoMath.random/enginechange/newpack AuthoredROadaptationไม่claimexactnativeAsura (local271procedural/missingsound/runtimeเดิมBash)
- Final30focusedTS080081082+11nativecontact/animation/M0/build/type/boundaries/content/secretsผ่าน. FinisheractualisolatedVite/nativeChrome3groups/10ท่าครบ6roots/8styles:contactfirstnumber/reducedmotion/quietfarm, actualAsuracheckpoint/events/RNGidentical×1/2/4และrealinterruptnobanner; Asura320/390/Meteor/GrandCross/SonicBlowเปิดภาพดูจริง ไม่ใช่ownerphonebenchmarkหรือnewbalancebatch
- Retainfailures: hostround1ใช้localunconfiguredfilenameเทียบproductionconfiguredผิด จึงแก้harnessอ่านactualproductionmanifestfilename+SHA+requiredmarkersแล้วdeploymentเดิมผ่าน ไม่เปลี่ยนproduct; buildround1readonlytestfixtureแก้immutableactorsmap; browserround1viewportmetaหาย nativecanvasถูกแต่มือถือย่อผิด เก็บround1report/screensแล้วfinalเพิ่มviewportassertผ่าน ดูreview080081082 ไม่ซ่อนfail
- Packc7e45b1fac44ffbb036d4b02a1bebc698b734fc21fc7c701c401b9a821cc1be2 /30,640,189Bคงเดิม ไม่ownerwrite/6173restart/privateenv/SQL/assetsใหม่ src/generatedยังignoredbuildregenerate Design33และ31ล่าสุดcanonical Userproposalใบธาตุยังไม่approvedimplementation ไม่ทำแทรก
- Finaldocsclosureจะcommit/pushตามหลัง sourceที่ตรวจแล้วเท่านั้น ไม่มีproductเปลี่ยนจากpublicproof ทำreadiness8หลังย้ายdoneก่อนจบ


## 22 ต.ค.2026 · Codex — TASK-082 localผ่าน รอ public deploy proof

- Sourcecard/rate080081อยู่4af3865c6แล้ว ยังไม่doneรอpublicรวมกับ082. ภาพcardmask/ownerframesและactualoldv1claim→v2สามกลุ่มผ่านตามsectionถัดไป คงcontent7b2a0267…/packc7e45b…
- D108/T082เพิ่มsrc/renderer/finishers.ts profiles15ท่า/8stylesครบ6roots ใช้actualdamageหรือshieldabsorption/action_id+visualImpactMsเดิม ขัดร่าย/miss/normal/proc/healไม่ขึ้น บังคับdedupAOE/multihitและboundedpending12/active3/draw2/seen1024/noMath.random. Asuraแสงหมัด/radial/วงกระแทก+ASURA STRIKE; title750–1000wallms/impact420wallms/shake≤5intrinsicpx180ms แยกจากengineclock จึงอ่านได้×4 HUD/titleคง; reducedmotionปิดshake/impactคงstatictext. Farmยังมีimpactแต่showFinisherTitles=falseจึงไม่มีbanner/shakeรบกวน
- **ActualisolatedVite/Chrome/nativepack3groupsผ่าน** task-082-browser.json:10ท่าครบ6roots/8styles contactตรงfirstnumber ไม่มีcheckpointmutation/reducedmotion/quietfarm; actualAsura6000mscheckpoint/events/RNGเท่ากัน1/2/4และinterruptedcastไม่มีfinisher; nativeAsura320/390px+mediareducedmotion/0APIwrites. เปิดภาพmobile320/390/Asura/Meteor/GrandCross/SonicBlowดูจริงแล้ว เป็นdesktopmobileemulation ไม่ใช่ownerAndroidbenchmark
- 30targetedTS080081082+11nativecontact/animationregressionผ่าน task-080-082-targeted.txt/task-082-contact-regression.txt Finalbuild/type/boundaries/content/secretsผ่าน task-082-build.txt. Retainfirstbuildreadonlyfixturetypefail→แก้testimmutableactorsmap ไม่relaxreadonly; earlierfixturefreeze/viewportmetafailreportและscreensเก็บround1. Noengine/rules/SQL/env/media/ownerwrite/6173restart/newbalancebatch. src/generated ignored intentionally, build regenerates
- Canonicaldesign33บันทึกprofiles/clock/contact/ROadaptation (native271mappingยังprocedural/missingsound จึงไม่claimexactnativeRO), design31ปรับrare1–2%/5min expected1.44–2.88/12hกับoldfrozenfirstclaim. Hostedharness082เพิ่มactualnewUI/CSS/data/rendererSHA checksพร้อมlogin/PWA/APIregion/content อ่านpublicเท่านั้น
- ถัดไป: commit/pushsource082→รอVercelSUCCESS→runRO_EVIDENCE_PREFIX=task-082 RO_EXPECT_CONTENT_HASH=7b2a026768c31cf63c7e50510a26e7be840cdcc4010ac6cfb27cf078d8707e91 RO_DEPLOY_COMMIT=<source> node scripts/test_save_latency_hosted.cjs→review080081082/movedone/board68of82/M4done28of37/readiness8→docscommit. อย่าปิดold041/058/064/067หรือreview5ที่รอowner Userproposalใบธาตุยังไม่approvedimplementation


## 22 ต.ค.2026 · Codex — TASK-080/081 localผ่าน + TASK-082 กำลังทำ

- ผู้ใช้ต่อจาก079ขอcardimageใหญ่เต็มช่องแล้วmaskขอบมน และmini cardframesบนgearicon. D106/T080แก้cover+mask bag/picker/socketและnativefullportraitdetailเดิม, qualityBronze/Silver/Gold/emptyframeอ่านactualowner+slot+capacity1/2/3 ไม่ใส่cardsให้freeitem; sharedhelperclient/slots/equipment-cards UIในBuddy/slot/bag/picker Refinepillย้ายบนไม่ทับแถวcard
- ผู้ใช้ตอบasyncเลือกรางวัลการ์ดแรร์1–3/12h: D107/T081loot.cards versionv2 chance_start10000/end20000แทน200000/400000 ทุก5min expected1.44–2.88/12h ไม่guarantee ไม่แตะquality/grade/pool/gear/gacha/cardpower. Puremigration/commandsเดิมคงoldfrozenv1ช่วงค้างจนclaimreserveครั้งเดียวแล้วinstallv2 ของเดิม/pendingไม่ลด ไม่ต้องSQLใหม่
- 22focusedTS+M0/build/type/boundaries/secretsผ่าน actualfreshAuth/API5/SQL/mobile320/390三groupsผ่าน finaltask-080-081-ui-live.json,ภาพfull-cards/gear-frames/full-picker320เปิดดูแล้ว. Nativepicturesfillmaskดี มีE/lock/gradeไม่clip. Full12h actualclaim/replay/reload/farmstage8-20→2%ผ่าน Existingownedpayloadคงเดิม
- เก็บfails: targetedround1floatthresholdคูณกลับใกล้epsilonที่ไม่ใช่actualRNGdraw+oldtestguaranteecardเมื่อเรทใหม่อาจ0 แก้testใช้RNGquantumและassertenabledprofileแทนguarantee. Browserround1JSON.stringifykeyorderPostgresต่าง แก้deepEqual; round2chesthasrewardinfinitebounceทำPlaywrightstableclickwaittimeout แก้realpointertap ไม่แก้productหลอกให้ผ่าน
- **Contentใหม่7b2a026768c31cf63c7e50510a26e7be840cdcc4010ac6cfb27cf078d8707e91**; packc7e45b…เดิม; noowner/6173/env/SQL/assets/newbalancebatch. ยังต้องpush/deploy/hostedแล้วmove080081done Sourceก่อนงานa1f6c154f. Userproposalใบธาตุ30minยังแค่คุย ไม่ทำในscopeนี้
- Latest userเพิ่มAsuraสวยแบบRO/jitterเล็ก/textและbigattacksอาชีพอื่น D108/T082 **กำลังทำ**. อ่านrendererแล้ว Asuraปัจจุบันvisual_monk_asura reusepreparedBash5. Native271metaอธิบายlens1streaks/proceduralhit266แต่soundmappingmissing ไม่อ้างcompleteROeffect. วางแผนrenderer-onlyboundedfinisherprofiles+actualpositivehit/visualImpactMs, one/action despiteAoE/multihit, nointerrupt/miss/normal/proc, canvasworldshakeเล็กHUDคงและtextwall-readable×4 มีreducedmotion ไม่แก้engine/pack/data/hash7bหรือsave ต้องทำproduct/QAต่อก่อนdone
- BrowserAuthstackหยุดและcleanupแล้ว แก้product/codegenต่อได้ อย่ารันstackพร้อมแก้product. Board65/82done,inprogress7(เดิม4+080081082),review5,todo5,M4done25/37. taskfiles/matrix/decisionsสร้างครบแล้ว


## 22 ต.ค.2026 · Codex — TASK-079 done ภาพการ์ดและคำอธิบายสกิลขึ้นVercelแล้ว

- D-105 userขอcardpictureไม่ชนขอบมน/อธิบายผลเปลี่ยนและLv1–5ของCallSpirit/Provoke. bagคง3:4 boundedheight+radiusบนขอบภาพจริง E/grade/lockไม่clip; socket30px; picker38pxแก้percentheightขยายภาพ
- client/skillsรวมstart_effects/ballcost/all-SPminimum/DoTcoeff/chance/expiry/revive/summon พร้อมProvoke/endowscope; Passiveแสดงevent/chance. SkillGrowth resolveเฉพาะselectedทุกlevelด้วยsharedSP/CSPD/resolver แสดงnextdeltaรวมACDทันที+collapsedtable; cap/maxpreviewไม่ข้ามcommandgate สี่slotอยู่ล่างเหมือนเดิม
- Current126skills/weapon-inherit29 มีFireEndowเท่านั้นที่endowweapon(allalliesFire6.5s+MATKup5.5s) EnchantPoisonเป็นATKupไม่endow. CallSpirit5ลูก/ATK1%ต่อบอลที่เหลือทุกlevel SP27→18; Provoke4500msทุกlevelSP19→10 ตัวเลขคือเกมเราปัจจุบัน ไม่อ้างROจริงหรือเพิ่มbalance079
- 20focused รวมทุกadjacentlevel126skillsที่definitionเปลี่ยนต้องมีvisible delta/build/type/boundaries/secrets/readiness8ผ่าน actualfreshAuth/API5/SQL/mobile320/390สี่กลุ่มzeroinspectionwrite รูปcard/picker/Provoke320+CallSpirit390/Endow320เปิดดูจริงแล้ว เก็บround1fixturefail/round2realpickerfail และsource4852hostedproofไว้ หลัง4852พบSpiritCombochanceที่ตกหล่นจึงfollowupcf867เฉพาะtext+coverage ไม่รันbalancebatch ไม่แตะowner/6173/env/SQL/assets contentebaeef7…/packc7e45b…เดิม
- **FinalSOURCE cf86794d5373526c1cdf24d247d0f7859675a34c push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/FppZtBDkFSgW2QCKXFghrvicxd3x publicAPI/newUI/CSS/Passivechance/login/PWA3groupsผ่าน0mutation TASK079doneทุกAC. Actualmobile4groupsที่4852ยังเป็นlayout/cardเดียวกัน; Passivefollowupตรวจ20focused+hostedbundle ไม่อ้างphysicalAndroid/owneraccount Board65/79done,inprogress4(041/058/064/067)เดิม,review5,todo5,M4done25/34 ไม่มีmigrationใหม่สำหรับUI079


## 22 ต.ค.2026 · Codex — TASK-078 done ฮีล/แทงก์/ซัพพอร์ตตามคำตอบผู้ใช้ ขึ้นVercelแล้ว

- ผู้ใช้ตอบasync D-103ว่าอยากให้ทุกบทบาทขยับใกล้กัน รวมฮีล/ถึก ไม่ใช่เฉพาะdamage. D-104/TASK078จึงแทนข้อเว้นheal/supportของ077: factor1.75เดิมจากimmutable79b3baselineครั้งเดียว 59supportprograms/Heal/HoT/Kyrieflat+ratio/HP/DEF/guard/ATK/MATK/คริ/หลบ/regen/Devotion/Revive+HealingPlant CopiedHealตามsource ส่วน52damagecurves077คงค่าเดิม ไม่คูณซ้ำ ไม่เปลี่ยนASPD/CSPD/CT/ACD/SP/CC/chance/expiry/stackpolicy/ด่าน
- PrimarycardSTR/INT/VIT/DEXยังมีprimaryเดิม+derived%ตามstatcoeff/referenceกลาง เช่นElderINT2+MATK10.5%+SP14%, PickySTR1+ATK5เดิม+ATK12.25%. Card66identities/cost/quality/level/procs/resistance/weaknessเดิม อาวุธไม่ได้เพิ่มสุ่มอีก: ตรวจทั้ง10families×Tier20/40/60โดยไม่มีการ์ดเพิ่มATK/MATK>25%ทุก30buildจริง Maceเป็นMATKไม่ใช่PATK
- Focused74TS/378goldens/static126skeleton+59support/52damageunchanged/M0/build/type/boundaries/secretsผ่าน contentebaeef7… packc7e45b…เดิม/ไม่มีschemaSQLenvassets. ActualfreshAuth/SQL/mobile320/3905groups+API5ผ่าน screenshotsHeal/Kyrie/Endure/Song/nativeElderดูจริงแล้ว เรียกtest_build_impact_liveด้วยRO_EVIDENCE_PREFIX=task-078ไม่overwrite077 คงround1testprecision/maceclassificationfailsและM0metadatafixesเป็นประวัติ ไม่productfail
- **SOURCE6dbcad7bceeba2118320f6cc6653a4690026a05b push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/99rTGg2LaWh3RZLrBLoqvxTuSsgq actualhostedAPI/newheal2.1+guard.14+healingPlant1.75data/login/PWA3groupsผ่าน0mutation TASK078doneทุกAC. Board64/78done,inprogress4(041/058/064/067)เดิม,review5,todo5,M4done24/33. ไม่มีownerwrite/6173restart/privateenv/newSQLหรือbalancebatch; จบไฟต์/reloadแล้วผู้ใช้backup/migrateเดิม


## 22 ต.ค.2026 · Codex — TASK-077 done สัดส่วนพลังร่วมทุกอาชีพ/การ์ด ขึ้นVercelแล้ว

- ผู้ใช้ขอสกิล/การ์ด/ไอเทมมีผลต่อไฟต์มากขึ้นและชี้แจงให้scaleทุกอาชีพ/การ์ดไปทางเดียวกัน ยอมรับด่านเดิมง่ายขึ้น จึงแทนdraftcurveรายท่าด้วยD-103sharedpowerpolicy1.75 (assistanttrialvalue). ข้อเสนอเก่าที่บอกห้ามบัฟทุกท่ารวมในบันทึก076ถูกแทนโดยคำชี้แจงล่าสุดนี้ ไม่เพิ่มบอส/ด่านชดเชย ไม่renewedbalance simulation/calibration
- 52damageprogramsทุกต้นอาชีพ/Passive/DoT/counter/copy+HellPlantเพิ่มpower1.75; Detonateflat→ATK105–210%/ownstackโดยreferenceATK100×factorเดียวกัน. Carddamageprocทุกใบใช้factorเดียวกัน; flatATK/MATK/HP/SP/DEFcardคงflat+เพิ่ม%จากsharedreference ไม่แก้66ROIDs/art/slots/quality/level/cost/control/resistance/penalties. ด่าน/Tower/Daily/เศรษฐกิจเดิมไม่เปลี่ยน
- Gear144+future36ใช้role/tiercurveร่วม: skill/normal/heal/tank/SP; เพิ่มoptionskill/normal สองชนิด ไม่rerollของเก่า. Newoptionaldefault0stats skill_damage_bonus/normal_damage_bonusบวกoutgoingเดิม ไม่multiplicativeทุกsource; cardprocไม่รับskillbonusซ้ำ. พบและแก้rarityfloorratio→0ให้ratioเก็บ6digits integerเดิมคงfloor. Summon snapshotbonusจากownerครั้งเดียว หักbaselineprimarymilestonesไม่คูณAGI/LUKซ้ำ; power_scaleเฉพาะATK/MATK
- Focused67TSรวม378numericgoldens/static106rows/M0/build/type/boundaries/content/secretsผ่าน; actualfreshAuth/Postgres/PostgREST/mobile320/3903groups+API5ผ่าน. ตรวจภาพBash245%, skill→normalpreview17%→0/0→19.2%, nativeWolfGold5+24ATK/+42%จริงแล้ว. เก็บharnessfailround1–4และfixturemathfails ไม่แก้productเพื่อให้ผ่าน ไม่มีownerwrite/6173restart/keys/newSQL/env/media; content7345a9e… packc7e45b…เดิม
- **SOURCE6538f4d3832f08a7397bcc3a35101a59a220fcca push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/Ay8Ef8S77afq4QCHH2bFZG1vCGYz actualhostedAPI/new7345data/login/PWA3groupsผ่าน0mutations TASK077doneทุกAC. Board63/77done,inprogress4(041/058/064/067)เดิม,review5,todo5,M4done23/32. Hostedround1harnessหาunquotedpower_scaleในescapedJSONผิด แก้เฉพาะharnessnormalizequotesแล้วdeploymentเดิมผ่าน ไม่อ่านowneraccount/ไม่SQL/envใหม่ ผู้ใช้จบไฟต์/reloadแล้วใช้backup/migrateเดิม


## 22 ต.ค.2026 · Codex — TASK-076 done ธาตุสกิล/เกราะเป้าหมายขึ้นVercelแล้ว

- 22 ตุลาคม 2026: ผู้ใช้สังเกตสถิติว่า damage ส่วนมากมาจากตีปกติ ตรวจcode/dataแบบstaticพบ runtime SI3000ms vs normal1500ms (ทั้งคู่ลดตามASPD), ตีได้ในSI/ACDและหยุดตอนCT; normal100%ATK/critได้ ขณะที่ BashLv1=140%→max220%, DoubleStrafeLv1=70%×2→max110%×2. ข้อมูลนี้อธิบายโอกาสnormalครองสัดส่วน โดยเฉพาะสกิลต่ำ/หลายช่องบัฟฮีล แต่ยังไม่ได้อ่านownerbuild/logหรือยืนยันว่าสัดส่วนทุกสายเหมือนกัน จุดตรวจถัดไปคือความคุ้มค่าสกิลโจมตีเทียบCT/SP/ช่องและแยกสายnormal/skill ห้ามเพิ่มตัวคูณทุกท่ารวมกันหรืออ้างwholebalanceจากตัวอย่าง ไม่ได้เปลี่ยนสมดุล/รันsimulationในรอบTASK076

- ผู้ใช้ขอแสดงธาตุสกิลและเกราะธาตุเป้าหมาย D-102. เพิ่มclient/elements graphอ่านeffect/status periodic+triggers/passive/summon/handlerพร้อมcycleguard ใช้จริงทั้งป้ายและeffectdescription แยกEnvenomhitweapon/DoTpoison ไม่เดาจากชื่อ ไม่Holyheal. Main/legacy skilldetailsและpublicdemoมีbadge
- BossHUDอ่านarmorจากstate sourceslast→tag→Neutral; focusอ่านarmor+weaponผ่านdomainweaponElementจริง ไม่มีDOMstatcalculation. Sourcecardต้องมีarmorสวมจึงactiveตามเดิม FireEndowไม่เปลี่ยนarmor/fixedspell. ไม่แก้domain/contracts/data/hashpack ไม่เพิ่มAPI/save/SQL/env/balance/6173restartหรืออ่านprivatekeys
- Localtargeted33/build/type/boundaries/secretsผ่าน content4e440839…/packc7e45b…เดิม. ActualdisposableAuth/PostgREST/Postgres/mobileChrome3groupsผ่าน 9skilldetail/3modes/AngelingHoly/EndowFire/focuschange/320–390px/onlystart-retreatcommands รูปbattle/envenom320ดูจริงแล้ว Publicdemolocal2groupsและbadgecomponentsใช้ร่วม ไม่มีowneraccount
- **Sourcee50bd79cbbb43d3d6ed157038c78757ea287a455 push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/5L5nnV574EGzdb4jAPhbXqDT98Ce actualhostedAPI/login/PWA3groups+sharedmobileelementdemo2groupsผ่านและภาพhosted320ดูเต็มจริง newUIbundlesตรง/0mutations. Task076doneทุกACผ่าน; board62/76done,inprogress4/oldpending4ไม่ปิด เก็บround1VIT100เกินcap,round2card dormantemptyarmor เป็นfixturefailไม่productfail แก้fixtureแล้วผ่าน อย่ารันbalance/calibration,อย่าแตะ6173/env/saveowner

## 22 ต.ค.2026 · Codex — TASK-075 done ภาพหลังอัปเดตโหลดได้แล้วบนproduction

- **SOURCE `67c5d03f1e2b6225745f497c1f34b0917e318bdb` push/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/BjqEsnUr9ud5APPFSgwe8PEQJvJ1 Actualhosted2groupsผ่าน มีheader/ภาพจริง/coldwarmPWAstartupและ0ownerwrites บันทึกภาพhostedและตรวจพิกเซลจริงแล้ว
- Userรายงานยังเตรียมภาพไม่ได้หลัง073/074 deploy พบrootcauseactualproduction `/ro/manifest.json` และqueryตอบCache-Control public1yrimmutable ทั้งที่configมีno-store กฎ `/ro/:hash/:path*` จับmanifestเป็นhashแล้วทับ ทำให้oldf57 cachedแต่newbundleต้องc7จึงAssetPack.openreject เห็นhealth/newfilesถูกไม่ได้พิสูจน์warmstartup งานเก่าหลักฐานcoldผ่านจริงแต่ขาดHTTPcachecoverage
- Patch2จุดเท่านั้น: src/renderer/pack.ts jsonhelperรับoptionalRequestInit; openfetchstablemanifestcache:no-storeเพื่อข้ามresponseที่เครื่องผู้ใช้มีอยู่แล้ว; vercel.jsonimmutablepatternเฉพาะ/ro/:hash([a-f0-9]{64})/:path* ไม่เปลี่ยนmedia/metadata caching/expectedpackchecks ไม่ล้างstorage/Auth/เซฟ ไม่ownerwrite/6173restart/Sim ไม่มีSQL/env/pack/data/rules/schemahashchange contentยัง4e440839… packc7e45b…
- RealisolatedVite/mobileChromepersistentprofile3กลุ่มผ่าน scripts/test_asset_cache_rollover.cjs: primeactualoldf57immutableจากgit7167980af, serverสลับc7แต่defaultfetchยังoldโดยservercountไม่เพิ่ม, actualfixedAssetPack.openได้c7และdecodePoring300x400/mismatchยังreject, actualdemo2bootsมีscenery/4actorportraitsครบ sentinelcookie/localStorageคงและ0mutation รูปเปิดดูแล้ว ไม่มีAuth/ownerdata
- Headerpatternผ่านinstalledVercelbuilderpath-to-regexp4กรณี ฟอร์มregexsupportedofficialdoc; focusedAssetPack4/build/type/boundaries/secretsผ่าน SourceHTMLpackhash/contentยังเดิม เลยไม่ต้องmigrateเซฟสำหรับ075เอง
- Task075doneทุกACผ่าน actualproductionstablemanifest/queryno-store/hashedPoringWebP-metaimmutableSHAเดิม +cold/warmmobilepublicdemoมี4nonblankactorportraits/sceneryใต้SW, mediareuseHTTPcacheแต่manifestfresh, storagecookieคงและ0mutations Sourceด้านบน เกม/content4e440839…/packc7e45b…ไม่เปลี่ยน ไม่มีSQL/env/migrationเพิ่มจาก075 Userปิดเปิด/reloadครั้งเดียวห้ามให้clearstorage/Auth/เซฟ
- Board61/75done,inprogress4(041/058/064/067),review5(oldvisual),todo5,M4done21of30 Docscloseตามsource ห้ามปิดownerpending4เดิม 073/074done source00e74417d/docsbf6462769
- sourcebeforeheaders/cache-browser/header-matching/targeted/build/hosted/gh/review/readinessในtask075evidence ทั้งหมดpassed ไม่มีbalance/calibrationrunner ไม่owner/6173/keys ActualphysicalAndroid/owneraccountไม่ได้เข้า แต่sharedloaderactualHTTPcacheและhostedimagesตรวจจริงแล้ว

## 22 ต.ค. 2026 · Codex — TASK-073/074 done และขึ้นVercelแล้ว

- **SOURCE `00e74417d2bf7ddecc435903a71cd353cc33d559` pushmain/VercelSUCCESS** https://vercel.com/chanon2/ro-idle-pve/AJGYJc2oAfscg3hTVGUEjibjU4hy และactualpublichosted3กลุ่มผ่าน health200/hashตรง/checkpoint401/newUI-data/nativePoringSHA/loginPWA ไม่มีownerwrite
- Userงานคืนนี้ทุกข้อทำproductครบ: Healing072doneขึ้นVercelแล้ว(source7167980af6/docsb3d90044e), 073ROcards66/nativeart/AFKdrop, 074optionvertical/weaponfamilyfilter 073/074sourceและdocscloseบันทึกครบแล้ว ไม่มีsubagents/balance simulation/ownerwrite/6173restart/อ่านenv-login
- 073catalog49Normal/6Mini/11MVP คง60olddefinitionIDs+Mini6 SourceofficialPoring/rAthenaemulatorpre-re, ไม่จัดAbysmalเป็นMVP Shield→armorเพราะ6slots. spec plan/generators/cards-spec.json +card_catalog.pyเรียกจากitems.py สำคัญอย่ารันtempone-offauthoringย้อน. sourceaudit66actualdrop-owner/Class/MvpExpในtask073source-audit.json
- Artnative300×400losslessWebP66ภาพ/rootstarter110รวม67,496IDs fromragassets endpoint มีmeta/SHA/provenance/contactsheet3หน้าเปิดดูครบ 5.1→3.35MBลบเฉพาะnewPNGหลังRGBAverified Runtimepackc7e45b1fac44ffbb036d4b02a1bebc698b734fc21fc7c701c401b9a821cc1be2=30,640,189B/32MiBcap initial1,582,917B/8MiB lazyไม่โหลดposterทั้งหมดหน้าแรก Assetchecks/importerPython35ผ่าน
- Shared optional defense_element/accepted_damage_types trigger +19default-zero ratio stats supportcardidentity viaengine noitemnamehardcode/AIchange/globalCCimmunity. zeroresไม่เพิ่มRNG truebypassnewres; Phenไม่กันhardCC. Benefits×quality-level/penalties÷scale viahigher_is_better; proc power scales once or pureutilitychance scales, notboth. Newstatunits/AdditionalStats41อ่านdataไม่ตกหล่นfuturestats Defaultprimary/speedgrowthไม่เปลี่ยน
- Farmoptional frozenprofile5minroll20→40% perstageordinal0..129/bronze85→15/gold1→35/Mini2+/MVP6+ ใช้storedloot_rng/drop_carry_ms ไม่kill/FPS/speed cardIDclaim_card_index fixedpending/level1. Legacyprofileไม่มีcardต้องreserveoldก่อน farm.claiminstallnewforfuture migrationห้ามเติมcard_dropsรวมกรณีrefresholdcontentversion. CorrectedslotdetachcardassignmentเฉพาะผิดคืนinventoryexactID/level/quality/lock
- Architecturechecksจับmodes→rewardsตอนแรก แยกprofilebuilderdomain/modes/farm-card-profile, sourceoriginscontent/card-catalog, weighted/dropactualrewards ไม่แก้modulegraphให้ผ่าน
- 074OptionLinesul/statli label/valueสีม่วง negativeแดง มีbag/slot/picker+ratioformatcorrect. Weaponpicker exactfamilybyjobcompatibility (อย่าfilterแค่reasonเพราะlevelmask) correctfamilyhighlevelยังwarn; bagallไม่filter. DiffSPcostlowerดีสีเขียว
- 073CardSheetsharedbag/farm/gachaแสดงnativeportrait/name/gradeแยกquality/slot/procs/nextLV Pendingunpaidcardreadonlyactions Farmshowrate/quality/eligiblegrades/actualreceived+tapdetails Storeจริงมีname/slot/grade/tapdetailsไม่เพิ่มAPI
- Finalbuild/type/boundaries/secrets/contentcheck/M0ผ่าน content **4e44083962ef36aa61ab5e80cd86e1e3ed088ebb0d136744cb8ca2160655ca57**. Unitregressions84+focused14(overlap)+spatial6+format1/Python35ผ่าน ไม่มีbalance/calibrationrunner. See task073review
- ActualfreshAuth/Postgres/PostgREST/mobileChrome **5groupspassed finalsource** viaRO_LOCAL_TEST_FOCUS=cards/RO_EVIDENCE_PREFIX=task073:12h actualfarmcards claim+receipt replay, Knight/WizardfamilyincludingLv60locked/equip/reload, portraits/grade/320-390/noinspectionAPI, actualAFKearnedcardassign/reload, actualgachareveal/details. Options1–5lineและAdditionalStats41ผ่าน ภาพเปิดดูแล้วgachaanimationcomplete. JSONtask073-074-ui-live +local-stack authoritative
- คงfailedrounds: firstPython27capassert/authorwrongbucket/M0ref paths; buildround1importboundary/round2storeimport-testtypes/round3fixturetuple/round4unusedtype. **Chrome round1harnessผิด includes(_card_)นับqa fixtures3เป็นearned** เจอจากภาพ53vsreport56 แก้regex^farm_.+_card_[0-9]+$+level1และrerunactualearnedassignผ่าน คงround1reviewacceptedfalse รอบ2/3validแต่ถูกsupersedeด้วยfinal5checks/animation/AdditionalStats ไม่อ้างownerprogress
- Board**60/74done/inprogress4(041/058/064/067)/review5(oldvisual)/todo5** M4done20/29 Tasks073/074อยู่doneทุกACผ่าน cases/matrix/reviewreportsupdated. Sourcecommit/ghproof/hostedข้างบน อย่าปิดownerpending4เดิม. ไม่มีproductworkค้างในคำขอคืนนี้ docscloseตามหลังsource

- Ownerสามารถreload/สำรองอัปเดตเซฟผ่านของเดิม ไม่SQL/envใหม่ แล้วcollectoldAFKครั้งแรกก่อนnewcardsเริ่ม ไม่อ้างownerทำแล้ว sourceproject.gitignoreกันprivateแล้ว gitpushauthorizedต่อเนื่องไม่ถามใหม่

## 22 ต.ค. 2026 · Codex — TASK-072 เพลงฮีลทันที+HoTแรงขึ้น ขึ้นVercelแล้ว; งานการ์ด/อุปกรณ์ต่อ

- ผู้ใช้รายงานMonkP.ATKยังHeal250แต่BardP.ATKเพลง25/sไม่ทันตบตาย ตรวจdataพบHeal120–220%MATKทีเดียว/SP18 เพลงเดิม10–20%P.ATK/5ticks/SP38และdelay1sหลังresolve เปลี่ยนฐานอย่างเดียวไม่พอ จึงแก้ทั้งopeningและอัตรา ไม่มีคำถามใหม่จำเป็น ห้ามrenewedbalance simulationยังมีผล
- D-098/TASK-072 เพิ่มopening_healชนิดheal/physical_power/friendsที่castresolve60–100%P.ATKแล้วapply_statusเดิมให้30–50%P.ATK/s5ticksใน6s รวม210–350%ต่อคนก่อนโบนัส เพลงBard/Dancerเท่ากันทุกระดับ คงSP38/CT800/ACD1200/bonuses/stack/snapshot/no tickonapply/วงเดิม ไม่มีdomainformula/schema/SQL/env/newassets/ownerwrite/6173restart
- Focused6testsผ่าน รวม20resolvedlevels/6goldens/physicalvsMATK/armor-crit-ignore/bonuses/independentstacks/expiry/dispel/deaths/5ticks และopeningatresolveทั้งทีม/overheal/interruptไม่heal-SPไม่คืน UIsummaryopeningP.ATKและHoTแยก คง071evidenceเป็นhistoryไม่overwrite
- static18rows task072power-reviewอ่านdataเทียบeaa8: equalbase/nohealbonus/allwounded/perpulsefloor ไม่เรียกengine/runner พบopening50→45%ของHealและsingle-targethealต่อSP75–83%ของHeal เพลงคุ้มจากหลายคนเจ็บ ต้องรอ5sถึงยอดเต็ม ไม่อ้างรู้ownerstatsหรือwholebalance
- M0/readiness8/build/type/boundaries/assets/secretsผ่าน content **3a297403b070dfbe36027224ce3fc9229df14a12496bcd2f99ac3bb601859230** packf57a0773…/27,200,551Bเดิม
- ActualisolatedAuth/Postgres/Chrome4กลุ่มผ่านแล้ว session59689exit0 RO_EVIDENCE_PREFIX=task-072/FOCUS=healing มีtest-onlyprototype.acceptเก็บactualsongcastresolve/healsเพื่อตรวจopening4ที่เวลาresolveและ5ticks×4หลังจากนั้น Product/codegenfrozenขณะliveและจบแล้ว เพลงทั้งคู่opening4events3476ms/5ticks×4ที่4476–8476 วงexpiry/motion/320px/noextra saveผ่าน source7167980af6fa6391f3d3824f9d7a902ee0f3296fขึ้นVercelsuccessแล้ว actualpublichosted3ผ่าน ปิด072done/board58of72/inprogress4แล้ว
- Hostedround1harnessผิดเรื่องlocalhashfilenameต่างproductionenv แก้อ่านhostedmanifestแล้วcheckopening_heal/opening_power/physical_regenerationในactualbundle/healthhashใหม่ รันdeploymentเดิมผ่าน ไม่แก้product/เกณฑ์ เก็บfailureแยก
- ผู้ใช้เพิ่มงานหลังแก้สกิลคืนนี้: เปลี่ยนการ์ดให้เป็นROmonster/Mini/MVPจริง+farmdrop/ด่านหลังการ์ดดีขึ้น, optionsเป็นบรรทัดมีสี, weaponpickerเฉพาะที่อาชีพใส่ได้ รับทำต่อแล้ว ยังไม่เริ่มproduct073 ห้ามลืมหรือปิดturnหลัง072อย่างเดียว ได้browseROofficialPoring4001และrAthenaactualpre-reitem/mobDBแล้ว tempYAMLอยู่/private/tmp/ro-card-reference (PyYAMLมี) Carddefsปัจจุบัน60มี18fake+42ROชื่อแต่ช่อง/เอฟเฟคผิด และไม่มีMiniชัด Nativecardicon/collectionเป็นgenericshared1097IDs ไม่มีcardbmpในการimporter ต้องหาartจริง แหล่งhttps://assets.latam-tools.com.br/illust/card/4001.pngจากadsonpleal/ragassets repoREADMEน่าลอง; divine-prideimagescollection/illustration4001HTTPerror 072ไม่ต้องcodegen/buildซ้ำจากdocs/harnesschanges
- ให้ownerจบไฟต์/reload→สำรองแล้วอัปเดตเซฟหลังdeploy ไม่มีSQL/envใหม่ 067Essencerefund/064cloudtiming/058transferยังค้าง ห้ามแตะprivate/env/ownerdata/6173

## 22 ต.ค. 2026 · Codex — TASK-070 Timelineย้อนหลัง และ TASK-071 เพลง P.ATK/วงฮีล ขึ้น Vercel แล้ว

- ผู้ใช้ขอTimelineย้อนหลังหลังจบ, ยืนยันHealingSongBard/Dancerต้องP.ATK และขอวงฮีลค้างขณะHoT งานทั้งสองทำครบ ห้ามbalance simulationใหม่ตามคำขอก่อนหน้า ไม่มีbalance/calibrationrunnerรัน
- 070source **4c91cf2ce4ace5e2564c7ceb13873863c7e865df** Vercelsuccess/publichosted3ผ่าน task070hosted ปิดdoneแล้ว Historyใช้caststart/resolve/interrupt/SP-sphereskipจากSavedBattleSession.advanceเดิม เก็บRAMจนกลับfarm/ไฟต์ใหม่/reload ไม่มีforecastหรือsaveเพิ่ม confirm/sameclockไม่duplicate ใช้sequence/action_id/actualslot; historicalrowsไม่เดาACDที่eventไม่มี และไม่ปลอมpendingterminalเป็นinterrupt
- BattleHistoryมีtouchscrollfulltimeline/zoom/start-end/range/stickylabels/3decimaldetails และLogเรียงจริง/filteractor ผลStory/Tower/Dailyชนะ/แพ้/หมดเวลาเปิดได้/ปิดกลับresult/statisticsเดิม Sheetเพิ่มaria-labelledby/useIdเพื่อaccessible nameจริง ไม่ผ่อนเกณฑ์
- 070targeted3+actualfreshAuth/PostgREST/Postgres/mobileChrome4กลุ่มผ่าน Daily60s4x/150logs/2.772–59.9s/swipemax2124/zoom/filter/320–390px +Towerwin/Storywin/Storydefeat ไม่เพิ่มcommands/revision/quota ภาพดูแล้ว เก็บfailurefixtureundefined/party1และSheetชื่อdialogเดิมไว้ ไม่อ้างทดสอบบนเครื่องAndroidจริง
- 071source **eaa8c0a0dedcad509f9503ad744ef4b16c707432** pushmain/Vercelsuccessและactualpublichosted3ผ่าน task071hosted/ghdeployment ปิดAC04/doneแล้ว Board **57/71done**, inprogress041/058/064/067รวม4, review5/todo5 M4done17of26
- 071reusephysical_powerในeffectheal (ขยายwhitelistเฉพาะheal ไม่เพิ่มschema/formula), เพิ่มphysical_regenerationcloneของregenerationแต่tickformulaเป็นphysical_power เปลี่ยนเฉพาะBard/DancerHealingSong statusid คง10–20%/5ticksใน6s/SP38/CT800/ACD1200/stack/source snapshot/bonusesเดิม SanctuaryยังMATK Update6goldens/oracle/M0reports/manifestแล้ว ไม่อ้างwholegamebalance
- Aura: ActorRenderView.healing_aura optionalboolจากactiveperiodichealจริง/recipientalive ไม่hardcodeชื่อskill/status วาดauthoredproceduralวง+อนุภาคใต้เท้าจริง/gamepresentationclock/reducedmotionstatic ไม่มีnewmedia/nativeSTRclaim/extraheal/DBwrite หลายHoTวงเดียวแต่instanceครบ Clearauraตอนfarmwalk reset UIskill/statusบอกP.ATK/MATKจากperiodicformula
- 071focused8checksผ่าน (5HoT+history3): alllevels/6goldens/5ticks/physicalvsMATK/armor-crit-damagebonusไม่เกี่ยว/MusicLesson/receivedbonus/stack/expiry/dispel/recipient-casterdeaths/summary/geometry ActualfreshAuth/PostgREST/Postgres/mobileChrome4กลุ่มผ่าน 3HoTต่อผู้รับ/4วง/761framesตรงprojection,10049msทุกคนอยู่/วงหายหมด,motiondisabled,320px/noadvance-finishwrites ภาพactive/expiredดูแล้ว รันsession83382จบexit0/freezeproduct/codegenระหว่างlive
- Buildround1–2testfixture readonlymodifiersผิด แก้clonemutableinput ไม่เปลี่ยนproduct/เกณฑ์ Finaltargeted/buildผ่าน Hostedround1หาrendererในpackchunkผิด Viteจริงอยู่sharedskill-timelinechunk ยืนยันcompiledfilesแล้วแก้harnessselector ตรวจdeploymentเดิมใหม่ผ่าน เก็บfailurelogsแยก ไม่มีproductแก้หลังeaa8
- M0/schema/content/build/type/boundaries/assets/secrets/readiness8ผ่าน Content071 **9473f672c88c569f98a7f44de7c7c6cc7a3deeaa1c427526614cb5d181cb9fdf**; 070ก่อนหน้าใช้6fbb9995… Runtimepackยัง **f57a0773675ff37a1f16467f2606546404286a4ffb42da90766b7cab93970dae**/27,200,551B NoSQL/env/newmedia ไม่แตะ6173/5173/private/env/ownercloudwrite
- ให้ownerจบไฟต์ก่อนreload→กด **สำรองแล้วอัปเดตเซฟ** ตามexistingmigrationสำหรับ071 ไม่อ้างว่าownerทำแล้ว 070ไม่มีcontentchangeเอง ประวัติ070ไม่เก็บข้ามreload
- งาน067ownerEssencerefund/064instrumentedcloudtiming/058savetransferยังไม่ปิด อย่าเอาpublicsmokeแทนownerproof และอย่าrestart6173/อ่านprivate/env/รันbalance simulationระหว่างรอfeedback

## 21 ต.ค. 2026 · Codex — TASK-069 พลังท่าใช้บอลและไอคอนเล็ก ขึ้นVercelแล้ว

- ผู้ใช้เพิ่มโจทย์Callเสียช่องต้องคุ้ม finisher ขอเพิ่มตัวคูณอย่างไม่OP/under ยังห้ามsimulateใหม่ และหลังเห็น068ขอiconเล็ก/no farm/แยกbossstatusจากpanelยืดหด/บอลใช้CallSpiriticon
- D-093/094: assistant trial coefficients Triple×1.25, Finger×2.25, Asuraทั้งATK-SP×2.25จาก862เดิม ฝังในlevel_parameters ไม่สร้างglobalbuffmultiplierซ้ำ คงSP/บอล/CT/ACD/hits/crit/armor/held1%หลังจ่าย หน้าสกิลเพิ่มhitcountจากdefinition
- NativeCallSpiriticonใช้ร่วมcounter/party/details, visible18px; renderer.showStatuses=falseเฉพาะfarm/ลบfarmstatusbuttonและstateupdate; boss-hudแยกmainbar/status/cast mainbarไม่ยืดหด ไม่เปลี่ยนengineจากการซ่อนภาพ
- focused19testsผ่าน+static review3skills/9goldens/12closed-form timing rows, ไม่เรียกbalance runner; approximate2actionsไม่ใช่งบactor/rotationจริงและAsuraSPsnapshotไม่สมมติSPเต็มทุกรอบ ไม่อ้างbalancedจากunit/schema ผลเดิม041ใช้ยืนยันcoeffใหม่ไม่ได้
- actualfreshAuth/PostgREST/Postgres/Chrome4กลุ่มผ่าน:18×18px/nativeCallSpirit, bossbar109pxตลอด211samplesมีcastทั้งfalse/true/status0–3, 320/390pxnooverlap/overflow, farmclean; ภาพbattle/farmดูแล้ว หลักฐานtask069status-live/local-stack/power-review ไม่มีownerlogin/writeหรือrestart6173
- Failuresเก็บround1: docsPythonsyntax/gateขาด4cases, unittestsignature/type narrowingผิด, unitUIfixtureลบlearnedstarterแต่slotยังใช้→เก็บstarterแล้วผ่าน แก้fixture/registrationไม่ผ่อนเกณฑ์ ไม่เปลี่ยนเกมเพื่อให้ผ่าน
- M0/build/type/boundaries/assets/secretsผ่าน content **6fbb9995048d6211bf56250dbc54a1215e0626ef6812a73e851f111cc489c6e2** packf57a0773…เดิม ไม่มีnewSQL/env/assets Ownerจบไฟต์ก่อนreload→สำรองแล้วอัปเดตเซฟ ไม่migrateแทน/ไม่patch6173
- Source **e239e61aa8668be133314a900bbff9ad307f0e41** pushmain/Vercelsuccessแล้ว actualpublichosted3กลุ่มผ่านtask-069-hosted.json: healthcontent6fbb/regionSG/401, compactbossstatus/nativeicon/no-farmbundle, login/PWA ไม่มีownerwrite ปิดAC03/move069done/cases/matrix/overviewแล้ว Board55/69done, inprogress041/058/064/067รวม4, review5/todo5
- ขั้นต่อไปให้ผู้ใช้จบไฟต์/reloadและกดสำรองแล้วอัปเดตเซฟเอง ไม่มีSQL/envเพิ่ม ไม่อ้างว่าownerได้migrateแล้ว 067refund/064cloudtiming/058transferยังไม่ปิด อย่ารันbalance simulationหรือrestart6173จากการรอfeedback

## 21 ต.ค. 2026 · Codex — TASK-068 Spirit Spheres และ Buff/Debuff UI

- ผู้ใช้ขอบอลหมุนCallSpirits/แสดงจำนวนบอลและBuff/Debufficons และยืนยันATK+1%ต่อบอลเฉพาะที่ยังเหลือหลังจ่าย ห้ามรันbalance simulationใหม่ ไม่ได้ยกเลิกงานเก่า
- เพิ่มdata per_unit_modifiersในstat-definitions/resources, sharedheldResourceModifiersร่วมbucketderivedATK%, recomputeเมื่อลูกบอลเพิ่ม/ลดก่อนoffense snapshot และclearบอลก่อนrevive re-stat ไม่มีhiddenbuffcap/เปลี่ยนASPD/stackpolicy
- เพิ่มActorRenderView statuses/source/expiry/count/resourcefields, clientreadonly projectioncacheต่อimmutablecheckpoint, groupby skill+polarity/countmaxperstatusไม่เอาATK+MATKของBlessingนับ2; preservesallinstances/expiry/sourceและshieldremaining NativeROskilliconsในbattlecanvas/party/focus/bossstrip, แตะดูรายละเอียดในSheet; farmปุ่มรูปโล่ดูทีม4คน ไม่คืน4วงกลมhomeเดิม Orbitsproceduralpixelglowหน้า/หลังตัวละครตามresourceจริง/timeเกม
- Focused14checksผ่าน [unit](evidence/task-068-targeted.txt) + realfreshAuth/PostgREST/PostgreSQL/mobileChrome4กลุ่ม [UI](evidence/task-068-status-live.json): Call5/+5%, Finger0/+0%, SteelBodybuff+debuff, bossdebuff, Blessing2sources/4effects/source/expiry, 320pxไม่ล้น/overlap, farm4actors/noadvancewrites ภาพbattle-statuses/status-detailsอยู่task068 ไม่มีbalance/calibration/simulationrunnerรัน
- Failedunitroundก่อนแก้fixtureใช้actorindexผิด/ปัดATKก่อนbaselinefloat/อ่านKyrieก่อนCT แก้fixtureไม่เปลี่ยนroundingกติกา Browserround1learnstarterBlessingซ้ำ→ข้ามที่เรียนแล้ว เก็บfailureในtask068-browser-round1และunit-round2 Finalunit/browserผ่านด้วยproductเดิม Source/codegenfrozenระหว่างliveรอบสุดท้าย (session58656exit0)
- M0data checks/build/type/boundaries/secretsผ่าน content **f34a37a2aab92f2a9de8ad92b120ed3cb9e4be3749c70ac924e083130537600d** /packf57a0773…เดิม การเปลี่ยนATKเป็นgameplayต้องใช้existingbacked-upsave.migrate ไม่แก้signature/hashเซฟเดิมเอง ไม่มีnewSQL/env/assets ไม่แตะ6173/5173/private/env/ownercloudwrite
- source862ec57d85a9758dabb0ab239eab6ab35ea37f66 pushmainและVercelsuccessแล้ว actualpublichosted3กลุ่มผ่านtask-068-hosted.json ปิด068AC03/doneและmatrix/cases/overview ผู้ใช้ต้องจบไฟต์ก่อนrefreshและกดสำรองแล้วอัปเดตเซฟ ไม่ต้องSQLเพิ่ม ภาพstatusdetailsจับตอนtransitionเริ่มจึงโปร่งมากกว่าตอนSheetนิ่ง ไม่ใช่themeเปลี่ยน
- ผู้ใช้เพิ่มโจทย์Callเสียหนึ่งช่องต้องคุ้ม finisher ขอเพิ่มdamageท่าใช้บอลและย้ำไม่OP/under งาน069ถัดไป ไม่รันbalance simulationใหม่ ค่าทดลองassistant +25%rawpowerต่อบอลที่ท่านั้นจ่าย ฝังในcoefficientsแทนสร้างglobalmultiplierbuff ทดสอบกติกา/migrationและmanualcostarithmetic ไม่อ้างbalancedจากschema/unit
- 067ยังรอownerยืนยันrefund; 064ยังรอinstrumentedcloudtiming; 058transferยังไม่confirmed อย่าอ้างว่าปิดงานเหล่านั้น Board54/68doneหลัง068ปิด

## 21 ต.ค. 2026 · Codex — TASK-066 ขึ้น Vercel และปิดงานแล้ว

- ผู้ใช้ตอบสถานะ deployment ของ `120647c47` ว่า **Ready** ตรวจใหม่ได้ GitHub Vercel `success / Deployment has completed` และ actual hosted smoke3กลุ่มผ่าน [หลักฐาน](evidence/task-066-hosted.json) publicbundleมีVirtualGrid/bag-window/data-window-startจริง, APIhealth200/content768e12a4…เดิม/regionSG/anonymouscheckpoint401, login/PWA/cacheถูกต้อง ไม่มีownerloginหรือownerwrite
- ย้าย [TASK-066](done/tasks_066.md) ไปdone, ACครบ3ข้อและreviewpassedจริง อัปเดตcases/matrix/overview กระดาน **53/67done**, inprogress041/058/064/067รวม4, review5/todo5 ไม่ต้องbuildซ้ำเพราะรอบนี้แก้เฉพาะdocs/evidence ไม่มีproductsource/SQL/env/migrationเพิ่ม
- ชุดเมนูที่ขึ้นเว็บเป็นsource120647c47ตรงกับที่วัดactualtouch/CPU4x/Class2/500itemsไว้: Backpackmedian449→120ms, overall79→46ms/p95449→121ms ไม่อ้างว่าเป็นมือถือจริงของowner
- ผู้ใช้ยังไม่ได้ยืนยันกดปุ่มคืนสิทธิ์Essence งาน067AC03ยังค้าง รักษาสถานะเดิม ไม่อ้างคืนquotaแล้ว ไม่แตะ6173/5173/private/env/ownerdata งาน064ยังรอauthenticatedcloudtiming ไม่ใช่รอinstallSQL007
- ขั้นถัดไป: แจ้งผู้ใช้จบไฟต์ก่อนrefreshเพื่อรับbundleใหม่บนAndroid Chrome/PWA ไม่ต้องล้างข้อมูลแอป/ติดตั้งใหม่ การรีโหลดไฟต์ที่ยังไม่จบจะretreatตามกติกาเดิม ถ้ายืนยันEssencequotaคืนแล้วจึงปิด067ได้ หลักฐานงานก่อนหน้าคงอยู่ด้านล่าง

## 21 ต.ค. 2026 · Codex — TASK-065/066/067 Auth, navigation และดันค้าง

- ผู้ใช้ยืนยันSQL007ติดตั้งแล้วและเร็วขึ้นประมาณครึ่งหนึ่ง จากนั้นรายงานเมนูหน่วง0.5–1s, ดันแก่นพลังจบค้าง/refreshเสียสิทธิ์ และย้ำ1×/2×/4×ต้องคำนวณ/ขัดร่ายเหมือนกัน ผู้ใช้ตอบอุปกรณ์ **Android Chrome/PWA**; navigationยังเป็นงานต่อเนื่อง ไม่แทนด้วยแค่ตอบspeed
- **fe7ea02f0b4c05d8002f44da07f9aacd8f42126f ขึ้น Vercelสำเร็จ** และactualsigned-out hosted3กลุ่มผ่าน [task067hosted](evidence/task-067-hosted.json): health/contentเดิม/APIregionSG/login/PWA/inline-saveprotocol/refundUIตรง ไม่มีownerlogin/ownerwrite **TASK065doneแล้ว** หลังpublicproof; TASK064ยังรอinstrumentedcloud2RPCproof ไม่ใช่รอinstallSQL
- Authใช้SDKgetClaimsกับcachedprojectJWKSแทนgetUserทุกrequest; actualpublicJWKSของproject200/ES256 SDKtestephemeralES256 signer cold1HTTP→8warmchecks0HTTP ยังตรวจsignature/expiry/role/aud/UID/issuer LegacyHS256ใช้SDKgetUserfallback; skipexactissuerเฉพาะSDKverifiedHSเพราะlocalselfhostissuerต่างกัน ไม่มีcacheAuthdecision/ownerstate เปลี่ยนban/globalrevocationsemanticsเป็นรอJWTexpiry ไม่มีkey/sessionrotation
- FailedAuthround1–2: strictissuerทำselfhostHS401 จึงตรวจbooleansไม่พิมพ์tokenแล้วใช้SDKverifiedfallback Round3–4: malformedUTF8throwsplainErrorทำ503 จึงแยกSyntaxError/InvalidUTF8sequenceเป็น401 FinalactualAuth/PostgREST/SDK/API5กลุ่มผ่าน รายงาน41targetedchecksรวมอยู่task067
- **Dailyrootcause** BossFieldcaplogicalที่time_limitแต่advancegate>=50ms เศษ1–49msจึงไม่ถึงterminal/finish แก้client `shouldAdvanceBattleFrame` flushเมื่อถึงdeadline ไม่เปลี่ยนengine/formulas Unitทุก1–49ms×60/90sผ่าน ActualChrome/SQLเล่นEssence60000msที่4×จบจริง/finish1/0advance/0retreat/reloadquotaเดิม
- **Exact speed parity** 3heavy×4CCtypes×1/2/4 (Stun/Freeze/Silence/interrupt) comparefull eventtrace+serializedcheckpoint และspatialdailycompareevents/RNG/phase/metricsตรง ใช้seedเดียวกัน/forceCCchance1เพื่อตรวจrule ไม่มีspeed-dependentASPD/CCchance
- **ยังไม่ได้คืนownerquota** แจ้งผู้ใช้แล้วให้จบไฟต์/reload→ตั้งค่า→คืนสิทธิ์แก่นพลังรอบที่ค้าง ปุ่มเฉพาะ21OctและEssenceattempt>0 ส่งexistingbackup.restore_request marker daily-clock:essence:2026-10-21 serverตรวจprior>=15s dailyretreatก่อน2026-10-21T14:07:06Z/once-only receipt คืนcounter1พร้อมsignedbackup/CAS ไม่แตะstateอื่น/noSQLใหม่ FreshUUIDretryrejectedreceipt200ไม่เพิ่มquota/revision ActualfixtureChrome/SQL4กลุ่มผ่าน TASK067AC03ยังรอownerกด/ยืนยัน ไม่ปิดจากfixture ไม่มีownerAuth/adminDBในsession
- **TASK066 implementationผ่านและpushแล้วที่120647c47b79b4e299bd2f491ef727ae3bb1e2e6 แต่ยังไม่hostedproof**: baselineactualtouch/CPU4x/Class2/500items/27samples Backpack399–499ms/0API profilerพบeagerDOM+scrollToforcedlayout แก้VirtualGrid mount96cells/scrollrowoverscanจากviewport, fullfilteredlistยังใช้bulkselectionและlivevalues ไม่cacheownerstate; keyedmainตามview/characterแทนscrollToeffect จึงscroll0และclearpage-localdraftตามroute
- Matchedafter27samples overallmedian79→46ms/p95449→121ms, Backpackmedian449→120ms, Stats90→46ms, Skills158.5→99.5ms ทุกnavigate0API [comparison](evidence/task-066-navigation-comparison.json) เป็นdevelopmentbundle/CPU4x/mobileemulation **ไม่ใช่ownerphonebenchmark** ActualChrome Auth/PostgREST/SQL: lastitem/scroll/filter/320pxresize/bulk457ชิ้นรวมoffscreen, savedlock/statusINT/skillupgrade/equip/reloadค่าตรง ผ่าน [after](evidence/task-066-navigation-touch-full-after.json) Round1selectorชื่อสกิลในharnessไม่ตรงaccessiblelabel เก็บfailureแยก เปลี่ยนselectorเท่านั้นไม่ผ่อนexpected ก่อนrunใหม่ผ่าน
- Build/env/assets/content/boundaries/type/secretsผ่าน content **768e12a49bf339711d44f501c3710374adbcd10d9eb74d6a2e6f9b8aa79330af** /pack **f57a0773675ff37a1f16467f2606546404286a4ffb42da90766b7cab93970dae** เดิม ไม่มีnewSQL/env/migration ไม่แตะ6173/5173 ไม่อ่านprivate/login/env/ownerstate Freezeproduct/codegenขณะlivebrowser; sessions93388round1exit1,7664finalexit0,89431buildexit0
- ขั้นถัดไป: source120647c47pushแล้วแต่ผ่านประมาณ10นาทียังGitHubstatuspending/statuses[]/checks[]/deployments[]และpublicshell-CtMq5SHQ.jsไม่มีbag-window (ตรวจno-cache+nonceแล้ว) ไม่มีVercelCLI/connectedmanagementsession ไม่เดาว่าbuildfailed ถามuserasyncหน้าDeploymentsของcommit120647c47สถานะอะไรอยู่ระหว่างรอคำตอบ อย่าปิดTASK066AC03หรืออ้างขึ้นเว็บแล้ว ต้องตรวจVercelstatus→RO_EVIDENCE_PREFIX=task-066 RO_DEPLOY_COMMIT=<source> node scripts/test_save_latency_hosted.cjs (เพิ่มbag-window/data-window-start markerแล้ว)→ถ้าผ่านปิดTASK066/อัปเดตboardและreadiness ห้ามบอกownerquotaคืนแล้วจนผู้ใช้กด/ยืนยัน ตอนนี้board52/67doneหลัง065

## 21 ต.ค. 2026 · Codex — TASK-064 แสดงอัปเกรดก่อนเซิร์ฟเวอร์ตอบ + optional2DBRPC

- ผู้ใช้ยังรอ2sหลังTASK063และย้ำว่าเกมส่วนตัวไม่ต้องเน้นทดสอบกันโกง จึงทำD-088: ใช้sharedpure progression reducersแสดงผลlevel/status/skills/equip/cards/enchant/tier/teamทันทีใน `SaveSnapshot.preview` ไม่เขียนpreviewลงconfirmedcheckpoint/backup ไม่เดากาชา/Refine/Fusion/boss; clearเมื่อsuccess/failure/offline/reconnect ยังเป็นsingle-flight **ปุ่มถัดไปยังdisabledจนsaveconfirm** อย่าอ้างว่ากดรัวได้หรือserver2sหายแล้ว
- `save-preview.ts`คำนวณบนcloneจากreducersเดิม BrowserPorts optionalpreview/Controller persistpendingUUIDก่อนnetworkแล้วpublishpreview; shellใช้previewเป็นdisplayและคืนfalse+toastถ้าสุดท้ายไม่ready แก้oldsuccessข้อความที่เคยผ่านแม้transportfailed ไม่มีdomain/content/schema/rules/packเปลี่ยน Content768e12a4…เดิม ไม่ต้องmigrateเซฟ
- DBpathเดิม5HTTP(+Auth1): assert_env→receiptGET→loadcontext→commit→loadcontextอีกครั้ง เพิ่มSQL007สองservice-onlysecurity-invokerwrappersอ่านreceipt/contextภายใต้ownerlock และcommitผ่านRPCเดิม+คืนDBcontextในtransactionเดียวกัน เหลือ2DBRPC(+Auth1) กฎ/สูตรยังNode ไม่cacheowner/Authdecision MissingfunctionPGRST202เฉพาะชื่อนั้นfallbacklegacyพร้อมnegativecache10s; network/constraintไม่fallbackwriteซ้ำ ไม่ต้องเพิ่มenv
- Request-localAsyncLocalStoragetimingในpersistence/timing.tsเพิ่มdb_read/db_commit/db_context/db_environment/db_receipt/rules_init/verify_state/calculate/verify_reply ลงServer-Timing ไม่มีUID/token/payload Scopeordinarycommands: creation/maintenance/recoveryยังoldpath ไม่ใช้public401ยืนยันownerlatency
- **Source65541f2ab pushและVercelsuccessแล้ว** (a39dd05f7+SQLfollowup) actualhosted3กลุ่มผ่าน(health200/contentเดิม/regionSG/newpreviewbundle/login/PWA ไม่มีmutation); docs/DEPLOYMENT.mdมีไฟล์SQL007ให้userรัน ไม่มีDBadminconnectionในsession **ยังไม่ได้ติดตั้งcloudSQL007/ไม่มีownercloudwrite** UIpreviewทำงานได้ก่อนSQL ใช้fallbackoldserverDBpath
- ตรวจ20targeted TS checks + freshAuth/PostgREST/Postgres/Chrome6กลุ่มผ่าน: actualordinarymutations2DBRPC; response loss/receipt-reconcile/legacyfallback; actualmobilegameUIกดLv10→11ก่อนปล่อยheldrequest CPU4x **400msรวมPlaywrightclick overhead** ปล่อยแล้วDB11/reloadยัง11 ภาพtask-064-level-immediate.png ไม่ใช่ownerphonebenchmark Build/type/boundaries/secrets/readiness8ผ่าน ไม่ทดสอบซ้ำทั้งระบบหรือเพิ่มanti-cheatใหม่
- Failurehistory: initialbuildtiming.tsอยู่src/serverrootซึ่งไม่มีmoduleowner ย้ายเข้าพาธpersistenceแล้วbuildผ่าน Round1historical3HTTPbenchmarkstrictassertfailedโดยไม่มีpairedsamples เพิ่มloggingเฉพาะharness/รันunchangedproductใหม่แล้วผ่านstrictassertเดิม เก็บround1evidenceแยก ไม่อ้างrootcause Codebuildlogtrailingwhitespaceแก้ในSQLfollowupcommitแล้ว
- **ห้ามแตะ6173/5173หรืออ่านprivate login/save** งานนี้ไม่restart ไม่ownerwrite SQL007เพิ่มmigrationทำให้frozenpreviewcompatiblecheckต่าง จึงอย่าrefreshโดยพลการ
- ขั้นต่อไป: publicsmokeผ่านแล้วที่task-064-hosted.json (harnessรองรับprefixไม่ทับ063); ให้userจบไฟต์แล้วreloadรับbundleใหม่ และรันSQL007ในSupabaseSQL Editorเองเพราะsessionไม่มีDBadminconnection; หลังติดตั้งรอ≤10sให้negativecacheหมด ต้องดูauthenticatedcommandServer-Timingdb_read1/db_commit1จึงปิดAC04/doneได้ TASK064ยังinprogress/51of64doneจนmanualcloudproof ไม่ใช้health/Authgateแทน

## 21 ต.ค. 2026 · Codex — TASK-063 ลดเวลารอบันทึกทุก mutation ขึ้น Vercel แล้ว

- ผู้ใช้มือถือผ่านVercel/DBSingaporeรู้สึกทุกการบันทึกรอ1–2s (ย้ำไม่ใช่เฉพาะlevel) ตรวจpublicheadersยืนยันAPI **sin1::sin1** จริง พบsharedSaveControllerส่งPOST→GETreceiptซ้ำ→GETcheckpointทุกครั้ง (รวมAuth/DBroundtrips) ไม่ได้สรุปว่าregionผิด
- **Sourcee39c7d071 pushmain/Vercelsuccessแล้ว** (ต่อจากcb98c2bbe) [hosted3กลุ่ม](evidence/task-063-hosted.json): actualAPIhealth200/content768e12a4…เดิม, anonymouscheckpoint401, Server-Timingและx-ro-api-regionsin1, bundleมีsendWithCheckpoint/x-ro-checkpoint, login/PWAcache5publicfilesถูกต้อง ไม่มีownerlogin/command/เซฟwrite
- Browserใช้optional`sendWithCheckpoint`ส่ง`x-ro-checkpoint: include`; sharedAPIหลังcommitเรียกcheckpointDB/verifyเดิมแล้วคืนreceipt+checkpointในPOSTเดียวทุกmutation (รวมcreate/maintenance/battle) Browserใช้validatorเดียวกับGET(owner/schema/version/hash/history)และminimumrevisionก่อนpersist/ready ไม่มีreceipt-delta/optimisticwallet/เลื่อนsave ถ้าcheckpointreadล้มยังคืนreceiptให้fallbackGETcheckpointโดยไม่อ่านknownreceiptซ้ำ; outcomeไม่ทราบยังlookupUUIDก่อนretryตามเดิม คนละversionรองรับreceipt-onlyได้
- เพิ่มServer-Timingแยกauth/command/checkpoint/totalhandler และx-ro-api-region โดยไม่เผยUID/key; totalไม่รวมnetwork/coldmoduleinit Pinvercelregionssin1ตามuserและผลจริง ไม่เปลี่ยนAuthgetUser/RLS/CAS/signature/backup/refund/DBschemas/contenthash/pack **ไม่ต้องเพิ่มenv/SQL/migration** ห้ามรีสตาร์ต6173
- QA **37targetedTSผ่าน** (API/Auth/recurring/backup), **actualChrome8กลุ่ม** บนfreshAuth/PostgREST/PG: save_latency4กลุ่มทดสอบcreate/level/skillupgrade/loadout/equipment/teamPOSTเดียว, response-lossหลังcommitreconcileไม่POSTซ้ำ, legacyfallback2requests, corruptinlinehashปฏิเสธ; settlement4กลุ่มยืนยันstart/finish/speed/reward/offline/reloadเดิม ไม่มีmidfightwrite Build/env/assets/content/boundaries/type/secretsและreadiness8ผ่าน ดู [review](evidence/task-063-review.json)
- Controlledbenchmark3pairedpartycommands +120msdelay/request เท่ากัน: median **529→219ms**, requests3→1 เป็นfixtureprotocolbenchmarkไม่ใช่เครื่อง/เครือข่ายจริงของผู้ใช้ ไม่อ้างว่าทุกsaveบนมือถือจะเร็วตามตัวเลขนี้ ไม่มีownercloudcredentialหรือmutation ต้องให้ผู้ใช้จบไฟต์แล้วreload/PWAเปิดใหม่เพื่อรับbundleล่าสุด Newworkerไม่auto reloadตามD-086
- Failedround1–2เกิดharnessใช้Playwrightrequest.methodแทนmethod() faultinjectionไม่เข้า แก้harnessไม่เปลี่ยนproduct เก็บfailureแยก แก้fixturestarterFireBolt1ให้level10/skill2จึงอัปจริง ไม่ผ่อนexpected รันactualstackใหม่ผ่าน Source/codegenไม่เปลี่ยนระหว่างlive tests หลักฐานlocal-stackเป็นsettlement ส่วนsave-latency-stackเก็บแยก
- Board **51/63done**, TASK063done; 041/058inprogressและvisualreview5งานเดิม Task042fullmobileperf/043–046releasegatesยังค้าง การย้ายเซฟ058ยังต้องmetadataใหม่ ไม่ใช้SQLเก่าblind งานนี้ไม่อ่านlogin/env/private filesหรือแตะ6173

- Firstdeploypublictimingพบanonymouscheckpoint auth0.3msแต่total1150.1ms (eagerสร้างcreation+recurringrulesก่อนAuth) จึงแก้configuredServicesให้lazyหลังAuthและแชร์statelessAccountCommandRules(inheritsCreationRules)ชุดเดียวต่อinstance ไม่cacheownerstate/Authdecision Domain/contenthashเดิม รัน37TS+Chrome8กลุ่มใหม่ผ่านพร้อมbuild แล้วdeploye39c7d071: anonymouscheckpointtotal4.9ms/APIregionSGจริง [firstdeploy](evidence/task-063-hosted-firstdeploy.json) เทียบ [final](evidence/task-063-hosted.json) ตัวเลข401probeไม่ใช่ownercommandlatency

## 21 ต.ค. 2026 · Codex — TASK-062 PWA ขึ้น Vercel แล้ว

- ผู้ใช้ขอPWA (D-086) เพิ่มmanifest `/play`/scope`/`/standalone/portrait, SVGmark+PNG192/512/512maskable/Apple180, viewport-fit=coverและAuthsafearea ปุ่มติดตั้งอยู่login/settings ใช้beforeinstallpromptจากusergestureครั้งเดียวพร้อมfallbackguide/iOSSafari→แชร์→เพิ่มหน้าจอโฮม ซ่อนเมื่อstandalone ย่อSVGหัวlogin44pxที่เดิมขยายกินviewport
- Source **7999d465c** pushmainและGitHubVercelsuccessแล้ว ตรวจproduction `ro-idle-pve.vercel.app` จริง [hosted3กลุ่ม](evidence/task-062-hosted.json): 8staticartifacts/headersตรง, health200/ok/content768e12a4…เดิม, root→login/installUI, Chromeinstallabilityerrorsว่าง, workeractivated/cache5publicfiles, offline/reconnectกลับlogin ไม่มีownerloginหรือmutatingrequest
- Workerเก็บเฉพาะofflineHTML+4appPNGs **82,353B** ไม่cacheHTMLเกม/JS/content/ROpack/API/Auth/checkpoint/callback ไม่แตะstorage/save ไม่มีskipWaitingหรือcontrollerreload Newworkerwaitingจนclientเก่าปิดและcleanupเฉพาะownprefix Registerเฉพาะproduction+securecontext ไม่แตะ6173/dev/LANHTTP PWAhashแยกจากgamecontent ไม่ต้องเพิ่มenv/SQL/migration
- VitepublicDir=`pwa`; `scripts/game/pwa-artifacts.ts`ตรวจexact8files/PNGdimensions/manifest/≤128KiBและแทนworkerhashจากHTML/PWAbytes BuildoutputรวมallowlistและVercelheadersswno-store+scope/manifestno-cache ไม่มีassetsROเปลี่ยน Runtimepackยังf57a0773…27,200,551B
- QA: **build/env/runtimeassets/content/boundaries/typecheck/secretsผ่าน**, **Chrome6กลุ่มผ่าน**, readiness8checksผ่าน ดู [review](evidence/task-062-review.json) Browserproofใช้ephemeralHTTP+normalChromeprofileไม่ใช่6173 มีCDPmanifest, network/privatecacheisolation, offline+HTTP503passthrough, nativeeventfixture, waitingupdate/noautoreload/unrelatedcache+localStorageคงเดิม, iOSUA/standalone/320–390pxไม่ล้น ActualOSinstall/iPhonephysicalnotchยังไม่อ้างว่าทดสอบ เครื่องเจ้าของกดติดตั้งเอง [คู่มือ](../docs/PWA.md)
- เก็บfailureก่อนหน้า: round1incognitoถูกChromeห้ามinstall แก้ใช้normaltestprofile; round2failedguideพับซ่อนแก้openเมื่อfailed; round3ผ่านก่อนย่อauthiconและรันfinalซ้ำ Hostedharnessรอบแรกreq.url()ผิดWebRequest แก้เป็นpropertyแล้วผ่าน ไม่แก้productหลังdeploy ไม่เปลี่ยนเกณฑ์
- Board **50/62done** TASK062done; 041/058inprogressและvisualreview5งานเดิม ไม่รีสตาร์ต/แก้เซฟ6173 ไม่ownercloudwrite การย้ายเซฟเดิม058ยังต้องตรวจmetadataใหม่ก่อนcutover ห้ามใช้SQLเก่าblind

## 21 ต.ค. 2026 · Codex — TASK-060/061 เซฟเริ่ม/จบและเริ่มใหม่ล้างดัน ขึ้นVercelแล้ว

- **Deployแล้ว source5215676f8 / GitHubVercelsuccess** actualChromeบนro-idle-pve.vercel.appพบshell-BbjnMEu7.jsที่มีbattle.finish/ไม่มีbattle.advanceหรือnextAtscheduler และnewresetdailycopy; health200/ok/content768e12a4ตรง [hostedproof](evidence/task-060-061-hosted.json) ไม่มีownerlogin/savewrite ทดสอบจริงเฉพาะisolatedownerfixtures ยังคงบอกuserให้จบไฟต์→reload→กดสำรองแล้วอัปเดตเซฟ ไม่บอกว่าซ่อมcloudstateแล้ว


- ผู้ใช้ถามทำไมไม่เซฟเฉพาะจบ (D-084) ต่อจาก4s throttle จึงแทนperiodicwriterด้วยstartsnapshot+singlebattle.finish เมื่อterminal ไม่มีPOSTตอนเปลี่ยน1×/2×/4× ไม่มีpredictioncap5s ลบunusedscheduler/TS testเก่า Serverreplayinitialsnapshot/seed/buildด้วยsharedengine+modePolicyและsettlementเดิม ตรวจticket180s/DBelapsedขั้นต่ำterminalgame_ms÷4 ไม่ใช้lease15sกับfinish Legacyadvanceยังมีcap/leaseสำหรับdiagnosticเท่านั้น
- Manualdailyretreatส่งrequested_game_msเพื่อserverreplaypartialdamage/phase/chests boundedbyDBelapsed×4; hidden/offline/refreshreconcile/retreatไม่มีtimeclaimจึงไม่เดินบอสย้อนหลัง Newcommand/retreatoptionalparamอยู่closed schema+module/UIregistry38commands ไม่มีnewSQLmigration สูตรต่อสู้ไม่เปลี่ยน
- ระหว่างทำผู้ใช้ขอresetdailyเพราะresetแล้วLv1แต่ดันเก่า ยืนยัน6173ก่อนแล้วแก้ทันทีว่า **จะเล่นVercel ให้แก้Vercel** ก่อนมีDBwriteใด ๆ จึงไม่อ่านprivate6173/login/ไม่write/restart เปลี่ยนaccount.resetให้ล้างdaily_recordsหลังmergeโดยshop/objectiveและguardRestoreเดิม Migrationrepairเฉพาะdailyยังlockedแต่มีrecordsค้าง ล้างrecord/pendingdailyโดยไม่ล้างroster/เงิน/ของ/Story/Tower เกมที่unlockdailyแล้วไม่resetอัตโนมัติ
- QA: **45 targeted save/mode testsผ่าน**; actualisolatedAuth/PostgREST/Postgres/Chrome: TASK0604กลุ่มยืนยัน>15sยัง0midfightPOST/DBcheckpointgame0/revisionเดิม, speed1/2/4ไม่มีwrite, finish1ครั้ง/reward/reconnect/reloadผ่าน (`task-060-cadence-live.json` ชื่อartifactสืบจากharnessก่อนหน้า แต่assertionsเป็นterminal-only); TASK0613กลุ่มrealpreviewไม่write→signedbackupก่อนrepair→stateอื่นเดิม/typedRESETล้างดัน/รีโหลดคงผล (`task-061-reset-live.json`) ทั้งสองไม่ใช่ownercloudproof
- Integrationรอบแรกprobeuninitializedaccountไม่ใช่404โดยไม่มีstatusdiagnostic เก็บround1 เพิ่มstatus/codeเฉพาะเมื่อfailแล้วผ่านโดยไม่เปลี่ยนproductguard ไม่สรุปrootcause Fullnpmtestรอบแรกหยุดเฉพาะownprocesstreeหลังuserเพิ่มscope ใช้45targetedแทน ไม่อ้างfullsuiteผ่าน Testmigrationfixtureแรกchapter_snapshot1ผิดschemaขั้นต่ำ2 แก้fixture/เก็บfailure; TS6assertarrayว่างทำgetterถูกnarrowเป็นneverหลังrestore แก้ตรวจslice().length0ไม่ผ่อนexpectedและtypecheckผ่าน
- M0 numeric/schema/UI/architecturechecks+manifestรันใหม่ผ่าน และreadiness8checksผ่านหลังเติมacceptancecasesที่ขาดของ058AC06/059/060/061 ไม่เปลี่ยนเกณฑ์ให้ซ่อนerror ปัจจุบันcontenthash **768e12a4…** (จาก2c1ac034…) ต้องbackupmigrationเมื่อreload ไม่มีassetsเปลี่ยน Board49/61done; TASK060/061doneหลัง45tests/build/hostedsmokeผ่าน;041/058inprogress/visualreview5งานเดิม
- **ยังไม่มีownercloudsavewrite/repair** จะมีผลเมื่อuserบนVercelกด **สำรองแล้วอัปเดตเซฟ** หลังdeployment เซฟเก่า6173/transferprivatefileเป็นงานแยก targetอาจmigrateหรือเล่นต่อ/sourceอาจresetแล้ว ห้ามแนะนำรันSQLเก่าblind ให้ตรวจmetadata/exportsnapshotล่าสุดก่อนcutover TASK058AC05ยังไม่ครบ ไม่ให้keysผ่านchat

## 21 ต.ค. 2026 · Codex — D-083/TASK-059 ลดเซฟระหว่างสู้เป็น4วินาที

- **Source commit `0007542d8` push mainสำเร็จและVercelstatussuccessแล้ว** Chromeบนproductionโหลด `/assets/shell-DUroR1Ro.js` พบ4s schedulerจริง, loginแสดง, publichealth200/ok ไม่มีgame mutation [hostedproof](evidence/task-059-hosted.json) ไม่อ้างว่าอ่านหรือเล่นด้วยowner cloud saveจริง แนะนำจบไฟต์ก่อนreloadรับbundleใหม่

- ผู้ใช้เห็นเซฟรัวระหว่างสู้และขอลด แก้เฉพาะ client/UI: `BattleAckSchedule` กำหนด deadline4000msจากเริ่มrequest ไม่บวกresponse/checkpointlatencyทุกครั้ง ไม่มีcatch-upหลายคำสั่ง; RAF/shared predictionเดิมยังเดินทุกframe คำสั่งผู้เล่นยังส่งทันที ไม่มีการเปลี่ยนSQL/formulas/DBcap5000ms/lease15000ms/offlinepolicy
- SpeedButton ยืนยัน `battle.advance` ที่ความเร็วเดิมก่อนสลับ1×/2×/4× และเลื่อนdeadlineตามrequestนั้น ถ้าคำสั่งยังไม่confirmed/มีpendingไม่สลับ ผลที่predictionเห็นว่าจบแล้วรอperiodicackถัดไป(ปกติ≤4วินาที+network)ก่อนจ่ายจริง Hidden/offline/refreshยังreconcile/retreat ไม่อ้างว่าปิดหน้าระหว่างสู้แล้วเก็บผลที่ยังไม่ยืนยัน
- QA: **32 targetedTS tests** รวมStory/Tower/Daily/SaveProtocol/recurring/transfer/schedulerผ่าน; actualisolatedChrome+upstreamAuth/PostgREST/Postgresผ่าน4กลุ่ม Cadenceวัด3995/4014msแม้delayresponse400ms, peakcommand1, game_msเดินระหว่างrequest, speed1/2/4/settlement/claim/reload/offline/reconnectผ่าน [review](evidence/task-059-review.json) / `RO_EVIDENCE_PREFIX=task-059 RO_LOCAL_TEST_FOCUS=cadence python3 scripts/test_auth_stack.py`
- Harnessรอบแรกไปplayก่อนloginเสร็จ ใช้รอ700msจึงหาMageไม่เจอ แก้ให้รอsigned-inheading เก็บround1reports ไม่เปลี่ยนproductเพื่อหลบเกณฑ์ Build/env/assets/content/boundaries/typecheck/secretsผ่าน **contenthash2c1ac034…และpackf57a0773…คงเดิม** ไม่ต้องmigrateเพราะcadence ไม่รีสตาร์ต6173/ไม่เขียนcloudเซฟ Board **47/59done**, TASK059done; TASK041/058inprogressและvisualreview5งานเดิม

## 21 ต.ค. 2026 · Codex — TASK-058 guarded replacement เตรียมเซฟเดิมล่าสุดแล้ว รอผู้ใช้รันSQL

- ผู้ใช้เติมproductionmarkerแล้วเข้าเกมได้ และเผลอสร้างcloudcharacterใหม่ ตอบtargetmetadataจริง: UID `c37edad4-ec3c-4541-8cba-194bd21e285c`, revision1, statehash `a3cac0c4689d0b262f244ecfee256d9bc9850c1d8e38ea32923398927604afcc` จึงทำexplicitrevision1recoveryแยกจากnormalimportที่ยังปฏิเสธปลายทางไม่ว่าง
- Generatorตรวจproject/owner/exactrevision/hash/content/schema/ไม่มีbattle/checkpoint/historyตรงและHMACด้วยsigningkeyเดียวกับVercelก่อนarchive/delete สำรองทุกtargetgame rowในprivate `ro_operator_archive.save_replacements` ไม่มีFKไปgame_saves, RLS+revokeapplicationroles ไม่ลบAuthuser ทั้งarchive/delete/importอยู่transactionเดียว exactretryหลังเล่นต่อเป็นno-op ไม่มีpublicrawsaveendpoint
- Sourceส่วนตัวยังfrozen14ffbc71… แต่cloud2c1ac034… Helperใช้validatorของfrozenruntimeที่ตรงsourcehash โดยstagegeneratorใหม่ในprivate.source-tools+symlinksrc ไม่ผ่อนversionguard ไม่แก้sourcehash/signature หลังนำเข้าcloudจะต้องกด **สำรองแล้วอัปเดตเซฟ** ผ่านsave.migrateเดิม
- QA: unit5ข้อ/typecheck + freshPostgres9กลุ่มรวมwronghash/revision/HMAC/activebattle/failureหลังdelete/rollback/archiveprivacy/Authคงเดิม/retryหลังเล่นต่อ/sharedAPI checkpoint+commandผ่าน [report](evidence/task-058-replacement-postgres.json) รอบแรกfixturemarkerยังproductionทำlegacyhelperล้ม แก้fixtureกลับlocalและเก็บround1report
- Exportจริงแบบread-onlyล่าสุด **revision2993/10ด่านผ่าน/ไม่มีไฟต์** statehash `e48d20063805c3d395ed76eb3727dec990848975ba927c415a94993052b131cf` มีbackup/validatedcontext/SQL/envprivateแล้วที่ `.local/cloud-transfer/transfer-1792567985108257000/` **ใช้ `replace-initial-save.sql`** (ไม่ใช้import.sqlเก่าrevision2933) archive/transfer UUID `b9c0b468-b45d-4675-a861-34cc7dbda92d` [metadataaudit](evidence/task-058-replacement-personal-export.json) keysไม่อยู่ในSQL/ทุกไฟล์0600/dir0700
- **ยังไม่มีcloudwrite/ยังไม่ย้ายสำเร็จ** ไม่มีserverkeysในenvที่ใช้เรียกcloudได้ ผู้ใช้ต้องพักทั้ง6173และVercelแล้วรันSQLไฟล์ใหม่ในSupabaseSQL Editor ถ้าTARGET_SAVE_CHANGEDต้องตรวจmetadataใหม่ ห้ามทับblind; ถ้าTARGET_SIGNING_KEY_MISMATCHให้แก้Vercelkeyให้ตรงprivatefileก่อน ไม่มีข้อมูลเปลี่ยนจากfailedtransaction จากนั้นreloadกดbacked-upmigrationแล้วตรวจเซฟเดิม/เล่นต่อ/reloadจริงจึงปิดTASK058AC05ได้ ไม่พิมพ์login/private/env/contextและไม่รีสตาร์ต6173

## 21 ต.ค. 2026 · Codex — Hosted checkpoint SAVE_CONTEXT_UNAVAILABLE: deployment marker ยังว่าง

- ผู้ใช้ login แล้วรายงาน `/api/checkpoint` คืน `SAVE_CONTEXT_UNAVAILABLE` ตรวจ adapter พบ `game_load_context` เรียก environment guard ก่อนอ่านเซฟ และรวม RPC error เป็น code นี้ จึงยังไม่ใช่หลักฐานว่าเซฟเสียหรือ signing key ผิด
- ผู้ใช้รัน read-only SQL บน Supabase จริงแล้วตอบ `environment=NULL, project_ref=NULL, context_rpc_exists=true` ตาราง marker มี NOT NULL columns ดังนั้นเป็นตารางว่าง Migrations ตั้งใจไม่สร้าง marker อัตโนมัติ ห้ามข้าม guard/เปลี่ยน RLS เพื่อแก้
- ขั้นแก้คือรัน operator create-or-verify production marker ใน SQL Editor: insert singleton/production/project ref ที่ผู้ใช้ระบุ, ON CONFLICT DO NOTHING, เรียก game_assert_environment ตรวจให้ได้trueแล้ว commit มีไฟล์พร้อมแล้วที่ `.local/cloud-transfer/transfer-1792562795716865000/setup-project.sql` ไม่ต้องเปลี่ยนเกม/APIหรือรีสตาร์ต6173 API service_role มีสิทธิ์อ่าน marker เท่านั้น จึงเติมผ่าน SQL Editor ของเจ้าของ project
- ตรวจ presence ของ env copies ที่ผู้ใช้เปิดไว้แบบไม่พิมพ์ค่า พบไฟล์บนเครื่องยังไม่มี server key จึงไม่ได้เรียก privileged cloud RPC หรืออ่านข้อมูลเซฟ ไม่ได้เปลี่ยน SQL/เซฟจริง; รอผู้ใช้รัน marker แล้ว reload/ตรวจ checkpoint ต่อ ถ้าเป็น14ffเดิมให้ใช้ backed-up save.migrate ไป2c1ac034ตามหัวข้อถัดไป TASK058AC05ยังไม่ครบ

## 21 ต.ค. 2026 · Codex — D-082 หน้าแรกเข้าเกม/login และแก้ Vercel API import

- **ขึ้น production แล้วที่ commit `1a15532e5`**: GitHub Vercel status success, public `/api/health`200/ok/persistence configured/content2c1ac034… และ anonymous `/api/checkpoint`401จริง Chromeบน `https://ro-idle-pve.vercel.app` ผ่าน7กลุ่มเช่นเดียวกับ localโดย intercept Auth/APIเพื่อไม่เขียนเซฟจริง รายงาน canonical `entry-routes-browser.json` เป็นhosted bundle ส่วน localเดิมเก็บ `entry-routes-local-browser.json` แยก; screenshotทั้งสองแยกชื่อ ไม่อ้างว่า hosted owner login/JWT/DB/save migration ผ่านแล้ว
- ผู้ใช้ deploy สำเร็จที่ `https://ro-idle-pve.vercel.app/` แต่หน้าแรกยังเป็น demo แก้ `/` และ `/index.html` ให้ replace ไป `/play` (PKCE callback ไป `/auth` โดยเก็บ query/hash), session ว่างไป `/auth?next=...`; login สำเร็จกลับเกมพร้อม v/c เดิม `/auth` โดยตรงยังใช้จัดการบัญชี/ออกจากระบบ/กู้รหัสผ่านได้ demo เป็น `/demo` พร้อม Vercel rewrite และอัปเดต active spatial harness เฉพาะทางเข้า ไม่รันทับหลักฐานเก่า
- `AuthExperience` รับ optional returnToPlay ที่ ConfiguredAuth ยอมรับเฉพาะ `/play` หรือ `/play?...`; ไม่ mount SavePanel ในทางผ่าน login จึงไม่แย่ง writer ระหว่างเข้าหน้าเกม เปลี่ยน link/copy ที่เคยชี้หน้าแรกเป็น demo ให้กลับเกม/ระบุ `/demo` ชัดเจน
- ตรวจ public health จริงก่อนแก้ได้500 `FUNCTION_INVOCATION_FAILED`; ผู้ใช้ส่ง log `ERR_MODULE_NOT_FOUND /var/task/src/domain/account/index.ts` ยืนยัน API `.js` ยัง import `.ts` แก้ `tsconfig.json rewriteRelativeImportExtensions:true` และ native JSON import ใน `src/content/index.ts` ให้มี `with { type:'json' }` ไม่พ่วง raw TypeScript/source library เข้า function
- QA: production-configured isolated build ผ่าน, Chrome7กลุ่มผ่าน (root logged out/in, invalid login, restore query/session/reload, account/logout, external next rejection, explicit demo) ทั้ง Auth/API เป็น fixtures ไม่มี cloud writes; targeted API/Auth18 + backup/migration/transfer10 = **28 tests ผ่าน** รายงาน `entry-routes-{browser,review}.json` / build.txt และ screenshot `entry-login-390.png`
- ใช้ official `@vercel/node@24.0.3` ตรง CLI64.5.0 compile+file trace แล้ว materialize249files ใน `/private/tmp/ro-function-CHkMcw` รัน native Node24 **ไม่มี tsx/TSloader/source tree** ได้ health200 และ anonymous checkpoint401 หลักฐาน `entry-function.json` เครื่องมือ `scripts/test_vercel_function.cjs` ใช้ isolated source + dependencies จริง ไม่ใช้ symlink ที่ trace ออกนอก root
- Test harness รอบแรกใช้ selector demo รุ่นเก่า จึง timeout หลัง6กลุ่ม แก้เป็น companion strip ปัจจุบัน เก็บ `entry-routes-browser-round1.json` แยก; materializer2ครั้งแรกพบ FileBlob stream เป็น legacy readable ไม่ใช่ async iterable แก้ Node pipeline เก็บ `entry-function-round1.json` ไม่เปลี่ยนเกณฑ์ product
- **Content hash เปลี่ยนจาก14ffbc71…เป็น2c1ac034…** เพราะ JSON import attribute อยู่ใน implementation fingerprint แม้สูตร/ข้อมูลเกมไม่เปลี่ยน ไม่ bypass compatibility: cloud save เก่าต้องผ่าน flow `save.migrate` ที่มี preview/backup (ทดสอบผ่าน) SQLส่วนตัวที่เตรียมไว้ก่อนหน้ายังเป็น14ff; ถ้านำเข้าแล้ว APIใหม่จะเสนอ migration ส่วน helper export ใหม่ยังปฏิเสธ source version เก่าตามสัญญา ให้ใช้ SQLเดิมแล้ว migrate cloud หรือ migrate source ผ่าน workflowก่อน exportใหม่ ห้ามแก้ hash/เซ็นทับเอง
- ยังไม่รีสตาร์ต6173 ไม่อ่าน env/login/private ไม่ย้ายหรือสร้างเซฟจริง Boardคง46/58doneและTASK058AC05รอ hosted owner login/save migration/reload; public hosted routes/health ผ่านแล้ว ไม่มี credentials สำหรับพิสูจน์ hosted owner login

## 21 ต.ค. 2026 · Codex — แก้ Vercel build ติด source assets หลัง .vercelignore

- ผู้ใช้ส่ง hosted build log ของ commit `7231312`: env ผ่านแล้ว แต่ assets:check ล้มที่ `library/characters/body_atlas/_--011e9b38cbbb.meta.json` หลัง Vercel clone แล้วลบ ignored files การทดสอบเดิมไม่มี assets directory เลยจึงไม่ครอบคลุมโฟลเดอร์ว่างที่เหลืออยู่
- ทำซ้ำด้วย verifier จาก commit เดิมใน source context แยกที่มี `assets/ro/` ว่าง ได้ error ตรงรายงาน เพิ่ม explicit `--check --artifact-only` / `npm run assets:check:runtime` และให้ build ใช้คำสั่งนี้ ตรวจ payload checksum/file set/selection/manifest fingerprint/size เดิมครบโดยไม่อ่านคลังต้นทาง `npm run assets:check` ยังคงตรวจต้นทางอย่างเข้มงวดและปฏิเสธคลังไม่ครบ ไม่เปลี่ยนเป็นข้ามไฟล์หายรายตัว
- เพิ่ม regression 4 กลุ่ม: empty/partial source tree, corrupt/missing/extra runtime files, stale selection และ manifest fingerprint ชุด Python runtime assets **12 tests ผ่าน** รวม local rebuild repeatability/source checks
- Isolated production-configured `npm run build` ผ่าน env/assets/content/boundaries/typecheck/Vite/output/secrets ใน `/private/tmp/ro-vercel-build-t0fnr833` ใช้ dependencies เดิมผ่าน symlink, synthetic env ไม่มีจริง, ไม่มี .local/คลังต้นทาง แต่มี source directories ว่าง หลักฐาน `plan/evidence/vercel-runtime-build.{json,txt}` ไม่ใช่ hosted Vercel proof Content `14ffbc71…` / pack `f57a0773…` คงเดิม ไม่เปลี่ยน assets/gameplay/save
- เพิ่ม `*.env` ใน .gitignore/.vercelignore ครอบคลุมไฟล์ env สำเนาที่ผู้ใช้สร้างไว้ราก project โดยไม่อ่าน/ลบ/ส่งไฟล์นั้น แก้ docs ให้ตรงว่า Git integration ใช้ .vercelignore หลัง clone เช่นเดียวกับ CLI
- ไม่มี restart6173 หรือ cloud write; TASK-058 AC05/hosted deployment ยังรอตรวจจริง ขั้นถัดไปตรวจ Vercel deployment ของ commit ใหม่และขอ URL เมื่อพร้อม แล้วทำ hosted Auth/save transfer ตามหัวข้อถัดไป ไม่ปิด TASK-043/045/046/058 จาก local build เพียงอย่างเดียว



## 21 ต.ค. 2026 · Codex — TASK-058 ย้ายเซฟไป Supabase: เตรียม snapshot จริงแล้ว ยังไม่ import cloud

- ผู้ใช้ถามต่อ Auth/RLS/cloud saves ยืนยัน **ย้ายเซฟเดิม6173** (D-081) และรายงานสร้าง Supabase project/รัน6migrationsแล้ว ส่ง Project URL กับ target Auth UID มาแล้วในแชต ค่าลับ Supabase จะใส่ Vercel เอง ยังไม่มีโดเมน Vercel/hosted login proof
- Sign-in/email-password/no-sign-up มีอยู่แล้วใน `src/client/supabase-auth.ts`/`src/ui/auth-page.tsx` และ RLSใน6migrations ไม่สร้างใหม่ซ้ำ แก้ข้อความเก่าไม่มีเซฟให้ชี้ไปสร้างตัวละครแทนข้อความว่าระบบยังไม่เปิด Backend public signup ต้องปิดใน Supabase Dashboard ตาม docs
- ผู้ใช้สับสนชื่อSecret/legacy จึงเปลี่ยนcanonicalenvเป็น`SUPABASE_SECRET_KEY` (ใส่sb_secretใหม่), frontendใช้`VITE_SUPABASE_PUBLISHABLE_KEY` (sb_publishableใหม่) รองรับชื่อSERVICE_ROLEเดิมเฉพาะbackwardcompat/localและrejectค่าต่างกันถ้าตั้งสองชื่อ แก้.env.example/docs/privateproductionenvแล้ว 20targetedAuth+transfertests/buildผ่าน server auth adapterเปลี่ยนจึงไม่ใช่UI-onlycompatible snapshot update; ไม่ได้รีสตาร์ต6173
- เพิ่ม operator-only `scripts/game/prepare-cloud-transfer.ts`: ตรวจ source schema/content/hash/history/HMAC, bind target UID, preserve full AccountState + source revision และสร้าง atomic SQL save/history/import receipt ตรวจ project marker/Auth UID/ปลายทางว่าง/clock ไม่มี public upload endpoint Exact retryหลังเล่นต่อเป็นno-op; UUIDเดิมpayloadต่างถูกปฏิเสธ ใช้ signing key เดิมจาก private sourceเพื่อให้userใส่Vercelตรงกัน
- `scripts/prepare_local_cloud_transfer.py`: source read-only via Unix socket, pg_dumpเฉพาะgame tables, signed context, SQL/env/summaryใน`.local/cloud-transfer/`ไฟล์0600/dir0700 ไม่มีsecretในSQL/logs ไม่คัดAuthschemaหรือcredentialsท้องถิ่นไปcloud history/receiptsรุ่นเก่าอยู่localbackup Cloudย้ายเฉพาะstateปัจจุบัน+signed tip+importreceipt
- QA: 4unit tests, build/env/assets/content/boundaries/type/secretsผ่าน, readiness8/8; fresh PostgreSQL6กลุ่ม + sharedAPI checkpoint200/คำสั่งถัดไปrevision23→24/replay/collision/rollback3ตาราง/RLS/permissionsผ่าน รายงาน`task-058-{unit,postgres}.json`/build.txt ไม่ใช่ hostedAuth/JWT/PostgREST proof ชุดfixtureลบทิ้งแล้ว ไม่แตะ6173ระหว่างทดสอบ
- Round1–3 test socket pathยาวเกินmacOS103bytes แก้prefix; Round4พบPythonPath.openไม่รองรับopener แก้builtinopen เก็บfailure evidenceแยก ไม่มีการเปลี่ยนเกณฑ์ให้ผ่าน
- หลังได้project/UIDจริง รันhelperกับเซฟส่วนตัวสำเร็จ **revision2933** hash/schema/content/signatureผ่านและstateคงเดิม เก็บbackupแล้ว **ยังไม่มีcloud write** private directory `.local/cloud-transfer/transfer-1792562795716865000/` มีcontext/import.sql/local-game-backup.dump/summary/vercel-signing.env เพิ่ม`vercel-production.env` (URL/ref/appenv/signingkeyพร้อม, 2APIkeysว่างให้userเติม) และ`setup-project.sql` (create-or-verifyproductionmarker ไม่relabel) ห้ามพิมพ์เนื้อหาไฟล์ private เหล่านี้ รายงานpublicมีเฉพาะboolean/revision/hash`task-058-personal-export.json`
- ขั้นถัดไป: userเติม Publishable/Secret key ใน private env→ใส่Vercel Production, รันsetup-project.sqlแล้วimport.sqlในSQLEditorที่ถูกproject→ตรวจ state_hash/revision/sign-in/เล่นต่อ/reloadจริง Source snapshotอาจเก่าถ้ายังเล่น6173ต่อ ให้ exportล่าสุดตอน cutover ก่อนนำเข้า (ไม่เขียนทับ cloudที่เริ่มแล้ว) ขอURLVercelเมื่อพร้อมเพื่อตรวจAuthredirect/network/health ไม่มีrestart6173ในงานนี้
- Board **46/58done**, inprogress041+058, review048/054/055/056/057, todo042–046; TASK058 AC01–04ผ่านเครื่องมือ/fixtures AC05ยังรอhosted ห้ามปิดdoneหรืออ้างว่าย้ายจริงแล้ว TASK043/045/046ยังไม่ผ่าน

## 21 ต.ค. 2026 · Codex — ส่งทั้งโปรเจกต์ขึ้น GitHub สำเร็จ แก้ SSH account แล้ว

- หลังผู้ใช้อนุญาตให้ตรวจ SSH metadata พบ alias ที่ตั้งไว้แล้ว `github-new` ใช้บัญชี **ctemchai-cmd** (`ssh -T` ยืนยันสำเร็จ); `github.com` เดิมเป็น Rehpyc-z ที่ไม่มีสิทธิ์ repo นี้ ไม่อ่าน/พิมพ์ private key/token และไม่แก้ SSH config ส่วนกลาง
- เปลี่ยน origin เฉพาะ repo เป็น `git@github-new:ctemchai-cmd/ro-idle-pve.git` แล้ว **push main สำเร็จ** ที่ [GitHub](https://github.com/ctemchai-cmd/ro-idle-pve) สาขา main มี upstream `origin/main` ตรวจ source commit `edb95a74553a27e6a62a37cd8d6561d5e103671b` ตรง remote ด้วย ls-remote แล้ว การส่งเอกสารผลรอบนี้เป็น commit เพิ่มจาก source payload
- Source payload มี120,294 tracked files/1,131,126,052B รวม source assets117,892files/990,574,867B และ runtime artifact1,198files/27,200,551B ไม่มีไฟล์ส่วนตัว/credentials/node_modules/dist/generated source รวมตาม audit ไม่ส่ง `.local/play` หรือเซฟไป GitHub
- หลักฐาน `plan/evidence/git-initial-push.json` และ `git-initial-tree-audit.json`; build/source audit/config schema ที่ผ่านก่อนหน้าไม่เปลี่ยน ไม่รันเกม tests ซ้ำเพราะรอบนี้มีแต่เอกสาร/การเลือก SSH alias ยังไม่มี hosted Supabase/Vercel deployment และไม่ปิด TASK043/045/046
- ขั้นตอนนำไป deploy อยู่ `docs/DEPLOYMENT.md` (env/SQL6migrations/marker/Auth redirects) GitHub integrationใช้สาขาmainและruntime artifactที่เก็บในGit ไม่คัดคลัง assets เต็มไปเว็บ ต้นทางบนเครื่องยังมีครบ และไม่ได้รีสตาร์ต6173/เปลี่ยนเซฟ Boardยัง46/57doneเหมือนเดิม
- ต่อไป push ผ่าน `origin` ของ repo นี้เพื่อใช้บัญชีที่ถูกต้อง ไม่เปลี่ยนกลับไป `github.com` โดยไม่มีการแก้บัญชี SSH การเรียกกลับไปทำงานเกมให้ยึด task folders/overview และกติกาถามก่อนรีสตาร์ต6173ตามเดิม

## 21 ต.ค. 2026 · Codex — เตรียม GitHub ทั้งโปรเจกต์แล้ว แต่ push ติดสิทธิ์บัญชี

- ผู้ใช้สั่งขึ้น GitHub ทั้งโปรเจกต์ที่ `git@github.com:ctemchai-cmd/ro-idle-pve.git` เพื่อนำไปต่อ Vercel/Supabase สร้าง repo สาขา `main`, origin ตามที่ระบุ และ commit `4b7f6c9` (`first commit`) แล้ว **ยังไม่ขึ้น GitHub**
- รวม code/plan/tests/SQL migrations/คลัง assets ทั้งชุด และเปลี่ยนให้เก็บ `runtime/ro/` เป็น deployment artifact ใน Git ไฟล์รวมประมาณ120,000รายการ/1.13GB ไม่มีไฟล์≥100MiB `.local/`, credentials, `.env*` ยกเว้น example, node_modules, dist, generated source และ caches ถูกกันออก `.gitattributes` คง byte-exact เพื่อไม่ให้ CRLF ทำ checksum เสีย
- เพิ่ม `vercel.json` (Vite/Node24, build/output, API+SPA routes, manifest no-store/hashed asset immutable), `.vercelignore` สำหรับCLI และ `docs/DEPLOYMENT.md` พร้อม environment/marker/migrations6ไฟล์/Auth settings READMEปรับสถานะจริง การเตรียมนี้ไม่ปิด TASK043/045/046 และไม่ได้สร้างหรือ deploy บริการจริง
- Build ใน `/private/tmp/ro-git-build-1m060zwk` ที่ไม่มีคลัง assets/.local/env/generated source ผ่านโดยใช้ runtime artifact + existing dependencies พบครั้งแรกว่า CLI exclusion ของ tests ทำให้ type import ของ compact-ui-fixture หาย จึงนำ tests กลับใน source selection แล้ว build ผ่าน เก็บ failure/pass แยก หลักฐาน `plan/evidence/git-initial-build*.{json,txt}`; configผ่านschemaทางการ
- สแกน70,886 staged text files/120,289pathsผ่าน ไม่มี prohibited path/ไฟล์ใหญ่/credential pattern ที่ไม่ใช่fixture พบ3tokensที่เป็น synthetic auth fixturesเดิมและตรวจแล้ว รายละเอียด `git-initial-source-audit.json` ไม่อ่าน/แสดง `.local/play/login.md`, private.json หรือ private keys
- `ls-remote` อ่าน repo ว่างได้ แต่ push ถูก GitHubปฏิเสธ **Permission denied to Rehpyc-z** สองครั้ง (SSH และการลอง override origin URL ไป HTTPS ซึ่งยังได้ SSH denialเดิม) `main` จึงยังไม่ถูกส่ง ห้ามอ้างว่าอัปโหลดเสร็จหรือ force push
- Auto-review ปฏิเสธคำขอสำรวจ ~/.ssh/config/key filenames/agent public fingerprints หลัง pushถูกปฏิเสธ โดยมองว่าเป็นการหาสิทธิ์ใหม่ ต้องรอผู้ใช้อนุญาตโดยตรง ยังไม่ได้อ่านข้อมูลเหล่านั้น ส่ง async question ให้เลือกว่าอนุญาตตรวจ metadataนี้/เพิ่มสิทธิ์ให้Rehpyc-z/จัดการบัญชีเอง ห้ามพยายามอ้อม rejection ระหว่างรอ
- งานถัดไปหลังผู้ใช้ตอบ: แก้ช่องทาง auth/สิทธิ์ตามที่อนุญาต แล้ว push `main` ปกติ ตรวจ remote ref ตรง local HEAD และ upstream ไม่มีการรีสตาร์ต6173/เปลี่ยนเซฟในงานนี้ Boardยัง46/57doneเหมือนเดิม

## 21 ต.ค. 2026 · Codex — อัปเดต UI D-077–080 และทรงผม D-079 บน 6173/LAN แล้ว

- ผู้ใช้ตอบคำขอ restart ว่า **"อัปเดตเลย"** จึงหยุดเฉพาะ PID ของ personal `play_local.py` แล้วเปิด detached ด้วย `--refresh-compatible-snapshot --lan` สำรอง PG และ archive snapshot เดิมครบ ไม่ reset/migrate เซฟ
- ก่อน/หลังมี1เซฟ revision2622 และ fingerprint `b5b091e2a67bd74b2b2358c0233af655` เท่ากัน content ยัง `14ffbc71…` runtime pack ใหม่ `f57a0773…` public manifest มี36 job/gender head presets ใช้36หัวไม่ซ้ำ และทุกไฟล์ UI ตรง frozen source
- เว็บพร้อมที่ `http://127.0.0.1:6173/play` และ `http://192.168.1.101:6173/play` Auth health/HTTP200 ผ่าน Chrome signed-out360×640ทั้งสอง origin ผ่าน bundle JS/CSS15ไฟล์ต่อ origin ตรง snapshot ไม่มี browser error ไม่มีการอ่านหรือใช้ private/login ใน probe และไม่ได้สั่งบันทึกบัญชีส่วนตัว
- หลักฐาน `plan/evidence/task-056-polish-local-refresh.json` และ `task-056-polish-updated-preview-smoke.json` บันทึกแยกจากการอัปเดต D-076 ครั้งก่อน ผลทดสอบ source/ทรงผม/UI ก่อนอัปเดตอยู่หัวข้อถัดไป ไม่ได้รันชุดเต็มซ้ำโดยไม่มี source เปลี่ยน
- Board ยัง done46/57, inprogress041, review048/054/055/056/057, todo042–046 TASK056 AC06 และ057 AC05 รอผู้ใช้ยอมรับภาพจริง การอนุญาตอัปเดตไม่ใช่การรับภาพ รีสตาร์ตครั้งถัดไปยังต้องถามตาม D-072 และคง `--lan`

## 21 ต.ค. 2026 · Codex — รอบแก้ UI D-077–080 + ทรงผม TASK-057 พร้อมอัปเดต (รอผู้ใช้ตอบ restart)

- ผู้ใช้แก้ TASK-056 หลังดูของจริง: คิวสกิลต้องกลับด้านล่าง (D-077), CSPD/ห้ามเลือกข้อความ/ลูกศรกึ่งกลาง/ลบแนะนำหน้าแรก (D-078), แถบปุ่มต่อสู้ไม่สวยและเอา Emoji ออกใช้ Icon แทน (D-080) — ทำครบและตรวจแล้ว
- `SkillsPage`: DOM loadout กลับใต้ skill-split ก่อน Timeline ยังติดอยู่ในหน้าไม่ต้องเลื่อน outer page; อัปเดต AGENTS/design30/decisions แล้ว ห้ามย้ายขึ้นด้านบนอีก
- `character-nav.tsx`: chevron SVG ไม่อิง font baseline วัด glyph center ทั้งแกนและ path center ผ่าน ≤0.5px; `game.css`: user-select/-webkit-user-select none ใน shell ทั้งหมด ยกเว้น input/textarea/contenteditable เพื่อพิมพ์ข้อมูลได้; ชื่อ Cast Speed ทุก UI ใช้ CSPD
- `field.tsx`: ลบ guide/quest pill และ localStorage state เดิม หน้าแรกเหลือ map/AFK/challenge; boss-tools เป็นแถวเดียว **ภายใน boss-bar ใต้แถบร่าย** ไม่ absolute ลอยบังฉาก ปุ่ม Stats/Timeline/speed/retreat ใช้ shared outline SVG `Icon` เพิ่ม paths ใน `src/ui/icon.tsx` และแทน Emoji ทุกหน้าเกม/ชีต/Timeline รวม fallback หลายส่วน (native RO item/skill/menu art คงเดิม)
- ผู้ใช้ขอทรงผมต่างกัน (D-079): TASK-057 เลือก native human heads จาก 42 แบบต่อเพศ ทุก job/gender ใช้คนละ ID รวม19 jobs/36 presets ผ่าน `plan/data/actor-presentations.json` **ไม่ต้องเพิ่ม renderer override หรือ stat/schema ใหม่** รวม Monk ทรงโกน `32` รายการเลือกใน `task-057-hairstyles-selection.json`
- runtime pack **f57a0773…**, 656 assets / 1197 files / raw26,693,726B (~25.46MiB) + manifest506,825B; initial1,582,917B อยู่ใน cap27MiB content hashยัง **14ffbc71…** จึงอัปเดต compatible ได้ ไม่ migrate/reset เซฟ API/server/migrations/gateway ตรง frozen preview ทุก byte
- ตรวจจริง: build/env/assets/content/boundaries/type/secrets ผ่าน; M0 11/11 + readiness8/8, starter check, library60,460 checksum/ACT/atlas checks (9 STR unresolved เดิมนอก pack), native4 testsผ่าน `RO_EVIDENCE_PREFIX=task-056 RO_COMPACT_ARTIFACT_TAG=task-056-polish RO_LOCAL_TEST_FOCUS=compact python3 scripts/test_auth_stack.py` ผ่าน **9กลุ่ม/30layouts/0error** รวม doubleclick/drag ไม่เลือกข้อความ, RESET input ยังพิมพ์ได้ (ไม่กดรีเซ็ต), และ Daily จริงกดสถิติ/Timeline/1→2→4→1/retreat บันทึก SQL ถูก
- Native head QA ใหม่ `scripts/check_job_hairstyles.cjs` ผ่าน3,420 decoded body-clock samples × state/facing/hat (5 states, ซ้าย/ขวา, bare/Tier20) ทุก36preset ภาพ contact sheets bare/hat และ battle/skill/Stats ตรวจด้วยตาเฉพาะ idle composites/UI; ไม่อ้างว่าเปิดดูทุก animation frame ด้วยตา
- หลักฐานล่าสุด `plan/evidence/task-056-polish-{compact-ui,local-stack,compatibility}.json`, `task-056-battle-toolbar.json`, `task-057-{native-renderer,hairstyles-selection,review}.json`; screenshot prefix `task-056-polish-compact-*`, `task-057-{job-hairstyles,heads-with-hats}.png` เก็บรายงาน UI รอบก่อนแยกไม่ทับ
- **เว็บ6173ยังไม่ได้อัปเดตรอบนี้** (ยังเป็น UI D-076 แรกที่ผู้ใช้สั่งอัพ) ส่งคำถาม `request_user_input_async` รอผู้ใช้ตอบอนุญาต restart รอบใหม่ตามกติกา ask-before-every-restart; งานพร้อมตรวจและได้เห็นภาพแล้ว ยังห้ามถือว่าเวลาเงียบเป็นการอนุญาต
- เมื่อผู้ใช้อนุญาต ใช้ `python3 /private/tmp/ro-refresh-ui-polish.py` (helperชั่วคราว) สำรอง/ตรวจ revision+fingerprint/หยุดเฉพาะ PID ส่วนตัว/เปิด detached compatible --lan/เทียบทุก UI file และ public pack+36uniqueheads จากนั้น `node /private/tmp/ro-refresh-polish-smoke.cjs` ตรวจ signed-out localhost/LAN bundles (ไม่ใช้ login ส่วนตัว) หรือทำขั้นเดียวกันด้วย play_local.py ตามคู่มือถ้า helperหาย ทั้งสองต้องมีสิทธิ์เปิดพอร์ต/ส่ง signal นอก sandbox
- Board done46/57, inprogress041, review048/054/055/056/057, todo042–046; TASK056 AC06 และ057 AC05 รอผู้ใช้ภาพจริง ไม่ใช่แค่คำอนุญาตอัปเดต

## 21 ต.ค. 2026 · Codex — อัปเดต TASK-056 บน 6173 แล้วตามผู้ใช้อนุญาต

- ผู้ใช้ตอบ "อัพเลย" จึงรีสตาร์ตเฉพาะบริการส่วนตัวด้วย `--refresh-compatible-snapshot --lan` สำรอง PG และเก็บ snapshot เก่าครบ ไม่ reset/migrate เซฟ
- ก่อน/หลัง: 1 เซฟ revision2237 และ fingerprint ของ revision/content/state_hash เท่ากัน Content `14ffbc71…` / pack `5370e86d…` เดิม source UI ใหม่ 8 ไฟล์ตรง frozen snapshot
- เว็บกลับมาแล้วที่ `http://127.0.0.1:6173/play` และ `http://192.168.1.101:6173/play` ตรวจ Chrome แบบไม่ล็อกอินทั้งสอง origin ผ่าน 0 error และ JS/CSS สาธารณะ 15 ไฟล์ต่อ origin ตรง snapshot มี compact CSS/ปุ่มเปลี่ยนตัวจริง
- หลักฐาน `plan/evidence/task-056-local-refresh.json` และ `task-056-updated-preview-smoke.json` บริการใหม่เปิด detached คง PID/lock ตามปกติ ไม่อ่านหรือใช้ login/private ใน probe
- TASK-056 ยังอยู่ review รอผู้ใช้รับภาพ (AC-06) การอนุญาตอัปเดตยังไม่ใช่การยอมรับภาพจริง กระดานยัง done46/56, inprogress041, review048/054/055/056

## 21 ต.ค. 2026 · Codex — TASK-056 UI มือถือกระชับ (D-076), รออนุญาตอัปเดต 6173

- รับช่วงจาก Claude ตามหัวข้อถัดไป อ่าน AGENTS/HANDOFF/overview/decisions แล้ว ผู้ใช้ขอเอาวงกลมทีม 4 ตัวออกจากหน้าแรก, เพิ่ม ‹ › ใน Stats/Skill และลด UI ให้เลื่อนน้อยลง
- ทำแล้วใน `src/ui/game/`: ลบ `team-dock` (ยังเก็บ party focus ในบอส), เพิ่ม `character-nav.tsx` ให้ Stats/Skill กับ roster strip ใช้ลำดับทีมก่อนแบบเดียวกัน วนหัวท้ายครบเจ็ดตัว; route `c` เปลี่ยนโดยไม่บันทึกเกม, keyed Stats/Skill ล้าง draft/picking ของตัวเก่า, เปลี่ยนหน้า/ตัวแล้วคืน scroll ด้านบน
- CSS ปรับ HUD 58px/bottom bar 60px, แผงอุปกรณ์ 56px, roster card 72px, ช่องว่าง/เมนู/ดัน/ร้าน/ชีตกระชับ, กระเป๋า 6 คอลัมน์; ไม่ใช้ zoom และไม่เปลี่ยนขนาด actor ในสนาม Stats ใช้ label/value ในช่องบรรทัดเดียว คำอธิบายโบนัสอยู่ใน Additional Stats เปิดดูได้
- Skill: คิว 4 ช่องอยู่ด้านบนตลอด รายการ/รายละเอียดเลื่อนแยกกัน ผลระดับถัดไปกดขยาย; Timeline เปิดใน `dialog.skill-preview` แทนขยายหน้าหลัก ฮาร์เนส shell เดิมปรับ selectors ตามแล้ว
- `hud.tsx`: ย้ายปุ่มสถานะเซฟไปแถวชื่อ ขยายพื้นที่ทรัพยากรให้ badge ไม่ชน sound/settings ที่ 360px
- ตรวจแล้ว: `npm run build` (env/assets/content/boundaries/typecheck/secrets), `python3 plan/checks/readiness.py` 8/8 และ `RO_EVIDENCE_PREFIX=task-056 RO_LOCAL_TEST_FOCUS=compact python3 scripts/test_auth_stack.py` ใช้ fresh upstream Auth/API/PostgreSQL/Chrome แยก ผ่าน 6 กลุ่ม/30 layouts (360×640,390×844,1280×800 ×10 หน้า), 28 ภาพ, 0 browser error Stats/Skill ปกติ page scroll 0px ทั้งสามขนาด; ลูกศร 40×40px ยืนยัน draft isolation และคำสั่งบันทึก INT/upgrade/คิวลง NPC ที่เลือกจริง หน้ารายการยาวยังเปิดดูท้ายสุดได้
- หลักฐาน `plan/evidence/task-056-{compact-ui,compatibility,review,local-stack}.json`, `task-056-build.txt`; browser ใช้ funded Lv20/Class2 fixture ทุกตัว+ของสวม ไม่อ้างว่าเล่นหาได้จริง ตรวจภาพด้วยตาเฉพาะ home/Stats 360, Skill 390 และภาพ Buddy/Skill 360 รอบก่อน ไม่ใช่มือถือจริง/Safari
- รอบ 1 พบ Stats ล้น 52px แล้วแก้ รอบ 2 layout ทั้ง 30 ผ่านแต่ selector ของ nested summary กำกวม จึงแก้ฮาร์เนสเป็น direct child; เก็บ failure evidence round1/round2 แยก รอบ 3 ผ่านทั้งหมด ไม่ได้รัน 355 unit tests เดิมซ้ำเพราะเปลี่ยน UI เท่านั้น
- Board: done46/56, inprogress TASK-041, review TASK-048/054/055/**056**, todo042–046. TASK-056 AC01–05 ผ่าน self-check แต่ AC06 ต้องผู้ใช้ยอมรับ ยังไม่ปิด done เพิ่ม D-076 และ acceptance 6 แถว (รวม255 cases) แล้ว
- **ยังไม่รีสตาร์ต/อัปเดต 6173 และไม่อ่าน login/private** เว็บส่วนตัวยังคง snapshot จาก Claude (LAN) content `14ffbc71…`, pack `5370e86d…` ตรงเดิม ตรวจ byte hashes ของ API/server/migrations/gateway ตรง snapshot สามารถใช้ `--refresh-compatible-snapshot --lan` หลังผู้ใช้อนุญาต (สำรองอัตโนมัติ)
- งานถัดไป: เมื่อผู้ใช้ตอบอัปเดต ให้หยุดเฉพาะ PID ของเว็บส่วนตัวแล้วเปิด `python3 scripts/play_local.py --refresh-compatible-snapshot --lan`; อย่าลืมคง LAN และถามก่อนตาม D-072 ถ้ายังไม่อนุญาต งาน UI พร้อมตรวจแล้ว งาน balance/TASK-042–046 คงตาม handoff Claude ด้านล่าง

## 21 ต.ค. 2026 (ค่ำ) · Claude Code → Codex — ส่งต่องานฉบับละเอียด (TASK-041, TASK-054/055, D-070–D-075)

อ่านส่วนนี้ก่อนทั้งหมด ส่วนล่างเป็นประวัติตามลำดับเวลา (รายละเอียดเชิงลึกของแต่ละรอบ)

### 0. ผู้ใช้และวิธีทำงานที่ผู้ใช้คาดหวัง

- ตอบผู้ใช้เป็น**ภาษาไทยเสมอ** สรุปสั้น ตรง บอกสิ่งที่ยังไม่ได้ตรวจตรงๆ
- ผู้ใช้กำลัง**ลองเล่นเว็บส่วนตัว 6173 อยู่จริง** และส่งคำขอ/บั๊กเล็กๆ ระหว่างเล่นบ่อย รูปแบบที่ใช้มาตลอด: ทำ → ตรวจ (unit + build + live) → สรุป → ถามก่อนรีสตาร์ต → ผู้ใช้ตอบ "อัพเลย" → deploy
- **ถามก่อนรีสตาร์ต 6173 ทุกครั้ง** (ไฟต์บอส/ดันที่ค้างจะถูกถอยทัพ สิทธิ์ดันรายวันไม่คืน)
- เวลาประเมินต้องวัดจริงก่อนบอก (ผู้ช่วยเคยบอกผิดว่าจำลอง 25 วันใช้ไม่กี่นาที) ผู้ใช้ถามเรื่อง token: การจำลองรันบนเครื่องไม่กิน token ให้ใช้ background + แจ้งเตือนแทนการเปิดเช็กบ่อย
- คำตอบของผู้ใช้ที่เป็นการตัดสินใจถูกบันทึกเป็น D-0xx ใน `plan/decisions.md` เสมอ ห้ามรื้อคำตอบเดิม (เช่น ดันรายวันเลือดสะสมทั้งวัน P-07, D-074 ไม่ปรับจูนใหม่สำหรับท่าร่ายแรงเพิ่ม)

### 1. สถานะตอนนี้

| เรื่อง | ค่า |
| --- | --- |
| กระดานงาน | done 46/55 · `inprogress`: TASK-041 (บาลานซ์) · `review`: TASK-048 (AC-08), TASK-054 (AC-06), TASK-055 (AC-06) — รอผู้ใช้ยอมรับเท่านั้น ห้ามปิดเองโดยไม่มีคำยืนยัน |
| content / pack | content `14ffbc71…` · pack `5370e86d…` (622 assets, 25.67 MiB raw ≤ cap 27 MiB, initial 1.56 MB) |
| เทสต์ล่าสุด | `npm test` **355/355** · `npm run build` ผ่าน · `bash scripts/m0_checks.sh` 11/11 · live shell modes-only 18 checks/0 error (ชุดเต็มล่าสุดก่อน D-074: 33 checks/0 error) · LAN smoke ผ่าน (ข้อ 3) |
| เว็บส่วนตัว 6173 | **โหมด LAN** ที่ `http://192.168.1.101:6173/play` (และ `http://127.0.0.1:6173/play`) เซฟ rev 2092 บน `14ffbc71…`; เปิดด้วย `--refresh-migrate-saves --lan` · **รีสตาร์ตครั้งต่อไปต้องใส่ `--lan`** ไม่งั้นกลับเป็น loopback · อย่ารัน live test พร้อม deploy |
| ข้อมูล balance | `.local/balance/` (git-ignore, บนเครื่องนี้): `snap-{mage,thief}.json.gz` (snapshot ทุกด่านจาก journey 25 วัน), `pace-*.json`, `cal-*.txt` · หลักฐานถาวร `plan/evidence/balance/task-041-calibration-2026-10-21.json` |

### 2. สิ่งที่เปลี่ยนตั้งแต่ D-070 แยกตามระบบ

**ภาพการต่อสู้ (D-070, TASK-054)** — `src/renderer/{battle,actor-animation,damage-numbers,projectiles,impact-timing,pack}.ts`, `src/renderer/combat-visuals.json`, `plan/data/actor-presentations.json`
- อาวุธตาม `weapon_compatibility`; Monk (สนับมือไม่มีภาพ) วนท่า 86/94/46; อาชีพถืออาวุธใช้ท่าเดียวเพราะ overlay RO วาดในกลุ่มท่าเดียว
- ธนูปล่อย **frame 7** (`attack_release_frame`; 4–6 คือดึงสายสุด) และ `ActorAnimation.swing()` เร่งท่าเมื่อโจมตีถี่กว่าความยาวท่า
- ชื่อสกิลขึ้นทุก `cast_start` ≥1.5 วิ, เลข RO โค้ง/หด 0.8 วิ, เลขแดงฝั่งเรา (`frameStats.incoming`), STR จริงต่อฮิต (`impacts` key = presentation id), Bolt ตกจากฟ้า
- ไอคอนสกิลครอปตาม `sprite_sheet.frames[0]` ผ่าน `AssetPack.iconUrl()` (atlas 30×26 มีขอบ/คอลัมน์เกิน)

**คำขอระหว่างลองเล่น (D-071–D-073, D-075; TASK-055 AC-01–09)**
- รีเซ็ตเซฟลัดจากตั้งค่า (`BackupSheet focusReset`), ตัวกรอง Rarity/Level + "เลือกที่กรอง" (`backpack.tsx`), ป้ายเลือดต่อจากรอบก่อน (`daily.tsx`)
- **speed 1×/2×/4×**: `battle.advance.speed` → `calculateBattleCredit` (เวลาเกม = min(ขอ, ช่วงจริง×speed, 5000×speed)), `src/client/battle-speed.ts` (localStorage), `SpeedButton` ใน `field.tsx`
- ตัวละครใหญ่ขึ้น ~12% (`story.ts`, `farm-scene.ts`); ใส่สกิลแบบเลือกสกิลก่อน (`skills.tsx`, `placeSkill`/`removeSkill`); สถิติรายสกิลแบบซ่อน/แสดง (`ActorCombatStatistics.skills`, `SkillSplit`); หน้าตัวละครเรียงตัวในทีมก่อน (`RosterStrip`)
- UI audit ใน live (`UI_AUDIT`: 360/390/1280 × 9 หน้า ล้มถ้าป้ายปุ่มตัดบรรทัดหรือไอคอนช่องไม่อยู่กลาง), ป้าย Refine pill, แบนเนอร์กาชาอ่านจำนวน Option จาก content
- **D-075 เล่นจากมือถือใน LAN** — ดูข้อ 3

**ศัตรู/ด่าน (D-074 + TASK-041)** — `plan/data/enemies.json`, `plan/generators/stages.py`, `plan/generators/stages-spec.json` (calibration), `scripts/game/balance.ts`
- ท่าร่ายแรง = ทุกสกิลที่มี tag `heavy_cast`: Cataclysm (ทั้งทีม ×1), Doom (HP% ต่ำสุด ×2.5, Provoke ดึงได้), Twin Hex (`random_n` 2 คน ×1.6) ร่าย 4 วิ ขัดได้ ใช้แถว calibration เดียวกัน; บท 1 Cataclysm เสมอ บท 2+ หมุน (`heavy_skill`) 7 ด่านต่อท่า
- ปรับจูน 14 รอบบน snapshot ของ journey: ปกติ **101/104** ในแถบ 0.7–0.9 (เฉลี่ย 0.82), ท้ายบท **8/8** ในแถบ 0.55–0.8 (0.67), ร่ายแรง **16/21** หลัง D-074 (8/21 แพ้ถ้าไม่ขัด)
- ตัวปรับร่ายแรงใช้ค่าเฉลี่ยสองทีม (`bareMean`), ก้าว `cast_share` 0.05, ลด ATK (`heavy_atk_scale`) เมื่อยากเกินแม้ cast เบาสุด; รายงานพิมพ์ `bare` (เฉลี่ย) และ `bare_max`

**การจำลอง (TASK-041)** — `scripts/game/journey.ts`
- แก้บั๊กบอท: รับรางวัลดันทุกรอบ (คิว 32 เต็ม → `PENDING_REWARDS_FULL` → ไฟต์ค้าง → ทุกคำสั่งล็อก), `battleToEnd` retreat เมื่อ advance ถูกปฏิเสธ, เก็บทองเมื่อมีคนรอ Breakthrough (`gateWaiting`), progress/ETA ต่อวันทาง stderr, `--dump-final <path>`
- pace 25 วันสองทีม: จบเรื่อง **193/207 ชม.** (เป้า D-069 240 ชม.; บอทเล่นเกือบสมบูรณ์ จึงไม่ปรับอัตราฟาร์ม); บท 1–7 เร็วกว่าเป้า ~15–30%
- เทสต์ parity T029–T034 ย้ายไปด่าน 3-8 (fixture มีสมาชิก Lv.1 ไม่มีของสองตัว แพ้ 6-20 ใน 10 วิหลังปรับจูน — fixture ไม่ใช่สัญญาณบาลานซ์)

**บั๊กจริงที่แก้ (deploy แล้ว)** — schema `options.maxItems` 4→5 ใน inventory และ pending reward (Supreme D-068 มี 5 แถว) + เทสต์ผ่าน `validateAccount` จริง (mutation-checked); การ์ดหอคอยตาม tier มีเทสต์แล้ว (TASK-053 ปิด)

**เครื่องมือใน repo** — `scripts/m0_checks.sh`, `scripts/game/calibrate-rounds.sh` + `scripts/game/calibration_summary.py`, `scripts/game/journey-calibrate.sh`, `scripts/act_contact_sheet.py`

### 3. D-075 เล่นจากมือถือในวง LAN (ล่าสุด)

- ผู้ใช้ต้องการ `http://192.168.x.x:6173/play` แบบไม่ลงใบรับรอง เปลี่ยน bind อย่างเดียวไม่พอ เพราะ (1) build ฝัง Supabase URL `127.0.0.1` (2) หน้า http ที่ไม่ใช่ localhost ไม่มี `crypto.subtle`/`crypto.randomUUID`/Web Locks ซึ่งระบบเซฟใช้
- `scripts/play_local.py --lan`: gateway (`scripts/game/local-supabase-gateway.ts`, env `RO_GATEWAY_HOST=0.0.0.0`) ฟังทุก interface; Auth/PostgREST/Postgres/mail ยัง 127.0.0.1 และเข้าถึงได้ผ่าน path ที่ gateway proxy เท่านั้น; `GOTRUE_DISABLE_SIGNUP=true`; พิมพ์ `lan_url`
- `src/client/auth-config.ts`: `readPublicAuthConfig(env, window.location)` — build `local` ที่ชี้ loopback ใช้ origin ของหน้าเมื่อเปิดจาก `isPrivateLanHost` (RFC 1918/169.254/.local) เท่านั้น; production/test/public host ไม่เปลี่ยน
- `src/client/secure-context.ts`: `sha256Hex` (SubtleCrypto หรือ SHA-256 JS ที่ให้ผลเท่ากันทุก byte), `randomId` (randomUUID หรือ v4 จาก getRandomValues) แทนทุกจุดใน `src/client`/`src/ui`
- `src/client/save-browser.ts storageWriterLock`: ใช้เมื่อไม่มี Web Locks — lease localStorage ต่ออายุทุก 2 วิ หมดใน 6 วิ แท็บที่สองเป็น read-only เหมือนเดิม (server CAS ยังกันเซฟชน)
- ตรวจแล้ว: `tests/game/lan-play.test.ts` 4 ข้อ, live โหมดปกติ, LAN smoke ใน Chrome บน 192.168.1.101 (secure=false, ไม่มี subtle/randomUUID/locks, คำขอ auth ไป LAN origin, รหัสผิด → 400, 0 error) — **ยังไม่ได้ทดสอบล็อกอินจริง+เซฟบนหน้า http** (ห้ามใช้บัญชีส่วนตัวผู้ใช้ทดสอบ; รอผู้ใช้ลองบนมือถือ ถ้าจะทำ E2E ให้สร้าง stack แยกที่ build ด้วย `VITE_APP_ENV=local` แล้วเปิดผ่าน IP วง LAN)
- ความเสี่ยงที่ยอมรับ: รหัสผ่านวิ่ง http ใน Wi-Fi บ้าน (ผู้ใช้เลือกไม่ลงใบรับรอง) — เขียนเตือนใน `docs/LOCAL-PLAY.md` แล้ว

### 4. ข้อห้าม / invariant

- เวลาไฟต์บอสให้โดยเซิร์ฟเวอร์: speed คูณเฉพาะช่วงจริงที่ credit; lease/ticket/offline เป็นเวลาจริง
- ห้ามใส่ `attack_variant_indices` ให้อาชีพถืออาวุธ; ธนูปล่อย frame 7
- เลขขาออกตามตัวโฟกัส (`frameStats.damage`), เลขแดงแยก `frameStats.incoming`
- ท่าร่ายแรงเช็กด้วย tag `heavy_cast` เสมอ (ไม่ใช่ id Cataclysm); ดันรายวันเลือดสะสมทั้งวัน
- ตัวปรับจูนอ่านคอลัมน์ `mean` (สองทีม) ไม่ใช่ `win`
- ห้ามผ่อนกฎ https ของ production เพื่อ LAN; fallback crypto ต้องให้ผลเท่ากับ API จริง (มีเทสต์เทียบ node)
- ห้ามแก้ `src/` ระหว่าง live test; live shell ผูก tag `task-048` (เก็บสำเนา `task-048-r<เวลา>-*` ถ้าต้องรักษาหลักฐาน); อย่ารัน live พร้อม `play_local.py` refresh
- ห้ามพิมพ์ `.local/play/private.json`/`login.md`; ฮาร์เนส renderer รุ่นเก่าที่ขับ UI `/` เดิมใช้เป็น regression ไม่ได้

### 5. วิธีตรวจ / คำสั่ง

```bash
bash scripts/m0_checks.sh && npm run content:generate && npm run assets:build   # หลังแก้ plan/data หรือ presentation
npm test && npm run build
RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py   # ~12 นาที; RO_SHELL_ONLY_MODES=1 รอบสั้น ~5 นาที
ROUNDS=4 bash scripts/game/calibrate-rounds.sh                                            # ปรับจูนต่อ (≈2.5 นาที/รอบ) บน snapshot ใน .local/balance
python3 scripts/game/calibration_summary.py .local/balance/cal-final.txt
# เว็บส่วนตัว (ถามผู้ใช้ก่อน; หยุด pid ใน .local/play/running.pid ก่อน; คง --lan ไว้)
python3 scripts/play_local.py --refresh-compatible-snapshot --lan   # UI อย่างเดียว (content/migration/server code เท่าเดิม)
python3 scripts/play_local.py --refresh-migrate-saves --lan         # content หรือโค้ดฝั่ง server เปลี่ยน (สำรองก่อนเอง)
```

### 6. งานต่อไป (เรียงลำดับ)

1. รอผู้ใช้ลองบนมือถือ (D-075) และยอมรับ TASK-048 AC-08, TASK-054 AC-06, TASK-055 AC-06 → ย้าย done พร้อมหลักฐาน; ฟีดแบ็กความยากใหม่จากการเล่นจริงสำคัญกว่าตัวเลขบอท
2. **TASK-041 ที่เหลือก่อนปิด**: `scripts/game/matrix.ts` 20 seeds, story report 100 seeds, สรุปผลลงไฟล์งาน; ด่านร่ายแรงนอกแถบ (4-15/5-10 0.68, 7-10 0.93, 3-5 ไม่ขัดก็ชนะ) ปรับได้เฉพาะถ้าผู้ใช้ขอ (D-074)
3. ขอบเกมจริง: `pending_rewards` ครบ 32 → ไฟต์ settle ไม่ได้ ค้างจนถอยทัพ (UI แค่ toast "รับรางวัลที่ค้างไว้ก่อน") ควรกันตั้งแต่เริ่มไฟต์หรือรับอัตโนมัติ
4. TASK-042: bundle gzip ~422 KB > เป้า bootstrap 350 KiB (chunk content โตจาก D-068) — แยก chunk หรือแก้เป้าแบบมีเหตุผล
5. งานถัดไปตามกระดาน TASK-042–046 (TASK-043 ต้องขออนุญาตผู้ใช้ก่อนสร้าง infra ภายนอก)

## 20 ต.ค. 2026 ดึก · Claude Code — TASK-054 ภาพการต่อสู้ตรง RO (D-070)

### ทำอะไรไป

- ผู้ใช้แจ้ง 7 ข้อ (Monk ถือกระบอง, ท่าโจมตีท่าเดียว, ลูกธนูออกตอนง้าง, เอฟเฟกต์สกิลไม่ใช่ของจริงโดยเฉพาะ Bolt, ชื่อสกิลไม่ขึ้นถ้าไม่มีหลอดร่าย, เลขดาเมจควรโค้ง-หดแบบ RO และเร็วขึ้น, ฝั่งเราโดนตีไม่มีเลข) → [TASK-054](review/tasks_054.md) อยู่ `review` รอผู้ใช้ดูภาพ (AC-06)
- `plan/data/actor-presentations.json`: overlay ตาม `weapon_compatibility` (monk 너클, acolyte/priest 롯드, alchemist 클럽, assassin 단검 + attack 94→86), `attack_release_frame: 4` ให้ archer/hunter, `attack_variant_indices: [86,94,46]` ให้ monk → **content hash เปลี่ยนเป็น `51db6fd7…`**
- renderer: `presetSwing()` + `ActorAnimation.attackState()` (จำต่อ event), `attackContactMs(parts, state)` ใช้ release frame, `battle.ts` มี shouts/impacts/incoming numbers, `damage-numbers.ts` มี `numberFlight` และ kind `incoming`, `projectiles.ts` มี `path: 'sky'`/`shape: 'spear'`/`impactAt` และตรวจ `impacts`
- `src/renderer/combat-visuals.json`: `impacts` 28 presentation → 22 STR จริง, Fire/Cold Bolt เป็นหอกตกจากฟ้า, Lightning Bolt/Arrow Shower ไม่มี projectile แล้ว (STR เป็นตัวเล่า)
- `scripts/build_runtime_assets.py`: raw cap 27 MiB (D-070), initial profile นับ impact เฉพาะสกิล Lv.1 สี่สาย; pack ตอนนี้ 622 assets / 1129 files / 25.67 MiB raw / initial 1.56 MB, pack hash `75e103ee…`

### ตรวจแล้ว

- `npm test` 342/342, `npm run build` ผ่าน, `python3 -m unittest tests.test_runtime_assets tests.test_preparation_pack` 11/11, M0 checks + readiness ผ่าน
- `scripts/test_presentation_fidelity.cjs` (ใหม่) กับ Vite แยก port ผ่าน 3 checks: ทุกสกิลที่ใช้มีชื่อ (Bash 1.5 วิ), impact 7 ชนิดวาดจริง, ลูกธนู 9 ดอกออก 400–408 ms, monk วน 3 ท่า ภาพ `docs/screenshots/presentation-*.png`, หลักฐาน `plan/evidence/task-054-presentation.json`
- ฮาร์เนส renderer รุ่นเก่า (test_focus_impact/test_combat_polish/test_mobile_spatial/test_timeline_caster_polish) ขับ UI `/` เดิมที่มี `.companion` ซึ่งไม่มีแล้ว รันเป็น regression ไม่ได้ (ลองรันสำเนาจาก scratch root เพื่อไม่ทับหลักฐานเดิม)
- live shell suite ถูกผูก tag `task-048` ใน `test_auth_stack.py` จึงเก็บสำเนาหลักฐานรอบ 17:43 ไว้เป็น `plan/evidence/task-048-r1743-*` ก่อนรันใหม่

### ข้อควรรู้

- RO วาด overlay อาวุธในกลุ่มท่าโจมตีเดียว อย่าใส่ `attack_variant_indices` ให้อาชีพถืออาวุธ (เทสต์ใน `impact-timing.test.ts` จะจับ) Monk สนับมือไม่มีภาพ = ต่อยมือเปล่าแบบ RO
- STR sidecar ใหญ่กว่าภาพได้มาก (resurrection 280 KB, magnificat 132 KB) ก่อนเพิ่ม effect ให้ดู webp+meta และงบ 27 MiB; ACT sprite effect (fireball/icemine/soule) render ผิดสเกลใน `drawParts` ยังไม่ใช้
- bundle gzip ของ build ตอนนี้ 417 KB (เดิมสูงสุด 343 KB) ส่วนใหญ่จาก chunk content ที่โตตาม D-068 (138 KB gzip) เกินเป้า bootstrap 350 KiB ของ TASK-042 — TASK-042 ต้องแยก chunk หรือแก้เป้าแบบมีเหตุผล
- เว็บส่วนตัว 6173 อัปเดตแล้ว: `--refresh-migrate-saves` ย้ายเซฟ rev 806→807 (farm rate refreshed for 4-2) บน content `51db6fd7…` / pack `75e103ee…` แล้ว `--refresh-compatible-snapshot` อีกรอบหลังแก้ข้อความแบนเนอร์กาชา (UI อย่างเดียว)
- live shell suite (`RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py`) ผ่าน 27 checks / 55 ภาพ / 0 browser error รวมขั้น HEAVY_067 ครั้งแรก (3-5 intro + Cataclysm cast track) รอบแรกล้มที่ STORE เพราะบั๊กของผมเองในรอบก่อน: คำสั่งเติมทอง/คริสตัลใน MODES seed ไปอยู่ท้าย `//` comment จึงไม่รัน แก้แล้ว และ STORE/GEAR_PULL อ่านราคา/ของที่ได้/จำนวน Option จาก content แทนตัวเลขเก่า (ถุง EXP 3000, Immortal 3)
- แบนเนอร์กาชาอุปกรณ์เคยเขียนตายตัว "Legendary/Immortal 3 แถว" ตอนนี้สร้างจาก `random_options.lines_by_rarity` ผ่าน `optionLineSummary()` (มีเทสต์ใน gacha-shop)

### งานต่อไป

ดูส่วน 21 ต.ค. ด้านบน (รายการนี้ล้าสมัยแล้ว)

## 20 ต.ค. 2026 · Claude Code (ช่วงที่ Codex หมดโควตา)

### สถานะตอนรับงาน

- Codex จบ TASK-028 และรีเฟรชเว็บส่วนตัวเรียบร้อย ไม่มีงานค้างใน `inprogress/` หรือ `review/` และไม่มีโค้ดที่แก้ค้างไว้ครึ่งทาง
- ตรวจซ้ำแล้ว: typecheck ผ่าน, `npm test` 233/233

### คำขอใหม่ของผู้ใช้ (บันทึกแล้วใน decisions)

- **D-051**: ปรับ UX/UI `/play` ให้เหมือนเกมมือถือ (อ้าง Ragnarok Idle Adventure) ผู้ใช้วาด layout ของแต่ละหน้ามาเอง รายละเอียดทั้งหมดอยู่ใน [design30](design/30-game-shell-ui.md)
- **D-052**: Mobile First **แนวตั้งเท่านั้น** ไม่มี layout แนวนอน มือถือที่ถือแนวนอนจะเห็นข้อความให้หมุนเครื่อง ส่วน desktop แสดงกรอบแนวตั้งกลางจอ

### สิ่งที่ทำ = TASK-048 (อยู่ใน `plan/review/tasks_048.md`)

| ส่วน | ไฟล์ |
| --- | --- |
| Game shell ใหม่ของ `/play` | `src/ui/game/` — `shell.tsx` (save session/route `?v=&c=`/submit/toast/rotate lock), `hud.tsx`, `nav.tsx`, `field.tsx` (ฉากฟาร์ม, ไฟต์บอส, การ์ดผลลัพธ์, แผนที่, หีบ AFK), `buddy.tsx` (ช่องอุปกรณ์ 3+3, Upgrade/Change/Character sheets, roster strip), `skills.tsx`, `stats.tsx`, `backpack.tsx`, `team.tsx`, `onboarding.tsx`, `kit.tsx` (ชิ้นส่วนกลาง, ป้ายภาษาไทย, ActorCanvas, Sheet, CostChips), `game.css` |
| Route | `src/ui/main.tsx`: `/play` → `game/shell.tsx`; `/roster` ที่ตั้งค่าบัญชีแล้วจะส่งต่อไป `/play?v=buddy` ส่วน sandbox (ไม่มีบัญชี) ยังใช้ `roster-page.tsx` เดิม |
| ลบไฟล์ | `src/ui/story-page.tsx`, `story-fight.tsx`, `story.css` (ไม่มีใครใช้แล้ว) |
| ฉากฟาร์มหน้าหลัก | `src/client/farm-scene.ts` (`FarmWaveSession`, `farmSceneStage`, `farmWaveRows`) + `tests/game/farm-scene.test.ts` |
| Helper ที่แยกออกมา | `src/client/story.ts`: `sceneLabels`, `partyNames`, `partyAppearances`, `battleRenderView` · `src/client/equipment.ts`: `itemModifiers`, `rarityRank` |
| Renderer | `battle.ts`: `scroll` (ฉากเลื่อนแบบ mirror tile) และ `zoom` (กล้อง) ใช้เพื่อแสดงผลเท่านั้น · `pack.ts`: `currentScene` สำหรับสลับเพลง · `shell.ts`: อ่านไอคอนและ skin มอนจาก pack |
| Asset | `src/renderer/shell-visuals.json` (ไอคอนเมนู `ro_menu_icon`, ไอคอนทรัพยากร, skin มอนฟาร์ม 48 ตัวใน 8 บท) · `scripts/build_runtime_assets.py` อ่านไฟล์นี้เข้า `index.shell` · pack ตอนนี้มี 319 IDs / 638 files / 23.07MB (งบ 25MiB) |
| เว็บเล่นส่วนตัว | `scripts/play_local.py --refresh-compatible-snapshot` (ดูหัวข้อด้านล่าง) |
| ทดสอบในเบราว์เซอร์ | `scripts/test_game_shell_live.cjs` และ `scripts/test_auth_stack.py` รับ `RO_LOCAL_TEST_FOCUS=shell` |
| เอกสาร | decisions D-051/D-052, design30 (ใหม่), แก้ design09/10, TASK-039/042, overview, design README, LOCAL-PLAY, AGENTS.md |

### กติกาที่ต้องรักษาไว้ (สำคัญ)

- **content_hash ต้องเป็น `65b82feb21f654bb17521bdc4417245c630d0cf6f0149f5877ab93b5ec3b9dc2` เท่าเดิม** hash นี้คิดจาก engine data (ไม่รวม presentations, `reference_profiles`, ชื่อ, ฉาก) + schema + โค้ดใน `src/content`, `src/contracts`, `src/domain`, `src/simulation` ดังนั้นงาน UI ให้แก้แค่ `src/ui`, `src/client`, `src/renderer` และ asset pack เท่านั้น ถ้าไปแตะ contracts/domain hash จะเปลี่ยน แล้วเซฟของผู้ใช้จะเปิดกับ snapshot ใหม่ไม่ได้ (การย้ายเซฟเป็นงาน TASK-040)
- **ฉากฟาร์มเป็นแค่การแสดงผล** รัน `createBattle/advanceUntil` ตัวเดิมกับทีมในเซฟ เจอแถว `enemy_add_*` ของด่าน (เฉพาะ 1-1 ที่ไม่มีลูกน้อง จึงใช้บอส×0.25 HP/×0.6 ATK ตามค่าใน `shell-visuals.json`) ไม่ส่ง command และไม่แก้ state รางวัลยังมาจาก `farm.claim` ตามเวลาเท่านั้น ห้ามนำผลฉากนี้ไปใช้เป็นหลักฐานบาลานซ์
- `plan/data/progression.json` → `reference_profiles.mobile.landscape_css` ถือว่ายกเลิกแล้วตาม D-052 แต่ยังไม่ได้แก้ไฟล์ เพราะ `generate-content.ts` ตรวจ hash ของ M0 input ถ้าแก้ต้อง re-review manifest
- ผู้ใช้ถือว่า UI ของผู้ช่วยปรับได้ ส่วนที่ผู้ช่วยตัดสินใจเองอยู่ในตาราง design30 (ผสม rarity/อัป Tier อยู่ในกระเป๋าเพราะ Crafting ยังล็อก, ปุ่ม Upgrade รวมเลเวล/Breakthrough/เปลี่ยนอาชีพ/รีเซ็ต ฯลฯ)

### วิธีตรวจ

```sh
npm run typecheck && npm run boundaries && npm test          # 237/237 (มี farm-scene เพิ่ม 4)
npm run assets:check && npm run build                        # build ผ่าน; คำเตือน chunk>500kB มีมาก่อนแล้ว และเป็นงาน TASK-042
python3 -m unittest tests.test_runtime_assets && node --test tests/renderer.test.mjs
RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py
```

คำสั่งสุดท้ายเปิด Auth/PostgREST/PG แยกบน loopback สร้างบัญชีใหม่ แล้วเล่นตั้งแต่สร้างตัว → ฟาร์มเดิน → ท้าบอส 1-1 → รับรางวัล → หีบ AFK → Buddy/ช่อง/Upgrade/Change → Stats (ลง INT) → Skill → กระเป๋า → ทีม → จอ 360/1280 → มือถือแนวนอน/แนวตั้ง ผลล่าสุดผ่าน 9/9 ไม่มี browser error ดู [shell-live](evidence/task-048-shell-live.json) และ [review](evidence/task-048-review.json) ภาพอยู่ที่ `docs/screenshots/task-048-*.png`

สคริปต์ `scripts/test_{story,roster,skills,equipment,slots,gear_growth,save}_live.cjs` ยังใช้ selector ของ UI เก่า จึงรันกับ `/play` ใหม่ไม่ได้แล้ว เก็บไว้เป็นหลักฐานของ TASK-022–028 ถ้าจะเขียน flow ใหม่ ให้ต่อจาก `test_game_shell_live.cjs`

ข้อควรระวังตอนเขียนเทสต์และ UI:

- แท็บที่ล็อกใช้ `aria-disabled` จึงต้องกดด้วย `{ force: true }`
- sheet มี animation ประมาณ 0.22 วินาที ถ้าจะถ่ายภาพ ให้รอประมาณ 350ms ก่อน
- `ActorCanvas` วาดโดยเอาเท้าไว้ที่ `footY` ถ้า `scale × ~82px` สูงกว่า `footY` หัวจะโดนตัด
- ฟาร์มกับบอสใช้ `AssetPack` ตัวเดียวกัน (`background`/`actors` มีชุดเดียว) จึงต้องเรียก `prepare` ใหม่ทุกครั้งที่สลับฉาก ตอนเปิดหน้าอื่นหรือถือมือถือแนวนอน ฉากจะหยุดวาด (`covered`)

### เว็บเล่นส่วนตัว (http://127.0.0.1:6173)

- อัปเดตแล้วสองรอบด้วย `--refresh-compatible-snapshot` คำสั่งนี้จะยอมสร้าง snapshot ใหม่ทั้งที่มีเซฟอยู่ก็ต่อเมื่อ content_hash, ไฟล์ migration, `api/`, `src/server/` และ gateway ตรงกับของเดิมทุก byte ก่อนทำจะ `pg_dump` ไว้ที่ `.local/play/backups/before-compatible-snapshot-refresh-*.sql` และย้าย snapshot เก่าไปไว้ที่ `.local/play/archives/`
- เซฟของผู้ใช้อยู่ที่ revision **79** (ตอนส่งงาน) ตอนตรวจได้แค่ล็อกอินแล้วเปิดดู ไม่ได้ส่ง command ใดๆ
- บริการที่รันอยู่เปิดแบบ detached (`nohup`, PPID 1) แทนตัวเดิมที่ Codex app-server เคยเปิดไว้ PID อยู่ใน `.local/play/running.pid` และ log อยู่ใน `.local/play/service.log` ถ้าจะ refresh อีก ให้ kill PID นั้นด้วย TERM แล้วรันคำสั่งเดิม (เช็กก่อนว่าไม่มี `active_battle`)
- ห้ามพิมพ์เนื้อหาของ `private.json` หรือ `login.md` ออกมา

### รอบแก้หลังผู้ใช้ทดลอง (ยังเป็น TASK-048)

- หน้าจัดทีม: เดิมเป็นคอลัมน์เหลื่อมกัน ปรับเป็นตาราง 2×2 (`.formation-grid`) หัวคอลัมน์ "แนวหลัง | แนวหน้า"
- หน้าสถิติ/Timeline ในไฟต์: เดิมไม่มีสไตล์ เพราะ CSS อยู่ใน `adventure.css`/`modern-theme.css` ที่ story-page เก่า import ไว้ ตอนนี้ย้ายไปไว้ใน `game.css` และ scope ใต้ `dialog.sheet` แล้ว
- ปุ่มถอยทัพกระพริบ: หลังส่ง command ทุกครั้ง `SaveController.reconnect()` จะตั้งสถานะ `loading` ชั่วครู่ (boss clock ยิงทุก 1 วินาที) ตอนนี้ field นับ `loading` เป็น online และปุ่มถอยทัพใช้ `context.submitWhenReady` ซึ่งรอให้ writer ว่างก่อนส่ง ปุ่มอื่นที่ต้องกดระหว่างไฟต์ควรใช้วิธีเดียวกัน
- ไอคอนอาชีพ (D-053): `src/ui/game/class-icon.tsx` เป็น emblem SVG ที่วาดเอง ไม่ใช่ asset ของ RO

### รอบแก้ที่ 2 หลังผู้ใช้ทดลอง (D-054)

- **รับรางวัล AFK:** `farm.claim` เป็นแค่ทางหนึ่งที่สร้าง pending claim ยังมี `farm.set_stage` และการชนะบอสที่ settle ช่วงฟาร์มเป็น claim `farm_<request_id>` ด้วย ตอนนี้ `FarmSheet.collectAll` รับทุก claim ตามลำดับ และหยุดทันทีที่โดนปฏิเสธ (เช่น `INVENTORY_FULL`)
- **WARNING ก่อนบอส:** อยู่ใน `field.tsx` (`BossIntro`, state `intro`) ขึ้นก่อนส่ง start และไม่หน่วง battle clock ส่วนชื่อบอสมาจาก `storyBossLabel` ใน `client/story.ts`
- **ระดับเสียง:** slider ใน `hud.tsx` เขียนลง `ro-idle.audio-levels.v1` ผ่าน `saveAudioLevels` ห้ามแก้ `DEFAULT_AUDIO_LEVELS` ใน `src/contracts` เพราะ content_hash จะเปลี่ยน
- **เทสต์:** หีบ AFK ที่มีรางวัลค้างจะเด้งตลอด เทสต์จึงต้องกดด้วย `{ force: true }`

### หมวก/ผ้าคลุมบนตัวละคร (D-055)

- `shell-visuals.json` → `wardrobe`: `job_class_sprite` (19 อาชีพ → class_sprite เกาหลีของ RO), `head[tier][gender]` และ `garment[tier].rows["class_sprite|gender"]` ครบ 38 ชุดต่อ Tier
- ฝั่ง client มี `wardrobeTiers(state, id)` ใน `client/equipment.ts` เติม `head_tier`/`garment_tier` ลงใน `partyAppearances` และ `lookOf(a, state)` ส่วน renderer ใช้ `wardrobeRefs` ใน `shell.ts` และ `AssetPack.actor` กับ `ActorCanvas` จะโหลด headgear/garment เพิ่ม (`native.mjs` วาดได้อยู่แล้ว)
- ห้ามแก้ `ActorAppearance` ใน `src/contracts` เพราะจะทำให้ hash เปลี่ยน ให้ใช้ type ขยายฝั่ง renderer (`WardrobeTiers`) แทน
- Pack ตอนนี้ 479 assets / 845 files / 24.1MB เหลือที่ในงบ 25MiB ไม่มาก ถ้าจะเพิ่ม asset อีกต้องระวัง (TASK-042 เป็นเจ้าของงบนี้)

### รอบแก้ที่ 3 (D-056) — หน้าจอเท่านั้น content_hash เท่าเดิม

- **หน้าตาบอส:** `shell-visuals.json` → `boss_pools` บทละ 5 ตัว ใช้ผ่าน `bossSkin` (renderer) และ `stageBossSkin` (field) โดย `SavedBattleSession(payload, state, skinFor)` เปลี่ยนแค่ body_meta/ชื่อ ด่านท้ายบทยังใช้บอสต้นฉบับ
- **ฟาร์มตามด่านล่าสุด:** อยู่ใน receipt effect ของ `Field` ส่งคำสั่ง `farm.set_stage` (ผ่าน `submitWhenReady`) เมื่อชนะด่านใหม่ และจุดฟาร์มเดิมเป็นด่านก่อนหน้าหรือยังไม่ได้ตั้ง
- **Timeline ในหน้าสกิล:** ใช้ `previewStorySession(clone with draft)` กับ `SkillTimeline` เดิม และ `AssetPack.prepareIcons` (โหลดเฉพาะไอคอน ไม่สลับฉาก)
- **เมนูดันเจี้ยน:** `dungeon.tsx` ตอนนี้เป็น hub ที่ล็อกไว้ รอทำ TASK-035/036
- **Refine:** `UpgradeSheet.refineNow` อ่าน `context.lastCode()` ถ้าได้ `REFINE_FAILED` จะแสดงเอฟเฟกต์พลาด (ต้องรอกติกาใหม่ตาม D-057 ก่อนถึงจะมีกรณีนี้)
- **Pack:** 519 assets / 25.39MB จากงบ 26.21MB (97%) แทบเต็มแล้ว

### TASK-049 กติกา D-057 (done) — content_hash เปลี่ยนเป็น `01876ded…`

- **ตัวสร้างข้อมูล:** ก่อนหน้านี้ไม่มีสคริปต์สร้าง `stages.json` เลย ตอนนี้มี `plan/generators/stages.py` (+ `stages-spec.json` เก็บส่วนที่คนเขียนเอง) โดยโหมด `--legacy --check` ยืนยันว่าสูตรสร้างไฟล์ 8×10 เดิมได้ตรงทุก byte (hash อยู่ใน `stages-legacy-sha256.txt`) และ `plan/generators/status_points.py` ปรับ progression.json แบบรันซ้ำได้ ส่วน `levels.py` เรียก `--check` ของทั้งสองโหมด
- **ด่าน:** layout `{1:10,2:10,3:10,4:20,...,8:20}` อยู่ใน generator (`LAYOUT`, บทอนาคต 50) ระดับเลเวลใช้ `8c−4+floor(6i/N)`, HP ใช้ `(7+10i/N)`, บอสท้ายบท = i==N และรางวัลคูณ 10/N
- **Refine:** `slot-progress.json` → `success_chance_by_target`/`pity` ตัวนับอยู่ที่ `slot_progress[slot].refine_failures` (เพิ่มใน schema ทั้ง 6 ช่องแล้ว) `applySlotCommand(..., roll)` รับค่าสุ่มจาก `time.battle_seed` ใน `commands.ts` ส่วน preview ส่ง 0 (สำเร็จ) และ sandbox ใช้ `Math.random`
  - ตีได้ทีละขั้น (`REFINE_ONE_STEP`)
  - ถ้าพลาด receipt เป็น committed โดยมี `REFINE_FAILED`
  - เทสต์ใช้ seed `SUCCESS=634785765` (สุ่มได้ 0) และ `FAIL=1568006588` (สุ่มได้ ~0.995)
- **Status:** แต้มรวมอยู่ใน `level_rows.total_status_points` ส่วนโบนัสอยู่ที่ `combat-rules.json` → `primary_milestone_bonus` ซึ่ง `resolveStats` อ่านไป และ `combat.py` คำนวณซ้ำแบบเดียวกัน
- **ด่านตรวจ M0:** แก้ `levels/progression/combat/classes/architecture.py` ถ้าแก้ข้อมูล M0 อีก ให้รันตามลำดับนี้
  1. รันตัวตรวจทุกตัว ได้แก่ `progression --write-report`, `combat --write-report`, `classes`, `equipment`, `economy`, `levels`, `ui --write-report`, `architecture --write-report`, `composition --write-report`
  2. `node plan/checks/build_manifest.mjs`
  3. `python3 plan/checks/readiness.py` (สคริปต์นี้**เขียนทับ** `evidence/task-014-review.json` ทุกครั้ง)
  4. `npm run check`
- **readiness:** ตอนนี้รองรับงานหลัง 047 (ต้องมี ID ต่อเนื่อง) และนับเกณฑ์ตรวจรับจาก acceptance-cases จริง งานใหม่ต้องเพิ่มแถวลงทั้ง `acceptance-cases.json` และ `acceptance-matrix.md`
- **เซฟส่วนตัว:** เปลี่ยน content แล้วเซฟเก่าใช้ไม่ได้ ผู้ใช้เลือกเริ่มใหม่ จึงรัน `play_local.py --reset-saves-for-new-content` ไฟล์สำรองอยู่ที่ `.local/play/backups/before-new-content-reset-*.sql` และ `game-saves-before-new-content-reset-*.json` (เซฟ #461)
- **ข้อควรระวัง:** การแก้โค้ดใน `src/domain` / `src/contracts` / `src/content` / `src/simulation` ทุกครั้งจะเปลี่ยน content_hash และทำให้เซฟส่วนตัวใช้ไม่ได้ ก่อนแก้ต้องถามผู้ใช้ หรือทำเครื่องมือย้ายเซฟ (ส่วนหนึ่งของ TASK-040) ก่อน

### TASK-050 เครื่องมือย้ายเซฟ (D-058, done)

- **วิธีอัปเดตเว็บส่วนตัวแบบปกติ:** `python3 scripts/play_local.py --refresh-migrate-saves` (ต้อง kill PID ใน `.local/play/running.pid` ก่อน แล้วรันแบบ nohup) คำสั่งนี้
  1. ทำ `pg_dump`
  2. รัน `npm run build`
  3. export เซฟเป็น JSON
  4. ใช้ `scripts/game/migrate-local-saves.ts` (โค้ดใหม่) สร้าง SQL ถ้าเซฟใดไม่ผ่าน `validateAccount` จะ**หยุดก่อนเปลี่ยน snapshot**
  5. เปลี่ยน snapshot แล้วรัน migrations
  6. รัน SQL ที่สร้างไว้
- `src/domain/account/migrate.ts` แปลงเฉพาะสิ่งที่รู้จัก: `refine_failures`, งบ Status, ด่านหรือฟาร์มที่ไม่มีแล้ว และจบไฟต์ค้าง ถ้าเปลี่ยน schema แบบอื่นในอนาคต ต้องเพิ่ม transform ที่นี่พร้อมเทสต์ใน `tests/game/save-migration.test.ts`
- ทดสอบครบวงจรได้ด้วย instance ชั่วคราว: `RO_LOCAL_PLAY_ROOT=$PWD/.local/e2e RO_LOCAL_PLAY_PORT=6299` อย่าใช้ path ยาวๆ เพราะ PostgreSQL socket จำกัดไว้ 103 ตัวอักษร
- `--refresh-compatible-snapshot` ยังใช้ได้ แต่ `--refresh-migrate-saves` ครอบคลุมกว่า ส่วน `--reset-saves-for-new-content` ใช้เมื่อผู้ใช้สั่งให้เริ่มใหม่เท่านั้น

### TASK-029 สกิลสาย Swordsman/Knight/Crusader (done) — content_hash เป็น `5302fe90…`

- engine แบบ generic รองรับทุก effect/status ของสายนี้อยู่แล้ว จึงไม่ต้องเพิ่ม hook เฉพาะ งานหลักคือพิสูจน์ด้วยเทสต์ที่รันข้อมูลจริง
- ไฟล์ใหม่ `src/domain/build/queue-trace.ts` (`catalogQueueTrace`) เป็น dry trace แบบ pure ใช้ค่าพลังถาวรกับ Passive ที่เรียนแล้ว ไม่รวมบัฟชั่วคราว และตรงกับ `queue_estimate` ของ M0 การเพิ่มไฟล์นี้ใน `src/domain` ทำให้ content_hash เปลี่ยน
- **harness ร่วมสำหรับ TASK-030–034:** `tests/game/class-skills.ts`
  - `checkGolden` เทียบ `plan/data/skill-program-cases.json` กับนิยามที่ resolve แล้ว ถ้าเจอ key ที่ยังไม่ได้เขียนตัวตรวจ (เช่น `periodic_raw_intents`, `tick_times_ms`, handler `own_statuses_consumed`) จะ fail ทันที สายอื่นต้องเพิ่มตัวตรวจตรงนี้
  - `probeActive` ร่ายทุกเลเวลใน probe 2v2 แล้วตรวจว่าทุก effect เกิดกับเป้าที่ถูกและตามลำดับ ตอนนี้รู้จัก event ของ damage/apply_status เท่านั้น ถ้าเป็น heal/shield/resource/remove/interrupt/revive/handler/summon ให้ขยายฟังก์ชัน `index`
  - `probePassive` ตรวจทั้ง modifier และ trigger ส่วน `buildAccount` สร้างตัวละครจริงจากบิลด์ใน `plan/data/skills/<root>.json` ซึ่งไม่ได้ ship ใน content และผ่าน `validateAccount`
- แม่แบบเทสต์อยู่ที่ `tests/game/skills-swordsman.test.ts`
  - ตั้ง `RO_TREE_EVIDENCE=plan/evidence/task-0XX-runtime.json` เพื่อบันทึกค่าที่วัดได้
  - AC-04 ขับ `battle.start_story`/`battle.advance` จริง พร้อม `SavedBattleSession.confirm` และ runner
- ข้อควรระวัง:
  - `assert.ok` ที่ไม่มีข้อความทำให้ Node ใช้เวลาหลายนาทีสร้างข้อความ error จากบรรทัดยาว ให้ใส่ข้อความทุกครั้ง
  - บิลด์ (`builds`) และ `skill-program-cases.json` ไม่ได้อยู่ใน content bundle ต้องอ่านจาก `plan/data`
- ยังไม่ได้ทำ:
  - เอฟเฟกต์ในสนามยังใช้ recipe ตามกลุ่ม (burst/buff) ร่วมกัน ส่วนไอคอนแยกรายท่าแล้ว ถ้าจะทำ VFX เฉพาะท่าก็เป็นงาน presentation ล้วน
  - ค่า role ใน evidence เป็นหลักฐานพฤติกรรม ไม่ใช่ผลบาลานซ์ แทงก์ Lv70 ที่ไม่มีของตายใน probe ส่วนนี้ส่งต่อ TASK-041

### รอบต่อมา (20 ต.ค. 2026): D-059 เริ่มไม่มีของ, D-060 ไอคอนขัดร่าย, การ์ดล้น, TASK-030–031 เสร็จ

- **D-059:** `progression.json` ตั้ง `starter_gear.mode=none` และ `equipment.json` ตั้ง `starter_grants.scope=none` ทำให้ `initializeAccount` สร้างช่องว่างทั้งหมด (`slot_progress` ยังครบ) เทสต์ที่ทดสอบกลไกอุปกรณ์ใช้ `tests/game/gear-fixtures.ts` (`equipStarterSet`) ใส่ชุดเดิม id `starter_<ตัวละคร>_<ช่อง>` ให้แทน เซฟเก่าไม่ถูกยึดของ ทีม Lv1 ที่ไม่มีของแพ้บอส 1-10 แต่ Lv3 ผ่าน
- **D-060:** `cast_start` มี `action_id` = cast token และ `cast_interrupt` อ้าง `action_id`/`source_instance_id`/`detail`(ผู้ขัด) ส่วน heal/shield/resource/status/revive มี `action_id`/`source_instance_id`/`effect_id` ครบ Timeline (`src/client/battle-timeline.ts` + `src/ui/skill-timeline.tsx`) ใส่ ⚡ ให้ผู้ขัดและ ✕ ให้ผู้ถูกขัด
- **การ์ดล้น:** `.roster-strip` เป็นกริด 4 คอลัมน์ live test ตรวจว่าไม่มีการ์ดล้นกรอบ
- **harness:** `tests/game/class-skills.ts` รองรับ heal/shield/revive/ลูกแก้ว/periodic golden, `buildActor(root,…)`, `checkDryTraces`, `storyParity` แล้ว สายที่เหลือคือ TASK-032 (Mage), 034 (Merchant: ต้องทำ summon actor factory ที่ engine ยังโยน `MISSING_ACTOR_FACTORY`) และ 033 (Thief: copy skill, detonate)
- **ทีมเริ่มต้น** คือ main, npc_swordsman, npc_acolyte, npc_archer ดังนั้น parity ของสาย Mage/Thief/Merchant ต้องสลับ npc ของสายนั้นเข้าทีมก่อน

### รอบยาว 20 ต.ค. 2026 (ผู้ใช้สั่ง "ทำระบบต่อยาวๆ ให้เล่นได้ครบรวมร้านค้า แล้วค่อย simulate ปรับบาลานซ์/level design")

- **D-061 โบนัสอาชีพ:** `progression.json status_allocation.job_bonus_by_root` (+24 แต้มต่อสาย) ใส่เป็น permanent source ใน `characterBlueprint(actor, content, permanent)` (signature เปลี่ยน ต้องส่ง content) หน้า Stats แสดง "+N" สีเขียว `plan/generators/queue_estimates.py --write/--check` คำนวณ queue estimate ของบิลด์ใหม่ classes.py รวมโบนัสแล้ว
- **สกิลครบ 6 สาย (TASK-029–034 done):** harness `tests/game/class-skills.ts` + `tests/game/skills-<root>.test.ts` ทั้งหมด ตั้ง `RO_TREE_EVIDENCE` เพื่อเขียน `plan/evidence/task-0XX-runtime.json` สคริปต์ปิดงานที่ใช้อยู่ใน scratchpad ไม่ได้อยู่ใน repo (ปิดงานด้วยมือได้ตามแบบ TASK-029)
- **engine ใหม่:** summon factory (`kind:'summon'`, periodic policy, `summon_tick/summon_expiry`, ถูก sweep ออกจาก checkpoint, จุดพิกัดคงที่ในฉาก, render view `summon_of`), event `summon/despawn`, ทุก effect event มี `action_id/source_instance_id/effect_id`, `ModeRespawn` ให้ mode ส่งบอสหลอดถัดไป
- **โหมด:** `src/domain/modes/tower.ts` (TASK-035) และ `src/domain/modes/daily.ts` (TASK-036) คำสั่ง `battle.start_tower/start_daily` + settlement ใน `battle.advance`/`battle.retreat` ทุกจุดที่เดินไฟต์ต้องส่ง `modePolicy(mode, content)` (server, `SavedBattleSession`, Timeline, runner ใส่แล้ว) วันใช้ `bangkokDay(ms)` แบบ pure (ห้ามใช้ Date ใน domain) หน้า UI `tower.tsx`, `daily.tsx`, `GameContext.challenge(target)` เริ่มไฟต์จากหน้าอื่นผ่าน Field
- **live test:** ขั้น `MODES` ใน `scripts/test_game_shell_live.cjs` ใช้ `scripts/game/sign-test-save.ts` (test-only, ต้องมี `RO_SUPABASE_LOCAL_STACK=1`) เขียนเซฟที่ผ่าน 2-10 แบบลงลายเซ็น แล้วเล่น Tower ชั้น 1 และ Daily treasury ผ่าน UI จริง
- **งานใหม่:** TASK-051 ร้านค้า+กาชาอุปกรณ์ (D-063), TASK-052 Option สุ่มตามระดับ (D-062) ลำดับถัดไปที่วางไว้: TASK-052 → TASK-037 กาชาการ์ด → TASK-051 → TASK-038 AFK → TASK-039 → TASK-040 → TASK-041 balance

### ปิดงานรอบ 20 ต.ค. 2026 (ต่อ): TASK-035/036/037/039/040/051/052 → done (45/52)

- **live test ชุดเต็ม** `RO_EVIDENCE_PREFIX=task-048 RO_LOCAL_TEST_FOCUS=shell python3 scripts/test_auth_stack.py` ผ่าน 26 checks / 53 ภาพ / 0 browser error (`plan/evidence/task-048-shell-live.json`) มีขั้นใหม่ `FLOW_039` (อัปเลเวล/สกิล/คิว/ทีมผ่าน UI, ขาดเน็ต, โฟกัส, Hi-class) และ `BACKUP_040` ถ้าจะรันเร็วเฉพาะ Tower→Store→Flow→Backup ใช้ `RO_SHELL_ONLY_MODES=1`
- **บั๊ก daily ค้างใน live รอบก่อนไม่ใช่บั๊กเกม**: เกิดจากแก้ไฟล์ src ระหว่างที่ stack รัน (Vite HMR ทิ้ง SaveController/AssetPack) ห้ามแก้ src ระหว่าง live test และใน live test ก่อนแก้ DB ตรงต้องออกจากหน้าเกม (`about:blank`) กันคำสั่งอัตโนมัติ (เช่นย้ายด่านฟาร์ม) ชน revision
- **TASK-039:** `battleDebrief` + `Debrief` (สรุปรายคน), `src/client/guide.ts nextGuide` (quest pill "แนะนำ" จำการปิดใน localStorage `ro-guide-seen`), ชิป Hi-class "เร็วๆ นี้" ในชีต Upgrade, เทสต์ `tests/game/debrief.test.ts`, `tests/game/guide.test.ts`
- **TASK-040 / D-064 สำรอง-กู้คืน:** migration `supabase/migrations/202610200006_save_backups.sql` (ตาราง `game_save_backups` อ่านได้เฉพาะเจ้าของ + `game_commit_maintenance` สำรองแถวเดิมก่อนเขียนเสมอ เก็บ 10 ชุด) คำสั่งใหม่ `save.migrate`, `account.reset` (+เดิม `backup.restore_request` ใช้ `history:N` เมื่อเซฟเสีย หรือ `backup:<uuid>` ย้อนรีเซ็ตครั้งเดียว) จัดการใน `api/index.ts maintenance()` ไม่ผ่าน `decide()` ตัวกันอยู่ใน `src/domain/account/maintenance.ts` (AFK cursor/ตัวนับรายวันไม่ย้อน) ไฟล์สำรอง/สรุปเซฟ `src/domain/build/save-summary.ts` (client ใช้ผ่าน `src/client/backup.ts`, API ใช้ผ่าน re-export ใน account) UI: ตั้งค่า › 💾 สำรอง/กู้คืน (`src/ui/game/backup.tsx`) และ `MaintenancePanel` (checkpoint 409 `SAVE_MIGRATION_REQUIRED` มี before/after, 503 `SAVE_INTEGRITY_FAILED` มี candidate) คู่มือผู้เล่น `docs/SAVE-RECOVERY.md` เทสต์ `tests/game/save-backup.test.ts` + SQL ใน `supabase/tests/storage_ownership.sql`
- **ระวัง:** `scripts/test_storage_postgres.py` เขียนทับ `plan/evidence/task-021-postgres.json` ทุกครั้ง (ตอนนี้เป็นผลรันใหม่ที่รวม migration 001–006 สำเนาอยู่ที่ `task-040-postgres.json`)
- **content_hash ล่าสุด `5b194302…`** (มีคำสั่งใหม่) เว็บส่วนตัว 6173 deploy ด้วย `--refresh-migrate-saves` หลังปิด TASK-040

### งานต่อไป

1. **TASK-048 AC-08 รอผู้ใช้ดูหน้าตาจริง** ถ้าโอเคย้าย `plan/review/tasks_048.md` → `plan/done/` แก้ลิงก์/ตัวเลขใน overview และ acceptance แล้วติ๊ก AC-08
2. **TASK-041 (ถัดไป ผู้ใช้สั่งไว้แล้ว):** simulate แล้วปรับบาลานซ์ + level design ใช้ runner headless (`src/simulation`) กับทีม/บิลด์จริง วัดเวลาเคลียร์ด่าน/ความชันของบอส/อัตราฟาร์ม เทียบเป้า pace ใน design (ปรับทีมได้ราว 30 นาทีครั้ง เป้าใหญ่หลายวัน) เปลี่ยนตัวเลขใน `plan/data/*.json` แล้วรัน M0 checks + manifest + readiness ก่อน `content:generate`
3. TASK-042 ขนาดโหลด/ความลื่น/จอ, TASK-043 build/deploy Vercel Preview **ต้องขออนุญาตผู้ใช้ก่อนสร้าง infra จริง**, 044 RC, 045 production, 046 ส่งมอบ
4. ทุกครั้งที่ deploy เว็บส่วนตัวให้หยุด PID ใน `.local/play/running.pid` แล้วรัน `python3 scripts/play_local.py --refresh-migrate-saves` (สำรอง DB ก่อนเสมอ) ห้ามพิมพ์ `.local/play/private.json`/`login.md`
