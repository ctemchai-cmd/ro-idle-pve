# TASK-152 — เลขใหญ่ขึ้นและเด้งกระแทกขึ้น

Milestone: M4 · D176 · design65

## งานที่ต้องรอก่อนหน้า
TASK-150, TASK-151

## ขอบเขตและผลส่งมอบ
ขยายฐานเลขประมาณ13% และเพิ่มแรงpopช่วงแรก. พุ่งสูง/เร็วขึ้นเล็กน้อย คงวิถีขวาบนแล้วโค้งตก/ย่อส่วน. ใช้nativefont/สี/focus/ยอดจริงเดิม. ไม่เปลี่ยนสมการดาเมจ/เซฟ/assetpack.

## ขั้นตอน
1. ปรับCSSheight/popและแรงวิถีร่วมกัน
2. เทียบnativeก่อน-หลัง320390และใช้ชุดตรวจเลขเดิม/TSเดิม
3. BuildและตรวจVercelจริงก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: เลข4หลักที่ต้นและช่วงอ่านเพิ่มขนาดอย่างเห็นได้ชัดทุกชนิด;แรงเริ่มพุ่ง/จุดสูงสุดมากขึ้น และยังโค้งตกขวา/ย่อส่วน;focus/amount/สี/ตัวเลขรวม/reducedmotion/1x2x4เดิมผ่านnative320390และภาพเทียบ
- [x] AC-02: gameplaySHA/packเดิม,existingTS/native/build/publicผ่าน โดยไม่มีownerwrites/SQL/env/6173restart

## วิธีตรวจและหลักฐาน
Native bitmap before/after bounds and captures;existing number-flight harness with isolated evidence destination;focused TS/rootbuild/public read-only. plan/evidence/task-152-review.json.

## Blocker / คำถาม
ไม่มี.

## ผลตรวจlocal

10existingTS/native4groups/60before-after samplesผ่าน. Firstpop>=18%ทุกชนิด,ช่วงอ่าน>=8%,vertical40ms+31%/horizontal+24%,วิถีเดิมเร็วขึ้น620ms. ActualgameplaySHA/packcb126เดิม. รอbuild/publicก่อนdone.

## ผลตรวจเว็บรอบแรกและแก้ไข

Source8eaขึ้นเว็บแล้วแต่hostedพบedgeclampย้อนซ้ายระหว่างย่อ. แก้retainedoriginจากตำแหน่งที่paintจริงและเพิ่มedgechecks;ยังไม่ปิดACจนhostedรอบแก้ผ่าน.

## ผลส่งมอบ

Source120558a4b/VercelSUCCESS. Hosted4groups/24bundleSHA/nativeheal320390height46.08/45.15px และxไม่ย้อนผ่าน.10TS/native4/60comparison/rootbuild/M0ผ่าน. TASK152done.
