# ด่าน โหมด และเป้าหมาย encounter รุ่นแรก

19 ตุลาคม 2026 · TASK-011 · ตัวเลขและจำนวนเนื้อหาเป็น assistant baseline ภายใต้ขอบเขต Class2/Lv70; ยังไม่ผ่านการวัดผลเล่นจริง

> **D-057 (TASK-049):** Story เปลี่ยนเป็นบท 1–3 = 10 ด่าน, บท 4–8 = 20 ด่าน (130 ด่าน), บทอนาคต 9+ = 50 ด่าน สร้างด้วย `plan/generators/stages.py` (สูตรเดิมแต่ใช้ 6i/N และ 7 + 10i/N, บอสท้ายบทอยู่ด่านสุดท้าย, รางวัลแรกผ่านคูณ 10/N ให้ยอดต่อบทเท่าเดิม) ตัวเลข 80 ด่าน/10 ต่อบทด้านล่างเป็นประวัติก่อน D-057

## Story

[stages.json](../data/stages.json) กำหนด8บท×10ด่าน=80ด่าน แต่ละentryมี encounter actors/stats/skill slots/positions, prerequisite, recommended level, background/music local refs, firstclear reward/farmchapter และ targetเวลาที่จะวัด Recommended levelไม่ใช่ gateห้ามเข้าและไม่เพิ่มStatusให้ผู้เล่นอัตโนมัติ ศัตรูใช้ authored base statsที่แยกจากสูตรเติบโตของผู้เล่น

กดสู้บอสเพื่อท้าด่านปัจจุบัน ด่านที่10แต่ละบทเป็นbossเด่นพร้อมสองแนวตอบโต้; example skillsไม่บังคับและตรวจว่าunlockทันrecommendedlevelแล้ว ทุกfirstclearเป็นaccount+stageครั้งเดียว retryฟรี/เริ่มทีมHP-SPเต็มโดยไม่ยกbuffจากไฟต์เก่า เมื่อเคลียร์80ด่านเข้าfree farm/Tower/dailyต่อรอHi-class ไม่มีการเปิดHi-classก่อนแพตช์

[enemies.json](../data/enemies.json) มี11archetypes, สกิล8นิยามรวมoptional adaptiveCCpassive และ telegraphtext/recipeแยกสูตร การร่ายยาวมีแถบ/เสียงเตือนเพื่อให้ผู้เล่นอ่านจังหวะแล้วไปจัดคิว/ความเร็วในการลองรอบหน้า ไม่เพิ่มAIถือท่าขัดไว้รอcast บอสบางตัวให้CCresistanceหลังโดนCCสำเร็จตามbaseline16; ตัวอื่นchainได้ปกติ ไม่มีglobalimmunity

แนวโจทย์แปดบท: เรียนรู้แนวหน้า/quake → โจมตีถี่และพิษ → เวทหมู่ที่ขัดได้หรือรับให้ไหว → บัฟเกราะที่ใช้armorbreak/เวท/Dispelแก้ → แรงเวทกับshield/recovery → enrageที่สะสมตามinstance → silenceที่NormalAttackยังทำงาน → bossท้ายที่เลือกCCผสมดาเมจหรือเล่นป้องกัน/ฟื้นฟูและburst

เวลาStory90,000ms; winเมื่อฝ่ายศัตรูที่นับชัยชนะตายหมดก่อนlimit แพ้เมื่อทีมสี่คนตายหมดหรือtimeout ตัวหลักตายคนเดียวไม่จบ ถ้าตายพร้อมหมดทั้งสองทีมผู้เล่นแพ้ Damageตรง90,000msไม่ทันเพราะtimeoutphaseมาก่อน ตามbaseline15

เป้าหมายเมื่อใส่Commontierที่เลเวลใส่ได้ ลงstat/skillภายในงบเท่ากัน: บท1–2เคลียร์ประมาณ5–35วินาที (intro1-1ประมาณ1–6วินาที) บท3–8ประมาณ20–85วินาที วัดmedianของรอบชนะจาก500matchedseedsและอัตราชนะอย่างน้อย80%โดยมีsurvivorอย่างน้อยหนึ่ง ไม่บังคับrarecard/อาชีพเดียว Referenceสองทีมเริ่มจากmainMage+Sword/Aco/Archer กับmainThief+Merchant/Aco/Archer แล้วเลือกสาขาที่ปลดแล้วเท่านั้น Targetsเป็นเกณฑ์ของ TASK-041 ไม่ใช่ผลคำนวณDPSหรือผลจำลองที่ผ่านแล้ว

## Infinity Tower

[tower.json](../data/tower.json) ปลด2-10 มี100rowsเริ่มต้นเพื่อreview และใช้generatorเดียวต่อชั้น101ขึ้นไป ไม่มีชัยชนะจบที่100/ไม่มีreset ศัตรูหมุนห้าarchetypesและแปดskillpatterns D-114/TASK-085 HP=`600+100f+8f²+2f³`, ATK=`ceil((20+4f+f²)/2)`, DEF/MDEF=`5+3f` Common primaryทั้งหก=1, ASPD/CastSpeed100, SP100, elementneutral/ตำแหน่งfront1; level=`min(70,f)` ไม่ใช่การเพิ่มplayercap

ผลครบphase/restrictionsเหมือนStory; optionaladaptiveเฉพาะfloorหาร20ลงตัว Rewardfirstcleargold100+15f, crystal10ทุก5ชั้น และcardBronzeหนึ่งinstanceทุก10ชั้นสุ่มจากpool18ใบด้วยclaimseedที่บันทึกไว้ IDsaccount+floorกันจ่ายซ้ำ จำนวนชั้นเป็นsafeintegerและตรวจnumericresultก่อนสร้างencounter ถ้าเกินโดเมนตัวเลขให้diagnosticไม่ปล่อยoverflowเป็นเงินหรือHPผิด

## ดันรายวัน

[daily-bosses.json](../data/daily-bosses.json) ปลด1-10 มีTreasury/Forge/Essenceอย่างละ3attemptsต่อวัน วันตามserver00:00Asia/Bangkok หนึ่งattempt60วินาที จองattemptแบบatomicก่อนเริ่มแล้วไม่คืนเมื่อหนี/หลุด/แพ้ Snapshothighestchapterอย่างน้อย2ตอนเข้าbossนั้นครั้งแรกของวัน

Phasep: HP=`(5000+1500(p−1))×(1+.2(chapter−2))`, ATK=`30+5(p−1)`, DEF/MDEF=`40+10(p−1)` Common primary/speed/SP/elementเหมือนTower; level=`min(70,10+8chapter)` แต่ละphaseเลือดเต็มที่เพิ่มขึ้นทันทีเมื่อหลอดเดิมหมด โดยไม่resetทีม/clock/seed ดันไม่ตัดสินwinแบบordinaryenemyall-deadที่จุดเปลี่ยนphase ตัดสินสิ้นสุดattemptเมื่อ60วินาที/ทีมตาย/retreatแทน

แต่ละหลอดปลดchestครั้งเดียวตาม `(account,boss,ticket_day,phase)` Rewardbaseของแต่ละbossอยู่ในข้อมูล คูณ`1+.2(p−1)`และfloorทีละcurrency HPที่เหลือ/phaseสะสมอยู่ระหว่างattempt; ทีมเริ่มHP/SPเต็มในattemptใหม่ ไม่มีดาเมจบอสจากoffline

ถ้าเริ่ม23:59:45แล้วจบ00:00:45 ผลทั้งหมดผูกticket_dayเดิมเท่านั้น เก็บส่วนเก่าต่างpartitionเพื่อรับchestได้โดยไม่เขียนทับHP/attemptsของวันใหม่ วันใหม่phase1/attempts0 เงื่อนไขdisconnect/checkpoint/expiryรับตอนTASK-013; การปิดหน้าไม่สร้างattemptใหม่หรือชุบทีมในticketเดิมฟรี

## Runtime contract และการตรวจ

Modecontrollerเป็นpure rulesร่วมกับengine: Tower/dailyเติมresolved basesจากformula+commondefaultsที่ระบุ; dailyphaseclearเข้าmodecontinuationก่อนterminalcheck จึงไม่จบหลังchestแรก Bossphase/token/lifeepochเปลี่ยนแต่partyclockและstatusยังเดินปกติ การสร้างphaseต่อเป็นข้อมูล/eventที่replayได้ ไม่รอภาพตาย/DB callbackตัดสิน

`python3 plan/checks/levels.py` ตรวจ80stages, enemies/skill schemas/local media hashes, solutionsกับunlock, 90sboundary/bothwipe, Towergenerator และcross-midnightphase cases หลักฐานยังไม่ใช่runtimeM1/M4; ต้องทดสอบTTK/อัตราชนะ/สองแนวแก้ด้วยmatchedseeds/equalbudgetsเมื่อมีrunner


D-114 (22 ต.ค.2026): ผู้ใช้รายงานชั้น21กับทีมLv.30ง่ายเกินไป เส้นเดิมให้HP6,228/ATK52และATKเพิ่มแค่2ต่อชั้น โดยStoryผ่านcalibrationแต่Towerยังใช้baselineแรก จึงเพิ่มHPcubic/ATKquadraticผ่านgeneratorเดียว ไม่เพิ่มเกราะ/ความเร็ว/CCอีกชั้น ตัวเลขใหม่ชั้น1=710/13,21=24,750/273,30=64,800/520,50=275,600/1,360,100=2,090,600/5,210 (HP/ATK) เป็นtrialbaseline ไม่อ้างผลsimulationหรือทีมจริงของผู้ใช้

`plan/generators/tower.py --check` ตรวจ100rowsจากdata.generator; runtime `towerRow`ใช้coefficientsเดียวรวมdivisor/ceilและปฏิเสธunsafeintermediateก่อนround ไม่wrap/Infinity/NaN ไม่มีfloorcap100หรือเพิ่มเลเวลผู้เล่นชดเชย คง40s/รางวัล/claimonce/ชั้นที่ผ่าน/reload/skillcycle/CCresistanceเดิม เซฟเก่าใช้backup+contentmigrationตามflowเดิม ไม่รีเซ็ตTower
