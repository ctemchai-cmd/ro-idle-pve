# D173 — วงออร่าเพลง

ผู้ใช้ขอวงออร่าเพลงBard/Dancer. ใช้native32×32ring/64×64note `priest_angel_ring.bmp` และ `ain_rhapsody/ain_rhapsody_cast/ain_note_01.tga` ที่มีในlibrary. Composeสองวงบาง+3โน้ตเป็นภาพ ground aura;Bardหมุนhue190/Dancerหมุนhue300เป็นชมพู (sepia/saturation tint ของpixelเดิม). เป็นการadaptartจริง ไม่อ้างว่าเป็นsongfieldต้นฉบับ. ไม่วาดวง/โน้ตด้วยproceduralshapeและไม่แก้sourcepixels.

เลือก8stable IDs: bard/dancer × healing_song,battle_song,dissonance,encore. วงอ่านinstancesจริงผ่านbattleStatusViews: owner_actor_idคือผู้เล่นเพลง,expires_atและapplied_atเป็นcombat time. รวมทุกeffect/recipient/stackเป็นวงเดียวต่อlivingperformer,เลือกstyleจากskillIDที่เรียงก่อนสุดเพื่อความdeterministic. หลายผู้ร่ายยังมีวงแยก. เพลงยิงdamageทันทีอย่างperformance_strikeไม่สร้างวง. CCเพลงที่ไม่ติดไม่มีสถานะจึงไม่มีวงค้าง. BuffยังทำงานขณะcasterStunวงยังอยู่;ไม่มีการเพิ่มchannel/พื้นที่มีผล/ข้อจำกัดเคลื่อนไหว.

วงตามpositionจริง,ใต้actorsและdamage,ไม่แก้เลือกเป้า/ระยะ. ปิดmotionแล้วยังแสดงstaticindicator. Animationใช้virtualpresentationtimeและสถานะสิ้นสุดตามgametime,ไม่ใช้Date.now/RNG. โหลดเฉพาะเมื่อมีเพลงในpreparedskills;ใช้cacheassetsร่วมกัน,ไม่มีfetchในframe. ไม่แก้gameplaycontracts/engine/domain/save. CombatVisualsส่วนrendererเพิ่มperformance_aurasและตรวจconfigก่อนใช้. Initialprofileยังเป็น4Class1เดิมและrawpack32MiB.
