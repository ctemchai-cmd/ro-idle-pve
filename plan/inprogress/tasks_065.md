# TASK-065 — ตัด HTTP ตรวจล็อกอินซ้ำในเส้นทางเซฟ

Milestone: M4 · อ้างอิง D-089

## งานที่ต้องรอก่อนหน้า

- TASK-021, TASK-063 (done)

## เป้าหมายและขอบเขต

หลังผู้ใช้รัน SQL007 แล้วรายงานว่าเร็วขึ้นครึ่งหนึ่ง ให้ลด Auth HTTP ที่ยังเกิดทุก mutation แทน `getUser` ด้วย SDK `getClaims` ตรวจลายเซ็น/expiryกับ project JWKS ที่ SDK cache ไว้ ไม่มี cache ผลอนุญาต/ownerstate ไม่มีการเปลี่ยนสูตรหรือคำนวณเกม SQL

## รายละเอียดและขั้นตอน

1. ตรวจ source SDK/เอกสารหลักและ public JWKS โปรเจกต์จริงก่อนเลือกวิธี
2. ใช้ verified claims เท่านั้น ตรวจ issuer/audience/role และ UID; symmetric HS256 ยังใช้ SDK fallbackไป Auth จริง
3. ตรวจ SDK จริงด้วย ES256 fixture: cold fetchkeyหนึ่งครั้ง, warm zero HTTP, expiry/signature/issuerไม่ถูกต้องถูกปฏิเสธ; ตรวจ compatibilityกับ local upstream Auth เดิม
4. build/deploy/public smoke; แยกหลักฐานการลด HTTP จากเวลาเซฟของผู้ใช้

## เกณฑ์ตรวจรับ

- [x] AC-01: actual SDK ES256 verification ใช้ JWKS HTTP1ครั้งแล้วคำขอถัดไปไม่ติดต่อ Auth; verified identityถูกต้อง และผิด signature/expiry/issuer/audience/roleไม่ยอมรับ
- [x] AC-02: local HS256 upstream Auth/PostgREST API sign-in/owner-save/retryยังผ่านด้วย SDKfallback และไม่มี ownercloudwrite/6173restart
- [ ] AC-03: build/type/boundaries/secretsผ่าน contenthashเดิม; โค้ดขึ้น Vercelและpublicsmokeผ่าน ไม่มีenv/SQLใหม่ ไม่อ้างตัวเลขphoneที่ยังไม่วัด

## วิธีตรวจและผลส่งมอบ

Targeted auth/SDK tests, existing fresh local stack, build, hosted public proof; user-facing explanationว่า requestdurationรวมnetwork/API/Auth/DB ไม่ใช่เวลาที่DBเขียนเพียงอย่างเดียว

## Blocker / คำถาม

ไม่มีสำหรับimplementation; actualownerlatencyยังต้องดูคำขอจริงหลังdeploy ไม่มีบัญชีทดสอบcloud/adminconnectionในsession

## ผลตรวจจริง

41targetedchecksผ่าน (รวมexactspeedparity/CC/dailyspatial/backuprefund/authSDK); build/type/boundaries/secrets/contenthash768e12a4เดิมผ่าน; actualfreshAuth/PostgREST/Postgres/Chrome daily60s Essenceจบที่4x/finish1ครั้ง/reload/คืนquotaพร้อมsignedbackupและกันซ้ำ4กลุ่มผ่าน ไม่มีownercloudwrite/6173restart รอdeploy/publicproof และกรณี067ยังต้องผู้ใช้กดคืนสิทธิ์ในบัญชีจริง
