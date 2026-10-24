# TASK137 — Grimtooth625% และ AssassinCross อยู่ในกรอบ

ผู้ใช้อนุมัติGrim625%และลดท่าอื่นถ้าAssXเกิน9–11k. BaseGrim375–625%P.ATK (เดิม262.5–437.5),Aw687.5–906.25%,คง1hit/AoE/weapon/crit/focus+.35/Expose10–20%6s/SP36/CT500/ACD1000. เพิ่มทั้งcurveตามสัดส่วนเดิม ไม่แตะราคา/levelcaps/loadout/investments.

พบSonicAwกินสัดส่วนสูง3937DPSในGrim-onlycandidate:ปรับเฉพาะSonicAw6hitdirecttotalเป็น112–128%ของSonicbaseMax (เดิม132–174%),จึงยังเหนือbaseMaxทุกrank. Sonicbase/EP/primary/normal/passive/crit/คิวและอาชีพอื่นเหมือนเดิม. Scopeguardเปรียบทุกfieldกับfrozenก่อนแก้;historytestsnormalizeเฉพาะ3powercurvesที่มีnewexactguard. RawgoldensGrim3casesปรับตาม375/458.3333/625;ไม่เปลี่ยนผลวัดเก่า.

## ผล actual shared engine

CommonLv60หกช่อง/allocbudgetเท่ากัน/4Actives/90sneutralboss;High90ใช้ActiveAw10และbasePassives. คัด3seeds12901–12903,ตรวจ16holdout22901–22916. ทดลองชุดเดิมและแทนแต่ละdamage-slotด้วยGrim รวมชุดที่ไม่มีSonicเพื่อหาทางหลบnerf;dummyและpressureแยกกัน. ต้นทุน/primary/initialstatsA-Bตรงกัน. ก่อนแก้ใช้deployedee411/D165capsจริง ไม่เอาตัวเลข132มาlabelใหม่.

| เงื่อนไข/ชุดเดิมคงที่ | ก่อน | Grimอย่างเดียว | หลังลดSonicAw | Normalหลัง | Skillหลัง |
| --- | ---: | ---: | ---: | ---: | ---: |
| Class2Lv70/Grim+RollingCutter+Sonic+Envenom |4292.58|4523.83|4523.83|1050.28|3473.54|
| High90/EP+Grim+Meteor+Sonic |11229.72|11975.42|10934.88|2414.09|8520.79|
| High90/winner132ที่ไม่มีGrim |10908.86|10908.86|10016.60|2272.44|7744.15|

HighselectedGrimmean10934.88,95%RNGCI10907.73–10962.03ผ่าน9–11k. การเพิ่มGrimอย่างเดียวเกินกรอบจริง11975.42 จึงทำnerfตามผู้ใช้อนุมัติ. Expandedcandidateก่อนแพตช์11229.72สูงกว่าwinner132เพราะชุดเดิมไม่เคยใส่GrimในHighcandidateชุดนั้น;รายงานเปิดเผยselection gap ไม่อ้างว่าenginebug. Class2priorbuildอีกชุด4242.22→4537.37(heldoutอาจสลับอันดับเล็กน้อย);ไม่อ้างexhaustivebest.

Publishedfinal1680fights=1488screen+selected/fixedA-B/replaysและ192growth. InitialGrim-only1548fightsเก็บresults-grim-only/growth-grim-only/content-grim-onlyแยก. รวม3228logicalauditfights;มีredundant600screenworkerที่เริ่มก่อนcodegenfinalและได้hash80cabเก่าไม่ใช้merge(บันทึก/private/tmp/task137-final-screen1.log). ไม่rerollseedหรือrelabelผลเก่า. Finalhash e49a29da3af254e68e65f9659d99bf5a8ade9efeaefe95920937a075713114ec. GrowthLv40/gear40,Class270gear1/20/40,High90base/Aw1ทั้ง6เงื่อนไขอยู่growth.json. High base 5679.94→6137.34 / High Awaken Lv.1 7341.65→7473.38. No card/refine/enchant/option/scroll sweep;TASK041ยังเปิด.

## Validation

667/667TS;36focused+11targeted;M0/readiness8;actualnative4groups/Story330+Tower+daily size-tags/cardMinorous liveengine/portrait320390. ScopeguardAll152programsยกเว้น3curves/ราคาเดิม/speed1x2x4/checkpointผ่าน. Root+filteredbuildผ่านตรงกัน626972gzip/PWA28821d56127274d1;packb9a9280a/raw33108285ไม่เปลี่ยน. ไม่มีownerlogin/write/SQL/env/6173restart/subagent.

Nativeครั้งแรกเครื่องมือPlaywrightในtmpถูกล้างจึงMODULE_NOT_FOUND,ติดตั้งชั่วคราว1.58.2แล้วผ่าน. ภาพตรวจพบnativepagewrapperไม่เหมือนpage-layerจริงจึงแก้harnessและทำgeometrychecks;ปรับcontrastธาตุและwrapขนาดTowerด้วยCSS,finalnative4groupsผ่าน/ภาพ320ตรวจด้วยตา. TypecheckรอบแรกunionFormulaไม่ได้narrow,แก้testtypeguardsแล้วผ่าน. Failedlogsอยู่/private/tmp;ไม่ลดเกณฑ์เพื่อผ่าน.

Hosted4groupsผ่าน:APIe49a/SIN1/auth401/24bundleSHA/sizebadgeUIcode/publicGrim625/Sonicbase223.95%×4/Backstab437.5/MAtk/320390/zeroerrorszeroownerwrites. Source5701cde9aVercelSUCCESS https://vercel.com/chanon2/ro-idle-pve/CVu4x1EBe77F9QUBHpj6VquWeFEU. ทุกACผ่าน;actualbossUIprovedบนisolatednativeไม่ใช่ownercloudlogin.
