# D169 — Hi-class / modern migration v2

25 ตุลาคม 2026 · TASK143–145 · คำขอหลัก assets/modern/migration-v2.txt เก็บ verbatim.

21ภาพ/20Hi skillsตามพาธจริง. Logical IDsเดิมอยู่ครบแม้ชื่อBasilica→Bond Fate, PalmStrike→Dragon Tiger Combo, ChainCrush→Gate of Hell, SoulChange→Psychic Wave. Ruwachใช้priest13แทนnative24icon แต่ยังใช้nativeRuwachsoundและauthoredholyburst. AssCrossและStalkerทั้งicon/VFXใช้presentationpurple160degโดยไม่เปลี่ยนsourcepixels. งานนี้ไม่เปิดClass3/Artifactหรือเปลี่ยนrank schedule/ราคาสกิล/primary growth.

## คำตอบผู้ใช้

- Double Casting: สุ่มตัวคูณสูงก่อน x4→x3→x2;หยุดที่ตัวแรกติด ไม่บวกโอกาสเกิน100%.
- Bond Fate: 10s ล็อกเพื่อนที่มีmax(P.ATK,M.ATK)สูงสุด ณ resolve;เริ่มฮีลทันทีแล้วทุกวินาที.
- Gate: เหลือ1%maxHP คิดactual HPที่เสีย/maxHP เช่นfull→1%ได้1.99,20→1ได้1.19.
- Chase Walk: รอสกิลโจมตีถัดไปทั้งท่า ตีปกติไม่กินบัฟ.

## ตัวเลขที่ผู้ใช้ระบุและ baseline ที่เติม

ตัวเลขที่ไม่ได้ระบุในคำขอเป็นassistantbaseline ต้องตรวจboundedbefore/after145 ไม่ใช่สูตรROต้นฉบับหรือคำรับรองDPSทุกบิลด์.

| สกิล | base1→10 / ผล |
|---|---|
| Assumptio | DEF/MDEF +50→100%, fixed10s;Aw110→145%,10s |
| Bond Fate | เลือกliving party allyไม่รวมผู้ร่าย/ไม่เลือกsummon;lane P/Mที่สูงกว่าเพิ่มflat40→60%casterM.ATK(เสมอเลือกP);ฮีล80%M.ATK0..9s,10s. Awเพิ่ม66→87%+ฮีล88→116%M.ATK/วิ10s |
| Shield Chain | 5hitsรวม700→1200%P.ATK,สตัน1→2sเมื่อโดน |
| Gospel | gameplayเดิม,ภาพpaladin16 |
| Aura Blade | P.ATK12→25%,เพิ่มคริ3→6%/คริดาเมจ4→8%/สกิล3→6%,8s |
| Spiral Pierce | 5hitsรวม750→1150%P.ATK,เจาะ10→20%,ขัดร่ายเมื่อโจมตีโดน |
| Dragon Tiger Combo | 6hitsแบ่งงบเดิมรวม550→900%P.ATK,เฉพาะท่าคริ+50%;Awเพิ่มคริดาเมจ20→40%และงบ990→1305%;ไม่เพิ่ม6เท่าซ้ำจากต่อhit |
| Gate of Hell | 1hit500→800%P.ATK×(1+actual HPเสีย/maxHP),5balls,Aw880→1160%×HPfactor+เจาะ20→35% |
| Mystical Amplification | M.ATK10→20%,คริ3→6%/คริดาเมจ4→8%,10s;ระหว่างบัฟเวททำคริได้และsnapshotเมื่อเริ่มร่าย |
| Napalm Vulcan | งบดาเมจเดิม;เพิ่มคำสาปรับดาเมจ+10→50%6sหลังโดน ไม่เพิ่มซ้ำกับhitแรกของตัวเอง |
| Double Casting | เฉพาะFire/Cold/LightningBoltและRoguecopyFireBolt;10s. Basex2chance30→50%/x3 10→25%. Awx2 55→75%/x3 27.5→40%/x4 5→15%. สุ่มครั้งเดียวต่อBoltทั้งท่าและเพิ่มจำนวนhit ไม่เสียSP/คิวเพิ่ม |
| Psychic Wave | AoE6ticksทันที0..5s,100→160%M.ATKต่อtick,slow15→30%6s,ขัดร่ายทุกtick;bossfocus+.35เดิม. Awtick176→232%+เจาะ15→30% |
| Soul Destroyer / Meteor Assault | เปลี่ยนภาพ+purple;เริ่มคงpowerเดิม ตรวจเทียบก่อนตัดสินปรับ |
| Chase Walk | charge10s:สกิลโจมตีถัดไปทั้งท่าignoreDEF;ตีปกติไม่กิน. Awเพิ่มคริดาเมจ20→40%เฉพาะท่านั้น |
| Full Strip | single600→1000%P.ATKแล้วลดDEF/MDEF16→30%และP.ATK/M.ATK16→30%10sเมื่อโดน;Aw1100→1450%+localเจาะ15→30%+Expose10→20%6s |
| Cart Termination | ภาพใหม่ ผลเดิม |
| Maximum Overthrust | บัฟทีมP/M.ATK30→50%+เจาะ10→20%,10s;Aw55→72.5%+22→29%,11s |
| Full Chemical Protection | ล้างdebuff/CCresist25→50%เดิม+guard15→25%และshield150→250%P.ATK10s;Aw275→362.5%shield+guard27.5→36.25%11s |

Awakenอื่นใช้ผลหลัก110→145%baseMaxและeffectเฉพาะที่ระบุ;ถ้าเพิ่มhitsให้แบ่งtotalbudget. SP/CT/ACD/pricesเดิม ยกเว้นGateballs3→5ตามคำขอ. เริ่มร่ายจ่ายSP/ballsและเสียช่องตามเดิม. Gateจ่ายHPเมื่อเกิดผลและมีเป้าจริง;ถ้าร่ายถูกขัดไม่ลดHPเพิ่ม แต่SP/ballsไม่คืน. HPไม่ผ่านshield/guard/crit/redirect ไม่triggerdamage_received/ไม่คิดเป็นtankหรือenemyDPS และไม่ทำให้ตายเอง;HPต่ำกว่า1%ไม่ถูกฮีลกลับขึ้น. Formulaใช้maxHPปัจจุบันและHPที่เสียจริง ณ resolve.

## Typed composition / lifecycle

เพิ่มselector highest_attack +exclude_self/actor_kind, deterministictiesactorID. เพิ่มpredicate stat_compareจำกัดstatที่กำหนด. apply_status.parameter_formulasใช้registryformulaบริสุทธิ์คำนวณflatamountจากcasteroffensesnapshot ไม่evalJSและตรวจparamsก่อนบันทึก. Bondทั้งflatbuffกับHoTอยู่ในstatusinstanceเดียว/lifeSource:remove;เพื่อนตาย/ผู้ร่ายตาย/หมดเวลา/ถูกdispelตัดเส้นทันที. Recastมีapplicationแยกตามนโยบายเดิม ไม่refreshหรือcap.

Statusdamage_chargeเป็นconsumableapplicationแยก1instanceต่อeligibleaction (เก่าสุดก่อน),consumeเมื่อสกิลโจมตีเกิดผลและใช้กับทุกhit/targetในrootนั้น;miss/ไม่มีเป้าต้องไม่แอบเพิ่มดาเมจหรือดึงคิว. ไม่ใช้กับnormal/periodic/proc,ไม่recursion. Multiplechargesเก็บไว้ใช้สกิลถัดไป ไม่มีstackcap. ถ้าร่ายถูกขัดก่อนresolveยังไม่กินcharge.

Statusskill_echoมีorderedtiersและwhitelistlogicalIDs;เฉพาะskill origin. สุ่มสูงก่อนต่อinstanceหนึ่งครั้งต่อroot,เพิ่มhitsทั้งท่าจากoffensesnapshotเดิม. หลายbuffinstanceบวกเฉพาะextra repeats:1+Σ(multiplier−1),ไม่คูณทบและไม่ใช้strongest/refresh. RNGinjected/ไม่มีwallclock. Descแสดงโอกาสconditionalและexpectedoutcomeแยกในreport (baseMaxx3=.25,x2=.375,x1=.375;AwMaxx4=.15,x3=.34,x2=.3825,x1=.1275).

Statusallows_magical_critเป็นflagtyped;cast/statusperiodicเก็บoptionalflagร่วมsnapshotเมื่อจำเป็นเพื่อให้buffหมดระหว่างร่ายไม่เปลี่ยนhitกลางคัน. Legacyไม่มีflagให้false,ไม่เปลี่ยนRNG/ผลเดิม. effectprimitive sacrifice_damageใช้damagepipelineเดิมหลังหักHPครั้งเดียวต่อeffect/root ไม่สร้างdamage/triggerchainเพื่อหักเลือดตัวเอง.

Rendererอ่านvisual_linkที่projectedจากstatusข้อมูล ไม่คำนวณบัฟ/เป้าหมายเอง. Linkลากระหว่างตำแหน่งจริงที่มีชีวิตและตามเวลาเกม,ลดmotionเมื่อผู้ใช้ตั้งไว้;timeline/catalog/ผลตัวเลขมาจากsharedengine. Purpleเป็นpresentationเท่านั้น.

## Review boundary

Freeze143before bundle+authored52inputs. 143ตรวจasset/sourceSHA/packไม่แก้mechanics;144ตรวจschema/engine/data/rank/paidhistory;145fullTS/M0/root-filtered/native320390+actualbalancedpairedbench+Vercel/hosted. Oldreceipts/10slots/backupmigrationretainIDs/ledger;ไม่มีownercloudmutation/SQL/env/6173restart. Boundedbenchmarkวัดหลายloadoutภายใต้costเท่ากัน/neutralboss/dummyและpressure,แสดงskill/normal/HPcost/heal;ไม่อ้างglobalDPSbalanceจากunitหรือsupportDPSต่ำ.

## Bounded review refinement

First-pass1828fightsพบAura/Mysticalเพิ่มcrit+critdamageซ้อนpowerเดิมและSpiralpenทำให้LK/HWสูงเกิน. ปรับเฉพาะ4selectedHi definitions(Aura/Mystical/Spiral/NapalmAw),ไม่nerfClass2/อาชีพอื่นหรือใช้hiddenmultiplier. เก็บNapalmBasecurse10→50%ตามผู้ใช้;Awcurse55→60%. ลดrawP/Mbuffเพื่อแลกcrit/critdamage/skillutilityใหม่. SpiralAw6hitsรวม1265→1667.5%+pen22→29%,ยังได้interrupt. Finalmatchedrunแยกจากfirstpassและเก็บfirstpassไว้.
