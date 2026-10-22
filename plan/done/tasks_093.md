# TASK-093 — จัดบอสตาม Origin และเพิ่มการ์ด Puppet รุ่นรอง

Milestone: M4 · D-122

## งานที่ต้องรอก่อนหน้า

- TASK-073, TASK-077, TASK-083, TASK-040, TASK-091 (done)

## เป้าหมายและขอบเขต

ผู้ใช้ทักAngelingเป็นMVPและเสนอPuppetภาพสีจาง จากนั้นยืนยันเอฟเฟกต์รุ่นรองต่างจากใบจริงแบบRO Origin. แก้Angeling/Devilingที่เดิมใช้PCMini และเพิ่มPuppet Iเจ็ดบอสที่มีภาพครบ (Angeling/Deviling/GTB/Eddga/Moonlight Flower/Baphomet/Doppelganger). ใช้ภาพเดิมกับCSSสีจาง เก็บvariantแยกจากsourcegrade/rarity ไม่เพิ่มรูป/ระบบกิลด์/album/PvP/ดาวหรือPuppet II. ค่าพลังและการแมปช่องเป็นadaptationสำหรับเกมนี้.

## รายละเอียด

73ชนิดจากเดิม66, Puppet I Rareสีฟ้าแยกจากMVPจริงLegendary. ปลดบท3และTier40จึงเริ่มบท4ตามequipmenttiers; weight100ต่อชนิดเทียบnormal1000/mini200/MVP10. ไม่เพิ่มโอกาสcardhit1–2%ต่อ5นาที. โปรไฟล์เก่าจ่ายpoolเดิมครั้งแรกแล้วใช้catalogใหม่สำหรับอนาคต.

## ขั้นตอน

1. ตรวจofficialOriginPuppetชื่อบอส/เทียบcatalogจริง และระบุส่วนที่adapt
2. เพิ่มvariant/parentในcatalogและpureprofilebuilder, นิยามeffectsด้วยmodifiers/triggersเดิม
3. ใช้sharedCardIcon/gradeทุกหน้าพร้อมสีจางและคำอธิบายจริง
4. ตรวจcatalog/effects/save/reward/mobile/build แล้วpush/Vercel/publicreview

## ผลส่งมอบ

Catalog73ชนิด/7Puppet, sharedtypedmetadata/UI, source/adaptationnotes และผลตรวจที่ทำซ้ำได้

## เกณฑ์ตรวจรับ

- [x] AC-01: Angeling/Deviling เป็นMVP/LegendaryตามOrigin; รักษา66stableIDs/รูปต้นทาง/ช่อง/เลเวล/ล็อก/paidledgerและassignment เซฟเก่าย้ายเป็นทองโดยไม่ล้างของ
- [x] AC-02: เพิ่ม7Puppet Iเป็นdistinctdefinitionsพร้อมvariant/parent/sourceและRare; ไม่ใช้Holyarmor/ASPD/splashของใบจริง มีeffectsรุ่นรองผ่านcompositionเดิม พลังlevel/rarityและprocไม่คูณซ้ำ; รวม73definitions/66nativeportraits
- [x] AC-03: Farm/Tower/gachaสร้างPuppetได้ตามcatalogและtier/variantgate โดยอัตราการ์ดรวมยังเฉลี่ย1.44–2.88ใบต่อ12h ราคา/pity/oldfrozenrewards/RNGpartition/cap/UUIDreplayไม่เปลี่ยน
- [x] AC-04: ภาพPuppetสีจางเฉพาะภาพ/กรอบRareยังชัด/ป้ายPUPPETแยกจากMVPบนbag/picker/socket/details/reveal/farm; mobile320/390ไม่ล้น Focused/build/M0/readinessและactualisolatedChrome/saveflow/publicVercelผ่านก่อนdone ไม่ownerwrite/6173restart/SQL/env/newassets/balancebatch

Reviewผ่าน4/4AC · 22 ต.ค.2026 · source`3a51292679cd5d101d348191b96cc83987acaced` VercelSUCCESS · [หลักฐาน](../evidence/task-093-review.json)
