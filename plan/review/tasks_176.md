# TASK-176 — Remove intermediate animation frame overhead

Milestone: M4 · D200

## งานที่ต้องรอก่อนหน้า
TASK-175 (done).

## ขอบเขต
User reports whole battle/number/Timeline frame drops on AndroidChrome/PWA after175. Measure actual BossField/native effects/digits/liveTimeline, then remove repeated pose composition while retaining every profession and original key/contact/ASPD clocks. Renderer-only bounded reusable pose cache shared by the AssetPack across waves/battles, tight source cropping and explicit disposal. No reduced combat/effect features, native source edits, new media, gameplay/schema/save/SQL/env/balance changes or owner access.

## ขั้นตอน
1. Freeze175source/fivefingerprints and compare native/current in the same actual seeded battle HUD/Timeline atCPU4x.
2. Reuse locale formatters and group counts; directly translate Timeline lanes/nowmarker without inherited-root style invalidation. Cache computed poses at native60Hz, rounding down within each ACT interval so no release pose appears early. Keep original ACTkeys exact. Crop by transformed native layer geometry, bound cache RGBAbytes/entries and clear on pack disposal.
3. Verify all32jobs/60rigs/68clips, costume/variant invalidation, exact canonical pixels, mirrors/alpha/bounds/reducedmotion, memory pressure and unchanged engine. Matched realbattle/frame/Timeline aftermeasurement, root/filtered/M0/public release.

## เกณฑ์ตรวจรับ
- [x] AC-01: Native keys and canonical60Hz poses preserve175pixels, all32jobs/68clips/availablegenders/gear supported; no early contact/release or gameplay changes.
- [x] AC-02: Repeated poses avoid recomposition, cached cropped frames have bounded RGBAstorage/entries with rig invalidation/disposal; full BossField+effects+Timeline measured before/after and improves rendering cost.
- [ ] AC-03: Five gameplay/core/pack fingerprints exact, targeted/native/root-filtered/M0/public pass; no owner data access, user assets/6173 untouched.
