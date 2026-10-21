# เซฟ Supabase และ deploy บน Vercel

19 ตุลาคม 2026: สัญญารุ่นแรกที่เลือกแล้วอยู่ใน [architecture](11-technical-architecture.md), [save contracts](../data/save-contracts.json), [module graph](../data/module-contracts.json) และ [quality budgets](../data/quality-budgets.json) ใช้รายละเอียดชุดนี้แทนตัวเลือกกว้างในข้อเสนอเดิมด้านล่าง ยังไม่ใช่บริการ/runnerที่สร้างหรือผ่านruntime testsแล้ว

สถานะ: **ผู้ใช้เลือก Supabase สำหรับเซฟ และ Vercel สำหรับเว็บแล้ว** · 18 ตุลาคม 2026

รายละเอียดวิธีเซฟด้านล่างเป็นแนวทางเทคนิคสำหรับแตกงาน ยังไม่ได้สร้างฐานข้อมูล ตั้งค่า account หรือ deploy เกม Q-014–Q-016 ตอบแล้ว: อีเมล/รหัสผ่าน, ออนไลน์เป็นหลักพร้อมเซฟสำรองในเครื่อง และรุ่นแรกสูงสุด Lv.70 ดู [decisions](../decisions.md)

## ขอบเขตที่ยืนยันแล้ว

- เกมเว็บเล่นคนเดียว ใช้เซฟหลักบน Supabase และเผยแพร่เว็บผ่าน Vercel ไม่เพิ่ม multiplayer จากการมี cloud save
- รุ่นแรกถึง Class 2 และเลเวลสูงสุด 70; Class 2 ที่ Lv.20, Hi-class ที่ Lv.70 ใน milestone ถัดไป และ Class 3 ที่ Lv.120 ในอนาคต
- ล็อกอินด้วยอีเมล/รหัสผ่าน ออนไลน์เป็นหลักพร้อม checkpoint ในเครื่อง ไม่เปิดเล่น offline เต็มรูปแบบ
- รางวัลเมื่อปิดเกมสะสมสูงสุด 12 ชั่วโมงตาม P-03 ไม่ปลดด่านหรือชนะบอสให้อัตโนมัติ
- ความก้าวหน้าของ NPC อยู่กับตัว NPC แม้ถอดทีม อ้างข้อมูล roster แทนการคัดลอกข้อมูลลงช่องทีม

## โครงระบบที่เสนอ

| ส่วน | หน้าที่ |
| --- | --- |
| เว็บบน Vercel | หน้าจอ, combat engine ใน browser, renderer และ assets ที่คัดมาใช้ |
| Vercel API / TypeScript domain | ตรวจและคำนวณ account commands เช่น AFK/อัปเกรด/กาชาด้วย rules ชุดเดียวกับ browser/runner |
| Supabase Auth | บัญชีส่วนตัวด้วยอีเมล/รหัสผ่าน ตัวตนเจ้าของเซฟและ session |
| Supabase Postgres | เซฟถาวร, revision, เวลาฝั่ง server, ตัวชี้การรับรางวัลและการรีเซ็ตวัน |
| Database function/RPC | commit แบบ atomic, ตรวจ revision และรับรางวัลซ้ำโดยไม่เพิ่มของซ้ำ |
| พื้นที่เก็บใน browser | checkpoint/สำรองและสถานะการส่งเซฟ พักความก้าวหน้าเมื่อขาดเน็ต |

เกมไม่ต้องเปิด combat loop ค้างบน server ตอนผู้เล่นปิดเว็บ การคำนวณรางวัล AFK ใช้เวลาที่ผ่านไปจาก server และอัตราฟาร์มที่บันทึกไว้ ไม่จำลองการชนะด่านใหม่ย้อนหลัง

เสนอ frontend TypeScript + Vite และแยก combat engine ออกจากการวาด ใช้ renderer/metadata ที่เตรียมไว้เป็นฐาน ส่วน UI framework เลือกในงานสถาปัตยกรรม ไม่จำเป็นต้องเพิ่ม SSR สำหรับเกมนี้ Vercel รองรับการ deploy Vite ตาม [คู่มือทางการ](https://vercel.com/docs/frameworks/frontend/vite)

รอบ D-036 เลือกฐานเทคนิคให้ account commands AFK/อัปเกรด/กาชาคำนวณใน Vercel API ด้วย pure TypeScript domain ที่ browser/runner ใช้ร่วมกัน ส่วน Supabase RPC ทำ atomic persistence/revision/receipt ไม่คัดลอกสูตรบาลานซ์ไป SQL ใช้ความสามารถ [Vercel Node.js/TypeScript Functions](https://vercel.com/docs/functions/runtimes/node-js) กับ [Supabase database functions](https://supabase.com/docs/guides/database/functions) ตามเอกสารทางการ เป็นแบบที่ผู้ช่วยเลือก ยังไม่ได้สร้างบริการหรือผ่าน review TASK-013

ดู module paths/typed commands/single account authority ใน [extension contracts](14-extension-contracts.md) TASK-013 ยังต้องลง trust boundary/payload/receipt/sequence/compatibility ให้ครบและมีวิธีทดสอบ adapter/API บนเครื่องตั้งแต่ TASK-015/021/022 โดยไม่รอ Preview TASK-043 A-01–A-03 จึงยังไม่ถือว่าปิดครบจากการเลือก execution location อย่างเดียว

## รูปแบบเซฟตั้งต้น

เสนอหนึ่งช่องเซฟต่อบัญชีในรุ่นแรก และข้อมูล snapshot ที่มีรุ่นกำกับ:

- `user_id`, `slot_id`: เจ้าของและช่องเซฟ
- `schema_version`, `content_version`/hash, `rules_version`: รุ่นโครงสร้าง ข้อมูลเกม และกติกาสูตร/ลำดับเหตุการณ์/RNG
- `revision`, `updated_at`: ลำดับเซฟและเวลาที่ server รับสำเร็จ
- `state`: ตัวหลัก, roster NPC ทั้งหก, สมาชิก/ตำแหน่งทีม, สกิล/Status, inventory, อุปกรณ์และค่าพัฒนา slot, เงิน, Story/Tower/ดันรายวัน และการปลดระบบ
- ข้อมูลรับรางวัล เช่น `farm_cursor` และรายการ `request_id` ที่ใช้แล้ว ให้ server เป็นผู้ปรับผ่าน transaction แยกจาก snapshot ที่ browser ส่ง เพื่อไม่ให้ checkpoint เก่าย้อนเวลารับของ

schema SQL และขอบเขต JSONB/ตารางแยกจะระบุใน M0 ตามสิ่งที่ต้องอัปเดตพร้อมกัน ไม่เก็บภาพ/เสียงในแถวเซฟ ไม่เก็บข้อมูล NPC ซ้ำใน party slot

ต้องระบุค่าหลักเพียงชุดเดียวของ wallet/inventory/roster/progression และแยก durable account state จาก transient battle state ก่อนสร้าง schema ไม่ให้ JSON checkpoint กับตารางธุรกรรมต่างฝ่ายต่างเขียนยอดเงิน รูปแบบ checkpoint/resume และผลต่อ attempt/HP/reward เมื่อ reload/เน็ตขาด/พักแท็บ/ข้ามวัน/เปลี่ยน patch ต้องมีตารางครบทุกโหมดใน TASK-011/013

## การเขียนเซฟและการเปิดหลายแท็บ

เสนอ autosave ทุกประมาณ 20–30 วินาที พร้อม checkpoint เมื่อเปลี่ยนบิลด์หรือรับผลที่สำคัญ ไม่เขียนฐานข้อมูลทุก combat tick การปิดแท็บฉับพลันอาจเสียความคืบหน้าที่ server ยังไม่รับ จึงต้องมี local checkpoint สำหรับกู้คืน

1. โหลดเซฟและ `revision` ล่าสุดหลังล็อกอิน
2. เขียนโดยส่ง `expected_revision` และ `request_id`; ตรวจและเปลี่ยน revision ใน transaction เดียว
3. ถ้าเซฟเก่ากว่าฝั่ง cloud ให้หยุดการเขียนจากแท็บนั้น เก็บสำรอง แล้วโหลดข้อมูลล่าสุด ไม่บวกเงินหรือรวม inventory จากสอง snapshot อัตโนมัติ
4. คำขอเดิมที่ retry เพราะ response หาย ต้องได้ผลเดิมสำหรับ reward/gacha/การใช้วัตถุดิบ ไม่จ่ายซ้ำ
5. แสดงสถานะ “บันทึกแล้ว/กำลังส่ง/เชื่อมต่อไม่ได้” ตามผลจริง การเขียนลงเครื่องอย่างเดียวไม่เท่ากับ cloud save สำเร็จ

ตั้งต้นให้มีผู้เขียนเซฟที่ทำงานได้ทีละแท็บ/อุปกรณ์ โดยยังใช้ revision ตรวจอีกชั้น รายละเอียดการยึดสิทธิ์และสลับอุปกรณ์ต้องอยู่ใน spec ก่อน implementation

TASK-013 ต้องกำหนด command/receipt ให้ชัด: ID เดิมกับ payload ต่างกันต้องถูกปฏิเสธ, response หายแล้ว retry ต้องอ่านผล commit เดิมได้, ระบุอายุ receipt และความหมาย pending/applied/acknowledged โดย autosave/import ไม่สามารถย้อน wallet หรือ claim cursor ที่ commit แล้ว เกณฑ์นี้ยังไม่ได้พิสูจน์ด้วยระบบเซฟจริง

## AFK เวลา server และการรับรางวัล

- คำนวณช่วงรางวัลจากจุดที่ settle สำเร็จครั้งล่าสุด ถึงเวลา server ปัจจุบัน โดยจำกัด 12 ชั่วโมง
- ผลตอบแทนกับการเลื่อน cursor ต้อง commit พร้อมกัน และใช้คำขอซ้ำได้โดยไม่รับของเพิ่ม
- แยกช่วงที่จ่ายรายได้ขณะเปิดเกมไปแล้วออกจากช่วง AFK ไม่รับซ้ำเมื่อปิด/เปิดหรือ refresh
- snapshot เก่าไม่สามารถย้อน cursor หรือการรีเซ็ตรายวันได้
- ใช้วันที่ Asia/Bangkok สำหรับดันรายวัน; ทดสอบกรณีข้ามเที่ยงคืน/ข้ามหลายวัน/เครื่องหลับ/ปรับนาฬิกาเครื่อง
- การเล่นเต็มรูปแบบขณะไม่มีอินเทอร์เน็ตเป็นอีกความสามารถหนึ่ง ไม่ได้ยืนยันเพียงเพราะเกมมีรางวัลตอนปิดเว็บ

คำตอบ Q-015 เลือกออนไลน์เป็นหลักพร้อม checkpoint เมื่อขาดเน็ตให้พัก combat ที่สร้างผลถาวร/การใช้ทรัพยากรและเก็บสถานะค้างส่ง เชื่อมกลับแล้วตรวจ revision กับ server ก่อนกลับมาเล่น ช่วงเวลาที่หยุดสามารถคิดเป็น AFK ส่วนที่ยังไม่จ่ายได้ตามเพดาน 12 ชั่วโมง ต้องไม่รวมผลใน checkpoint กับรางวัล AFK ซ้ำกัน รายละเอียดจุด checkpoint/settle เป็นผลส่งมอบสเปก M0

## เจ้าของข้อมูลและ environment

ใช้ Auth + RLS ให้ผู้ใช้เข้าถึงเฉพาะเซฟของตน browser ใช้ publishable key กับ session ส่วน secret/service key อยู่เฉพาะส่วน server ที่จำเป็น ตาม [API keys](https://supabase.com/docs/guides/getting-started/api-keys) และ [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) ของ Supabase

ออกแบบการตั้งค่า Development / Preview / Production ให้การลอง preview และทดสอบ reset ไม่แก้เซฟจริง แยกข้อมูลทดสอบและ auth redirect ให้ชัดก่อนเชื่อม production ตาม [Vercel environments](https://vercel.com/docs/deployments/environments) การเลือกแยก Supabase project หรือสภาพแวดล้อมทดสอบแบบอื่นเป็นงานติดตั้ง ไม่ต้องขอ credentials ระหว่างคุย game design

ต้องมี migration ที่รักษาเซฟเดิม สำรองก่อนเปลี่ยน schema และมีวิธีกลับไปรุ่นก่อน รายละเอียด export/import และ reset ต้องรองรับ cloud revision ด้วย ไม่เขียนไฟล์เก่าทับของใหม่เงียบ ๆ

Compatibility matrix ต้องครอบคลุม schema/content/rules และ ID ที่ถูกเลิกใช้: เลือก migrate/reject/backup ในแต่ละกรณี รวมถึง reward-rate snapshot ขณะ AFK ข้าม balance patch และนโยบายคืนทุนเมื่อราคา/วัตถุดิบเปลี่ยน ไม่ใช้ราคาใหม่ย้อนหลังโดยไม่มี policy จนรีเซ็ตบิลด์แล้วได้ทรัพยากรเกินทุน ไม่จำเป็นต้องเก็บ runtime เก่าทุกรุ่น แต่ต้องแจ้งรุ่นที่ไม่รองรับโดยไม่ทำลายเซฟ

## Assets สำหรับ deploy

คลังทั้งหมดประมาณ 991 MB ใช้เป็นคลังทำงานบนเครื่อง ให้ build คัดเฉพาะ dependency ของเนื้อหารุ่นที่เปิดเล่นจริง:

- เริ่มจาก actor/skill/stage/UI IDs ที่อ้างในข้อมูลเกม แล้วตาม `meta_path`, `file.path`, ACT, STR, texture, เสียงและฟอนต์ให้ครบ
- รองรับ shared media หลัง deduplicate ไม่เดาชื่อไฟล์จาก basename
- ตรวจ `missing_dependencies` และกัน effect ที่ยังไม่พร้อมออกจาก pack ที่จะใช้
- สร้าง manifest พร้อม checksum และขนาดรวม โหลดฉาก/เพลง/ชุดภาพตามการใช้งาน
- ให้ build output มีเฉพาะ pack และเว็บ ไม่ copy source library ทั้งหมดหรือ archive เก่าไปด้วย

Vercel ระบุขนาด upload source files ผ่าน CLI ไว้ 100 MB สำหรับ Hobby และ 1 GB สำหรับ Pro ณ วันที่ตรวจ เอกสารนี้ใช้เป็นเหตุผลให้กำหนดช่องทาง deploy และงบขนาดให้ชัด **ไม่ได้ถือว่าขนาด source upload เท่ากับเพดาน build output ทุกช่องทาง** ดู [Vercel limits](https://vercel.com/docs/limits) ตรวจ limits และวัด pack จริงอีกครั้งใน task deploy ก่อนเลือกวิธีส่งไฟล์

ตั้งต้น serve pack จากเว็บ/CDN ของ deployment เดียวกัน Supabase ใช้สำหรับเซฟตามที่ผู้ใช้เลือก ยังไม่เพิ่ม Supabase Storage เป็นข้อบังคับ ไม่ดึงภาพจากเว็บต้นทางระหว่างเล่น

## ผลส่งมอบที่ต้องแตกเป็น task

1. สเปก save schema, migration, revision, reward cursor และพฤติกรรมขาดเน็ตตามคำตอบ
2. เชื่อม Auth/owner policies, โหลด/บันทึก/กู้ checkpoint และทดสอบเซฟของ NPC นอกทีม
3. ทดสอบสองแท็บ, revision ชน, retry หลัง response หาย, รับ AFK ซ้ำ และข้ามวัน โดยไม่เพิ่มของหรือทำเซฟหาย
4. สร้าง runtime asset pack จาก dependency และตรวจไฟล์ครบ/ขนาด/ไม่มี runtime request ไปเว็บต้นทาง
5. ตั้ง Development/Preview/Production, ทำ deployment ที่เปิดเล่นและโหลดเซฟได้ พร้อมวิธีย้อนรุ่น

งานนี้เป็นส่วนของ M0/M2/M4 ไม่ใช่การรายงานว่าระบบ cloud หรือ deployment พร้อมแล้ว ดู [ลำดับ milestone](../pre-task-review.md)
