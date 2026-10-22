# ปรับการรับรางวัล/พัฒนาช่อง/รายได้ AFK — 22 ต.ค.2026

D-127–129 / TASK-098–100 เป็นการปรับตามfeedback ไม่ใช่การคัดสูตร RO หรือผลจำลองสมดุลทั้งเกม ตัวเลขเป็น assistant baseline.

## การรับรางวัล

`reward.claim.params` ใช้ `claim_id` เดิม หรือ `claim_ids` 1–32 ID ไม่ซ้ำอย่างใดอย่างหนึ่งเท่านั้น เลือกทั้งชุดก่อนตรวจ space/duplicate instance/overflow แล้วจ่ายรวมในหนึ่งproposal/receipt/revision/CAS. ผิดข้อใดคืน state เดิมทั้งหมด. retryใช้ UUID/receipt เดิม.

`farm.claim` เดิมยัง reserve เท่านั้น; `collect_rewards:true` จ่ายpendingเก่าบนclone→reserveช่วงที่ยังไม่เคยจ่ายตาม frozen snapshot→จ่ายbundleใหม่. ทั้งหมดcommitครั้งเดียว หากกระเป๋าไม่พอ rollbackทั้งwallet/pending/cursor/RNG. คิวเดิม32เต็มก็รับได้เพราะเคลียร์บนcloneก่อนreserve. ปุ่ม AFK รับทั้งหมดส่งหนึ่งคำสั่ง; Daily ส่งclaim_idsเฉพาะไฟต์นั้น ไม่วนHTTPทีละกล่อง.

## Refine

flatเดิมร่วมกับpercentต่อขั้นในbucketกลาง: `(base + ผลรวม flat) × (1 + ผลรวม percent)` ทั้งRefine/Enchant/การ์ด/บัฟในstatเดียวกันรวมpercentก่อน ไม่มีคูณทบต่อขั้น. ATK/MATK/DEFตามroundingเดิม HP/SPfloorหลังmodifier. ราคา โอกาสพลาด pity max10และการ์ดที่+5/+10เดิม.

| ช่อง | ต่อ +1 | ที่ +10 |
| --- | --- | --- |
| อาวุธ | ATK +8 · MATK +8 · ATK +3% · MATK +3% | ATK +80 · MATK +80 · ATK +30% · MATK +30% |
| ศีรษะ | MDEF +4 · MDEF +4% | MDEF +40 · MDEF +40% |
| เกราะ | HP +40 · HP +3% | HP +400 · HP +30% |
| ผ้าคลุม | DEF +4 · DEF +4% | DEF +40 · DEF +40% |
| รองเท้า | HP +30 · HP +2% | HP +300 · HP +20% |
| เครื่องประดับ | SP +4 · SP +3% | SP +40 · SP +30% |

## Enchant

แต่ละช่องมีสามpresetต่างกัน ข้อมูล/ชื่อ/คำอธิบายมาจาก `slot-progress.json.enchant.slot_lines` ใช้stable ID offense/vitality/precisionเดิมเพื่อเก็บlevel/actual-paid ledger ไม่ย้ายไปผูกitem. Serverตรวจว่าlineมีในslot. เปลี่ยนสายใช้คืนราคาที่จ่ายจริงเดิมและเริ่ม0 ผู้เล่นเก็บค่าที่มีอยู่ได้. ตารางเป็นต่อหนึ่งระดับ สูงสุด10; ไม่มี AGI/DEXโตอัตโนมัติ Weapon Precision เป็นการเลือก DEX เองอย่างชัดเจน.

| ช่อง | สาย | ต่อระดับ |
| --- | --- | --- |
| อาวุธ | พลังโจมตี | ATK +1.5% · MATK +1.5% |
| อาวุธ | บุกอย่างทนทาน | HP +1% · DEF +1% |
| อาวุธ | แม่นยำ | DEX +1 · แม่นยำ +0.3% |
| ศีรษะ | เวทเข้มข้น | MATK +1% · ฟื้น SP +1% |
| ศีรษะ | จิตแน่วแน่ | MDEF +2% · SP +1% |
| ศีรษะ | ต้านควบคุม | ต้าน CC +0.5% |
| เกราะ | เกราะตอบโต้ | ATK +1% · DEF +1% |
| เกราะ | พลังชีวิต | HP +2% |
| เกราะ | ต้านวิกฤต | ต้านคริ +0.5% · DEF +1% |
| ผ้าคลุม | เจาะเกราะ | เจาะเกราะ +0.5% |
| ผ้าคลุม | เสริมเกราะ | DEF +2% · MDEF +1% |
| ผ้าคลุม | หลบหลีก | หลบ +0.5% |
| รองเท้า | โจมตีต่อเนื่อง | ดาเมจตีปกติ +1% |
| รองเท้า | ฟื้นกำลัง | HP +1% · รับฮีล +1% |
| รองเท้า | มั่นคง | ต้าน CC +0.3% · ต้านคริ +0.3% |
| เครื่องประดับ | พลังสกิล | ดาเมจสกิล +1% |
| เครื่องประดับ | นักเยียวยา | พลังฮีล +1.5% · SP +1% |
| เครื่องประดับ | วิกฤต | โอกาสคริ +0.3% · ดาเมจคริ +1% |

## AFK / ใบธาตุ / หอคอย

- Crystal40/h ทุกบท เริ่มผ่าน1-1:12h=480=4.8cardpullที่100/ใบ. ถ้ารับสองครั้งใน24hได้960 (9.6pulls) ก่อนโบนัสอื่นตามผู้ใช้เลือกเป้าต่อ12h. ไม่มีคูณตามบทหรือการตีมอนบนจอ เพดานต่อการสะสม12hและintegercarryเดิม.
- Gear: frozen snapshotใหม่มีoptional `gear_chance_per_million=500000`; ทอย50%ทุก5นาที จึงคาด72ชิ้น/12hจาก144เดิม (ไม่รับประกันexacthalfแต่ละรอบ). Cardทอยทุก5นาทีแม้gearไม่ตก คง1–2%และpool/qualityเดิม. ไม่เพิ่มcardrarity/chanceชดเชย. Gearchanceใช้drawก่อนrarity/definition/optionsเฉพาะsnapshotใหม่.
- Snapshotเก่าไม่มีfield=gear100%แบบเดิม และไม่กินchancedraw รักษาunpaidRNG/รายได้เก่าจนreserveครั้งถัดไป หลังนั้นติดตั้งprofileใหม่. Migrationไม่เติมCrystalย้อนหลัง/ไม่ลดpendingเก่า/ไม่เปลี่ยนwalletหรือownedscrolls.
- ใบธาตุ5000gold/ใบจาก50 ต้นบท1=47.4นาทีทองฟาร์ม บท8=5.6นาทีต่อใบ เป็นการเลือกใช้เฉพาะไฟต์ที่แพ้ธาตุ; durationหนึ่งไฟต์/จำนวนคืนใบ/limit99เดิม.
- Towerยัง10Crystalทุก5ชั้นเมื่อชนะครั้งแรกเท่านั้น ไม่รีเซ็ต/ไม่retrogrant. UIบอกmilestoneถัดไป ไม่เพิ่มCrystalหอคอยหรือจ่ายซ้ำ.

เปลี่ยนcontentต้องใช้signed backup/migrationเดิมหลังจบไฟต์ ไม่มีSQL/envใหม่หรือownercloudwrite. UI upgrade emblemเป็นSVGในชุดฟ้า/ทองเดิม ไม่มีassetpayloadเพิ่ม. เลขเหลืองลดจากy−255เป็นy−240โดยคงระยะจากwhiteflight.
