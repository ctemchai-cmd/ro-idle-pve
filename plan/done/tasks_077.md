# TASK-077 — สกิล การ์ด และอุปกรณ์กำหนดบิลด์ได้ชัดขึ้น

Milestone: M4 · อ้างอิง D-103

## งานที่ต้องรอก่อนหน้า

- TASK-017, TASK-026, TASK-027, TASK-073, TASK-076 (done): effect pipeline, equipment/card sources, RO card identity และธาตุที่แสดงจริง

## เป้าหมายและขอบเขต

ผู้ใช้ขอให้สกิล การ์ด และไอเทมส่งผลต่อการต่อสู้มากขึ้น หลังเห็นดาเมจจากตีปกติครองสัดส่วน เพิ่มทางเลือกบิลด์ผ่านโบนัส skill/normal ที่ใช้ใน engine กลาง ใช้สัดส่วนพลังโจมตีร่วมกันทุกอาชีพและการ์ดตามคำชี้แจงล่าสุด ไม่เพิ่มด่านเดิมเพื่อชดเชยพลังที่สูงขึ้น คงจังหวะ SI3s, normal1.5s, CT/ACD/SP/คิว/CC/สแต็ก/ค่าใช้จ่าย/เศรษฐกิจ ไม่แก้ owner save/รีสตาร์ต6173 ไม่รัน balance simulation/calibration ใหม่

## รายละเอียดและขั้นตอน

1. เขียนงบเปรียบเทียบแบบ static และชื่อ/ขอบเขตโบนัส `skill_damage_bonus`/`normal_damage_bonus` ซึ่งบวกใน outgoing bucket เดิม มิใช่ตัวคูณแยกทุกแหล่ง
2. โบนัสสกิลครอบคลุม character active/passive/DoT/summon; card/item procs ใช้ผลของตัวเอง ไม่รับโบนัสสกิลซ้ำ ส่วน heal/CC ไม่ใช้ damage bonus. checkpointเก่าที่ไม่มีสอง stat อ่านเป็น0
3. ปรับพลังdamageด้วยสัดส่วนกลาง1.75เท่าของbaselineเดิม (assistant trial value) และให้ copied skills ของRogueตรงต้นฉบับ; utility/heal072/CC และต้นทุนเดิม
4. ทำอุปกรณ์มาตรฐาน/แบบทางเลือกให้มีจุดเด่น และการ์ด flatATK/HPมีประโยชน์ระยะยาว; การ์ดต้านธาตุ/กันCCที่มีผลมากอยู่แล้วไม่เพิ่มทั้งหมด; retain66ROidentities/art/instances/quality/level/slot/penalties
5. ตรวจ stat/bonus boundaries, per-hit engine math/source attribution/summon inheritance, optionsและpreviewจริง, migration/paid ledger/pending reward; regenerate goldens/M0และbuild
6. ทดสอบ actual isolated mobile Auth/SQL/API/UI แล้ว push/deploy +read-only production smoke; content updateใช้ existingbackup-before-migration ไม่เขียนownerแทน

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิลโจมตีทุกอาชีพรวมPassive/DoT/copy/summonและdamage procการ์ดใช้สัดส่วนพลังกลางเดียวกัน มีตารางก่อน/หลังตามCT/SP/hit/เป้า; utility/heal072/คิว/CC/stackและด่านเดิมคงไว้
- [x] AC-02: skill/normalโบนัสเลือกชนิดการโจมตีถูกและรวม additiveกับoutgoingเดิมครั้งเดียว; periodic/passive/summonรับค่าตามsnapshot; item/cardprocไม่รับ skillbonusซ้ำ; default0เก่าไม่เปลี่ยนdamage/crit/เกราะ/ธาตุ/regen และhealไม่ถูกคูณ
- [x] AC-03: gear variantและoptions/cardเลือกเสริมคนละบิลด์ได้จริงผ่านsharedsources; stat preview/คำอธิบายมีชื่อไทย/หน่วย%; retainIDs/tiers/rarity/rolls/slotprogressและ66ROcardidentity มีตัวอย่างflat+%scaledlateและcountercard/weakness
- [x] AC-04: existing migrationรักษาwallet/paidledger/inventoryIDs/rarity/levels/options/slot/cards/pendingrewards/farmcursorครบ; ไม่แก้owner,ไม่SQL/env/newassets ไม่เปลี่ยนต้นทุน/ฟาร์ม/กาชา และไม่รันbalance/calibration
- [x] AC-05: focused tests/M0/content/schema/boundaries/type/build/secretsผ่าน; actualmobile320/390 skill/gear/cardแสดงผลที่ตรงengine/ไม่มีread-onlysave และpublichostednewbundles/hash/Auth/PWAผ่าน พร้อมระบุว่าเป็นtrialbaselineไม่ใช่whole-gamebalanceproof

## วิธีตรวจและหลักฐาน

Static power/opportunity-cost tables เป็นการคำนวณ ไม่ใช่การจำลองไฟต์ Focused effect-pipeline fixturesตรวจจำนวนดาเมจที่คาดไว้จริง, actualdisposablelocalstack/browserตรวจUI/เซฟ ไม่ใช้owneraccount. หลักฐาน plan/evidence/task-077-*

## Blocker / คำถาม

คำถามoptionalเรื่องสัดส่วนกลางกับเส้นโตตามเลเวลส่งแล้ว; ให้เวลาตอบเกิน60sก่อนใช้ข้อเสนอแนะนำคือสัดส่วนกลางรักษาความต่างเดิม ผู้ใช้ไม่ได้ยืนยันตัวเลข1.75. ไม่รออนุมัติงานที่ให้ทำแล้ว

## บันทึกการทำงานและ review

- 22ต.ค.2026: เริ่มจากตรวจ3sSI/1.5snormal +skillcoefficients/gear/cardcatalogจริง; แยกสกิลต้นทุนสูงจากCC/healและcardutilityก่อนเพิ่มค่า

- ผู้ใช้ชี้แจงให้scaleสกิลทุกอาชีพ/การ์ดไปทางเดียวกันและยอมรับด่านเดิมง่ายขึ้น: จึงแทนdraftcurveรายท่าด้วยpolicyกลาง ไม่เพิ่มHP/ATKบอสเพื่อชดเชย; อุปกรณ์ทุกชนิดใช้role/tiercurveเดียวกันตามประเภทstat

- Local review: sharedcurve52skills/static106rows/126timing-cost invariants/378goldens/67focusedTS/M0/buildผ่าน และactualAuth/SQL/mobile3groups/API5ผ่าน ตรวจภาพจริงแล้ว; owner/cloud/6173ไม่แตะ ยังรอactualdeployจึงยังไม่ติ๊กdone

- Final review: source6538f4d3832f08a7397bcc3a35101a59a220fcca ขึ้นVercelSUCCESS; actualhostedAPI/newdata/login/PWA3groupsผ่าน,0mutation. [Review](../evidence/task-077-review.json) ทุกACผ่านแล้ว ไม่มีbalancebatchใหม่ การเล่นจริงยังเป็นtrialbaselineให้ผู้ใช้ลอง
