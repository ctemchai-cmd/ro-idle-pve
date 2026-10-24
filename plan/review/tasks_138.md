# TASK-138 — แสดงขนาดบอสให้ตรงกับการ์ดตีขนาด

Milestone: M4 · D166 · design55

## งานที่ต้องรอก่อนหน้า

TASK-074, TASK-091, TASK-136

## ขอบเขตและผลส่งมอบ

แสดงขนาดบอสให้ตรงกับการ์ดตีขนาด. ใช้sharedengine/contentเดิม ไม่ownerwrite/SQL/env/6173restart.

## ขั้นตอน

1. Freezeก่อนแก้/ตรวจauthorityและกติกา
2. shareddata/helpersและUIตามdesign
3. ตรวจactualengine/fixturesมือถือ/คำอธิบาย/ราคาและregression
4. ReviewและVercelhostedก่อนdone

## เกณฑ์ตรวจรับ

- [x] AC-01: ใช้ขนาดจริงsmall/medium/largeจากmonster_traitsและliveactorTagsไม่อนุมานจากsprite;Story/Tower/Dailyครบ
- [x] AC-02: การ์ดsizeconditionalยังคิดตามtagตรงกับข้อความแสดง;missing/invalidไม่เดาเป็นlarge;ไม่เปลี่ยนstats/traits/cardrateหรือสูตร
- [x] AC-03: หน้าต่อสู้/เลือกบอสก่อนเริ่มแสดงขนาดอ่านได้บน320390โดยไม่ทำbossbarรก;ไม่มีการเขียนเซฟจากการดู
- [ ] AC-04: tests/buildและnative/mobile/hostedผ่าน;ไม่มีowner/SQL/env/6173restart

## วิธีตรวจและหลักฐาน

T138-AC01–04: sharedtests/actualengine/nativeChrome320390/publichosted;plan/evidence/task-138-review.json. ยังไม่ตรวจ.

## Blocker / คำถาม

ไม่มี

## Review

Local667TS/actualnative4groups/engineandmatchedA-B/root+filteredผ่าน;รอVercelhostedAC04.
