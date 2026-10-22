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

- [31 การ์ด RO และดรอปจากฟาร์ม](31-ro-cards-and-farm.md) — source/art/Normal-Mini-MVP, shared typed effects, fixed card reward profiles และการเก็บการ์ดเดิมระหว่างmigration (TASK-073)

- [32 น้ำหนักสกิล การ์ด และอุปกรณ์](32-build-impact.md) — โบนัส skill/normal, cost-awarecoefficientsและrolemodifiers; authoredtrialbaselineของTASK077ไม่ใช่whole-gamebalanceproof
