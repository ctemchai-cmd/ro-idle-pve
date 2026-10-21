# ติดตั้ง RO Idle เป็นแอป

เปิด [เว็บเกม](https://ro-idle-pve.vercel.app/play) แล้วติดตั้งจากหน้าล็อกอินหรือเมนูตั้งค่าในเกม บัญชีและเซฟใช้ Supabase เดิม ไม่ต้องสร้างบัญชีใหม่

- Android / Chrome และ desktop ที่รองรับ: กด **ติดตั้งแอป** แล้วยืนยันในหน้าต่างเบราว์เซอร์ หากยังไม่มีหน้าต่างติดตั้งให้เปิดเมนูเบราว์เซอร์แล้วเลือกติดตั้งหรือเพิ่มหน้าจอหลัก
- iPhone / iPad: เปิดเว็บด้วย Safari → **แชร์** → **เพิ่มไปยังหน้าจอโฮม** → **เพิ่ม**

เปิดจากไอคอนจะเข้า `/play` แบบ standalone แนวตั้ง ไม่แสดงปุ่มติดตั้งซ้ำ หากยังไม่ได้เข้าสู่ระบบจะไปหน้าล็อกอินตามเดิม เกมยังต้องออนไลน์: ตอนเปิดโดยไม่มีอินเทอร์เน็ตจะแสดงหน้ารอเชื่อมต่อ ไม่เริ่มการต่อสู้หรือแก้เซฟย้อนหลัง

## ขอบเขตแคชและการอัปเดต

- `pwa/` เป็น public source ของ manifest, offline page, worker และไอคอน เอกสารนี้ไม่เปลี่ยนสูตรหรือ fingerprint ของเกม
- Worker เก็บเฉพาะ `/offline.html` และ PNG ไอคอน 4 ไฟล์ รวมไม่เกิน 128KiB ไม่เก็บ HTML เกม, JS, content, คลังภาพ, API, Auth, checkpoint หรือ callback code
- Navigation ของหน้าแอปใช้ network พร้อม `cache: no-store` เสมอ ใช้ offline page เฉพาะเมื่อ network ล้ม ไม่ปิดบัง HTTP error จาก server
- POST, Authorization header, API/Auth และต่าง origin ไม่ถูก worker ดัก Worker ไม่อ่าน/เขียน localStorage, IndexedDB หรือเซฟ ไม่ใช้ background sync/push
- เวอร์ชันใหม่รอแท็บเก่าปิดตาม lifecycle ปกติ ไม่มี `skipWaiting` หรือ reload จาก `controllerchange` จึงไม่รีโหลดกลางไฟต์ อัปเดตเกมโดยจบหรือถอยไฟต์ก่อนเปิดใหม่ตามเดิม
- `/sw.js` ใช้ `no-store`, `Service-Worker-Allowed: /` และ `updateViaCache: none`; manifest ใช้ `no-cache` ไอคอนเป็น URL คงที่เพื่อให้ติดตั้งได้
- ลงทะเบียน worker เฉพาะ production ใน secure context ไม่ติดตั้ง worker จาก Vite dev หรือ LAN HTTP ของ 6173

## สร้างและตรวจ

`npm run build` ตรวจ manifest, ขนาด PNG, งบ precache และ exact artifact allowlist ก่อนแทน worker version จาก SHA-256 ของ HTML/ไฟล์ PWA เวอร์ชันนี้แยกจาก content hash ของเกม

ไอคอนเป็น SVG ที่วาดด้วยโค้ด (`pwa/pwa/icon.svg`) และ rasterize ด้วย `node scripts/render_pwa_icons.cjs` ไม่ดึงภาพจากเว็บ ตรวจ real Chrome ด้วย `node scripts/test_pwa_browser.cjs` บน ephemeral server/profile ของตัวเอง ไม่แตะ 6173 หรือบัญชีผู้เล่น

Browser proof ครอบคลุม manifest/installability, worker/cache, offline/reconnect, API isolation, update waiting, install gesture และ mobile layout ส่วน iOS เป็น UA/layout emulation การติดตั้งจริงบนอุปกรณ์ต้องเจ้าของกดเอง

อ้างอิง: [MDN: installable PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [web.dev: service-worker lifecycle](https://web.dev/learn/pwa/service-workers), [web.dev: installation](https://web.dev/learn/pwa/installation)
