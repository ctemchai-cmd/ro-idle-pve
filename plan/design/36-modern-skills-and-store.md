# Modern icons, class identity and card reveal —23October2026

D-138 / TASK-107 follows the user's complete suggestion-migrate.txt (retained verbatim) and explicit follow-up: major single-target skills total ~70% of Finger Offensive; major AoE ~50% per target, equal ATK/MATK. These are authored coefficients, not a claim of equal real-world DPS: armor, elements, crits, cast clocks, summons and utility still differ. Finger/Asura/CallSpirit and their costs stay unchanged. No new balance simulation batch.

## Asset contract

119 explicit skills,7 inherited shared/copied skills=126,8 wallet icons+4 scrolls. Explicit aliases in scripts/modern-icon-bindings.json; no filename guessing. User files unchanged; imported selected WebP bytes/dimensions/metadata/SHA preserved. Thief branch purple treatment excludes Envenom and Strip Armor, using presentation transforms without modifying original images. Real19 profession emblems and Upgrade+ remain unchanged.

## Skill contract

Keep all126logicalIDs, learnedlevels/loadouts/actual-paid ledger/roster/gear/wallet. Display names and effects may change as explicitly requested (Backstep, Spiral Volley, follow-up shot, Dancer identity, Voice Breaker, Rolling Cutter, Shield Break, Axe Tornado). All used modifiers/durations/conditional outcomes appear in shared compact descriptions including ten-rank differences. Do not change global queue/CC/SP/refund/additive buff policies.

Major damage ratio compares base total direct damage per target per cast to Finger's5hits, with utility exceptions documented. Psychic Bolt's guaranteed crit normalizes its base coefficient by default1.5crit multiplier, preserving full extra crit-damage scaling. Spell Breaker instant: damage only on an actual successful interrupt of that target (no bonus on idle/immune/locked/same-time completed casts); outcome is a generic composable predicate, never skill-ID logic. Dispel1→4 status instances and1000→0ms CT. Rolling Cutter grants20→50% skill-local crit chance, Raid adds skill-local crit damage; do not leak into future normal attacks. Silence5→8s, Intimidate3→6s and HammerFall1→2s retain ordinary resistance/chainCC.

Numerical curves/plant tick budgets and every file note are authored and audited in modern-skill-changes.py/report. Build-impact generator applies changes last from fixed values, never compounds. Existing signed backup/content migration handles updated content; no owner cloud patch, no SQL/env change, no6173restart.

## Presentation and store

Purple VFX for thief family except specified exclusions; native RO effect selection for Axe Tornado plus presentation-only emphasis. Keep hits synchronized to actual events and1×/2×/4× identical calculations. Card gacha gets a clear mobile summon stage and rarity reveal, reduced-motion support, inspectable results and close/skip. Only real command receipts grant results; opening/closing/replaying animations never pulls or charges again. Keep rates/pity/prices/stock unchanged.
