# เดโมฉากต่อสู้

เปิดจากโฟลเดอร์โปรเจกต์ด้วย `npm run dev` แล้วเข้า `/demo` ปกติ [http://localhost:5173/demo](http://localhost:5173/demo) ถ้ายังไม่มี dependency/pack ดู [DEVELOPING.md](DEVELOPING.md) เดโมไม่ต้องมี API หรือบัญชี Supabase หน้า `/` เข้าเกม `/play` และพาไป login เมื่อยังไม่มี session

หน้าหลักเป็นมือถือแนวตั้ง มีสนาม แถบสมาชิก4คน และคิวสกิล4ช่อง เลือกตัวโฟกัสเพื่อดูดาเมจที่ตัวนั้นทำ ตัวเลขยังลอยเหนือเป้าที่โดน แตะสกิลเพื่ออ่าน SP/เวลาร่าย/พักหลังร่าย กด “จัดคิว” แล้วแตะสองช่องเพื่อสลับและเริ่มไฟต์ใหม่ ปุ่มหยุดกับความเร็ว1/2/4× อยู่ในสนาม

ตัวประชิดเดินเข้าระยะก่อนตีปกติ เลือกศัตรูใกล้สุด และ Provoke บังคับเป้าได้ **สกิลใช้ได้ทุกระยะ** ระหว่างร่าย/สตั้นหยุดเดิน หน้า/หลังเป็นจุดเริ่มต้น ตัวละครขนาดเล็กลงและใช้ ACT เดินพร้อมหัว/อาวุธตามจังหวะเดียวกัน ศัตรูบอสมีหนึ่งตัว ส่วนทุ่งพรอนเทรามีสามมอนสเตอร์

- **ทีม:** ดู HP/SP ตัวเลขเต็ม เลือกโฟกัส และดูดาเมจทีม/ฮีลที่ได้ผล
- **Timeline:** แถวแยกทุก actor บนแกนวินาทีเดียวกัน เลขใต้สกิลคือเวลาเริ่มจากต้นไฟต์ แถบฟ้าคือร่าย แถบทองคือพักหลังร่าย เส้นประคือคาดการณ์ เลือกช่วง10/20/40วินาที เลื่อนแนวนอนได้ มีปุ่มหยุดเวลาในแผง
- **ตั้งค่า:** เลือกฉาก4แบบ (ทุ่งหญ้า/บอส/บอสขัดร่ายไม่ได้/Wizard Storm Gust), Seed, เริ่มใหม่, เสียง, animation, FPS, พักวาด และ log แผงปิดด้วย × หรือ Escape และใช้คีย์บอร์ดได้

เลขปกติใช้ native RO Classic bitmap digits คริใช้พื้นหลัง native และเลขสีทอง ฮีลใช้เลขชุดเดียวกันสีเขียวพร้อม + และเอฟเฟกต์บนผู้รับ ไม่แสดง +0 มีลูกศร/ลูกพลังจากต้นทางถึงเป้าจริง เวลา impact ของภาพไม่เปลี่ยนเวลาคำนวณดาเมจ

เป็นสนามทดลองที่ให้ตัวละคร/สกิลไว้แล้ว ยังไม่มีการบันทึกความก้าวหน้าจากไฟต์ รางวัล ฟาร์ม หรือ deployment ระบบ Auth แยกที่ `/auth` ไม่ได้ทำให้ combat sandbox เซฟแล้ว และยังไม่ถือว่าพิสูจน์บาลานซ์ progression/encounter ครบรุ่น

## โครงสร้างและจุดต่อ

- `src/domain/combat/spatial.ts`: การเดิน เป้าใกล้สุด ระยะตี และ separation บน virtual clock เดียวกับต่อสู้ ไม่พึ่ง DOM/wall clock/global RNG
- `src/client/demo.ts`: สร้าง scenario/profile จาก definitions และเรียก shared engine แปลง checkpoint เป็น view
- `src/client/battle-timeline.ts`: จำลองสำเนา checkpoint ไม่แตะ state/RNG/history สด อ่าน ACD จาก checkpoint จริง และคืนเวลาให้ browser ระหว่างช่วงจำลอง
- `src/contracts/presentation.ts`: events/view/scene รวม arena/spatial และพิกัดต้นทาง/เป้าในเหตุการณ์
- `src/renderer/battle.ts`: camera fit/interpolation/ตัวเลข/projectile/effects ตามข้อมูล ไม่มี damage/targeting/การเดินอีกชุด
- `src/renderer/native.mjs`: ACT/STR player เดียวกับ asset lab อ่าน body/head/weapon ร่วม clock พลิกครบ rig ใช้ attack index ของ preset ไม่มี clipcastที่ยืนยันได้ จึงใช้ standby+วงเวท+cast bar
- `src/renderer/combat-visuals.json`: กำหนด `special_sfx` ของ projectile แยกจากข้อมูล damage; `pack.ts` โหลด metadata/media/font/audio จาก manifest ในเครื่องเท่านั้น
- `src/ui/battle-app.tsx` / `adventure.css`: portrait shell/แผงทีม-Timeline-ตั้งค่า ปิดวาดหรือเปิดเมนูไม่เปลี่ยนกติกา engine

สัญญาล่าสุด: [ตำแหน่งและมือถือ](../plan/design/21-spatial-combat-and-mobile.md), [ตัวเลข/projectile/จังหวะ3s](../plan/design/20-combat-presentation.md) เดโม SI ฐาน3s / normalฐาน1.5s ลดตามASPDและบันทึกในcheckpoint ไม่มี cooldown แยกรายสกิล ไม่มี stat/speedโตตามอาชีพ

## ตรวจซ้ำ

```sh
npm run check
npm run build
node --test tests/renderer.test.mjs
# เปิด dev server ไว้ก่อน:
RO_PREVIEW_URL=http://127.0.0.1:5173 node scripts/test_mobile_spatial.cjs
```

Browser QA ใช้ Chrome/Playwright ในเครื่อง กำหนด `RO_CHROME_PATH` / `RO_PLAYWRIGHT_MODULE` ได้ ผลรอบ6: [review](../plan/evidence/task-020-mobile-spatial-review.json), [browser และ input hashes](../plan/evidence/task-020-mobile-spatial-browser.json)

ภาพที่ตรวจเฉพาะฉาก:

- [หน้าหลัก390×844](screenshots/mobile-spatial-battle.png)
- [ทีม](screenshots/mobile-spatial-team.png)
- [Timeline](screenshots/mobile-spatial-timeline.png)
- [ตั้งค่า](screenshots/mobile-spatial-settings.png)
- [บอสขัดร่ายไม่ได้](screenshots/mobile-spatial-warded.png)
- [ฮีลในไฟต์](screenshots/mobile-spatial-heal.png) และ [เลขขาว/คริ/ฮีล](screenshots/mobile-spatial-numbers.png)

ตรวจด้วย Chrome viewport emulation360×640/390×844/430×932/desktop ไม่ใช่มือถือจริงหรือ Safari สนามเป็นพื้นที่เปิดไม่มี navmesh การทดสอบ36presetsทุกเฟรมเดิน/พลิกทั้งrigเป็น automated pixel/metadata checks ไม่ใช่ manual review ทุกชุดแต่งกาย/แอนิเมชันทั้งหมด ต้องวัดบาลานซ์ใหม่กับระยะในTASK-041 และทดสอบเครื่องจริง/performanceในTASK-042

ประวัติที่เก็บแยกตาม input hash: [รอบ3](../plan/evidence/task-020-review.json), [แก้หัว/Timelineรอบ4](../plan/evidence/task-020-animation-timeline-review.json), [ตัวเลข/projectileรอบ5](../plan/evidence/task-020-combat-polish-review.json) รายงานเดิมไม่ใช่หลักฐานของระบบเดิน/UIปัจจุบัน Runtime pack251IDsเหมือนรอบ5 ไม่เพิ่มหรือดาวน์โหลดคลังต้นทางใหม่

## ย่อ Timeline และลูกเวทย์ตีปกติ (รอบ7)

ชื่อ Timeline ใช้คอลัมน์68px แสดงชื่อสั้น เช่น “คุณ”, “เรน” กับอาชีพแยกบรรทัด ชื่อเต็มเก็บใน title/accessible label คอลัมน์และเส้นตอนนี้ใช้ geometry ร่วมกัน ทำให้มีพื้นที่ดูช่วงเวลาเพิ่มบนมือถือ/desktop

การตีปกติของ Mage/Wizard/Sage มีลูกเวทย์สีฟ้าวิ่งจากผู้โจมตีไปเป้าจริง กำหนดใน `combat-visuals.json` แยกจากเอฟเฟกต์สกิล ใช้ event ตีปกติและ pipeline projectile เดิม ไม่มีการเปลี่ยนสูตร/เวลา/คิวสกิล

ตรวจเฉพาะรอบนี้: `node scripts/test_timeline_caster_polish.cjs` หลังเปิด dev server ผล [รอบ7](../plan/evidence/task-020-timeline-caster-review.json), [ชื่อย่อ](screenshots/timeline-compact-labels.png), [ลูกเวทย์ตีปกติ](screenshots/mage-normal-projectile.png) รายงานรอบ6และภาพระบบเดินเก็บเป็นประวัติ ไม่เขียนทับ

## เสียง สถิติ และธีม RO Blue

กดปุ่มเปิดเสียงครั้งแรกที่มุมบน เพลง BGM จะเล่นตามฉาก ปรับเพลงกับเอฟเฟกต์แยกกันในตั้งค่า ระดับเสียงจำไว้ในเครื่อง เริ่มไฟต์ซ้ำเพลงเดิมเล่นต่อได้ เปลี่ยนฉากใช้เพลงของฉากใหม่ และซ่อนแท็บแล้วเสียงหยุด

กดปุ่ม **สถิติ** ในสนามหรือหลังจบไฟต์เพื่อดูทุกตัวในทีม: DPS+ดาเมจรวม, Healing+HPS และ Tank แยกHPที่เสีย/โล่ที่รับดาเมจ มีฝ่ายเรา/ศัตรูและสัดส่วนผลงาน ใช้ counterจากcheckpointและเวลาของไฟต์ สูตรอัตราใช้ร่วมกับheadless runner ไม่ขึ้นกับโฟกัสหรือความเร็ว4×

ธีมหลัก RO Blue ใช้สีขาว/เทา/ขอบฟ้าตามภาพอ้างอิง RO Basic Skin ที่ผู้ใช้ให้ แต่ฟอนต์ ไอคอน ปุ่ม แท็บ และmobile sheetsเป็นแบบร่วมสมัย ไม่มีแถบหัวหน้าต่างไล่เฉดหรือกรอบนูนแบบClassic ใช้ `modern-theme.css` กำหนด appearance/tokens ทับโครง geometryใน`adventure.css`

หน้า [เปรียบเทียบธีมในเครื่อง](http://localhost:5173/preview/ui-themes/) มีLight/Dark/RO Blueและปุ่มเปิดเต็มจอ ค่าเริ่มต้นหน้าเกมเป็นRO Blueตามคำเลือก03 ภาพเปรียบเทียบ0sคือไฟต์ที่pauseไว้สำหรับดูธีม ไม่ใช่ผลทดสอบbalance

รายละเอียดตัวเลข/เสียง: [design22](../plan/design/22-combat-audio-and-statistics.md) ผลตรวจ: [รอบ8](../plan/evidence/task-020-audio-statistics-review.json) และ [theme browser](../plan/evidence/task-020-modern-themes-browser.json)

## ไอคอนสกิลและ Timeline (รอบ9)

คิวสกิลใช้ไอคอน56pxบนพื้นโปร่ง ตัวแบ่งสั้นระหว่างช่อง และขีดใต้สกิลถัดไป แตะดูรายละเอียด/จัดคิวได้เหมือนเดิม แถบเวลารออยู่เหนือเมนูเสมอ Timelineแยกactorด้วยพื้นที่ว่างแทนเส้นแนวนอน

ผลตรวจ [รอบ9](../plan/evidence/task-020-icon-dock-review.json), [หน้าหลัก390px](screenshots/skill-icons-390.png), [หน้าหลัก360px](screenshots/skill-icons-360.png), [Timeline](screenshots/timeline-clean-390.png) ตรวจbrowser3กรณีและbuildผ่าน หลักฐาน179tests/native/audioของรอบ8เก็บเป็นประวัติ ไม่อ้างว่ารันใหม่ในรอบCSSนี้

## Timeline แบบเส้นสกิลและเสียงร่าย (รอบ10)

Timelineแสดงicon+เวลา เส้นแนวนอนผ่านแถวสกิล และgridแนวตั้งประจาง ชื่อสกิลดูจากtooltip/รายละเอียดเมื่อแตะได้ จังหวะสกิลแรกของตัวอย่างทั้ง4ต่างกันตามASPDจริงในengine บิลด์เดโมลงแต้มเองตัวละ45แต้ม ไม่เพิ่มstatตามอาชีพอัตโนมัติ

กดเปิดเสียงเพื่อฟังnative `ef_beginspell` ตอนเริ่มร่าย cueใช้เฉพาะCT>0และหยุดเมื่อจบ/ถูกขัด/ตาย ระดับเอฟเฟกต์ใช้sliderเดิม Packปัจจุบัน252IDs/505files รวม22,499,924bytes เพิ่มเสียงจากไฟล์ที่มีอยู่แล้ว

ผลตรวจ [round10](../plan/evidence/task-020-timeline-cast-review.json), [browser](../plan/evidence/task-020-timeline-cast-browser.json), [Timeline390px](screenshots/timeline-rails-390.png) รันใหม่ด้วย `node scripts/test_timeline_casting.cjs` หลังเปิดdevserver:182TS+4native+29Python/3browserchecks/buildผ่าน ภาพและผลรอบเก่าเก็บตามinputhashเป็นประวัติ

รอบ11: แถบโฟกัสเป็นportraitบนแสงนุ่ม และตัวเลขดาเมจอิงcontactframeACT/เวลาลูกกระสุนถึงเป้า ท่าบาดเจ็บ/ตายและเสียงimpactเลื่อนตามภาพ โดยHP/HUD/ผลengineยังเป็นcanonical ผู้ใช้รับgameplayเป็นฐานแล้ว ผล184TS+4native/2browsercases/buildใน [review](../plan/evidence/task-020-focus-impact-review.json)

## ทีมและสกิล

เปิด `/roster` จากเมนูทีม/ตั้งค่าเพื่อจัดทีม เลือกอัปตัวหลักหรือเพื่อนนอกทีม ลงStatus และเปิด “สกิลและคิว4ช่อง” เพื่อเรียน/อัป/จัดลำดับ/ดูCT-ACD-SP ไม่มีconfigเป็นmemory sandboxด้วยงบเริ่มต้น เมื่อมีAuthconfigใช้เซฟบัญชีจริงผ่านcommand/CAS เดโม `/demo` เป็นสนามทดลองแยกจากทีมเซฟที่ `/play` [หลักฐานตัวละคร](../plan/evidence/task-023-review.json) / [หลักฐานสกิล](../plan/evidence/task-024-review.json)
