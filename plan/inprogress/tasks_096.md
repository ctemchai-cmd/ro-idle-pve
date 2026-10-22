# TASK-096 — จุดแดงแจ้งอุปกรณ์ที่ดีกว่าในช่องสวมใส่

Milestone: M4 · D-125 · ประเภท: UI และ read-only comparison

## งานที่ต้องรอก่อนหน้า

- TASK-026, TASK-027, TASK-028, TASK-074 (done)

## ขอบเขตและผลส่งมอบ

เพิ่มจุดแดงเล็กบนช่องสวมใส่หน้า Buddy เมื่อมีของที่ใส่ได้และดีกว่าในกระเป๋า พร้อมป้าย/จัดชิ้นนั้นไว้บนสุดในรายการเปลี่ยนของ. คงสี rarity และเลข Refine/Enchant/การ์ด ใช้เลเวลไอเท็มและ rarity ตามที่ผู้ใช้ยืนยัน ไม่เพิ่ม API, save write หรือสูตรคะแนนพลัง

## รายละเอียด

ผู้ใช้ยืนยันเกณฑ์ล่าสุด: เลเวลไอเท็มสูงกว่าให้เตือนก่อน ถ้าเลเวลเท่ากันจึงดู rarity ที่สูงกว่า. ไม่คำนวณ stats/ออปชัน/Refine/Enchant/การ์ดเพื่อใช้แจ้งเตือน. ยังแสดงค่าก่อนและหลังในรายการเปลี่ยนตามเดิม. ช่องว่างเตือนเมื่อมีของที่ใส่ได้. กรองอาชีพ/เลเวล/เจ้าของ ของล็อกยังใส่ได้ ไม่ดึงของตัวอื่นที่สวมอยู่มาเตือน และไม่แนะนำระหว่าง active battle. ตรวจแบบ linear pass/Map และ memo ต่อ state/character ไม่เรียก stat preview หรือ clone account

## ขั้นตอน

1. เพิ่ม read-only hints ด้วย level/rarity/eligibility
2. เพิ่มจุดแดงที่ GearTile/ป้ายในรายการเปลี่ยน และอัปเดตเมื่อเปลี่ยนตัวละครหรือสวมสำเร็จ
3. ตรวจลำดับ level→rarity/eligibility/immutability/500items, mobile320/390 และ build/public deploy

## เกณฑ์ตรวจรับ

- [x] AC-01: ของที่ใส่ได้/ยังไม่มีคนสวม เตือนเมื่อเลเวลไอเท็มสูงกว่า หรือเลเวลเท่ากันแต่ rarity สูงกว่า; ช่องว่างเตือนเมื่อมีของใส่ได้ ของเท่ากัน/เลเวลต่ำกว่าแม้ Supreme/ผิดอาชีพ/เลเวลไม่ถึง/ของเพื่อนไม่เตือน ออปชัน/ค่าพัฒนาช่องไม่เกี่ยวกับเกณฑ์และเซฟไม่ถูกแก้
- [x] AC-02: จุดแดงเล็กที่ช่องถูกต้องบนมือถือ320/390 ไม่บัง rarity/Refine/Enchant/การ์ด; เปิดรายการแล้วของที่แนะนำอยู่บนสุดพร้อมป้าย สวมแล้ว/สลับตัวละครแล้วคำเตือนอัปเดต ไม่มี network write จากการแสดงคำเตือน และตรวจ500item/CPU4xเพื่อกัน UI หน่วง
- [ ] AC-03: targeted rules/build/type/boundaries/secrets/readiness และ public Vercel bundle/หน้า login ผ่าน content hash/pack เดิม ไม่มี SQL หรือเซฟ migration เพิ่ม

## วิธีตรวจและหลักฐาน

AC-01 ใช้ focused unit cases กับ tier/rarity/fit และ clone-before-after; AC-02 ใช้ real BuddyPage/CSS/AssetPack ใน isolated mobile Chrome กับ fixture และ in-memory equip reducer บันทึกภาพ/latency/commands; AC-03 ใช้ build/readiness และ hosted signed-out SHA proof

## Blocker / คำถาม

ไม่มี

## บันทึกการทำงานและ review

- ผู้ใช้แก้เกณฑ์ระหว่างทำงานให้ใช้ level→rarity เท่านั้น จึงถอด stat-comparison/preview templates ทั้งหมด. การทดลองรวม modifier ที่ math/build ไม่อยู่ใน patch สุดท้าย; domain ทั้งสองไฟล์กลับ byte-identical HEAD และ content hashเดิม. เก็บรายงานทดลองแยกเป็นประวัติ ไม่อ้างว่าเป็นสูตรหรือข้อกำหนดผู้ใช้
- Browserรอบแรกพบจุดแดงทับ progress จึงลดเป็น8pxและเลื่อนเหนือกรอบ พ้นเลขตีบวก/Enchantแล้ว

- Final13focused checks/build/type/boundaries/secrets/readiness8 ผ่าน; actualBuddyPage320/390/real equip callback/character switchผ่าน3กลุ่ม จุดแดง8pxไม่ทับเลข/การ์ด. 500items CPU4x 1.9–4.3ms เทียบก่อนลดscopeตามผู้ใช้ ไม่ใช่physicalAndroid. รอ public Vercel ก่อน AC-03/done
