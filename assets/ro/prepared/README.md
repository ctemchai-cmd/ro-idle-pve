# ชุดเตรียมเกมและห้องทดสอบแอสเซ็ต

เตรียมเมื่อ 18 ตุลาคม 2026 เพิ่ม **6,926 asset ID** จากคลังเดิม 60,504 รวมเป็น **67,430 ID** ทุกชิ้นมี sidecar และพาธ local ชุดเสริมมีสื่อไม่ซ้ำ 3,071 ไฟล์ รวม 30,704,514 bytes (30.7 MB) ส่วน metadata เก็บแยกแต่ละ ID

| หมวด | จำนวน | รายละเอียด |
| --- | ---: | --- |
| หมวก/เครื่องประดับศีรษะ | 3,362 | SPR + ACT ที่จับคู่ได้ทั้งหมดจาก accessory สองโฟลเดอร์ใน kRO 2024-06-10 |
| โล่ | 1,069 | overlay ตามอาชีพ/เพศ พร้อม action/anchor |
| ชุดคลุม | 1,519 | variants ของ backpack 2576, fallen angel wings 2589, little devil 20502, cupid 20504, poring backpack 20507, Uriel 20509 |
| UI | 963 | basic_interface, menu_icon, ro_menu_icon และ statuswnd |
| ฉากหลัง | 6 | prt_fild08, pay_fild01, gef_dun00, moc_fild01, iz_dun01, prontera; ภาพนิ่ง 1280×720 |
| เพลง | 6 | MP3 ผูกกับแต่ละฉาก; loop เป็นคำแนะนำ ไม่ได้รับรองรอยต่อเสียง |
| ฟอนต์ | 1 | Noto Sans Thai variable WOFF2 น้ำหนัก 100–900 พร้อม OFL |

จำนวน atlas ของเครื่องแต่งกายรวม variant อาชีพและเพศ หลาย ID ใช้สื่อไบต์เดียวกัน ไม่ใช่จำนวนรูปลักษณ์ที่ต่างกันทั้งหมด ภาพใช้ WebP lossless เมื่อเล็กกว่า PNG และตรวจ RGBA ตรงกัน เก็บ PNG หากเหมาะกว่า

## เปิดตัวอย่าง

รันจากโฟลเดอร์โปรเจกต์:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

เปิด <http://127.0.0.1:8765/preview/asset-lab/> เลือกอาชีพ/เพศ ท่าทาง ซ้าย/ขวา หมวก ชุดคลุม โล่ ฉาก สกิล และเพลงได้ ตัวอย่างเป็นห้องทดสอบภาพ/UI ตัวเลขและปุ่มระบบเกมยังเป็นข้อมูลแสดงผล ไฟล์ทั้งหมดรวมฟอนต์และเพลงโหลดจากเครื่อง ใช้ต่อได้เมื่อไม่มีอินเทอร์เน็ตหลังเริ่ม local server

## หาไฟล์โดยไม่เปิดรูปซ้ำ

- [catalog.json](catalog.json): ทุกชิ้น พร้อม meta_path, source path, class/gender/item/view IDs
- [game-pack.json](game-pack.json): actor preset 38 ชุด, wardrobe 5,950 records, ฉาก เพลง ฟอนต์ มอนสเตอร์ตัวอย่าง และเสียงเหตุการณ์ 13 แบบ
- [skill-recipes.json](skill-recipes.json): สูตรภาพ 24 สกิล พร้อมไอคอน ระยะเวลา และเสียง โดยไม่ใส่ damage/cooldown/balance
- [manifest.json](manifest.json): ขอบเขตที่เลือกจาก source รวม SPR 13 ชิ้นที่ไม่จับคู่ ACT จึงไม่ลงทะเบียนเป็น animation พร้อมใช้
- [inventory/background-captures.json](inventory/background-captures.json): manifest แผนที่และตำแหน่งกล้องสำหรับภาพที่เรนเดอร์ไว้

ตาม `file.path` ของ sidecar เสมอ พาธของ collection นี้เริ่มจาก `assets/ro/prepared/`; พาธ `meta` ใน game-pack เริ่มจาก `assets/ro/` เมื่อแชร์ media ชื่อภาพอาจไม่ตรงชื่อ asset

การเลือกอุปกรณ์ดู `class_sprite` และ `gender` บางอาชีพปกติ/High class ใช้ชื่อ sprite ร่วมกัน จึงไม่ใช้ `class_id` เพียงอย่างเดียว ท่าโจมตีใน actor preset มี `attack_source_action_index` เพื่อให้ตัวกับอาวุธใช้ท่าชนิดเดียวกัน

## วิธีวาดสกิลและผลตรวจ

Storm Gust (89) ใช้ native STR ที่ dependency ครบ อีก 23 สูตรเป็น procedural animation ที่เขียนสำหรับต้นแบบ เช่น bolt, heal/buff, arrow และ burst พร้อมไอคอน/เสียง RO จึงพร้อมใช้กับเกมที่เราออกแบบเอง แต่ไม่ได้เป็นเอฟเฟกต์ดั้งเดิมครบ 24 สกิล Pierce ใช้เสียงโจมตีหอกที่คัดแทน โดยบันทึก `sound_basis` ไว้

ตัวเล่นอยู่ที่ [renderer.mjs](../../../preview/asset-lab/renderer.mjs) รองรับ ACT part atlas, head/hat anchors, อาวุธ, โล่, ชุดคลุม, flip ทั้งตัว และ STR keyframes Canvas ใช้ blend บางชนิดแบบประมาณและลำดับวาดอุปกรณ์พื้นฐาน ไม่รับรองความเหมือนไคลเอนต์ทุกเอฟเฟกต์

ผล [browser-validation.json](browser-validation.json): Chrome ทดสอบ 38 actor preset × idle/attack/hurt/dead × ซ้าย/ขวา รวม **304 samples**, วาด **24 สูตรสกิล**, โหลด **6 ฉาก**, ถอดรหัส **38 เสียง**, โหลดฟอนต์ไทยผ่าน ไม่มี runtime/HTTP error และไม่มีคำขอออกไปเว็บภายนอก ผลนี้เป็น smoke test ณ เวลาที่วาด ไม่ใช่ตรวจทุกเฟรม/ทุกเครื่องแต่งกายด้วยสายตา

ภาพที่ตรวจด้วยสายตา: [ตัวละคร/UI](../../../docs/screenshots/asset-lab.png), [อาวุธและ Storm Gust](../../../docs/screenshots/asset-lab-effect.png), [ชุดคลุม 6 ตระกูล](../../../docs/screenshots/asset-lab-garments.png) บางชิ้นถูกตัวละครบังมากในท่าหันข้าง จึงควรเลือกชิ้นที่อ่านรูปร่างชัดเมื่อล็อกรูปลักษณ์เกมจริง

## ตรวจหรือสร้างดัชนีใหม่

```sh
python3 scripts/prepare_ro_pack.py --check
python3 scripts/import_ro_assets.py --check
python3 scripts/build_ro_library.py --check
python3 -m unittest discover -s tests -v
node --test tests/renderer.test.mjs

# metadata-only: ไม่ดาวน์โหลดและไม่เปิดวิเคราะห์ภาพ
python3 scripts/build_preparation_manifest.py
```

การทดสอบ browser ใช้ playwright-core และ Chrome ที่ติดตั้งไว้ เปิด local server ก่อน แล้วรัน:

```sh
RO_PLAYWRIGHT_MODULE=/path/to/node_modules/playwright-core node scripts/test_prepared_browser.cjs
```

ตั้ง `RO_CHROME_PATH` ได้หาก Chrome อยู่พาธอื่น; `RO_PREVIEW_URL` เปลี่ยนพอร์ตของ server ได้ ไม่ต้องนำ npm dependencies ไปไว้ใน assets

`scripts/prepare_ro_pack.py --client <โฟลเดอร์ data.grf> --stage <โฟลเดอร์ captures>` นำเข้า source ใหม่ ส่วน `--check` ใช้ไฟล์ที่เก็บแล้วได้โดยไม่ต้องมี GRF สร้าง pack ปกติจาก metadata ด้วย build_preparation_manifest ข้างต้น

## แหล่งที่มาและขอบเขตพร้อมเริ่ม

- [Gravity kRO client 2024-06-10](https://rofull.gnjoy.com/Ragnarok_240610.zip): หมวก โล่ ชุดคลุม UI; URL/checksum และ SPR/ACT fingerprints อยู่ใน sidecar
- [ragassets](https://github.com/adsonpleal/ragassets) และ [latamvisuais](https://github.com/adsonpleal/latamvisuais): API แผนที่/เพลงและเครื่องมือเรนเดอร์ฉาก ภาพฉากเป็น capture จาก renderer ภายนอก ไม่ใช่ภาพพื้นหลังสำเร็จจากไคลเอนต์
- [Google Fonts Noto Sans Thai](https://github.com/google/fonts/tree/main/ofl/notosansthai): ฟอนต์ไทย เก็บ OFL ใน fonts/OFL.txt

ชุดนี้ปิดช่องว่างด้านไฟล์สำหรับต้นแบบที่ใช้เนื้อหาเหล่านี้แล้ว เริ่มวางแผน/พัฒนาได้โดยไม่ต้องรอหา assets เพิ่ม native STR 9 ชุดที่ขาด texture ไม่อยู่ในชุดเอฟเฟกต์ที่เลือก ขอบเขตเกมจริง ปาร์ตี้ สเตตัส และบาลานซ์ยังรอตกลงกัน

ต้นทาง ZIP/installer/GRF ที่โหลดกลับมาเพื่อเติมหมวดเป็นไฟล์ชั่วคราว ลบหลังตรวจแล้ว ดู [source-cleanup.json](source-cleanup.json) พื้นที่ปัจจุบันดู [storage.json](storage.json)
