# ro-idle-pve

ต้นแบบเกม Idle RPG เล่นคนเดียวผ่านเว็บ จัดทีม สู้บอส ฟาร์ม อัปตัวละคร/สกิล และพัฒนาอุปกรณ์พร้อมเซฟในเครื่องได้แล้ว

เกมใช้ Supabase เก็บเซฟ ล็อกอินอีเมล/รหัสผ่าน ออนไลน์เป็นหลักพร้อมเซฟสำรองในเครื่อง และเตรียม configuration สำหรับ Vercel รุ่นแรกถึง Class 2 สูงสุด Lv.70; Hi-class/Awaken/Artifact เป็น milestone ถัดไป ส่วน Class 3 ที่ Lv.120 เป็นอนาคต ดูสถานะจริงตาม [กระดานงาน](plan/overview.md) ปัจจุบันผ่าน46/57งาน บาลานซ์ยังอยู่ระหว่างตรวจ และ UI ล่าสุดรอผู้ใช้รับภาพ

[เปิดเกมส่วนตัวพร้อมเซฟในเครื่อง](docs/LOCAL-PLAY.md): `npm run dev:local` แล้วเข้า http://127.0.0.1:6173/auth ใช้บัญชีจากไฟล์ส่วนตัวที่ระบุในเอกสาร เลือกตัวหลัก จัดทีม สู้บอส รับรางวัล ฟาร์ม อัปตัวละครและสกิลได้แล้ว เซฟอยู่ใน `.local/play/pg` และคงอยู่เมื่อรีสตาร์ตบริการ ไม่มี hosted Supabase หรือ Vercel deployment

สนามทดลองภาพยังเปิดด้วย `npm run dev` ตาม [วิธีเล่นเดโม](docs/BATTLE-DEMO.md) แยกจากเซฟจริง ตรวจ runtime/Auth/PostgREST/SQL/SMTP/Chrome บนบริการแยกในเครื่องแล้ว ดูหลักฐานแต่ละงานในกระดาน Runtime pack ล่าสุดมี656assets/1197files รวม manifest ประมาณ27.2MB ไม่โหลดคลังทั้งหมดเข้าเว็บ

ติดตั้งจาก checkout ใหม่ด้วย Node24 และ Python3.11+:

```sh
npm ci
npm run build
npm run dev
```

Repository เก็บ source code, แผน, SQL migrations, tests และคลัง assets ทั้งชุด พร้อม `runtime/ro/` ที่คัดสำหรับเว็บแล้ว จึง build ได้โดยไม่ดาวน์โหลด assets ใหม่ เมื่อเปลี่ยนภาพให้รัน `npm run assets:build` และ commit runtime pack ที่อัปเดตด้วย ไม่เก็บ `.local/`, credentials, `.env.local`, `node_modules/` หรือ build output ใน Git

ดู [วิธีต่อ Vercel และ Supabase](docs/DEPLOYMENT.md) สำหรับ environment, migrations และ Auth settings ที่ต้องใส่ในบริการจริง การเตรียม repo/config ยังไม่ใช่หลักฐานว่า hosted deployment ผ่านแล้ว

คลังหลัก kRO 10 มิถุนายน 2024 จำนวน 60,460 รายการ + starter 44 + ชุดเสริม 6,926 รวม **67,430 asset ID** พร้อม metadata ครอบคลุมอาชีพอ้างอิง 85/85 แบบ เน้นหันขวาและพลิกซ้าย เติมฉาก UI หมวก โล่ ชุดคลุม เพลง และฟอนต์ไทยแล้ว

- [แผนเกมและความคืบหน้าปัจจุบัน](plan/overview.md)
- [วิธีติดตั้งและรันโครงเกมบนเครื่อง](docs/DEVELOPING.md) — Node24, `npm ci`, `npm run dev`, `npm run dev:api`
- [ตั้งค่า Vercel และ Supabase จาก GitHub](docs/DEPLOYMENT.md)
- [ข้อสรุปและเรื่องที่กำลังคุย](plan/decisions.md)
- [แผนเซฟ Supabase และ deploy บน Vercel](plan/design/07-cloud-save-and-deployment.md)
- [ช่องทาง simulation เพื่อวัดอาชีพ สกิล และบาลานซ์](plan/design/08-simulation-and-balance.md)
- [โมดูลสกิล สถานะ และไอเทม](plan/design/12-effects-and-composition.md)
- [ข้อเสนอสมการดาเมจ คริ และเกราะ](plan/design/13-damage-crit-and-defense.md)
- [สิ่งที่เตรียมเพิ่มและผลทดสอบบนเว็บ](assets/ro/prepared/README.md)
- [ความพร้อมก่อนเริ่มพัฒนา](docs/PREPARATION_CHECKLIST.md)
- [ห้องทดสอบภาพ](preview/asset-lab/index.html) — เปิดผ่าน local HTTP server
- [ผลดาวน์โหลด จำนวนไฟล์ และข้อจำกัดที่พบ](assets/ro/IMPORT_REPORT.md)
- [ผลบีบอัดสำหรับเว็บและการลบต้นฉบับ](assets/ro/WEB_OPTIMIZATION_REPORT.md)
- [ผลรวมไฟล์ซ้ำของคลังหลัก](assets/ro/STORAGE_OPTIMIZATION_REPORT.md)
- [พื้นที่หลังเพิ่มชุดเตรียมเกม](assets/ro/prepared/storage.json)
- [ค้นสกิลแล้วดูไฟล์เอฟเฟกต์/เสียง](assets/ro/library/skill-assets.json)
- [คลังภาพและวิธีใช้ metadata](assets/ro/README.md)
- [ดัชนีแอสเซ็ต](assets/ro/catalog.json)
- [ค้นชื่อ/ID โดยไม่เปิดภาพ](assets/ro/library/search.tsv)

ตรวจไฟล์ที่เก็บไว้โดยไม่ใช้อินเทอร์เน็ต:

```sh
python3 scripts/import_ro_assets.py --check
python3 scripts/build_ro_library.py --check
python3 scripts/prepare_ro_pack.py --check
```

เปิดตัวอย่างด้วย `python3 -m http.server 8765 --bind 127.0.0.1` แล้วเข้า <http://127.0.0.1:8765/preview/asset-lab/> ใช้ไฟล์ local ทั้งหมด ทดสอบตัวละคร/อุปกรณ์ 38 preset, ฉาก 6 แบบ และสูตรภาพสกิล 24 สกิลได้

หลังเพิ่มชุดเสริม assets มีข้อมูลประมาณ 991 MB (พื้นที่จัดสรรประมาณ 1.29 GB บนเครื่องนี้) ลบต้นทางชั่วคราวที่โหลดเพื่อเติมหมวดรวม 12.42 GB แล้ว เก็บ checksum และรายการลบใน [source-cleanup.json](assets/ro/prepared/source-cleanup.json)

เอฟเฟกต์ 9 ชุดมี texture ที่ขาดหรืออ้างอิงกำกวมจากต้นทาง รายละเอียดอยู่ในรายงาน ส่วนความแรงสกิลและบาลานซ์จะออกแบบแยกจากข้อมูลภาพ
