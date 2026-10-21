# Story ฟาร์ม และหน้าต่อสู้จากเซฟ

20 ตุลาคม 2026 · TASK-025 · รุ่น Class2/Lv70 ยังต้องเติมผลเฉพาะสายและตรวจbalanceในM3/M4

## เจ้าของกฎและข้อมูล

`modes/story.ts` ให้ข้อมูลด่าน/สิทธิ์เข้า/บอสเดี่ยว/frozen farm snapshot `build/story.ts` compileทีมจากตัวละคร/อุปกรณ์เริ่มต้น/สกิลที่เรียนและ authored enemy stats; ไม่ใช้สูตรเติบโตผู้เล่นแทน enemy bases `AccountCommandRules` ประสานสิ่งเหล่านี้กับ shared engine และ reward reservation ก่อน atomic commit ตัวเดียว ไม่มีสูตรเงินหรือผลชนะใน SQL/renderer

`ActorInput/BattleInput` ย้ายมาเป็น public types ใน contracts/battle-input.ts; combat re-exportของเดิมเพื่อไม่ทำให้runner/fixturesแตก buildไม่ import combat กลับจนเกิดวงจร module

Actor build fingerprints สร้างจาก canonical character/equipped instances/content hash ฝั่งAPI ส่วน battle ID/seedมาจากserver randomแล้วเก็บในcheckpoint Runtime/simulationรับ input/seed เดียวกันได้ ไม่มีDOM/Audio/Date/global randomในpure rules

## คำสั่ง

| Intent | การทำงาน |
| --- | --- |
| battle.start_story | ต้องผ่านด่านก่อนหน้า/ไม่มีactive battle/ทีมถูกต้อง; สร้างทีมHP-SPเต็มและqueueใหม่, หนึ่งboss,90s,SI3s/NA1.5s, spatial positions/rangesจริง |
| battle.advance | ให้เวลาไม่เกิน DB elapsed/max5000ms; restore/advance engine แล้ว checkpoint หรือ settleผลterminal |
| battle.retreat | ลบpointer/checkpoint ไม่ปลดด่านหรือจ่ายรางวัล; retryฟรีและสร้างทีมใหม่เมื่อเริ่มครั้งหน้า |
| farm.set_stage | ต้องผ่านด่านนั้น; จองช่วงที่ยังไม่ได้รับจากsnapshotเดิมก่อนเปลี่ยนsnapshot/cursorใหม่ |
| farm.claim / reward.claim | ใช้protocol23เดิม จองfixedbundleและcursorก่อนจ่ายwallet/itemsครั้งเดียว |

ชัยชนะให้ firstclearตามaccount+stageหนึ่งครั้ง เก็บpending fixed reward พร้อมsource story/battle แล้วปลดด่านในtransactionเดียว ไม่มีรางวัลซ้ำจากการตีด่านเดิมหรือkillในฉาก แพ้/หมดเวลาล้างactive pointerโดยไม่คืนทุนหรือแจกของ ตัวหลักล้มคนเดียวไม่แพ้ ต้องทีมหมดหรือ90sตามengine

การจบด่านครั้งแรกปิดช่วงfarmเดิมด้วยsnapshotเก่าก่อนใช้unlockใหม่ (ore/essenceหลัง1-5,enchantหลัง2-5) เลือกfarmเดิมต่อเว้นแต่เพิ่งเปิดครั้งแรกจึงเลือกด่านที่ชนะ ค่าdrop tier/weights/pool15นิยามอยู่ในfrozen snapshot ไม่มีcrystalจากfarmและไม่มีauto-level

Migration005ขยายlease checkให้ครอบคลุมterminal deleteด้วย: proposalที่คำนวณตอนleaseยังใช้ได้แต่รอDBจนหมดleaseต้องไม่ปลดด่าน/ลบcheckpoint/เพิ่มreceipt

## หน้าเว็บและการพยากรณ์

`/play` เมื่อมีAuthconfigใช้เซฟจริง ไม่มีconfigให้ลิงก์ไปสนามทดลอง/roster sandbox ไม่สร้างcloudปลอม `/`ยังเป็นสนามทดลองอิสระ

หน้าต่อสู้ใช้native renderer/ตัวเลข/เสียง/Timeline/สถิติเดิม ทีมและรูปลักษณ์มาจากเซฟ เลือกgender presetและซ่อนweapon attachmentเมื่อไม่มีอาวุธ ตัวละครเดินตามshared spatial simulation ใช้positionเป็นจุดเกิด ไม่ล็อกฉาก

SavedBattleSessionเป็นpredictionสำเนาเพื่อให้ภาพเคลื่อนทุกframe ระหว่างรอHTTPackใช้engineเดียวกัน จำกัดระยะพยากรณ์ไม่เกินconfirmed+5s และ replayจากconfirmed checkpointตรวจcanonical stateเมื่อackมา ไม่อัปwallet/ปลดด่านจากprediction รางวัลแสดงจากreceipt/cloudเท่านั้น เกมจริงเดิน1×ตามเวลาDB; accelerated/headlessยังเป็นsimulationแยกจากdurable progress

Online-primary ใช้useAccountSave lifecycleเดียวกับAuth/roster สร้างbackup+intentก่อนnetwork หนึ่งwriter, pauseเมื่อoffline, visibility/refresh/reconnectคืนผ่านcloudและretreatactive battle ไม่จำลองชนะบอสย้อนหลัง Farmสะสมจากcursorตามเพดาน12hต่อได้

## ขอบเขตที่ต้องตรวจ

Pure testsสร้างshape/profileบอสเดี่ยวครบ80template แต่ไม่ได้ยืนยันว่าทุกด่านสมดุลหรือทุกclass-specific effectเสร็จ การคัดbossเดี่ยวเปลี่ยนtemplateที่เคยมีaddsตามD-040 ต้องวัดใหม่ในTASK-041 อุปกรณ์ที่compileตอนนี้คือbase equipped definitions/rarity; inventoryUI/slot investmentsครบเป็นTASK-026/027

Browser walkthroughต้องเริ่มบัญชีใหม่จริงโดยไม่seedreward/level: สร้าง→สู้→ฉีดlost terminal response→refresh/receipt→รับfirstclear→farm→อัป/ลงแต้ม→ตีซ้ำไม่ได้เงิน→refreshกลางด่านถัดไปไม่ปลดด่านเอง พร้อมภาพ360/390และเสียง/Timeline Boundary main-death/defeat/90s/lateSQL ใช้server-owned fixturesแยกและบอกขอบเขตตรงตามจริง ไม่มีhosted/Vercelหรือphysical device evidenceในlocalชุดนี้
