# TASK-150 — ตัวเลขพุ่งขวาบนแล้วโค้งลง / ตรวจแอสเซ็ตสกิลพื้น

Milestone: M4 · D174 · design63

## งานที่ต้องรอก่อนหน้า
TASK-146, TASK-149

## ขอบเขตและผลส่งมอบ
ดาเมจ/คริ/ฮีล/ดาเมจรับ/ผลรวม Multi Hit พุ่งเร็วขวาบนแล้วโค้งตกลงพร้อมย่อส่วน. เลขรวมเด้งตามยอดใหม่โดยไม่เริ่มทางลอยใหม่;เลขหลุดจากจุดโดนไม่ตามตัวที่เดิน. ตรวจ metadata และภาพที่เกี่ยวข้องเพื่อแยก native สกิลพื้นจริงออกจากไอคอนบัฟ. ไม่เปลี่ยนสูตร/เกมเพลย์/เซฟ/บาลานซ์.

## ขั้นตอน
1. เปลี่ยนเส้นทางร่วมและตรึงจุดกำเนิดเลข;คงสี/ขนาด/focus/ยอดจริง
2. ตรวจ native Canvas320/390 ทุกชนิด/Hitคู่คี่/เป้าเดิน/ยอดเพิ่ม/reducedmotion/1x2x4
3. บันทึก source asset evidence;build/push/publicVercel

## เกณฑ์ตรวจรับ
- [ ] AC-01: ทุกชนิดพุ่งเร็วขวาบนแล้วโค้งลง/ย่อส่วน650ms ไม่อิง parity/facing;เป้าเดินไม่ลากเลข;ผลรวมไม่รีเซ็ตพิกัดเมื่อยอดเพิ่ม;สี/ขนาด/focus/amount/impact timing/reducedmotion ยังถูกต้อง และไม่เปลี่ยนผล engine ทุกspeed
- [ ] AC-02: รายงานแอสเซ็ตพื้นระบุ source path/status/renderer และแยกไอคอนอย่างถูกต้อง;native320390/build/gameplay unchanged/packตาม151/public release ผ่าน

## วิธีตรวจและหลักฐาน
Focused TS + actual native renderer captures and draw bounds; source metadata audit; build; hosted public artifacts/read-only. plan/evidence/task-150-review.json.

## Blocker / คำถาม
ไม่มี. คำว่าสกิลพื้นตรวจเป็นasset inventoryในรอบนี้;พื้นทั้งหมดเป็นTASK151. ไม่owner/AuthSQL/env/6173/agents.

## ผลตรวจเดิมก่อนผู้ใช้แก้ทิศ

10focusedTS/native4groups/rootbuildผ่าน. GameplaySHA/content2c85/packc622เดิม. Audit nativeSTRและ6symboltexturesบันทึกในevidence150. รอpublicrelease.


## คำตอบล่าสุด

ผู้ใช้แก้ทิศเป็นขวาบน25ต.ค. ต้องตรวจnative/build/hostedของทิศใหม่ก่อนปิด150. เอฟเฟกต์พื้นทั้งหมดดำเนินในTASK151.

## ผลส่งมอบสุดท้าย

ทิศขวาบนตามคำแก้ล่าสุด Source8caa66675/VercelSUCCESS.10focused/native4/rootbuild/hosted4ผ่าน พร้อมactualnativeheal320390ขวาบน/24bundleSHA/0errors-writes. พื้นทั้งหมดติดตามTASK151แยก.

## คำแก้การเคลื่อนที่ล่าสุด

ผู้ใช้ยืนยันวิถีเด้งสูงไปขวาบนแล้วโค้งตกลงพร้อมย่อส่วน ไม่ใช่driftเส้นตรง.650ms/peak44%/fixedright. ต้องตรวจarcใหม่ก่อนdone. Source8caaเป็นทิศตรงก่อนคำแก้นี้.
