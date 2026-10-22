# สูตรและไทม์ไลน์ต่อสู้รุ่นตั้งต้น

19 ตุลาคม 2026 · TASK-002 · rules version `combat-baseline-v1`

เป็นแบบที่ผู้ช่วยเลือกจากข้อยืนยันใน [decisions](../decisions.md) ใช้กับ [combat-rules.json](../data/combat-rules.json) และ [reference cases](../data/combat-cases.json) ไม่ใช่สมการที่ถอดจาก RO Idle Adventure Plus ตัวเลข/ลำดับในหน้านี้เป็น baseline สำหรับ TASK-047/003–013 และต้องพิสูจน์ runtime/headless ใน M1 ก่อนวัด balance ใน M4

## ค่าพื้นฐานและหน่วย

ใช้ L=character level, STR/AGI/VIT/INT/DEX/LUK เป็นค่าหลัง primary modifiers ทุกตัวรวม main/NPC ใช้ฐานเดียวกัน ไม่มีการแจก primary stats/ความเร็วตามอาชีพอัตโนมัติ:

| Derived stat ก่อน modifiers ของ derived | สูตร |
| --- | --- |
| PATK | 30 + 4(L−1) + 2STR + DEX |
| MATK | 30 + 4(L−1) + 3INT |
| MaxHP | 200 + 25(L−1) + 20VIT |
| MaxSP | 60 + 3(L−1) + 4INT |
| DEF | 10 + 2(L−1) + 2VIT |
| MDEF | 10 + 2(L−1) + 2INT |
| ASPD rating | 100 + (AGI−1) + 0.25(DEX−1) |
| Cast Speed rating | 100 + 1.5(DEX−1) + 0.25(INT−1) |

แต่ละ stat รวม flat แล้ว additive percent ใน bucket ของตน: `(base + sum(flat)) × (1 + sum(percent))` ทำ primary ให้จบก่อน derived และไม่คิดผล primary ซ้ำอีกครั้งหลังแปลง บัฟรวมแบบบวกไม่มี cap/soft cap และคนเดิมร่ายซ้ำเพิ่ม independent instance ตาม D-037/038

Primaryชั่วคราวมี lower bound0; derived attack/DEF/MDEFขั้นต่ำ0, MaxHPขั้นต่ำ1/MaxSPขั้นต่ำ0และปัดfloorหลังรวม modifiers, speed ratingsขั้นต่ำ1 ไม่มี upper boundต่อผลรวมบัฟ ค่าสถานะอื่นยังเก็บเศษเพื่อคำนวณก่อนปัด HP/SP amountท้าย pipeline

เวลาเป็น integer game milliseconds, HP/SP เป็นจำนวนเต็ม, ratio0.20หมายถึง+20% Probability มีขอบเขต0–1ตามนิยาม เวลา intervalใช้ ceil และขั้นต่ำ1msตามความละเอียด clock ส่วน CT/ACD ที่ฐาน0คง0 ไม่เพิ่ม cooldown รายสกิล ค่าคำนวณไม่ finite/เกิน precision ที่รองรับต้องรายงาน diagnostic ไม่ตัดบัฟทิ้งหรือ clamp ให้ดูเหมือนสำเร็จ

MaxHP/SP เพิ่มไม่เติม resource ปัจจุบันฟรี: รักษายอดเดิมและ clamp ลงเมื่อ max ลด; การ heal/restore ต้องผ่าน effect โดยตรง สิ่งนี้ป้องกันเปิด/ปิดบัฟเพิ่ม max เพื่อปั๊ม HP/SP

## ความเร็วและการพัก clock

```text
SI = NAI = max(1, ceil(1500 × 100 / max(1, ASPD)))
CT = 0 ถ้า baseCT=0 มิฉะนั้น max(1, ceil(baseCT × 100 / max(1, CastSpeed)))
ACD = 0 ถ้า baseACD=0 มิฉะนั้น max(1, ceil(baseACD × 100 / max(1, CastSpeed)))
```

SI กับ Normal Attack Interval เป็นคนละ clock แม้ฐานรุ่นแรกเท่ากัน ใช้ความเร็ว snapshot ตอนเริ่ม **แต่ละช่วง** SI/CT/ACD/NAI บัฟกลางช่วงไม่คำนวณเวลาที่เหลือใหม่ มีผลเมื่อเริ่มช่วงถัดไป ค่า1msเป็นความละเอียดเวลา ไม่ใช่เพดานจำนวนชั้นบัฟ

- ก่อนสกิลแรกเริ่ม SI; จากนั้น CT→resolve→ACD→SI ของช่อง Active ถัดไปที่ไม่ว่าง
- ช่องว่างสแกนข้ามไม่เกิน4ช่องก่อนเริ่ม SI; ทั้งสี่ว่างเป็น normal-only ไม่มีวงข้ามสล็อตที่เวลา0 สกิลอ้างหาย/ยังไม่เรียนเป็น validation error
- ถึง action gate แล้ว SP ไม่พอ ข้ามช่องนั้นโดยไม่จ่าย แล้วเริ่ม SI ของช่องถัดไป ไม่รอสะสม SP เพื่อค้างท่านั้น
- Cast start ใช้ช่อง/หัก SP ครั้งเดียว ปล่อยตามคิว ไม่มี AI ถือฮีลไว้รอ HPต่ำ
- SI/ACD เดินระหว่าง Stun พอครบก็ ready รอ action gate; หายแล้วเริ่มเมื่อใช้ได้ ไม่รอ SIใหม่ ไม่กินช่องที่ยังไม่เริ่ม
- ถูก interrupt ระหว่าง CT ให้ invalidate cast token เริ่ม ACD ณ ตอนถูกขัด แล้ว SIต่อ ทั้งสองเดินระหว่าง CC ไม่มีการคืน SP/ย้อนช่อง และ event resolve เก่าถูกละทิ้ง
- Normal Attack ทำใน SI/ACD; CT หยุด clock โดยเก็บเวลาที่เหลือแล้ว resume เมื่อ CTจบ ถ้าพร้อมพอดีตอนเริ่ม CT ให้ cast ชนะ และ NAเริ่มได้เร็วสุด1msหลัง CTจบ แม้ CT=0
- ขณะ CC ที่ไม่ใช่ CT, NA clockเดินจน readyได้แต่ยิงไม่ได้ รอ action restrictions หมด มีเพียงหนึ่ง pending attack ไม่ยิงหลายครั้งชดเชย
- Silence ห้าม start สกิลแต่ไม่ห้าม NA; Freeze/Stun และ on-damage break เป็น catalog TASK-047 ไม่สั่งเลื่อน/ย้อนคิวพิเศษ

ทุก skillระบุ `interruptible` ค่าเริ่มต้นtrue ถ้าfalse Direct interrupt/CCไม่ยกเลิก CTที่เริ่มแล้วและร่ายจบได้ถ้ายังมีชีวิต แต่ CCยังห้ามเริ่ม actionใหม่/NAตาม restrictions การรับดาเมจปกติอย่างเดียวไม่ขัดร่ายเอง

## Hit, Crit และดาเมจ

```text
pHitPhysical = clamp(.95 + .002(casterDEX−targetAGI)
                     + .001(casterLUK−1) + hitBonus − evasionBonus, 0, 1)
pCrit = clamp(.05 + .008(casterLUK−1) + critBonus
              − .003(targetLUK−1) − targetCritResistance, 0, 1)
critMultiplier = max(1, 1.5 + .005(casterLUK−1) + critDamageBonus)
```

Normal/physical skill critได้เป็นค่าเริ่มต้น Magical skill/DoT/HoT/heal/reflect critไม่ได้ เว้นแต่ definition/trait ระบุ eligibility ใหม่ เวทปกติ hitแน่นอน ไม่ใช้ FLEEกายภาพโดยอัตโนมัติ Physical roll hit ต่อเป้า/hit; roll crit เฉพาะ hitที่เข้าและเข้า eligibility คริไม่ข้าม DEF/MDEFเอง multi-hitใช้ coefficient **ต่อ hit** ไม่คูณจำนวน hitทั้งในสูตรและที่ตัววนซ้ำ

CC apply chanceใช้ `clamp(baseChance + controlAccuracy − targetControlResistance,0,1)` โดยไม่ลด durationพื้นฐาน บอสไม่มี resistanceพิเศษถ้าไม่มีข้อมูล/Passiveกำหนด เมื่อ CCapplyสำเร็จแล้วจึงใช้ triggerเพิ่ม resistanceของครั้งถัดไปใน TASK-047 ไม่ลดเวลาของ CCที่ติดแล้ว

ลำดับต่อ hit:

```text
raw = attackStat × perHitCoefficient + flatPower
power = max(0,raw) × max(0,1+outgoingBonus) × elementMultiplier × critFactor
D1 = max(0, targetDEF × (1−armorBreak))
eDEF = max(0, D1 × (1−penetrationPercent) − flatPenetration)
armor = 1 − .90 × eDEF/(eDEF+400)
afterArmor = max(0, power × armor − flatDamageReduction)
beforeShield = floor(afterArmor × max(0,1−guardPercent)
                       × max(0,1+damageTakenBonus) + 1e−9)
```

เวทใช้ MATK/MDEF ธาตุอ่าน matrix10×10ใน JSON ชุดเดียวกับUI ตาม D-120/TASK-091 ใช้ตาราง Ragnarok Origin จากภาพในคู่มือ ROO Global ไม่มี element level เพิ่ม วงน้ำ→ไฟ→ดิน→ลม→น้ำคือ1.75, ธาตุเดียวกันสี่ธาตุพื้นฐานเหลือ0.25 และทิศกลับอ่านรายคู่ (ไฟ→น้ำ0.80 แต่น้ำ→ลม0.90) Holy/Dark/Undead/Ghostดูค่ารายคู่ในข้อมูล ไม่ฝังเงื่อนไขชื่อสกิลในengine; อัตรา1.25/0.75เดิมเป็นประวัติ ถูกแทนที่ด้วยตารางนี้แล้ว

Guardรวมแบบบวกไม่มี cap เช่น1.20ยังคงเป็น120%ใน sources แต่ damage multiplierมี lower bound0ตามนิยาม ไม่ปล่อยให้ติดลบแล้วกลายเป็น heal ARMOR curveกับขอบเขต probabilityเป็นกติกาของสมการ ไม่ใช่การจำกัดจำนวน/ผลรวมบัฟ

หลังปัดครั้งเดียว โล่ดูดซับตาม poolที่หมดอายุเร็วสุด แล้ว instance ID ที่เสถียร HP lossจริงไม่เกิน HPปัจจุบัน และ overkillแยก metrics Shieldแต่ละ application มีอายุ/ยอดเหลือของตนไม่ใช่ MaxHP modifier

## Healing และการฟื้น resource

```text
rawHeal = floor(max(0, healStat × coefficient + flatHeal)
                 × max(0,1+outgoingHealBonus) × max(0,1+healingReceivedBonus)+1e−9)
effectiveHeal = min(MaxHP−currentHP, rawHeal)
overheal = rawHeal−effectiveHeal
SPregen/1000ms = floor(max(0,2+.02MaxSP+.02(INT−1)+flatSPRegen) × max(0,1+SPRegenPercent))
HPregen/1000ms = floor(max(0,flatHPRegen+MaxHP×HPRegenPercent))
```

ไม่มี natural HPregen ในไฟต์ถ้าไม่มี sourceเพิ่ม SPregenเดินได้ระหว่าง cast/CCแต่ไม่ทำงานหลังตาย ก่อนไฟต์ใหม่ฟื้นเต็มตาม P-02/P-07 Healเป้า HP%ต่ำสุดยังร่ายเมื่อทุกคนเต็ม ลงผล0 effective/ทั้งหมดเป็น overheal ห้ามเลือกท่าอื่นแทนเพราะประเมินว่าฮีลไม่คุ้ม

## Snapshot และเป้าหมาย

- Caster offense/resolved skill และ SPก่อนหัก snapshot ที่ cast start ทำให้บัฟต้องทันก่อนเริ่มร่ายเพื่อเสริมท่านั้น Target defense/guard/vulnerability/shields อ่านตอนแต่ละ hitลง
- Selectorปกติ resolve ที่ cast resolveครั้งเดียวต่อ binding: front-first, lowestHP%, all-living ใช้ actor IDตัดสินเท่ากัน Provokeมีผลเฉพาะ selectorที่อนุญาต
- เป้าที่คิดไว้ตอนเริ่มตายไปแล้วให้ใช้ selectorเดิมเลือกจากผู้ยังมีชีวิตตอน resolve ถ้าไม่มีเป้า castยังถือว่าใช้ไปแล้ว ไม่มี refund/effect; bindingที่ประกาศ lock/event_targetไม่ retargetเงียบ ๆ
- DoT/HoT/fieldเลือกรูป snapshot/live ตาม catalog ไม่มีการสืบทอด crit/hitจาก hitต้นทางโดยอัตโนมัติ
- ผลบนเป้าหมาย keyed action/effect/target/hit เงื่อนไข hitของAไม่ถูกใช้กับB การโดนโล่รับหมดเป็น landedแต่ HPdamage0 ซึ่ง procต้องกรองตามนิยามของมัน
- บัฟจาก casterที่ตายปกติอยู่จนหมดอายุ เว้นแต่ definitionเป็น owner-bound aura/summon พอจบไฟต์ล้าง transient cast/events/status/shield/summonทั้งหมด ไม่เอาบัฟเก่าไปข้ามไฟต์

ส่วนเพิ่มเติมจากข้อมูล Class2: หลังปัด mitigation ก่อน shield ให้ผ่าน optional Devotion routing ตาม `combat-rules.json.damage_redirect` และ [class contracts](17-class-content-contracts.md) เพียงหนึ่งครั้ง Transferรักษาผลรวมดาเมจและไม่คิดDEF/crit/guardซ้ำที่ผู้รับ ไม่มี effectนี้ไฟต์ใช้ pipelineเดิม

## เหตุการณ์เวลาเดียวกัน

1. เมื่อ `t >= mode time limit` ให้ timeout ก่อนเหตุการณ์ที่ timestampนั้น ดาเมจตรง90,000msจึงไม่ชนะ Storyย้อนหลัง
2. หมดอายุ status/โล่ก่อน tick ที่เวลาเดียวกัน ช่วงคงอยู่เป็น `[apply, expiry)` ไม่มี tickที่ตรงexpiry
3. Periodic regen/ticks ที่ยังมีผล จากนั้น commit deaths ก่อน cast completion
4. ล็อก cast completion ที่ valid/aliveทั้งหมด ณ timestampนั้น แล้ว resolve programs ตาม actor/action IDs ที่เสถียร การขัด/ตายจาก completionอื่นใน batchไม่ยกเลิก castที่ล็อกแล้ว
5. Drain reaction events ตามลำดับ จากนั้น commit death reactions/cleanup/checkผลทีม ถ้าทั้งสองฝ่ายตายหมดผู้เล่นแพ้ HP0ไม่ใช่เป้า ordinary heal แม้ death cleanupยังรอ barrier จึงไม่เกิด reviveแฝง; ข้อยกเว้น locked completionมีไว้ให้โปรแกรมที่เริ่มส่งออกแล้วทำงานได้เท่านั้น
6. Actorที่ readyเริ่มสกิลตามลำดับ รวม CT0ที่ start/resolveได้ทันที ตามด้วย NAที่อนุญาต โดย cast startชนะการตรงเวลากับ NA
7. Drain reactions/commit deaths/checkผล และไปเวลาเหตุการณ์ถัดไป

การขัดที่มาจาก cast completionอื่น ณ เวลาเท่ากันจึงช้าเกินไปสำหรับ castที่ล็อกแล้ว แต่ขัดก่อนเวลาจบหรือจาก periodicก่อน phaseล็อกยังได้ โปรแกรม effectเรียงตามข้อมูล reactionsเข้าคิวและ drainที่ phase boundary ไม่ใช้ callback/การวาด/networkตัดสิน ไม่มีการเพิ่มคิวชดเชย actorหลังถูกหยุด

## RNG, replay และขอบเขตของหลักฐาน

ใช้ lcg32-v1: `state=(1664525×state+1013904223) mod 2^32`, `u=state/2^32`; TSใช้ Math.imul/unsigned32 เก็บ state+drawCount seed0ใช้ได้ ทุก attempted probabilityใช้หนึ่ง drawแม้ chance0/1 ส่วน predicatefalse/เป้าข้าม/critที่ไม่เข้าeligibilityไม่ draw

Replayระบุ schema/content hash/rules/RNG versions และเก็บ clock/phase/cursor/phase deadlines/paused NA/cast tokens/status instances/pending events/sequence/RNG state รุ่นไม่รองรับต้องคืน incompatible ไม่ใช้รุ่นล่าสุดแทน

Public APIที่ให้ TASK-013/015–018 ลงชนิดข้อมูล/implementation ต่อ:

```ts
createBattle(input: BattleInput, content: ValidatedContent, seed: UInt32): BattleState
advanceUntil(state: BattleState, toGameTimeMs: GameMs, limits: StepLimits): BattleStep
// BattleStep = { state, events, terminalResult? }; no persistent account mutation
```

BattleInputมี actor IDs/build snapshots/ตำแหน่ง/ศัตรู/โหมดและ versions; BattleStateเก็บข้อมูลที่ serialize/replayได้ตามรายการ restore_fields ใน JSON GameMsเริ่ม0ต่อไฟต์ แยกจาก serverเวลา AFK Rendererอ่าน events/view state ส่วน wrapperเป็นผู้แปลงเวลาจริงที่ผ่านไปเป็น toGameTimeMs; coreไม่เรียก Date/RAF/Supabase เมื่อถูกพักจาก applicationจึงไม่แอบสร้าง progressionต่อ

Guard max1,000,000events/ไฟต์หรือ reaction depth32 ใช้จับวงไม่จบและคืน diagnosticพร้อม input/seed ไม่ใช่กฎตัด buff/procเงียบ ๆ จนดูสมดุล เครื่องมือ M0ตรวจตัวอย่างด้วยการคำนวณอิสระเท่านั้น ยังไม่ได้สร้าง scheduler/core/game renderer

อ้างหลักฐาน [task-002-review.json](../evidence/task-002-review.json) และคำสั่ง `python3 plan/checks/combat.py --write-report` ส่วน primitive/status/formula signatures/schema เป็นงานต่อ TASK-047
