# TASK200 — Repeatable equipment options by slot

D223 implements the user's two consecutive requests: identical types may occupy allrows, and options should differ between equipment slots. See design103 for all6pools. The existing13IDs/weights/min/max/Tier multipliers/costs/linecounts are unchanged. Pool weights renormalize within a slot; duplicates do not remove weight from later rows.

A single helper is used for drops, gacha, Event weapons, fusion, Rarity-added rows, missing-legacy-option initialization, single rerolls, target rerolls and UI odds. Every new roll supplies its actual equipment definition. Frozen catalogs without slot_pools keep the old global pool and uniqueness flag.

Current-type target rolls once or more; it does not immediately no-op. Other-row duplicates are allowed. Target batches still stop at matching type (any value), insufficient stones or10000limit, keep the final result, and commit one receipt/revision. Original confirmations and single-roll keep-old/new flow remain. Existing items, pending rewards and paid pending choices are preserved even if their affix is no longer in the new slot pool. No re-roll, refund or deletion during migration. All repeated modifiers use distinct per-row IDs and sum once in the real stat compiler.

Validation:
- 42 focused rules/API tests passed, including7 new tests. 6slots×6Tiers×allallowedtypes×min/max check exact weights/ranges/two draws per row.
- Full regression:910individual checks passed;5 historical-file imports encountered a new generated-manifest hash before the scope layer was updated. After adding the exact baseline manifest from98384e03b as before-additional (not rewriting old evidence), all22checks from those5files passed. Total932distinct checks passed.
- Native actual React/shared commands/native pack:9groups at320/390px. Inspect6pools each, real5M.ATK rows, same-type paid reroll, cancel, rapid doubleclick, critical result, insufficient stones. No browser errors or HTTP writes. Synthetic in-memory fixtures, not owner Auth/DB access.
- M0/strict/root build passed. Exact committed archive has1,736identical files; public five groups pass, including27bundleSHA/15resourceSHA and anonymous mobile demo/login.

No class balance batch, SQL/env/newassets, owner data read/write or personal6173restart. This can enable stronger specialized item builds; it is an intentional stacking rule, not a claim of universal combat balance. Lower-role pools constrain where offensive stats can appear. Existing legacy off-role affixes still function.

Released `a22de1be1f6b5414cd0e067abc9957605b970e26`: https://vercel.com/chanon2/ro-idle-pve/4Vfs9FykFsuCpGjTppUcaMGBszY6. No SQL required; existing backed-up content upgrade applies the new catalog. Own7554 closed. Product evidence is retained across the documentation-only closure commit.
