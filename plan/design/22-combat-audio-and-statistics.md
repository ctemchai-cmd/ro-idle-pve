# เสียงและสถิติรายตัว — 20 ตุลาคม 2026

ผู้ใช้ขอ Sound/Theme BGM และปุ่มดู DPS/Healing/Tank ของแต่ละตัว โดยรักษา UI แนวตั้งที่ยอมรับแล้ว เพิ่มแผงสถิติผ่านปุ่มในสนามและหน้าจบไฟต์ ไม่วางตารางทั้งหมดบนหน้าหลัก

## ตัวเลขและแหล่งข้อมูล

`src/domain/combat/statistics.ts` เป็น pure projection จาก checkpoint ใช้ได้ทั้ง runtime และ headless ไม่มี DOM, audio, persistence, wall clock หรือ RNG ไม่รวมตัวเลขจาก animation และไม่ขึ้นกับ actor ที่เลือกโฟกัส

- Damage คือ `metrics.actors[id].hp_damage` ที่ลด HP ได้จริง ไม่รวม overkill หรือโล่ที่ยังไม่ลด HP; DPS = Damage / `game_time_ms` เป็นวินาที เมื่อเวลา0ให้0
- Healing คือ `effective_heal` ที่คืน HP ได้จริงของผู้ให้ฮีล; HPS ใช้เวลาไฟต์เช่นเดียวกับ DPS Overheal ไม่เพิ่มผลงานและ regen พื้นฐานที่ไม่ใช่ heal effect ไม่ถูกสมมติว่าเป็นสกิลของผู้ฮีล
- Tank คือ `damage_received + shield_damage_received` ของผู้รับ: HP ที่เสียจริงหลังการป้องกัน + โล่ที่รับดาเมจให้ตัวนั้น ไม่ใช่ค่า raw attack หรือความเสียหายที่เกิน HP คงเหลือ
- `EffectPipeline.payDamage` บันทึก incoming ลง metrics ของผู้รับและทีม ณ จุดจ่ายดาเมจจริงหลัง shield/redirect ดังนั้นรับโอนดาเมจ/reflect/DoT ใช้เส้นทางเดียวกัน ผู้สร้างโล่ยังได้ `shield_absorbed` ตาม source เดิม แยกจาก Tank ของคนที่ได้รับการป้องกัน
- ทดสอบอิสระ: โจมตี100ใส่ตัวเหลือHP20มีโล่30 → Tank50 (HP20+โล่30), ผู้สร้างโล่ได้support30, overkill50 ไม่นับTank ฮีล10ใส่ตัวขาด4 → Healing4
- Counter ใหม่เป็น optional ใน schema เพื่อให้ fixtures M0 เดิมตรวจได้ แต่ engine ใหม่สร้างเป็น0และสะสมต่อใน checkpoint ตั้งแต่เริ่มไฟต์ เซฟที่ไม่เคยบันทึก counter ไม่สามารถกู้ยอดรับดาเมจเก่าจาก HP ปัจจุบันได้ การข้าม content/rules version ยังต้องใช้ migration ตาม TASK-040 ไม่ backfill จากการเดาหรือรวมไฟต์เก่า

UI แยกแท็บ DPS/Healing/Tank เรียงผลงานมากไปน้อย แสดงยอดรวม อัตราต่อวินาที/รายละเอียดHP-โล่ และสัดส่วนในทีม ดูฝ่ายเรา/ศัตรูได้ ใช้เวลาของไฟต์ทั้งช่วง ไม่หารด้วย wall time หรือเวลาเฉพาะที่ตัวละครยังมีชีวิต กดpause/จบไฟต์แล้วหยุดเปลี่ยน เปิด/ปิดแผงไม่รีเซ็ตข้อมูล เริ่มไฟต์ใหม่จึงเริ่ม0

## Audio adapter

`BattleAudio` ใน renderer เป็นเจ้าของ HTMLAudio BGM, WebAudio context/bus/voices/cache ออกแบบแยกจาก combat engine:

- กด “♪ เปิดเสียง” ครั้งแรกเพื่อปลดล็อกเสียงผ่าน user gesture ไม่ฝืน browser autoplay policy หลังรีโหลดต้องเปิดเสียงใหม่
- BGM ใช้ `scene.music_meta` จาก encounter/theme เดิม ทุกไฟล์มาจาก selected local pack เพลงวนตาม metadata recommendation; ไม่อ้างว่ารอยต่อ MP3 ผ่าน subjective listening แล้ว
- เปลี่ยนฉากที่ใช้เพลงใหม่หยุดเพลงเก่าก่อนเล่นเพลงใหม่ เริ่มไฟต์ซ้ำด้วยเพลงเดิมใช้ media element เดิมและไม่ตั้ง currentTimeกลับ0
- ปรับระดับ BGM และเอฟเฟกต์แยกกัน ค่าเริ่มเพลง12%/SFX20% (tunable presentation defaults) เก็บเฉพาะระดับเสียงใน localStorage key version1 ไม่เก็บ master-unlock และไม่แตะ game save
- ตีปกติใช้เสียงชนิดอาวุธ/เวท, มอนสเตอร์ใช้ hit cue แทนสมมติว่าใช้ดาบ สกิลใช้ audio refs ของ recipe, terminalใช้ victory/defeat และเปิดเมนูใช้ui_confirm เสียงไม่เปลี่ยนเวลา hit/damage/SP/queue
- SFX decode/cache ตาม media URL ใช้ gain bus กลาง ปรับระดับแล้วมีผลกับ voices ที่กำลังเล่น จำกัด24เสียงพร้อมกันเพื่อคุม burst; ไม่ใช่เพดานจำนวน gameplay actions
- mute/ซ่อนแท็บ/dispose หยุดเพลงและ active effects ยกเลิกเสียงที่ decodeค้างด้วย generation tokens; กลับแท็บแล้วเล่นเพลงเดิมต่อ ปุ่ม pauseไฟต์ยังให้BGMเล่นได้
- แยก generation ของการเปิดเสียงกับ visibility เพื่อไม่ให้สลับแท็บระหว่างปลดล็อกครั้งแรกทำเพลงหาย การโหลดเสียงล้มเหลวไม่ทำให้ combat/progression เปลี่ยนหรือเริ่มไฟต์ใหม่ไม่สำเร็จ UI มีสถานะเสียงให้ลองเปิดใหม่

ไฟล์ระดับเสียงอยู่ renderer adapter ส่วน `src/contracts/audio.ts` เก็บ DTO/defaults ที่ presentation ใช้ ไม่เปิด import renderer จาก client/domain ให้ข้าม module boundaries

## การตรวจและข้อจำกัด

Unit tests ตรวจ shield-provider/recipient/overkill/overheal, counterกับdamage events, midfight restoreโดยไม่ต้องมีeventhistory, virtual-time parity/reset และ audio-loop/same-track/scene switch/livegain/mute/visibility/pendingdecode/cache/voicecap/failure/retry/storage

Browser ต้องตรวจตัวเลขจริงเทียบ shared checkpoint ทุกหมวดทั้ง4คน ตรวจสลับโฟกัส/ศัตรู/terminal/restart พร้อม BGM play/time/loop, สัญญาณบนSFXbus, ระดับเสียงแยกและการเก็บsettings เป็น Chrome viewport emulation ไม่ใช่การฟังคุณภาพผ่านลำโพงจริงหรือรับรอง mobile Safari การต่อเพลงเมนู/ฟาร์ม/dungeonเต็มวงจรและ class-specific soundที่ยังไม่มีruntime scene อยู่ใน TASK-039/042 ตามเนื้อหาที่ทำจริง

## ธีมร่วมสมัยที่ยืนยันเพิ่มเติม

ผู้ใช้เลือก03 แล้วระบุให้ใช้ขาว/เทา/ขอบฟ้าแบบ RO Basic Skin จาก screenshot ที่แนบ และย้ำว่า modern อยู่ที่style/UX ไม่ใช่เปลี่ยนสี แถบหัวไล่เฉด/กรอบนูนไม่ได้เป็นข้อยืนยันของผู้ใช้ จึงใช้พาเลตดังกล่าวกับ flat components/ตัวเลขsans/modern SVG icons/segmented controls/mobile sheets ปรับขนาดตัวอักษรให้อ่านง่ายและคงเลย์เอาต์ที่ยอมรับแล้ว

`modern-theme.css` เป็นเจ้าของธีม/appearance ส่วน `adventure.css` วางgeometry/layout ค่าเริ่มหน้าเกมคือ `data-theme=ro` สีฟ้าบนขอบบาง/selectedstate มีหน้าเปรียบเทียบในเครื่องที่Light/Dark/RO Blueใช้โครงและengineเดียวกัน ยังไม่อ้างว่าการตรวจcontrastของsecondarytextสามตัวอย่างคือaccessibility auditครบทุกองค์ประกอบ/ทุกอุปกรณ์

## เสียงเริ่มร่าย (รอบ10)

เพิ่มaudio_events.cast_startจากnative `ef_beginspell` ที่มีอยู่ในlibrary ผ่านmanifest generator/pack selection ไม่ดาวน์โหลดใหม่ Engineส่ง `cast_duration_ms` ที่resolveแล้วในcast_start rendererเล่นเฉพาะduration>0ผ่านchannel `cast:<actor_id>` แยกจากเสียงผลสกิลตอนcast_resolve หยุดchannelเมื่อจบ/ถูกขัด/ตาย/terminal ไม่เขียนสูตรcastspeedในrenderer

BattleAudio.soundรับchanneloptionalและstopSoundยกเลิกทั้งvoiceที่เล่นและdecodeที่ค้าง การหยุดของคนหนึ่งไม่ตัดคนอื่น mute/hidden/disposeยังล้างเสียงทั้งหมดตามเดิม เป็นcueone-shotไม่วน ไม่จำเป็นต้องยืดไฟล์1.096sตามความยาวCT และไม่เล่นเสียงเริ่มร่ายสำหรับinstant skill ผลตรวจwaveform/actualUI/buffer cancellationอยู่ [round10](../evidence/task-020-timeline-cast-review.json) ยังไม่ได้รับรองเสียงด้วยการฟังผ่านลำโพงจริง
