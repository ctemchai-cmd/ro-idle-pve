# TASK-189 — Artifact หน้าตัวละครและร้านสุ่ม

Milestone: M4 · D211

## งานที่ต้องรอก่อนหน้า
TASK-014 (done)

## ขอบเขต
ช่องArtifactต่อจากaccessory/shoesในgear-col,shareditemSheet,managementหน้าactor;ร้าน5tabs/ArtifactSummonแยก/ราคาticket+Crystalจริง/ผล10ชิ้นและสุ่มต่อ/confirmationและsingleflightเดิม. ดู [design94](../design/94-icons-artifact-ui.md). Renderer/client/UIเท่านั้น;ไม่เปลี่ยนกติกาหรือเซฟ.

## ขั้นตอน
1. ล็อกbaselineและเลือกassetจากคลังจริง
2. ทำsharediconresolver/sharedArtifactSheetและUIมือถือ
3. ตรวจlazy/prepare/native320390/receipt-cost-repeat/strict/hash
4. rootและcleancommittedcheckoutbuild/push/Vercel/publicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: UIตามขอบเขตและsourceassetถูกต้อง
- [x] AC-02: core/data/schema/contenthashเดิม;ไม่มีราคา/สิทธิ์/เซฟใหม่
- [x] AC-03: targeted/native320390/strict/build/pack32MiBผ่าน
- [ ] AC-04: cleancommittedcheckoutและVercel/publicผ่าน

## ผลตรวจ
47 targeted TS/4 new cases, native320390 8groups, strict/rootbuild/M0ผ่าน. รอcleancommittedGitและVercel/publicก่อนdone. [หลักฐาน](../evidence/task-188/local-verification.json).
