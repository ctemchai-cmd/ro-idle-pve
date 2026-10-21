# สัญญาข้อมูลและการประกอบความสามารถ รุ่น composition-v1

อัปเดต 19 ตุลาคม 2026 · ผลส่งมอบ TASK-047 · ตัวเลขเป็น baseline ที่ออกแบบสำหรับเกมนี้ ไม่ใช่สูตรที่ถอดจาก RO Idle Adventure Plus

ใช้กับ [สูตรและไทม์ไลน์](15-combat-baseline.md) โดยไม่เปลี่ยนข้อยืนยันของผู้ใช้ สกิลยังออกตามคิวสี่ช่องที่ไม่ซ้ำ หักต้นทุน/ใช้ช่องตอนเริ่มร่าย ไม่มี cooldown รายท่า และ predicates ไม่ทำให้ AI ถือสกิลไว้รอเงื่อนไข

เอกสารนี้กับข้อมูลด้านล่างเป็นสัญญา M0 ที่เลือกใช้จริง แทนรูป JSON เชิงแนวคิดใน design/12/14 การผ่าน review ของข้อมูลไม่ใช่การมี engine หรือพิสูจน์บาลานซ์แล้ว

## แฟ้มและการตรวจข้อมูล

| แฟ้ม | เจ้าของข้อมูล |
| --- | --- |
| [stat-definitions](../data/stat-definitions.json) | 36 stat IDs, หน่วย, bucket และ operation ที่อนุญาต; combat resources แยกจาก stat |
| [status-effects](../data/status-effects.json) | 20 status templates, params, การซ้อน/ลบ/ตาย/tick และการเปลี่ยนธาตุอาวุธ |
| [effect-primitives](../data/effect-primitives.json) | 10 primitives, event IDs, handler และ proc guard |
| [formula-registry](../data/formula-registry.json) | 6 named formulas พร้อม params schema/ชนิดผล; expression เป็นคำอธิบาย ไม่ใช่โค้ดที่นำไป eval |
| [schemas](../data/schemas/skill.json) | Draft 2020-12: common, modifier, predicate, selector, formula-call, effect, trigger, status, skill, item, patch |
| [composition-cases](../data/composition-cases.json) | fixture แยกจาก production content; inputs/expected arithmetic, validation errors, variants |

ขั้นตรวจคือ JSON parse แบบไม่ยอมรับ NaN/Infinity → schema/unknown fields → duplicate IDs → refs/params/context/units → resolve ทุก level → ตรวจ schema/ข้อจำกัดอีกครั้ง → compile build เป็น immutable snapshot ข้อผิดพลาดคืน `code`, `definition_id`, JSON pointer และรายละเอียด ไม่แอบใส่ default เพื่อให้ข้อมูลที่เสียเล่นต่อได้

เลขต้อง finite และอยู่ในขอบเขตที่ JavaScript แทนได้อย่างปลอดภัย (`abs <= 2^53-1`); เวลาเป็น integer game ms, HP/SP/จำนวนทรัพยากรเป็น integer, ratio 0.3 คือ 30% ค่า damage/heal จึงค่อยปัดที่ pipeline กลาง การบวกบัฟไม่มีเพดาน แต่ถ้าคำนวณเกิด overflow ให้หยุดพร้อม diagnostic เพื่อแก้ข้อมูล ไม่ clamp หรือทิ้งชั้นบัฟเงียบ ๆ

Schema รุ่นแรกปิด unknown properties และ status params เป็น closed numeric schema เท่านั้น ไม่มี external `$ref`, function text หรือ arbitrary expression สถานะใหม่เพิ่มเป็น catalog entry ได้ภายใต้ primitives เดิม ส่วน operation/parameter type ใหม่ต้องเพิ่ม schema/typed registry พร้อมเคสและ version อย่างชัดเจน

`plan/checks/composition.py` เป็นเครื่องมือตรวจ M0 ที่ใช้ Python 3 + `jsonschema >=4.18` ซึ่งมีอยู่ใน environment นี้ เรียก `python3 plan/checks/composition.py --write-report` เพื่อคำนวณใหม่และเก็บ input hashes ตัวตรวจนี้ไม่ใช่ validator/runtime TypeScript ที่จะใช้ในเกมจริง; TASK-015 ต้องสร้าง validator ที่ใช้ schemas เดียวกันและให้ผล error codes ตรงกัน

## Interfaces ที่ใช้เป็นขอบเขตตอน implementation

```ts
type DefinitionId = string; // ID ที่ผ่าน schema + catalog resolution
type GameMs = number;       // integer >= 0; virtual time ของไฟต์
type SourceRef = Readonly<{
  instance_id: string; owner_actor_id: string; definition_id: DefinitionId;
  origin_actor_id: string; origin_life_epoch: number;
}>;
type ContentError = Readonly<{
  code: string; definitionId: string; pointer: string; detail: string;
}>;
type Result<T> = { ok: true; value: T } |
                 { ok: false; errors: readonly ContentError[] };
type FormulaParams = {
  physical_power: { attack_ratio: number; flat_power: number };
  magical_power: { attack_ratio: number; flat_power: number };
  healing_power: { attack_ratio: number; flat_power: number };
  flat_power: { amount: number };
  sp_burst_power: { attack_ratio: number; sp_ratio: number; flat_power: number };
  event_damage_power: { ratio: number };
};
type FormulaContext = Readonly<{
  casterSnapshot: Readonly<ResolvedCombatStats>;
  preCost: Readonly<{ sp: number; spirit_spheres: number }>;
  event?: Readonly<{ hpDamage: number }>;
}>;
// ResolvedCombatStats keys/units มาจาก stat-definitions; ไม่ใช่ dynamic arbitrary key
type OutcomeKey = Readonly<{
  actionId: string; effectId: string; targetId: string; hitIndex: number;
}>;
type DamageOutcome = OutcomeKey & Readonly<{
  kind: "damage"; landed: boolean; crit: boolean; raw: number;
  mitigated: number; absorbed: number; hpDamage: number; overkill: number;
}>;
type StatusInstance = Readonly<{
  instance_id: string; status_id: DefinitionId; source: SourceRef;
  carrier_actor_id: string; applied_at: GameMs; expires_at: GameMs;
  params: Readonly<Record<string, number>>; offense_snapshot: ResolvedCombatStats;
  weapon_element_snapshot: Element; next_tick_at: GameMs | null;
}>;
type ShieldInstance = Readonly<{
  instance_id: string; source: SourceRef; carrier_actor_id: string;
  expires_at: GameMs; remaining: number; dispelable: boolean;
}>;

validateContent(raw: unknown, catalogs: Catalogs): Result<ValidatedContent>;
compileBuild(input: BuildInput, content: ValidatedContent): Result<ResolvedBuild>;
evaluateFormula<K extends keyof FormulaParams>(
  id: K, params: Readonly<FormulaParams[K]>, context: FormulaContext
): Result<number>; // raw power, ไม่มี RNG/state writes
planHandler(id: HandlerId, params: HandlerParams, ctx: HandlerContext):
  Result<readonly EffectIntent[]>;
applyProgram(program: ResolvedProgram, ctx: ProgramContext, state: BattleState):
  Result<{ state: BattleState; outcomes: readonly EffectOutcome[];
           pendingReactions: readonly ReactionEvent[] }>;
```

นี่เป็น interface specification; `BuildInput`, `Catalogs`, `ResolvedProgram`, `EffectIntent` ใช้ tagged unions ตาม schemas ไม่ใช่ dictionary ที่ยอมรับ key ใดก็ได้ รูปครบของ account/build/actor state และ module owner อยู่ใน TASK-013 Runtime และ headless runner ต้องเรียก implementation เดียวกัน ไม่มีสมการอีกชุดใน UI, SQL หรือ renderer

## Skill, Passive, Item และแหล่ง modifier

Active ระบุ class/unlock/max level, numeric level curves, cost, timing, named selectors, `start_effects` และ ordered `effects` Passive มี modifiers/triggers แทน cost/timing/effects; เรียนแล้วมีผลอัตโนมัติ ไม่ใส่ในสี่ช่อง ชุดตัวอย่างไม่มีภาพประกอบและไม่ใช่ production skill IDs

`level_parameters.power=[2,2.2]` ต้องมีจำนวนเท่ากับ max_level ทุกจุดที่ใช้ `{"level_param":"power"}` ถูกแทนก่อนตรวจ params; ห้ามอ้าง curve หาย/ข้าม level ส่วน `status_param` ใช้ได้เฉพาะใน status template แล้วผูกจาก application params ไม่ให้อยู่ใน Active/Item โดยไม่ได้ resolve

Item/Card ใช้ modifiers/triggers ชนิดเดียวกับ Passive ชื่อแสดง/ภาพเป็น refs ภายนอก engine อาวุธมี weapon_type; armor ทุกอาชีพใช้ร่วมกันและ weapon compatibility อยู่ใน TASK-009 Tier/rarity multipliers ที่เพิ่มภายหลังต้องออกมาเป็น source modifiers ผ่านสูตรเดิม ไม่เพิ่มสูตรเฉพาะ Item อีกชุด Rarity/refine/enchant/cards และราคายังไม่ถือว่าเสร็จจาก schema นี้

Runtime ติด `source_instance_id` ให้ Item instance, learned Passive instance, card instance และ status application เอง Content ไม่มีสิทธิ์อ้าง source ของคนอื่น การถอด/หมดอายุลบ source นั้นแล้ว resolve ใหม่ ห้ามแก้ base stat เพิ่มทีละชั้นแล้วพยายามลบย้อน เพราะทำให้ drift/หลงค้างได้

ลำดับคือ primary `(base+Σflat)*(1+Σpercent)` → derived จาก primary ที่ resolve แล้ว → derived `(formula+Σflat)*(1+Σpercent)` → bonus ratios/flats เป็น `Σadd_flat` เช่น crit_chance_bonus +0.1 หมายถึงเพิ่ม 10 percentage points; ห้าม `add_percent` กับ bonus ที่ฐานเป็นศูนย์ ทุกบัฟของ stat/bucket เดียวบวกกัน ไม่มีคูณแยกแต่ละแหล่งหรือ hard/soft cap

Modifier predicates รุ่นแรกใช้ has_status/has_tag บน self และ all/any/not เท่านั้น ไม่ให้อาศัย HP% หรือ stat ที่กำลังคำนวณจนเกิดวง MaxHP↔condition เงื่อนไข HP% ใช้ใน effect/trigger ได้ การเพิ่ม conditional stats แบบอื่นภายหลังต้องกำหนด dependency/evaluation phase ก่อน

## เป้าและ ordered outcomes

Selectors มี team/life/select/count/phase/missing `front_first` เลือกหนึ่งตัว เรียงแนวหน้า→หลัง→actor ID; `lowest_hp_percent` เรียงสัดส่วน→actor ID; all ใช้ actor ID และ random_n เริ่มจากรายการ actor ID เดิมแล้วสุ่มแบบไม่คืนตัวอย่าง count ใช้เฉพาะ random_n เท่านั้น Allies รวม self ถ้ายังเข้าเกณฑ์ ทุกแบบกรอง targetable ก่อน

Binding resolve ครั้งเดียวต่อ activation ตาม phase ถ้า cast_start ล็อกเป้าแล้วตายก่อน resolve: skip ข้ามเป้า; reselect_once เลือกใหม่หนึ่งรอบเฉพาะเมื่อไม่มีเป้าที่ล็อกไว้เหลือเข้าเกณฑ์ ไม่เติมเป้าใหม่กลาง multi-hit `cast_resolve` เลือกจากสถานะปัจจุบัน ถ้าไม่มีเป้า effect ข้ามและไม่คืน SP การใช้หลาย effects บน binding เดียวกันไม่เลือกคนละชุดใหม่

`self` คือผู้ใช้สกิล/ผู้สวมของ/ผู้ถือ Passive; ใน status คือผู้ติดสถานะ ส่วน `source_actor` คือผู้สร้างความสามารถ เช่น caster ของ Poison ซึ่งอาจตายแล้ว Event bindings อ่านผู้กระทำ/ผู้รับตาม event; source ที่เป็น null ทำให้ binding ว่าง ไม่เดาเป็น self

Effects ทำตามลำดับ และเก็บ outcomes ตาม `(action_id,effect_id,target_id,hit_index)` การเช็ค hit_landed ต้องอ้าง damage effect ก่อนหน้า, binding เดียวกัน, same_target และ hit_index ที่มีอยู่/any ถ้า A โดนแต่ B หลบ จะสตันได้เฉพาะ A ถ้าโล่รับหมดแต่ landed=true ยัง proc แบบ on-hit ได้ ถ้าเป้าตายกลาง multi-hit ให้ข้าม hit ที่เหลือกับเป้านั้นโดยไม่สุ่มเพิ่ม ไม่เลือกเป้าใหม่และไม่ลามผลไปเป้าอื่น

Predicate ของ effect จำกัดว่าจะเกิดผลนั้นหรือไม่; False ไม่ roll effect chance และไม่รอคิวให้นานขึ้น ท่าโจมตีเป้าพิษจึงยังออกเมื่อไม่มีพิษ เพียงไม่เกิด bonus effect `when` ของ Trigger ใช้ event context เท่านั้น ไม่อ้าง prior effect outcome นอก program; actor=target ใน Trigger predicate เป็น alias ของ event_target และต้องเป็น event ที่มี target จริง

## ต้นทุน สูตรและ handler

Skill.cost เป็นผู้หัก SP/ลูกแก้วครั้งเดียว ณ cast start ตรวจทุกต้นทุนให้พอก่อน commit การขาดทรัพยากรใช้กฎข้ามช่องเดิม ไม่มีการใช้ไปบางส่วน `sp.mode=all_current` เก็บค่า pre_cost แล้วหัก SP ที่มีทั้งหมด สูตร sp_burst_power อ่านค่านี้ ไม่หักซ้ำ และเมื่อถูกขัดก็ไม่คืน ตัวคูณ/flat เป็น raw ต่อ hit ก่อน defense/crit/shield ตาม baseline15

`resource_change` ปรับ SP/ลูกแก้วในสนามผ่าน core, clamp ตาม resource bounds และเก็บ actual_delta ไม่แตะ wallet ทอง/crystal ค่า spirit_spheres สูงสุด5เป็นทรัพยากรเฉพาะบิลด์ Monk ไม่ใช่เพดานบัฟ ห้ามซ่อนการใช้ทรัพยากร self/source_actor ของ Active ไว้ใน start/resolve effects แทน cost การ drain ฝั่งศัตรูและ gain ใช้ primitive ได้

Formulas ที่ให้ raw damage ใช้กับ damage เท่านั้น Healing/Shield ใช้ healing_power/flat_power การสะท้อนเลือก event_damage_power จาก HP damage จริง ไม่รวม absorbed/overkill และต้องอยู่ใน damage event; `as_reflect=true` จึงลง origin=reflect ผ่าน mitigation กลางตามปกติ Trigger damage อื่นมี origin=proc; ไม่อาศัยชื่อสกิลหรือชื่อ effect แยกชนิด

`detonate_own_status` เป็น handler แรก: snapshot รายการ status บนเป้าที่ source actor ตรงผู้ใช้ → เรียง expiry/instance ID → เลือก max_consumed หรือทั้งหมด → consume รายการนั้นครั้งเดียว → emit raw damage เท่าจำนวน×power_per_instance ด้วย source/action เดิม ไม่กินพิษของ NPC อีกคน ไม่เรียก callback/DB/RNG/global clock และไม่เขียน HP เอง Handler ที่สุ่มในอนาคตต้องขอ draw ผ่าน injected context ตาม RNG contract เดียวกับ core

## Status, tick, shield และการตาย

ทุก status ใน catalog รุ่นนี้รับ application เป็น independent instance แต่ละครั้งมี ID/source/params/application/expiry ของตัวเอง บัฟทุก source รวมทั้งคนเดิมร่ายซ้ำบวกกัน ไม่มี cap/refresh/replace/strongest แต่ละ CC อยู่ช่วงเวลาของตัวเอง restrictions ใช้ union จึงไม่บวก duration ทับกันแบบ `old_end+new_duration` และ Chain CC ต่อได้ปกติ

Stun/Freeze ห้ามเริ่มสกิล/Normal Attack และขัดเฉพาะ cast ที่ interruptible; Silence ห้ามเริ่มสกิลแต่ไม่หยุด NA และไม่ขัด cast เดิมด้วยตัวเอง Freeze แตกเมื่อได้รับ HP damage มากกว่าศูนย์หลังหัก shield ผลที่เพิ่ง apply หลัง hit ไม่ถูก hit ก่อนหน้านั้นย้อนมาทำให้แตก Provoke เปลี่ยนเป้าของ hostile front_first/lowest_hp selector ไปหา source ที่ยังมีชีวิตตาม application ล่าสุด; all/random/self/dead selectors ไม่ถูกบังคับเป้า

`weapon_element` เป็น typed status property: การเปลี่ยนธาตุใช้ application ล่าสุดที่ยังมีผล, tie ด้วย instance ID ไม่เอาธาตุมาบวกเป็นตัวเลข เมื่อหมดอายุเผย instance ก่อนหน้าหรือธาตุอาวุธต้นแบบ นี่เป็นนโยบายค่าประเภท enum ไม่ใช่การจำกัดบัฟตัวเลข Damage ที่ระบุ element ชัดไม่รับ endow และค่าธาตุ weapon snapshot ตอนเริ่มร่าย

Status เก็บ params ตาม numeric parameter_schema ที่ปิด key; duration มาจาก resolved skill application เป็น integer>=1ms Poison/Regeneration ใช้ interval1000ms, tick_on_apply=false, offense snapshot ตอน application และ target mitigation/heal-received live ทุก tick ไม่นำ crit/hit ของ initial hit มาสืบทอด DoT source snapshot หมายถึง offense snapshot ของ action ที่สร้าง status; ระยะร่ายไม่เปิดช่อง snapshot ใหม่ตอน resolve ถ้าเลือก live_source แทน snapshot ต้อง source_death=remove เพื่อไม่อ่าน source ที่หายไปด้วยกฎแฝง

ช่วงอายุ `[apply,expiry)` และ expiry ก่อน tick ณ timestamp เดียวกัน เช่น 3000ms มี tick1000,2000 ไม่รวม3000 ถ้า tick_on_apply=true มี tick0ด้วย Source ตายปกติบัฟ/DoTยังอยู่ตาม catalog; target ตายลบ status/ticks ของ target; owner-bound ที่เลือก source_death=remove ลบเมื่อ source ตาย ทุก status/shield/summon จบเมื่อจบไฟต์ ห้ามยกชั้นบัฟไปไฟต์หน้า

Shield แยก pool ต่อ application, ใช้ก่อน HP เรียง expiry→instance ID หมด pool ลบ instance และไม่ทำ damage ย้อน Poison/ดาเมจหลาย hitผ่าน shield กลางทุก hit การ cleanse/dispel เลือก polarity/tags พร้อม permission ก่อน เรียง expiry→ID แล้วลบเป็นราย instance (`max_instances=null` คือทั้งหมด) ไม่ลบทุก source จากชื่อ status เดียวกัน ถ้า tags ว่างหมายถึงทุก tag ที่ permission อนุญาต

remove_status.permission=consume_own ไม่สน cleanse/dispel flag แต่ต้อง source_actor ตรงผู้ใช้เท่านั้น Shield ที่ dispelable ถูกนับเป็น buff/tag shield ในการ dispel; cleanse ไม่ลบโล่ `status_expired` ส่งเฉพาะหมดอายุตามเวลา ไม่ส่งซ้ำตอน cleanse/consume/death/battle-end cleanup

Revive ใช้ selector dead allies โดยตรง Ordinary heal ไม่มีสิทธิ์ยก HP0 ขึ้น Revive ตั้ง HP=floor(maxHP×hp_ratio) อย่างน้อย1 และ SP=floor(maxSP×sp_ratio), เพิ่ม life_epoch, เริ่ม SI ของช่องถัดไปที่ยังไม่ใช้, ไม่คืน SP/ย้อนช่องที่ใช้ไปแล้ว ยกเลิก events เก่าที่ไม่ถูกล็อกด้วย epoch/token เก่า Locked cast ที่ admission แล้วอาจปล่อย effects จนครบตามbaseline15 แต่ห้ามเขียน phase กลับทับ life_epoch ใหม่หลัง revive Mode ที่ตัดสิน all-dead ไปแล้วไม่เริ่ม cast ใหม่เพื่อ revive ย้อนผล

Summon ชี้ actor definition ที่ catalog ตรวจได้, มี owner/lifetime/max_owned ของ ability, replace_oldest หรือ skip เมื่อเต็ม อยู่ฝ่ายเจ้าของแต่ไม่ใช่ NPC roster/ช่องทีมสี่ตัว และไม่ป้องกัน party defeat เมื่อสมาชิกทีมตายหมด Summon prototype ระบุ targetable, actions และ lifecycle ในข้อมูล actor ของ TASK-008/011 ไม่เดาค่าจากชื่อ effect Pet ภายหลังเป็น actor อีกชนิดที่ใช้ engine เดียวกัน ไม่เพิ่ม slot ผู้เล่นเป็นเงื่อนไขใน core

## Triggers, ลำดับเหตุการณ์และ proc guard

| Event | ผู้ถือ trait ที่รับ event / event source → target |
| --- | --- |
| battle_start | ทุก actor ที่เข้าร่วม; ไม่มี event source/target |
| cast_start / cast_resolve | ผู้ใช้สกิล; source=ผู้ใช้, ไม่มี single event target ให้เดาสำหรับสกิลหมู่ |
| normal_attack_hit / damage_dealt | ผู้โจมตี; source=ผู้โจมตี → target=ผู้ถูกตี |
| damage_received | ผู้เสีย HPจริง>0; source=ผู้โจมตี → target=ผู้เสีย HP |
| control_applied / status_applied / status_expired | ผู้ติดสถานะ; source=ผู้สร้างสถานะ → target=ผู้ติดสถานะ |
| actor_death / ally_death | ผู้ตาย/เพื่อนฝ่ายเดียวกันที่ยังมีชีวิต; source=killer หรือ null → target=ผู้ตาย |

damage_dealt ใช้เมื่อ HP damage>0; normal_attack_hit ใช้ landed แม้โล่รับทั้งหมด `control_applied` เป็น successful Stun/Freeze ตาม hard_cc tag ใน catalog รุ่นนี้ จึงไม่เกิดจาก resisted application/บัฟ/Poison Silence เป็นการจำกัด soft control แต่ไม่ได้เพิ่ม resistance ผ่าน event นี้อัตโนมัติ

Cost/cursor commit ก่อน start_effects และก่อน enqueue cast_start reaction Offense/skill snapshots เก็บก่อน start_effects ตามbaseline15 จึงไม่ทำให้ self buff ใน start_effects เพิ่ม damage ของ cast เดียวกันโดยไม่ประกาศ พวก reactions เข้าคิวและ drain ที่ phase barrier ของ baseline15: periodic → completion batch → ready starts/NA ตามลำดับ ไม่เรียก trigger callback แทรกระหว่าง effects

Queue เรียง event sequence แล้ว source instance ID/trigger ID; reaction ที่สร้าง event ใหม่ต่อท้ายคิว inherited root_action_id/cause ancestry Trigger ต้องระบุ accepted_origins และ chance แบบ explicit รวมถึง limit_scope=none/per_root_action/per_battle กับ count; scope=none ไม่จำกัดจำนวน sibling hits ส่วน limit อื่นนับ successful trigger activations หลัง chance ผ่าน ไม่ใช่ cooldown รายสกิล

Reentry key คือ `(source_instance_id,trigger_id)` ถ้าเคยอยู่ใน ancestry เดียวกันให้ reject พร้อม outcome ไม่ให้ A→B→A วนไม่จบ แต่ hit ถัดไปที่เป็น sibling และการ์ด instance อื่นยังทำงานได้ การ์ด reflect ตัวอย่างรับเฉพาะ normal/skill จึงไม่สะท้อน proc/reflect ต่อไม่จบ ทุก chance attempt ที่มี target/predicate ผ่านใช้ RNG กลางตามbaseline15 แม้โอกาส0/1; predicate false/bindingว่าง/ancestry reject ไม่ draw

Event budget1,000,000/depth32เป็น diagnostic guard ไม่ใช่กฎตัดผลบัฟเพื่อบาลานซ์ Guard ที่ทริกเกอร์ต้องคืน scenario/seed/trace พร้อมสาเหตุและหยุดไฟต์นั้น ไม่สร้างรางวัลจากผลที่ตัดสั้น

Optional boss trait ตัวอย่างเพิ่ม cc_resistance_up +0.10 ต่อ successful hard CC เป็น independent buff อายุ6000ms ไม่มี cap และไม่ dispel/cleanse นับหลัง reaction ลงผลแล้วต่อการ roll ครั้งถัดไป ไม่ลด duration ที่ติดไปแล้ว ถ้ามีหลาย CC ใน completion batch เดียวกัน reactions ยังรอ barrier จึงใช้ resistance เดิมทั้ง batch ตัวอย่างนี้ไม่ติดให้บอสทุกตัว และยังไม่ใช่ค่าบอสทุกด่านที่ผ่านบาลานซ์

## Variants และข้อรับประกันที่ต้องทดสอบต่อ

Base definition immutable → เลือก skill level/resolve curves → awaken patches → artifact patches → scenario patches แล้วจึงสร้าง Battle instance แต่ละ actor มี resolved build ของตัวเอง ปิดไฟล์ definition/runtime mutation ข้าม actor

Patch ระบุ skill_id, effect_id, stage, priority และ ID; ห้ามอ้าง array index `set_param/add_param` รุ่นแรกแก้ typed numeric formula params; append_effect ต้องมี effect ID ใหม่ที่ตรง anchor การเปลี่ยน timings/target behavior ในอนาคตให้เพิ่ม typed patch operation พร้อม validation ห้ามรับ JSON pointer ใดก็ได้

เรียง stage→priority→patch ID แต่ถ้าเขียน param เดียวกันใน stage/priority เดียวกันให้ patch_conflict ไม่ใช้ last-wins เพื่อกลบปัญหา Missing effect/param คืน patch_anchor; append ID ซ้ำก็ error หลัง patch ตรวจ schema/context/params/outcomes ใหม่ทั้งหมด ค่า base2.0 → Awaken2.4 → Artifact+0.2=2.6 ใน fixture ขณะที่ actor อีกตัว/baseยัง2.0 และ append guard เฉพาะ variant

`composition-cases.json` ตรวจ arithmetic/invalid definitions และ isolated fixture transforms ได้ก่อนมี engine TASK-017/018 ต้องให้ runtime/runnerได้ผลเดียวกัน; TASK-029–034/041 วัดทุกสกิลจริง/หลาย encounter; TASK-013/014 ยังต้องปิด ownership/serialized actor build/version migration/account transaction และ acceptance matrix ทั้งเกม การผ่านงานนี้จึงไม่ใช่คำรับรองว่าไม่มี technical debt หรือว่าแพตช์ Hi-class ออกแบบเสร็จแล้ว
