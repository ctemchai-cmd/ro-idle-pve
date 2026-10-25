# D175 — เอฟเฟกต์พื้นครบทุกสาย

ผู้ใช้ยืนยันพื้นทั้งหมด. ไม่เปลี่ยนเอฟเฟกต์instantให้มีเวลายืนพื้นเพิ่มโดยไม่มีสถานะในengine. Catalogแยกcontinuous status fields,performance songs,instant ground bursts,other/summoned actors. ไม่มีการเพิ่มrangeหรือAI.

Fieldconfigอ้างpresentationID/STRจริง/status whitelist. Pureprojectionรวมsource+skillกับinstanceexpiryจริง;เลือกapplicationล่าสุดเป็นจังหวะใหม่ เก็บmaxexpiryของกลุ่มตามผลจริง. Rendererตรึงcentroidของเป้าตอนสนามเริ่ม ไม่ลากตามเป้าเดิน;recastใหม่ตั้งจุดใหม่. เพลงยังตามผู้เล่นเพลงและdedupต่อlivingperformer. Freeze/CCที่ไม่ติดไม่มีสนามค้าง. No-effect/interruptไม่มีสนาม. Reducedmotionวาดnativeหนึ่งเฟรม ไม่ซ่อนสนาม. วาดพื้นก่อนactors/numbers.

SourceRO song framework: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/Songs.js . แยกflatcolor groundกับhovering actualtextures (melody_a/b,idun_apple,cross_old,spell_01..08,lens). ใช้เฉพาะtextureจริงประกอบ2D,ไม่ยกโค้ดrenderer/ไม่อ้างว่าpixelidenticalclient. ภาพ32pxappleidun/poembragiที่เป็นstatussymbolsไม่ใช้ทำพื้น.

Runtime sidecar encodingใช้compactJSONพร้อมเขียนfloatที่เป็นsafeintegerเป็นinteger;JSONของbrowserเป็นNumberเหมือนเดิม,รักษา-0/ลำดับarray/stringspecialnumbers/ทุกfield. Media/sourceเดิมbyte-identical. บันทึกencodingในmanifestและverify sourceด้วยencodingเดียวกัน;artifact-onlyยังตรวจSHAไฟล์จริงครบ. เปรียบเทียบJSON.parseทุกsidecarและmediaSHAเพื่อยืนยันlossless. เป้าขนาด32MiB/initial<=1621492. ไม่มีลดคุณภาพภาพ/เพลงหรือเปลี่ยนเกณฑ์งบ.

Native base decals (magic_ring_a_s,quagmire_out,floor_cast,all_ground)อยู่ใต้STR/ACT. ขนาดคลุมboundsของผู้รับที่เกิดผลจริงตอนapplication;ไม่ได้สร้างphysics/rangeใหม่. วงเพลงเปลี่ยนเป็นall_ground128pxพร้อมnative song symbols. Areaopacityต่ำและอยู่ใต้actor/ตัวเลข. Fieldsourceanchorคงที่,recastตั้งใหม่. Instant6ท่ายังจบตามclipเดิม;Meteorเปลี่ยนเป็นnative meteor2จริง.

Matte rendering: mudเลือกcachedblack-keyprepare-timeสำหรับnear-blackขอบภาพ;ตัวpuddleยังopaque/RGBต้นฉบับ,sourceไฟล์ไม่เปลี่ยน. Glowของall_ground/lensใช้additiveตามหน้าที่native เพื่อลบblackrectangle. ไม่มีpixelprocessingต่อframe. แยกfloorbaseจริงกับnativeparticlesเพราะSTRบางชุดเป็นeffectรายcellไม่ได้มีภาพพื้นทั้งสนามสำเร็จรูป.
