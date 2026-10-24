# TASK-144 — Hi-class v2 composable skills

Milestone: M4 · D169 · design58 · migration-v2.txt

## งานที่ต้องรอก่อนหน้า

TASK-143, TASK-142

## ขอบเขตและรายละเอียด

ทำตามassets/modern/migration-v2.txtและคำตอบใหม่ผู้ใช้. แยกงานassets/typedmechanics/reviewrelease. ไม่เปิดClass3หรือระบบใหม่อื่น. LogicalIDเดิมคงไว้แม้ชื่อเปลี่ยนเพื่อรักษาเซฟ/receipt. ตัวเลขที่ไม่ได้ระบุเป็นassistantbaselineต้องทดสอบ;ไม่อ้างสูตรROต้นฉบับ.

## ขั้นตอน

1. Freeze/auditcontractและassets
2. Implementเฉพาะscopeพร้อมschema/metadata
3. ตรวจactualeffects/compatibility/validationตามAC
4. ย้ายreviewและdoneเมื่อครบผลส่งมอบของงานนี้;เผยแพร่รวมที่TASK145

## เกณฑ์ตรวจรับ

- [x] AC-01: ปรับ20Hi skillsตามmigration-v2รวมAssumptio/BondFate/Aura/Spiral/Champion/HW/Professor/Stalker/WS/Creator;GospelและCartTerminationคงผลเดิมเว้นภาพ
- [x] AC-02: BondFateลิงก์10sเลือกเพื่อนพลังสูงสุดล็อกเป้าเพิ่มlaneสูงสุดด้วย40–60%casterMATKและฮีลทันที80%MATK/วิพร้อมเส้นเชื่อม
- [x] AC-03: Gateจ่าย5ballsและSPตอนเริ่มร่าย,HPถึง1%เมื่อเกิดดาเมจคิดจากเสียจริง;DoubleCastingสุ่มสูงก่อนและเฉพาะBolt;ChaseWalkตามคำตอบผู้ใช้
- [x] AC-04: ทุกphase/rank/Awakenมีคำอธิบายและผลจริง;พฤติกรรมใช้typedcomposition+seededengineร่วมruntime/headless/checkpoint
- [x] AC-05: คงIDs/skillledger/cap/costอื่น/4slots/CC/SPrules;oldsavebackup/replay/migrationไม่reset

## วิธีตรวจและหลักฐาน

T144-ACxx: design58/frozen143before/sourceSHA/typedunit/actualsim/native/build/hostedตามขอบเขต;report plan/evidence/task-144-review.json. ไม่มีownerwrites.

## Blocker / คำถาม

DoubleCasting/BondFate/Gateตอบแล้ว. ตอบครบแล้ว ไม่มีคำถามpending.

## ผลตรวจ

38 targeted checksผ่าน รวม15D169 groups, 20legacyactualpaid builds, serialized checkpoint/speedparity, exact34documentscope และ78numericgoldens. Native4groupsผ่าน. หลักฐานรายละเอียดในtask144-review.json; full/releaseอยู่TASK145.
