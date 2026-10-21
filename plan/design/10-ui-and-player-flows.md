# หน้าจอและการเล่นครบวงจร

19 ตุลาคม 2026 · TASK-012 · สเปก UXก่อนimplementation; wireframesและflowถูกreviewระดับแบบ ยังไม่มีหน้าจอเกมจริง

ใช้ธีมแฟนตาซีที่เข้ากับcharacter spritesและฉากในpack ไม่ล็อกให้เหมือนRO Classicทุกพิกเซล ฟอนต์NotoSansThaiที่เก็บlocal สี/ไอคอนมีtextกำกับ ไม่ใช้สีrarityหรือสีเครือข่ายเพียงอย่างเดียว

## โครงหน้าจอ

Desktop1280×720: ด้านบนทรัพยากร/สถานะการบันทึก กลางเป็นสนามประมาณ60%ความกว้าง ด้านขวาpanelทีม/รายละเอียด ด้านล่างคิวและtabs Farm/ทีม/สกิล/ของ/ดัน/ตั้งค่า ไม่มีtabsPet/Rune/Artifactที่กดใช้งานไม่ได้ในรุ่นแรก

```text
┌ ชื่อผู้เล่น | ทอง EXP manuals crystal | บันทึกแล้ว / กำลังบันทึก ┐
│ บท/ด่าน/ผลฟาร์ม              │ ตัวละคร4คน [HP/SP/สถานะ]       │
│        ทีมหน้า2/หลัง2 ←→ ศัตรู │ ตัวที่เลือก: สเตตัส/อุปกรณ์      │
│    cast telegraph / ดาเมจ      │ คิว [SI][CT][ACD][ช่องถัดไป]    │
├ ฟาร์ม / ทีม / สกิล / ของ / ดัน / ตั้งค่า                     ┤
│ รายได้ที่รอรับ | ด่านที่เลือก | [รับฟาร์ม] [สู้บอสด่านถัดไป]   │
└──────────────────────────────────────────────────────────────┘
```

มือถือ360pxขึ้นไป: topbarสองแถว → สนามเต็มความกว้าง → HUDทีมเป็นสี่แถวสั้น → bottomtabsและsheetรายละเอียด คิวของตัวที่เลือกสี่ช่องเรียงแถวเดียว, เปิดtooltipด้วยแตะ/กดซ้ำปิด ไม่ต้องhover ~~Landscape844×390สนามกับpanelแบ่งข้าง ไม่บังคับหมุนจอ~~ ยกเลิกตาม D-052: แนวตั้งเท่านั้น มือถือแนวนอนแสดงข้อความให้หมุนเครื่อง สกิล/ของใช้sheetที่scrollได้; layout ปัจจุบันของ `/play` ดู [design30](30-game-shell-ui.md)

ตัวอักษรเนื้อหาไทย>=14CSSpx, secondary>=12, touch target>=44×44, focus keyboardเห็นได้, modalคืนfocusที่ปุ่มเดิม, motion/audioปิดได้ ไม่วางข้อความบนVFXโดยไม่มีพื้น contrast สถานะCT/ACDแยกชื่อเพื่ออ่านว่าเกิดอะไรขึ้น

## หน้าจอและ action

| หน้า | แสดง/ทำได้ | ไปต่อ/ออก |
| --- | --- | --- |
| Auth | สมัคร/ล็อกอินอีเมลรหัสผ่าน, ลืมรหัส, recovery callback, errorพร้อมretry | สำเร็จโหลดcloudก่อนเลือกเล่น; กลับล็อกอินได้ |
| สร้างตัวหลัก | เลือกหกroot/รูปลักษณ์, previewบทบาทและstarter2skills | ยืนยันcreateครั้งเดียว; ก่อนยืนยันกลับเลือกได้ |
| ทีม | mainล็อกหนึ่งตำแหน่ง, เลือกNPC3จาก6, หน้า2/หลัง2, แตะสลับตำแหน่ง/ถอด | previewข้อซ้ำrootและrefuseทีมไม่ครบ4; ยืนยันนอกไฟต์ |
| ตัวละคร | เลือกmain/NPCแม้นอกทีม, EXPresource, [อัป1]/[อัปถึงเป้า]พร้อมรวมราคา, Breakthrough/เปลี่ยนClass2 | insufficientแสดงจำนวนขาด/แหล่ง; เลือกคนอื่นไม่โอนการลงทุน |
| Status | STR/AGI/VIT/INT/DEX/LUK, แต้มที่ใช้/เหลือ, draft+/−, resetฟรี | ก่อนยืนยันแสดงATK/HP/SP/SI/CT/ACDที่เปลี่ยน; ยกเลิกdraftไม่เสียแต้ม |
| Skills | root+branchที่ใช้ได้, Active/Passiveแยก, capตามlevel, upgradecost/targetlevel | จัดคิว4ช่องด้วยtapเลือก/reorder/dragเป็นทางเลือก; ห้ามท่าซ้ำ, Passiveไม่กินช่อง |
| อาชีพ | branches/unlock20/อนาคต70, ผลrefundจริง/ของที่ใส่ไม่ได้ | เลือกนอกไฟต์; inventoryเต็มให้จัดของก่อน ไม่คืนทรัพยากรบางส่วน |
| Inventory | filter6slots/weapon/tier/rarity/lock, เปรียบเทียบ, equip/unequip/salvage; อาวุธฝึกหัดมีbadgeและแจ้งว่าผสม/อัปtierไม่ได้ ทิ้งคืน0ก่อนซื้อ | แสดงผลslotinvestmentแยกbaseitem; bulkเลือกไม่รวมworn/locked |
| Fusion/Tier | เลือก3ชิ้นที่ตรงกติกา/เลือกอัปtier, previewผลและราคา | duplicate IDs/ชนิดผิด/lockedปฏิเสธก่อนส่ง; สำเร็จเลือกชิ้นผลลัพธ์ |
| Slot | Refine/Enchantline/การ์ด1–3ช่องของcharacterที่เลือก, ราคา/แหล่ง | cardใส่/ถอด/อัป/ย่อยสำเนาแบบเลือกเอง; ไม่ย่อยของสวม/ล็อก |
| Farm/Story | ด่านที่ผ่าน/nextboss, farmstage selector, รายได้สะสม/cap12h, rewards pending | กดรับด้วยcommandเดียว; ต่อสู้มีHP/SP/CT/queue; แพ้เปิดสรุปหรือretryฟรี |
| Battle result | win/loss/timeout, damage/heal/shield/overheal/SP skips/CC/ผู้ตาย, telegraphที่ทำให้แพ้ | ปรับทีม/คิว/Status/ของหรือretry; ไม่ชี้ว่าการ์ดหายากจำเป็น |
| Tower | floorปัจจุบัน/firstclearrewards/โจทย์, เข้า/retreat, results | ไม่reset; กลับฟาร์มโดยไม่หายunlock |
| Daily | boss3ตัว, attempts3ต่อboss, phase/HP/chests, serverday/resetcountdown | start/retreat/รับpending; ข้ามวันแสดงticketวันเดิมชัดเจน |
| Gacha | poolการ์ด18, odds75/22/3, pityทั้งสอง, single100/ten1000, inventoryspace | กดยืนยันแล้วรอreceipt; retryใช้requestเดิม; สำเนาเก็บก่อนเลือกย่อย |
| ตั้งค่า/เซฟ | เสียง/ความเคลื่อนไหว/ขนาดอักษร, account, exportbackup, importpreview, logout | recoveryไม่mergeเงิน; importไม่เขียนทับcloudโดยตรง; destructive resetไม่อยู่ปุ่มหลัก |

ทุก durable actionในตารางต้องมีcommand contractในTASK-013 ไม่มีUIเขียนwallet/claimsตามใจ PromiseในUIรอreceipt/revisionใหม่ ไม่เพิ่มเงินoptimisticก่อนcommit

## สถานะเครือข่ายและเซฟ

| State | ข้อความ/ปุ่ม | พฤติกรรม |
| --- | --- | --- |
| loading_cloud | กำลังโหลดข้อมูล / ลองใหม่ | ยังไม่ใช้localwalletเปิดเล่นหรือรับreward |
| ready | บันทึกแล้ว · เวลาcloudล่าสุด | เล่น/จัดทีม/รับของได้ |
| command_pending | กำลังบันทึก… / ตรวจสอบผล | กันกด actionซ้ำ; timeoutค้นreceiptหรือส่งrequestเดิม ไม่สร้างIDใหม่ |
| disconnected | การเชื่อมต่อขาด · หยุดความคืบหน้าชั่วคราว / เชื่อมต่อใหม่ | พักbattle durable clock/progression, อ่านบิลด์/ดูของได้แต่ไม่spend/claim; เวลาAFKชำระตอนกลับออนไลน์ |
| session_expired | กรุณาเข้าสู่ระบบอีกครั้ง | เก็บcheckpoint localให้ตรวจกลับ; ไม่สลับไปwalletใหม่/guestอัตโนมัติ |
| revision_conflict | มีข้อมูลใหม่บนคลาวด์ / โหลดข้อมูลล่าสุด | โหลดcloudและrebaseเฉพาะdraftการจัดทีมที่ยังไม่commit; ไม่mergeเงินหรือส่งspendเดิมเป็นIDใหม่ |
| inventory_full | ช่องเก็บของไม่พอ / จัดของ | pendingrewardคงเดิม ไม่สุ่มหรือรับเงินบางส่วนแล้วลืมของ; ยังย่อย/ผสม/ปลดล็อกของได้เพื่อเปิดช่อง ไม่blockทุกdurable actionจนแก้ไม่ได้ |
| incompatible_version | มีเกมรุ่นใหม่ / โหลดใหม่ | ไม่รันcontentใหม่กับbattleเก่าเงียบ ๆ |
| recovery_preview | พบสำรองในเครื่อง / ตรวจข้อมูล | แสดงaccount/revision/version/hash; restoreผ่านserverpolicyเท่านั้น ถ้าสำรองเก่ากว่าใช้เพื่ออ่าน/ส่งออก |

บันทึกแล้วแสดงได้เฉพาะresponseที่มีreceipt/revisionจากserver ไม่มีการโชว์สำเร็จจากlocalStorageอย่างเดียว Initialloading/401/500/timeout/409มีข้อความที่ต่างกันเพราะการตัดสินretryไม่เหมือนกัน

## Preview และ tutorial

DraftStatus/เปลี่ยนของ/EnchantPrecisionต้องใช้pure compileBuild+timingfunctionsเดียวกับcoreเพื่อแสดงก่อน→หลัง เช่น ASPD100→125, SI1500→1200ms และSkillCT1000ที่CastSpeed100→125เป็น1000→800ms มีคำอธิบายว่าphaseปัจจุบันใช้snapshotเก่าและค่าใหม่ใช้ช่วงถัดไป ไม่บอกว่าคิวที่กำลังร่ายถูกย้อนไปเริ่มใหม่

Tutorialสั้นและข้ามได้: เลือกmain → เลือกNPC3ไม่ซ้ำroot → ดูสี่ช่อง/Passive → สู้1-1 → รับฟาร์ม → เปิดdraftStatus/upgradepreview สิ่งที่กดยืนยันลงทุนต้องให้ผู้เล่นเลือกเอง ไม่บังคับSTRหรือสกิลหนึ่งที่อาจผิดบิลด์ จุดปลด1-5/1-10/2-5/2-10ใช้contentunlockเดียวกับserver ตำแหน่งNPCว่างในdraftไม่ลบgear/skillsเก่าของคนเดิม

ก่อนเกณฑ์วัดจริงในTASK-039/042 ให้ลองflowที่360×740, 390×844 และกรอบแนวตั้งบนdesktop 1280×720/800 (ไม่มีแนวนอนตาม D-052) และ keyboard/Thai longnames/large text บทนี้เป็นwireframe/spec review ไม่ใช่ผลbrowser validationหรือภาพหน้าจอเกมที่สร้างแล้ว
