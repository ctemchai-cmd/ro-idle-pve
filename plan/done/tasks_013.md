# TASK-013 — กำหนดสถาปัตยกรรม runtime, cloud save และ simulation

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [เซฟและ deploy](../design/07-cloud-save-and-deployment.md), [Simulation และบาลานซ์](../design/08-simulation-and-balance.md), [ข้อสรุป](../decisions.md), [workflow](../workflow.md)

สัญญาที่ต้องปิด: [architecture audit](../architecture-audit.md)

## งานที่ต้องรอก่อนหน้า

- TASK-001 — กำหนดขอบเขต Lv.1–70 และเส้นทางพัฒนาตัวละคร
- TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation
- TASK-009 — ออกแบบอุปกรณ์ Refine Enchant และชุดการ์ด
- TASK-010 — ออกแบบเศรษฐกิจ ดรอป กาชา และเป้าหมายเวลาสะสม
- TASK-011 — ออกแบบด่าน บอส Tower และดันรายวันให้ครบรุ่นแรก
- TASK-012 — ออกแบบหน้าจอและ flow ที่เล่นครบวงจร
- TASK-047 — ออกแบบแค็ตตาล็อกสถานะและโมดูลร่วมของสกิล/ไอเทม

ใช้ผลส่งมอบที่ผ่าน review ของงานข้างต้นตามรายละเอียดงานนี้ อ้างด้วย ID และค้นไฟล์จากโฟลเดอร์สถานะปัจจุบัน

## เป้าหมายและผลส่งมอบ

- ปรับ `plan/design/07-cloud-save-and-deployment.md` และ `08-simulation-and-balance.md`
- `plan/design/11-technical-architecture.md`, module/import graph, state authority matrix, command/receipt contracts, compatibility/interruption matrix และ migration plan
- closure table ของ A-01–A-08 ใน `plan/architecture-audit.md` พร้อมผู้รับผิดชอบผลพิสูจน์หลังมี implementation
- `plan/data/quality-budgets.json`: อุปกรณ์/browser/เครือข่ายและเกณฑ์ตัวเลขสำหรับโหลด/ภาพ/หน่วยความจำ/runner

## ขอบเขต

- รวม: ผลลัพธ์ที่ระบุในชื่อและรายละเอียดงานนี้ตามข้อมูลรุ่นแรกที่ review แล้ว
- อยู่นอกงาน: การเขียนระบบเกม สร้างบริการ remote หรือ deploy; งานนี้ส่งมอบสเปก/ข้อมูลและหลักฐาน review

## รายละเอียด

เลือก stack/tooling สำหรับ TypeScript/Vite และ UI ตามความเหมาะสม แบ่ง pure domain/combat/progression, renderer, persistence adapters และ headless runner ใช้ Auth อีเมล/รหัสผ่าน เซฟหนึ่งช่อง/บัญชีพร้อม ownership/revision/idempotency และทิศทาง runtime pack บน Vercel

## ขั้นตอนทำงาน

1. ใช้ schemas/operations จาก TASK-047 และฐาน paths/contracts ใน design/14 กำหนด module boundary, formula/handler registry, clock/RNG/events/metrics และคำสั่ง build/test/simulate รวม contract Hi-class/Awaken/Artifact โดยไม่เพิ่ม implementation ของแพตช์นั้น
2. ออกแบบ save transaction/checkpoint/reconnect/AFK cursor/ผู้เขียนหนึ่งราย และ private-account provisioning
3. ระบุ dev/preview/production migrations/secrets/recovery และ quality budgets เป็นตัวเลข: initial/total bytes, เวลาพร้อมเล่น, frame time, memory หลังสลับฉากตามจำนวนรอบ และ throughput ของ runner พร้อม scenario/อุปกรณ์/เครือข่ายอ้างอิง
4. ลง execution contract ของฐาน Vercel TypeScript account commands (รวม AFK/upgrade/gacha) กับ Supabase atomic commit จาก design/14 ให้สูตร domain มีเจ้าของเดียว เขียนตัวอย่าง command/receipt, pending/committed/acknowledged, retry/IDเดิมแต่ payload ต่าง, randomness reservation และอายุ receipt; หาก review พบต้องแก้ฐาน ให้บันทึกเหตุผลก่อน implementation
5. แยก durable account/transient battle state, content/rules/schema versions และ investment/refund ledger พร้อม interruption/migration policy จาก TASK-001/010/011
6. กำหนดลำดับ derive build/variant และ actor/party constraints รองรับ Awaken/Artifact/Plant/Pet โดยไม่เพิ่มระบบอนาคตในรุ่นแรก รวมวิธีทดสอบ adapter บนเครื่องก่อนรอ public Preview

## เกณฑ์ตรวจรับ

- [x] AC-01: สเปก module/import และ public interfaces แยก engine/สูตรพัฒนาจาก DOM/network/เวลาเครื่อง กำหนด shared rules ของ game/simulation และตัวอย่าง input-output โดยผลทดสอบ import จริงเป็นหน้าที่ TASK-015/018
- [x] AC-02: schema เก็บ NPC นอกทีม/slot/เงิน/claims/version ครบ พร้อม expected_revision และ retry request เดิม
- [x] AC-03: reconnect มีวิธีเลือกระหว่าง checkpoint กับ cloud โดยไม่ merge เงิน/ของและไม่รับช่วง AFK ซ้ำ
- [x] AC-04: ระบุ RLS/บัญชีส่วนตัว/กู้รหัสผ่าน/test isolation/migration/rollback/Vercel pack โดยไม่มี credentials และมี quality budgets เป็นตัวเลขพร้อมเงื่อนไขวัดที่ TASK-018/042 ใช้ตัดสินผ่านได้

- [x] AC-05: มี authority matrix และ command/receipt protocol ที่เลือกระบุ source of truth ชุดเดียวต่อ wallet/inventory/progression; ID เดิม/payload ต่าง, response หาย, revision ชน และ cursor มีผลที่คาดหวังชัดเจน
- [x] AC-06: เลือกรูปแบบคำนวณ AFK/upgrade/gacha และ persist ที่ไม่คัดลอกสูตรบาลานซ์ TS/SQL คนละชุด พร้อม schema/content/rules compatibility, ID migration และ refund ledger/policy เมื่อราคาเปลี่ยน
- [x] AC-07: interruption matrix ทุกโหมดกำหนด durable/transient state, resume หรือ restart, attempt/reward/HP/clock/RNG/event ที่เกี่ยวข้อง และ reward-rate snapshot เมื่อ balance patch ระหว่าง AFK
- [x] AC-08: module/import graph และ public contracts มีตัวอย่าง build variant/actor เพิ่ม/ย้าย slot ที่ไม่แก้ shared definitions ไม่ผูกจำนวน battle actors กับ NPC3 และระบุ checks/fixtures/API test route ที่ทำได้ก่อน public Preview

## วิธีตรวจและหลักฐาน

review sequence diagram/ตัวอย่าง payload สำหรับ save success, response หาย, สองแท็บ, ขาดเน็ต, migration และเส้นทาง headless simulation โดยไม่ใช้ cloud; ตรวจสัญญา/คำนวณตัวอย่างในงานนี้ ผลรันจริงตรวจในงาน implementation ที่ระบุ

บันทึกคำสั่ง/ขั้นตอนที่ใช้จริง รุ่นข้อมูล/seed เมื่อเกี่ยวข้อง และไฟล์ผลหรือภาพที่ระบุขอบเขตที่ตรวจ ห้ามเปลี่ยน “ยังไม่ตรวจ” เป็นผ่านโดยไม่มีผลจริง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/architecture.py`; module DAG16modules, publicinterfaces/5new schemasและ34typedcommands, Battle/Simschemafixtures/restore12fieldpaths | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-02 | `python3 plan/checks/architecture.py`; initialAccount7characters/42starteritems/8resources พร้อมownership/copy/slotcapacity/negativewallet invalidcases | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-03 | `python3 plan/checks/architecture.py`; reservationcursorกับpendingpaidแยก, receipt-firstreconnect/CAS และonlineclock4boundaries | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-04 | `python3 plan/checks/architecture.py`; RLS/Auth/localMailpit/testDB/env/backup/migration/dependency-pack contracts และ17numericbudgets; worst500items+136investmentsต่ำกว่า512KiB | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-05 | `python3 plan/checks/architecture.py`; sameID/hash, changedpayload, lostresponse, stale revision protocoloraclesและsingleauthorities | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-06 | `python3 plan/checks/architecture.py`; TSshareddecide/SQLatomiccommit, sixcompatibilitypolicies, refund100แทน150และcoalesced250คืนครั้งเดียว | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-07 | `python3 plan/checks/architecture.py`; Story/Tower/daily/farm interruptionmatrix, lease15000inclusive/maxcredit5000, frozenAFKrate/oldticketday/seed-checkpoint contracts | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |
| AC-08 | `python3 plan/checks/architecture.py`; actor/root-owner/periodicPlantกับimmutablevariants, matchedseed/equalspentbudgets, localhostAPI4routesและเจ้าของruntimechecks | [report](../evidence/task-013-review.json):25 checks + manualcontractreview; [baseline11](../design/11-technical-architecture.md), [A-01–A-08 closure](../architecture-audit.md) | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 2

## Blocker / คำถาม

ไม่มีคำถามหลักค้างจากผู้ใช้ ณ วันสร้างแผน ต้องรอ dependency ด้านบนก่อนเริ่ม หากสเปกต้นทางเปลี่ยน ให้บันทึกผลกระทบ/แก้ task ก่อนทำต่อ ไม่สมมติคำตอบหรือข้ามเกณฑ์

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: สร้างงานใน todo; ยังไม่ได้ลงมือและยังไม่มีผล review
- 19 ตุลาคม 2026: เพิ่มเกณฑ์จาก architecture audit; งานยังอยู่ todo และยังไม่มีผลตรวจ runtime
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation

- 19 ตุลาคม 2026: ส่งmodule/save/command/checkpoint/simulation contracts, fixturesและqualitybudgets ตรวจ25checksและอ่านclosureA-01–A-08ครบ8AC; ระหว่างออกแบบเติมstatblueprint/resolvedskills/lockedtargets/regen timers/periodicPlant/sourceepoch และแยกpendingreservationจากpaymentเพื่อไม่ให้restoreหรือretryเปลี่ยนผล ยังไม่มีSQL/API/runnerหรือperformanceผลจริง

- รอบตรวจรวมTASK-014พบfractional-time gap: whole-secondfloorกับcursorระดับmillisecondsทำให้claimถี่เสียเศษ จึงเปิดTASK-013กลับinprogressและเก็บreview-round1ที่ไม่ผ่านก่อนแก้เป็นms/divisor3600000 พร้อมเคส500msและrate-switch

- reviewรอบ2: ยืนยันmsquantization/carry,500msและrate-switchcasesผ่านพร้อมregression25checksของarchitecture และ12checksเศรษฐกิจ; เก็บfindingรอบแรกไว้ ไม่เปลี่ยนเกณฑ์เพื่อให้ผ่าน

- 20ตุลาคม2026 runtime amendment: clientเพิ่มpure progressionสำหรับquote/sandboxตามdesign11 ไม่เปิดUI→domainหรือserver ตรวจarchitecture oraclesใหม่และเก็บ [รายงานก่อนแก้](../evidence/task-013-review-before-runtime-boundary.json) รอบ3metadataบันทึกวันที่/ขอบเขตจริง ไม่อ้างว่าตรวจhosted/performanceเพิ่ม
