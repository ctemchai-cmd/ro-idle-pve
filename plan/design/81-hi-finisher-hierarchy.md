# D192 — Hi-class finishers exceed Class2 Awaken1 at entry rank

TASK168. ผู้ใช้ยืนยันให้Hi-classไม้ตายยังไม่Awakenตั้งแต่Lv1คุ้มกว่าClass2ไม้ตายAwakenLv1ทุกอาชีพ. ตรวจทั้ง26Hi skillsตามหน้าที่;ปรับ23ที่ต้องยกระดับ,ไม่เนิฟClass2/ไม่ใส่jobmultipliersในengine. NativeIDs/art/skillslots/SP/ballcosts/CT/ACD/selectors/element/utility/ราคาคงเดิม. อัตราทั้งหมดเป็นauthoringdataในhi-finisher-hierarchy.json/postprocessorหลังD169.

## วิธีเทียบ
One applicationด้วยsharedengine,P.ATK=M.ATK1000,SP500,HP10000,4allies/1enemy,normalizeธาตุไม่แพ้ชนะ/no randomdamagecrit-missแต่คงguaranteedcrit. รวมhits/periodic/summonตลอด25s. แยกdamage/heal-per-recipient/buff/guard;ไม่บวกทุกหน่วยเป็นคะแนนเดียว. BuffprobeP/Mและnormal/skillเท่ากันด้วยsharedmath,คิดchargeignorearmorและexpectedBoltecho;DEF/MDEF300. Guardprobephysical+magicอย่างละ5000รวมshield/mitigation. ไม่มีเป้าหมายglobalDPSหรือการันตีชนะทุกธาตุ/บิลด์.

DamageHiLv1ต้องสูงกว่าreferenceClass2Aw1อย่างน้อย5%;ตัวที่ต้องปรับเล็ง10%. ChampionComboอิงFinger;GateอิงAsuraที่SP500และคง1200–2500ก่อนHPตามD191. SPสูงกว่านี้Asuraอาจแรงกว่าเพราะใช้SPทั้งหลอด จึงไม่อ้างเหนือกว่าทุกSP. ธาตุ/ระยะเวลา/การขัด/งบลงทุนเปลี่ยนผลจริงได้.

## บทบาท
AuraBladeเทียบBattleCry;GospelเทียบDefenderพร้อมHoT;AssumptioเทียบKyrieในงบdamage;BondFateเทียบImpoและSanctuaryต่อrecipientพร้อมlockedlink;MarionetteเทียบBattleSong;MoonlitเทียบHealingSong;DoubleCastเทียบEndowผ่านBoltprobe;ChaseเทียบExposeต่อnextaction;MaximumOverthrustเทียบWeaponPerfection;FCPเทียบPotion/guardพร้อมshield/cleanse. MysticalAmplificationเพิ่มMATK45–80%และเปิดmagiccritเหนือกว่าWizardpassiveในงบเดียว. ไม่มีlike-for-likeClass2activeจึงระบุแยก.
Chaseเพิ่มskill_damage_bonus40–70%บนchargeผ่านgenericstatusmodifierเดิม;Aw77–101.5%. Normalsไม่ใช้โบนัสนี้/ไม่กินcharge. Nextresolveddamagingactionใช้snapshotทั้งท่าแล้วconsumeหนึ่งcharge. ไม้ตายdamage/บัฟ/ฮีลอื่นเพิ่มเฉพาะparametercurvesตามconfig;คงeffectidentities.

## เกณฑ์ตรวจ
AC01:26skills/13jobs,rolefloorcomparisonsพร้อมbeforeafter;Class2ทั้ง126/ราคา/เวลา/ธาตุ/native IDsเดิม
AC02:Hiทุกrank/Aw1>=baseMax/Chasenormal-vs-skill/guard-heal-buff probes/78independentgoldensตรงengine
AC03:mobile320390/fullTS/root-filteredbuild/publicผ่าน;boundedevidenceไม่อ้างglobalbalance
