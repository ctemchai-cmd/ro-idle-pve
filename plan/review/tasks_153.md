# TASK-153 — ยืนยันย่อยการ์ด/สุ่มต่อ และเลข-พื้นออร่าชัดเจน

Milestone: M4 · D177 · [design66](../design/66-card-actions-and-field-clarity.md)

## งานที่ต้องรอก่อนหน้า
TASK-139, TASK-151, TASK-152 (done)

## ขอบเขตและผลส่งมอบ
ยืนยันก่อนย่อยการ์ดสองหน้าที่กดได้ทันที;สุ่มต่อจากหน้าผล. เลขเด้งสูงขึ้น/วงเพลงครอบทีม/Sanctuaryพื้นขาวจากnativeassets. ไม่แก้เกมเพลย์/เซฟ/บาลานซ์.

## รายละเอียด
ตามdesign66;sharedUIconfirmation/single-flight/receiptเดิม;nativebitmap/typedgroundtiles/ellipseตามตำแหน่งจริง. ทุกผลต้องผ่านlocal/publicก่อนปิดงาน.

## ขั้นตอน
1. ตรวจsourceและเก็บbaseline;กำหนดกติกาUI/visual
2. แก้sharedcomponents/renderer/config/runtimeartifact
3. ตรวจactualReact+reducers/nativeCanvas320390/TS/source/build
4. Push/Vercelและตรวจpublic;บันทึกหลักฐานแล้วจึงdone

## เกณฑ์ตรวจรับ
- [ ] AC-01: เลขสูงขึ้นและวงเพลงครอบทีมจริง;Sanctuaryเป็นพื้นขาวnative ไม่ใช่วงรูนทั่วไป โดยคงtiming/expiry/reduced-motion
- [ ] AC-02: Cancelย่อยไม่เสียการ์ด;Confirmครั้งเดียวทั้งสองทาง;สุ่มต่อ1/10มีราคา/ป้องกันซ้ำและเงินหรือคลังไม่พอ/failedไม่ล้างผลเดิม
- [ ] AC-03: เก็บgameplay/sourcepixelsเดิม;pack32MiB/initialไม่เพิ่ม;focusedTS/native/mobile/build/M0และpublicผ่าน ไม่มีownerwrites

## วิธีตรวจและหลักฐาน
ตามdesign66และT153-AC01..03 ในacceptance-matrix. ผลในplan/evidence/task-153-review.json;native.json/ui.json/hosted.json/number-native.json.

## Blocker / คำถาม
ไม่มี.

## ผลตรวจ local

24focusedTS/nativeเลข4groups/ground7groups/UI4groups320390ผ่าน. UIพบEscapebubbleทำให้ปิดparent;แก้stopPropagationและทดสอบซ้ำผ่าน. ตัวเลขapex100world/620ms,เพลงmin420×260และellipseรวมมุมทีม,Sanctuarynative25tiles. Source304/60460และruntimeverifyผ่าน. รอrootbuild/publicก่อนdone.

Freshrootbuild/strictTS/boundaries/secrets/M0ผ่าน;pack33466791<33554432/initial1600070เดิม. รอpublicrelease.
