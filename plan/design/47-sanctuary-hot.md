# Sanctuary: Pure HoT

D157 / TASK127 / 23 ตุลาคม2026

ผู้ใช้แยก Bard/Dancer เป็น Instant+HoT, Sanctuary เป็น Pure HoT จึงต้องฮีลต่อเนื่องแรงกว่า. Sanctuaryไม่มีopening_heal;apply_status `sanctuary_regeneration` เรียกheal_tickทันทีที่ร่ายสำเร็จและทุก1000msอีก5ครั้งก่อนหมดที่6000ms. ไม่มีติ๊กตอนexpiry. ทุกติ๊กใช้ค่าเดียวกัน105%→175%MATKตามrank1–10 (สองเท่าของเพลงส่วนHoTที่P.ATK=MATK);ค่าเป็นbaselineผู้ช่วย. ที่พลัง1000/rank10ได้1750×6=10500ต่อเป้า เทียบเพลง1750+(875×5)=6125. เพลงยังเด่นการฮีลก้อนแรก/บิลด์กายภาพและบัฟอาชีพตน;ไม่เปลี่ยนเพลงเพื่อทำให้Sanctuaryเด่น.

ใช้statusใหม่เพื่อคงregenerationของAlchemistและphysical_regenerationของเพลง. CT900/ACD1000/SP40/ระยะ6s/ทั้งทีม/โบนัสhealing_outgoingและreceived/เกราะไม่ลดฮีลเดิม. sharedengineรองรับtick_on_applyแล้ว;ไม่เพิ่มtimerหรือสูตรในUI/renderer. ทุกcastมีstatusinstanceและoffense_snapshotแยกตามกฎบัฟuncappedเดิม. SourceตายคงHoT/targetตายล้าง/dispelได้;โดนขัดก่อนcast_resolveไม่มีstatusหรือtickและไม่คืนSP.

รายละเอียดสกิลอ่านdefinition/statusจริงและเพิ่มคำว่าเริ่มทันทีเมื่อperiodic.tick_on_apply;วงฮีลเดิมตรวจhealperiodicจึงรองรับstatusใหม่โดยไม่เพิ่มasset. เก็บlogicalID/rank/ทุนเดิม;contenthashเปลี่ยนใช้backup-migrateflowที่มีอยู่. ไม่มีSQL/env/ownerwrite/บาลานซ์batch. Hi-classยังไม่เปิดและTASK123–125ไม่ถูกยกเลิก.
