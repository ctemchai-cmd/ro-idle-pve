# D168 — บทบาทสกิลและหน้าต่างการใช้งาน

25 ตุลาคม 2026 · TASK142

ผู้ใช้ขอให้สกิลซ้ำมีหน้าที่ต่างกัน รวม Increase AGI ใน Blessing และเปลี่ยนช่องเดิมเป็น Ruwach โจมตี+ลด DEF/MDEF. ตัวเลขด้านล่างเป็น baseline ของเกมนี้ ไม่ใช่สมการ RO ที่ถอดจากต้นฉบับ และไม่ได้อ้างว่าเท่ากันทุกบิลด์.

| สกิล | หน้าที่ใหม่ (base rank1→10) | ความต่าง |
|---|---|---|
| Blessing | STR/INT/DEX +10.5→26.25%, ASPD +6→14%, 5.5→10s | primary stats/ความเร็ว; Impo ยังเพิ่ม P.ATK+M.ATK โดยตรง |
| Ruwach | Holy 140→250% M.ATK หมู่, ลด DEF/MDEF 8→18% 6s | legacy ID `acolyte_increase_agi`; bonus เป้าเดียว +35% bucket เดิม |
| Loud Voice | ดาเมจสกิล/ฮีล +17.5→40%,4.5s | ต่างจาก Impo และตีปกติ |
| Battle Cry | ตีปกติ +8.75→21%, คริ +4→8%,4.5s | ไม่ซ้ำ raw P.ATK/M.ATK |
| Endure | ต้าน CC/ขัดร่าย +50→100%,5s | ไม่ลดดาเมจ; Auto Guard ยังลดดาเมจ |
| Intimidate | ใบ้ 3→6s (โอกาส85%), ลด P.ATK/M.ATK12→25%6s | Ankle Snare หยุดการกระทำด้วย Stun |
| Bard Encore | CSPD +10→20%, ฟื้น SP +20→50%,6s | Dancer Encore ยังเป็น CC หมู่ |
| Dance Protection | ดาเมจที่ได้รับ −6→−15%,5.5s | Defender เพิ่ม DEF/MDEF; แยก lane จาก Guard |
| Quick Step | หลบ +10→22%,4.5s | Twohand Quicken เพิ่ม ASPD |
| Bard Healing Song | งบฮีลดิบเดิม:50%เปิด+50%HoT5ticks | Dancer เป็นเปิดเบากว่า/HoTหนักกว่า; Sanctuary pure MATK HoT ไม่แก้ |
| Bard Musical Strike | 2hits แบ่งงบรวมเดิม | Dancer จบ1hit; Awaken Bard4hitsแบ่งงบเดิม |
| Priest Spirit Recovery | SP คงเดิม +พลังฮีล6→15% | Mage SP Recovery เน้น SP |
| Weapon Research | P.ATK คงเดิม +Hit3→10% | Iron Fist ยัง P.ATK สาย Monk |
| Dirty Tricks | ควบคุมคงเดิม+เจาะเกราะ4→10% | Frost Control เน้นควบคุม/เวท |
| Steel Crow | ดาเมจสกิล7→21% แทนกายภาพทั้งหมด | Falcon true damage ได้ประโยชน์; Poison Edge ยัง physical ทุก action |
| Bard Music Lesson | ฮีลคงเดิม +maxSP5→15% | Dancer ฮีล+หลบ3→8% |
| Dancer Breathing | ครึ่งโบนัสฟื้น SP เดิม +HPregen0.3→1% | Bard เน้นฟื้น SP เต็ม |

Awaken ใช้หลัก 110→145% ของผลหลัก baseMax โดยคง extra boon เดิม ยกเว้นบทบาทที่เปลี่ยน: Ruwach2hitsแบ่ง total275→362.5% M.ATK/armor19.8→26.1%; Endureต้าน100%/5.5→7.25s+รับฮีล10→20%; Bard Strike4hitsแบ่ง totalงบเดิม; Songแบ่ง50/50ตามจำนวน tick จริงของแต่ละ phase. โบนัส probability ยังใช้ engine probability rules เดิม,ไม่มี aggregate buff cap/refresh.

## Composition และ compatibility

18 logical IDs อยู่ใน `plan/generators/skill-distinctness.json`; explicit base/Awaken patch+7 typed statuses. `skill_distinctness.py` เป็น postprocessor หลัง Awaken generator. ไม่มี engine branch สำหรับชื่อสกิล. New statuses ใช้ primary/derived/bonus modifiers ตาม pipeline เดิม,independent application+expiry,ต่อให้ร่ายจากคนเดิม. Dance ward ใช้ damage_taken_bonus แยกจาก guard เพื่อลดการบวกตรงกับ Steel Bodyจน100%ทันที; ไม่เพิ่ม cap ใหม่.

ไม่แก้ราคา/เวลาร่าย/ACD/SP/ตารางปลด/rank/Awaken flag/4slots/ledger. เก็บ persisted ID ของ AGI ไว้แม้ชื่อสาธารณะเปลี่ยนเป็น Ruwach; จึงไม่ทำรอบคืนทุน/ย้ายช่องอัตโนมัติ. เซฟเก่าอัป content ผ่าน backup/version migration เดิม. Immutable legacy prices และ receipts เก่ายังใช้ได้.

Ruwach ใช้ native AL_RUWACH skill24 icon+ef_ruwach.wav จาก metadata; VFX เป็น authored holy burst เนื่องจาก source clientเป็น procedural lensไม่ใช่ STR สำเร็จรูป. ไม่อ้างภาพใหม่เป็น exact RO effect. ไม่แก้ shared ancestry/copy spell IDs; Rogue copy whitelist ยังคัด effectจากต้นฉบับตาม contract.

## การตรวจ

Frozen before/authored-before142 เก็บครบ. Scope guard อนุญาตเฉพาะ patch18/newstatuses7/name/presentationRuwach และ golden54 ไม่แตะ definition อื่นหรือราคา. ทุก phase/rankต้องมีผลโตจริง และ Awaken1ต้องดีกว่า baseMax ในแกนรวม. ทดสอบ actual stats/damage/control/expiry/rank/oldsave ตลอดจน fullTS/M0/assets/root-filtered/native320390/hosted. ไม่เปิด batch calibration ทุกอาชีพ; ผู้ใช้ยังทดสอบ balance ส่วนตัว.
