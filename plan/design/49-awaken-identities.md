# Awaken — ผลเสริมเฉพาะสกิล (D160/TASK130)

24 ต.ค.2026 · ทั้ง152สกิล · ทุกช่วงตัวเลขคือ Awaken1→10 ไม่ใช่ค่าเลเวลปกติ

คงcurveพลังAwakenเดิมที่อิงbaseสูงสุด1.10→1.45, ราคา/ทุน/ID/CT/ACD/คิวและภาพจริง. เปลี่ยนโบนัสเหมารวมต้านสถานะ10%เป็นผลตามหน้าที่; FCPยังมีCCprotectionที่เป็นผลหลักเดิมและเพิ่มดาเมจสกิลให้ทีม. ไม่มีglobalCCimmunityหรือstacking capใหม่

เพิ่มhitด้วยงบดาเมจรวม+20%เท่ากันทุกท่าที่เพิ่ม ไม่เอาพลังต่อhitเดิมคูณจำนวนใหม่จนท่าที่เดิมhitเดียวดาเมจกระโดดหลายเท่า. Skill/normal/passiveใช้engineเดียวกับsimulation

Penetrationเป็นโบนัสเฉพาะdamage effectของท่านั้น พร้อมบัฟเจาะเกราะ5sให้ตี/ท่าถัดไป: snapshotที่cast startไม่ถูกแก้กลางทาง. SpellBreakerยังทำดาเมจเฉพาะขัดสำเร็จ แต่โบนัสตนเองได้เมื่อร่ายสำเร็จ. การร่ายถูกขัดไม่ปล่อยเอฟเฟกต์และไม่คืนSP/บอลตามเดิม

บัพ/ดีบัฟที่เพิ่มเก็บแต่ละinstance/expiryแยกและบวกไม่จำกัดตามกติกาเดิม. ลดเกราะ/เพิ่มดาเมจที่เป้ารับจากdamage riderต้องโจมตีโดน. โล่P.ATKใช้typedphysical_powerเดียวกับฮีลP.ATKโดยขยายเฉพาะcontextshieldที่อนุญาต;ไม่เพิ่มสูตรอีกชุด

| อาชีพ | สกิล | ผลเสริมใหม่ |
| --- | --- | --- |
| thief | Envenom | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| thief | Quick Step | คริเรท 5%–10% · 5s · self |
| thief | Sand Attack | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| thief | Backstep | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| thief | Double Attack | เจาะเกราะ +8%–16% (ติดตัว) |
| assassin | Sonic Blow | 4→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| assassin | Enchant Poison | เจาะเกราะ 12%–24% · 6s · self |
| assassin | Venom Dust | ลดเกราะ 10%–20% · 6s · foes |
| assassin | Rolling Cutter | เจาะเกราะ 12%–24% · 5s · self |
| assassin | Grimtooth | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foes |
| assassin | Dagger Mastery | คริดาเมจ +10%–20% (ติดตัว) |
| assassin | Poison Edge | ดาเมจสกิล +6%–12% (ติดตัว) |
| rogue | Strip Armor | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| rogue | Strip Weapon | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| rogue | Expose | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| rogue | Intimidate | เพิ่มดาเมจที่เป้ารับ 10%–20% · 5s · foe |
| rogue | Raid | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foes |
| rogue | Dodge | ตีปกติ +6%–12% (ติดตัว) |
| rogue | Dirty Tricks | ดาเมจสกิล +6%–12% (ติดตัว) |
| rogue | Plagiarism: Bash | ลดเกราะ 10%–20% · 6s · foe |
| rogue | Plagiarism: Heal | โล่ MATK ×57.75%–96.25% · friend |
| rogue | Plagiarism: Double Strafe | 2→3hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| rogue | Plagiarism: Fire Bolt | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| rogue | Plagiarism: Cart Revolution | ลดเกราะ 10%–20% · 6s · foes |
| assassin_cross | Soul Destroyer | เจาะเกราะ 12%–24% · 5s · self |
| assassin_cross | Meteor Assault | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foes |
| stalker | Chase Walk | คริเรท 5%–10% · 5s · self |
| stalker | Full Strip | เพิ่มดาเมจที่เป้ารับ 8%–16% · 6s · foe |
| swordsman | Bash | ลดเกราะ 10%–20% · 6s · foe |
| swordsman | Provoke | ลดเกราะ 10%–20% · 6s · foes |
| swordsman | Magnum Break | ลดเกราะ 10%–20% · 6s · foes |
| swordsman | Endure | สวนกลับ 40%–80% · 6s · self |
| swordsman | Sword Mastery | ดาเมจสกิล +6%–12% (ติดตัว) |
| knight | Pierce | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| knight | Twohand Quicken | คริเรท 5%–10% · 5s · self |
| knight | Brandish | ลดเกราะ 10%–20% · 6s · foes |
| knight | Battle Cry | คริดาเมจ 10%–20% · 6s · friends |
| knight | Counter Stance | เจาะเกราะ 12%–24% · 6s · self |
| knight | Veteran | ลดดาเมจ +2.5%–5% (ติดตัว) |
| knight | Weapon Drill | คริเรท +4%–8% (ติดตัว) |
| crusader | Holy Cross | 2→3hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| crusader | Auto Guard | สวนกลับ 40%–80% · 6s · self |
| crusader | Devotion | ลดดาเมจ 6%–12% · 6s · self |
| crusader | Grand Cross | ลดเกราะ 10%–20% · 6s · foes |
| crusader | Defender | ดาเมจสกิล 6%–12% · 6s · friends |
| crusader | Faith | ลดดาเมจ +2.5%–5% (ติดตัว) |
| crusader | Reflect | DEF +10%–20% (ติดตัว) |
| lord_knight | Aura Blade | เจาะเกราะ 12%–24% · 6s · self |
| lord_knight | Spiral Pierce | 5→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| paladin | Shield Chain | 5→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| paladin | Gospel | โล่ P.ATK ×50%–100% · friends |
| merchant | Mammonite | เจาะเกราะ 12%–24% · 5s · self |
| merchant | Cart Revolution | ลดเกราะ 10%–20% · 6s · foes |
| merchant | Loud Voice | ดาเมจสกิล 8%–16% · 6s · friends |
| merchant | Shield Break | เพิ่มดาเมจที่เป้ารับ 8%–16% · 6s · foe |
| merchant | Trading Stamina | ลดดาเมจ +2.5%–5% (ติดตัว) |
| blacksmith | Hammer Fall | ลดเกราะ 10%–20% · 6s · foes |
| blacksmith | Adrenaline | ดาเมจสกิล 6%–12% · 6s · friends |
| blacksmith | Weapon Perfection | คริดาเมจ 10%–20% · 6s · friends |
| blacksmith | Meltdown | เจาะเกราะ 12%–24% · 5s · self |
| blacksmith | Axe Tornado | ลดเกราะ 10%–20% · 6s · foes |
| blacksmith | Weapon Research | ดาเมจสกิล +6%–12% (ติดตัว) |
| blacksmith | Tempering | ลดดาเมจ +2.5%–5% (ติดตัว) |
| alchemist | Acid Terror | เจาะเกราะ 12%–24% · 5s · self |
| alchemist | Potion Pitcher | โล่ MATK ×42%–70% · friend |
| alchemist | Hell Plant | พลังต้นไม้เพิ่ม15%จากcurveAwakenเดิม; อยู่ 12–15s; จำนวนสูงสุดเดิม |
| alchemist | Bio Cannibalize | พลังต้นไม้เพิ่ม15%จากcurveAwakenเดิม; อยู่ 7.8–9.75s; จำนวนสูงสุดเดิม |
| alchemist | Demonstration | เจาะเกราะ 12%–24% · 5s · self |
| alchemist | Learning Potion | MATK +6%–12% (ติดตัว) |
| alchemist | Chemical Expertise | ดาเมจสกิล +6%–12% (ติดตัว) |
| whitesmith | Cart Termination | ลดเกราะ 10%–20% · 6s · foe |
| whitesmith | Maximum Overthrust | ดาเมจสกิล 8%–16% · 6s · friends |
| creator | Acid Demonstration | ลดเกราะ 10%–20% · 6s · foe |
| creator | Full Chemical Protection | ดาเมจสกิล 6%–12% · 6s · friends |
| archer | Double Strafe | 2→3hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| archer | Improve Concentration | คริดาเมจ 15%–30% · 6s · self |
| archer | Arrow Shower | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foes |
| archer | Crippling Shot | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| archer | Vulture Eye | คริดาเมจ +10%–20% (ติดตัว) |
| hunter | Spiral Volley | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| hunter | Hunters Mark | ลดเกราะ 10%–20% · 6s · foe |
| hunter | Ankle Snare | เพิ่มดาเมจที่เป้ารับ 10%–20% · 5s · foe |
| hunter | Claymore | ลดเกราะ 10%–20% · 6s · foes |
| hunter | Rapid Fire | 4→5hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| hunter | Follow-up Shot | เจาะเกราะ +8%–16% (ติดตัว) |
| hunter | Steel Crow | ดาเมจสกิล +6%–12% (ติดตัว) |
| bard | Performance Strike | เจาะเกราะ 12%–24% · 5s · self |
| bard | Healing Song | โล่ P.ATK ×26.25%–43.75% · friends |
| bard | Battle Song | ดาเมจสกิล 6%–12% · 6s · friends |
| bard | Dissonance | เพิ่มดาเมจที่เป้ารับ 8%–16% · 6s · foes |
| bard | Encore | เพิ่มดาเมจที่เป้ารับ 8%–16% · 5s · foes |
| bard | Music Lesson | ATK +6%–12% (ติดตัว) |
| bard | Breathing | SPสูงสุด +8%–16% (ติดตัว) |
| dancer | Hip Shaker | เจาะเกราะ 12%–24% · 5s · self |
| dancer | Gypsy Kiss | โล่ P.ATK ×26.25%–43.75% · friends |
| dancer | Lady Luck | คริดาเมจ 10%–20% · 6s · friends |
| dancer | Dance Protection | ดาเมจสกิล 6%–12% · 6s · friends |
| dancer | Encore | เพิ่มดาเมจที่เป้ารับ 8%–16% · 5s · foes |
| dancer | Dance Lesson | ATK +6%–12% (ติดตัว) |
| dancer | Breathing | SPสูงสุด +8%–16% (ติดตัว) |
| sniper | Falcon Assault | 5→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| sniper | Sharpshooting | เจาะเกราะ 12%–24% · 5s · self |
| clown | Arrow Vulcan | 9→10hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| clown | Marionette Control | ดาเมจสกิล 8%–16% · 6s · friends |
| gypsy | Tarot Card of Fate | เพิ่มดาเมจที่เป้ารับ 10%–20% · 6s · foe |
| gypsy | Moonlit Water Mill | โล่ P.ATK ×30%–50% · friends |
| acolyte | Heal | โล่ MATK ×57.75%–96.25% · friend |
| acolyte | Blessing | ดาเมจสกิล 8%–16% · 6s · friends |
| acolyte | Holy Light | เจาะเกราะ 12%–24% · 5s · self |
| acolyte | Increase Agi | ดาเมจสกิล 6%–12% · 6s · friends |
| acolyte | Meditation | SPสูงสุด +8%–16% (ติดตัว) |
| priest | Sanctuary | รับฮีลเพิ่ม 10%–20% · 6s · friends |
| priest | Impositio | คริดาเมจ 10%–20% · 6s · friends |
| priest | Magnificat | คืน SP 20–40 · friends |
| priest | Happiness Heal | โล่ MATK ×105%–175% · friends |
| priest | Kyrie | ฟื้นฟู 30%–60%MATK/1s · 5s · friends |
| priest | Healing Art | MATK +6%–12% (ติดตัว) |
| priest | Spirit Recovery | SPสูงสุด +8%–16% (ติดตัว) |
| monk | Call Spirits | ดาเมจสกิล 10%–20% · 6s · self / คืน SP 12–30 · self |
| monk | Triple Attack | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| monk | Finger Offensive | 5→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| monk | Asura | เจาะเกราะ 12%–24% · 5s · self |
| monk | Steel Body | สวนกลับ 40%–80% · 6s · self |
| monk | Iron Fist | ดาเมจสกิล +6%–12% (ติดตัว) |
| monk | Spirit Combo | เจาะเกราะ +8%–16% (ติดตัว) |
| high_priest | Assumptio | ฟื้นฟู 30%–60%MATK/1s · 5s · friends |
| high_priest | Basilica | ฟื้นฟู 30%–60%MATK/1s · 5s · friends |
| champion | Palm Strike | เจาะเกราะ 12%–24% · 5s · self |
| champion | Chain Crush Combo | 5→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| mage | Fire Bolt | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| mage | Cold Bolt | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| mage | Lightning Bolt | 3→4hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| mage | Soul Strike | 1→2hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| mage | Sp Recovery | SPสูงสุด +8%–16% (ติดตัว) |
| wizard | Storm Gust | เจาะเกราะ 12%–24% · 6s · self |
| wizard | Jupitel | เจาะเกราะ 12%–24% · 5s · self |
| wizard | Meteor | เจาะเกราะ 12%–24% · 5s · self |
| wizard | Quagmire | เพิ่มดาเมจที่เป้ารับ 8%–16% · 6s · foes |
| wizard | Heavens Drive | เจาะเกราะ 12%–24% · 5s · self |
| wizard | Amplified Magic | ดาเมจสกิล +6%–12% (ติดตัว) |
| wizard | Frost Control | ดาเมจสกิล +6%–12% (ติดตัว) |
| sage | Fire Endow | ดาเมจสกิล 8%–16% · 6s · friends |
| sage | Spell Breaker | เจาะเกราะ 12%–24% · 5s · self |
| sage | Dispel | เพิ่มดาเมจที่เป้ารับ 8%–16% · 6s · foes |
| sage | Psychic Bolt | เจาะเกราะ 12%–24% · 5s · self |
| sage | Voice Breaker | เจาะเกราะ 12%–24% · 5s · self |
| sage | Auto Bolt | เจาะเกราะ +8%–16% (ติดตัว) |
| sage | Wisdom | ดาเมจสกิล +6%–12% (ติดตัว) |
| high_wizard | Mystical Amplification | เจาะเกราะ 12%–24% · 6s · self |
| high_wizard | Napalm Vulcan | 5→6hit; ดาเมจรวมเพิ่ม20%จากcurveAwakenเดิม (ชดเชยพลังต่อhit) |
| professor | Double Casting | เจาะเกราะ 12%–24% · 6s · self |
| professor | Soul Change | คืน SP 20–40 · friends |

`damage.penetration_bonus` เป็น optional numeric/level reference หน่วยสัดส่วน บวกกับ penetration ใน offensive snapshot เฉพาะ effect นั้น ค่าเริ่ม0อ่านโปรแกรมเก่าได้เหมือนเดิม ไม่แก้ actor/snapshot หรือแอบเปลี่ยนทุกhitในcastอื่น; บัฟselfหลังresolveช่วยการตี/สกิลครั้งถัดไปแยกexpiryตามปกติ

## หลักฐาน

- [ก่อนปรับ](../evidence/task-129/README.md) frozenhash79ab9437 /14,168ไฟต์; ผลนี้คงไว้เป็นประวัติ ไม่ใช้แทนผลหลังแพตช์
- [ผลเทียบAwaken1](../evidence/task-130-high-90-awaken1-comparison.json) / [Awaken10](../evidence/task-130-high-90-awaken10-comparison.json): เพิ่ม832ไฟต์ ใช้บิลด์/initialstats/ราคา/ของ/seedเดิมที่assertเท่ากัน ไม่ค้นบิลด์ใหม่เพื่อทำให้ผลดูดี
- tests/game/awaken-identity.test.ts: ทุก152base/pricesไม่เปลี่ยน/152gains/ทุกrank/งบhitรวม/เจาะมีผลจริงกับท่านั้น/ฮีล+โล่P.ATK/ข้อความ; awakened-combat.test.tsใช้sharedengine+1x2x4/checkpoint

