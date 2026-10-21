# TASK-059 — ลดการเขียนเซฟระหว่างต่อสู้

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง D-083, design/23-save-runtime-protocol.md

## งานที่ต้องรอก่อนหน้า

- TASK-020/022/025 (done): shared engine prediction, durable acknowledgements และ Story settlement

## เป้าหมายและผลส่งมอบ

ลด recurring battle.advance จากทุกประมาณ1วินาทีเป็นทุก4วินาที โดยภาพยังเดินต่อบนเครื่องและคำสั่งทรัพยากรยังบันทึกทันที

## ขอบเขตและรายละเอียด

- Cadence นับจากเริ่ม request ไม่บวก response latency ทุกครั้ง ไม่ส่งซ้อนหรือไล่ส่งย้อนหลังหลายคำสั่ง
- ใช้ DB credit cap5000ms/lease15000ms เดิม คูณ speed1/2/4 ตามกติกาเดิม ไม่เปลี่ยน schema/content hash
- เปลี่ยนความเร็วให้ยืนยันช่วงเวลาก่อนหน้าด้วยความเร็วเดิมก่อนสลับ prediction และเลื่อน ack deadline ตาม request นั้น
- Offline/hidden/refresh ใช้ pending UUID/receipt/reconnect-retreat เดิม ไม่มีบอส offline

## ขั้นตอนทำงาน

1. ตรวจ clock/RAF prediction/save lifecycle
2. เพิ่ม cadence scheduler และเปลี่ยน speed transition
3. ตรวจ fake clock/real shared API และ isolated Chrome กับ Auth/DB จริง
4. Build ตรวจ content hash และส่ง Git โดยไม่รีสตาร์ต6173

## เกณฑ์ตรวจรับ

- [x] AC-01: request ปกติห่างประมาณ4วินาที ภาพ game_ms เดินระหว่าง request รวม response latency; ไม่ส่งซ้อนและรอบใหม่ไม่ใช้ deadline เก่า
- [x] AC-02: 1×/2×/4× และการเปลี่ยนความเร็วใช้ shared server credit เดิม; ผลไฟต์ได้รับการยืนยันและรับรางวัลได้ครั้งเดียว
- [x] AC-03: offline หยุดคำสั่งใหม่ reconnect/refresh ถอยไฟต์และไม่ให้รางวัลซ้ำ; คำสั่งผู้เล่นยังส่งทันที; content hash คงเดิม

## วิธีตรวจและหลักฐาน

| เกณฑ์ | วิธีตรวจ | ผลจริง | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | battle-ack.test.ts + Chrome log POST intervals/game_ms ระหว่าง ack | [Chrome](../evidence/task-059-cadence-live.json) 4กลุ่มผ่าน; [tests32ข้อ](../evidence/task-059-tests.txt) และ [build](../evidence/task-059-build.txt) ผ่าน | ผ่าน self-check |
| AC-02 | recurring-save/protocol/Story/Tower/daily tests + Chrome speed/result/claim | [Chrome](../evidence/task-059-cadence-live.json) 4กลุ่มผ่าน; [tests32ข้อ](../evidence/task-059-tests.txt) และ [build](../evidence/task-059-build.txt) ผ่าน | ผ่าน self-check |
| AC-03 | save lifecycle tests + Chrome offline/reload + build/manifest compare | [Chrome](../evidence/task-059-cadence-live.json) 4กลุ่มผ่าน; [tests32ข้อ](../evidence/task-059-tests.txt) และ [build](../evidence/task-059-build.txt) ผ่าน | ผ่าน self-check |

ผู้ตรวจ: Codex self-check · วันที่: 21 ต.ค.2026 · รอบ review: 2

## Blocker / คำถาม

ไม่มีสำหรับการพัฒนาและ isolated verification; ไม่รีสตาร์ตเว็บส่วนตัว6173

## บันทึกการทำงานและ review

- [Review](../evidence/task-059-review.json): measured3995/4014ms, responseหน่วง400ms, peakwriter1, RAFเดินระหว่างrequest; 1×/2×/4×/ผลชนะ/รับรางวัล/รีโหลด/offline/reconnectครบ4กลุ่มบนstackจริงแยก
- รอบแรก harnessรอloginเพียง700msจึงออกจากหน้าเร็วเกินและหาMageไม่เจอ แก้รอheadingsigned-inจริง เก็บround1report ไม่เปลี่ยนproductเพื่อหลบเกณฑ์
- Build/env/assets/content/boundaries/typecheck/secretsผ่าน contenthash2c1ac034เดิม ไม่เปลี่ยนเกมหรือเซฟและไม่รีสตาร์ต6173

- Source `0007542d8` push mainและVerceldeploysuccessแล้ว [hosted smoke](../evidence/task-059-hosted.json): actualJSมี4s scheduler/login/publichealth200 ไม่มีcloudwrite (ไม่ใช่ownercombatproof)
