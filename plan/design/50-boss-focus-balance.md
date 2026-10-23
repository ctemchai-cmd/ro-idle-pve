# Boss focus — D-161 / TASK-131

ผู้ใช้ยืนยัน 24 ต.ค.2026: สกิลหมู่ยังตีหมู่ได้ แต่แรงขึ้นเมื่อมีศัตรูเหลือตัวเดียว หลัง controlled audit พบสายเวท/Alchemist ตามกายภาพในไฟต์บอสเดี่ยว

Active definition เพิ่ม optional `single_target_damage_bonus` (number/level_param, >=0). ประเมินหนึ่งครั้งตอน cast resolve ก่อน effects โดยนับ actor ฝั่งตรงข้ามที่ living และ targetable. หากเหลือหนึ่งตัว เพิ่ม bonus ลง **skill_damage_bonus bucket เดิมแบบบวก** บนสำเนา cast offense เท่านั้น ไม่คูณ final damage ใหม่และไม่เปลี่ยน actor/cast snapshot เดิม

Direct damage และ periodic application snapshot สืบทอด offense ชุดนี้; DoT จึงล็อกเงื่อนไขเมื่อวาง ไม่สลับแรงระหว่าง tick และไม่บวกซ้ำ. ถ้ามีการ summon จะสืบทอดผ่าน bonus stats เดิมโดยไม่มีสูตรแยก. Normal attack/heal/shield/CC chance ไม่ใช้ skill damage bucket. ถูกขัดก่อน resolve ไม่ได้ bonus หรือผลใดเพิ่ม; SP/บอลใช้กฎเดิม

สกิลหมู่โจมตีของผู้เล่นใช้ +35% ใน bucket นี้ทั้ง base/Awaken; ท่าควบคุมอย่างเดียวและบัฟ/ฮีลหมู่ไม่รับ. ไม่มีโบนัสต่อจำนวนเป้าที่หายไป ไม่เพิ่มหลายเท่าเมื่อท่ามีหลาย hit. Bonus เป็น authored trial ไม่ใช่สูตร RO

ปรับ power บางท่าของ Mage/Wizard/Sage/Alchemist/Creator แยกตาม frozen baseline9ae8 โดยไม่ลดอาชีพอื่นเพื่อให้ตัวเลขเท่ากัน. ต้องวัดใหม่ก่อนสรุป แยก fixed A/B จาก re-screen และไม่ตัดสิน support/tank จาก personal DPS

ข้อจำกัดการวัด: boss neutral เดียวและ finite90s; ไม่อ้างทุกธาตุ/การ์ด/ทีม/อุปกรณ์หายากสมดุลแล้ว. TASK041 ยังต้องตรวจ encounter และเศรษฐกิจรอบใหญ่

## ผลวัดรอบนี้

- 636/636 TS; 15640ไฟต์ (11472re-screen+4160fixedA/B+8equivalence); Common gear1/20/40/60, Class1/2/Hi-class และ3ระดับAwaken
- FixedClass270gear60:Wizard2217→4299/Sage2320→3776/Alchemist2177→3636; Assassin4619→4799/Hunter4181→4313
- FixedHigh90Aw10:HighWizard5279→10238/Professor5341→9007/Creator5335→9086; AssassinCross14298/LordKnight10403เดิม/Sniper10326→10750
- Re-screenใหม่Championเลือกบิลด์ใหม่ได้9368 (fixedบิลด์เดิม8339); ต้องแยกselection effectจากpower effect
- Before9ae8 / measured4820 / release99a55. SyncFireBoltcopyท้ายรอบเปลี่ยนเพียง2powerarrays;2448compiledinputsเท่ากันทุกfieldและreplay4กลุ่มเท่ากันยกเว้นhash จึงเก็บhashเดิมตามจริง ไม่ relabel ว่าseedbatchรันใหม่บนhashล่าสุด. [รายงาน](../evidence/task-131/README.md)
