# TASK-150 — ตัวเลขเด้งแล้วลอยซ้ายบน / ตรวจแอสเซ็ตสกิลพื้น

Milestone: M4 · D174 · design63

## งานที่ต้องรอก่อนหน้า
TASK-146, TASK-149

## ขอบเขตและผลส่งมอบ
ดาเมจ/คริ/ฮีล/ดาเมจรับ/ผลรวม Multi Hit เด้งแล้วลอยซ้ายบนเสมอ. เลขรวมเด้งตามยอดใหม่โดยไม่เริ่มทางลอยใหม่;เลขหลุดจากจุดโดนไม่ตามตัวที่เดิน. ตรวจ metadata และภาพที่เกี่ยวข้องเพื่อแยก native สกิลพื้นจริงออกจากไอคอนบัฟ. ไม่เปลี่ยนสูตร/เกมเพลย์/เซฟ/บาลานซ์.

## ขั้นตอน
1. เปลี่ยนเส้นทางร่วมและตรึงจุดกำเนิดเลข;คงสี/ขนาด/focus/ยอดจริง
2. ตรวจ native Canvas320/390 ทุกชนิด/Hitคู่คี่/เป้าเดิน/ยอดเพิ่ม/reducedmotion/1x2x4
3. บันทึก source asset evidence;build/push/publicVercel

## เกณฑ์ตรวจรับ
- [ ] AC-01: ทุกชนิดเด้งแล้วลอยซ้ายบน ไม่อิง parity/facing;เป้าเดินไม่ลากเลข;ผลรวมไม่รีเซ็ตพิกัดเมื่อยอดเพิ่ม;สี/ขนาด/focus/amount/impact timing/reducedmotion ยังถูกต้อง และไม่เปลี่ยนผล engine ทุกspeed
- [ ] AC-02: รายงานแอสเซ็ตพื้นระบุ source path/status/renderer และแยกไอคอนอย่างถูกต้อง;native320390/build/content-pack unchanged/public release ผ่าน

## วิธีตรวจและหลักฐาน
Focused TS + actual native renderer captures and draw bounds; source metadata audit; build; hosted public artifacts/read-only. plan/evidence/task-150-review.json.

## Blocker / คำถาม
ถามขอบเขตคำว่าสกิลพื้นระหว่างทำงาน;ส่วนตัวเลขไม่ขึ้นกับคำตอบ. ไม่owner/AuthSQL/env/6173/agents.

## ผลตรวจ local

10focusedTS/native4groups/rootbuildผ่าน. GameplaySHA/content2c85/packc622เดิม. Audit nativeSTRและ6symboltexturesบันทึกในevidence150. รอpublicrelease.
