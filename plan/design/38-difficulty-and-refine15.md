# Story difficulty and Refine15 —23October2026

D-140/141/TASK109. User wants clear5stage pressure: easy6-5, noticeably harder6-10, potential wall6-15; Tower hits slightly harder. Refine5–10 harder,11–15 lucky,maximum15/3cards. Numerical profiles below are assistant starting points, not measured owner-team win probabilities. No renewed balance batch.

## Story

Current calibration makes6-10only+4.6%HP and−9.1%ATK from6-5;6-15only+12.5%HP. Preserve tutorial chapters1–2. Chapter3+ applies a monotonic envelope over the immutable calibrated baseline. Each stage HP/physical attack is max(old calibrated value,ceil(previous stage×five-stage-factor^(1/5))). Chapter3–5 factorsHP1.15/ATK1.10;chapter6HP1.45/ATK1.20;chapter7+HP1.25/ATK1.15. Later chapters accumulate beyond earlier ones with no reset at a chapter boundary. Factors are data fields and can be tuned independently, not copied into runtime code.

Heavy magic scales proportionally with the ordinary ATK increase and is at least the previous heavy×current5stageATKfactor; ordinarymagic remains on its existing physical power budget. Keep heavy first/4secondinterruptible cast and learned counterplay. Rebuildadds as1/4HP/0.6ATK under existing definition; do not change rewards/farmrates/normal speed/defense/elements/skills/time limits/recommended levels.

## Tower

Keep HP/DEF/rewards unchanged;ATK polynomial becomesceil((100+20f+5f²)/8), approximately+25% of previousceil((20+4f+f²)/2). Oneformula servesauthored1–100andunboundedlaterfloors.

## Refine

Max15;unitcosts keep200×target²gold and8×targetore through15. Chance1–4=100%;5–15=70/55/40/28/18/10/8/5/3/2/1%. Failure keepslevel/item and spendsoneattempt;countsremain. Existing+10percentagepoints/failure through10;new11–15+0.5percentagepoints/failure,cap100%,resetonsuccess. Optional per-target pity override extends currentdata contract; no duplicate formula in UI/SQL. Display exact percentage including halves. Enchantmax10unchanged. Card capacity starts at 0; unlock sockets 1/2/3 at +5/+10/+15 (explicit user answer). Maximum three. Migration releases bindings in newly locked sockets; original card instances/levels/rarity remain in inventory, with no duplication or resource change. Keep bindings in unlocked sockets. Use existing signed backup/migration workflow; never directly rewrite the owner save.
