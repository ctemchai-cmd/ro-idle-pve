# TASK-174 — Swordsman in-between poses and restrained blending

Milestone: M4 · D198

## งานที่ต้องรอก่อนหน้า
TASK-020, TASK-173 (done).

## ขอบเขต
User explicitly wants more continuous poses (not performance FPS) and authorized combining computed intermediate poses + restrained frame blending, first Swordsman sword attack only. Both native male/female rigs, complete head/weapon/gear coupling, original ACT key poses and900ms duration/contact unchanged. Use original pixel art and computed neck/root anchored intermediate compositions, no claim of hand-drawn new sprites. Keep one head, narrow24ms texture blend to reduce ghosts. Reducedmotion/native fallback. Readonly public /animation-preview compares original vs new with gender/facing/pause/scrub; no Auth/save/APIwrites. Otherjobs/animations/assets/pack/core/DPS unchanged.

## ขั้นตอน
1. Inspect native9frames100ms/anchors/overlay clocks and freeze source/fingerprints.
2. Implement renderer-only intermediate pose composition with bounded reusable scratch and a comparison page; enable only Swordsman attacks.
3. Exactnative-keyframe/mirror/attachment/pixel/CPU/mobile timing checks, build/M0/public, publish.

## เกณฑ์ตรวจรับ
- [x] AC-01: Original key times and contact/release unchanged; new intermediate poses from original art, one shared rig clock, untouched source metadata; static reduced motion and other jobs exact.
- [x] AC-02: Actual native male/female left/right comparisons, >=18 distinguishable samples, fixed root/continuous head, no crop/opacity darkening, bounded scratch/CPU; mobile320390 controls work.
- [ ] AC-03: Core5fingerprints/pack unchanged, focused/native/build/M0/public pass; no owner/Auth/save/SQL/env/media edits.

## ผลตรวจ
68focusedTS/7nativegroups/12worncases/root+filtered/M0ผ่าน; รอVercel/public. [หลักฐาน](../evidence/task-174-review.json). Exactblendmidpointมีขอบซ้อนได้ เป็นข้อจำกัดของcomposition ไม่อ้างspriteวาดใหม่/ทุกอาชีพ/phoneFPS.
