# TASK139 — ร้านค้า / แลกเศษสกิล / Panel

ผู้ใช้ขอปรับ UI ห้าข้อตาม D167/design56. Local ผ่านแล้ว; สถานะเผยแพร่ดู `task-139-review.json` และ `hosted.json`.

- Crystal แลก20ครั้ง/วัน ครั้งละ10 ที่25,000ทอง. วัสดุทั่วไป10ครั้ง/วัน; ราคา EXP2,500/manual3,000/ore4,000/enchant5,000ทอง. ราคา Crystal ของแพ็กอื่นเดิม. ใบธาตุ6,000ทอง/99สิทธิ์. ไม่มีการรีเซ็ต counter หรือคิดราคาเก่าย้อนหลัง.
- ปุ่ม “แลกหมด” แสดงจำนวนและราคารวมตามเงิน/โควตา/ความจุ; หนึ่งคำสั่งและหนึ่ง revision. Quote/reducer/max ใช้ `domain/progression/shop.ts` ร่วมกัน; schemaรับสูงสุด99.
- เศษสกิลมีแท็บ อัตราแลก ไอคอน native ตัวเลือกจำนวน และปุ่ม44px. กติกา10→1/1→5เดิม. ย้ายข้อความช่วยหา Crystal ออกจากกาชา; Panelขาวฟ้าเข้าธีม โดยคงสี rarity/ม่วงAwaken.

## หลักฐาน

- `tests-full.txt`: 672/672; `tests-targeted.txt`:29/29. Scope testเทียบraw authored economyก่อน/หลังนอกจากshopเหมือนเดิมทุกค่า. ทดสอบ grants/nonGoldpricesเดิม,dayroll,counter1→19,เงินไม่พอ,quantity0/100,overflow,exactUUIDreplayและmalformedcontent.
- `native.json`:8กลุ่ม actual React, browser SaveController, local HTTP API และ signed synthetic in-memory persistence. กด20Crystalexchange/99scrollครั้งเดียว,กดย้ำทั้งร้าน/เศษ,เงิน52kได้max2,counterเดิม,capacityMAX,merge/dismantle,320/390,ไม่มีfooter,serverrejectและresponseหายหลังcommit→ตรวจreceiptแล้วจ่ายครั้งเดียว.
- รูป `store/shards/tower/daily-320/390.png`; ตรวจด้วยตาstore/shards/Tower320. ปุ่มร้านไม่wrap;exchangegap18px/step42px/submit44px. Tower/dailyภาพใช้projectionเปิดโหมดเพื่อดูUIเท่านั้น ไม่เพิ่มความคืบหน้าที่persist.
- `m0.txt`, `build-root.txt`, `build-filtered.txt`:ผ่าน. Filtered buildตัดassets/docs/evidence/private/node_modulesแล้วsymlinkdependencyเหมือนVercel; content/hash/bundleตรงกัน628,933gzipbytes, PWA80546d33a409b9f9. Packb9a9280a/raw33,108,285เดิม.

LocalUIไม่ได้ทดสอบSupabase/RLSหรือAuthจริงรอบนี้; ใช้ตัวตนจำลองแยกในloopbackเท่านั้น. ไม่อ่าน/เขียนบัญชีเจ้าของ,ไม่แก้SQL/env,ไม่restart6173,ไม่รันbalancebatch. HostedตรวจpublicAPI/SHAและmobileloginเท่านั้น; การกดร้านจริงพิสูจน์ในlocalfixture.

รอบแรกมี2oracleราคาใบธาตุเก่าและtestscopeที่เทียบprojectedกับrawผิด;แก้เฉพาะสมมติฐานที่D167เปลี่ยน แล้วfullผ่าน. NativeพบCSSโหลดทีหลังทำsubmitเหลือ40pxจึงแก้specificity;พบfixtureจากรอบก่อนยังอยู่จึงresetก่อนทดสอบ. Debugเก็บใน `.local/shop139-debug` และ `/private/tmp/task139*`.

Vercel source02aa13d3b statusFailed;privatebuildlogเข้าถึงไม่ได้(publicAPI403),ถามผู้ใช้แล้ว. Cleantracked-onlybuildเพิ่มอีกครั้งผ่านhash/gzip/PWAเหมือนเดิม ดูbuild-clean-tracked.txt. ยังไม่ถือว่าhostedผ่านหรือtaskdone.
