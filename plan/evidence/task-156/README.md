# TASK156 — Two Legendary M.ATK options

User requested two more magic cards, preferred high rarity, and asked to compare high P.ATK/M.ATK. Audit of prior78: direct positive P.ATK13/M.ATK6 (includes existing generated stat growth). Mini/Epic1/0; MVP/Legendary0/0. This does not count distinct damage/proc roles: Turtle General22.05%physical vsDark Lord9.45%magic at actualLegendaryLv1, plus different procs. Counts are not a DPS comparison. `comparison.json` preserves the audit.

| New card | Slot / rarity | Actual Lv.1 | Actual Lv.5 |
| --- | --- | --- | --- |
| Fallen Bishop Hibram4441 | Shoes / Legendary MVP | M.ATK+45%, MaxSP−8.33% | M.ATK+90%, MaxSP−4.17% |
| Time Holder4625 | Weapon / Legendary MVP | M.ATK+36%, SPcost+5.56% | M.ATK+72%, SPcost+2.78% |

Names, native illustrations, slots and MATK/SP themes are verified against [primary item database](https://github.com/rathena/rathena/blob/master/db/re/item_db_etc.yml). Fallen Bishop1871 [pre-re mob data](https://github.com/rathena/rathena/blob/master/db/pre-re/mob_db.yml) and Time Holder3074 [re mob data](https://github.com/rathena/rathena/blob/master/db/re/mob_db.yml) have actualMVP flags/rewards. These numbers are **our idle adaptation**, not the PC formulas. Broad MATK aids magical damage and MATK healing; physical damage/physical healing/timing stay unchanged. Existing rarity/level rules improve benefits and reduce penalties. No new engine/schema/command/formula or balance batch.

All78 old definitions/presentations/origins/traits and rates/prices/pity stay exact. Two additionalLegendary identities each use existingMVPweight10; globalLegendary3%gacha and chapter6farm gate remain. Existing frozen-pool migration pays old78pool first, preserving cursor/remainders/RNG/inventory/ledger/pending before the new80pool. Targeted actual reducer/effect/checkpoint/gacha tests verify this; no new liveSQL/Auth/owner proof is claimed.

Full740/740 tests, focused17 (8new mechanics/projection), real nativeCardSheet320/390 fivegroups, strictTypeScript/root/filtered builds and M0 pass. Original full run found four **test harness assumptions**: authored-vs-runtime loot projection, assumed3000mscastgate, and two old authoring fields accessed from runtime manifests. Fixed tests to compare exact authored data, actualcast.at_ms, source provenance and icon_meta_path resolution. Final complete suite passed; no combat implementation changed. New data and budget tooling are tested independently.

Genuine300×400 art retained with exactRGBA conversion; original downloadedPNG deleted after verification. `new-art.json` and contact/screen captures preserve proof. To keep32MiB,70 measuredstaticWebPs were recompressed losslessly, saving52172bytes and updating288 shared sidecars. ExactRGBA/size/metadata hashes in `lossless.json`; verification reads current assets. An initial catalog rebuild found the new review metadata missing required`status`; fixed it, recovered before/after audit against HEAD originals with fullRGBA comparison, rebuilt all catalogs and passed311starter/60460library/6926prepared checks. Nine longstanding unselected dependency issues remain outside this pack.

Manifest projection removes only **presentation.provenance** and redundant **icon_asset_id**, both outside the runtimeSkillPresentation contract. Source authoring and all source/runtimesidecars retain their fields. Icon resolution already uses icon_meta_path. Every visual/audio/recipe field is compared exactly to source by the projection test; runtime and native checks pass. This saves46431manifestbytes without media changes. Final903assets/1691files:32891997payload +653190manifest =33545187bytes <33554432; initial1577418 ≤1579562. No budget increase, image resizing, animation edits, SQL/env changes, owner access or6173restart.

Final release/public verification is recorded in `../task-156-review.json` and latestHANDOFF. Local results alone are not hosted proof.
