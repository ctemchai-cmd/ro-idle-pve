# สัญญาการประกอบและเพิ่มความสามารถเกม

อัปเดต: 19 ตุลาคม 2026 · **เหตุผลและขอบเขตการต่อยอด; รูป payload ที่ใช้จริงดู baseline15/16**

[Combat baseline](15-combat-baseline.md) และ [composition baseline](16-composition-baseline.md) พร้อม catalogs/schemas ของ TASK-002/047 ลงรายละเอียดแล้ว รูป TypeScript/JSON ในหน้านี้และ examples/composition-contract.json เป็นภาพแนวคิดเดิม ให้ใช้ชื่อ fields/typed params จาก baseline16 เมื่อตรวจข้อมูลจริง ส่วน module/account/version contracts ของ TASK-013 และ review รวม TASK-014 ยังไม่เสร็จ

ใช้เป็นฐานให้ TASK-002/047/013 ออกแบบรายละเอียดต่อจาก [composition](12-effects-and-composition.md) และ [architecture audit](../architecture-audit.md) สิ่งที่เลือกในหน้านี้เป็นการตัดสินใจออกแบบของผู้ช่วยภายในขอบเขตที่ได้รับ ไม่ใช่คำยืนยันกติกาจากผู้ใช้หรือการเริ่ม implementation

## จุดที่แก้ให้ต่อยอดง่ายขึ้น

| จุดเสี่ยง | แบบที่ใช้เป็นฐาน | เพิ่มของใหม่ต้องเปลี่ยนอะไร |
| --- | --- | --- |
| แยกโค้ดผลตามชื่อสกิล/อาชีพ | Skill = selectors + ordered effects + timing/cost; อาชีพกำหนดรายการที่เรียนได้ | เพิ่ม definition ถ้าใช้ primitive เดิม; เพิ่ม handler เฉพาะความสามารถใหม่ |
| สกิล/การ์ด/ไอเทมคิด stats และ proc คนละทาง | Modifier/Trigger/Effect contracts ร่วมกัน | เพิ่มแหล่งที่ให้ผล โดยใช้ resolver เดิม |
| target เดียวบังคับทั้งสกิล | ตั้งชื่อ target binding ต่อผล และเก็บ outcome ต่อเป้า/hit | โจมตีศัตรูพร้อมฮีลเพื่อนหรือบัฟตนได้ในสกิลเดียว |
| Awaken/Artifact แก้ array index หรือแก้สกิลกลาง | immutable base + patches อ้าง stable effect IDs | เพิ่ม variant โดยไม่ทำบิลด์อื่นเปลี่ยนตาม |
| Stun ใช้หยุด scheduler ทั้งตัว | action restrictions แยกจาก timer readiness | คิวเดินถึง action gate ตาม Q-019; เพิ่ม Silence/Disarm โดยกำหนด action ที่ห้าม |
| จำนวนทีม/เลเวล/rarity ฝังในสูตร | Party validation และ progression/content tables แยกจาก actor loop | เพิ่ม summon, job, tier หรือ rarity โดยไม่เปลี่ยนการวน actor |
| เพิ่มเงื่อนไขได้แต่ผิดเงียบ | validate schema + references + semantic rules ก่อนเปิด content | ชี้ definition/effect/field ที่ผิด ไม่ข้ามผลที่ไม่รู้จัก |

ไม่สร้างภาษา script, plugin framework หรือ ECS เพียงเพื่อรองรับอนาคต ใช้ชนิดข้อมูลเท่าที่สกิลรุ่นแรกต้องการ

## 1. Definition, build และ battle state แยกกัน

| ชั้น | ข้อมูล | ห้ามปน |
| --- | --- | --- |
| Content definition | Skill/Item/Status/Actor/Mode/Formula ID, tags, ตารางระดับ | HP ปัจจุบัน, เวลาร่ายค้าง, เจ้าของ item |
| Character build | character ID, job ID/root, แต้ม, skill ID/level/awakening rank, สี่ช่อง, trait sources | แก้ base definition ตามผู้สวม |
| Item instance / slot progress | item instance ID กับ definition/tier/rarity; การพัฒนา slot keyed ด้วย character ID + equipment slot | ค่าพัฒนาในช่องจัดทีม หรือคัดลอก instance เมื่อสลับของ |
| Battle instance | battle actor ID, owner, HP/SP, status instances, cast token, game clock/RNG/events | ตัว DOM/Canvas, credentials หรือ account wallet ที่แก้ตรงจาก effect |

Skill ID กับ asset ID เป็นคนละ namespace; `presentation_id` ชี้ตารางภาพ/เสียงภายนอก engine การเปลี่ยนภาพไม่เปลี่ยนสูตรหรือ replay ส่วน definition ID ที่ถูกเลิกใช้ต้องมี migration/rejection policy ไม่อาศัยชื่อแสดงเป็น key

Learned Passive, อุปกรณ์, การ์ด, Refine/Enchant และ status ให้ `modifiers[]`/`triggers[]` รูปแบบร่วมกัน แต่ lifecycle/เจ้าของต่างกัน เช่น ถอดการ์ดต้องถอน source ของการ์ดนั้นเท่านั้น ไม่ลบ ATK Up ทั้งหมด

## 2. Effect program และผลลัพธ์ต่อเป้า

ฟิลด์ร่วมของ effect คือ `id`, `type`, `target` และ `when` ถ้ามี ส่วน params แยกชนิด: damage ใช้ formula/type/element, apply_status ใช้ status ID/duration, heal ใช้ healing formula ไม่ใช้ dictionary ที่รับ key อะไรก็ได้

```ts
type DamageEffect = {
  id: EffectId; type: "damage"; target: TargetBinding;
  formula_id: FormulaId; params: PhysicalDamageParams;
  when?: Predicate;
};
type ApplyStatusEffect = {
  id: EffectId; type: "apply_status"; target: TargetBinding;
  status_id: StatusId; params: StatusApplicationParams;
  chance?: Probability; when?: Predicate;
};
// Effect = union ของ primitive ที่ลงรุ่นแรก ไม่ใช่ Record<string, unknown>
```

`effects[]` ของ Active ทำตอน cast resolve ตามลำดับที่ประกาศ ต้นทุน/การนับช่องทำครั้งเดียวที่ cast start โดยระบบคิว ไม่ซ่อนเป็น generic effect ที่สูตร/preview อาจเรียกซ้ำ ถ้าท่าจริงต้องมีผลเมื่อเริ่มร่าย ให้มี program แยกสำหรับ phase นั้นพร้อมข้อกำหนด interruption; ไม่เอาผล resolve ไปทำซ้ำ

Target binding ระบุฝ่าย/ตัวกรอง/ลำดับ/จำนวน/จังหวะเลือกเป้า/กรณีเป้าหาย แต่ละ binding resolve ครั้งเดียวต่อ activation ตาม phase ที่ระบุ ใช้ซ้ำได้โดยไม่เลือกเป้าคนละตัวระหว่าง hit กับ stun; `self`/`event_target` เป็น context binding ที่ตรวจชนิดได้ ผลต่อเป้าตายหรือ retarget เป็น policy ของ selector ไม่ใช่ `if (skillName === ...)`

ผลลัพธ์ของ effect keyed ด้วย `(action_id, effect_id, target_id, hit_index)` ระบุ hit/miss/immune/blocked, raw/mitigated/absorbed/HP damage, effective heal/overheal และ status applied/resisted แยกกัน `hit_landed` ไม่เท่ากับ HP damage > 0; ท่าต้องระบุว่าจะ proc บน hit ที่โล่รับทั้งหมดได้หรือไม่

เงื่อนไข `hit_landed(main_hit, same_target)` ของ Bash ดูเฉพาะผล hit ของเป้าปัจจุบัน สกิลหมู่ที่ตี A โดนแต่ B หลบต้องไม่ใช้ผล A ไปสตัน B ตัวอย่างหลาย hit ต้องระบุว่า roll/proc ต่อ hit หรือต่อ action

`when` เลือกว่าผลใดเกิดหรือเพิ่มโบนัสเท่านั้น ไม่ทำให้ AI ถือ/ข้ามสกิลเพื่อรอ HP ต่ำหรือติดพิษ ทุกท่ายังปล่อยตามคิวเมื่อใช้ได้ตาม D-017

## 3. Formula กับ handler พิเศษมีขอบเขตชัด

```ts
evaluateFormula(id, readonlyContext, typedParams): RawPower
planSpecialEffect(id, readonlyContext, typedParams): readonly EffectIntent[]
applyEffect(intent, battleState): { state: BattleState; outcomes: EffectOutcome[] }
```

- Formula คืนค่าก่อน pipeline ป้องกัน/คริ/โล่ ไม่แก้ HP/SP เอง ไม่มี RNG/side effect ในการประเมินสูตรเพื่อ preview
- Special handler ใช้ตอน primitive เดิมไม่พอ เช่น detonate poison หรือ consume spheres แล้วโจมตี คืน intents ที่ core ตรวจและลงผล ไม่แก้ state ข้าม core, ไม่เรียก DB/UI หรือ serialize function text
- Snapshot ระบุตามชนิดข้อมูล: SP ก่อนหักเก็บที่ cast start, target outcomes ผูก activation, DoT ระบุ snapshot/live ใน status definition, target mitigation อ่านตาม phase ที่กติกากลางกำหนด ไม่ snapshot ทุกอย่างโดยเผลอ
- การใช้ทรัพยากรหลายชนิดต้องมี validation/commit ครั้งเดียว ณ phase ที่เลือก Formula ที่อ่าน SP ก่อนหักไม่หักซ้ำ และ interrupt ไม่คืนต้นทุนเริ่มร่าย
- Damage intents ผ่าน hit/crit/DEF/guard/shield/HP pipeline กลางตาม TASK-002; true damage/ignore armor ต้องเป็นชนิด/flag ที่ประกาศ ไม่คืน final HP loss จากสูตรเฉพาะแล้วข้ามการป้องกันเงียบ ๆ
- Handler ใหม่ต้องมี params schema, version, source attribution และเคส headless/runtime ใช้ registry เดียวกัน

## 4. Stat modifier กับ status policy แยกคนละเรื่อง

Modifier ระบุ `stat`, `op`, `bucket`, `value`, `source_id` และเงื่อนไขถ้ามี คำนวณจาก sources ที่ยังมีผล: primary → derived → bucket ตาม math contract ไม่แก้ base stat เพิ่ม/ลดสะสม และไม่ให้บัฟแต่ละชิ้นคูณแยกอิสระโดยอัตโนมัติ D-037 กำหนดผลรวมบัฟแบบบวกโดยไม่มี hard/soft cap หรือ diminishing returns ใน aggregation

Status policy แยกอย่างน้อยห้ามยัดไว้ใน `stackable: true` ตัวเดียว:

| ส่วน | ตัวอย่างตัวเลือกที่ catalog ต้องระบุ |
| --- | --- |
| กลุ่มและ scope | status เดียว, กลุ่มเดียว, ต่อผู้ร่าย, ต่อเจ้าของสนาม |
| การรับ instance ใหม่ | reject / replace / refresh / independent / add_stack |
| เลือกค่าที่มีผล | strongest / additive / exclusive ตาม priority |
| อายุ | ต่อ instance, ต่อ stack, refresh ทั้งกลุ่ม; tick แรก/สุดท้าย |
| ขอบเขต | บัฟหลายผู้ร่ายใช้ uncapped aggregation; limits ของกลไกอื่นถ้ามีต้องประกาศแยก ไม่ตั้ง max stacks/magnitude ให้บัฟนี้; on death/cleanse/dispel |

Q-017/D-037 ยืนยัน additive/no cap และ Q-022/D-038 ยืนยัน reapply ของคนเดิมเพิ่ม independent instance ที่หมดอายุแยก เก็บ application/status instance ID พร้อม source/อายุแต่ละ contribution ใช้ sum ไม่เลือก strongest/ทับ/refresh ชั้นเดิม ส่วน CC ไม่ใช้การบวก duration ทุกครั้งโดยอัตโนมัติ การ reapply/overlap ต้องรักษา Chain CC ไม่มี global immunity แอบเพิ่มเข้ามา

Instance key ต้องแยกแต่ละครั้งที่ apply สำเร็จ เช่นอ้าง action/effect/target/hit กับลำดับ application ไม่ใช้ `(caster, status)` เป็น key เดียว Modifier source ใช้ instance ID เพื่อไม่รวม/ถอนชั้นผิด เมื่อเหลือหลายชั้นที่ caster/effect เดียวกัน ระบบยังต้องรู้ว่าอายุของชั้นใดหมดก่อน

Modifier ที่เพิ่มหลาย stats รวมแยกตาม stat/bucket และรักษา source ของแต่ละแพ็ก ไม่ใช้วิธีเลือก strongest ที่ตัด contribution ของคนอื่น ส่วน effect ที่ไม่ใช่ตัวเลขบวก เช่น เปลี่ยนธาตุ/ข้อห้าม action ต้องมีกติกาเฉพาะของมัน ไม่พยายาม sum ค่า enum/boolean

## 5. Trigger มีเหตุและเจ้าของ จัดคิวอย่างมีขอบเขต

Trigger ระบุ event type/filter, chance, target bindings, effect program และขอบเขตต่อ hit/action ตัวอย่าง Auto-bolt ฟัง normal attack hit ไม่ฟังดาเมจ Auto-bolt ของตัวเอง

Event มี `event_id`, `root_action_id`, `parent_event_id`, `source_id`, `owner_actor_id`, `target_id` และ origin tags เพื่อหาต้นทาง proc/reflect/DoT การสุ่มอยู่ที่ engine ใช้ seed/state ที่กำหนด ไม่ให้ renderer สุ่มผลสำเร็จเอง

Effect resolver บันทึก outcomes ก่อนประกาศ reaction event ลำดับ drain reactions/ตาย/หมดอายุ/เวลาเดียวกันเป็น engine contract ของ TASK-002/047 ไม่ใช้ลำดับ callback, network หรือการวาดภาพ ห้ามเรียก handler ซ้อนผ่าน UI ส่วน limits/depth/cause guards ต้องตรวจ loop ได้และรายงานกรณีผิดปกติ ไม่แอบเพิ่ม cooldown รายสกิล

## 6. เวลาเดินต่อ แต่ติด action gate ได้

Q-019 ผู้ใช้อธิบายว่าคิวบอสยังรันตอน Stun แต่ค้างตรง Action และหายแล้วร่ายทันที: แยก `ready_at`/phase ออกจาก `action_restrictions` เมื่อ SI/ACD ครบให้เก็บว่า ready ห้ามเริ่ม action ขณะถูกห้าม พอ restriction หมดและ SP พอจึงเริ่ม ไม่รอ SI ใหม่ทั้งก้อน

ยังไม่เริ่ม cast = ช่องยังไม่ใช้; cast เริ่มแล้ว = ใช้ช่อง/เสีย SP แล้ว ถ้า interrupt ให้ invalidate cast token เพื่อ event เก่าไม่ออกผลภายหลัง การรอเพราะ restriction ไม่วนกินช่องและไม่สะสมหลาย action เพื่อยิงชดเชยรวดเดียวหลังหาย

ตัวอย่าง: SI จบ t=1.5s, Stun อยู่ t=1–3s → ready ที่ 1.5s, เริ่ม cast ที่ 3s เมื่อใช้ได้ ไม่ใช่ 4.5s ส่วน ACDหลังถูกขัด/speedกลางช่วง/normal-attack clockมี expected cases แล้วใน combat baseline TASK-002; ไม่ตีความคำตอบนี้ว่าผู้ใช้เลือกทุกกติกา timer แล้ว

## 7. สร้าง skill variant โดยไม่แก้ของต้นแบบ

เส้นทางที่ใช้เป็นฐาน:

```text
immutable skill definition
  → เลือก progression/awakening variant
  → อ่าน level params ของ variant นั้น
  → ใช้ skill patches จาก Passive/Artifact ตาม phase/priority/source ID ที่ประกาศ
  → resolved skill ของบิลด์นี้
  → battle modifiers/snapshots/outcomes ของ activation นี้
```

Patch อ้าง `(skill_id, effect_id, param)` ใช้ operations ที่อนุญาต เช่น set/add parameter, insert effect after anchor, replace selector ไม่อ้าง `effects[0]` และไม่เปิด generic deep merge ที่ไม่รู้ผล ชนิด param หลัง patch ต้องยัง validate ได้

หลาย patch ตั้งค่าเดียวกันด้วย `set` ต้อง declare precedence/override ชัดหรือ compile error ไม่ใช้ last-write ตามลำดับโหลดไฟล์; patch อ้าง effect ที่ถูกลบต้อง error พร้อม source ID ค่าทุกขั้น trace กลับได้ รักษา logical skill ID เดิมในสี่ช่องหลัง Awaken

ตัวอย่าง [composition-contract.json](../examples/composition-contract.json) มี Bash base ratio 2.0, Awaken example set เป็น 2.4 และ Artifact example add 0.2 ผลแยกเป็น 2.0/2.4/2.6 โดยตัวละครอื่นยังได้ base 2.0 ตัวเลขเป็นตัวอย่างการประกอบ ไม่ใช่สูตรบาลานซ์หรือเปิดระบบอนาคตในรุ่นแรก

## 8. Actor, อาชีพ, item และโหมดต่อเพิ่มผ่านข้อมูล

- Job definition มี root/parent/promotion requirement แยกจาก level/cap/breakthrough; อาวุธตรวจ tags/allowed definitions ไม่กระจายเงื่อนไขตามชื่ออาชีพใน damage handler
- Q-020 ห้ามใส่ logical skill เดิมซ้ำสี่ช่อง ตรวจที่ build validator รวม variant/Awaken ของท่าเดียวกัน ไม่ถือว่าชื่อแสดงต่างกันแล้วซ้ำได้
- Q-021 ฟาร์มเป็น resources แล้วผู้เล่นเลือกกดอัป main/NPC ตัวใดก็ได้ ระดับกับแต้มยังผูกแต่ละตัว ไม่มี auto-level/EXP sharing มาแทนคำตอบนี้
- Battle actor collection ไม่จำกัดสี่ Main+NPC3 เป็น party rule ส่วน Plant มี owner/lifetime/actions ของตน ใช้ clock/effects เดียวกัน Pet อนาคตจึงเพิ่มชนิด actor โดยไม่แก้สมมติฐาน roster
- Mode definition อ้าง encounter/reward/limit policy ขณะที่ตัวดำเนินโหมดรับ battle result แล้วสั่ง progression/reward ไม่ให้ damage handler แจก gold หรือปลดด่าน
- Refine/Enchant/cards เป็นแหล่ง trait บน character/equipment slot เปลี่ยน item ไม่ย้ายการลงทุน; template/rarity/tier อยู่ใน content tables การมี schema สำหรับ affix ไม่เท่ากับเลือกให้รุ่นแรกมี random substats
- Appearance/gender/localized name แยกจาก ability set เพื่อไม่ผูก Bard/Dancer กับสูตรตามเพศ หากเลือกชุดสกิลต่างกันภายหลัง ให้ต่างที่ definition/trait ไม่เพิ่มเงื่อนไขใน core

## 9. เพิ่มความสามารถหนึ่งอย่างต้องผ่านอะไรบ้าง

1. ถ้าใช้ primitive เดิมได้ เพิ่ม Skill/Item/Status definition + อ้างสูตร/selector/trait เดิม ไม่แก้ engine หรือ UI เป็นรายสกิล
2. ถ้าต้องใช้ primitive ใหม่ เพิ่ม typed operation/handler + schema + อธิบาย phase/pipeline/source/outcomes + expected case; ไม่เพิ่มทางลัดข้ามกติกากลาง
3. Validate รูปร่าง, ID/units/refs, targets/outcome scope, effect order, patch conflicts, probability/limits และวง proc/stat dependency ก่อนใช้ content
4. M0 ตรวจ input/expected result ด้วยมือ ส่วน runtime/headless parity และ trace จริงตรวจหลังสร้าง engine ไม่ใช้ JSON parse ผ่านเป็นหลักฐานว่ากลไกทำงานแล้ว

เคสส่งต่อขั้นต่ำ: หมู่ A hit/B miss ไม่สตัน B, shield รับหมดแต่ hit proc ตาม policy, buff ต่าง source, สองตัวละครใช้คนละ variant ไม่ปนกัน, patch ขัดกันต้อง error, Stun ที่ action gate, duplicate logical skill ถูกปฏิเสธ, ถอด item/card แล้วถอนเพียง source นั้น

## 10. Module และคำสั่งบัญชีใช้ทางขยายเดียวกัน

กำหนดทิศทาง import เป็นฐาน M0 (paths ยังไม่ถูกสร้าง):

| ส่วน | อ่าน/เรียกอะไรได้ | กติกา |
| --- | --- | --- |
| `src/domain/` | pure contracts/math/combat/progression/registry ภายใน domain | รับ validated content/clock values/RNG เป็น input ไม่มี I/O หรือ import ชุดข้อมูลล่าสุดเอง |
| `src/application/` | domain + repository/auth/clock contracts | จัดลำดับคำสั่ง/โหลด/commit ไม่คัดลอกสูตร |
| `src/adapters/` | application contracts + SDK/HTTP/storage | แปลง I/O ตาม port ไม่คิดสูตรสกิล/รายได้ |
| `src/ui/` และ renderer | application/view models/presentation | ส่งคำสั่ง วาดผล ไม่แก้ wallet/DB หรือคำนวณผลต่อสู้เอง |
| `src/simulation/` | domain + validated content/scenario | ไม่มี cloud ใช้ virtual clock/seed; metrics/replay ไม่เขียนบัญชีจริง |

เลือกฐาน execution สำหรับ account operations เป็น **TypeScript domain บน Vercel API** และ Supabase transaction สำหรับบันทึก/ตรวจ revision/receipt เพื่อไม่สร้างสูตร AFK/upgrade/gacha ซ้ำใน SQL browser ใช้ domain เดียวกันสำหรับ combat และ preview; ข้อมูลเวลา server/entropy มาจาก adapter การเลือกนี้เป็นงานออกแบบใน D-036 ยังไม่สร้างบริการ ดู [cloud design](07-cloud-save-and-deployment.md)

```ts
applyAccountCommand(readonlyState, typedCommand, context): CommandResult
// context: validated content/rules, server time value, injected RNG ตาม operation
// result: next account state + result/receipt data; ไม่เขียน DB ภายใน domain
repository.compareAndCommit(expectedRevision, commandId, payloadHash, result)
```

`UpgradeCharacter`, `EquipItem`, `SaveBuild`, `SettleAfk`, `DrawCard`, `ApplyBattleResult` เป็นชนิดคำสั่งคนละชนิดที่เพิ่มผ่าน schema/domain handler เดิม ไม่ให้แต่ละหน้าจอสร้างวิธีหักเงิน/รับของเอง UI ส่ง parameters ไม่ส่ง final wallet ที่ใช้ทับยอดตรง ๆ ระบบนี้ไม่ต้องเป็น event-sourcing framework

ข้อมูลบัญชีถาวรเป็นแหล่งหลักชุดเดียวต่อ revision: roster/inventory/slot progress/wallet/mode progress/claim cursors ตาราง receipt แยกได้แต่ไม่เก็บ wallet อีกชุดที่ต่างฝ่ายต่างแก้ Checkpoint เป็น transient battle/build draft ที่อ้าง revision ไม่ใช่สิทธิ์เขียนทับยอดธุรกรรม

Application ตรวจ receipt ของ command ID ก่อนคำนวณใหม่, ตรวจว่า payload ตรง, แล้ว compare-and-commit state/revision/cursors/receipt ใน transaction เดียว ถ้า revision ชนต้อง reconcile/revalidate ไม่ apply delta เดิมบนยอดใหม่เงียบ ๆ response หายแล้ว retry อ่าน receipt เดิม ไม่สุ่ม/จ่าย/ใช้ของใหม่ รายละเอียดช่วงเก็บ receipt, randomness reservation และ patch compatibility ยังต้องลง sequence/payload/expected cases ใน TASK-013/022

เพิ่มโหมดหรือระบบพัฒนาใหม่จึงเพิ่ม content + typed command/result + mode adapter โดยใช้บัญชี/repository/reward rules ชุดเดิม ไม่ต่อ effect handler เข้าฐานข้อมูลหรือย้ายรางวัลไปทำใน renderer

## เรื่องที่ยังต้องถามกับเรื่องที่ผู้ออกแบบทำต่อได้

| ประเภท | เรื่อง | วิธีจัดการ |
| --- | --- | --- |
| ตอบแล้ว | Q-022 บัฟเดิมจากคนเดิมร่ายซ้ำก่อนหมดอายุ | เพิ่ม independent instance แต่ละชั้นหมดเวลาของตัวเองตาม D-038 |
| ตอบแล้ว | Q-017 บัฟจากหลายตัวบวกเพิ่ม ไม่มีเพดาน | รวมเฉพาะ contributions ที่ยังมีผล รักษา source/เวลาแยก และวัด trade-off ทีมใน simulation |
| ตอบรอบนี้แล้ว | Q-019 action gate, Q-020 ไม่ใส่ท่าซ้ำ, Q-021 resources เลือกอัปตัว | ลง decisions และส่งต่อ task ที่เกี่ยวข้อง |
| ผู้ช่วยออกแบบต่อ | สูตร/เพดาน/params, ตารางจำนวนสกิล/ด่าน/ราคา, อาวุธเริ่มต้นที่ตกหล่น, targeting fallback, patch/schema/module contracts | จัด baseline พร้อมเหตุผล/expected cases ใน M0; แยกจาก user confirmation |
| ข้อเสนอวิธีเล่นที่ยังเปลี่ยนได้ | Bard/Dancer ใช้ ability set ร่วมแต่ต่างภาพ, ของฐานไม่มี random substats แล้วแยกบิลด์ด้วย Enchant/cards | เก็บเป็นข้อเสนอให้ตรวจใน TASK-005/009 ไม่ถือว่าผู้ใช้เลือกแล้ว; โครงนี้รองรับเปลี่ยนภายหลัง |
| เลื่อนไป milestone ของมัน | Awaken ต้อง Max เดิมหรือไม่, จำนวน Artifact/Pet/Rune และสกิลอนาคตเต็มชุด | ยังไม่จำเป็นต่อ Class 2; ระบุ extension/data version contracts ไว้ก่อน |

เอกสารนี้ลดช่องว่างระดับการประกอบจริง แต่ A-01–A-08 ยังไม่ปิดทั้งชุด TASK-013 ต้องลง module paths/authority/command/migration contracts และ TASK-014 ตรวจ schema/catalog/ข้อมูลจริงก่อน implementation
