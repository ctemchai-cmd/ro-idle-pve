#!/usr/bin/env python3
"""D172 now appends active Lv80/100 gear through high_gear.apply; cards are preserved.

Historical D068 (20 Oct 2026) generator description follows:

Keeps the reviewed 60 standard equipment definitions and 18 Bronze-era cards byte-for-byte (saves reference their IDs)
and appends, per tier 1/20/40/60:
  * a second weapon per weapon type (20 weapons per tier) that trades base power for a role bonus,
  * two more head/armor/garment/shoes variants and three more accessories (36 equipment per tier, 144 in total),
  * Lv.80 definitions of all 36 kinds under `future_definitions` (Hi-class milestone; not loaded, never dropped),
and 42 new cards named after RO monsters across the four tiers (60 cards in total), whose percentage bonuses keep
mattering late. Random option lines become Rare 1 / Epic 2 / Legendary 3 / Immortal 4 / Supreme 5.

Usage:  python3 plan/generators/items.py --write | --check
Values are assistant baselines (variant base = a fraction of the standard item of the same slot/tier, bonuses scale
with the random-option tier scale 1/1.5/2/2.5/3); TASK-041 measures them with the journey simulator.
"""
import argparse, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]; D = ROOT / 'plan/data'
ICONS = Path(__file__).with_name('item-icons.json')
TIERS = [1, 20, 40, 60]; FUTURE = 80
SCALE = {1: 1.0, 20: 1.5, 40: 2.0, 60: 2.5, 80: 3.0}
WEAPONS = ['sword', 'bow', 'staff', 'book', 'knuckle', 'axe', 'mace', 'dagger', 'whip', 'instrument']
MAGIC = {'staff', 'mace', 'book'}
def bonus(stat, value): return {'id': stat, 'stat': stat, 'op': 'add_flat', 'bucket': 'bonus', 'value': round(value, 4)}
def flat(stat, value): return {'id': stat, 'stat': stat, 'op': 'add_flat', 'bucket': 'derived', 'value': int(round(value))}
def primary(stat, value): return {'id': stat, 'stat': stat, 'op': 'add_flat', 'bucket': 'primary', 'value': int(value)}

# Second weapon of each type: (base multiplier, bonuses(s)) and RO item IDs for its icon per tier 1/20/40/60/80, Thai names.
WEAPON_B = {
  'sword': (0.88, lambda s: [bonus('crit_chance_bonus', 0.02 * s)], [1104, 1119, 1164, 1137, 1138], ['ฟัลชิออน', 'สึรุกิ', 'มุรามาสะ', 'เอ็กซ์แคลิเบอร์', 'มิสเทลเทน']),
  'dagger': (0.85, lambda s: [bonus('crit_damage_bonus', 0.08 * s)], [1204, 1219, 1228, 1225, 1237], ['คัตเตอร์', 'กลาดิอุส', 'คอมแบตไนฟ์', 'เมลเบรกเกอร์', 'กริมทูธ']),
  'axe': (0.9, lambda s: [bonus('armor_break_percent', 0.04 * s)], [1351, 1360, 1364, 1363, 1365], ['แบทเทิลแอกซ์', 'ขวานสองมือ', 'เกรทแอกซ์', 'บลัดดี้แอกซ์', 'ซาบาธ']),
  'bow': (0.9, lambda s: [bonus('hit_bonus', 0.03 * s), bonus('crit_chance_bonus', 0.01 * s)], [1704, 1716, 1720, 1719, 1722], ['คอมโพสิตโบว์', 'กักกุง', 'รูดราโบว์', 'โร้กมาสเตอร์โบว์', 'บาลิสต้า']),
  'knuckle': (0.88, lambda s: [bonus('outgoing_physical_bonus', 0.03 * s)], [1803, 1805, 1811, 1813, 1814], ['นัคเคิลดัสเตอร์', 'โฮรา', 'ฟิงเกอร์', 'ไกเซอร์นัคเคิล', 'เบอร์เซิร์ก']),
  'whip': (0.9, lambda s: [bonus('control_accuracy', 0.04 * s)], [1952, 1956, 1960, 1962, 1963], ['ไลน์', 'แรนเต้วิป', 'วิป', 'เซอร์เพนต์', 'แรปเจอร์โรส']),
  'instrument': (0.85, lambda s: [bonus('outgoing_healing_bonus', 0.04 * s), bonus('sp_regen_percent', 0.04 * s)], [1903, 1905, 1909, 1911, 1913], ['แมนโดลิน', 'ลูท', 'ฮาร์ป', 'กุมุงโก', 'กีตาร์ไฟฟ้า']),
  'staff': (0.88, lambda s: [bonus('outgoing_magical_bonus', 0.03 * s)], [1604, 1610, 1613, 1473, 1619], ['วันด์', 'อาร์ควันด์', 'ไมท์ตี้สตาฟ', 'สตาฟสฟิงซ์', 'สตาฟผู้รอดชีวิต']),
  'mace': (0.88, lambda s: [bonus('outgoing_healing_bonus', 0.05 * s)], [1504, 1513, 1522, 1528, 1530], ['เมซ', 'มอร์นิงสตาร์', 'สตันเนอร์', 'แกรนด์ครอส', 'มยอลนีร์']),
  'book': (0.85, lambda s: [bonus('sp_regen_percent', 0.08 * s)], [1551, 1552, 1553, 1556, 1557], ['ไบเบิล', 'แท็บเล็ต', 'ตำราคลื่นทะเล', 'ตำราวายุ', 'ตำราวันสิ้นโลก']),
}
# Armor-slot variants: key -> (modifier builder from the tier's standard numbers, icon IDs, names).
def armor_variants():
  return {
    'head': {
      'helm': (lambda t, s: [flat('physical_defense', 0.7 * t['head_mdef']), flat('max_hp', 0.25 * t['armor_hp'])], [2226, 2228, 2230, 2246, 2235], ['แคป', 'เฮลม์', 'เจมเมดแซลเล็ต', 'โกลเดนเกียร์', 'คราวน์']),
      'circlet': (lambda t, s: [flat('magical_defense', 0.6 * t['head_mdef']), bonus('outgoing_magical_bonus', 0.02 * s)], [2208, 2232, 2234, 2256, 2254], ['ริบบิ้น', 'เซอร์เคิลต์', 'ไดอาเดม', 'เขาราชันย์', 'ปีกเทวดา'])},
    'armor': {
      'robe': (lambda t, s: [flat('max_hp', 0.7 * t['armor_hp']), flat('magical_defense', 0.9 * t['armor_def']), flat('max_sp', 0.5 * t['acc_sp'])], [2321, 2325, 2327, 2343, 2345], ['ซิลค์โรบ', 'โรบนักบุญ', 'โฮลีโรบ', 'โรบแห่งการร่าย', 'เกราะเพลิงลูเซียส']),
      'suit': (lambda t, s: [flat('max_hp', 0.75 * t['armor_hp']), flat('physical_defense', 0.6 * t['armor_def']), bonus('evasion_bonus', 0.02 * s)], [2305, 2335, 2337, 2319, 2331], ['ชุดนักผจญภัย', 'ชุดจอมโจร', 'ชุดนินจา', 'แจ็กเก็ตประกาย', 'ชุดเกราะโซ่เบา'])},
    'garment': {
      'cape': (lambda t, s: [flat('physical_defense', 0.6 * t['garment']), bonus('evasion_bonus', 0.025 * s)], [2501, 2508, 2507, 2515, 2524], ['ฮูด', 'ผ้าคลุมเก่า', 'ผ้าคลุมมาร์ควิส', 'ปีกอินทรี', 'ผ้าคลุมวาลคิรี']),
      'manteau': (lambda t, s: [flat('magical_defense', 0.6 * t['garment']), bonus('control_resistance', 0.04 * s)], [2505, 2503, 2514, 2519, 2532], ['มองโต', 'ผ้าคลุมนักบวช', 'บ่าเกราะ', 'มองโตมอร์ริแกน', 'เสื้อคลุมมิธริล'])},
    'shoes': {
      'boots': (lambda t, s: [flat('max_hp', 0.6 * t['shoes_hp']), flat('physical_defense', 0.5 * t['armor_def'])], [2403, 2405, 2411, 2413, 2421], ['รองเท้า', 'บู๊ท', 'กรีฟ', 'โคทูร์น', 'รองเท้าวาลคิรี']),
      'sandals': (lambda t, s: [flat('max_hp', 0.5 * t['shoes_hp']), flat('max_sp', 0.6 * t['acc_sp']), bonus('sp_regen_percent', 0.06 * s)], [2401, 2407, 2409, 2417, 2422], ['แซนดัล', 'รองเท้าคริสตัล', 'รองเท้าส้นสูง', 'รองเท้าฟริกโก', 'แซนดัลสง่างาม'])},
    'accessory': {
      'power': (lambda t, s: [flat('max_sp', 0.3 * t['acc_sp']), bonus('outgoing_physical_bonus', 0.03 * s)], [2601, 2604, 2610, 2616, 2617], ['แหวน', 'ถุงมือ', 'แหวนทอง', 'แหวนคริติคอล', 'ถุงมือศักดิ์สิทธิ์']),
      'wisdom': (lambda t, s: [flat('max_sp', 0.3 * t['acc_sp']), bonus('outgoing_magical_bonus', 0.03 * s)], [2602, 2603, 2605, 2618, 2611], ['ต่างหู', 'สร้อยคอ', 'เข็มกลัด', 'ปลอกคอแมทเทียร์', 'แหวนเงิน']),
      'rosary': (lambda t, s: [bonus('crit_chance_bonus', 0.015 * s), bonus('hit_bonus', 0.015 * s)], [2607, 2608, 2615, 2609, 2612], ['กิ๊บ', 'ลูกประคำ', 'แหวนป้องกัน', 'แหวนกะโหลก', 'แหวนดอกไม้'])},
  }
SLOT_TH = {'weapon': 'อาวุธ', 'head': 'หมวก', 'armor': 'เสื้อเกราะ', 'garment': 'ผ้าคลุม', 'shoes': 'รองเท้า', 'accessory': 'เครื่องประดับ'}
# Cards: (id, Thai name, slot, tier, modifiers). Values: percentages by tier, flat by tier index.
def cards():
  v = lambda tier, a, b, c, d=None: {1: a, 20: b, 40: c, 60: d if d is not None else c * 1.33}[tier]
  out = []
  def add(cid, th, slot, tier, mods): out.append((cid, th, slot, tier, mods))
  # Tier 1 (chapters 1–2) — one more per slot next to the original three.
  add('card_fabre', 'การ์ดฟาเบร', 'weapon', 1, [bonus('hit_bonus', 0.03)])
  add('card_lunatic', 'การ์ดลูนาติก', 'head', 1, [primary('int', 2)])
  add('card_pupa', 'การ์ดพูปา', 'armor', 1, [flat('max_hp', 90)])
  add('card_spore', 'การ์ดสปอร์', 'garment', 1, [bonus('control_resistance', 0.03)])
  add('card_chonchon', 'การ์ดชอนชอน', 'shoes', 1, [bonus('evasion_bonus', 0.02)])
  add('card_rocker', 'การ์ดร็อกเกอร์', 'accessory', 1, [primary('str', 2)])
  table = {
    20: [('hydra', 'ไฮดรา', 'weapon', [bonus('outgoing_physical_bonus', 0.05)]), ('drainliar', 'เดรนไลเออร์', 'weapon', [bonus('outgoing_magical_bonus', 0.05)]),
         ('marc', 'มาร์ค', 'head', [flat('magical_defense', 20), bonus('control_resistance', 0.03)]), ('kukre', 'คุเคร', 'head', [flat('max_sp', 30), bonus('sp_regen_percent', 0.06)]),
         ('thara_frog', 'ธาราฟร็อก', 'armor', [bonus('guard_percent', 0.02), flat('max_hp', 150)]), ('pecopeco', 'เปโกเปโก', 'armor', [{'id': 'max_hp', 'stat': 'max_hp', 'op': 'add_percent', 'bucket': 'derived', 'value': 0.05}]),
         ('mantis', 'แมนทิส', 'garment', [bonus('evasion_bonus', 0.03)]), ('dokebi', 'โดเคบิ', 'garment', [flat('physical_defense', 18), flat('magical_defense', 18)]),
         ('zerom', 'เซรอม', 'shoes', [flat('max_hp', 220)]), ('andre', 'อังเดร', 'shoes', [bonus('outgoing_healing_bonus', 0.04), flat('max_sp', 20)]),
         ('savage', 'ซาเวจ', 'accessory', [primary('str', 3), bonus('crit_chance_bonus', 0.015)]), ('smokie', 'สโมคกี้', 'accessory', [primary('int', 3), bonus('control_accuracy', 0.03)])],
    40: [('minorous', 'มิโนรัส', 'weapon', [bonus('outgoing_physical_bonus', 0.07), bonus('armor_break_percent', 0.03)]), ('wraith', 'เรธ', 'weapon', [bonus('outgoing_magical_bonus', 0.07), bonus('penetration_percent', 0.03)]),
         ('deviruchi', 'เดวิรูชิ', 'head', [primary('int', 4), flat('max_sp', 40)]), ('marduk', 'มาร์ดุก', 'head', [bonus('control_resistance', 0.06), flat('magical_defense', 30)]),
         ('raydric', 'เรดริก', 'armor', [bonus('damage_taken_bonus', -0.04), flat('max_hp', 250)]), ('evil_druid', 'อีวิลดรูอิด', 'armor', [flat('magical_defense', 40), {'id': 'max_hp', 'stat': 'max_hp', 'op': 'add_percent', 'bucket': 'derived', 'value': 0.04}]),
         ('isis', 'ไอซิส', 'garment', [bonus('evasion_bonus', 0.045), bonus('crit_resistance', 0.04)]), ('sohee', 'โซฮี', 'garment', [bonus('control_resistance', 0.06), flat('max_sp', 30)]),
         ('verit', 'เวอริต', 'shoes', [{'id': 'max_hp', 'stat': 'max_hp', 'op': 'add_percent', 'bucket': 'derived', 'value': 0.06}]), ('kaho', 'คาโฮ', 'shoes', [bonus('sp_regen_percent', 0.09), flat('max_sp', 40)]),
         ('phen', 'เฟน', 'accessory', [bonus('control_accuracy', 0.06), primary('luk', 4)]), ('hode', 'โฮด', 'accessory', [primary('str', 4), bonus('crit_damage_bonus', 0.08)])],
    60: [('doppelganger', 'ดอปเปิลแกงเกอร์', 'weapon', [bonus('crit_chance_bonus', 0.05), bonus('crit_damage_bonus', 0.15)]), ('dark_lord', 'ดาร์กลอร์ด', 'weapon', [bonus('outgoing_magical_bonus', 0.1)]),
         ('abysmal_knight', 'อบิสมอลไนท์', 'weapon', [bonus('outgoing_physical_bonus', 0.1)]),
         ('osiris', 'โอซิริส', 'head', [bonus('healing_received_bonus', 0.08), flat('max_sp', 60)]), ('maya', 'มายา', 'head', [bonus('control_resistance', 0.08), flat('magical_defense', 40)]),
         ('golden_thief_bug', 'โกลเดนทีฟบัก', 'armor', [bonus('damage_taken_bonus', -0.06)]), ('turtle_general', 'เทอร์เทิลเจเนรัล', 'armor', [bonus('guard_percent', 0.04), {'id': 'max_hp', 'stat': 'max_hp', 'op': 'add_percent', 'bucket': 'derived', 'value': 0.05}]),
         ('stormy_knight', 'สตอร์มมี่ไนท์', 'garment', [bonus('evasion_bonus', 0.06), bonus('control_resistance', 0.05)]), ('garm', 'การ์ม', 'garment', [bonus('control_resistance', 0.08), flat('magical_defense', 40)]), ('moonlight_flower', 'มูนไลท์ฟลาวเวอร์', 'shoes', [bonus('sp_regen_percent', 0.12), bonus('outgoing_healing_bonus', 0.06)]),
         ('eddga', 'เอ็ดกา', 'shoes', [{'id': 'max_hp', 'stat': 'max_hp', 'op': 'add_percent', 'bucket': 'derived', 'value': 0.08}]),
         ('baphomet', 'บาโฟเมท', 'accessory', [bonus('outgoing_physical_bonus', 0.05), bonus('outgoing_magical_bonus', 0.05)])],
  }
  for tier, rows in table.items():
    for key, th, slot, mods in rows: add(f'card_{key}', f'การ์ด{th}', slot, tier, mods)
  return out

def tier_numbers(defs, tier):
  get = lambda slot, stat: next(m['value'] for d in defs if d['slot'] == slot and d['tier_level'] == tier and d.get('weapon_type') in (None, 'sword') for m in d['modifiers'] if m['stat'] == stat)
  return {'weapon': get('weapon', 'physical_attack'), 'head_mdef': get('head', 'magical_defense'), 'armor_hp': get('armor', 'max_hp'), 'armor_def': get('armor', 'physical_defense'),
          'garment': get('garment', 'physical_defense'), 'shoes_hp': get('shoes', 'max_hp'), 'acc_sp': get('accessory', 'max_sp')}
def extrapolate(defs):  # Lv.80 numbers continue the 40→60 step of every standard stat
  n40, n60 = tier_numbers(defs, 40), tier_numbers(defs, 60); return {k: n60[k] + (n60[k] - n40[k]) for k in n60}

def build(equipment, cards_doc, strings, icons):
  base = [d for d in equipment['definitions'] if d['id'].count('_') == 2 and d['id'].split('_')[-1].isdigit() and d['tier_level'] in TIERS]
  pres_base = [p for p in equipment['presentations'] if p['id'] in {f"visual_{d['id']}" for d in base}]
  defs, pres, future, names = list(base), list(pres_base), [], {}
  def icon(ro_id):
    hit = icons[str(ro_id)]
    return {'icon_asset_id': hit[0], 'meta_path': 'assets/ro/library/' + hit[1]}
  def emit(target, tier, did, slot, wtype, mods, ro_id, name):
    row = {'id': did, 'name_key': did, 'kind': 'equipment', 'slot': slot, 'weapon_type': wtype, 'tier_level': tier, 'required_level': tier, 'modifiers': mods, 'triggers': [], 'presentation_id': f'visual_{did}'}
    target.append(row); names[did] = f'{name} Lv.{tier}'
    if target is defs: pres.append({'id': f'visual_{did}', **icon(ro_id), 'basis': 'D-068 variant: RO item ID icon mapping (inventory icon only); stats newly designed'})
  for tier in TIERS + [FUTURE]:
    target = defs if tier != FUTURE else future; s = SCALE[tier]; t = tier_numbers(base, tier) if tier != FUTURE else extrapolate(base); i = (TIERS + [FUTURE]).index(tier)
    if tier == FUTURE:  # the standard kinds as future rows too
      for w in WEAPONS:
        mods = [flat('magical_attack', t['weapon']), flat('physical_attack', 0.4 * t['weapon'])] if w == 'book' else [flat('magical_attack' if w in MAGIC else 'physical_attack', t['weapon'])]
        emit(target, tier, f'equipment_{w}_80', 'weapon', w, mods, None, f"{SLOT_TH['weapon']}นักผจญภัย")
      for slot, mods in [('head', [flat('magical_defense', t['head_mdef'])]), ('armor', [flat('max_hp', t['armor_hp']), flat('physical_defense', t['armor_def'])]), ('garment', [flat('physical_defense', t['garment']), flat('magical_defense', t['garment'])]), ('shoes', [flat('max_hp', t['shoes_hp'])]), ('accessory', [flat('max_sp', t['acc_sp'])])]:
        emit(target, tier, f'equipment_{slot}_80', slot, None, mods, None, f'{SLOT_TH[slot]}นักผจญภัย')
    for w, (mult, extra, ids, th) in WEAPON_B.items():
      std = t['weapon']; mods = [flat('magical_attack', mult * std), flat('physical_attack', mult * 0.4 * std)] if w == 'book' else [flat('magical_attack' if w in MAGIC else 'physical_attack', mult * std)]
      emit(target, tier, f'equipment_{w}_{tier}_b', 'weapon', w, mods + extra(s), ids[i], th[i])
    for slot, variants in armor_variants().items():
      for key, (make, ids, th) in variants.items(): emit(target, tier, f'equipment_{slot}_{tier}_{key}', slot, None, make(t, s), ids[i], th[i])
  for d in future: d.pop('presentation_id', None)
  # D-099 owns card identities/art/slots; never regenerate the historical placeholder catalog.
  from item_impact import apply_roles
  apply_roles(defs)
  apply_roles(future)
  # Card identities/traits are owned by card_catalog and story expansion. Gear
  # regeneration must preserve their complete current document unchanged (D172).
  equipment = {**equipment, 'definitions': defs, 'presentations': pres, 'future_definitions': future}
  strings = {**strings, 'strings': {**strings['strings'], **names}}
  from high_gear import apply as apply_high_gear
  equipment, strings = apply_high_gear(equipment, strings)
  return equipment, cards_doc, strings

def main():
  ap = argparse.ArgumentParser(); ap.add_argument('--write', action='store_true'); ap.add_argument('--check', action='store_true'); a = ap.parse_args()
  icons = json.loads(ICONS.read_text())['icons']
  load = lambda name: json.loads((D / name).read_text())
  equipment, cards_doc, strings = build(load('equipment.json'), load('cards.json'), load('strings.th.json'), icons)
  rules = equipment['random_options']; rules['lines_by_rarity'] = {**rules['lines_by_rarity'], 'immortal': 4, 'supreme': 5}
  gacha = load('gacha.json'); gacha['definitions'] = [c['id'] for c in cards_doc['definitions']]; gacha['definition_weights'] = {c['id']: 1000 if cards_doc['origins'][c['id']].get('variant') == 'puppet' else {'normal':1000,'mini':100,'mvp':10}[cards_doc['origins'][c['id']]['grade']] for c in cards_doc['definitions']}
  gacha['definition_choice'] = "D-109: choose rarity then a matching fixed-monster card among all73 definitions, independent of equipment tier. Farm/Tower retain chapter/tier pools. Original MVP Legendary, Mini Epic, Puppet I Rare."
  loot = load('loot.json'); loot['gear']['definition_choice'] = 'uniform among the 36 definitions (20 weapons, 3 head/armor/garment/shoes, 4 accessories) of the stage tier; no class-specific armor'
  out = {'equipment.json': equipment, 'cards.json': cards_doc, 'strings.th.json': strings, 'gacha.json': gacha, 'loot.json': loot}
  text = {k: json.dumps(v, ensure_ascii=False, indent=2) + '\n' for k, v in out.items()}
  if a.write:
    for k, t in text.items(): (D / k).write_text(t)
  if a.check:
    ok = all((D / k).read_text() == t for k, t in text.items()); print(json.dumps({'matches': ok})); raise SystemExit(0 if ok else 1)
  print(json.dumps({'equipment': len(equipment['definitions']), 'future': len(equipment['future_definitions']), 'cards': len(cards_doc['definitions']), 'written': a.write}))

if __name__ == '__main__':
  main()
