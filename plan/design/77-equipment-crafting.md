# D188 — หินรีโรลและเลื่อน Rarity

สองหินจาก stock แยก wallet; Rarity+1สำเร็จ100%,คงinstance/Tier/optionเก่า/slotinvestments และสุ่มเฉพาะบรรทัดเพิ่ม. Fusion3ชิ้นเดิม. ราคาหินเป้าหมายUncommon/Rare/Epic/Legendary/Immortal/Supreme=1/1/2/4/12/30 และทอง2000/4000/8000/16000/40000/100000.

รีโรลหนึ่งบรรทัดใช้1option_stone. ไม่ซ้ำstatบรรทัดอื่น. บันทึกผล pendingพร้อมจ่ายครั้งเดียว;ค่าเก่ายังมีผลจนกดยืนยันรับใหม่. เก็บเก่าไม่คืนหิน. pendingรอดreload/slot switch; cancel sheetไม่ทิ้งผล;มีทางกลับมาดู. ห้ามทำลาย/แก้ชิ้นpendingด้วยคำสั่งอื่น. สวมอยู่ทำได้,ล็อก/training/battleปฏิเสธ.

Optionalaccount.equipment_craftingรองรับเซฟเก่า; initialize/migrateเติมstock0/pendingnull. ไม่มีSQL/wallet/receiptใหม่. คำสั่งroll/decide/rarityภายใต้CAS/UUIDเดิม;serverseedเท่านั้น. UIโชว์previewค่าเดิม/ใหม่/cost/ชื่อชิ้น/rarityและconfirmation. ไอคอนเลือกจากassetsจริง พร้อมsource provenanceและงบpack32MiB.

## เกณฑ์ตรวจ
AC01: atomic exactcost/guard/RNG/options/rare100%/oldrandomstream unchanged
AC02: pending reload/receipt retries/no duplicate payments/slot isolation
AC03: migration defaults/preservesold/real native320390/pack/build/public
