# TASK-142 — แยกบทบาทสกิลซ้ำและBlessing/Ruwach

Milestone: M4 · D168 · design57

## งานที่ต้องรอก่อนหน้า

TASK-124, TASK-136, TASK-141 (doneก่อนเริ่มimplementation)

## เป้าหมายและขอบเขต

ผู้ใช้ขอแยกสกิลซ้ำ เช่นEndure/AutoGuard,Blessing/Impo;รวมIncreaseAGIในBlessing แล้วเปลี่ยนIncreaseAGIเป็นRuwachโจมตี+ลดDEF/MDEF. ตรวจทั้งcatalog/normal-Awaken/คำอธิบายทุกrank/ภาพตรงสกิล. Preserve logical IDs/ranks/loadouts/Awaken/actualpaid/cost/timing/unlock/stack policy;ไม่resetownerหรือเพิ่มSQL. จะแยกsharedต้นไม้/copyspellและBard-Danceridentityจากduplicateที่แย่งActiveช่องจริง พร้อมรายงานเหตุผล.

## ขั้นตอน

1. Freezeก่อนแก้และaudit152base/Awakenกับduplicate signature
2. ออกแบบเอกลักษณ์แต่ละcluster ใช้typedprimitives/statusเดิมก่อนเขียนengineใหม่
3. Patchเฉพาะdefinitionsที่ต้องแก้/assetRuwachจริง/อัปเดตdescriptionsทุกrank
4. Actualeffect/rank/Awaken/cost/scope/migration tests + M0/assets/build/mobile
5. Fulltestsและdeploy/hostedก่อนdone

## เกณฑ์ตรวจรับ

- [ ] AC-01: BlessingรวมASPDของIncreaseAGIและแยกแกนบัฟจากImpo;RuwachHolyMATKโจมตี+ลดDEF/MDEFพร้อมicon/effectถูกชนิด
- [ ] AC-02: auditทั้ง152base/Awakenและแก้กลุ่มซ้ำจริงให้มีบทบาทต่างกัน รวมEndure/AutoGuard;sharedancestry/copyspell/pairedhealsต้องระบุเหตุผลหรือแยกจังหวะโดยคงidentity
- [ ] AC-03: ทุกrank1–10มีความก้าวหน้าและAwaken1ดีกว่าbaseMaxในผลหลักรวม;อธิบายP.ATK/M.ATK/DEF-MDEF/เป้าหมาย/ระยะเวลา/CCให้ตรงจริง
- [ ] AC-04: ใช้sharedengine/statuspipeline;buffindependent/noaggregatecap/normal4slot/SPcaststart/retryrulesเดิม;นอกscopebyteเท่าเดิมและprice/timing/unlockไม่เปลี่ยน
- [ ] AC-05: เซฟเดิมคงskillrank/slot/Awaken/paidledgerและแปลงversionผ่านbackupflow,oldreceiptsยังอ่านได้;ไม่owner/SQL/env/6173
- [ ] AC-06: meaningfulactualeffects/fulltests/M0/assets/root+filteredbuild/nativeUI/hostedผ่านก่อนdone;รายงานขอบเขตไม่อ้างglobalbalanceจากแค่unit

## วิธีตรวจและหลักฐาน

T142-AC01–06:plan/evidence/task-142-review.json(เตรียมเมื่อเริ่ม);design57/audit/rank-engine/scope/refund/pack tests. ยังไม่เริ่มimplementation.

## Blocker / คำถาม

ไม่มีคำถามผู้ใช้ รอTASK141doneและตรวจschema/formulaรองรับก่อนล็อกbaselineตัวเลข
