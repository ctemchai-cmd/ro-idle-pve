# D177 — ยืนยันย่อย/สุ่มต่อ และพื้นแสงอ่านชัด

26 ตุลาคม 2026 · TASK153

ตัวเลขใช้วิถีร่วมเดิม620ms/dx76/apex44%/ย่อส่วน/painted origin แต่เพิ่มความสูง78→100world. ไม่มีการเปลี่ยนค่าดาเมจหรือเวลาimpact.

ออร่า Bard/Dancer ใช้ellipseครอบเท้าของเพื่อนร่วมทีมที่ยังมีชีวิต ไม่รวมsummons/ศัตรู. คำนวณจากตำแหน่งinterpolatedจริงทุกเฟรมและเผื่อมุมทแยงกับขนาดตัวละคร;ขั้นต่ำ420×260. Cropขอบดำall_groundตามpixelbounds9,8,110,74;ringเคลื่อนตามทีม โน้ตยังอยู่รอบคนร่าย. Pulseขยายเท่านั้นไม่หดจนเพื่อนหลุด. แสดงพื้นที่บัฟ ไม่เพิ่มrangeหรือเปลี่ยนเป้า.

Sanctuary ยังคงSTR83ที่ตรงสกิลจริง แต่เอาวงรูนทั่วไปออก. ใช้magic_greenที่skill-assets/70 groundEffect319ระบุจริง ร่วมกับpok2.tgaของGroundEffect เป็นพื้นเรืองขาวอมเขียว5×5ช่อง. Originalsourcepixelsไม่แก้;เป็นการจัดวาง2D ไม่ใช่การจำลองgeometry3Dต้นฉบับตรงเป๊ะ. ลดmotionให้พื้นนิ่ง. ผลHoT/expiry/ตำแหน่งanchorเดิม.

อ้างอิงprimary renderer: [EffectTable EF_BOTTOM_SANC319](https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js) และ [GroundEffect pok2.tga](https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/GroundEffect.js). ไม่ถือว่าเป็นสูตรIdleAdventureหรือofficialGravityspec.

การย่อยการ์ดทั้งCardSheetและBuddyเปิดSheetยืนยันชื่อใบ/เลเวล/ผงที่ได้ก่อน. Cancel/backdrop/Escapeไม่ส่งคำสั่ง. Confirmส่งinstanceเดิมหนึ่งครั้ง มีsingle-flight;ตรวจlocked/ownerจากstateล่าสุด. คำสั่ง/ราคา/receiptเดิมไม่เปลี่ยน. หน้าย่อยหลายใบเดิมมีexplicitconfirmอยู่แล้ว.

หน้าผลสุ่มการ์ดมีปุ่มสุ่มอีก1หรือ10ตามครั้งล่าสุด ราคาและwalletล่าสุด;ไม่ปิดผลเดิมระหว่างรอและไม่ทิ้งผลเมื่อคำสั่งล้มเหลว. ป้องกันกดย้ำ/เงินไม่พอ/คลังเต็ม. สุ่มสำเร็จแทนผลด้วยreceiptcreated IDsชุดใหม่;ปุ่มเสร็จสิ้นปิดเท่านั้นเพราะรางวัลเข้าคลังแล้ว.

ตรวจAC01: native620ms higherarc/edge/focus/1x2x4/static และellipseครอบ4มุม/เคลื่อนทีม/สองผู้แสดง;SanctuarybaseAwnativeพื้นขาวไม่มีmagic_ring. AC02: actualReact/reducersย่อยทั้ง2ทางcancel/no-command/confirm1command/locked/equipped/failure;สุ่ม1/10ต่อและเงิน/คลัง/รอ/ล้มเหลว. AC03: TSที่เกี่ยวข้อง,แอสเซ็ตsourcecheck/runtime32MiB/initial<=1621492,rootbuild/M0/publicread-only/ไม่มีownerwrites.
