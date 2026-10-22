# Refine, Enchant, card และ actual-paid ledger

20ตุลาคม2026 · TASK-027 · ต่อจาก [equipment27](27-equipment-runtime.md) ใช้ slot-progress/cards/save-contracts จาก M0

`domain/progression/slots.ts` เป็น pure reducer ของ slot.refine/enchant/change_enchant และ card.assign/unassign/upgrade/salvage รับ AccountState clone + typed command + validated content คืน result code โดย mutation อยู่ใน transaction ของ account เท่านั้น ไม่มี I/O/เวลา/global RNG ทุกคำสั่งหยุดเมื่อมี active battle

`upgradeQuote(current,target,max,rows)` รวมทุกขั้นจากราคาตารางก่อนจ่าย ห้าม targetเท่าเดิม/ต่ำกว่าเดิม/เกินเพดาน คำสั่งที่ผิดไม่เปลี่ยนระดับหรือ wallet Refine/card upgrades ไม่คืนทุนในรุ่นแรก จึงเก็บหลักฐานราคา/ผลใน immutable receipt โดยไม่เพิ่ม refundable ledger ใน account

| ระบบ | กติกา runtime |
| --- | --- |
| Refine | ตีทีละขั้น +1–+4 สำเร็จ 100% แล้ว 80/65/50/40/30/20% · พลาดเสียแค่ราคาขั้นนั้น ไม่ลดขั้น · pity +10% ต่อครั้งที่พลาด รีเซ็ตเมื่อสำเร็จ (D-057, TASK-049); ราคาเต็ม 10 ขั้นถ้าสำเร็จทุกครั้ง 77000 ทอง/275 แร่; การ์ด 1 ช่องที่ 0, 2 ที่ +5, 3 ที่ +10 |
| Enchant | offense/vitality/precision เลือกหนึ่งสาย อัป0→10 ไม่สุ่ม; สายใหม่ต้อง change_enchant ก่อนถ้าสายเดิมมีการเลือกแล้ว |
| เปลี่ยนสาย | คืน vector ที่จ่ายจริงจาก ledgerของ character+slot แล้วตั้งสายใหม่Lv.0; ของฟรีคืน0 ต้องกดซื้อระดับใหม่เอง |
| Card assignment | ตรวจslot/capacity/instance แล้วล้าง reference ของใบเดิมจากเจ้าของเก่าก่อนใส่ใหม่; คนละสำเนาชื่อเดียวกันบวกกัน |
| Card upgrade | Lv.1→5 รวม7500ทอง/300ผงการ์ด; ล็อกกันย่อยยังอัปได้; levelอยู่กับ instance |
| Card salvage | ทั้ง batch ต้องเป็นการ์ดว่าง/ไม่ล็อก/IDsไม่ซ้ำ ตรวจครบก่อนลบ; Bronze20/Silver40/Gold80ผง ไม่คืนค่าอัประดับ |

Slot investments/cards อยู่กับ `(character_id, equipment_slot)` เมื่อเปลี่ยนของหรือถอดเพื่อนออกทีม เมื่อslotไม่มีของ ข้อมูลยังอยู่แต่ compilerไม่ส่งsourceเข้าสู้ เมื่อสวมใหม่จึงกลับมาใช้ ไม่มีการแบ่งค่าให้NPCใหม่ที่เข้าตำแหน่งทีมเดิม

## Ledger ที่มีขนาดจำกัด

`domain/progression/ledger.ts::compactPaidLedger` ทำตาม save-contracts.ledger_compaction: รวม active rows ตาม character+feature+skill/line เก็บผลรวม actual paid resources/quantity และ cost_versions ทุกเวอร์ชัน ใช้ entry ID แรกเป็น ID คงที่ และ cost_version เป็นเวอร์ชันของ contributionล่าสุด

ก่อน commit account rules จับ full refunded rows ที่เกิดจากคำสั่งนี้ใส่ `receipt.result.refunded_ledger_entries` พร้อม refund command ID จากนั้น compact account ให้เหลือเฉพาะ active scopes ไม่มี refunded history สะสม และไม่มี nonrefundable level/Breakthrough/Refine/card rows ในเซฟ Immutable receipt และ history/checkpoint เขียนใน SQL transaction เดิม ผล rejected ไม่ compact หรือแก้ข้อมูลเดิม

การเพิ่มทุนใน scope เดิมอัปเดตจำนวนเงินจริงใน row ที่มีอยู่ `ledger_entry_ids` จึงรวม row ที่เนื้อหาเปลี่ยนด้วย ไม่จำกัดเฉพาะ IDที่เพิ่งสร้าง ทุน Statusยังเก็บquantityของแต้มเพื่อตรวจ manual allocation budget การรีเซ็ตคืนแต้มจริงและคืนเฉพาะทรัพยากรสกิลที่จ่ายจริงตามระบบเดิม

ตัวอย่าง Enchantเก่าLv.2จ่าย100ทอง/2ผง แล้วอัปLv.3ในแพตช์ปัจจุบันจ่าย2700/9: active rowเดียวเก็บ2800/11และเวอร์ชันเก่า+ใหม่ เมื่อเปลี่ยนสายคืน2800/11 แม้ราคาซื้อ0→3ปัจจุบันเป็น4200/18 รายการคืนไปอยู่receiptแทนaccount ส่งUUIDเดิมซ้ำได้receiptเดิมโดยไม่คืนอีก

## Preview และ presentation

`client/slots.ts` เรียก quotes/reducers/build compiler เดียวกับ server บนclone เพื่อแสดงผลก่อนจ่าย ถ้าทรัพยากรไม่พอ previewเติมเฉพาะยอดขาดใน cloneสำหรับคำนวณผล ส่วนปุ่มจริงยังตรวจยอดจากเซฟและserverตรวจซ้ำ ไม่มีการส่ง preview state หรือ walletขึ้น API

Precisionเพิ่มDEXผ่าน primary modifier แล้วใช้ central resolverหา derived ASPD/Cast Speed; ไม่เพิ่ม allocatedDEX ในเซฟ ตัวอย่างDEX1→2ทำCast Speed100→101.5เมื่อINT1 และDEX+10ทำCast Speed115 ไม่มีสูตรCT/ACD/SIชุดใหม่หรือเพดานความเร็วเพิ่ม

Card modifiersใช้ `build/equipment.ts::resolvedCardModifiers` จุดเดียวทั้งรายการก่อนอัป/หลังอัปและpermanent source คูณ base×level×card rarityก่อนcentral rounding ไม่คูณ rarityของอุปกรณ์ซ้ำ เช่นGoldPATK8 Lv5เพิ่ม24 ต่อสำเนา สองสำเนาเพิ่ม48 ทุกsourceแยกinstance/owner/origin

UIเป็นdetailsในช่องอุปกรณ์ที่เลือก แยกRefine/Enchant/cards ไอคอนใหญ่ ช่องล็อกบอก+5/+10 แสดงราคาและstat/SI/CT/ACDก่อนกด การเปลี่ยนสาย/ย่อยต้องยืนยันผลตอบแทนก่อนทำ การ์ดใช้ภาพsymbolท้องถิ่นประกอบตามmetadata ไม่อ้างnativecardportraitเฉพาะใบ กระเป๋าการ์ดแบ่งหน้าทีละ30; ไม่มีช่องAIถือสกิลรอHP/บอสร่าย

## ตรวจรับ

Unit casesเพิ่ม7กรณี ครอบคลุมcapacity/ต้นทุน/old-price refund/card duplicates/ownership/empty-slot/poor-wallet preview/engine parity/bounded ledger/build fingerprints และcombat mutation lock ชุดAuth/API/SQL/Chromeเฉพาะผ่านก่อนรันregressionรวม ผลสุดท้ายและsourcehashอยู่กับTASK-027หลังreview

Fixturesสำหรับวัตถุดิบ/การ์ด/ราคาเก่าเป็น signed server-ownedในฐานชั่วคราว ไม่ใช่การอ้างว่าเล่นฟาร์มหรือสุ่มได้แล้ว Gachaเป็นTASK-037; rarity/tierเป็นTASK-028; การวัดบาลานซ์/paceทุกโหมดเป็นTASK-041


22ต.ค.2026 D-127–129: กติกา reward batch / Refineflat+percent / Enchantรายslot / CrystalAFKและgearchance ใช้ [design34](34-reward-slot-economy-tuning.md) และcanonicaldataล่าสุดเหนือค่าตัวอย่างเก่า
