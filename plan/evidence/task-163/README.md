# TASK163 — Tower rewards

D187/design76. Gold+EXP every firstclear, rotating manual/Refine/Enchant; additive5/10/20milestones, 50/100/200Crystal and0/1/2cards. First100=1.94mGold/1.525mEXP/1504manual/1963ore/1051dust/2000Crystal/15cards. No enemy/skill/farm/gacha cost/rate/pity changes. Card kind/tier/RNG stays with existing gachaCardDefinition path; no guaranteed rare card.

Typed schedule validation/pure calculation + authored Python100row parity, runtime/server/UI/headless shared. Allresources flow into existing PendingReward/auto-collection atomically. Existing pending rewards and Tower frontier kept during migration, no retroactive payment or reset. No SQL/env/newmedia/ownerAuth/6173restart.

Native actualReact11cases (5floors ×320390 +manual/Auto intents) pass, native resource media loaded/nooverflow/noerrors/writes. Visually reviewedfloor1/20at320; Auto button spans panel width. Screenshots in this folder. This is disposable memory UI, not ownerPostgres. Command tests cover immediate all9resource deltas/10+20cards/pity unchanged/single revision/duplicate terminal/replay/fullinventory/fixedpending claim, migration preserves old rewards. Historical scope checks reverse only declared reward fields/source edits using frozenbefore and source-edits; they continue to check unrelated bytes.

Fulltests/rootbuild/M0/public release results tracked in task-163-review.json. No new class balance batch. Pack remains798a928, raw33545187/initial1577418.
