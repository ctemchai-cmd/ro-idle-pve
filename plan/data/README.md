# ข้อมูลอ้างอิงรุ่น Class2-v1

ไฟล์นี้เป็น authored M0 data/contracts ไม่ใช่ผลเล่นจริง Canonical formulas: `combat-rules.json`, `formula-registry.json`; progression: `progression.json`; composition: stat/status/class-status/effect catalogsและschemas เกมไม่evalexpression strings ให้named implementationอ่านtypedtables/paramsตามสัญญา

- `skills/`: 126definitions/26builds หกrootและทุกClass2; `presentations/` แยกicon/VFX/sound refs ส่วนRoguecopyเป็นderiveddefinitionsจากcopy_whitelist
- `equipment.json`, `cards.json`, `slot-progress.json`: 60equipment/18cards และinvestmentของcharacter+slot
- `economy.json`, `loot.json`, `gacha.json`: 8resources/farmmscarry/odds/pity/งบ6จุด
- `stages.json`, `enemies.json`, `tower.json`, `daily-bosses.json`: Story180ด่าน (บท1–3×10,4–8×20,9×50), Tower100rows+generator, daily3bosses
- `module-contracts.json`, `save-contracts.json`, `quality-budgets.json`: boundaries/authorities/command receipts/version/interruptionและงบที่ต้องวัดจริง
- `schemas/`: 11composition schemas + Command/Account/Receipt/BattleCheckpoint/SimulationScenario
- `actor-presentations.json`, `strings.th.json`: refs36presets/19jobsและชื่อแสดง ไม่ใช่แหล่งค่าสเตตัส
- `*-cases.json`, `*-initial-case.json`, `acceptance-cases.json`: fixtures/expected values ใช้ทดสอบหรือreview ไม่ใช่สิทธิ์ให้clientแก้walletบนserver
- `skill-program-cases.json`: 378golden raw-power/intent fixtures ไม่ได้ทอยhit/crit/CCหรือรันbattle ต้องทดสอบpipelineแยก
- `release-content-manifest.json`: fingerprintsของข้อมูลM0 แยกengine-data/schema/presentationselection; implementation/assetpackhashยังไม่มีจนTASK-015/019

ตรวจซ้ำด้วยPython scriptsใน `../checks/` และ `node plan/checks/build_manifest.mjs` จากrootโปรเจกต์ `readiness.py` ตรวจgateM0/refs/traceability ต้องไม่ใช้รายงานM0แทนRLS/API/replay/performance/browsertestsของงานพัฒนา

D-120/TASK-091: `combat-rules.json.element_chart` ใช้ROO Global10×10จากภาพใน [คู่มือ](https://roo-global.gitbook.io/guide/game-wiki/element) โดยgenerator `plan/generators/element_chart.py --check` ตรวจครบ100คู่; provenanceอยู่element_chart_reference/ภาพหลักฐานtask091 ไม่ใช้ตารางPCระดับ1–4หรือเปลี่ยนธาตุสกิล/การ์ดตามROOทั้งหมด. ค่าในruntimeเป็นตัวคูณรวม เช่น175%=1.75 ไม่ใช่โบนัส175%.

TASK-093/094: cards.jsonมี73definitions(66nativeportraits+7Puppetvariants), OriginAngeling/DevilingMVPoverride; economy.jsonเพิ่ม4element_scrolls/50goldและshopgrants, account-state optionalbattle_supplies และcommand consumable.prepare. ดูdesign31และ33. ค่าราคา/พลังPuppetเป็นauthoredbaseline; frozenv3mapnormalizeโดยไม่รีโรลpool/chance/RNG.

D-127–129: slot-progress.enchant.slot_lines ราย6ช่อง, Refineflat+percent, AFK40Crystal/h และoptional gear_chance_per_million ในfrozen snapshotใหม่ (legacyไม่เติมย้อนหลัง). ดูdesign34. reward.claimรองรับclaim_ids; farm.claim collect_rewardsทำreserve+payหนึ่งtransaction.

D165/TASK136: ดู [design53](../design/53-skill-rank-caps.md); canonical capจากshared unlock+40, M0examplebuildsปรับrank/budget/traceให้legalตามD165;historicalevidenceเดิมคงเดิม.

D166/TASK137: [54-grimtooth-balance.md](../design/54-grimtooth-balance.md).

D166/TASK138: [55-boss-size.md](../design/55-boss-size.md).

D167/TASK139: [ร้าน/แลกเศษ/Panel](../design/56-shop-and-exchange-ui.md).

D188–192/TASK164–168: equipment.crafting and economy.shop.crafting_grant use optionalaccount.equipment_crafting (separate wallet); three schema commands forroll/decide/rarity. Awakenrankcaps live in sharedskills.ts, excessactualpaidrefund follows existingbackup migration. GatecurvesD191 and explicit23Hi parameter overridesD192 regenerate throughhi_class_v2.py→hi_finisher_hierarchy.py; nativeIDs/costs/Class2programs remain. See designs77–81.

D194–195/TASK170–171: essencegoldshop20×20/AFKBreak2-12-22;progression.character_level_is_refundable=true and scopedlevel_resetpolicy.46commands inclcharacter.reset_level. Newlevel/Breakactivepaymentscoalesced;legacydiscardedprefixpricesarchived inlegacy-character-prices.ts and reconstructed inreset receipt. No new save fields orSQL. See designs83–84.
