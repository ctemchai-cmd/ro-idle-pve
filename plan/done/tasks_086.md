# TASK-086 — ย่อคำอธิบายสกิลและผลอัปเลเวล

Milestone: M4 · D-115

## งานที่ต้องรอก่อนหน้า

- TASK-079, TASK-084 (done)

## เป้าหมายและขอบเขต

ผู้ใช้ขอคำอธิบายสกิลและแต่ละเลเวลสั้นลง โดยเฉพาะ Call Spirit ที่ย้ำจำนวนสูงสุด/บอลหลังหักในทุกแถว แยกคำอธิบายหลักที่มีผลเชิงตัวเลขกับเงื่อนไขคงที่ซึ่งพับอ่านครั้งเดียว ผลอัปเกรดแสดงเฉพาะส่วนเปลี่ยนเช่น บอล+1→2ลูก / ATK+1→+1.2%ต่อลูก ไม่คัดประโยคเดิมและใหม่ทั้งย่อหน้า

ใช้ข้อความจากresolveddataเดิม ไม่ตัดด้วยellipsis ไม่เปลี่ยนสูตร/พลัง/ต้นทุน/ช่วงเวลา/ธาตุ/คิว/เซฟ คำอธิบายeffectของการ์ดและหน้าอื่นยังใช้แบบเต็มเดิม

## ขั้นตอนการทำ

1. ตรวจตัวอย่างและความยาวทั้ง126สกิล×10ระดับก่อนแก้
2. เพิ่มcompactskillformat+เงื่อนไขพับ และย่อdeltaเฉพาะclause/ตัวเลขที่เปลี่ยน โดยรักษาเครื่องหมายและหน่วย
3. ตรวจด้วยexistingdescription/element/rule tests และactualmobileที่มีcurrent/next/table/notes
4. Build/push/deployตรวจpublicก่อนreviewdone

## ผลส่งมอบ

- คำอธิบาย/ตารางเลเวลสั้นอ่านง่ายพร้อมเงื่อนไขครบ
- before/afteraudit + focused/build/mobile/hosted evidence

## เกณฑ์ตรวจรับ

- [x] AC-01: คำอธิบายสกิลหลักกระชับ โดย Call Spirit/Provoke/endowไม่ย้ำเงื่อนไขยาวทุกเลเวล; จำนวนบอล/โบนัส/ระยะเวลา/โอกาส/ฮิต/ธาตุ/ต้นทุนยังตรงresolver และเงื่อนไขเฉพาะอ่านได้ในส่วนพับเงื่อนไขสกิล
- [x] AC-02: ผลอัปเลเวลทั้ง126สกิลแสดงเฉพาะข้อความที่เปลี่ยน ใช้รูปแบบตัวเลขเดิม→ใหม่กับหน่วยร่วม ไม่มีการตัดคำ/ซ่อนผลเปลี่ยน/ทำตัวเลขติดลบผิดความหมาย; ระดับที่เปลี่ยนจริงมีdeltaที่อ่านได้
- [x] AC-03: Existing description/element/rule checksและbuild/type/boundaries/secretsผ่าน พร้อมactualmobile320/390/current+next+table+notesและpublicnewUI/API/login/PWA; content/pack/เกม/เซฟเดิม ไม่มีownerwrite/SQL/env/assets/balancebatch

## วิธีตรวจและหลักฐาน

Existing skill-description/element/spirit checks, before/after126×10renderedtext audit, isolated realmobilecomponents320/390 และsignedoutpublicproof เก็บ task-086-* ไม่รันbalancebatchหรือAuthstackเก่าทั้งชุด

ผล review: ผ่าน 3/3 AC · 22 ต.ค.2026 · source `069b09acb6e63ed8f672fe16df1ab116c78acc6a` ขึ้น Vercel แล้ว · [หลักฐาน](../evidence/task-086-review.json)
