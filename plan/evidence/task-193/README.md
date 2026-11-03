# TASK193 — Skill queue haste / Artifact clarity

Confirmed scope: ASPD200 skill wait2.4s, normal attacks unchanged. All four slots consume SI. Artifact bonuses continue to depend on rarity/level/stars even for the same skill. No Artifact/economy value changes.

| ASPD | New skill interval | Normal interval (unchanged) |
| --- | --- | --- |
| 50 | 6.000s | 3.000s |
| 100 | 3.000s | 1.500s |
| 125 | 2.824s | 1.200s |
| 200 | 2.400s | .750s |
| 300 | 2.000s | .500s |
| 500 | 1.500s | .300s |

Versioned optional timing weight .25; missing profile/weight retains legacy semantics. New live Story/Tower/Daily/MVP/Event/demo/preview/headless builders use shared authored profile. Restore retains actual phase snapshots. New tests compare casts, interrupts, RNG, state and Timeline at1/2/3, empty slots and normal-only event equality.

Actual Mage server/client/headless parity revealed a pre-existing boundary bug: a later actor can remove Freeze after an earlier actor has passed its normal-action gate. An arbitrary frame endpoint then used to create an unscheduled gate, changing the next hit time. Only real scheduled timestamps now run action phases; intermediate endpoints accrue time only. A focused Freeze-wake test reproduces the bug at3002ms. Merchant death test now uses a real lethal hit at9050ms, verifying same-timestamp summon removal rather than manufacturing a dead actor between barriers. Thief parity stage3-10→4-1 allows both finishers to act with the slower queue, retaining exact event/state and required-skill assertions.

Artifact resource names: ผลึก Artifact / ตั๋วสุ่ม Artifact / หินรีสกิล Artifact; separate แก่น Breakthrough. Native existing icons and actual separate Artifact balances, zero for absent legacy stock. Read-only dialog. All stock/shop/salvage/reward Essence text distinguishes the material. Skill labels use actual base/Awaken effects, e.g. damage/heal/HoT/shield/duration/per-sphere ATK, with rarity/Lv/stars context. +50% on a200% coefficient becomes300%; permanent stats are displayed separately. Their numerical formulas are unchanged.

Native evidence: resources/artifact effect at320/390, actual React and AssetPack, image decoding and exact balances asserted, no overflow, zero pageerrors/network writes. Synthetic fixtures only; no owner login/cloud access/6173 restart. Root build passes; pack unchanged at33,141,447 bytes including manifest. No new assets/SQL/env/DB calls and no exhaustive class calibration.

Frozen before193=eb7fb10ac; prior archives remain unchanged. source-after/data-after pin this reviewed delta before old historical oracles project it away. Build/public results are in builds.json, hosted.json and deployment.json after publication.
