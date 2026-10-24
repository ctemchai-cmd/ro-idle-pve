# TASK140 — ผลชนะเก่าไม่ย้อนหลัง Warning

สาเหตุ: `Field.challenge` เปิด intro ใหม่ทั้งที่ outcome/bossเก่ายังอยู่. Readinessของintroจึงเห็นไฟต์เก่าว่าready แล้วปิดWarningที่2100ms; Resultเก่ากลับมาระหว่างรอAPIหรือpack. แก้ที่ต้นทางด้วย `setOutcome(null)` ก่อนเปิดintro/awaitchallenge. ไม่ใช้CSSซ่อนอาการและไม่เปลี่ยนเวลา/retry/รางวัล.

- `before.json` คือผลที่ **ยืนยันว่าพบbugเดิม** บน sourcea15aa0371/content6d2d. Story API3600ms และ Tower prepare3000ms ต่างมี `resultเก่า → warning → resultเก่า → battleใหม่`.
- `native.json` หลังแก้ผ่าน4กลุ่ม: Story390/Tower320เหลือresultเก่าครั้งเดียว,สั่งstart/finishเดิมครั้งเดียว,ไม่มีoverflow;stopระหว่างintroไม่ส่งstart;rejectstartหยุดAutoและคืนปุ่ม. ใช้actualReactField/Warning/ResultCard/nativeassets/sharedenginecheckpoints แต่controlledsynthetictransportในbrowser ไม่ใช่Auth/API/SQLproof.
- `unit.txt`:4testsผ่าน—แพ้3ครั้ง/duplicateoutcome/winreset/frontier/claimselectionเดิม. ไม่รันfull672ซ้ำเพราะเพิ่มเพียงUIstate-resetและcomment;ไม่มีdata/domain/API changes.
- `build.txt`, `build-filtered.txt`:uncachedtypecheck/root+filteredbuildผ่าน. Content6d2d/packb9a9280aเดิม;root+filtered628913gzip/PWAe9a6989a67c27f4c. M0/readiness8ผ่าน;ไม่มีSQL/env/owner/6173restart/subagents.
- ภาพbefore/after320390;ตรวจafterStory390ด้วยตา. Initialharnessใช้IDสกิลสมมติผิด(AUDIT_INVALID_CANDIDATE) จึงเปลี่ยนมาเลือกexistingvalidatedauditBuild;debugเก็บ.local/auto140-debug. ไม่เปลี่ยนcriteriaหรือgameplayเพื่อให้ผ่าน.

HostedตรวจpublicAPI/authgate/bundleSHA/transitionfunction/mobileloginเท่านั้น. Platformbundleอาจต่างกัน จึงparseเฉพาะchallengeที่เรียกstartทั้ง3โหมด:ก่อนawaitมีnullreset2ตัว(outcome+sheet)เทียบเก่ามีsheetตัวเดียว. Actualbehaviorอยู่nativebefore/after. สถานะเผยแพร่ดูtask-140-review.json/hosted.json.
