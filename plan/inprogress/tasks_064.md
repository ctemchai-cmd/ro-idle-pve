# TASK-064 — แสดงผลการอัปเกรดทันทีและลดรอบเซฟ

Milestone: M4 · อ้างอิง D-088

## งานที่ต้องรอก่อนหน้า

- TASK-021, TASK-022, TASK-063 (done)

## เป้าหมายและผลส่งมอบ

กดอัปเลเวล/แต้ม/สกิล/อุปกรณ์แล้วเห็นผลทันทีขณะบันทึกตามหลัง ใช้sharedreducersเดิมเป็นdisplaypreview ไม่เปลี่ยนconfirmedcheckpoint และคืนค่าถ้าบันทึกไม่สำเร็จ ตามผู้ใช้ที่ย้ำว่าเป็นเกมส่วนตัวไม่ต้องเพิ่มงานกันโกง

คำสั่งเกมทั่วไปใช้DBRPC2รอบ (อ่านcontext+receipt / commit+context) แทน5รอบเดิม นอกเหนือAuthgetUser1รอบ พร้อมแยกเวลาจริงของDB/compute/client ไม่ใช้health401แทนownercommandlatency

## ขอบเขตและรายละเอียด

- Previewเฉพาะผลที่คำนวณได้แน่นอน ไม่เดาผลกาชา/Refine/Fusion; ยังรับคำสั่งทีละรายการและพักเมื่อขาดเน็ต ไม่เพิ่มofflineplay/queue
- SQL007เพิ่มwrapper2ตัวรอบRPCเดิม ไม่มีสูตร/แก้เซฟ/ล้างข้อมูล/เปลี่ยนสิทธิ์ตาราง
- Signedhistory/CAS/receiptbeforeversion/replay/concurrency/rollback/battleguardsเดิม
- ไม่ติดตั้งSQLยังใช้legacyได้ ตรวจPGRST202เฉพาะmissingfunction ไม่fallbackเมื่อconstraint/networkerror
- ไม่แตะ6173 ไม่อ่านlogin ไม่ใช้ownercloudstateทดสอบ ไม่มีserverkeyบนเครื่อง จึงเตรียมSQLให้เจ้าของรันในSupabaseSQL Editorหลังตรวจครบ

## ขั้นตอนทำงาน

1. วัดCPUและแยกเวลาระหว่างserver/DB/browser
2. เพิ่มcombinedRPC/typedstore/APIverifiedreply พร้อมlegacyfallback
3. ตรวจเฉพาะsharedsave regressionsที่จำเป็น (ผลขึ้นก่อนreply/บันทึกแล้วreload/response lossไม่หักซ้ำ/legacyfallback) กับfreshPostgres/Auth/Chrome ไม่เพิ่มระบบกันโกง
4. build/deploy/hostedsmoke; ส่งSQL007ให้ผู้ใช้รัน ตรวจfastpathจริงก่อนปิดงาน

## เกณฑ์ตรวจรับ

- [x] AC-01: ordinaryrecurringcommandใช้RPC2รอบ(+Auth1) ไม่มีreceiptassert/load/reloadHTTPซ้ำ และcheckpointมาจากDBtransactionจริง
- [x] AC-02: displaypreviewไม่เปลี่ยนcheckpoint/backup; response lossคืนค่าที่แสดงและreconcileUUIDเดิมไม่หักซ้ำ; optionalRPCหายใช้legacyได้ แต่DBerrorไม่fallbackเขียนซ้ำ และใช้transaction/guardsเดิมโดยไม่เขียนเซฟเจ้าของ
- [x] AC-03: actualmobileUIกดอัป+1แสดงLv.11ก่อนปล่อยserverrequestที่holdไว้ ภายใน1sรวมautomationบนCPUthrottle4×; ปล่อยrequestแล้วsave/reloadยังLv.11 พร้อมServer-TimingแยกDB/compute ไม่มีownerdata
- [ ] AC-04: build/type/boundaries/secrets/contenthashเดิม/hostedsmokeผ่าน ผู้ใช้ติดตั้งSQL007และมีหลักฐานfastpathบนcloudก่อนdone ไม่อ้างผลlocalhostแทนมือถือจริง

ผู้ใช้ปรับลำดับความสำคัญระหว่างทำ: ลดการทดสอบด้านกันโกงและเน้นความลื่นกับเซฟไม่หาย จึงใช้guardsเดิม ไม่ขยายsecuritymatrixในงานนี้

## วิธีตรวจและหลักฐาน

Targetedtests + freshPostgres/Auth/Chrome; productionอ่านpublicroutesเท่านั้นจนมีบัญชีทดสอบหรือข้อมูลเวลาจากผู้ใช้

## Blocker / คำถาม

หลังตรวจและdeployแล้วต้องผู้ใช้รันSQL007 เพราะไม่มีdatabaseadminconnectionในsession ใช้ไฟล์เดียวไม่มีkeysในSQL ไม่ขอkeysในแชต

## ผลตรวจจริง 21 ต.ค.2026

- 20 targeted TS checksผ่าน รวมpreviewก่อนreply/confirmedbackupไม่เปลี่ยน/lost replyคืนค่าและไม่หักซ้ำ/legacyfallback
- FreshAuth/PostgREST/Postgres+Chrome6กลุ่มผ่าน; DBRPC2รอบจริงในlevel/skill/loadout/equipment/team; actualmobileUIอัปLv.10→11ก่อนปล่อยrequestที่holdไว้ **400msรวมPlaywrightclick overhead ขณะCPU4×** เซฟและreloadยัง11 ไม่ใช่ตัวเลขเครื่องผู้ใช้
- Build/type/boundaries/secrets/contenthash768e12a4เดิมผ่าน; readiness8ผ่าน ไม่มี6173restart/ownercloudwrite
- Round1historical3HTTPbenchmarkfail ไม่ได้เก็บpairedtimingsครบ จึงเพิ่มdiagnosticเฉพาะharnessและรันใหม่โดยไม่เปลี่ยนproduct; round2ผ่านstrictassertเดิม เก็บfailureแยก ไม่อ้างrootcause
- Source65541f2abdeployแล้วและpublicsmoke3กลุ่มผ่าน ก่อนdoneยังต้องSQL007ติดตั้งจริงและcloud2RPCproof; UIpreviewใช้ได้แม้SQLยังไม่ติดตั้ง

รับbundleใหม่: จบไฟต์แล้วreloadเว็บ/PWA ไม่มีauto-reloadกลางไฟต์ แสดงผลทันทีทำงานก่อนSQL007 แต่การลดเวลาบันทึกจริงต้องให้ผู้ใช้รันSQL007เอง

## ข้อมูลผู้ใช้เพิ่มเติม 21 ต.ค.2026

ผู้ใช้ยืนยันรันSQL007แล้วและรายงานว่าเร็วขึ้นครึ่งหนึ่ง ไม่ถือเป็นตัวเลขDBwrite/Server-Timingที่วัดโดยตรง AC04ยังรอinstrumentedcloudfastpath; TASK065ลดAuthHTTPเป็นงานต่อเนื่อง ไม่reopenการรันSQL
