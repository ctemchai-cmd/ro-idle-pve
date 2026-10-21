# รายงานดาวน์โหลดและนำเข้าแอสเซ็ต RO

วันที่ดำเนินการ: 18 ตุลาคม 2026 (Asia/Bangkok)

รายงานนี้บันทึกผลนำเข้าเริ่มต้น ภายหลังได้บีบอัดภาพแบบ lossless และลบต้นฉบับตามคำขอ ดู [ผล optimize ปัจจุบัน](WEB_OPTIMIZATION_REPORT.md) และ [ดัชนีสกิล](library/skill-assets.json) สำหรับพาธไฟล์ที่ใช้งานจริง

**นำเข้าครบ 60,460 รายการตามหมวดที่เลือกจากไคลเอนต์ kRO ชุด 10 มิถุนายน 2024** พร้อม `.meta.json` ทุกไฟล์ มีชุดเริ่มต้นที่เก็บไว้ก่อนหน้าอีก 44 ภาพ รวม 60,504 รายการในดัชนีรวม

พบ body ของอาชีพตรงกับตารางอ้างอิง **85/85 แบบ** รวมอาชีพพื้นฐาน/ขั้นสูง/อาชีพเสริมและรุ่นใหม่ จำนวน body เป็นรูปแบบภาพ ไม่ใช่จำนวนอาชีพที่ไม่ซ้ำ ดูพาธจริงใน [class-coverage.json](library/class-coverage.json)

## จำนวนไฟล์ native library

| ประเภท | จำนวน |
| --- | ---: |
| ตัวละคร: body / ชุด / เพศ | 529 |
| หัวและทรงผม | 104 |
| อาวุธซ้อนตัวละคร | 5,282 |
| ไอคอนสกิล | 1,299 |
| สกิลรูปแบบ world sprite | 1,291 |
| เอฟเฟกต์ STR/keyframe | 2,749 |
| เอฟเฟกต์ SPR/ACT | 222 |
| Texture เอฟเฟกต์ | 20,192 |
| เสียง WAV | 3,243 |
| มอนสเตอร์ | 1,703 |
| ไอคอนไอเทม | 7,973 |
| ภาพไอเทมขนาดใหญ่ | 7,921 |
| ไอเทมบนพื้น | 7,952 |

ไฟล์ PNG/WAV ที่ส่งออกมีขนาดรวม **1,166,807,769 ไบต์** (ประมาณ 1.17 GB) ไม่รวม metadata, indexes และต้นฉบับ ZIP/GRF ซึ่งในขั้นนำเข้ามีขนาดประมาณ 8.05 GB และถูกลบแล้วในขั้น optimize ลบเฉพาะ installer containers ชั่วคราวที่ซ้ำกับ ZIP แล้วเพื่อคืนพื้นที่ประมาณ 4.35 GB

## สถานะและขอบเขตความครบ

- ไฟล์ต้นทางที่ตรงหมวดถูกนำเข้าครบ 60,460/60,460 ไม่มี export ที่ล้มเหลว
- 60,451 รายการมีสถานะ `exported`; อีก 9 เอฟเฟกต์มีสถานะ `source_dependencies_missing` ซึ่งบางส่วนจะแสดงไม่ครบ
- เก็บทุก body/head/weapon SPR ในหมวดที่เลือก รวมมอนสเตอร์ ไอเทม เอฟเฟกต์ และเสียงของ snapshot นี้ ไม่ได้อ้างว่ารวมทุกแพตช์ของทุกเซิร์ฟเวอร์
- Actor/weapon atlas เน้น ACT direction 6 (หันขวา); ฝั่งซ้ายพลิกทั้งตัวรวม attachments ทิศอื่นไม่ได้เก็บแยกหลังลบ GRF ตามคำขอ
- มีไอคอนที่จับคู่ได้ 1,299 skill ID; world sprite อาจเป็นสกิลเดียวกับไอคอน ตารางอ้างอิงภายนอกมี 1,732 ID จากหลายเวอร์ชัน/NPC/สกิลต่อเนื่อง จึงไม่ใช่รายการไอคอนที่ต้องมีทั้งหมดในไคลเอนต์นี้ ดู [skill-coverage.json](library/skill-coverage.json)
- ACT 52 ไฟล์ไม่มี SPR ชื่อคู่กัน จึงไม่สร้างภาพขึ้นมาแทน รายชื่ออยู่ใน `inventory.json.unpaired_acts` ไฟล์ต้นฉบับเหล่านี้ไม่ได้เก็บไว้หลังลบ GRF
- บางเอฟเฟกต์เป็น procedural/code-generated: เก็บตาราง effect/skill mapping แล้ว แต่ไม่เท่ากับมีคลิปสำเร็จหนึ่งไฟล์ต่อสกิล
- Native WebP/PNG เป็น part atlas พร้อม layer/anchor/timing หรือ STR keyframes ต้องมีตัวเล่นแอนิเมชันสำหรับเว็บ ยังไม่ได้สร้างตัวเกม

## เอฟเฟกต์ที่ต้นทางอ้าง texture ไม่ครบ

เหลือ **9 เอฟเฟกต์ / 31 พาธ texture** ที่หาไฟล์ตรงกันไม่ได้หรือมี candidate หลายไฟล์ซึ่งเนื้อหาต่างกัน ทดสอบขอทั้ง 31 พาธจาก public renderer แหล่งที่สองแล้วตอบ 404 ทุกพาธ เก็บผลไว้ใน [source_overrides/manifest.json](library/source_overrides/manifest.json) ชิ้นที่ขาดเป็นส่วนโปร่งใสใน atlas ไม่ได้ถือว่าตรวจภาพครบแล้ว

| เอฟเฟกต์ | จำนวน dependency ที่ยังแก้ไม่ได้ |
| --- | ---: |
| [aura.str](library/effects/keyframe_effect_atlas/aura--2d4a7113e58d.meta.json) | 2 |
| [efst_c_ros2023_cape_2 / ros2023_2nd.str](library/effects/keyframe_effect_atlas/ros2023_2nd--8347c7b3fb33.meta.json) | 1 |
| [new_armscannon / new_armscannon_01_clock_down / new_armscannon_01_down.str](library/effects/keyframe_effect_atlas/new_armscannon_01_down--761004b018b3.meta.json) | 4 |
| [stormcannon / stormcannon_cast / min_stormcannon_cast.str](library/effects/keyframe_effect_atlas/min_stormcannon_cast--4e24cac4d766.meta.json) | 8 |
| [stormcannon / stormcannon_cast_bottom / min_stormcannon_cast_bottom.str](library/effects/keyframe_effect_atlas/min_stormcannon_cast_bottom--e4701c404c12.meta.json) | 1 |
| [stormcannon / stormcannon_cast_bottom / stormcannon_cast_bottom.str](library/effects/keyframe_effect_atlas/stormcannon_cast_bottom--cc2048265af3.meta.json) | 1 |
| [stormcannon / stormcannon_hit / min_stormcannon_hit.str](library/effects/keyframe_effect_atlas/min_stormcannon_hit--459179bac0bf.meta.json) | 6 |
| [violentquake / violentquake_bottom / violentquake_cast_bottom.str](library/effects/keyframe_effect_atlas/violentquake_cast_bottom--2c9866cc6dd2.meta.json) | 8 |
| [violentquake / violentquake_hit / min_violentquake_hit.str](library/effects/keyframe_effect_atlas/min_violentquake_hit--830966ba966b.meta.json) | 1 |

รายละเอียดพาธและสถานะอยู่ใน [coverage.json](library/coverage.json) ระหว่างทำต้นแบบสามารถเลือกเอฟเฟกต์ที่มีสถานะ `exported` จากคลังแทนได้

## ผลตรวจที่ทำแล้ว

- ตรวจ SHA-256 ครบ **60,460 native files** และชุดเริ่มต้น 44 ภาพ: ผ่าน
- ตรวจ JSON แบบเคร่งครัด, ขอบเขต sprite atlas และ ACT layer frame references: ผ่าน
- ค่าพิเศษใน STR เก็บเป็นสตริง `Infinity`, `-Infinity`, `NaN` ตาม `number_encoding` เพื่อให้เว็บอ่าน JSON ได้โดยรักษาค่าต้นฉบับ
- ทดสอบ importer 8 กรณี: ผ่าน รวม cache ไม่เรียก network/decoder, checksum, refresh ไม่ทำลายไฟล์เดิม, directional frame remapping และไม่สุ่มแทน texture กำกวม
- รัน native importer ซ้ำ: **cached 60,460/60,460** ไม่ส่งออกหรือถอดรหัสภาพใหม่ ใช้ fingerprints/checksum และ metadata เดิม
- การตรวจด้วยสายตาแยกจากการตรวจเชิงโครงสร้าง Native library ยังไม่ได้เปิดตรวจภาพทุกชิ้น เก็บสถานะนี้อย่างตรงไปตรงมาใน sidecar

ผลตรวจที่อัปเดตตามคลังปัจจุบัน: [validation.json](library/validation.json) เวลา UTC `2026-10-17T19:36:33+00:00` พร้อม SHA-256 ของ catalog ที่ตรวจ

## เปิดใช้งานต่อ

- [catalog.json](catalog.json): ดัชนีรวมและลิงก์ไป collection
- [search.tsv](library/search.tsv): ค้นชื่อ หมวด skill ID/constant และพาธ sidecar โดยไม่เปิดรูป
- [ตัวละคร](library/indexes/characters.json), [อาวุธ](library/indexes/weapons.json), [สกิล](library/indexes/skills.json), [เอฟเฟกต์](library/indexes/effects.json), [มอนสเตอร์](library/indexes/monsters.json), [ไอเทม](library/indexes/items.json)
- [คู่มือ metadata และคำสั่งนำเข้า](README.md)
- [แผนเกมฉบับปรับปรุง](../../docs/PLAN.md)

## ต้นฉบับและ provenance

- [Gravity full-client ZIP](https://rofull.gnjoy.com/Ragnarok_240610.zip), ขนาด `4,123,265,065` ไบต์, SHA-256 `53a4b470d7cc1e197edb400b6a52682942d7f35f7618aa7727d8751fa2406f0c`
- `data.grf` ขนาด `3,928,212,976` ไบต์, SHA-256 `147ce92147acd094f5a2de83870366ab0d464547e64e1c177b6b651e7a3738c4`; แยกด้วย innoextract โดยไม่ได้รัน Windows installer
- คง source manifest ใน `_source_archives/` ไว้ แต่ลบต้นฉบับ ZIP/GRF/System แล้วตามคำขอ; ตารางอ้างอิงและ URL อยู่ใน `inventory/source/`
- ตัวถอดรูปแบบ [ragx](https://github.com/joaopedrosgs/ragx) ถูกเก็บพร้อม MIT LICENSE และ upstream commit ใน `scripts/vendor/ragx/`

สกิล สูตรความแรง คูลดาวน์ และบาลานซ์สำหรับเกมใหม่ยังแยกออกจาก metadata ของภาพตามแผน
