# D183 — เปรียบการ์ดก่อน/หลัง

80ใบ;ปรับpower 79 ใบ (75ใบปรับroleเองและauto-growthที่เหลือ). 480กรณี=80×Lv1/5×3fixedbudgets. ไม่ใช่DPSอาชีพหรือผลทั้งไฟต์. 8matchedseedsต่อeffect;เงื่อนไขตรง/ไม่ตรงแยกกัน.

| การ์ด Lv1 | ตัวอย่างผลบนสเตตัสกลางเท่ากัน | ก่อน | หลัง |
| --- | --- | ---: | ---: |
| card_andre | ดาเมจกายภาพหนึ่งhit | +38.18% | +13.18% |
| card_abysmal_knight | ดาเมจสกิลเมื่อเจอบอส | +39.32% | +18.18% |
| card_imp | ดาเมจเวทหนึ่งhit | +39.32% | +18.18% |
| card_scaraba | ดาเมจเวทหนึ่งhit | +34.32% | +11.82% |
| card_fallen_bishop | ดาเมจเวทหนึ่งhit | +45.00% | +25.00% |
| card_time_holder | ดาเมจเวทหนึ่งhit | +35.91% | +21.59% |
| card_pupa | HPสูงสุด | +22.45% | +5.03% |
| card_pecopeco | HPสูงสุด | +5.00% | +9.00% |
| card_head_3 | SPสูงสุด | +155.14% | +42.14% |

Pupaมีguard2.5%เพิ่มด้วย;Pecoมีhealingreceived3.5%. HPเพียงคอลัมน์เดียวไม่ใช่คะแนนรวม. Andre ATK%raw35→10.5,ผลactualhit38.18→13.18รวมflat. Abysmalconditionalยังเป็น1procต่อrootเดิม ไม่แอบเปลี่ยนระบบhit/CC/RNG. คงธาตุ/เผ่า/sizeของมอนจริงและelementchartOrigin.

## บทบาทที่ปรับ

- `card_weapon_1`: normal attacker: crit+normal damage vs universal Andre
- `card_weapon_3`: crit build: chance+severity+normal attacks
- `card_head_2`: INT hybrid caster
- `card_head_3`: SP burst tradeoff; remove 131% SP growth
- `card_armor_1`: fortune/evasion with useful survival baseline
- `card_armor_2`: physical starter hybrid
- `card_armor_3`: INT and healing hybrid
- `card_garment_1`: evasion with normal attack baseline and ghost weakness
- `card_garment_2`: starter evasion+HP
- `card_garment_3`: wind counter with non-wind survival
- `card_shoes_1`: steady self regen and received healing
- `card_shoes_2`: STR/VIT bruiser
- `card_shoes_3`: HP with AGI and small mitigation
- `card_accessory_1`: STR normal attacker
- `card_accessory_2`: DEX skill accuracy
- `card_accessory_3`: AGI/evasion with normal damage
- `card_fabre`: weapon tank alternative
- `card_lunatic`: crit starter
- `card_pupa`: flat starter HP plus modest scaling and guard
- `card_spore`: VIT and healing received
- `card_chonchon`: AGI normal attacker with dodge
- `card_rocker`: DEX accuracy starter
- `card_kukre`: AGI normal attacker
- `card_thara_frog`: general mitigation and HP
- `card_pecopeco`: percentage HP and healing vs flat Pupa
- `card_mantis`: STR normal attacker
- `card_dokebi`: wind armor with general HP baseline
- `card_zerom`: DEX skill accuracy
- `card_savage`: VIT+DEF defensive alternative
- `card_smokie`: dodge with skill baseline
- `card_deviruchi`: blind immunity plus physical accuracy
- `card_marduk`: silence immunity plus caster sustain
- `card_marc`: freeze immunity plus general HP
- `card_raydric`: neutral specialization with HP baseline
- `card_evil_druid`: undead armor plus caster/HP baseline
- `card_isis`: dark counter with caster baseline
- `card_sohee`: SP sustain vs burst Incubus
- `card_verit`: balanced HP+SP
- `card_phen`: cast safety plus SP efficiency, smaller CSPD tradeoff
- `card_hode`: earth counter plus general DEF
- `card_doppelganger`: tempo and normal attacker
- `card_dark_lord`: magic counter with useful MATK baseline
- `card_osiris`: revive specialty plus HP/healing/SP sustain in ordinary fights
- `card_maya`: magic reflect with magic mitigation
- `card_golden_thief_bug`: magic mitigation +HP with SP tradeoff; no3-copy full immunity
- `card_turtle_general`: physical damage plus native Magnum proc
- `card_stormy_knight`: magic auto proc/freeze with general magic damage
- `card_garm`: freeze counter with general tank baseline
- `card_moonlight_flower`: mobility/tempo/evasion rather than movement only
- `card_eddga`: sustained tank with HP tradeoff
- `card_baphomet`: splash normal attacker with physical baseline
- `card_mastering`: fortune tank
- `card_vagabond_wolf`: physical normal attacker
- `card_dragon_fly`: evasion and normal attacker
- `card_angeling`: holy armor plus general survival/healing
- `card_deviling`: neutral counter plus HP baseline, elemental weaknesses retained
- `card_angeling_puppet`: HP/MDEF tank
- `card_deviling_puppet`: hybrid offense and mitigation
- `card_golden_thief_bug_puppet`: magic survival and SP
- `card_eddga_puppet`: large-target bonus with normal baseline
- `card_moonlight_flower_puppet`: small-target bonus with tempo baseline
- `card_baphomet_puppet`: DEF/SP plus useful HP baseline
- `card_doppelganger_puppet`: HP/crit resistance with tempo
- `card_agav`: MATK armor with DEF tradeoff
- `card_siroma`: general magical damage, lower than Rare Imp
- `card_imp`: general magical damage without healing bonus
- `card_necromancer`: INT and magic penetration
- `card_fallen_bishop`: MATK/healing with SP tradeoff
- `card_time_holder`: MATK/healing with SP cost tradeoff
- `card_hydra`: conditional bonus with smaller root-hit burst and useful unmatched baseline
- `card_drainliar`: conditional bonus with smaller root-hit burst and useful unmatched baseline
- `card_minorous`: conditional bonus with smaller root-hit burst and useful unmatched baseline
- `card_kaho`: conditional bonus with smaller root-hit burst and useful unmatched baseline
- `card_abysmal_knight`: conditional bonus with smaller root-hit burst and useful unmatched baseline
- `card_wraith`: caster sustain with additional undead hunting proc

ไฟล์audit.csvมีค่าจริงทุกกรณี; audit.json.gzเก็บรายงานเต็มรวมmodifierและbaseline. ไม่รวมtempo/regen/เงื่อนไขเป็นคะแนนเดียวหรือรับประกันสมดุลทุกบิลด์.
