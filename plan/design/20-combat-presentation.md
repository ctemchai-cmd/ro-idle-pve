# การปรับภาพและจังหวะต่อสู้ — 20 ตุลาคม 2026

ผู้ใช้ขอ Timeline/animation ลื่นขึ้น ตัวเลขและพื้นหลังคริสไตล์ RO ตัวเลขเฉพาะดาเมจที่ตัวโฟกัสทำ projectile ที่เห็นคนยิงกับเป้า บอสปกติตัวเดียว และช่องว่างสกิลมากขึ้น ตอบยืนยันให้ทดลองฐาน SI 3 วินาที; เป็นค่าทดลองก่อนวัดบาลานซ์ ไม่ใช่สูตรที่ถอดจากเกม reference

## เวลาและ Timeline

- engine เป็นผู้ตัดสินเหตุการณ์ เวลา รางวัล และ RNG เหมือนเดิม แยก presentation clock ที่เดินทุก RAF จาก HUD ที่อัปเดต100ms
- Geometry ของ Timeline คงที่ตาม replay; เลื่อนทั้งแถวด้วย CSS compositor transform ทุกเฟรม ไม่คำนวณตำแหน่งสกิลทั้งหมดผ่าน React ทุก100ms เส้นตอนนี้ใช้ clock เดียวกับสนาม
- Rows memoize และสร้างใหม่เมื่อ projection/window/selection/death เปลี่ยน ปิดช่องที่เลื่อนพ้นช่วงจากลำดับ Tab; pause หยุดนาฬิกาภาพด้วย ไม่มี CSS animation ที่วิ่งต่อเองหลัง pause
- Actor ใช้ frame clock/anchors ร่วมทั้งตัว หัว และอาวุธ คง native sprite pose cadence เพิ่มการเคลื่อน rig ทั้งชุดอย่างต่อเนื่องสำหรับ swing/hit/standby ไม่อ้างว่ามี artwork60เฟรมต่อวินาที

## จังหวะทดลองที่ replay ได้

`BattleInput.timing` และ optional `BattleCheckpoint.timing` มี `skill_interval_base_ms` และ `normal_attack_base_ms` เป็น integer1–60000ms ทั้งคู่ เก็บใน checkpoint เพื่อ resume/headless/forecast ใช้ค่าเดียวกัน ห้ามเก็บค่าจังหวะที่มีผล combat ไว้เฉพาะ UI

เดโมใช้ `{skill_interval_base_ms:3000, normal_attack_base_ms:1500}` สูตร shared `max(1,ceil(base_ms*100/max(1,ASPD)))` ตัวอย่าง ASPD125 จะรอสกิล2400ms และตีปกติ1200ms ยังมี CT/ACD/SP/CC ตามเดิม ไม่มี cooldown แยกและไม่ชะลอ wall clock เพื่อหลอกจังหวะ

Checkpoint ที่ไม่มี field นี้ยังตีความด้วย baseline1500/1500ms เดิม; content/schema/implementation hash เปลี่ยนตามสัญญา A/B อาชีพต้องใช้ timing profile เดียวกัน บันทึก profile ใน inputs ไม่เปลี่ยนค่าระหว่าง snapshot ลับ ๆ Cloud migration/reconnect/version compatibility จริงยังเป็น TASK-022/040 ไม่ได้พิสูจน์ด้วยเดโมนี้

ตาราง combat-rules/encounter M0 เดิมคงเป็น benchmark เก่า ไม่แก้ golden เพื่อปกปิดผลที่เปลี่ยน ต้องวัดค่าทดลอง3sกับ pace/ดาเมจ/SP ใหม่ก่อนใช้เป็น release balance ใน TASK-025/041

## ตัวเลขและ focus

ใช้ native `숫자.spr` สำหรับตัวเลข0–9 และ `msg.spr` source frame3 เป็นพื้นหลังคริ ตัวแปลงแพ็กเก็บภาพที่ไม่ว่าง ทำให้ source frame3 อยู่ packed frame2 ต้องอิง metadata แทนการเดา index

ตรวจ mapping ประกอบ local atlas และ [roBrowserLegacy Damage.js](https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/Damage.js) ซึ่งเป็น implementation reference ไม่ใช่หลักฐานสมการ Ragnarok Idle Adventure Plus ตัวเลขปกติขาว คริเหลืองบนพื้นหลังแดง เก็บ whole-string bitmap cache มีขอบเขต256รายการ

แสดง damage event เฉพาะ `event.actor_id === focusedActorId` เลขลอยที่ `target_id` ที่โดน สลับ focus ไม่เปลี่ยน targets/HP/metrics/RNG ฝั่ง gameplay และไม่กรอง events ก่อนเข้า engine สามารถแสดง healing/status/interrupt เพื่ออ่านไฟต์ได้ตามเดิม

## special_sfx และ projectile

ไฟล์ `src/renderer/combat-visuals.json` แยกจาก balance และ asset sidecars อ้าง native font ด้วย meta path; runtime asset builder ใส่ dependency และ config ใน manifest/fingerprint โหลดจาก local pack เท่านั้น

```json
{
  "archer_double_strafe": {
    "special_sfx": [{
      "kind": "projectile",
      "shape": "arrow",
      "release_ms": 80,
      "travel_ms": 340,
      "count": 2,
      "stagger_ms": 65,
      "arc_height": 12,
      "color": "#f6d58b"
    }]
  }
}
```

- `normal_attacks[job_id]` ผูกกับ `normal_attack`; `skills[skill_id]` ผูกกับ `cast_resolve` รับเป้าจากผล damage/miss จริงใน timestamp เดียวกัน ไม่เดาเป้าใหม่ใน renderer
- registered shape คือ arrow/bullet/orb สร้างภาพด้วย Canvas; เป็นภาพที่เขียนสำหรับเกมนี้ ไม่อ้างว่า projectile ทุกชนิดมาจาก native STR
- config ตรวจชนิด/ขอบเขต/skill IDs ก่อนเปิด pack: count1–8, travel1–3000ms, release0–1000ms, stagger0–500ms, arc−300..300 และสีhex ไม่มี executable callbacks หรือ RNG ภายนอก
- ภาพเดินจากมือผู้ยิงไปจุดกระทบของเป้าตามเส้นตรง/โค้ง จำนวน/จังหวะย่อยกำหนดได้ ตัวเลขและ hit VFX รอภาพเดินทางถึง แต่ HP และผลต่อสู้เกิดที่ authoritative engine timestamp เช่นเดิม การเดินทางเป็น presentation เท่านั้น
- การเพิ่ม trail/beam หรือ event binding ชนิดใหม่ต้องเพิ่ม typed primitive/renderer/validator ไม่เอา damage หรือ status calculation ใส่ `special_sfx`

## บอส

เดโม boss/warded/storm เลือกเฉพาะ `enemy_front` จาก encounter template; field คงมอนสเตอร์สามตัว engine ไม่ฝังว่าศัตรูต้องหนึ่งตัว TASK-025 ต้องใช้กติกาบอสเดี่ยวเป็นค่าเริ่มต้นเมื่อทำ encounter factory/Story จริง ตารางM0ที่มี adds เป็นข้อมูลเก่าที่ต้องทบทวนพร้อม balance ไม่ใช่หลักฐานว่าฉากเกมใหม่ต้องมี adds

## หลักฐาน

TASK-020 รอบ5 ตรวจการเคลื่อน Timeline จริงต่อ RAF, pause, native glyph/critical, focus/projectiles, boss solo, profile serialization และ full checkpoint/events/RNG/metrics เทียบ headless ที่30/60/ไม่วาด รายงานอยู่ `plan/evidence/task-020-combat-polish-review.json` หลังผ่าน review มือถือจริง/Safari/performance budgets ครอบคลุมทั้งเกมยังเป็น TASK-042

การแก้รอบ6: [design21](21-spatial-combat-and-mobile.md) เพิ่มพิกัดจริงและย้าย Timeline ไปแผงมือถือ ตัวเลข/โฟกัส/projectile/ฐานเวลาในเอกสารนี้ยังใช้ แต่การวางตำแหน่งแบบเก่าและขนาด actor ถูกแทนที่แล้ว
