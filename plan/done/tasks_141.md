# TASK-141 — HUDบอสกระชับและเปิดพื้นที่ดาเมจ

Milestone: M4 · อ้างอิง design30/52 · ผู้ใช้ขอPanelเล็กลง

## งานที่ต้องรอก่อนหน้า

TASK-138, TASK-140 (done)

## ขอบเขตและผลส่งมอบ

ย่อHP/ข้อมูลบอส ย้ายcontrolsไปdockล่าง ย่อparty/focusและcastโดยคงnativeartและความหมาย. เพิ่มหน้าจบ/กลุ่มปุ่มตามคำขอเพิ่มเติมของผู้ใช้. เปลี่ยนเฉพาะpresentation ไม่ขยับตำแหน่งactor/ตัวเลข/engine.

## ขั้นตอน

1. วัดboundsและglyphดาเมจจริงของHUDเดิม
2. แยกheader/controls/dock ใช้compactธาตุและขนาดที่ยังมีaccessiblelabel
3. ดูภาพ/วัด320390และจอเตี้ย ทดสอบปุ่ม/Auto
4. review/build/deploy/hostedก่อนdone

## เกณฑ์ตรวจรับ

- [x] AC-01: HPบอสและข้อมูลย่อสูงไม่เกิน52px และลดพื้นที่ด้านบนอย่างน้อยครึ่งหนึ่งเทียบเดิมที่320390;ธาตุ/ขนาด/HPยังอ่านหรือเปิดรายละเอียดได้
- [x] AC-02: ย้ายสถิติ/Timeline/speed/retreat/Autoเป็นแถวเดียวในdockล่าง;ปุ่มอย่างน้อย36pxและAuto/แพ้0of3ยังชัด;แถบทีม/สถานะไม่ทับกัน
- [x] AC-03: actualnativeบน320x640/390x844เห็นwhite/yellowdamageจากengineและcaptureglyphbounds;ตรวจไม่ให้HP/controlsบังตัวเลขในตัวอย่างและเปิดปุ่มหลักได้ ไม่มีhorizontaloverflow
- [x] AC-04: uncachedroot+filteredbuild/M0/publichostedผ่าน;ไม่เปลี่ยนengine/สูตร/การเซฟ/ข้อมูลและไม่owner/SQL/env/6173

- [x] AC-05: หน้าจบStory/Tower/Dailyจัดปุ่มหลัก44px/รอง36pxเป็นกลุ่ม;แยกbodyเลื่อนกับfooterที่เห็นเสมอบน320x568/390x844;next/retry/team/exit/Stats/Timelineและlocked/pending/Autoคงcallbacksเดิม

## วิธีตรวจและหลักฐาน

T141-AC01–05:plan/evidence/task-141-review.json/nativebefore-after/build/hosted. NativeUIกับenginefixture ไม่ใช่Auth/API/SQLproof.

## Blocker / คำถาม

ไม่มี

## ผลreview

LocalnativeHUD3/result2(16cases),uncachedroot+filteredbuild/M0/readiness8/VercelSUCCESS3d431a78c/publichosted4groupsผ่าน. TASK142ยังต้องทำต่อ.
