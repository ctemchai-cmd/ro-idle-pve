# TASK194 — Boss armor and damage

User clarified that boss damage is too low. All live encounter builders now apply P.ATK/M.ATK ×1.15 once, after their existing mode curve; HP, defenses, skills, speed, duration, rewards and daily attempts remain unchanged. Final hit damage still depends on mitigation and formula. Five unverified identities retain their existing RO identity element; 56 have Origin references. See [design](../../design/97-boss-origin-elements.md) and [provenance](../../generators/boss-origin-profiles.json).

## Verification

- Five new rule tests cover420Story stages, generated Tower through1000,3daily identities throughphase100,60MVP tiers and10Event tiers; exact non-attack fields, literal corrections, invalid content, real element damage/card tags, real daily respawn/reload and1/2/3 parity.
- Full TS run plus targeted rechecks:887 distinct cases pass. Initial historical-source pin failures and an old Tower oracle needed the new explicitly pinned scope; subsequent checks also exposed a pre-existing plant-pack projection omission, now narrowly normalized against its frozen source evidence. Historical expected values were not overwritten.
- Actual mobile Field:12 encounters across320/390, all five mode builders, native actors, real armor badge/element dialog/no overflow. Synthetic snapshots only; no Auth, owner save or HTTP writes. Native report/screenshots retained.
- M0 eleven checks, strict TypeScript, content/boundary/runtime artifact and root build pass. Pack073b47 remains1697files/33181500bytes; no asset media changed.
- Clean committed archive and public deployment results recorded separately in builds.json/hosted.json after publication.

Existing backed-up migration is retained. Old unproven combat is never replayed under new balance; no owner mutation, new SQL/env, quota reset, paid reward duplication or extra DB requests. Ambient farm remains unchanged. No global class calibration or physical-phone performance claim.

Published source `228ba2f3dccf0738e6dfa2d00677ac8c78465fa0`; [Vercel SUCCESS](https://vercel.com/chanon2/ro-idle-pve/CrxfbmAU5NYFZnut4VsQkgb2Rqvs). Root/clean committed build1734files byte-identical; public healthSIN1/anonymous401/fivefingerprints/allbundleSHA/mobile320390 pass. No remaining task work.
