# เอฟเฟกต์ท่าโจมตีใหญ่ — D-108 / TASK-082

22 ตุลาคม 2026 · ภาพดัดแปลงให้ได้อารมณ์ RO ใช้ native actor/effect/เสียงเดิมร่วมกับ Canvas geometry ไม่เปลี่ยนการคำนวณต่อสู้

## จุดเชื่อมกับ runtime

`src/renderer/finishers.ts` เก็บ `FINISHER_PROFILES` และ `FinisherEffects` แยกจาก shared engine แต่ละ profile กำหนด style/color/shake/priority/hold/title เพิ่มท่าใน registry ได้โดยไม่เพิ่มเงื่อนไขใน domain หรือ SQL

`queue(event, impactAt)` รับเฉพาะ damage ของสกิลที่มี profile และมี HP damage หรือ shield absorption จริง ข้าม cast_start, interruption, miss, heal, normal และ proc ใช้ actor_id + action_id ป้องกันข้อความซ้ำจาก AoE, multi-hit และ replay ไม่ใช้ชื่อผู้เล่นหรือเวลาจากเครื่องสร้าง action identity ข้อมูลเก่าที่ไม่มี action_id ใช้ skill_id + at_ms เป็น fallback

BattleRenderer ส่ง impactAt จาก `visualImpactMs` ชุดเดียวกับตัวเลขและ projectiles เมื่อ reduced motion ใช้เวลาที่ตัวเลขแบบ static แสดง ไม่มีผลขยับเวลา event หรือคืน SP ให้ท่าที่ถูกขัด

`advance(gameMs, wallMs)` รับนาฬิกาทั้งสองจาก adapter: gameMs ใช้รอ contact, wallMs ใช้ค้างข้อความ 750–1000ms และวาดแรงกระแทก 420ms จึงยังอ่านชื่อได้ที่ ×4 ส่วน engine/checkpoint/RNG/คิว/CC ยังคำนวณเหมือนเดิม ไม่หยุดเกมหรือใช้ global randomness

## ท่าที่มี profile

| รูปแบบ | สกิล |
| --- | --- |
| หมัดแสง/เส้นแรงกระแทก | Asura Strike, Finger Offensive |
| เส้นฟันไขว้ | Brandish Spear, Sonic Blow, Raid |
| กางเขนแสง | Grand Cross |
| อุกกาบาต/สะเก็ดไฟ | Meteor |
| หินพุ่งจากพื้น | Heaven's Drive |
| วงพลังเวท | Jupitel Thunder, Psychic Bolt |
| ลูกศรต่อเนื่อง | Rapid Fire |
| ระเบิด/สะเก็ดกระแทก | Claymore, Detonate Poison, Cart Crash, Acid Terror |

Asura แสดง ASURA STRIKE และชื่อผู้ใช้ มีแสงจากผู้ใช้ไปยังเป้าหมาย วงกระแทกและ radial streaks อ่าน local MO_EXTREMITYFIST skill271 metadata แล้วพบ lens1/procedural hit266 แต่ runtime เดิมใช้ prepared Bash recipe และ sound mapping บางส่วน missing จึงเป็น authored adaptation ไม่ใช่การนำ native Asura สมบูรณ์กลับมาหรืออ้างตรงกับ RO ทุกภาค ไม่เพิ่ม asset pack

## มือถือและขอบเขตงานภาพ

สั่นเฉพาะ Canvas world ไม่ขยับ DOM HUD หรือข้อความใหญ่ สูงสุด 5 intrinsic canvas pixels แล้วหายภายใน 180ms ข้อความอยู่เหนือการต่อสู้ จำกัดความกว้าง 86% และย่อฟอนต์เมื่อชื่อยาว ไม่มี full-screen flash

reduced motion จาก `prefers-reduced-motion` ปิด shake/วงพุ่ง/แสงเคลื่อนไหวของ finisher คงข้อความนิ่ง เมื่อผู้ใช้เปิด/ปิด motion ภายหลังผ่าน settings ใช้ renderer.motion เดิม

คิว pending ≤12, active ≤3, action dedup ≤1024, วาด world impact พร้อมกันสูงสุด 2 และ title เดียวตาม priority ทิ้ง contact เก่าเกิน 1600 game-ms ที่ตามมาจาก catch-up ไม่เพิ่ม particle object ต่อเฟรม

ฉาก AFK farm คง world impact แต่ตั้ง `showFinisherTitles=false` จึงไม่มีป้ายใหญ่หรือจอสั่นซ้ำ ๆ ส่วน boss/Story/Tower/daily ใช้เต็มรูปแบบ `showFinishers=false` ปิด overlay ทั้งชุดได้โดยไม่แตะเกมหรือ native effects

## การตรวจรับ

Focused fixtures ตรวจ successful/absorbed/miss/interrupt/AoE/multi-hit/proc/no mutation/bounds และ profiles ทั้ง 15 ครบ 6 ต้นอาชีพ Actual Chrome โหลด real runtime pack วาด 10 ท่าครบ 8 styles ตรวจ contact เดียวกับเลข, reduced motion, quiet farm, 320/390px และ shared Asura checkpoint/events/RNG เท่ากันเมื่อเดินที่ ×1/×2/×4 พร้อมภาพจริง เป็น mobile emulation ไม่ใช่ benchmark เครื่อง Android จริงหรือการรัน balance simulation ใหม่
