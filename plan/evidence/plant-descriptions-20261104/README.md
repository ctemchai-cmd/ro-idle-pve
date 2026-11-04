# Plant skill descriptions — 4 November 2026

Hell Plant and Bio Cannibalize now describe damage/healing as a percentage of the caster’s M.ATK per tick, including element, interval, duration and summon limit. The internal summon power multiplier is no longer shown as an unexplained “พลัง”. Shared descriptions cover skill ranks, the in-game catalog, recorded Timeline programs and Artifact details. Artifact enhancement labels distinguish helper damage from helper healing.

The read-only adapter uses summon-actors.json: derived_scale × resolved power_scale × action attack_ratio. Flat terms stay flat. Gameplay snapshots offense at cast start and floors the inherited stat before resolving a hit; displayed percentages are nominal, before modifiers/armor/element. Binary multiplication noise is rounded only in this presentation adapter.

All five durable release fingerprints remain identical to TASK193; no combat data, skill power, currencies, assets, SQL, save or request behavior changes. No owner login/cloud writes or personal 6173 restart.

Validation: 54 focused tests pass, including 16 actual first-tick engine comparisons across both plants, base/Awaken ranks 1/10 and Artifact bonus 0/50%. Actual SkillInformationDialog/ArtifactPage checks at320/390 pass four groups with no errors, overflow or writes. Screenshots were visually inspected. Root build passes; exact committed build/public deployment are recorded separately in builds.json and hosted.json.

before.json is frozen from42474b4a. The historical source projection accepts only the two exact reviewed description files listed in source-after.json; previous TASK193 oracles are untouched. No new task/acceptance criteria or balance batch was added for this presentation follow-up.
