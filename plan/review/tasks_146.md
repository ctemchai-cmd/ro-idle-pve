# TASK-146 — ตัวเลขอ่านชัดและท่าใหญ่ใช้ native assets

Milestone: M4 · D170 · design59

## งานที่ต้องรอก่อนหน้า
TASK-145, TASK-141
อ้างอิง implementation TASK-054 ที่เผยแพร่แล้ว; งานนี้ไม่ปิด review ภาพที่รอผู้ใช้ของงานเดิม.

## ขอบเขตและผลส่งมอบ
ขยายตัวเลขตาม CSS viewport; คงฟอนต์ bitmap/คริ/สี/ยอดรวมเฉพาะmulti-hit/focus. ท่าใหญ่Class2/HiทุกอาชีพมีVFXจาก local native STR/texture เท่านั้น. ไม่แก้เกมเพลย์/ดาเมจ/ราคา/เซฟหรือทำbalancebatch. ใช้ไฟล์เดิม/metadataจริง ระบุการadapt/reuseอย่างตรงไปตรงมา.

## ขั้นตอน
1. ตรวจsource metadata/ระบุscopeครบและfreezeก่อนแก้
2. ทำnumber layout/typed native renderer+assetbindings พร้อมchecksum/provenance
3. ตรวจขนาด/ชั้นภาพ/จังหวะhit/native320390/ความลื่น/reducedmotion
4. Build/assets/replay/scope แล้วpushและverifyVercelจริง

## เกณฑ์ตรวจรับ
- [x] AC-01: ตัวเลขออก/คริ/ฮีล/รับ/ยอดรวมอ่านชัดที่320/390โดยไม่ถูกย่อตามarena; คงสี/focus/ผลรวมและไม่ล้นด้านข้าง
- [x] AC-02: ครบexplicit catalogท่าใหญ่ทุกClass2+Hi; ทุกeffectมีasset/meta/SHAจริง; scopedpathไม่วาดproceduralshape/projectile/finisherburstแทนassets
- [x] AC-03: nativeคลิปเห็นจริงหลายจังหวะ,ชนdamagecontact,ขัดก่อนปล่อยไม่มีเอฟเฟกต์,1x2x4/reducedmotion/expiry/performanceผ่าน; engine/contentgameplayเหมือนเดิม
- [ ] AC-04: dependencycomplete runtimeภายใต้budgetที่วัดชัด,starter/library/build/root-filteredผ่าน;push/VercelSUCCESS/publichostedผ่าน

## วิธีตรวจและหลักฐาน
T146-AC01..04: local metadata/checksum audit, actual shared React/Canvas/engine browser viewport320390, replayและscope checks, assets/build/publicread-only hosted. รายงานplan/evidence/task-146-review.json.

## Blocker / คำถาม
ไม่มี. ไม่restart6173/ไม่owner Auth-save/ไม่SQL-env/ไม่agents.
