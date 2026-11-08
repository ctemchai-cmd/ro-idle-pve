# D222 — Enchant targets and automatic option search

User requests Enchant +11 INVALID_COMMAND fix, target levels5/10/15, and reroll until a selected option appears (8November2026).

The command schema incorrectly capped Enchant at10 despite existing account/content cap20. Correct to20; retain character gates80→15 and100→20, slot-specific effects, prices and actual paid-ledger refunds. UI adds5/10/15/20 targets and +1. One existing slot.enchant command pays the entire exact quote; insufficient resources rejects atomically. No randomness or extra per-level requests.

Target reroll chooses one row and one eligible option ID. Defaults to type only, no minimum value; old single-roll + keep-old/new flow remains. New equipment.option_target carries expected option, target option ID and max_attempts1..10000. Validate current row, no pending roll, writable/unlocked/nontraining/outside battle, target belongs to weighted pool excluding other rows. Already-held type rejects without cost. Repeat original rollItemOptions with two injected seeded draws/cost per attempt until target, insufficient stones or execution limit; replace only selected row with last result. No extra gold cost, changed odds, guarantee or pity.

UI confirms potential maximum stones and warns it keeps the final outcome even if stones run out. Existing account transaction returns option_batch receipt with original/final options, attempts, stones and stop reason. One command/revision; same UUID receipt replay, browser recovery and save isolation remain existing infrastructure. No predicted RNG result/optimistic mutation. Execution bound10000 shown when relevant; submit again if reached. No raw save/owner Auth/SQL changes.

Validate cap boundaries/ledger and refund, matched sequential seeded rolls, eligible exclusions, invalid-target/stale/pending rejection before draws/spend, response-loss replay, mobile320/390 confirmation/single-flight/results, unchanged content outside schema/catalog and no combat changes.
