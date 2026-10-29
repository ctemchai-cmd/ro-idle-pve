# TASK-175 — Native attack in-betweens for every playable profession

Milestone: M4 · D199

## งานที่ต้องรอก่อนหน้า
TASK-174 (done).

## ขอบเขต
Expand the approved computed native-art attack treatment to every currently playable Class1/Class2/Hi profession:32jobs/60presets/68attackclips, both available sexes and facings, including weaponless Monk/Champion variants and bow release poses. Keep attack/cast/impact clocks, original key pixels, single head and overlay clocks, original idle/walk/cast/hurt/death and static reducedmotion. No gamepower/data/save/SQL/env/newmedia. Comparison page selects all jobs, supported sexes and actual attack variants with fixed per-clip fitting.

## รายละเอียด
Old Swordsman shear guard rejected126/2870sampled points in larger bends/recovery. Choose mild shear or a root/neck preserving rotation+uniformscale transform once per native pair instead of rejecting those native pairs or overstretching torsos. Retain24ms native texture mix and reused4×384²scratch (2,359,296bytes); composite whole rig before mirroring to eliminate directional raster seams; head is rendered once. These are computed compositions, not new hand-drawn sprites; midpoint outlines may overlap.

## ขั้นตอน
1. Freeze174sources/corefingerprints and audit every preset, actual variant, attachment and release marker.
2. Enable generic player attack composition; safely handle larger bends and extend readonly comparison controls/fitting.
3. Test every clip/sex/facing: exact source keys, all intermediate eligibility, unchanged contact/cadence, overlays/mirroring/bounds and memory/CPU. Visually inspect profession contact sheets. Root/filtered build/M0/publicverify, then publish/close.

## เกณฑ์ตรวจรับ
- [x] AC-01: Every playablejob/preset/variant covered; source key pixels/duration/release and all nonattack/reducedmotion paths unchanged; no unsupported native pairs silently omitted.
- [x] AC-02: Actual native pixels for60presets/68clips/bothfacings, worn gear across tiers, one attachedhead, fixed root/finite continuous transforms, no scratchcropping, bounded memory/CPU; comparison32jobs/mobile320390/variants work.
- [ ] AC-03: Five gameplay/schema/core/pack fingerprints exact, focused/native/root-filtered/M0/public passed; user assets and owner saves untouched.

## ผลตรวจ
73focusedTS/5new/native6groups/32jobs60presets68clips136facings360worn/root+filtered/M0ผ่าน; รอVercel/public. [ผลตรวจ](../evidence/task-175-review.json).
