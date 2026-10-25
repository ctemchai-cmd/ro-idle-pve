# TASK-149 — วงออร่าเพลง Bard/Dancer

Milestone: M4 · D173 · design62

## งานที่ต้องรอก่อนหน้า
TASK-146, TASK-148

## ขอบเขตและผลส่งมอบ
เพลง8ท่าของBard/Dancerมีวง native bitmap ใต้ผู้ร่ายพร้อมโน้ตเพลง. รวมบัฟหลายเป้า/หลายชั้นเป็นวงเดียวต่อผู้ร่าย. ตามตำแหน่งจริง/ผลสถานะจริง/หมดเวลาแล้วหาย. Hiที่ใช้เพลงเดิมรองรับด้วย. ไม่เพิ่มrange/channel/บัฟ/ราคา/สูตรหรือแก้เซฟ.

## ขั้นตอน
1. ตรวจsource metadata/staticpixelsและfreeze gameplaySHA
2. เพิ่มtyped renderer config/โหลดassetเฉพาะเพลง/deriveวงจากstatus source+expiry
3. ตรวจactual shared-engine base/Awaken/stack/interrupt/expiry/1x2x4/reducedmotion/mobile
4. Assetbuild32MiB/rootbuild/publicVercelและบันทึกreview

## เกณฑ์ตรวจรับ
- [x] AC-01: เพลง8ท่าอ่านactualsource/status/expiry;หลายคนได้บัฟไม่คูณวง,คนร่ายสองคนมีวงแยก,ร่ายซ้ำไม่ทำให้วงซ้อน;ไม่มีสถานะหรือร่ายถูกขัดไม่มีวง;ตามตำแหน่งและหายเมื่อหมดผล/ผู้ร่ายตาย;รองรับbase/Awaken/Hiและ1x2x4/reducedmotionโดยไม่เปลี่ยนengine
- [ ] AC-02: ใช้เฉพาะnativepriest_angel_ring/ain_note_01จริงที่ตรวจภาพแล้ว;วงอยู่ใต้ตัวละคร/ไม่บังตัวเลข,มือถือ320390และbounded draw costผ่าน;สองassetเตรียมก่อนbattleไม่โหลดระหว่างframe/initialprofileเดิม;sourceintegrity/32MiB/build/push/Vercel-publicผ่าน;ทุกgameplaySHAเดิม

## วิธีตรวจและหลักฐาน
Pure status projection with actual immutable engine status view; actual Canvas/native texture drawImage captures and selected visual review at320390. Focused TS, source assets, build, publicread-only verification. Report plan/evidence/task-149-review.json.

## Blocker / คำถาม
ไม่มี. ไม่owner/AuthSQL/env/6173/agents/balancebatch.

## ผลตรวจ local

18focusedTS/native5groups(16base-Aw/จริง2performers/movement-expiry/reducedmotion/1x2x4/boundedCPU4x4aurasp951ms)/source30460460/M0/rootbuildผ่าน. Gameplay/contenthash2c85เดิม;initial1621492เดิม;packc622raw33546959<32MiB. รอpublicVercelก่อนAC02.
