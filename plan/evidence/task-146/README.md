# TASK146 — Readable RO numbers and real native major effects

User request: larger damage digits, every major skill uses real local assets. D170/design59. Local implementation complete; public release proof is separate.

## What changed

Original RO bitmap digits, critical background, green heal/red incoming/yellow per-action multi-hit sum and focused-actor rules remain. Baseline heights now use CSS pixels independent of arena scale: outgoing30/critical38/total38/heal26/incoming24. The outgoing animation shrinks less near the end; long values fit within70%screen width and side bounds are clamped. Large hit numbers use two bands; the title selects a free band once per action so it stays still and does not cover the numbers.

69 explicitly mapped major active skills cover every26 Class2/High profession: all26High skills, Class2 unlock>=30, existing major attacks, Finger/StormGust/GrandCross. Buffs, control, heals and summons have role-specific explicit bindings; buffs never use the arrow-volley default. No root-based silent fallback. New major skills require a new explicit binding.

STR clips play original atlas pixels/keyframes. Client-coded RO effects use original exported textures with declarative placement: Asura uses actual lens1 from MO_EXTREMITYFIST271, source24copies/550ms/100ms delay/10x150/.8alpha;2D attachment layout is adapted. Tarot09 and the Falcon ACT use their actual card/bird art. Native Asum and Psychic Wave field clips are selected directly. Missing/custom effect mappings reuse native art by role, with explicit basis in native-bindings.json; this does not claim that every skill exactly reproduces the RO client. No generated bitmap or invented Canvas particle geometry replaces scoped skill art. Native art can be tinted for established class styling.

Procedural finisher burst drawings are removed; text and subtle camera shake remain. Scoped major skills suppress geometric projectile drawings and procedural recipe fallbacks while retaining visual hit delays. Persistent fields and Bond connection read the same status projections and use native media. Summon actor rigs and other out-of-scope ambient UI presentation are unchanged.

## Measured result and proof

- On320px, a real five-digit outgoing bitmap at160ms:17.33→32.00px visible height. On390px:21.13→31.96px. Critical background+digits41.78→76.44px on320. Actual image pixels measured, not only a CSS declaration.
- Native Chrome: all69 actual shared-engine casts, complete STR/texture/ACT media, four elapsed samples per clip with nontransparent pixel checks;320/390number crops, side bounds, source SHA and original metadata. Manual visual review covers the four galleries at contact+220ms plus selected individual/mobile shots, not every animation frame.
- Five actual major skill replays at1x/2x/4x produce identical checkpoints/events/RNG, including serialized restoration; renderer does not mutate them. An actual enemy interruption prevents Asura resolution, impact and banner.
- Bounded effect-only stress at CPU4x:16 simultaneous native clips,10s warmup+20s measurement,1200frames; drawp95=3ms, RAFp95=16.8ms. This is not a physical Android/full-UI/canonical60s performance certification.
-700full tests passed; final20focused tests cover native schema/scope/dependencies/number behavior/multi-hit/finisher contracts. Final binding-only refinements were rechecked with all69native casts. M0/readiness, root and filtered uncached builds and source asset checks are release gates.
- Gameplay documents/schemas and engine/schema/implementation/content hashes are strictly identical to the frozen before bundle. No combat power, HP/SP/resource/queue/save logic or prices changed; no balance batch. No SQL/env/owner account access or personal6173 restart.

## Pack budget

Runtime raw 33,540,731 /33,554,432bytes;877assets/1639files. First profile remains1,621,492raw bytes. Ten native assets added on demand, source pixels/keyframes intact. Source304starter/60,460library checks pass with the same nine known unresolved dependencies outside the selected pack. No budget relaxation.

## Evidence

native-bindings.json records each skill, role adaptation and original media SHA. native.json/native-details.json record actual casts and pixel checks. runtime.json records seeded parity/interruption and rendering stress. number-comparison320390, four major-gallery images and individual/mobile screenshots show the reviewed states. hosted.json will record public deployment verification.
