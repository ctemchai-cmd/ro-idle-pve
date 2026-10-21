# TASK-021 — ตั้ง Supabase Auth ฐานข้อมูลเซฟและสิทธิ์เจ้าของ

Milestone: M2 · ประเภท: พัฒนา/ตรวจรับรุ่นแรก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

## งานที่ต้องรอก่อนหน้า

- TASK-015 — สร้างโครงโปรเจกต์และโหลดข้อมูลเกมที่ตรวจ schema ได้

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- migrations/owner policies และ environment setup instructions
- login/logout/password recovery สำหรับบัญชีส่วนตัว

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การพัฒนาระบบ Hi-class/Awaken/Artifact, Class 3/Pet/Rune, dashboard หรือ AI ค้นบิลด์อัตโนมัติ; ส่วนอนาคตบันทึกจุดต่อไว้ตาม design

## รายละเอียด

ทำตาม schema/API ใน TASK-013 ใช้อีเมล/รหัสผ่าน เตรียมบัญชีส่วนตัวโดยไม่เพิ่ม public registration ที่ไม่จำเป็น แยก dev/preview จากข้อมูลจริง และไม่เก็บ secret ใน frontend/repo

## ขั้นตอนทำงาน

1. สร้าง migrations/RLS/RPC ownership และ config template ที่ไม่มีค่า secret
2. เชื่อม Auth และเส้นทางเตรียมบัญชี/กู้รหัส/session expiry
3. ตรวจสิทธิ์ด้วยข้อมูลทดสอบของเจ้าของ/ผู้ใช้อื่น/ไม่มี session

## เกณฑ์ตรวจรับ

- [x] AC-01: อีเมล/รหัสผ่านเข้าออกบัญชีได้และหมด session แล้วแอปแสดงทางกลับเข้าอย่างถูกต้อง
- [x] AC-02: เจ้าของอ่าน/เขียนเซฟตนได้ ผู้ใช้อื่น/ไม่มี session เข้าถึงข้อมูลนั้นไม่ได้ รวม RPC
- [x] AC-03: apply migrations กับฐานทดสอบใหม่ได้ และ preview/test ไม่แก้เซฟ production
- [x] AC-04: ไม่มี privileged secret ใน bundle/ไฟล์ tracked และมีขั้นตอนเตรียมบัญชีส่วนตัวกับ auth redirect ตาม env

## วิธีตรวจและหลักฐาน

ทดสอบ Auth/RLS จริงบน environment ทดสอบด้วยสอง test identities และ unauthenticated requests พร้อมบันทึกผลที่ไม่เปิดเผย credentials

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | Chrome จริง + upstream Auth/SMTP, fixture401/expiry และ unit races | [live browser](../evidence/task-021-live-browser.json), [fixture](../evidence/task-021-browser.json),167testsผ่าน | ผ่านบนlocal test environment |
| AC-02 | สอง JWT identities/anon + REST/RPC/HTTP account.create/concurrent retries | [real Auth/RLS/write](../evidence/task-021-supabase-local.json), [SQL](../evidence/task-021-postgres.json) | ผ่าน |
| AC-03 | สองฐานใหม่; migrations001/002; env/ref/marker guard | [local stack](../evidence/task-021-local-stack.json), [SQL](../evidence/task-021-postgres.json) | ผ่านระดับtest environment; hostedรอTASK-043 |
| AC-04 | build/env guard+59text source/bundle scan+callbackจริง+setup docs | [build](../evidence/task-021-build-final.txt), [production smoke](../evidence/task-021-production.json), [setup](../../docs/SUPABASE.md) | ผ่าน;ไม่มีGitจึงตรวจsourceแทนtracked index |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 1

## Blocker / คำถาม

ผู้ใช้ยืนยันยังไม่มี hosted test project; ใช้ upstream Auth/PostgREST + SMTP sink แยกในเครื่องเป็นenvironmentตรวจจริง ไม่ปิดกั้นงานเซฟถัดไป การตั้งโปรเจกต์/redirect/เมลของ hosted environmentยังเป็นTASK-043/045 ไม่มีremote infrastructureถูกสร้าง

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review


- 19 ตุลาคม 2026: เริ่มหลังเดโมTASK-020ผ่าน เตรียมAuth/migrations/RLS;ตรวจเครื่องพบpsqlแต่ไม่มีdocker/SupabaseCLIหรือ.env.local จึงยังไม่มีenvironmentทดสอบAuth/RLSจริง ไม่ถือว่าACใดผ่าน
- 19 ตุลาคม 2026: ผู้ใช้แจ้งว่ายังไม่มี hosted test project จึงจัด upstream Auth/PostgREST/PostgreSQL + SMTP sink บน loopback แยกชั่วคราวแทน ผ่าน API/JWT/RLS และ browser PKCE recovery จริงแล้ว ไม่อ้าง hosted/production proof
- ขอบเขตย่อยเพื่อพิสูจน์ AC-02: ทำ `account.create` ที่ผูก verified UID และเขียน initial save/receipt/history จากข้อมูลฝั่ง server แบบ atomic โดยไม่รับ raw snapshot/owner จาก client; เป็นฐานการเขียนของ TASK-021 ส่วน recurring mutations/CAS/checkpoint/reconnect/AFK ยังเป็น TASK-022 ตามเดิม ไม่เริ่ม task ถัดไปก่อนผ่านเกณฑ์
- ตรวจ schema พบว่า `AccountState` ไม่มี `account_id` เพราะเจ้าของอยู่ที่ column จึงลบ constraint ที่บังคับข้อมูล owner ซ้ำใน JSON ก่อนพัฒนา write adapter ป้องกันการขัดกับ closed schema

- Reviewรอบ1ผ่านครบ4AC: [รายงาน](../evidence/task-021-review.json) +167tests, SQLจริง, HTTP owner-write, real Auth/SMTP/PKCE และ Chrome static build ไม่อ้างว่าเกมเซฟระหว่างเล่นหรือhosted deployครบแล้ว
