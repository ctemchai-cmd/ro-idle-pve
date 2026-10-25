# D174 — วิถีเลข RO แบบเด้งโค้ง

คำอธิบายสุดท้ายของผู้ใช้: พุ่งเร็วไปทางขวาบนแล้วโค้งตกลง พร้อมย่อส่วน แบบเดิมแต่ไม่สลับซ้าย/ขวา. ไม่ใช่driftเส้นตรง. Lifetime650ms,apex44%(286ms),height62world,dx64world,size1.25→.6. ตัวเลขdamage/critical/heal/incomingใช้วิถีร่วมกัน ไม่อิงsequence/facing/RNG. ตรึงจุดโดนรวมcastbaseline;เป้าเดินไม่ลากเลข. Font/color/criticalbackground/focus/ค่าจริง/visualcontactเดิม. Reducedmotionคงนิ่ง.

Multi-hit total ยังคงเฉพาะdirectหลายHit/หนึ่งaction/หนึ่งtarget/ผู้โฟกัส. Firstimpactเป็นต้นวิถีครึ่งระยะ;ยอดเพิ่มไม่รีเซ็ตพิกัด. Latestimpactควบคุมbounce/hold/fade,ขนาดขั้นต่ำ80%เพื่ออ่านยอดที่ยังสะสมได้. จบวิถีแล้วคงตำแหน่งปลายจนfade. ไม่เพิ่ม/รวม damageเองจากการdraw.

ประวัติ:source4abfbเป็นซ้ายบน,source8caaเป็นdriftขวาบน ก่อนผู้ใช้แก้เป็นวิถีโค้ง. ผลตรวจเก่าไม่ใช้ปิดเกณฑ์การเคลื่อนไหวล่าสุด. หลักฐานล่าสุดnative4groups/34focusedรวม151และGIF14framesมาจากrendererจริง. งานนี้ไม่แก้engine/stat/save. D175/TASK151เป็นเจ้าของassetpackที่เปลี่ยนร่วมreleaseเพราะผู้ใช้ขอพื้นทั้งหมด.

Ground auditเดิมในevidence150: Sanctuary/StormGust/QuagmireมีnativeSTR. ภาพ32pxappleidun/poembragi/serviceforyou/whistle/humming/fortunekissเป็นstatussymbolไม่ใช่พื้น. งานใช้nativefloorsและactualsongtexturesครบติดตามdesign64/TASK151.
