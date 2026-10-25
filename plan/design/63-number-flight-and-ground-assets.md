# D174 — ทิศตัวเลขและหลักฐานสกิลพื้น

ทุก floating number ใช้การเด้งขึ้น120ms แล้ว drift ซ้ายบนตาม presentation clock, ไม่มี sequence parity/facing/random direction. อายุ800msสำหรับ hit/heal,ฐานขนาดและสีnativeเดิม พร้อมpop/shrinkร่วมกัน. เก็บจุดกำเนิดตอนแสดงครั้งแรก ไม่ตามการเดิน/เปลี่ยนcastphaseของเป้า. Motion off คงเลขนิ่ง.

Multi-hit total คงเงื่อนไขเฉพาะ direct skill หลายHit/หนึ่งaction/หนึ่งtarget/ผู้โฟกัส. ใช้ first impact เป็นจุดเริ่ม drift ที่ช้ากว่า hitครึ่งหนึ่ง, latest impact เป็นจังหวะเด้ง/เวลาคงยอดและfade;ยอดใหม่จึงไม่ย้อนขวา. เก็บoriginต่อsource/action/targetแล้วทิ้งเมื่อหมดผล. ไม่แก้ damage/engine/เหตุการณ์/save/content.

Ground assets audit อยู่ evidence150: native Sanctuary/Storm Gust/Quagmire เป็นSTRจริง. `appleidun/poembragi/serviceforyou/whistle/humming/fortunekiss`32pxที่ชื่อเกี่ยวกับเพลงเป็นภาพสัญลักษณ์ มีตัวอักษรSP/FLEE/HIT/CRI จึงไม่ควรขยายเป็นพื้นวง. Source effect table `277_ground` ชี้ FUNC DissonanceEffects.forEach;ไม่ได้ให้คลิปพื้นเพลงสำเร็จ. วงD173คือการประกอบnative priest_angel_ring+ain_note_01อย่างเปิดเผย ไม่อ้างว่าเป็นoriginalsongfield. ข้อสรุปเฉพาะคลังและmappingที่ตรวจ ไม่ใช่อ้างว่าROไม่มีพื้นเพลง.
