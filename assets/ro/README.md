# คลังแอสเซ็ต RO ในเครื่อง

นำเข้าครบ 60,460 รายการตามหมวดที่เลือกจากไคลเอนต์ kRO ชุด **10 มิถุนายน 2024** และมีชุดเริ่มต้นอีก 44 ภาพ ดูจำนวนและข้อจำกัดใน [รายงานนำเข้า](IMPORT_REPORT.md) ความครบอ้างถึงไคลเอนต์ชุดนี้ ไม่ครอบคลุมทุกแพตช์ของทุกเซิร์ฟเวอร์

เพิ่ม [ชุดเตรียมเกม](prepared/README.md) อีก **6,926 รายการ** รวมเป็น **67,430 asset ID** มีฉากหลัง UI หมวก โล่ ชุดคลุม เพลง และฟอนต์ไทย พร้อม [game-pack.json](prepared/game-pack.json) และตัวอย่าง Canvas ที่ `preview/asset-lab/` ใช้ไฟล์ local ทั้งหมด

อ่าน metadata ก่อนเปิดภาพ: เริ่มจาก [catalog.json](catalog.json) แล้วเลือกดัชนีหมวดใน `library/indexes/` หรือค้นสกิลจาก [skill-assets.json](library/skill-assets.json) / ชื่อไฟล์จาก [search.tsv](library/search.tsv) จากนั้นอ่าน `.meta.json` ของไฟล์ที่ต้องการ ไม่ต้องวิเคราะห์รูปทั้งคลังซ้ำ

## โครงสร้างและดัชนี

```text
assets/ro/
  catalog.json                  # ดัชนีรวมและลิงก์ไปแต่ละ collection
  starter-catalog.json          # 44 PNG/APNG ชุดเริ่มต้น
  manifest.json                 # รายการดาวน์โหลดชุดเริ่มต้น
  characters/, monsters/        # ชุดเริ่มต้น แยก idle/attack/hurt/dead
  items/, skills/               # ไอคอนชุดเริ่มต้น
  library/
    catalog.json                # 60,460 รายการจากไคลเอนต์
    inventory.json              # บัญชีไฟล์ต้นทางและ ACT ที่ไม่มี SPR คู่กัน
    indexes/<หมวด>.json         # characters/weapons/skills/effects/items/monsters
    search.tsv                  # ชื่อ หมวด skill ID/constant และพาธ metadata
    class-coverage.json         # อาชีพอ้างอิง 85/85 และพาธ body ที่พบ
    skill-coverage.json         # skill ID ที่มีภาพ เทียบรายการอ้างอิง
    skill-assets.json           # lookup ชื่อ/ID/constant ไปข้อมูลรายสกิล
    skill-assets/<skill-id>.json # ไอคอน เอฟเฟกต์ เสียง และพาธไฟล์ปัจจุบัน
    coverage.json               # จำนวนที่นำเข้าและ dependency ที่ยังขาด
    validation.json             # ผลตรวจล่าสุด พร้อม checksum ของ catalog
    <หมวด>/<ชนิด>/<ชื่อ>--<hash>.webp (หรือ .png เมื่อเล็กกว่า)
    <หมวด>/<ชนิด>/<ชื่อ>--<hash>.meta.json
    effects/sound/*.wav         # เสียงพร้อม sidecar เช่นกัน
  inventory/source/             # ตารางอาชีพ ไอเทม สกิล effect mapping และ provenance
  prepared/
    catalog.json                # ชุดเสริม 6,926 ID พร้อม sidecar ทุกชิ้น
    game-pack.json              # actor 38 preset, wardrobe, ฉาก/เพลง/ฟอนต์/เสียง
    skill-recipes.json          # 24 สูตรภาพสกิล แยกจากกติกาและบาลานซ์
    browser-validation.json     # ผลทดสอบบน Chrome และ hash ของ input
    backgrounds/, ui/, fonts/, music/, headgear/, shields/, garments/
  _source_archives/             # คงเฉพาะ JSON provenance; ลบ ZIP/GRF/System ตามคำขอแล้ว
  web-optimization.json         # ขนาดก่อน/หลังและผลตรวจแบบ lossless
  original-cleanup.json         # รายการต้นฉบับที่ลบ พร้อมขนาดและ checksum
```

พาธใน catalog/sidecar ของ `library` อ้างจาก `assets/ro/library/`, ของ `prepared` อ้างจาก `assets/ro/prepared/` ส่วนชุดเริ่มต้นอ้างจาก `assets/ro/` ดู `path_base` ทุกครั้ง ดัชนีรวมเก็บเพียง 44 รายการของชุดเริ่มต้นใน `assets[]`; จำนวนรวมรวมอีกสอง collection ด้วย ให้ใช้ `collections` และ `category_indexes` อ่านรายการที่เหลือ

ไฟล์สื่อที่เหมือนกันทุกไบต์ใช้ไฟล์ร่วมกันได้ แต่แต่ละ asset ID ยังคงมี sidecar และข้อมูล ACT/STR ของตนเอง ให้ตาม `file.path` ของ sidecar และ `meta_path` ในดัชนีเสมอ อย่าเดาพาธ metadata จากชื่อภาพที่แชร์กัน `shared_media` บันทึกพาธก่อนรวมและ ID ของไฟล์หลักไว้

Generated JSON ของ native library ใช้รูปแบบ compact เพื่อลดขนาด โดยยังมีทุก field เดิม เปิด Format Document ใน editor ได้เมื่อต้องการอ่านเป็นบรรทัด รายละเอียดพื้นที่จริงและผลลดขนาดอยู่ใน [storage-optimization.json](storage-optimization.json) ใช้ `python3 scripts/compact_ro_storage.py` เพื่อย่อ JSON และรวมสื่อที่เหมือนกัน โดยตรวจ checksum และดัชนีก่อนลบไฟล์ซ้ำ

## Metadata ของ native library — schema 2

ทุก WebP/PNG/WAV มี sidecar: ID คงที่ หมวด ชื่อ/แท็ก พาธต้นทาง ข้อมูลอาชีพหรือ skill/item ID ที่จับคู่ได้ SHA-256 ขนาดไฟล์ และสถานะนำเข้า ชื่อเกาหลีบางไฟล์คงไว้ตามต้นฉบับ; ใช้ class constant เช่น `JT_SWORDMAN` หรือ skill constant เช่น `SM_BASH` ช่วยค้นได้

ตัวละคร หัว อาวุธ และมอนสเตอร์เก็บเป็น **packed part atlas** จาก SPR พร้อมข้อมูล ACT:

- `sprite_sheet.frames` เป็น `[x,y,width,height]`; `source_frame_indices` เก็บหมายเลขเฟรมเดิม
- `animation.actions[]` เก็บ source action index, state, ระยะเวลาแต่ละเฟรม และ layers
- layer เป็น `[x,y,frame,mirror]` หรือรูปแบบยาวที่มี RGBA, scale และ angle ตาม `layer_format`
- `x,y` เป็นตำแหน่งกึ่งกลางชิ้นภาพเทียบจุดกำเนิดต้นฉบับ; `frames[].anchor` ใช้ประกอบหัว/ตัว/อาวุธ
- คัด action ทิศ east/right หมายเลข 6,14,22,…; ซ้ายใช้ `facing_variants.left.flip_x` พลิกทั้งตัวรวมอุปกรณ์ ไฟล์ที่ไม่มี directional ACT อาจไม่มี `source_facing`
- ชื่อ idle/walk/attack ฯลฯ อิงตาราง action มาตรฐาน ส่วน timing/layers อ่านจากไฟล์จริง ไม่ใช่ผลตรวจด้วยสายตาทุกชุด

atlas เหล่านี้ยังต้องใช้ตัวเล่น ACT ที่วาด layers และประกอบตัวละคร การโหลดเป็น Phaser atlas อย่างเดียวไม่ทำให้ได้แอนิเมชันประกอบครบโดยอัตโนมัติ

เอฟเฟกต์ STR มี `effect.fps`, `max_key`, `textures`, `layers[].tex` และ `layers[].keys` ให้เล่นด้วยตัวเรนเดอร์ keyframe/การ blend; sprite effect ใช้ ACT เช่นเดียวกับตัวละคร และ texture เป็นภาพแยก บางเอฟเฟกต์เดิมสร้างด้วยโค้ดของไคลเอนต์ จึงไม่มีคลิปภาพสำเร็จหนึ่งไฟล์ต่อสกิล เก็บตารางอ้างอิงไว้ใน `inventory/source/effect-table.json` และ `skill-effects.json` แล้ว

ค่าตัวเลขพิเศษใน STR เก็บเป็นสตริง `"Infinity"`, `"-Infinity"`, `"NaN"` ตาม `number_encoding` เพื่อให้ JSON ของเว็บอ่านได้และยังรักษาค่าต้นฉบับ ตัวเล่นเอฟเฟกต์ต้องจัดการค่าเหล่านี้อย่างชัดเจน

ตรวจ `status` ก่อนใช้งาน: `exported` คือแปลงไฟล์สำเร็จ; `source_dependencies_missing` คือบาง texture หาไม่พบหรือมีหลาย candidate ต่างกัน ปัจจุบันมี 9 เอฟเฟกต์ / 31 พาธที่ยังแก้ไม่ได้ ชิ้นที่ขาดใน atlas เป็นส่วนโปร่งใส ให้เลือกเอฟเฟกต์อื่นระหว่างทำต้นแบบ รายชื่ออยู่ใน [coverage.json](library/coverage.json)

`visual_review.status` แยกจากสถานะนำเข้า: native library ยังไม่ได้ตรวจด้วยตาทุกภาพ เก็บบันทึกเองใน `annotations` ซึ่ง importer รักษาไว้เมื่อสร้าง sidecar ใหม่

## Metadata ของชุดเริ่มต้น — schema 1

44 ภาพประกอบด้วยตัวละคร 5 อาชีพและมอนสเตอร์ 4 แบบ อย่างละ 4 ท่า พร้อมไอคอน 8 ภาพ เป็น WebP/PNG/APNG ที่เรนเดอร์สำเร็จแล้ว ชุดที่เป็นแอนิเมชันเล่นผ่าน `<img>` ได้

`file.frames[].canvas_rect`, `encoded_rect` และ `alpha_bounds` ใช้ `[left,top,right,bottom]` ขอบขวา/ล่างไม่รวมในกรอบ ให้ใช้ `animation.anchor` ของแต่ละไฟล์ Canvas ปกติ 256×256; Poring/Willow ท่าตายมีกรอบใหญ่กว่า ทิศหลักเป็นขวาและพลิกซ้ายได้ ภาพ APNG ยังต้องแปลงหากจะใช้เป็น Phaser Sprite

URL แหล่งที่มา พารามิเตอร์ renderer เวลาเฟรม checksum และขอบเขตการตรวจภาพเก็บใน sidecar แล้ว `animation.mapping_basis` แยกที่มาของชื่อท่าจาก `visual_review`

## ใช้งานและนำเข้าใหม่

รันจากโฟลเดอร์โปรเจกต์ ใช้ Python 3.11+ และ dependencies ใน `requirements-assets.txt`:

```sh
python3 -m pip install -r requirements-assets.txt

# ตรวจไฟล์เดิมแบบ offline ด้วย checksum/metadata โดยไม่ถอดรหัสภาพซ้ำ
python3 scripts/import_ro_assets.py --check
python3 scripts/build_ro_library.py --check
python3 scripts/prepare_ro_pack.py --check

# หลังลบต้นฉบับ คำสั่งนี้จะตรวจคลังปัจจุบันและสร้างดัชนีโดยไม่ดาวน์โหลด
python3 scripts/build_ro_library.py

# สร้างดัชนีหมวด/รายงาน class ใหม่จาก metadata เพียงอย่างเดียว
python3 scripts/index_ro_library.py

# โหลดเฉพาะชุดเริ่มต้นที่ขาด และสร้าง catalog รวมใหม่
python3 scripts/import_ro_assets.py

# ค้นสกิลโดยไม่เปิดภาพ
python3 scripts/build_ro_skill_index.py --find "Storm Gust"

# ตรวจตัว importer
python3 -m unittest discover -s tests -v
```

การนำเข้าซ้ำเทียบ source fingerprints และ checksum ของไฟล์ในเครื่อง รายการที่ไม่เปลี่ยนใช้ sidecar เดิมโดยไม่ถอดรหัสรูปหรือดาวน์โหลดใหม่ สำหรับชุดเริ่มต้นใช้ `--dry-run`, `--only skills.bash` และ `--refresh` ได้ เพิ่มรายการใน `manifest.json` ส่วน native importer รับ `--client <โฟลเดอร์ที่มี data.grf>` และ `--jobs 4`

ต้นฉบับ ZIP/GRF/System ถูกลบหลังตรวจคลังที่บีบอัดแล้วตามคำขอของผู้ใช้ คง source URL, checksum และตารางอ้างอิงไว้ใน JSON การตรวจ/ค้น/เล่นแอสเซ็ตที่เก็บไว้ไม่ต้องใช้ต้นฉบับ การดึงทิศอื่นหรือแอสเซ็ตนอกหมวดที่ส่งออกไว้ต้องนำเข้าไคลเอนต์ใหม่อย่างชัดเจน ตัว parser อยู่พร้อม MIT LICENSE ใน `scripts/vendor/ragx` และล็อก commit ใน `UPSTREAM.json`

## การบีบอัดสำหรับเว็บ

ใช้ `python3 scripts/optimize_ro_web.py --delete-originals` เพื่อเลือกไฟล์เล็กกว่าระหว่างต้นฉบับ PNG/APNG กับ WebP lossless ตรวจ RGBA ของทุก composited frame, dimensions, ระยะเวลา และ loop ก่อนเลือก WebP ไม่ย่อขนาด ไม่ลดสี ไม่เปลี่ยนเสียง เก็บเพียงรูปแบบที่เลือกต่อภาพ เมื่อพิกเซลหรือ timing ไม่ตรงจะเก็บ PNG/APNG เดิมไว้

พาธใน `.meta.json`, catalog, indexes และ skill lookup เป็นพาธของไฟล์ที่ใช้งานจริง ห้ามเดานามสกุล `.png` เอง รายละเอียดก่อน/หลังอยู่ใน [web-optimization.json](web-optimization.json) และไฟล์ต้นฉบับที่ลบอยู่ใน [original-cleanup.json](original-cleanup.json)

## ค้นเอฟเฟกต์จากชื่อสกิล

ค้นจาก `skill-assets.json.lookup` หรือใช้คำสั่ง `--find` แล้วเปิด `skill-assets/<ID>.json` ตัวอย่าง [Storm Gust — ID 89](library/skill-assets/89.json) ผูก `WZ_STORMGUST` กับไอคอน, effect ID 89, atlas จาก `stormgust.str`, keyframe metadata และ `wizard_stormgust.wav` รวมข้อมูล hit effect แยกไว้ด้วย รองรับชื่อ `Storm Gust`, `StormGust`, `Stromgust` และ ID `89`

ดู `resolution` และ `asset.status` ทุกครั้ง ชื่อที่เหมือนกันหลายไฟล์จะระบุ `ambiguous`; ไม่มีไฟล์จะระบุ `missing`; เอฟเฟกต์ที่สร้างด้วยโค้ดจะระบุ renderer เป็น `procedural_or_client_code` ตารางนี้เป็นความสัมพันธ์จากข้อมูลต้นทาง ไม่ใช่การเดาจากหน้าตารูป และยังต้องมีตัวเล่น ACT/STR ในเกม

ค่าสเตตัส สูตรสกิล damage/cooldown และบาลานซ์ของเกมใหม่ต้องอยู่ในข้อมูลเกมแยกต่างหาก

แหล่งข้อมูล: [Gravity kRO client ZIP](https://rofull.gnjoy.com/Ragnarok_240610.zip), [ragx](https://github.com/joaopedrosgs/ragx), [ragassets](https://github.com/adsonpleal/ragassets), [Divine Pride](https://www.divine-pride.net/), [roBrowserLegacy skill constants](https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Skills/SkillConst.js)
