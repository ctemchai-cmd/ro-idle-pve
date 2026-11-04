# Native summoned plants and focused damage — 4 November 2026

Root cause: plant damage events name the summoned actor, while outgoing floating numbers matched only the selected party actor. The renderer now records summon ownership, retains it on each number cue through despawn, and displays plant hits when their owner is focused. Other owners stay filtered; incoming/healing rules, actual values and combat metrics are unchanged.

Summon visuals now load original RO Flora and Geographer SPR/ACT exports instead of the procedural sprout. Flora represents Hell Plant in this game; this is a documented artwork adaptation, not a claim of exact original GN_HELLS_PLANT fidelity. Bio Cannibalize uses Geographer. Original media pixels/alpha/keyframes are retained. Source red RGB is already transparent (alpha0); the initial matte hypothesis was discarded after pixel inspection. No color-key processing or generated art ships.

Native idle/attack poses use actual summon lifetime and tick events; attack playback begins at the source contact frame. Reduced motion uses a static idle frame. Draw order follows actor depth, and spatial summons use their actual fixed engine positions; abstract legacy scenes retain their fallback position. This changes only presentation.

The pack loads plant media only for prepared plant skills and deduplicates it.906assets/1697payloads/33181500total bytes including manifest; initial1546658bytes unchanged. All four gameplay/content/schema/core fingerprints remain exactly TASK193. No balance, SQL, env, account writes or6173 restart.

Checks:21focused TS including owner-filter regression; source/runtime pack verification; native Chrome at320/390 checks both plants, actual hit values, wrong-focus suppression, last-hit retention after source despawn, static reduced motion, actual spatial coordinates and one-kind-only loading.4groups pass, no browser errors/writes. Final screenshots inspected. The HMR failure was a test-page reload during concurrent code generation; final browser checks ran after build on frozen source. Initial reports are retained for that distinction. Build and clean committed/public verification are recorded in separate files.

Released product `1fc32c80cc6c416a37bb7b8c2c86c51257fd2d9d`: VercelSUCCESS, exact committed build1734identical files, public five groups/27bundleSHA/four plant payloadSHA and actual public previews of both plant skills. See deployment.json/builds.json/hosted.json. Own test server7545 closed; no owner access.
