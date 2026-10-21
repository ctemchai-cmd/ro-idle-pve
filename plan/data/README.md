# ข้อมูลอ้างอิงรุ่น Class2-v1

ไฟล์นี้เป็น authored M0 data/contracts ไม่ใช่ผลเล่นจริง Canonical formulas: `combat-rules.json`, `formula-registry.json`; progression: `progression.json`; composition: stat/status/class-status/effect catalogsและschemas เกมไม่evalexpression strings ให้named implementationอ่านtypedtables/paramsตามสัญญา

- `skills/`: 126definitions/26builds หกrootและทุกClass2; `presentations/` แยกicon/VFX/sound refs ส่วนRoguecopyเป็นderiveddefinitionsจากcopy_whitelist
- `equipment.json`, `cards.json`, `slot-progress.json`: 60equipment/18cards และinvestmentของcharacter+slot
- `economy.json`, `loot.json`, `gacha.json`: 8resources/farmmscarry/odds/pity/งบ6จุด
- `stages.json`, `enemies.json`, `tower.json`, `daily-bosses.json`: Story80ด่าน, Tower100rows+generator, daily3bosses
- `module-contracts.json`, `save-contracts.json`, `quality-budgets.json`: boundaries/authorities/command receipts/version/interruptionและงบที่ต้องวัดจริง
- `schemas/`: 11composition schemas + Command/Account/Receipt/BattleCheckpoint/SimulationScenario
- `actor-presentations.json`, `strings.th.json`: refs36presets/19jobsและชื่อแสดง ไม่ใช่แหล่งค่าสเตตัส
- `*-cases.json`, `*-initial-case.json`, `acceptance-cases.json`: fixtures/expected values ใช้ทดสอบหรือreview ไม่ใช่สิทธิ์ให้clientแก้walletบนserver
- `skill-program-cases.json`: 378golden raw-power/intent fixtures ไม่ได้ทอยhit/crit/CCหรือรันbattle ต้องทดสอบpipelineแยก
- `release-content-manifest.json`: fingerprintsของข้อมูลM0 แยกengine-data/schema/presentationselection; implementation/assetpackhashยังไม่มีจนTASK-015/019

ตรวจซ้ำด้วยPython scriptsใน `../checks/` และ `node plan/checks/build_manifest.mjs` จากrootโปรเจกต์ `readiness.py` ตรวจgateM0/refs/traceability ต้องไม่ใช้รายงานM0แทนRLS/API/replay/performance/browsertestsของงานพัฒนา
