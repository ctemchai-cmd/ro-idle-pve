# TASK141 — Battle HUD / หน้าจบ

ผู้ใช้ขอให้แผงบอส/Autoเล็กลงเพื่อเห็นดาเมจ และเพิ่มคำขอจัดปุ่มหน้าจบระหว่างทำงาน. Task142แยกงานสกิลซ้ำซึ่งยังไม่รวมในผลส่งมอบนี้.

- HP/name/ธาตุ/sizeด้านบน178→50.59375px (−71.6%);ปุ่มStats/Timeline/speed/retreat/Autoไปแถวเดียวด้านล่างพร้อมparty/focus. Compactbadgeยังมีaria/titleเต็มและกดตารางธาตุได้. ไม่ขยับactor/ดาเมจ/กล้องหรือสูตร.
- Result/DailyResultแยกbodyเลื่อนได้กับfooterคงที่. Next/retry/team44px;analysis/exit36px,ใช้Iconแทนemoji. คงcallback/locked/pending/reward/Autoเดิม. ไม่เพิ่มปุ่มรับรางวัลStory/Tower.
- `before.json`:actualField/native high-HP enemy synthetic fixtureบน390x844/320x640. HP178px/fullHUD277.8;320มี47/58digitdrawsทับHP/toolsและoverflow. `native.json`:HP50.6/HUD132.4, nooverflow/ไม่มีglyphทับHP/tools/castในตัวอย่าง;390รอFingerจนมีwhite392+yellow1,320white58. ก่อน/หลังเทียบheightตรงกัน;windowดาเมจหลัง390ยาวกว่าเพื่อรอyellow ไม่อ้างDPS/occlusionrateเป็นA/Bเวลาเท่ากัน.
- Captureboundsจาก**actual CanvasRenderingContext2D.drawImage**ระหว่างDamageNumbers.draw แล้วแปลงcurrenttransformเป็นCSSpixels;ไม่จำลองตัวเลขหรือแก้positionให้ผ่าน. Native3groupsผ่านcontrolsจริงรวมStats/Timeline/1-2-4/Auto/retreat. ขอบเขตvisibilityคือฉากที่วัด ไม่ใช่รับประกันทุกตำแหน่งทั่วสนาม.
- `results.json`:16actualResultCardcasesบน390x844/320x568—Story/Towerwin-loss/pending/Auto/Daily/locked;primary/secondarysizes,footerไม่ขยับเมื่อbodyเลื่อน,callbacksnext/retry/team/exit/Stats/Timelineถูกต้อง. Native2groups. ผลลัพธ์propsและcallbacksเป็นsyntheticUIfixture;debriefมาจากengine ไม่อ้างว่าเป็นAuth/API/SQLproof.
- Root/filtereduncachedbuildผ่าน630186gzip/PWA5f8a379eadd4e56a;content6d2d/packb9a9280a/raw33108285เดิม. M0/readiness8ผ่าน. Noowner/SQL/env/6173restart/balancebatch/subagents. Full672ไม่รันซ้ำกับpresentationchangeนี้.

ตรวจภาพafterHUD390320และresultlose320ด้วยตา. Initialresultgeometryวัดระหว่างpopanimationจึงต่ำกว่า44px แก้harnessรอanimationfinishedแล้วผ่านจริง;debugเก็บ.local/hud141-debug. สถานะเผยแพร่ดูtask141review/hosted.json. สกิลที่ผู้ใช้สั่งเพิ่มต้องทำต่อTASK142.
