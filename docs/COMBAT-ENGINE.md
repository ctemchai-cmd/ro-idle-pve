# Shared combat engine

`createBattle(input, content, seed)` creates an immutable initial state. `advanceUntil(state, gameMs, content, policy?, limits?)` runs the same pure TypeScript implementation for runtime and headless simulation, returning a new state and ordered events. No rendering, database, wall clock, audio, network or global randomness belongs here.

`serializeBattle` accepts only a complete timestamp barrier; `restoreBattle` checks the declared schema and exact content/rules/RNG identity. TASK-018 owns the replay runner and further checkpoint validation. Content definitions, resolved skills and build blueprints remain immutable; only working combat instances change during a step. Failure returns a diagnostic without a partially committed state.

The implementation is split by responsibility:

- `src/domain/math/`: stat resolution, timings, raw formula registry, damage/regen equations.
- `src/domain/combat/engine.ts`: scheduling, cast/SP/cursor commits, interruptions, phase barriers, deaths and terminal results.
- `program.ts`: typed predicates, numeric status bindings, selectors and action contexts.
- `status.ts`: catalog lookup, source lifetime, stat recomputation and enum weapon endows.
- `effects.ts`: ordered effects, per-target/hit outcomes, shields/healing/resources, periodic statuses, cleanse/dispel, Devotion routing, handler dispatch and queued reactions.

Skills, learned Passives and item/card sources use the same effect/trigger types. Learned resolved Passives are automatically attached when absent from the supplied blueprint. Equipment ownership, prices and progression are separate build/account responsibilities; attaching a test trait does not implement inventory or account commands.

Beneficial effects retain every independent instance without stack or magnitude caps. Expiry/cleanse removes the selected instance, then recomputes all active sources from the original blueprint. Probabilities and damage equations keep their mathematical lower/upper domains; overflow/event/depth limits produce diagnostics rather than silently dropping stacks.

Action restrictions use the union of active statuses. Stun/Freeze interrupt eligible casts before completion admission; Silence prevents new casts without interrupting an existing cast or stopping Normal Attack. All action-restricting statuses use control accuracy/resistance for their application roll. `control_applied` and hard-CC metrics apply to Stun/Freeze only. Reactive boss Resistance is an ordinary explicitly equipped trait, with no universal boss immunity or duration reduction.

Reactions run at the periodic, completion-batch and ready-action barriers. A queued lethal-hit reaction can run before death cleanup; an ordinary heal still cannot restore an HP0 target. After cleanup, dead actors only receive their admitted death reactions. Status triggers use their carrier as `self`; periodic effects also use the carrier as `self`, while damage attribution and event source refer to the original caster. Trigger offense snapshots are captured when the reaction is queued. A `(source instance, trigger)` ancestry rejects cycles while sibling hits and separate item instances remain independent.

The unpublished checkpoint schema1 now includes `trigger_activations` for per-battle limits and `battle_start` timers for one-time entry reactions. Changing the schema changes its content identity; old checkpoints fail explicitly. Root-action counters only live within reaction execution. Server persistence has not been built yet.

Generic revive and Devotion routing are implemented. Summoning has an explicit actor-factory port; the current battle factory rejects summon rotations before SP is spent until TASK-034 supplies and tests the class-specific factory. Rogue copy, all class combinations and complete equipment builds still belong to TASK-029–034/041. Passing these framework tests does not certify all126 skills or game balance.

Validation: `npm run check` and `npm run build`. `tests/game/effects.test.ts` covers composition goldens and lifecycle/reaction edge cases; `timeline.test.ts` and `math.test.ts` cover the underlying time/math rules. Renderer, cloud saves and hosted deployment require their own task evidence.
