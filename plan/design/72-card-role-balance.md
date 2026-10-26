# D183 — การ์ดมีประโยชน์ตามบทบาท

ผู้ใช้ยืนยัน:ATK/โบนัสเช่นAbysmalแรงเกิน,AGI/หลบ/ต้านสถานะ/เผ่าธาตุมีประโยชน์จำกัด,HPในslotเดียวกันห่างกันเกิน. ต้องดูผลรวมให้แต่ละใบน่าใช้ ไม่ใช่DPSหรือ%เท่ากัน. รักษาROidentity/slot/rarity/conditionalroles.

Auditต้นเหตุ:D103card_powerแปลงflatเป็น%ด้วยreferenceต้นเกมและfactor1.75จนAndreCommon35%/IncubusRare131%SP/Pupa21%HP. ลดเฉพาะauto-derivedgrowthเป็น30%ของเดิม;flatยังคงและderivedpercentที่เขียนเองใช้กฎเดิม. เพิ่มsecondarystatsให้utility/conditionalsและลดexplicitdamage/MAtkoutliersเป็นรายใบ. ไม่เปลี่ยนrarity/levelscale/stackrules/procengineหรืออาวุธ/Refine/skills.

งบแนวทางLv1:Commoncoreประมาณ5–10%,Uncommon7–12%,Rare10–16%,Epic13–19%,Legendary18–25%ขึ้นกับslot/เงื่อนไข/ข้อเสีย;ไม่เอาหน่วยต่างกันมาบวกเป็นคะแนนโดยตรง. Utilityมีbaseusefulstatsพร้อมspecialty;HPเปรียบEHP/regen/healร่วมกัน. Specialistมีbaselineประโยชน์เมื่อเงื่อนไขไม่ตรงและโบนัสเงื่อนไขสูงกว่า. MVPutilityเติมประโยชน์ในไฟต์บอสโดยเก็บผลเดิม ไม่เพิ่มauto-revive.

ตรวจ80cards×Lv1/5×3offense-defensebudgetsด้วยsharedmath+actualpipeline,เปรียบbefore/afterในfixtureเดียวกัน;เพิ่มtargetedrealengine/procs/armor/regen/description/save/checkpoint1x2x4. ไม่ใช่fulljobDPScalibration. ห้ามอ้างว่าสมดุลทุกบิลด์. คง80IDs/73portrait/sourcegrades/droprates/gacha/costs/ลงทุนเดิม/pack. Schemaและengineไม่จำเป็นต้องเปลี่ยน. คำอธิบายใช้cardViewค่าจริง. เซฟใช้backup-updateเดิม.

ผลlocal:79ใบpowerเปลี่ยน(75explicit+auto-growth);80identity/73artเดิม. Full748/new8/native3/audit480/rootbuild/M0ผ่าน. ตารางexactก่อนหลัง/roleทุกใบในevidence159summary+CSV. HistoricaloraclesrestoreเฉพาะD183powerfieldsและtestcurrentผลจริงแยก.
