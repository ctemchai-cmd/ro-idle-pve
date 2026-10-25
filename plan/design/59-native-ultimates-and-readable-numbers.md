# D170 — Readable native numbers / real asset VFX

25 October2026 · User requested larger damage numbers and every major skill use actual assets only.

Numbers use original bitmap digits/critical background and colors. Baselines are CSSpixels independent of arena zoom: outgoing30,critical38,total38,heal26,incoming24; flight shrink is gentle. Width fitsviewport; side clamp preserves the whole number; amounts,focus rules,hit timing andmulti-hit grouping unchanged.

Scope: all26Hi actives + Class2 active unlock>=30 + existingFINISHER_PROFILES + StormGust/GrandCross/Finger; explicit catalog records everyID. NativeSTR preferred. WhenRO skill was client-code-only, render actual referenced texture with declarative transforms; for missing/renamed/custom skills select native art by role and record adaptation (never claim exactRO behavior). No generated image or invented Canvas particle geometry for scoped skill effects; titles/shake and UI remain presentation. Preserve impact timing/lead/stagger; one native burst peraction whenappropriate. Scoped projectiles use native imagery or native targetclip; no geometric arrow replacement. Use existingasset closure andmeasure32MiBbudgetbefore anyrevision.

Checkpoint,combat/progressiondata,prices,SP/HPcost,skillbalance andsave contracts do not change. Native metadata livesinrenderer adapter so mechanics hashes stay stable. Native motion reduced by userpref; UI numbers remainvisible. Read images only forselected visualreview. Native sourcefiles stay byte-identical.

Bannerเลือกแถบที่ไม่บังตัวเลขเมื่อเริ่มแสดง และล็อกตำแหน่งจนจบเพื่อไม่กระโดดระหว่างmulti-hit. Native clip hue applies consistently to transient and persistent instances.
