# Story difficulty and Refine15 —23October2026

D-140/141/TASK109. User wants clear5stage pressure: easy6-5, noticeably harder6-10, potential wall6-15; Tower hits slightly harder. Refine5–10 harder,11–15 lucky,maximum15/3cards. Numerical profiles below are assistant starting points, not measured owner-team win probabilities. No renewed balance batch.

## Story

Current calibration makes6-10only+4.6%HP and−9.1%ATK from6-5;6-15only+12.5%HP. Preserve tutorial chapters1–2. Chapter3+ applies a monotonic envelope over the immutable calibrated baseline. Each stage HP/physical attack is max(old calibrated value,ceil(previous stage×five-stage-factor^(1/5))). Chapter3–5 factorsHP1.15/ATK1.10;chapter6HP1.45/ATK1.20;chapter7+HP1.25/ATK1.15. Later chapters accumulate beyond earlier ones with no reset at a chapter boundary. Factors are data fields and can be tuned independently, not copied into runtime code.

Heavy magic scales proportionally with the ordinary ATK increase and is at least the previous heavy×current5stageATKfactor; ordinarymagic remains on its existing physical power budget. Keep heavy first/4secondinterruptible cast and learned counterplay. Rebuildadds as1/4HP/0.6ATK under existing definition; do not change rewards/farmrates/normal speed/defense/elements/skills/time limits/recommended levels.

## Tower

Keep HP/DEF/rewards unchanged;ATK polynomial becomesceil((100+20f+5f²)/8), approximately+25% of previousceil((20+4f+f²)/2). Oneformula servesauthored1–100andunboundedlaterfloors.

## Refine

Max15;unitcosts keep200×target²gold and8×targetore through15. Chance1–4=100%;5–15=70/55/40/28/18/10/8/5/3/2/1%. Failure keepslevel/item and spendsoneattempt;countsremain. Existing+10percentagepoints/failure through10;new11–15+0.5percentagepoints/failure,cap100%,resetonsuccess. Optional per-target pity override extends currentdata contract; no duplicate formula in UI/SQL. Display exact percentage including halves. Enchantmax10unchanged. Card capacity starts at 0; unlock sockets 1/2/3 at +5/+10/+15 (explicit user answer). Maximum three. Migration releases bindings in newly locked sockets; original card instances/levels/rarity remain in inventory, with no duplication or resource change. Keep bindings in unlocked sockets. Use existing signed backup/migration workflow; never directly rewrite the owner save.


## D-142 — feedback after actual play (TASK110)

The previous minimum growth compounded across chapters:6-10 reached199521HP,6-15 reached289308HP and8-20 reached2500467HP. User reports fights feel unwinnable. Reduce current factors to chapter3–5 HP1.08/ATK1.04 per5stages,chapter6 HP1.20/ATK1.08,chapter7–8 HP1.12/ATK1.06. Still generate from immutable original calibration, with monotonic envelope and no speed/control changes. New6-5=71992HP/2299ATK,6-10=86392/2485,6-15=103674/2687. Retain existing calibrated peaks when they exceed the envelope. Tower attack nowceil((220+44f+11f²)/20), about10%above preTASK109 and12%belowTASK109. HP/DEF/rewards remain. Refine/card sockets above stay unchanged. These new values supersede D140numbers above, are assistant starting values, not measured owner-team victory rates.

Crusader7icons explicitly use localpaladin27/29/48/12/19/33/34 from updatedsuggestion file. HolyCross uses27; user correctedGrandCross to12 beforepublishing. StableIDs/nativeVFX/audio/gameplay unchanged; re-importsidecars andhashpack, retaining source and scopedstaticvisualreview.
