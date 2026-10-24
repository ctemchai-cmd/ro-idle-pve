# TASK-143 — Modern migration v2 icons

Milestone: M4 · D169 · design58 · migration-v2.txt

## งานที่ต้องรอก่อนหน้า

TASK-142

## ขอบเขตและรายละเอียด

ทำตามassets/modern/migration-v2.txtและคำตอบใหม่ผู้ใช้. แยกงานassets/typedmechanics/reviewrelease. ไม่เปิดClass3หรือระบบใหม่อื่น. LogicalIDเดิมคงไว้แม้ชื่อเปลี่ยนเพื่อรักษาเซฟ/receipt. ตัวเลขที่ไม่ได้ระบุเป็นassistantbaselineต้องทดสอบ;ไม่อ้างสูตรROต้นฉบับ.

## ขั้นตอน

1. Freeze/auditcontractและassets
2. Implementเฉพาะscopeพร้อมschema/metadata
3. ตรวจactualeffects/compatibility/validationตามAC
4. ย้ายreviewและdoneเมื่อครบผลส่งมอบของงานนี้;เผยแพร่รวมที่TASK145

## เกณฑ์ตรวจรับ

- [x] AC-01: ไอคอน21รายการตรงพาธmigration-v2.txtรวมRuwach/20Hi;มีprovenance/sidecar/sourceSHAไม่เดาไฟล์
- [x] AC-02: คง152logicalIDs/ต้นทุน/ranks/Awakenและmediaที่ไม่เกี่ยวข้อง;AssCross/StalkerมีpurpleVFXตามคำขอ
- [x] AC-03: runtimepackdependencyครบและอยู่ในbudget,assetchecks+sourcebindingtestsผ่าน

## วิธีตรวจและหลักฐาน

T143-ACxx: design58/frozen143before/sourceSHA/typedunit/actualsim/native/build/hostedตามขอบเขต;report plan/evidence/task-143-review.json. ไม่มีownerwrites.

## Blocker / คำถาม

DoubleCasting/BondFate/Gateตอบแล้ว. ChaseWalkตอบแล้ว:ถัดไปทั้งสกิล ตีปกติไม่กิน.
