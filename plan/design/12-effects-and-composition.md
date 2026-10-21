# ประกอบสกิล สถานะ และไอเทมจากโมดูลร่วมกัน

สถานะ: **เหตุผลและตัวอย่างเชิงแนวคิด; สัญญารุ่นแรกอยู่ใน [composition baseline](16-composition-baseline.md)** · อัปเดต 19 ตุลาคม 2026

TASK-047 ส่ง schemas จริง 11 แฟ้ม, stat/status/effect/formula catalogs และ [เคสตรวจ](../data/composition-cases.json) แล้ว ใช้ชื่อฟิลด์/หน่วย/นโยบายใน baseline16 และข้อมูลจริงเมื่อลงเนื้อหา ส่วน JSON/TypeScript ด้านล่างเก็บคำอธิบายแนวคิดเดิม ไม่ถือเป็น payload ที่ผ่าน schema และไม่แทนผลตรวจ runtime หรือข้อมูลสกิลครบทุกอาชีพ

ผู้ใช้เสนอให้สกิลเกิดจาก aa + bb + cc เช่น เลือกเป้า + ดาเมจ + บัฟ/ดีบัฟ และให้ไอเทมใช้ตัวปรับ stats ร่วมกัน เอกสารนี้ทำข้อเสนอให้เป็นรูปธรรมก่อนทำข้อมูลสกิลทุกสาย ไม่ใช่โค้ดระบบที่ทำเสร็จแล้ว ตัวเลข ID ตัวอย่าง และรูปแบบ JSON ด้านล่างเป็นภาพร่าง ไม่ใช่ asset ID ที่ตรวจยืนยันหรือค่าบาลานซ์จริง

เดิมมีหัวข้อ buff/debuff/stack ใน TASK-002/017 แต่ยังไม่มี catalog และรูปแบบข้อมูลที่คุยลงรายละเอียดร่วมกัน จึงเพิ่ม TASK-047 เป็นงาน M0 หลัง TASK-002 และก่อนข้อมูลสกิล/ไอเทม โดยคง ID งานเดิมทั้งหมด

รอบตรวจการต่อยอดมี [extension contracts](14-extension-contracts.md) และ [ตัวอย่าง JSON](../examples/composition-contract.json) เพิ่มรายละเอียด stable IDs/typed operations/per-target outcomes/variant patches/validation ที่ต้องใช้ต่อ ไม่ใช้การเพิ่ม AC อย่างเดียวแทนการออกแบบ ทั้งสองไฟล์ยังไม่ใช่ catalog หรือ schema runtime ฉบับตรวจรับ

## หน่วยที่นำมาประกอบกัน

| หน่วย | หน้าที่ | ตัวอย่าง |
| --- | --- | --- |
| Target selector | เลือกฝ่าย จำนวน และลำดับความสำคัญ | self, ศัตรูแนวหน้าหนึ่งตัว, ศัตรูทั้งหมด, เพื่อน HP% ต่ำสุด |
| Effect | กระทำกับสถานะเกม ณ เหตุการณ์หนึ่ง | damage, heal, apply_status, shield, resource_change, cleanse, dispel, interrupt, summon |
| Status effect | ผลที่มีอายุ/จำนวนชั้น/กติกาคงอยู่ | ATK Up, Poison, Stun, Provoke, Expose |
| Stat modifier | ปรับตัวเลขผ่านกติกาคำนวณเดียวกัน | ATK +20, ATK +10%, ASPD -15%, healing received -20% |
| Trigger | เรียกผลเมื่อเกิดเหตุการณ์ที่กำหนด | ตีปกติโดน, รับดาเมจ, เริ่ม/สำเร็จสกิล, status tick/หมดอายุ |
| Predicate | เงื่อนไขของผลหรือ bonus | เป้าติดพิษ, มีลูกแก้วอย่างน้อย N, เป้าเป็นบอส, HP ต่ำกว่าเกณฑ์ |
| Formula / special handler | สูตรหรือกลไกเฉพาะที่เรียกด้วย ID | physical_attack, magical_attack, consume_spheres, asura_power |
| Presentation | อธิบายภาพและเสียงจากเหตุการณ์ | icon/sound/VFX recipe ID ไม่เป็นผู้ตัดสินดาเมจ |

“ค่าสเตตัสตัวละคร” เช่น STR/ATK กับ “สถานะต่อสู้” เช่น Poison/Stun เป็นคนละอย่าง ชุด modifier ใช้ได้ทั้งกับไอเทมถาวร Passive และ status ชั่วคราว ส่วน Buff/Debuff เป็นประเภท/แท็กที่ใช้แสดงผลและเลือก cleanse/dispel ไม่จำเป็นต้องมีเครื่องคำนวณแยกกัน

การจัดรูปแบบข้อมูลไม่ได้บังคับสร้างระบบ ECS หรือภาษาเขียนโปรแกรมใหม่ทั้งภาษา ใช้ operation/predicate/formula ที่มีชนิดข้อมูลชัดเจนและเพิ่มชนิดใหม่เมื่อสกิลจริงต้องใช้

## ตัวอย่างสกิลแบบประกอบ

ตัวเลขและชื่ออ้างอิงเป็นตัวอย่างเท่านั้น `after_cast_delay_ms` คือ ACD ตามแผน ไม่ใช่ cooldown รายสกิล

```json
{
  "id": "bash_example",
  "targeting": {
    "primary": { "team": "enemies", "select": "single_front" }
  },
  "cost": { "sp": 12 },
  "timing": { "cast_time_ms": 0, "after_cast_delay_ms": 700 },
  "effects": [
    {
      "id": "main_hit",
      "type": "damage",
      "target": "primary",
      "formula_id": "physical_attack",
      "params": { "atk_ratio": 2.0, "element": "weapon" }
    },
    {
      "id": "stun_on_hit",
      "type": "apply_status",
      "target": "primary",
      "when": { "type": "hit_landed", "effect_id": "main_hit", "scope": "same_target" },
      "chance": 0.25,
      "status_id": "stun",
      "params": { "duration_ms": 1000 }
    }
  ],
  "presentation": {
    "sound_id": "example_bash_sound",
    "vfx_id": "example_bash_impact"
  }
}
```

สกิลนี้คือเลือกเป้า + ดาเมจ + Stun เมื่อการโจมตีโดน `effects[]` รักษาลำดับและมี ID ให้ตามรอย ไม่แยกเป็น damage/buff/debuff หลาย array ที่ไม่รู้ว่าผลใดออกก่อน ผลของการโจมตีแต่ละเป้าต้องระบุได้ว่า hit/miss/crit/ถูกป้องกันอย่างไร เพื่อไม่ใช้ผลการโดนของเป้าหนึ่งไปสตั้นอีกเป้า

หนึ่งสกิลใช้หลาย selector ได้ เช่น ฟันศัตรูแล้วบัฟตนเอง หรือทำดาเมจทุกตัวพร้อมฮีลทีม ไม่ใช้ `team` ตัวเดียวบังคับทุกผลของสกิล หากต้องใช้เป้าเดิมให้ resolve selector เป็นชุดเป้าที่อ้างซ้ำได้; จังหวะล็อกเป้า/เป้าตาย/retarget ต้องระบุในสเปก

`when` อยู่ที่ผลหรือ trigger ใช้เพิ่มความหลากหลาย เช่น “ทำดาเมจเพิ่มเมื่อเป้าติดพิษ” ไม่ใช่คำสั่งให้ AI ถือสกิลรอเป้าติดพิษ คิวยังคงปล่อยเมื่อใช้ได้ตาม D-017 หัก SP/นับใช้ที่เริ่มร่าย และไม่คืนเมื่อถูกขัดตามเดิม

## สถานะที่เสนอให้ใช้เป็นฐานคุย

ตารางนี้เป็น candidate catalog ไม่ใช่การยืนยันว่าต้องทำทุกสถานะก่อนมีสกิลที่ใช้งาน ต้องระบุเจ้าของ status แต่ละตัวและอาชีพที่ใช้จริงใน M0

| กลุ่ม | ตัวอย่าง | สิ่งที่ต้องแยกให้ชัด |
| --- | --- | --- |
| เพิ่มค่าสเตตัส | ATK/MATK Up, DEF/MDEF Up, ASPD Up, Cast Speed Up, Crit Up | stat ที่แก้ หน่วย กลุ่มการซ้อน เพดาน และผลต่อเวลาที่เหลือ |
| ความอยู่รอด | Damage Guard, Barrier, HP Regen, SP Regen | ลดดาเมจ/รับแทน/โล่/ฮีลเป็นคนละกลไก; overheal ไม่ใช่ฮีลที่ช่วยจริง |
| ลดศักยภาพ | Armor Break, ATK Down, ASPD Down, Cast Slow, Healing Reduction | ลด DEF กับเพิ่มความเสียหายที่รับเป็นคนละขั้นของสูตร |
| ความเสียหายต่อเนื่อง | Poison, Burn, Bleed | stack/tick/ธาตุ/การล้าง/สูตรจากผู้ร่าย; ชื่อต่างกันควรมีบทบาทที่ต่างจริง |
| ควบคุม | Stun, Freeze, Silence | action ที่ห้าม/ขัดได้/หลุดเมื่อโดนดาเมจ/กติกาบอส ไม่ใช่ bool แช่แข็งเหมือนกันทุกชนิด |
| เป้าหมายและจุดอ่อน | Provoke, Expose, Mark | ท่าที่บังคับเป้าได้ กลุ่มผู้ได้ประโยชน์ และเงื่อนไขใช้ mark |
| กลไกอาชีพ | Spirit Spheres, Combo State, Song/Aura, Element Endow | แยก actor resource/สถานะ/สนาม/สิ่งเรียกให้ถูก ไม่ยัดทั้งหมดเป็น stat buff |

เกมนี้ไม่ได้ใช้การเดินในสนามเป็นแกน Slow จึงควรระบุว่าลด ASPD/Cast Speed ใด ไม่ทำสถานะลดความเร็วเดินโดยไม่มีผลต่อการเล่น ส่วน Plant เป็น actor/สิ่งเรียกที่มีอายุและเหตุการณ์ของตน ไม่ใช่แค่ชื่อ buff ในรายการ

## สัญญาของ status ที่ต้องออกแบบก่อนใช้ในสกิล

ทุก status definition ต้องมี ID/แท็ก/ผลและข้อมูลอย่างน้อยดังนี้:

- polarity, tags และกลุ่มที่ใช้ซ้อน เช่น attack_up, poison, hard_cc
- duration/tick interval เป็นเวลาเกม; ตกลง tick แรก/สุดท้ายและเหตุการณ์ tick ตรงเวลา expire
- stacking: กลุ่ม/scope ผู้ร่าย, refresh/replace/independent/sum; บัฟจากหลายตัวใช้ sum แบบไม่มี cap ตาม D-037 ส่วนสถานะชนิดอื่นต้องประกาศ policy ของตน
- magnitude ที่ snapshot ตอนใช้ หรือคำนวณใหม่เมื่อแหล่งค่าสเตตัสเปลี่ยน; ระบุผลต่อ periodic ticks ให้ชัด
- cleanse/dispel ได้หรือไม่ ด้วยประเภทใด; อะไรเกิดเมื่อผู้ให้ผลหรือผู้รับตาย และเมื่อจบไฟต์
- modifiers, action restrictions, triggers และเงื่อนไข remove ที่ใช้จริง
- chance/resistance/immunity/การลดเวลา CC ของบอส ซึ่งใช้ engine RNG และไม่ยุ่งกับการนับคิวพิเศษ
- source attribution: ตัวละคร/สกิล/ไอเทมที่ให้ผล เพื่อ metrics, tooltip, การซ้อน และ simulation

Q-017 ตอบแล้วตาม D-037: **บัฟจากหลายตัวรวมแบบบวก ไม่มีเพดานการซ้อนหรือผลรวมบัฟ** ไม่ใช้ strongest หรือให้ผู้ร่ายใหม่ทับอีกคน เก็บ source/เวลาแยกและถอนเฉพาะ contribution ที่หมดอายุหรือถูกล้าง ส่วน Poison/CC มี policy ของตน ไม่เปลี่ยนตามกฎบัฟโดยอัตโนมัติ Q-018 ยืนยัน Chain CC ปกติ ไม่มี global immunity/diminishing returns

ตัวอย่าง ATK Up +20% จาก A และ +30% จาก B ขณะอยู่พร้อมกันให้ +50% ใน ATK-percent bucket ไม่คูณเป็น 1.2 × 1.3 และไม่ clamp ผลรวมไว้ที่เพดานใด เมื่อ A หมดอายุเหลือ B +30% โดย B ไม่รีเฟรชอายุ A Q-022/D-038 ยืนยันคนเดิมร่ายซ้ำให้เพิ่มอีก instance และแต่ละชั้นหมดเวลาของตัวเอง ไม่ refresh ชั้นเดิม

Successful apply แต่ละครั้งมี `status_instance_id`/application ID แยก แม้ source actor/skill/status ID เหมือนเดิม Modifier source ของสถานะต้องอ้าง instance นี้ เพื่อให้ออกผลหลายชั้นจริงและถอนเฉพาะชั้นที่หมดอายุ ไม่ใช้ map `(caster, status)` ที่ทับค่าครั้งก่อน

ผู้ใช้ตั้งใจให้ตัวบัฟหลายตัวมีทางเล่น โดยแลก duration/rotation/SP/ตำแหน่งทีมและดาเมจของตัวบัฟ งาน balance ต้องเทียบ actual team DPS/uptime/ความอยู่รอด/เวลาจบ ไม่ใส่เพดานหรือ diminishing returns ในการรวมบัฟเพื่อแก้ผลลัพธ์โดยเงียบ ๆ

## Reference สำหรับ Q-017: บัฟชื่อเดียวกันกับ stat เดียวกันไม่ใช่สิ่งเดียวกัน

ตรวจเพิ่ม 19 ต.ค. 2026 หลังผู้ใช้ขอเทียบทั้งเกมหลักและ RO อื่น:

| แหล่ง | สิ่งที่ยืนยันได้ | ข้อจำกัด |
| --- | --- | --- |
| Ragnarok Idle Adventure Plus | ตรวจ [เว็บไซต์ทางการ](https://roidle.gnjoy.asia/home) และ [FAQ ผู้ให้บริการ](https://www.gnjoy.asia/faq/) รวมการค้น same-buff stacking แล้ว ยังไม่พบคำอธิบายทางการที่ตอบกรณี main/NPC ให้บัฟเดียวกัน | ยังสรุปไม่ได้ว่า add/refresh/strongest และห้ามใช้บทความรวมอาชีพแทนผลทดลองบัฟซ้ำ |
| rAthena เป็น reference แบบจำลอง RO PC | [status.cpp](https://github.com/rathena/rathena/blob/master/src/map/status.cpp) มี entry ต่อ status type และกฎ overlap แยกรายสถานะ; บัฟเดิมไม่ได้ถูกบวกเพิ่มตามจำนวนผู้ร่ายเสมอ และมีข้อยกเว้นการทับระดับ | เป็น implementation ของ emulator ไม่ใช่หลักฐานว่าทุก official RO PC server ใช้เหมือนกัน และไม่ได้พิสูจน์ระบบเก็บแหล่งอ่อนรอกลับมามีผล |
| Ragnarok Origin | [ประกาศทางการ](https://roglobal.com/news/1351) ระบุผลของ Tidal Ward ต่อ stack จึงเป็นตัวอย่างของบัฟที่ออกแบบให้มีชั้นเฉพาะตัว | ไม่ใช่หลักฐานว่าบัฟทุกตัวหรือบัฟจากหลายผู้ร่ายบวกกัน |

ข้อมูล reference นี้เก็บเพื่ออธิบายที่มาเท่านั้น หลังตรวจผู้ใช้เลือกกติกาเกมเราเป็น additive/no cap ตาม D-037 ข้อเสนอ strongest/ทับ/จำกัดผลรวมเดิมจึงเลิกใช้กับบัฟจากหลายตัว ไม่อ้างว่าต้นฉบับใช้กติกานี้ `stack_group` ยังไม่ควรเท่ากับชื่อ stat ทั้งหมด เพราะใช้จัด lifecycle/cleanse/provenance ที่ต่างกันได้

Stun ยึด D-015/D-016 เดิม ไม่มีการเลื่อน/ย้อนช่องนอกหลัก cast-start ส่วน Silence/Freeze ต้องระบุผลต่อ action/queue/interrupt ของตนก่อนนำไปใส่สกิล ไม่เดาว่าทำเหมือน Stun ทุกอย่าง

## บอสที่ตอบสนองต่อ CC ด้วย Passive เฉพาะตัว

ผู้ใช้เสนอให้บอสบางตัวมี Passive ที่เมื่อโดน CC แล้วสะสมบัฟ CC Resistance ชั่วคราว แทนการป้องกัน Chain CC ทั้งเกม กรอบนี้ประกอบได้จาก trigger + status + modifier เดิม เช่น:

```text
boss passive: on_control_applied_to_self
  → apply_status(self, adaptive_cc_resistance)
  → เพิ่มหนึ่ง stack และจัดเวลา stack ตาม policy ของบัฟ
```

ข้อเสนอรายละเอียดเพื่อคงการหยุดตามระยะปกติ:

- resistance ลดโอกาสติด CC ครั้งถัดไป แยก stat นี้จากการลดระยะ CC; ยังไม่เลือกสูตรหรือค่าต่อ stack
- รับ CC ครั้งแรกตามกติกาปกติ แล้วจึงเพิ่มบัฟ ไม่หักเวลาของ CC ที่ติดไปแล้ว
- เพิ่ม stack เฉพาะ CC ที่ apply สำเร็จ การโจมตีที่ไม่มี CC/ติดต้านไม่ทำให้ stack เพิ่มโดยอัตโนมัติ
- บอสที่ไม่ได้ใส่ Passive นี้ยัง Chain CC ได้ตามปกติ; บอสที่ใส่มี icon/stack/เวลาที่อ่านได้
- TASK-047 ต้องเลือก cap, ชนิด CC ที่นับ, refresh ทั้งก้อนหรือแต่ละ stack หมดอายุแยก, นับ reapply ระหว่างยังถูกควบคุมหรือไม่ และ cleanse/dispel ได้หรือไม่
- เมื่อ CC ถูกต้าน การขัดร่ายที่พ่วงมากับ CC จะเกิดหรือไม่ต้องระบุแยกจากท่าที่เป็น interrupt โดยตรง ไม่เพิ่มข้อยกเว้นคิวหรือคืน SP

กลไก Passive นี้เป็นแนวทางที่ผู้ใช้เสนอให้รองรับ รายชื่อบอส/ค่าต้าน/เวลา/กติกาย่อยยังต้องออกแบบ ไม่เติมให้บอสทุกตัวเอง

## ไอเทม การ์ด Passive และ Artifact ใช้แกนเดียวกัน

ตัวอย่างไอเทมเป็นภาพร่างอีกชุดหนึ่ง:

```json
{
  "id": "example_sword",
  "slot": "weapon",
  "weapon_type": "sword",
  "modifiers": [
    { "stat": "physical_attack", "op": "add_flat", "value": 40 }
  ],
  "triggers": [
    {
      "event": "normal_attack_hit",
      "chance": 0.10,
      "effects": [
        {
          "type": "apply_status",
          "target": "event_target",
          "status_id": "armor_break",
          "params": { "defense_down_pct": 0.10, "duration_ms": 3000 }
        }
      ]
    }
  ]
}
```

ไอเทมให้ modifier ถาวรหรือ trigger ที่เรียก effect แบบเดียวกับสกิลได้ การ์ด/Enchant/Refine/Passive ใช้แกนนี้ตามสเปกของมัน ไม่สร้างสูตร ATK/ASPD แยกคนละระบบ แหล่งที่อยู่บน slot ยังคงผูกกับตัวละคร/slot ตาม D-010/D-022 ไม่ย้ายตาม item หรือช่องทีม

สูตรค่าสเตตัสต้องรวมจาก source แล้วคำนวณใหม่ ไม่แก้ base ATK ไปเรื่อย ๆ จนถอด buff แล้วตัวเลขไม่กลับ มีลำดับ primary stats → derived stats → modifiers/เพดาน และแยก add_flat/add_percent/multiply โดยระบุกลุ่มที่ใช้จริง

ตัวอย่างลำดับที่เสนอ: `(base + ผลรวม flat) × (1 + ผลรวม add_percent) × multipliers` โดยคิด primary stats ให้จบก่อน derived stats เช่น base ATK 100 + อาวุธ 20, ATK +10% และ -20% ในกลุ่ม percent แบบบวก จะได้ 108 ก่อนตัวคูณขั้นถัดไป ผลรวมบัฟไม่มี cap ตาม D-037; การตรวจขอบเขตหน่วยของ stat อื่นไม่ใช่เหตุให้ clamp ผลรวมนี้ ตัวเลขแสดงเหตุผลว่าต้องนิยามลำดับ ไม่ใช่ล็อกสูตรบาลานซ์ทั้งหมด; ห้ามนำ primary modifier ไปคิดซ้ำที่ derived stat

HP ปัจจุบัน/SP ปัจจุบัน/โล่คงเหลือเป็นทรัพยากร ไม่ใช่แค่ stat modifier ต้องกำหนดการ clamp เมื่อ Max HP/SP เปลี่ยนและลำดับ shield/mitigation/HP damage ด้วย

## สูตรพิเศษและอิสระในการออกแบบ

ข้อมูลอ้าง `formula_id`/`handler_id` พร้อม typed params ส่วนโค้ดเป็น registry ที่ version และทดสอบได้ ตัวอย่าง `asura_power` อ่าน cast snapshot เช่น SP ก่อนหักที่เก็บไว้ ณ เริ่มร่าย หรือ `poison_detonation` คืนคำสั่งดาเมจ/ใช้ชั้นพิษผ่าน effect pipeline

สูตรดาเมจควรคืน raw damage/type/element แล้วเข้า pipeline กลางของ hit/crit/DEF/guard/shield/HP ตามสเปก การเจาะ DEF หรือข้ามขั้นใดต้องประกาศเป็นกติกาที่ตรวจได้ ไม่ให้ handler แก้ HP ตรง ๆ จน metrics และการป้องกันไม่ทำงาน

JSON เก็บ ID/params ที่ serialize/validate ได้ ไม่เก็บ function text หรือ `eval` สูตรพิเศษใน registry ยังทำให้สร้างท่าที่นอกเหนือจาก primitive เดิมได้ โดยใช้ context/clock/RNG/event API เดียวกันทั้งเกมและ simulation

ตัวอย่างสูตร SP ก่อนหักไม่เปลี่ยนหลักการหัก SP ที่ cast start และไม่คืนเมื่อถูกขัด กติกาการใช้/เผาทรัพยากรจริงต้องอยู่ใน transaction/เหตุการณ์ที่สเปกระบุ ไม่ให้สูตรคำนวณถูกเรียกสองครั้งแล้วกิน SP สองครั้ง

## ลำดับเหตุการณ์ Trigger และการวัดผล

เสนอ lifecycle หลัก: cast_start → cast_resolve → effect แต่ละขั้น → hit/damage/status events → reactions พร้อมลำดับเมื่อเวลาเดียวกันใน TASK-002 แต่ละ effect ต้องมี phase/target context ชัดเจน ผลเมื่อร่ายถูกขัดมีเฉพาะสิ่งที่ระบุว่าเกิดแล้วตอน cast_start ไม่ปล่อยผล resolve เก่าภายหลัง

trigger ต้องกรองชนิดเหตุการณ์ เช่น Auto-bolt ฟัง normal_attack_hit ไม่ฟังดาเมจของ Auto-bolt เอง ระบุว่าเกิดได้ต่อ hit/action เท่าใด และมี limit ต่อสายเหตุการณ์ ป้องกัน reflect/proc เรียกกันไม่จบโดยไม่แอบเพิ่ม cooldown รายสกิล

เก็บ root action/effect/source/target/event IDs เพื่อรายงานดาเมจ/ฮีล/DoT/proc/buff uptime/ขัดร่ายได้ การติด status ไม่เท่ากับดาเมจสำเร็จ และการ์ดที่ให้ proc ไม่ควรทำให้ event ดาเมจนั้นถูกนับสองครั้ง

Awaken/Artifact ในอนาคตควรอ้าง skill/effect ID ที่เสถียร เช่น เปลี่ยน params ของ main_hit หรือเพิ่ม effect ที่กำหนด แยก base definition กับ instance/variant ไม่แก้ skill กลางจนตัวละครอื่นหรือ A/B variant ได้ผลตามไปด้วย ลำดับการซ้อน Awaken/Artifact/Passive ยังต้องออกแบบเป็น contract ใน M0 ไม่เพิ่ม implementation แพตช์อนาคตเข้ารุ่นแรก

## ผลส่งมอบและเกณฑ์ก่อนทำข้อมูลสกิล

TASK-047 ส่ง catalog ของ stats/modifiers/statuses/operations/targets/triggers/predicates, schema/กติกา composition และตัวอย่างที่ตรวจด้วยมือได้ ก่อน TASK-003–009 ใช้ทำข้อมูลจริง TASK-013 จัดวาง module/runtime contracts และ TASK-014 ตรวจความสอดคล้องกับทุก AC

เคสขั้นต่ำ: โจมตี+Stun เมื่อโดน, ฮีล+บัฟทีม, buff ต่าง source/หมดอายุ, Poison stack/tick/cleanse, โล่กับลดดาเมจ, Provoke/บอสต้าน CC, item proc, conditional bonus ที่ไม่ถือคิว, custom formula, Awaken/Artifact variant ที่ไม่แก้ base definition และ runner/runtime ที่ให้ผลเดียวกัน

รายละเอียดตัวเลข/จำนวนสถานะจริงเลือกจากสกิลที่จะใช้ ไม่ทำทุกความสามารถของ engine ล่วงหน้าเพียงเพราะ schema เขียนรองรับได้ ดู [combat](02-combat-and-skills.md), [อุปกรณ์](04-progression-and-equipment.md), [simulation](08-simulation-and-balance.md), [overview](../overview.md)
