# TASK-047 — ออกแบบแค็ตตาล็อกสถานะและโมดูลร่วมของสกิล/ไอเทม

Milestone: M0 · ประเภท: ออกแบบ/ตรวจสเปก · รุ่น: Class 2 / Lv.70

อ้างอิง: [โมดูลและสถานะ](../design/12-effects-and-composition.md), [สมการ](../design/13-damage-crit-and-defense.md), [combat](../design/02-combat-and-skills.md), [อุปกรณ์](../design/04-progression-and-equipment.md), [simulation](../design/08-simulation-and-balance.md), [workflow](../workflow.md)

ฐานการต่อยอด: [extension contracts](../design/14-extension-contracts.md) และ [ตัวอย่างประกอบ](../examples/composition-contract.json) เป็น input การออกแบบ ไม่ใช่ผลรับงานนี้ครบแล้ว

## งานที่ต้องรอก่อนหน้า

- TASK-002 — ออกแบบสูตรต่อสู้ ไทม์ไลน์ และสัญญาสำหรับ simulation

ใช้ผลส่งมอบที่ผ่าน review ของ TASK-002 เป็นฐานเรื่องเวลา หน่วย ลำดับคำนวณและเหตุการณ์ ไม่เปลี่ยนกติกาคิว/หัก SP/สตั้นที่ยืนยันแล้ว

## เป้าหมายและผลส่งมอบ

- catalog ใน `plan/data/stat-definitions.json`, `status-effects.json`, `effect-primitives.json`
- schemas ของ Skill/Item/Status/Modifier/Trigger/Predicate และ typed params ใน `plan/data/schemas/`
- `plan/data/composition-cases.json`: เคสที่ประกอบโมดูลแล้วคำนวณ/ตรวจด้วยมือได้
- ปรับ design/12 ให้ระบุกติกาที่เลือกจริง แยกตัวอย่าง/ส่วนอนาคตจาก schema ที่ใช้รุ่นแรก

สัญญารุ่นแรก: [composition baseline](../design/16-composition-baseline.md); เพิ่ม `formula-registry.json` และ `plan/checks/composition.py` สำหรับ typed params และการตรวจ M0 ที่คำนวณซ้ำได้

## ขอบเขต

- รวม: การประกอบสกิล/ไอเทม/Passive/การ์ด สถานะและการซ้อน โค้ดสูตรพิเศษที่อ้างด้วย ID และ contract รองรับ Awaken/Artifact
- อยู่นอกงาน: implementation engine/renderer/editor, ค่าทุกสกิลรายอาชีพ และการพัฒนาระบบ Hi-class/Awaken/Artifact จริง

## รายละเอียด

กำหนดหน่วยย่อยที่ใช้ร่วมกันก่อนเขียนข้อมูลสกิลทุกสาย แยก effects ที่เกิดทันที, status ที่มีอายุ, stat modifiers, triggers, selectors และ predicates ใช้ effects ที่เรียงลำดับ มี source/effect IDs เพื่อ simulation และ named formula/handler สำหรับท่าพิเศษ โดยไม่เก็บ function text ในข้อมูล

Q-017/D-037 ยืนยันบัฟบวกกันไม่มีเพดาน และ Q-022/D-038 ให้คนเดิมร่ายซ้ำเพิ่ม independent instance อายุแยก เก็บ status/application ID ไม่ทับด้วย caster/status เดียว ผู้ใช้ยืนยัน Chain CC ปกติและเสนอ Passive สะสม CC Resistance เฉพาะบอสบางตัว ต้องกำหนด resistance/stack/expiry/on-applied โดยไม่เปลี่ยนเป็น global diminishing returns

## ขั้นตอนทำงาน

1. รวบรวม primitive ที่สกิลอาชีพตามบรีฟใช้จริง แยก stat/resource/status/actor ให้ถูก และกำหนด ID/หน่วยกลาง
2. สรุป stacking, refresh/replace, cleanse/dispel, snapshot/tick/หมดอายุ, Silence/Freeze และ optional boss resistance ตามคำตอบ/ข้อเสนอที่ตกลง
3. ออกแบบ schemas/ordered typed effects/target bindings/phase/typed params และ outcomes ต่อ target/hit พร้อม validation ของ ID/ชนิด/หน่วย/refs/outcome scope และลำดับ modifier
4. กำหนด named formula/handler registry, event context/clock/RNG, ขอบเขตการคืนคำสั่งและการกัน proc วน โดยไม่เพิ่ม cooldown รายสกิล
5. ประกอบตัวอย่างโจมตี+CC, ฮีล+บัฟ, DoT/โล่, item/passive proc, conditional bonus และสูตรพิเศษ; ระบุ input/expected result ต่อเคส
6. ตรวจ contract ของ Awaken/Artifact ที่แยก definition/build/instance โดย patch ด้วย skill/effect ID, ลำดับ stage/priority และกฎ conflict ไม่อ้าง array indexหรือแก้ shared base แล้วส่งให้ TASK-003–009/013 ใช้

## เกณฑ์ตรวจรับ

- [x] AC-01: Skill/Item/Status/Modifier/Trigger/Predicate มี schema/ชนิด/หน่วย/ID อ้างอิงชัดเจน ประกอบผลหลายฝ่าย/หลายขั้นได้; outcomes ต่อ target/hit ทำให้ A hit/B miss ไม่เอาผล A ไปสตัน B; unknown refs/params/outcome scope ถูกตรวจพบ
- [x] AC-02: status มี polarity/tags/source/duration/tick/stack/expiry/cleanse/dispel/on-death ครบ; บัฟรวมไม่มี cap ตาม D-037, reapply คนเดิมเพิ่ม instance แยกอายุ/ID ตาม D-038 ไม่ทับ/refresh/เลือก strongest แทนข้อยืนยัน
- [x] AC-03: ไอเทม/Passive/การ์ด/status เข้าสูตรกลางตาม bucket/ลำดับเดียวกัน ผลรวมบัฟไม่มี hard/soft cap; ถอด/หมดอายุคำนวณกลับจาก source ไม่สะสม stat ผิดหรือคูณซ้ำ
- [x] AC-04: มีเคสตรวจมือครบผลผสม/เป้าหมาย/when/DoT/โล่/บัฟซ้ำ/Chain CC และ optional boss resistance โดยคงการปล่อยตามคิว/หัก SP/cast-start เดิม
- [x] AC-05: formula/handler อ้างด้วย ID มี typed context/params ใช้ clock/RNG/effect pipeline ร่วมกับ simulation ไม่มี function text/eval/แก้ HP ข้าม pipeline และกัน proc วนได้ตาม contract
- [x] AC-06: ตัวอย่าง skill variant เปลี่ยน params/เพิ่ม effect ด้วย stable ID และลำดับ stage/priority โดยไม่แก้ตัวละครอื่นหรือ A/B baseline; patch ชน/อ้าง effect หายต้องมีผล error ชัดเจน ไม่ต้องสร้าง implementation Awaken/Artifact เพื่อผ่านงานนี้

## วิธีตรวจและหลักฐาน

review schema/case catalog กับ TASK-002 และคำนวณผลก่อนหลังทีละขั้น ใช้ JSON ที่ serialize ได้จริงแต่ยังไม่บังคับ engine ทำงาน การตรวจ runtime/seed/metrics เกิดใน TASK-017/018 และงานอาชีพภายหลัง

| เกณฑ์ | วิธีทดลอง/คำสั่ง | ผลจริง/ไฟล์หลักฐาน | ผ่านหรือไม่ |
| --- | --- | --- | --- |
| AC-01 | `python3 plan/checks/composition.py --write-report`; Draft202012 + semantic validation ของทุก fixture/ทุก skill level/20 status templates | [report](../evidence/task-047-review.json): 92 checks ผ่านรวม; 32 negative cases ปฏิเสธถูก code; AoE สตันเฉพาะ A | ผ่านแบบ M0 |
| AC-02 | `buff_same_source_independent`, tick/cleanse/death/resistance expiry และอ่าน baseline16 | ATK 156→288→252→216→120 ตามเวลาจริงของแต่ละชั้น; ไม่มี stack/magnitude cap; status templates bind params ได้ครบ | ผ่านแบบ M0 |
| AC-03 | `remove_source_recompute` + ตรวจ unit/bucket negative cases | รวมก่อนถอน221 หลังถอน item/buff source ที่เลือก154; base/source อื่นไม่เปลี่ยน | ผ่านแบบ M0 |
| AC-04 | Bash interrupt, healing/buff, DoT/shield, conditional และ chain/adaptive cases | Bash SP38; enemy SP45 ไม่คืน; next skill3500ms; DoT1000/2000 ไม่มี expiry tick; CC chance1/.9/.8 เมื่อใช้ optional trait | ผ่านแบบ M0 |
| AC-05 | ตรวจ interfaces/registry/phase barrier ใน baseline16 พร้อม SP/proc/reflection context cases | pre-cost SP80 ให้ raw440 แม้หลังเริ่ม SP0; ancestry loop reject แต่ sibling/ต่าง instance ผ่าน; unknown params/event contexts ไม่ผ่าน | ผ่านแบบ M0 |
| AC-06 | `variant_isolation_and_append`, `patch_missing_anchor`, `patch_set_conflict` | base/actor2=2.0, Awaken2.4, Artifact2.6; variant3 effects/base2; missing/conflict คืน error ที่กำหนด | ผ่านแบบ M0 |

ผู้ตรวจ: Codex self-review · วันที่: 19 ตุลาคม 2026 · รอบ review: 2

หลักฐานรอบแรกที่ไม่ผ่าน: [review round1](../evidence/task-047-review-round1.json) พบ schema params เปิดกว้าง/ขาด actor-catalog context/reflection และ coverage บาง primitive แล้วคืน inprogress ก่อนแก้และตรวจรอบ2 การตรวจนี้ยังไม่มี scheduler/handler implementation หรือ simulation ของเกมจริง ซึ่งเป็นงาน TASK-015/017/018

## Blocker / คำถาม

ไม่มี blocker ในขอบเขตงานนี้ TASK-002 ผ่านก่อนเริ่มแล้ว ตัวเลข optional boss trait เป็น assistant baseline +0.10/6000ms ไม่ใช่พฤติกรรม reference ที่ตรวจยืนยัน เนื้อหาสกิล/actor production และค่าบาลานซ์รายด่านเป็นงานถัดไป; สถาปัตยกรรม/เซฟทั้งชุดยังต้อง TASK-013/014

## บันทึกการทำงานและ review

- 18 ตุลาคม 2026: เพิ่มงาน M0 จากการคุยโมดูลสกิล/สถานะ/ไอเทม ยังอยู่ todo ไม่เริ่ม implementation
- 19 ตุลาคม 2026: ปรับแบบการต่อยอดตาม D-036 และคำตอบ Q-019–Q-021; เกณฑ์ยังไม่ตรวจ งานอยู่ todo ไม่เริ่ม implementation
- 19 ตุลาคม 2026: ปรับตาม D-037 ให้บัฟหลายผู้ร่ายบวกกันไม่มีเพดาน; เพิ่มเคส/วิธีตรวจโดยยังไม่เริ่มงานหรือผ่านเกณฑ์
- 19 ตุลาคม 2026: Q-022/D-038 ยืนยันคนเดิมร่ายซ้ำเพิ่ม independent instance แยกอายุ; ไม่มีคำถามชุด Q-001–Q-022 ค้าง งานยังอยู่ todo
- 19 ตุลาคม 2026: เริ่มหลัง TASK-002 done; ส่ง 11 schemas/36 stats/20 statuses/10 primitives/6 formulas พร้อม baseline16 และ fixtures; reviewรอบแรกคืน inprogressตาม findings, แก้แล้วตรวจ92เคสผ่านรอบ2 ครบ6AC จึงย้าย done โดยยังไม่เริ่ม implementation เกม
