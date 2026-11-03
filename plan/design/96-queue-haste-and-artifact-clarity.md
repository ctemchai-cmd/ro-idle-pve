# D215 — Queue haste and Artifact clarity

User confirmed ASPD softening only for the skill queue: at ASPD200 SI1500→2400ms; normal attack speed unchanged. Followups: same-skill Artifacts differ by their rarity/level/stars, explain “power”, distinguish Essence names and show Artifact resources with actual native icons.

## Timing contract

Live timing is authored in combat-rules.rotation.live_timing: SI3000, normal1500, skill_interval_bonus_weight=.25. effectiveSIASPD = ASPD>100 ? 100+(ASPD−100)*.25 : ASPD; SI=ceil(3000*100/max(1,effectiveSIASPD)). No change below100. Normal=ceil(1500*100/max(1,ASPD)), CT/ACD use CSPD as before. No cap/stacking changes.

ASPD100/125/200/300/500 gives SI3000/2824/2400/2000/1500ms vs normal1500/1200/750/500/300ms. All4 slots consume SI; phase durations snapshot at entry. New optional checkpoint timing weight0..1; missing weight retains legacy1, missing profile remains legacy1500/1500. New live encounter builders share liveBattleTiming; frozen old content falls back to old3000/1500. Historical abstract queue probes retain their explicit old input.

Regression revealed a pre-existing scheduler boundary bug: after a later actor breaks Freeze, an earlier overdue actor could act at an arbitrary render endpoint before the next scheduled event. Endpoints with no due timer now accrue time only, preventing FPS/chunk size from creating extra action gates. Focused Freeze-wake and actual Mage parity tests retain exact events/RNG/state.

Same engine in local speed1/2/3, server and headless. Record actual profile in checkpoint; do not change old timing silently on restore. Existing incompatible-content backup/migration remains required, old daily proof is not broadened. No SQL/env/new network roundtrip/owner mutation. No full class recalibration in this patch.

## Artifact presentation

Gameplay values unchanged: rarity start/max interpolated at Lv1–10, then ×(1+.1*stars). Bonus applies only to selected skill coefficients; utility duration receives one quarter of that bonus. Same skill does not mean identical strength. Label actual current base/Awaken skill effects (damage/heal/HoT/shield/summon/duration/Passive/per-sphere ATK) rather than generic power. Example +50% on200%P.ATK yields300%P.ATK; character-wide stats are separate displayed lines.

Artifact essence is “ผลึก Artifact”; breakthrough resource is “แก่น Breakthrough”. Store/salvage/rewards/stock use the same Artifact label. Resources dialog includes essence, draw tickets and skill-reroll stones, from state.artifacts with zero fallback for legacy absence. Use existing resource_icons; no new images or economy/save semantics. Resource information remains read-only.

## Verification

Frozen before193 at closure eb7fb10ac; old evidence immutable. New scoped source projection verifies exact reviewed changes before historical oracles. Tests cover literal timing/empty slots/normal events/CT-ACD/checkpoint/interrupt/speeds/Timeline, Artifact effect labels and rarity strength, and actual mobile dialogs/native icons. Root and clean committed archive build before push; hosted health/assets checked after Vercel success. Synthetic accounts only.
