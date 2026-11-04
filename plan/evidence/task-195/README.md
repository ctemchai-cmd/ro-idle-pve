# TASK195 — Canonical boss identity and Origin elemental icons

D056 changed early boss sprites/names without changing the underlying encounter identity. D216 then corrected Orc/Wolf template elements, so visible Ghostring/Angeling/etc still appeared as Earth. This follow-up resolves122 non-final chapter1–8 stages through one gameplay identity map before armor projection. All420 stage numbers/queues/rewards are retained, including D216 P/MATK×1.15. New14 definitions reuse native sprites already in the pack; card race/size now follow the displayed monster.

The research covers75 identities. All61 prior defense values match rAthena Renewal; all74 present in pre-Renewal agree, while Kraken is absent there.56 prior Origin references are retained. See database-audit.json and the authoring spec for exact IDs, aliases, selected source records and downloaded database SHA. This does not claim identical values across every game region/version; the Origin matchup table is unchanged.

Ten original PNGs from ROOC Companion's Origin element guide replace unrelated buff/debuff illustrations. Their bytes/SHA/source URLs are recorded in icon-sources.json. The weapon indicator uses the neutral orb with the existing swords UI symbol. Native320/390 screenshots show the actual Field and shared glyph component. The alternate ROM Codex candidate was not used because its displayed labels mismatched some artwork.

## Verification

- Five new tests:75 source identities/122 fixes/all420 untouched encounter values, actual checkpoint/UI protection against cosmetic overrides, speed1/2/3 and serialized continuation, invalid mappings/frozen absence, exact original icon bytes and retained VFX.
- Full regression892cases:890initial passes and two historical assertions needed explicit identity projections/current visible-name updates. All25 affected rule/legacy cases then pass, followed by16 final affected checks after visual-review metadata; no remaining failures. Frozen expected snapshots were not regenerated.
- Native12 actual Field cases320/390: Mastering/ElderWillow/Ghostring/Deviling/Angeling/Drake, expected armor badges/names, native sprite selection, readable guide, no overflow/console errors/HTTP writes. Eleven shared glyph indicators loaded exact80px-wide source art. Synthetic fixtures only, no owner Auth/save access.
- M0, strict TypeScript, content/sourcepack/boundary/root build passed. Clean committed archive and hosted publication results recorded separately in builds.json/hosted.json.

No SQL/env, owner-save mutation, quota reset, extra DB request,6173restart, skill retuning or global balance simulation. Old incompatible battles retain the established backed-up migration policy. Optional identity mapping leaves frozen profiles on their original template IDs.
