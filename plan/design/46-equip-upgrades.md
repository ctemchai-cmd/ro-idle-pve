# ใส่อุปกรณ์ที่ดีกว่ารวดเดียว

23ต.ค.2026 · D156/TASK126. ปุ่มในBuddyทำกับตัวละครที่เลือกเพียงตัวเดียว. กติกาเดียวกับจุดแจ้งเตือนD125:Tierสูงกว่าก่อน,เมื่อTierเท่ากันค่อยrarity;ไม่ใช้การจำลองstat/options. ของต้องถึงเลเวล/ตรงslot/อาวุธตรงอาชีพและยังไม่มีตัวละครสวม. ของlockedสวมได้ตามกฎเดิม.

`equipmentUpgrades(state,characterId,content)` เป็นpure helperในbuildที่client indicator/server reducerเรียกร่วม. เลือกดีที่สุดต่อslotด้วยinventory orderเป็นตัวตัดสินเมื่อเท่ากัน. ช่องว่างเลือกของที่ตรงเงื่อนไข. ไม่ขโมยของจากตัวอื่น,ไม่คิดการ์ดเป็นอุปกรณ์,ไม่เปลี่ยนการ์ด/Refine/Enchantที่ผูกslot.

`equipment.equip_upgrades` รับเพียงcharacter_idและcommandenvelopeเดิม. Serverคำนวณทั้งหมดจากstateในtransaction,ไม่เชื่อรายการIDclient;เปลี่ยนassignmentเฉพาะ6slotที่มีhintและคืนreceiptเดียว. Optimisticpreviewใช้reducerเดียว;networkหนึ่งครั้ง,ไม่วนยิง6คำสั่ง. NooprejectNO_EQUIPMENT_UPGRADES/actorหายCHARACTER_NOT_FOUND/inbattleBUILD_LOCKED_DURING_BATTLE. คำสั่งซ้ำ/CAS/response lossผ่านprotocolเดิม;ไม่สร้างinventory/ledgerหรือใช้วัสดุ จึงทำได้แม้bag500เต็ม.

UIแสดงปุ่มใส่ของที่ดีกว่า+จำนวนช่องใต้ตัวละคร,SVGchevrons-upสีเขียว,disabledเมื่อ0หรือsave/battleล็อก. 320–390pxต้องไม่ล้นและไม่ใช้Emoji/กล่องยืนยัน6รอบ. Slotแจ้งเตือนหายเมื่อconfirmedstate/previewใช้ของที่แนะนำ;rollbackตามSaveControllerเมื่อserverไม่รับ.

หลักฐาน:unitselection/reducer/preview+realAuth/API/SQLmobileต้องพิสูจน์1write1revisionและreloadยังอยู่,simulatedresponse lossใช้UUIDเดิมไม่ทับของจากเซฟเก่า. Publicsmokeตรวจbundles/health/401โดยไม่เข้าบัญชีจริง. ไม่มีSQL/envหรือการแตะเซฟowner.
