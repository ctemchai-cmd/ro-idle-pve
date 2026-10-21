# การเรียน คิว และ preview สกิลใน runtime

20 ตุลาคม 2026 · TASK-024 · อ้างอิง design15/16/17 และข้อมูล skills/*.json

`src/domain/progression/skills.ts` เป็นเจ้าของ quote/learn/upgrade/loadout/validation และการรวบรวม learned skills ให้ build ใช้ราคา transition จากแต่ละ root document ไม่คำนวณคืนจากราคาปัจจุบัน `src/client/skills.ts` สร้าง view model และคำอธิบายจาก resolved definitions UIเรียกclientโดยไม่คัดลอกสูตรเกม

## Command contracts

| Command | Input | Output/ข้อผิดพลาด |
| --- | --- | --- |
| skill.upgrade | character_id/skill_id/target_level พร้อม UUID/revision/versions | ตรวจ root/สาขาปัจจุบัน/unlock/cap/งบ; เปลี่ยนระดับ จ่ายเงินจริง และลง feature_id=skill ledger พร้อม receipt ใน CAS เดียว |
| skill.set_loadout | character_id/skill_ids tupleสี่ช่อง มี null ได้ | รับเฉพาะ Active ที่เรียนแล้ว, IDไม่ซ้ำ, exclusive groupไม่ซ้ำ; เปลี่ยนเฉพาะคิว |

Cap=`min(definition.max_level,1+floor((character.level−1)/5))` เป็นฟังก์ชันเดียวที่ quote/validation/client ใช้ ปลดสกิลไม่เท่ากับเรียนหรืออัปอัตโนมัติ Learn Lv.1 ฟรีตามตาราง แต่ยังต้องกดเรียน โดยเฉพาะ Passive ที่อาจเปลี่ยนความเร็ว ไม่เพิ่มผลนั้นเพียงเพราะตัวละครเลเวลขึ้น

ทุกคำสั่งต้องอยู่นอก active battle Business rejection ไม่หักทรัพยากร/เพิ่ม revision และมี immutable receipt UUIDเดิมไม่ซื้อหรือคืนซ้ำ Skill reset/job switch ใช้ actual-paid ledger จากprotocolเดิม คืนเฉพาะตัวและ featureที่ reset แล้วกลับสอง starter grants

Rogue copy whitelist มี exclusive_group จาก metadata ให้ใส่ได้หนึ่งท่าในกลุ่ม ไม่ใช้แค่การเทียบชื่อท่า วงจร runtime copy/effect/handler เฉพาะRogueยังตรวจครบในTASK-033

## Build และ engine

`compileCharacterSkills(character,content)` ตรวจ learned refs/cap/อาชีพแล้วคืน active_slots/resolved_skills ทุกท่าที่เรียนรวม Passive `characterBlueprint` เตรียมค่าจากmanual Status และรับ permanent sources เป็นจุดต่ออุปกรณ์

`attachLearnedPassives` ใช้ร่วมระหว่าง engine initialization กับ preview ใส่ sourceครั้งเดียวตาม definition ID จึงไม่เพิ่ม Passive ซ้ำเมื่อผู้เรียกเตรียม source มาแล้ว ไม่ให้Passiveกิน Active slot การคำนวณ stats/timing/SP และ resolved level parameters ใช้ pipelineเดียวกับ headless/runtime

การตรวจระดับนี้ใช้ Class1/Passiveที่generic engineรองรับและยังเก็บการล้มเหลวชัดเจนสำหรับ handler/summon ที่ยังไม่มี implementation ไม่อ้างว่าผลเฉพาะครบ126สกิลแล้ว เจ้าของ runtime เฉพาะสายคือTASK-029–034/041

## UI

ใน `/roster` เปิด “สกิลและคิว4ช่อง” ไอคอนใหญ่ไร้กรอบสี่เหลี่ยม เลือกช่องแล้วใส่ท่าที่เรียน ถ้าท่าอยู่ช่องอื่นให้swap มีช่องว่างได้ จัดเพียงลำดับ ไม่เพิ่มเงื่อนไขถือท่ารอHPหรือรอบร่ายบอส Passiveแยกแสดงและทำงานอัตโนมัติ

รายละเอียดแสดงเป้าหมาย CT/ACD/SP ผลหลักที่resolvedแล้วและผลต่างก่อนอัป พร้อมราคาปัจจุบัน/งบคู่มือ ถ้าเต็มcapให้ไปอัปตัวละคร ไม่เปิดAwaken รุ่นนี้ Previewเวลารวมmanual Status/learnedPassiveก่อนอุปกรณ์และtemporary battle buffsตามข้อความในหน้า; TASK-026ต่อequipment permanent sources แล้วต้องขยายpreviewด้วย

UIแสดงSIจากโปรไฟล์เดโม3sที่ผู้ใช้รับจังหวะแล้วโดยส่งbaseเข้า shared math ไม่เปลี่ยนbenchmarkabstractเก่า1.5s การเลือกtiming profileของStoryจริงต้องผูกกับfactoryในTASK-025 ไม่สุ่มoffsetเวลาเริ่มรายactor

## วิธีตรวจ

มี pure tests สำหรับcap/unlock/ทุก126price tables/refund/freelearn/สี่ช่อง/Passiveจริงในengine/previewตรงengine/exclusivegroup รวมการไม่แก้ shared definitions ชุดlocal browserตรวจlost responseตอนซื้อ/loadoutswap/Passive/off-team/reload/offline/mobile พร้อม owner SQL state แยกจากsceneเดโมและhosted deployment
