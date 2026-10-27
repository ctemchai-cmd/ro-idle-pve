# D193 — Farm crafting stones

ผู้ใช้ต้องการหินre-roll/Rarityหาได้ง่ายขึ้นและดรอปตามด่าน. TASK169เพิ่มAFKStoryราย5นาทีอิสระสองชนิด,ช่วงบท1–3เฉลี่ย12h4/1,4–6=6/2,7–9=7/2.5,10–12=8/3. ตัวเลขเป็นค่าเฉลี่ยไม่การันตี/ไม่มีpity. ร้านเดิม3×8k/2×20kทองและราคาคราฟต์คงเดิม. บท6ครบ24h+ร้านRarity~6/dayจากเดิม2/day;Epic→Legendary4หิน~0.67วัน/ชิ้น;24ชิ้น~16วันถ้าทั้งหมดเริ่มEpicและซื้อครบทุกวัน,เทียบเดิม48วัน. สูงสุดยังต้อง12/30ต่อชิ้นและเปลี่ยนTierต้องชิ้นใหม่.

Frozen snapshot.crafting_drops(version,chances),farm.crafting_rng(state,draw_count),pendingclaim.crafting_materialsเป็นoptionalเพื่อให้เซฟ/pending/receiptเก่ายังอ่านได้. RNGแยกเริ่มด้วยloot_rng.state xor0x43524146ก่อนrollgearแรกของwindowใหม่และpersist. สองdrawต่อintervalแม้prob0/ไม่ติด. Gear/cards/optionsไม่เพิ่มหรือลดdraw. ใช้drop_carry_msและ12hcapเดิม,seedไม่ขึ้นกับclaimID/จำนวนครั้งรับ. เก่าที่ไม่มีprofileไม่สุ่ม/ไม่ย้อนหลัง;farm.claimหรือset_stageจ่ายช่วงเดิมก่อนติดตั้งprofileใหม่. Keepfrozenwindow/Pendingrights/ทุกสต็อก/กาชา/ราคาคงเดิม.

Reserveหินเข้าpayloadตายตัว;claimรวมเลือกทั้งbatchตรวจเงิน/ความจุ/หินoverflowก่อนจ่าย. หินเข้าequipment_crafting.stock,ไม่wallet/ไม่inventory. คำสั่ง/receipt/CASเดิม;ไม่มีSQLหรืออ่านเขียนownerDB. UIแสดงเฉลี่ย12h/รอรับ/ผลรับจริงด้วยไอคอนหินที่มีแล้ว ไม่สร้างmediaใหม่.

AC01อัตรา/สูตร/strictschema/source scope;AC02split/cap/oldwindow/replay/fullbag/overflow;AC03native/full/build/public. Simulationความถี่ใช้seededreservationsเฉพาะfarm,ไม่ปรับสกิล/อาชีพ/บอส.
