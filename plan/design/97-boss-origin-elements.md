# D216 — Boss armor identities and outgoing damage

4 November 2026. User requests RO Origin elements for every boss and a modest difficulty increase, then clarifies that boss damage is the main issue. Use **P.ATK/M.ATK ×1.15**, rounded once after the existing mode curve. **HP, defenses, speed, skills, encounter timers, rewards and quotas remain unchanged.** This is an attack-stat increase; final damage still depends on armor, resistance, mitigation and skill formulas.

## Reference scope

`plan/generators/boss-origin-profiles.json` records all61 enemy definitions.56 identities have Origin references;5 retain existing values with explicit user approval: Sword Fish/Kukre/Turtle General/Amon Ra/Randgris. Do not call those5 verified Origin values. ROOC Companion is a fan database derived from the **Origin Classic Global Americas** client, not an official universal database; the Origin Global guide supplements Kraken/Stormy Knight. Shadow is internal `dark`. Keep element levels out: the existing Origin10×10 chart is unchanged.

Drake's ordinary database and Nightmare Hell guide identify Undead; the normal Season2 guide describes a Water variant. Adopt ordinary Undead consistently for this game's Drake. Origin Valkyrie is Holy but its exact equivalence to Randgris is unproven, so Randgris remains explicitly retained. Do not infer an element from a card's armor conversion: Dokebi's monster is Shadow even though its card converts armor to Wind.

Sources: [DB provenance](https://rooccompanion.com/about/), [Drake](https://rooccompanion.com/monster/drake/), [Poring](https://rooccompanion.com/monster/poring/), [Golem](https://rooccompanion.com/monster/golem/), [Nightmare S2 Hell](https://roo-global.gitbook.io/guide/dungeon-guide/nightmare-temple-s1/temple-of-nightmare-season-2-hell-version), [Nightmare S3](https://roo-global.gitbook.io/guide/dungeon-guide/nightmare-temple-s1/nightmare-temple-season-3). Per-identity URLs are retained in the generator specification.

## Runtime

Optional versioned `enemies.boss_combat` owns the complete defense map and attack multiplier. Content validation rejects missing/extra identities, unknown elements and invalid multipliers. `applyBossProfile` is pure and called once at the end of each Story/Tower/Daily/MVP/Event builder; Event uses the unboosted Story anchor first. Story's existing late difficulty remains in `storyBossBase`.

Defense and offense are separated: `element` sets armor and elemental-card target tags; `attack_element` preserves each encounter's previously authored normal/weapon-following attack element. Fixed-element skill programs are untouched. Daily respawns carry both explicitly, preventing a phase transition from silently switching the normal attack to the new armor element. Frozen content without the profile takes the original path. Ambient farm combat and AFK income remain unchanged.

Existing backed-up content migration applies. Do not weaken old daily replay seals, mutate owner saves, reset progress/quotas, or introduce SQL/env changes. Existing current HP, earned chests and pending rewards keep their prior values.

## Acceptance

Check every Story stage, representative generated Tower floors including1000, all Daily identities/phases,60MVP tiers and all Event tiers. Assert one15% attack increase and exact unchanged non-attack fields. Verify actual elemental damage/target tags, phase respawn, reload and speed1/2/3 parity. Preserve historical oracles through a narrowly pinned scope projection. Inspect actual UI at320/390, root and clean committed archive builds, then public release.
