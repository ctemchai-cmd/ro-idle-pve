# TASK-067 — ดันหมดเวลาค้างและกู้สิทธิ์ที่เสียจากบั๊ก

Milestone: M4 · อ้างอิง D-091 · ลำดับก่อน TASK-066 ตามบั๊กเร่งด่วนจากผู้ใช้

## งานที่ต้องรอก่อนหน้า

- TASK-036, TASK-060 done

## เป้าหมาย ขอบเขตและรายละเอียด

ดันที่เหลือเศษเวลา1–49msต้องเดินถึงdeadlineและส่งbattle.finishหนึ่งครั้ง ไม่ค้างเพราะเงื่อนไข50ms gate เมื่อต่อใหม่ใช้pendingUUID/receiptเดิมไม่จ่ายรางวัลซ้ำ รักษากติกาoffline retreatเดิม และเตรียมคืนสิทธิ์เฉพาะรอบที่เสียให้ผู้ใช้โดยไม่ล้างเซฟ/ดันอื่น

## ขั้นตอนทำงาน

1. Reproduce clock gateที่targetถูกcapแต่เศษน้อยกว่า50ms
2. Flush finalpartialintervalในclient adapter ไม่เปลี่ยนengine/สูตร/time limit
3. เล่นdailyจนtime limitจริงในChrome+Auth+Postgres ตรวจfinish/HP/รางวัล/reload
4. ระบุboss/วัน/receiptของรอบผู้ใช้เพื่อคืนquotaแบบสำรองก่อนและกันทำซ้ำ ไม่เดา/ล้างทุกดัน

## เกณฑ์ตรวจรับ

- [x] AC-01: ทุกfinalremainder1–49msของ60/90sเดินถึงdeadline; actualdailyUIจบและส่งfinishครั้งเดียว ไม่ค้าง/ไม่retreatเอง
- [ ] AC-02: finish/reload/recoveryไม่เสียสิทธิ์เพิ่มและไม่รับรางวัลซ้ำ; targetedchecks/build/contenthashเดิมผ่าน และdeploy/publicsmokeจริง
- [ ] AC-03: ผู้ใช้ได้คืนสิทธิ์รอบเสียที่ระบุ โดยมีbackup/receiptและไม่เปลี่ยนความก้าวหน้าหรือดันอื่น; ถ้ายังทำไม่ได้ระบุข้อมูล/การเข้าถึงที่ขาด ไม่อ้างคืนแล้ว

## วิธีตรวจและหลักฐาน

Unit boundary + realdailyterminal browser/API/SQL + owner-repairmetadataเฉพาะที่จำเป็น

## Blocker / คำถาม

ผู้ใช้ยืนยันแก่นพลัง เตรียมปุ่มตั้งค่าใช้ownerAuthเดิมคืน1ครั้งผ่านbackup.restore_requestชนิดdaily-clock ภายใต้day21Oct/receiptก่อน14:07:06UTC/retreat≥15s/once-only marker มีsignedbackupและCAS ไม่ต้องSQL/envใหม่ แต่ยังไม่ได้กดบนบัญชีจริง

ตรวจเพิ่มตามผู้ใช้: x1/x2/x4ต้องมีevent/terminal/metrics/RNG/การขัดร่ายเหมือนกันทุกรายการในเวลาเกมเดียวกัน ทดสอบ3heavy×4CCtypes และspatialdailyจริงด้วยseedเดียวกัน ไม่เปลี่ยนความแรง/โอกาสเพราะspeed

## ผลตรวจจริง

41targetedchecksผ่าน (รวมexactspeedparity/CC/dailyspatial/backuprefund/authSDK); build/type/boundaries/secrets/contenthash768e12a4เดิมผ่าน; actualfreshAuth/PostgREST/Postgres/Chrome daily60s Essenceจบที่4x/finish1ครั้ง/reload/คืนquotaพร้อมsignedbackupและกันซ้ำ4กลุ่มผ่าน ไม่มีownercloudwrite/6173restart รอdeploy/publicproof และกรณี067ยังต้องผู้ใช้กดคืนสิทธิ์ในบัญชีจริง
