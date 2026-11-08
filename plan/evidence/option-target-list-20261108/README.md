# Option target dropdown follow-up — 8 November 2026

User could not find a desired option and reported that every row displayed the same choices, specifically missing critical chance. Equipment option rows intentionally share one weighted pool; exclusions follow stats on the other rows, not a row-specific table. The previous target UI also omitted the current type because targeting it would immediately complete without rolling. These exclusions hid names entirely.

All 13 supported types are now shown. Occupied types stay visible and disabled with their actual row; the edited row is labeled. After a successful batch, the selected type remains visible as already present. No new stat pool, probabilities, value ranges, spending or unique-stat rules were added.

`opt_crit` is labeled โอกาสคริ. Disposable native browser checks verify it can be selected and rolled when absent, and is visible with the correct reason when on either the current or other row. This is not a diagnosis of the owner's particular item; no owner save was accessed.

Validation: native React/shared-command checks at 320/390 px cover all options, changing rows, actual critical and M.ATK outcomes, confirmation/cancel/single-flight, insufficient stones, legacy keep-old and Enchant targets. Browser option state uses the actual HTML `disabled` property (Playwright `isDisabled()` returned false for a native disabled option). Source snapshots preserve historical evidence; only reviewed client/UI and handoff files project back for prior scope checks.

Release verification recorded in builds.json, native.json and hosted.json when available. TASK199 follow-up, no additional task count.

Released product `8d8998a3536077cafa3c3eab5df4e39e0bdc4bae`: 10 focused TS checks, 13 native groups, root and clean committed archive builds (1,736 identical files), and five public hosted groups/27 bundle hashes/15 resource hashes passed. All five durable fingerprints equal TASK199; no save upgrade needed. Public deployment was verified directly after GitHub status endpoints intermittently returned 500/504. Isolated7553 closed; personal6173 untouched.
