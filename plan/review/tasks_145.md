# TASK-145 — Hi-class v2 review and release

Milestone: M4 · D169 · design58 · migration-v2.txt

## งานที่ต้องรอก่อนหน้า

TASK-143, TASK-144

## ขอบเขตและรายละเอียด

ทำตามassets/modern/migration-v2.txtและคำตอบใหม่ผู้ใช้. แยกงานassets/typedmechanics/reviewrelease. ไม่เปิดClass3หรือระบบใหม่อื่น. LogicalIDเดิมคงไว้แม้ชื่อเปลี่ยนเพื่อรักษาเซฟ/receipt. ตัวเลขที่ไม่ได้ระบุเป็นassistantbaselineต้องทดสอบ;ไม่อ้างสูตรROต้นฉบับ.

## ขั้นตอน

1. Freeze/auditcontractและassets
2. Implementเฉพาะscopeพร้อมschema/metadata
3. ตรวจactualeffects/compatibility/validationตามAC
4. ย้ายreviewและdoneเมื่อครบผลส่งมอบของงานนี้;เผยแพร่รวมที่TASK145

## เกณฑ์ตรวจรับ

- [x] AC-01: วัดactualbefore-afterแบบboundedmatchedseed/equalbudget/bossเดียวกัน,รายงานtotalDPS/skilldamage/HPcost/supportไม่ตัดสินsupportด้วยsoloDPS
- [x] AC-02: ทดสอบmechanics/invalidschemas/expiry/death/multihits/interruption/1x2x4/checkpoint/oldreceiptsพร้อมfullTSและM0
- [x] AC-03: native320390ครบภาพ/description/Link/Timeline/HPsacrifice/multihitและpurpleVFX;root+filteredbuild/assetsผ่าน
- [ ] AC-04: pushและVercelSUCCESSพร้อมpublichostedตรวจcontent/pack/API/bundles/mobile;ไม่owner/SQL/env/6173restart

## วิธีตรวจและหลักฐาน

T145-ACxx: design58/frozen143before/sourceSHA/typedunit/actualsim/native/build/hostedตามขอบเขต;report plan/evidence/task-145-review.json. ไม่มีownerwrites.

## Blocker / คำถาม

ตอบครบทุกข้อ. ChaseWalkเสริมสกิลโจมตีถัดไปทั้งท่า ตีปกติไม่กิน.
