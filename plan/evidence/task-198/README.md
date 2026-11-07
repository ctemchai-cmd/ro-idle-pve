# TASK-198 — Daily continuity and crafting

User confirmed one continuous daily boss: excess damage, remaining hits and statuses carry across HP bars. Baseline `816a7f8ae` is frozen in before.json.gz plus before-additional.json. No owner login or direct cloud-save writes were performed.

The old target-HP loop stopped all remaining hits when a bar reached zero and capped Gate of Hell at the remaining bar. The shared engine now pays the already-mitigated hit through subsequent bars, emitting one damage event per real hit and a separate phase_advance event. Next hits use the next phase's actual defense. Status expiry, periodic timers, cast token, rotation, life epoch, position, summons and shields survive. Death/kill/revive behavior for ordinary Story remains unchanged. No damage coefficients, armor chart or rewards were retuned.

`daily-continuous.test.ts` reproduces the old one-hit result, compares Gate overflow, checks Fire/Earth/Undead multipliers, checkpoint serialization and x1/x2/x3/irregular steps, and verifies an ongoing boss cast and poison timer across bar changes. Existing daily command tests cover terminal settlement/replay/day boundaries. This is regression testing, not a new class-balance calibration.

`daily-crafting.test.ts` covers destination costs and sequential-RNG equivalence, atomic insufficient-funds rejection, exact API receipt replay, per-line weighted option outcomes and Tier ranges, all15 option-stone rates without perturbing other loot RNG, prior Event purchases, and the exact requested quota migration/restore rules.

Native evidence uses actual React Backpack/Buddy/Store and shared reducers at320/390px, with native images. Nine groups cover selected-row odds, target selection/confirmation/single command/full costs, white iridescent Immortal frames, increased shop quantity and zero owner HTTP writes. These are disposable memory fixtures, not authenticated hosted-save verification. Screenshots were visually inspected.

Quota repair is limited to save6 ID ac4dc393-b624-abaf-1362-056b8e1ce3d0, main Creator, server Bangkok7Nov2026. The existing backed-up update applies attempts_used0 for all3 bosses once. It keeps phase/HP/rewarded keys/inventory and marks rows so restoring an old backup does not return spent attempts again. Live application to the owner's save requires that save's normal update flow; it has not been observed by the agent.

Historical scope adapters remove only named new fields/rates for frozen oracles. A missing-crafting guard also fixes the prior adapter's inability to inspect pre-crafting snapshots. No frozen older evidence or gameplay oracle was rewritten. The user's migration-v2 draft and unselected assets remain untouched.

See checks.json, native.json, builds.json and the release verification files for completed checks and exact fingerprints.
