# ผล optimize สำหรับเว็บ

วันที่: 18 ตุลาคม 2026 (Asia/Bangkok)

รายงานนี้เป็นผลแปลง WebP รอบแรก ภายหลังได้รวมสื่อที่เหมือนกันและย่อ metadata ดู [พื้นที่ปัจจุบัน](STORAGE_OPTIMIZATION_REPORT.md) พาธในดัชนีสกิลเป็นพาธล่าสุดเสมอ

ภาพ **57,261 ไฟล์** ลดจาก **963.1 MB เหลือ 513.7 MB** ประหยัด **449.4 MB (46.67%)** ใช้ WebP lossless เมื่อเล็กกว่า PNG/APNG และตรวจค่าพิกเซลจริงก่อนเลือกไฟล์

| รายการ | จำนวน |
| --- | ---: |
| WebP ภาพนิ่ง | 57,212 |
| WebP แอนิเมชัน | 15 |
| PNG ที่เล็กกว่า WebP | 18 |
| APNG ที่คงไว้เพื่อรักษาเฟรม/ค่าพิกเซล/timing ตรงกัน | 16 |
| ไฟล์ที่ optimize ล้มเหลว | 0 |

ไม่ย่อขนาดภาพ ไม่ลดสี และไม่แปลงเสียง WAV ตรวจ RGBA ของทุก composited frame, dimensions, ระยะเวลาเฟรม และ loop ก่อนเลือก WebP พิกัด atlas, layer transforms, anchor, ชื่อ, ID และ annotations ยังคงเดิม แอนิเมชันที่ตรวจ WebP แล้วไม่ตรงทุกค่าคงเป็น APNG

ไฟล์สื่อในดัชนียังมี **60,504 รายการ** เท่าเดิม (native 60,460 + ชุดเริ่มต้น 44) รวมเสียง 3,243 WAV พาธ นามสกุล ขนาด และ SHA-256 ใน sidecar/catalog/indexes ปรับตามไฟล์ปัจจุบันแล้ว ไม่ควรเดานามสกุล `.png` เอง

## การลบต้นฉบับ

หลังตรวจไฟล์ที่ใช้แทนและดัชนีแล้ว ลบ PNG ที่มี WebP แทน **57,227 ไฟล์** และลบ source payload **49 ไฟล์ / 8.07 GB** ได้แก่ ZIP, data.grf และ System เก็บ JSON provenance, source URL, checksum และตารางอ้างอิงไว้

PNG/APNG ที่เป็นตัวเลือกที่ดีกว่ายังคงเป็นไฟล์ใช้งานหลักเพียงรูปแบบเดียว ไม่ได้เก็บ WebP ซ้ำไว้ข้างกัน แผนการลบและ checksum ของไฟล์ที่ลบอยู่ใน [original-cleanup.json](original-cleanup.json) ตัวเลขนี้เป็นขนาดไฟล์เชิงตรรกะ ไม่ใช่จำนวน block ของ filesystem

คลังปัจจุบันตรวจ/ค้น/เล่นได้โดยไม่ต้องใช้ source archive การดึงทิศอื่นหรือไฟล์นอกหมวดที่ส่งออกไว้ต้องนำเข้าไคลเอนต์ใหม่ตามคำขออย่างชัดเจน

## ค้นชื่อสกิลแล้วได้ไฟล์เอฟเฟกต์

เปิด [skill-assets.json](library/skill-assets.json) หรือใช้:

```sh
python3 scripts/build_ro_skill_index.py --find "Storm Gust"
python3 scripts/build_ro_skill_index.py --find "Stromgust"
```

ตัวอย่าง [Storm Gust — skill ID 89](library/skill-assets/89.json) เชื่อม `WZ_STORMGUST` ไปยังไอคอน, effect ID 89, atlas `stormgust`, metadata ของ keyframe, ตัวเลือกภาพแบบรายละเอียดต่ำ และเสียง `wizard_stormgust.wav` ไม่สับสนกับไฟล์ชื่อคล้ายกัน `storm gust.str`

เปิด [bash.meta.json](skills/bash.meta.json) แล้วดู `related_skill_assets` เพื่อไปข้อมูลสกิล Bash ได้เช่นกัน ไอคอนสกิลใน native library มีลิงก์แบบเดียวกัน

ทุก record แสดงการ resolve จากพาธต้นทางจริง พร้อมสถานะ `missing` / `ambiguous` เมื่อจับคู่ไม่ได้ และชนิด renderer ที่ต้องใช้ บางเอฟเฟกต์เป็น procedural/code-generated จึงต้องมีโค้ดวาดเอฟเฟกต์ ไม่ใช่รูปสำเร็จเพียงไฟล์เดียว ส่วน native STR ที่มี texture ขาด 9 ชุดยังคงระบุไว้ใน [coverage.json](library/coverage.json)

## ผลตรวจและเครื่องมือ

- ผ่านการเทียบ RGBA ทุกเฟรมและ timing ก่อนเลือกไฟล์ใหม่
- ตรวจ SHA-256, JSON, ขอบเขต atlas และ ACT frame references ด้วย [validation.json](library/validation.json)
- ทดสอบ importer/optimizer/skill lookup 15 กรณี รวมเปิด cache หลังลบ PNG และปฏิเสธการลบเมื่อ replacement ถูกเปลี่ยน
- ตรวจลิงก์ของ registry สกิลกับไฟล์ภาพ/เสียง/metadata ที่เหลือจริง

ข้อมูลเครื่องอ่าน: [web-optimization.json](web-optimization.json) | คู่มือ: [README.md](README.md)
