# TASK-168 — Hi-class finisher hierarchy

Milestone:M4 · D192 · [design81](../design/81-hi-finisher-hierarchy.md)

## งานที่ต้องรอก่อนหน้า
TASK-145, TASK-163 (done).

## ขอบเขต
ตรวจ26Hi skillsทุกอาชีพและปรับให้Lv1เหนือClass2Aw1ตามrolebenchmark;เก็บClass2เดิม.

## รายละเอียด
Data-drivenexplicitcurves/Chaseskillpowergenericstatus;sharedapplicationmetrics/goldens. GateคงD191.ไม่globalDPSnerf.

## ขั้นตอน
1. เก็บbaselineและวัดroleprobes
2. ปรับเฉพาะdeclaredparameters/postprocessor
3. วัดafter/unit/mobile/full/build/publicและpublish

## เกณฑ์ตรวจรับ
- [x] AC-01:26skills/13jobs/rolefloors/scopeผ่าน
- [x] AC-02:allranks/Aw/Chase/goldens/mechanicsผ่าน
- [x] AC-03:mobile/full/build/publicผ่าน

## วิธีตรวจ
Design81/boundedengineprobes/normalizationเฉพาะpatch164/168/native.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ยืนยันHiLv1.

## ผลตรวจรับ
Source `2ca70bf36` VercelSUCCESS;766TS+48finalfocused/native11/root+filtered/M0/public4groupsผ่าน. [ผลตรวจ](../evidence/task-168-review.json).
