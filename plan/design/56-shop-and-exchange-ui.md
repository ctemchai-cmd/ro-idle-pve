# D167 — ร้านแลกเป็นชุดและUIที่เป็นชุดเดียวกัน

ผู้ใช้ขอ5ข้อ:จัดUIแลกเศษสกิลให้มีspace/ปุ่มสวย,ลบCrystalhow-toหน้าการ์ด,เพิ่มโควตาร้านและราคาทอง,Crystal20ครั้ง,แลกทั้งหมดและPanelเข้าธีม. Assistantbaseline:Crystal20ครั้ง/วัน×10Crystalราคา25000gold(เดิม20000×1);แพ็กEXP2500/manual3000/ore4000/enchant5000วันละ10,carddust20Crystal/essence30Crystalวันละ10ราคาเดิม,scroll6000gold/99ครั้ง. นี่คือ20ครั้งแลกรายการเดิม=200Crystal,ไม่ใช่20กาชา. ไม่เปลี่ยนgrant/gacha100ต่อใบ/AFK480ต่อ12hหรือbattlevalues.

Goldpricingเพิ่ม20–33%ตามรายการ ไม่คิดย้อนหลัง. Counterที่ซื้อไว้วันนี้คงเดิม;เช่นCrystalซื้อ1แล้วเหลือ19ในวันเดิม. Bangkokdayจากserverเดิม. ขยายshopquantity schema/dataเป็น99;oldrequest/receiptยังอ่านได้. SharedshopQuoteตรวจquantity/rights/ทุกresource+stockก่อนหัก;shopMaxQuantityเลือกเท่าที่จ่ายได้ในofferนั้นและรับได้โดยไม่overflow. ปุ่มแสดงmaxquantity/ราคารวมก่อนกด;1command/receipt/revision ไม่loopทีละชิ้น. เงินไม่พอทุกกรณีrollbackทั้งคำสั่ง;UUIDreplayไม่เพิ่มstockหรือตัดเงินซ้ำ. ไม่บังคับซื้อทุกofferรวมร้านในคลิกเดียว.

Shardexchangeคง10skillmanual→1awakenshard/1→5;modeเปลี่ยนเริ่มquantity1,tabrole,flowใช้nativeResourceIcon,stepper40px/max/inputnumber/finalsummary/primary44px. Refsingleflight+finallyreleaseทั้งร้านและเศษ ป้องกันการแตะซ้ำก่อนrerenderและerrorไม่ค้าง. ไม่มีการเปลี่ยนAwakenราคา/actualpaid/refund.

Panelเปลี่ยนcosmeticเฉพาะsurfacesที่หลุดธีม:shop/shard/Tower/dungeon/gacha/refine chance/stats header/class choiceใช้white-blueและborderบาง/radius12–16. เก็บraritycard/innerglowAwaken/สีอันตราย/HP-SP/bossdarkoverlayและnativeart. มือถือportrait320390/nozoom/textไม่selectแต่inputยังแก้ได้ตามเดิม. Contentpatchใช้backup-migrateเดิม;noSQL/env/ownerwrite/6173restart.
