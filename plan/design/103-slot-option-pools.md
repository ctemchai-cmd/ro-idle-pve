# D223 — Repeatable options by equipment slot

User confirms8November2026: identical option types may occupy every row (e.g. allM.ATK), but weapons/armor/other slots should have distinct pools. These are adapted game rules, not claims about a specific RO edition.

All current13 option IDs, weights, min/max/Tier multipliers, line counts, stone costs and two RNG draws per rolled line remain. New rolls select from `random_options.slot_pools` based on the definition's slot and allow repeated types. All weapon families share the weapon pool so magical/physical/crit builds remain player choices. No added ASPD/timing modifier or global power multiplier.

| Slot | Allowed options |
| --- | --- |
| Weapon | P.ATK, M.ATK, crit chance, crit damage, hit, skill damage, normal damage |
| Head | M.ATK, HP, MDEF, healing, SP regeneration, skill damage |
| Armor | HP, DEF, MDEF, evasion, healing |
| Garment | HP, DEF, MDEF, evasion, SP regeneration |
| Shoes | HP, DEF, evasion, hit, SP regeneration |
| Accessory | P.ATK, M.ATK, crit chance, crit damage, hit, healing, SP regeneration |

Normal/target reroll, Rarity's added rows, fusion, drops, gacha and Event equipment use the same pool. Target mode can choose a type on another row; when choosing the current type it performs at least one paid roll and stops only when that type appears again (not a free no-op and not a max-value guarantee). Confirmation warns about final outcome as before. Display actual per-slot odds/ranges and duplicate badges, with no disabled-by-existing-type behavior.

Existing item and pending reward options remain unchanged and keep contributing, even if outside their new slot pool. Paid pending old/new choices survive patch/reload and remain redeemable; new requests only use the new pool. Frozen content without slot_pools retains global legacy behavior and its uniqueness flag. Never relax invalid ID, invalid roll, lock, stale row, pending result, inventory or account isolation checks. One atomic receipt per batch and existing backup/content-update flow; no SQL, owner data access, new currency or price change.

Evidence TASK200: duplicate M.ATK all5rows and actual compiled stat stacking, weighted endpoints across all6slots/Tiers, shared generation call sites, target/sequential RNG parity, paid pending choice/migration/JSON/replay and mobile controls320/390. Full regression, M0, strict/root/clean committed builds and public deployment checks required. No class balance batch.
