# TASK-085 — เพิ่มความชันความยากหอคอย

Milestone: M4 · D-114

## งานที่ต้องรอก่อนหน้า

- TASK-035, TASK-077, TASK-078 (done)

## เป้าหมายและขอบเขต

ผู้ใช้รายงานชั้น21กับทีมLv.30ง่ายเกินไป สูตรเดิม HP600+100f+8f² และATK10+2f เพิ่มน้อยเมื่อเทียบStoryที่ผ่านcalibrationและพลังบิลด์077/078 ออกแบบbaselineใหม่ HP600+100f+8f²+2f³, ATKceil((20+4f+f²)/2), DEF5+3fเดิม ชั้น1HP710/ATK13ใกล้เดิม ชั้น21HP24,750/ATK273 ชั้น30HP64,800/ATK520 มีทั้งแรงกดดันและdamagecheck ไม่ใช้แค่เพิ่มเกราะ

เก็บรางวัลและความก้าวหน้าทุกชั้น ไม่มีresetหรือเติมรางวัลซ้ำ ไม่เปลี่ยนStory/Daily/ความเร็ว/CC/คิว รูปแบบยังsingleboss40s ใช้polynomialเดียวทั้ง100rowsและruntimeอนาคต ไม่รันsimulation/calibrationbatchใหม่ ตัวเลขเป็นbaselineทดลองจากข้อมูลเกมปัจจุบันและanchorผู้ใช้ ไม่อ้างbalanceที่วัดด้วยทีมจริง

## ขั้นตอนการทำ

1. บันทึกbefore/afterชั้น1/10/20/21/22/30/50/100/101/1000และเทียบStoryที่มีอยู่
2. Extendsharedpolynomialให้cubic/divisor+ceilพร้อมsafeintegerguard แล้วgenerate100rowsจากparametersเดียว
3. ตรวจTowerfirst-clear/replay/loss/reload/rewards/migrationและgrowthboundary ไม่เพิ่มAI/สูตรลงUIหรือSQL
4. M0/build/push/deploy/publicproofก่อนreviewdone

## ผลส่งมอบ

- Towercurveและreproducible100-rowgenerator
- ตัวเลขbefore/after+focusedchecks+hostedproof

## เกณฑ์ตรวจรับ

- [x] AC-01: ใช้เส้นHP cubic และATK quadraticเดียวกันทุกชั้น รวม100→101 ชั้น21HP24,750/ATK273แทน6,228/52 ชั้น1ยังใกล้เดิม; floor_rows100แถวตรงgenerator runtime เกินsafeintegerปฏิเสธชัดเจน ไม่มีเกมจบที่100
- [x] AC-02: เก็บhighest_cleared_floor/first-clear receipts/pending rewards/รางวัล/40s/unlock2-10/CC/skill cycle/ASPD/CSPD/DEFเดิม ไม่รีเซ็ตชั้นหรือเพิ่มรางวัลย้อนหลัง บอสlevel capไม่หยุดnumeric scaling
- [x] AC-03: Numeric growth/source diff และ focusedTower progression/replay/migration checks/M0/build ผ่าน พร้อม Vercelpublicnewtowerdata/API/hash/login/PWA ไม่อ้างwhole-game balanceหรือผลเล่นทีมจริงของผู้ใช้ ไม่มีSQL/env/ownerwrite/balancebatchใหม่

## วิธีตรวจและหลักฐาน

`python3 plan/generators/tower.py --check`, focusedTowertests/source-diff, M0/build และsignedoutpublicproof เก็บ task-085-*

## Review

22 ต.ค.2026 ผ่านทุกAC [review](../evidence/task-085-review.json) / [actual hosted](../evidence/task-084-hosted.json) Source `e2323a28367c5ebc3636bb7e0f379dd725c24e39` VercelSUCCESS: https://vercel.com/chanon2/ro-idle-pve/ABK9Nud7EM3ACMubW6ZrdPEK9mdA

40focusedTS/M0/build/type/boundaries/secrets/generator/readiness8 และpublic3groupsผ่าน ไม่มีownerwrite/6173restart/SQL/env/assets/newbalancebatch. Before/afterarithmeticและ100rowsตรงsharedruntimegenerator ชั้นที่ผ่าน/firstclear/รางวัลคงเดิม ตัวเลขเป็นbaselineทดลองสำหรับความชัน ไม่อ้างbalanceทีมจริง
