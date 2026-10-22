# TASK-088 — กู้คำขอเซฟค้างและปลดหน้าตีบวกโดยไม่รีสตาร์ต

Milestone: M4 · D-117

## งานที่ต้องรอก่อนหน้า

- TASK-022, TASK-063, TASK-065 (done)

## เป้าหมายและขอบเขต

ผู้ใช้รายงานตีบวกแล้วปุ่มเทาตลอด/เริ่มไฟต์ไม่ได้จนrestart พบbrowsercallไม่มีdeadlineทั้งtoken/fetch/bodyและreconnectสามารถแทรกepochขณะwrite อีกจุดคือsame-userAuthrefreshระหว่างรอSDKgetSessionทำให้คืนnullจนsaveเข้าsigned_outทั้งที่Authยังsigned_in เพิ่มbounded15sI/Oพร้อมAbortSignal, reconcileUUIDเดิมอัตโนมัติเมื่อtimeoutครั้งเดียว และข้อความ/ปุ่มตรวจผลที่อยู่ภายในSheetซึ่งไม่ถูกnativeDialogทำinert

ไม่ปลดwriterโดยเดาว่ายังไม่บันทึก ไม่ล้างpending/คืนของ/ส่งUUIDใหม่ ไม่เปลี่ยนอัตราตีบวก/ต้นทุน/SQLหรือย้ายเซฟเจ้าของ คงsingle-writer/CAS/receiptreplay/online-primary

## ขั้นตอนการทำ

1. ทำreproheldreply/heldtoken/latecommitและvisibilityขณะwrite
2. ทำcontrollerdeadlineครอบportsและaborttransport, guardreconnectระหว่างsaving และretrylookupUUIDเดิมแบบbounded
3. แสดงnoticeหลังรอ3sและretryในทุกSheetที่เกี่ยวข้องโดยไม่เพิ่มsaveขณะดู
4. ทดสอบfocusedและactualdisposablelocalstack/Chromeheldrequest ให้commitหนึ่งครั้ง/กลับready/เริ่มไฟต์ได้
5. Build/push/deploy/publicproofก่อนreviewdone

## ผลส่งมอบ

- Bounded save recovery/abort + reachable dialog retry
- replay/failure/actualbrowser/hosted evidence

## เกณฑ์ตรวจรับ

- [ ] AC-01: คำขอเซฟ/อ่านreceipt/checkpointรวมรอtokenและbodyมีdeadline15s/AbortSignal ไม่ค้างsaving/loadingตลอดไป; timeoutตอนเขียนตรวจreceiptและreconcileคำสั่งUUIDเดิมอัตโนมัติครั้งเดียว ไม่เพิ่มหักทอง/หินหรือสุ่มตีบวกซ้ำ
- [ ] AC-02: visibility/reconnectระหว่างwriteไม่แทรกepochจนทิ้งผลสำเร็จ; ใช้validcachedtokenและยอมรับsame-userrefreshใหม่โดยไม่ทำfalse signed_out คงexpiry/logout/401; late reply/failed recovery/offline/disposeไม่ทับcheckpointใหม่ pendingและbackupเดิมคง เมื่อrecoverแล้วกลับreadyและเริ่มไฟต์/ทำรายการต่อได้
- [ ] AC-03: ในSheetที่กำลังตีบวก/ทำรายการมีข้อความเมื่อรอนานและปุ่มตรวจผลใหม่เมื่อผิดพลาด กดได้โดยไม่ต้องปิดเกม; focusedreplay/timeout/transport+actualdisposableAuth/API/SQL/Chromeheldreply+build/hostedผ่าน ไม่แตะownerเซฟ/6173/SQL/env

## วิธีตรวจและหลักฐาน

Existingrecurring-save+transporttestsเพิ่มheldI/O cases และactualisolatedAuth/API/SQL/mobileChromeที่ทำจริงcommitแต่holdreply เก็บtask088-* ไม่ใช้ownerlogin/env/save
