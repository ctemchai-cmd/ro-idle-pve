# ตัวละคร ทีม และการพัฒนาใน runtime

วันที่: 20 ตุลาคม 2026 · TASK-023 · ใช้ progression.json และ design09 เป็นแหล่งตัวเลข

หน้า `/roster` ใช้เลย์เอาต์มือถือ RO Blue เลือกจุดเริ่มต้นหน้า2/หลัง2และเลือกเพื่อนจาก roster เดิม NPCมี ID ผูก Class1 หนึ่งคนต่อสาย mainเปลี่ยน root ได้ การสลับจุดเกิดไม่ย้าย level/Status/skills/equipment/slot progress ของใคร

## เจ้าของกฎ

`src/domain/progression/characters.ts` ให้ pure quote/reducer/validation ของตัวละคร `initialize.ts` ให้ initial-state factory ร่วมกับ account creation และ sandbox `src/client/roster.ts` เป็น facade สำหรับ UI: ตัวเลขราคา/แต้มใช้กฎเดียวกับ server ขยาย import ของ client ไป progression อย่างชัดเจนใน module-contracts.json; UIไม่ import account/domain/content และไม่ commit state เอง

| Command | สิ่งที่ตรวจ/เปลี่ยน |
| --- | --- |
| party.set | mainหนึ่งคน/NPCสามคน/ตัวไม่ซ้ำ/จุดเกิดครบ/unique NPC root; เปลี่ยนเฉพาะ placements |
| character.level_up | เลือกตัวรวม off-team, quote ทุก transition จากตาราง, จ่าย wallet พร้อมเพิ่มเลเวลและแต้มที่ยังไม่ลง |
| character.breakthrough | ต้องถึง local cap20/40/60ตาม gate; จ่ายราคาของ gate แล้วเก็บ gate ID/local cap ไม่เพิ่ม level |
| character.allocate_status | รับค่าเป้าหมายทั้งหกที่เพิ่มจากเดิม, quote cost_by_new_value, ลง ledger quantity=แต้มที่จ่ายจริง |
| character.reset_build | คืน quantity ของ active status ledger; skill คืน actual paid vector; mark refunded พร้อม state/receipt ใน CAS เดียว |
| character.change_job | ตรวจ root/NPC/Class2ขั้นต่ำ20; reset/refund/เปลี่ยน job/ถอดอาวุธผิดชนิดใน transaction เดียว |

ทุกคำสั่งนี้ต้องอยู่นอก active battle และผ่าน save protocol23 เดิม ไม่มีการอัปเลเวลจากการลงสนามเองหรือเพิ่ม AGI/DEX ตามคลาส ผล reset ไม่คืนทุนเลเวล/Breakthrough/Refine/Enchant/cards

## การลงทุนและเซฟ

Ledger ใช้ feature_id `character_level`, `breakthrough`, `status`, `skill` แยกกัน `status.quantity` คือแต้มที่จ่ายจริง ไม่ใช่ราคาที่คำนวณจากแพตช์ปัจจุบัน `skill.paid_resources` คือเงินจริงพร้อม cost_versions; free starter grants ไม่สร้างเงินคืน ถ้า retry UUIDเดิม คืน receipt เดิมโดยไม่ประมวลผลซ้ำ Skill purchase UI/reducer เป็น TASK-024 ซึ่งต้องใช้ feature_id=skill สัญญานี้

Inventory canonical เก็บ equipped instances ด้วย การถอดอาวุธล้าง equipment reference และคง instance เดิมไว้ ไม่เพิ่ม item สำเนาใหม่หรือแจก starter ใหม่ Full inventory guard ปฏิเสธการเปลี่ยนที่ต้องถอดทั้งคำสั่งตาม policy รุ่นแรก โดย Refine/Enchant/cards ยังอยู่ใน slot ของตัวเดิม

Bard/Dancer เป็นสาขาของ npc_archer เดียวกัน เปลี่ยน jobเป็น Bard ใช้รูปลักษณ์ชาย Dancerใช้หญิง ไม่มี companion คนที่สองจากการเลือกเพศ Class2เปิดได้ที่20ก่อนทำ Breakthrough20 รุ่นแรก cap70 ไม่แสดงปุ่ม Hi-class/Awaken/Artifact หรือ Breakthrough70

## ช่องทางเล่นและขอบเขต

เมื่อมี Auth config หน้า `/roster` อ่านเซฟผ่าน verified owner/SaveController และสร้างตัวหลักจาก root/gender ที่เลือกได้ คำขอสร้างเกมเก็บ UUID ก่อนมี checkpoint ด้วย; refresh หลังคำตอบหายต้องคืน grantเดิมหนึ่งครั้ง เมื่อไม่มี config แสดงสนามทดลองที่ใช้ initial resources/pure reducers จริงในหน่วยความจำ พร้อมข้อความว่าไม่บันทึกเข้าบัญชี ไม่มี endpoint แจกทรัพยากรทดสอบ

หน้าจอเลือกตัว/จัดทีมนี้ยังไม่เปลี่ยนทีมของสนาม demo `/` เดิม การเชื่อมบิลด์ที่เซฟกับ Story encounter เป็น TASK-025; การเรียน/คิวสกิลเป็น TASK-024 และสวมใส่ของเป็น TASK-026 ไม่ใช้ roster UI เป็นหลักฐานว่าส่วนเหล่านั้นเสร็จแล้ว

การตรวจที่ต้องได้ในงานนี้: pure budget/cap/old-price/full-inventory/active-battle tests, real local owner commands + actual Chrome creation response loss/upgrade off-team/party swap/reload/Dancer refund/replay/Breakthrough/offline และ390/360px ไม่มี horizontal overflow
