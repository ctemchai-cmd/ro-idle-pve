# D218 — Batch upgrades and Event presentation

User confirmed 5 Nov 2026: target refine retries until reached or gold/ore cannot pay the next attempt. One atomic `slot.refine_target` command, server seeded sequence; legacy `slot.refine` stays one attempt. No prices/chances/pity/cap/socket changes. +5/+10/+15 presets and single attempt remain. Show next-attempt cost and explicit possible use of all available gold/ore. Bounded by guaranteed pity, stop before unaffordable attempt; zero attempts rejects unchanged. Optional receipt summary contains actor/slot/from/to/target/attempts/successes/failures/stop reason; resource_delta is actual aggregate cost. Response-loss uses original pending UUID/receipt. Successful levels count as the corresponding number of legacy Refine successes in Event progress.

Skill Max uses shared quotes and current character-level cap, existing atomic skill.upgrade and paid ledger. Active/passive, base/Awaken use their actual price tables; never automatically Awaken. No skill balance changes.

Audit all 9 wallet and 6 material/event resources by asset and image SHA. Artifact reroll gets original local mining/43.webp (visually reviewed purple/blue crystal); option stone stays ore9. Add crafting materials/current Event token balance to Resources. Preserve exact source pixels and runtime budget.

Event: compact weekly header, check-in actual first-participation bonus, selectable five-tier boss details, ready missions first, two-column reward shelf with genuine icons/stock/prices. Same period/grace/character-specific weapon/receipt/single-flight rules. No rewards/odds/calendar changes. Validate at320/390, locked/busy/error/previous period/empty stock.

Evidence: task-196. Baseline45c5499a8. No SQL/env/owner writes/6173 restart/balance batch.
