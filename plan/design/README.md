# สเปกที่ใช้เป็นหลักหลัง M0

| ส่วน | เอกสารหลัก |
| --- | --- |
| release/level/manualpoints/Breakthrough/refund | [09](09-release-scope.md) + progression.json |
| math/timing/equal-time/RNG | [15](15-combat-baseline.md) + combat-rules.json |
| effects/status/modifiers/triggers/variants | [16](16-composition-baseline.md) และschemas/catalogs |
| selectedclasses/skillcosts/learnedpassives/redirect | [17](17-class-content-contracts.md) + skills/ |
| equipment/cards/farm/loot/gacha/pace | [18](18-equipment-and-rewards-baseline.md) และdata tables |
| Story/Tower/daily/encountertargets | [19](19-encounters-and-modes-baseline.md) และmode data |
| UI/actions/network/recovery flows | [10](10-ui-and-player-flows.md) |
| module/API/save/version/simulation/budgets | [11](11-technical-architecture.md) และcontracts/schemas |

01–08และ12–14เก็บบริบท/เหตุผล/ข้อเสนอเดิม ถ้าตัวอย่างเก่าใช้field/ตัวเลขต่างจากสเปกM0ด้านบน ใช้canonicaldataและเอกสารหลักข้างบน; ถ้าขัดคำยืนยันผู้ใช้ให้หยุดส่วนที่เกี่ยวข้องแล้วแก้เอกสาร ไม่แก้กติกาผู้ใช้เงียบ ๆ [decisions](../decisions.md) แยกคำยืนยันจากbaselineที่ผู้ช่วยออกแบบ ตัวเลขยังรอวัดruntimeตาม [acceptance matrix](../acceptance-matrix.md)

- [20 การปรับภาพ/Timeline/RO numbers/projectiles และจังหวะทดลอง3s](20-combat-presentation.md) — คำขอและคำตอบ20ตุลาคม2026; แยกภาพจากcombatและบันทึกจุดปรับencounterจริงในTASK-025/041

- [21 ตำแหน่งจริง/เดินเข้าระยะตีและ UI แนวตั้ง](21-spatial-combat-and-mobile.md) — ยืนยันสกิลใช้ได้ทุกระยะ ตีปกติต้องเดิน ใช้ shared engine/checkpoint/simulator

- [22 เสียง/BGM และสถิติรายตัว](22-combat-audio-and-statistics.md) — CounterในcheckpointและDPS/Healing/Tankจากshared engine แยกระดับเพลง/เอฟเฟกต์ผ่านbrowseraudioadapter

- [23 สัญญาเซฟที่ใช้งานจริง](23-save-runtime-protocol.md) — command/CAS/checkpoint/backup/locks/reconnect และ shared farm reservation

- [24 ตัวละครและความก้าวหน้าใน runtime](24-character-progression.md) — roster/team/level/Status/Breakthrough/job/refund boundary

- [25 สกิลและคิวใน runtime](25-skill-runtime.md) — skill command/cap/paid ledger/build Passives/preview/UI

- [26 Story และวงจรเล่นที่เซฟได้](26-story-runtime.md) — mode factories/actual builds/terminal settlement/farm/confirmed prediction และขอบเขต M2

- [27 Inventory และอุปกรณ์ใน runtime](27-equipment-runtime.md) — canonical instances/assignment/lock/salvage/purchase และshared stat preview

- [28 Refine/Enchant/card และactual-paid ledger](28-slot-and-card-runtime.md) — upgrade commands/owned sockets/shared preview/compact active scopes/refund receipts

- [29 Rarity และTierใน runtime](29-rarity-and-tier-runtime.md) — atomic3→1/protected materials/retain investments/quote and build preview

- [30 Game shell แบบมือถือ](30-game-shell-ui.md) — HUD เล็ก/ฉากฟาร์มเดินตีมอนแบบ presentation/ปุ่มท้าบอส/หีบ AFK/เมนูล่าง/หน้า Buddy-Stats-Skill-Backpack-Team และ compatible refresh (TASK-048, D-051)

- [31 การ์ด RO และดรอปจากฟาร์ม](31-ro-cards-and-farm.md) — source/art/Normal-Mini-MVP, shared typed effects, fixed monster rarity5ระดับ/currentmaxLegendary, rewardprofiles/legacyfloor และAdd Cardแบบfixedfooter/slotprogress (TASK-073/083)

- [32 น้ำหนักสกิล การ์ด และอุปกรณ์](32-build-impact.md) — โบนัส skill/normal, cost-awarecoefficientsและrolemodifiers; authoredtrialbaselineของTASK077ไม่ใช่whole-gamebalanceproof

- [33 เอฟเฟกต์ท่าโจมตีใหญ่](33-big-skill-presentation.md) — Asura/ท่าใหญ่ 15 ท่า, actual hit/contact, title/shake, reduced motion และนาฬิกาภาพที่แยกจาก engine (TASK-082)

- [ใบธาตุไฟต์ถัดไป](33-element-scrolls.md) — D-123 / TASK-094

- [34 รับรางวัล/Refine/Enchant/เศรษฐกิจ](34-reward-slot-economy-tuning.md) — D-127–129, TASK-098–100

- [35 — Native RO icons / skill growth / Refine cost](35-native-icons-skill-growth.md)

- [37 ฮีลหมู่ Priest/ผลอัปสกิล/ท่ามอน/ภาพธาตุ/ตราผู้สวม](37-skill-growth-and-monster-rotations.md) — D139,stableIDs/meaningfulranks/sharedenemyprograms/asseticons (TASK108)

- [38 ความยาก Story/Tower และ Refine +15](38-difficulty-and-refine15.md) — D140/141, เริ่ม0ช่องการ์ด/ปลด+5,+10,+15/ย้ายการ์ดช่องล็อกคืนกระเป๋า (TASK109)

- [39 เซฟแยก10ช่องต่อบัญชี](39-save-slots.md) — D143/TASK111,owner/saveidentityแยก/SQL008/legacybytepreservation/switchisolation

- [Hi-class/Awaken ขอบเขตใหม่](40-hi-class-roadmap.md) — D144–145,performanceก่อน/2สกิล/เต็มก่อน90/iconinnerglowม่วง

- [41 บท9และทางต่อHi-class](41-story-expansion.md) — D150/TASK117,50ด่าน/identityตรงengine/คง130ด่านและการ์ดเดิม

- [บท10–12พร้อมnativeบอสและrelease gates](42-hi-chapters.md) — TASK118

- [หน้าPreviewสกิลทุกอาชีพ](43-skill-preview.md) — TASK119

- [สมุดสกิลในเกมและรายละเอียด Timeline](44-skill-catalog-and-timeline.md) — D153/TASK120

- [45 Hi-class runtime contracts](45-hi-class-implementation.md) — D154/TASK121:สายอาชีพ/สืบทอด/เลื่อนเก็บบิลด์/Awakenตั้งแต่Hi-classและรายการก่อนเปิดจริง

- [46 ใส่ของที่ดีกว่ารวดเดียว](46-equip-upgrades.md) — D156/TASK126;sharedhint/atomicbatch/onewrite

- [47-sanctuary-hot.md](47-sanctuary-hot.md): Sanctuary Pure HoT เริ่มทันทีและแรงกว่าเพลงเฉพาะส่วนHoT.

- [48 Hunter ทำดาเมจบอสได้คุ้มขึ้น](48-hunter-boss-impact.md) — D158/TASK128,Spiral3hits/weapon element/สามdamagecurvesและAwakenที่ต่อยอด

- [49 · Awaken152ผลเฉพาะสกิล](49-awaken-identities.md): D160/TASK130, per-effectเจาะเกราะ/งบhitรวม/ฮีล+โล่/โบนัสตามหน้าที่; before79ab→after9ae8 และ832matched fights

- [50 · Boss focus และบาลานซ์](50-boss-focus-balance.md): D161/TASK131, AoE +35% skill bucket เมื่อเหลือเป้าเดียว/periodic snapshot/ปรับ power และวัดใหม่

- [51 · Assassin Cross และกรอบ DPS](51-assassin-awaken-balance.md): D162/D163/TASK132, causal ATK/uptime probes และเป้าHiDD9–11k

- [52-auto-battle-and-rewards.md](52-auto-battle-and-rewards.md) — D164 คำอธิบายพลังโจมตี/รางวัลชนะ/Auto Battle

D165/TASK136: ดู [เพดานสกิลและคืนทุน](53-skill-rank-caps.md); canonical capจากshared unlock+40, M0examplebuildsปรับrank/budget/traceให้legalตามD165;historicalevidenceเดิมคงเดิม.

D166/TASK137: [54-grimtooth-balance.md](54-grimtooth-balance.md).

D166/TASK138: [55-boss-size.md](55-boss-size.md).

D167/TASK139: [ร้าน/แลกเศษ/Panel](56-shop-and-exchange-ui.md).

- [57 บทบาทสกิลแยกกัน](57-distinct-skill-roles.md) — D168/TASK142: Blessing+ASPD/Ruwach/18identityprograms; stable IDs/costs/timing/ledger.

- [58 Hi-class migration v2](58-hi-class-migration-v2.md) — D169/TASK143–145:21modernicons/20Hiskills,typedlink/charge/echo/sacrificeและboundedreview.

- [60 — ระดับอุปกรณ์ตามด่านฟาร์ม](60-farm-gear-levels.md): D171/TASK147.

- [61 — ของ80/100และHi cap100](61-high-gear-and-level100.md): D172/TASK148.
