# D217 — Boss identity and coherent elemental icons

User requested a broader RO database audit after seeing mostly Earth bosses. The actual defect is D056 cosmetic chapter1–8 boss pools: the renderer showed Ghostring, Angeling, etc., while encounters still used Wolf/Orc Warrior template IDs. D216 corrected those template elements but did not connect the displayed monster to its gameplay identity.

## Gameplay identity

`enemies.boss_combat.story_identities` explicitly maps the122 non-final early stages to their existing visible monsters. Shared `storyBoss` resolves identity before D216 armor/attack projection. Add14 missing definitions/monster traits using the already-deployed native actors. Chapters9–15 and chapter finals retain their definitions. All UI paths, checkpoint actors, armor tags and race/size card matching now use the same definition. Canonical stages cannot be replaced by a cosmetic callback. The legacy farm/template path stays separate.

Keep all encounter stats, authored skill queues/passives, outgoing attack element, rewards, time limits and D216 P/MATK×1.15. No new difficulty increase or global class balance. Armor matchups can change actual damage as intended; race/size cards now match the visible monster. No PC element-level multipliers are imported into the existing Origin matchup table.

## Evidence and version policy

[Curated audit](../generators/boss-identities.json) covers75 distinct monsters. All61 prior defense elements agree with rAthena Renewal. All74 also present in pre-Renewal agree; Kraken is absent there. Keep the56 prior Origin references, and explicitly label the additional PC evidence. This is cross-version verification, not a claim that every RO region/variant is identical. Aliases are exact monster IDs; local sprite `chocho` maps to Choco1214. Snapshot URLs/hashes and selected records are recorded in task195 evidence. iROWiki/Divine Pride/RO Origin spot checks supplement the source DB.

Optional profile preserves frozen content behavior. Existing backup/content migration handles old saves; active incompatible fights are not silently replayed under new identity. No SQL/env/owner access or new network roundtrips.

## Presentation

Ten original80px-wide images from the ROOC Companion Origin element guide replace the unrelated buff/debuff pictures. Retain exact PNG bytes and source URLs/SHA. One shared24px orb treatment is used for skills, armor, shop and guide references. Weapon inheritance is not an element: neutral orb plus the existing UI swords symbol, with its explicit text label. This is a client-derived fan asset source, not official endorsement. The separate ROM Codex candidate was rejected: its page labels swapped Earth/Fire and Poison/Ghost artwork.

## Verification

Every stage must resolve one definition, native sprite, element, size and race; preserved stats/queues/rewards and old no-profile content tested independently. Real engine damage/card tags and client/server replay must agree. Native mobile320/390 checks cover previously mislabelled stages and all10 icons. Preserve frozen historical oracles with a hash-pinned195 source projection only. Run source pack/M0/strict/build and clean committed archive before publication; verify public fingerprints/media and reload behavior after deployment.
