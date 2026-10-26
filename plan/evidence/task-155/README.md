# TASK155 — Magic card options

User requested more M.ATK options, then explicitly replaced specialized Bolt damage with general magical damage. Five added RO identities use genuine item-ID illustrations. No existing73 card program, price, drop chance, gacha rarity odds, enemy, stage or equipment definition changed.

| Card | Slot / rarity | Actual Lv.1 effect after existing1.75 and rarity |
| --- | --- | --- |
| Scaraba4505 | Accessory / Rare | M.ATK+18 and31.5%; SP−0.67% |
| Necromancer4440 | Weapon / Rare | INT+1.5, M.ATK+7.875%, SP+10.5%; magic MDEF penetration15.75% |
| Agav4409 | Armor / Rare | M.ATK+22.5%; DEF−3.33 |
| Siroma4416 | Accessory / Uncommon | All magical damage+21.875% |
| Imp4433 | Accessory / Rare | All magical damage+39.375% |

These are **idle adaptations** of the identities/themes in [rAthena item DB](https://github.com/rathena/rathena/blob/master/db/re/item_db_etc.yml). Siroma/Imp's broad effects are the user's explicit change from their RO Bolt specialization. They do not increase M.ATK/healing/cast speed. Positive effects scale by the existing card-level curve, penalties diminish. Additive damage lanes and pre-mitigation penetration remain separate. No new cap, proc or hit.

`magic-cards.test.ts` verifies actual equipment compiler, effect pipeline, both Bolt variants, other magic skills, physical/true/proc/reflect exclusions for conditional penetration, zero-armor behavior, three-card stacking, levels1–5, live descriptions, checkpoint1×/2×/4×/RNG parity, rejected bad profiles and bounded local schema references. Nonempty prior pending payload/inventory/actual-paid refundable ledger and old frozenAFK pool survive migration; the first claim pays the old window and then installs the expanded pool. Actual gacha can produce all five new identities with its existing two draws. These are deterministic mechanics checks, **not** a global DPS calibration or new liveSQL/Auth proof.

Full suite730 passed; final expanded focused suite11 passed and strict TypeScript passed. Ten actual CardSheet views320/390 plus no-errors/writes group passed with native illustration loading and current/next-level descriptions. `native.json`, screenshots and build/source logs contain the evidence. Initial native attempt was interrupted by a build-triggered HMR reload; the failure is retained, and the stable final run passed. Filtered build excludes the entire source asset library/evidence/private env; local Python shim and public migrations directory were restored in its test harness, then it passed.

New portrait pixels/dimensions match their source PNGs (`new-art.json`). Original PNGs were deleted after exactRGBA verification. To keep32MiB,70 existing static WebPs were losslessly recompressed with higher encoder effort; everyRGBA byte, geometry, animation timing, source annotation and unrelated metadata stayed identical. `lossless.json` records80 shared sidecars and before/after checksums; portable `scripts/apply_ro_recompression.py --report plan/evidence/task-155/lossless.json --verify` rechecks the current art. Historical tests explicitly normalize only D179's five additions/optional schema fields and exact recorded recompressions; all other historical assertions remain.

Final pack901 assets/1687 files:32824442 media+sidecars +698850 manifest =33523292 bytes, below33554432; initial1579562 (down from1600070). Source309starter/60460library/6926prepared checks passed; nine longstanding unselected dependency issues remain outside this pack. Root and filtered fresh builds passed. No SQL/env changes, owner login/save access, personal6173 restart or balance batch.

Release status and public artifact checks are tracked in `../task-155-review.json` and latest HANDOFF; do not treat local results as hosted verification.
