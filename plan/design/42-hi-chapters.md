# บท10–12 เตรียม Hi-class / Awaken

D151 · TASK118 · 23 ตุลาคม2026. ผู้ใช้ให้ทำบท10–12เพิ่มจากบท9; เปิดพร้อมระบบที่เกี่ยวข้องตามข้อเสนอที่ตอบรับ ไม่เปิดระบบHi-classโดยปริยาย.

150ด่านใหม่ บทละ50: บัลลังก์ใต้สมุทรLv71–79, สุริยานครที่สาบสูญLv80–89, บททดสอบแห่งการตื่นLv90. ทุก10ด่านเปลี่ยนบอสหลัก รวม15ช่วง;ท่าใหญ่ขัดได้ทุก5ด่าน. ตัวเลขเป็นbaselineผู้ช่วย ไม่ใช่อัตราชนะที่วัดจากทีมผู้ใช้. SpecและtraitsจากrAthenaอยู่story-expansion.json;รูปลักษณ์ใช้nativeatlasในเครื่อง.

release_gateระบุfeatureและminimum_level_capรายด่าน. Shared admission/UI/farmใช้authorityเดียว: บท10ต้องhi_class_enabledและcap≥79;บท11cap≥89;บท12ต้องเปิดawakeningและcap≥90ด้วย. รุ่นนี้ยังcap70/Class2,180ด่านแรกเล่นได้เดิม;150ด่านใหม่ดูรายชื่อได้แต่ยังท้า/เลือกฟาร์มไม่ได้. Dailyนับเฉพาะบทที่เปิดแล้ว. ไม่เพิ่มfeatureflagคู่ขนานหรือcostปลอม.

180แถวเดิม/25enemies/17enemyprograms/126playerskills/progression/Tower/daily/equipment/slotprogressคงเดิมตรวจfixtureSHA. เพิ่ม36enemydefinitionsและ2โปรแกรมยืมStormGust/HolyCrossที่ใช้compositionเดิม;1bossต่อchallenge. EnemycheckpointรองรับLv120แต่partyยัง≤70;ขยายpartyตอนHi-classจริง. เปลี่ยนschemaนี้ไม่บังคับแก้SQL.

อัตราฟาร์ม/gear/cardบท10–12ใช้baselineบท9/Tier60ก่อน ปรับสำหรับHi-classจริงในmilestoneนั้น;ไม่เพิ่มTier80หรือการ์ดที่ยังไม่ออกแบบ. เส้นchanceการ์ดเดิมยึด130แถวและเดิมสูงสุด2%;ไม่เปลี่ยนของ/pending/RNG/cursorเซฟเก่า. Nativepackรวมmanifest≤32MiB.

ตรวจgeneratorcurrent/legacy,180rowchecksum,releasegatesทั้งUI/API/farm,enemy90checkpoint/party71reject,1x2x4และinterruptของprogramใหม่;actualChrome320/390+isolatedAPI;buildและpublicVercelก่อนdone. ไม่เขียนเซฟผู้ใช้หรือรันbalancebatch.
