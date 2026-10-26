# TASK157 — การ์ด: ชั้นข้อมูล ช่องสวมใส่ และตัวกรอง

Local actual React/nativeart 320/390 ผ่าน 12 กลุ่ม: bulk6, equippedinfo2 และ single-card regression4. Fixture เป็นเซฟในหน่วยความจำ;ไม่เชื่อมบัญชีผู้เล่นหรือเขียน cloud.

- `bulk-ui.json` / `layer-hit-testing.json`: จำลองCSSเดิมจับbadgeทะลุfooterได้จริง;หลังแก้scroll/expand/hit-testing/confirm/cancelผ่าน. Footerพื้นทึบและcellมีstackingcontextของตนเอง.
- `slot-info-native.json`: SlotSheetใช้cardViewปัจจุบันตามactor/slot/socketorder/Lv/rarity/bonuses/procs,ปุ่มท้ายsheetคงที่เมื่อข้อความยาว. ตรวจNPC/ล็อก/ช่องว่าง/liveupdateและAddCardอาวุธ-ชุดเกราะไม่ปนกัน.
- `bulk-ui.json`: กรอง6ช่อง+AllและRarityแบบAND,เลือกที่กรอง,resetselectionเมื่อเปลี่ยนช่อง,ไม่มีผลต่อgearfilters. Inventory500ยังvirtualize102cells.
- `ui.json`: ยืนยันย่อย/ยกเลิก/Escape/ห้ามย่อยล็อกหรือสวม/คำสั่งเดียว/สุ่มต่อคงเดิม.
- `build.log`, `M0.log`, `unchanged-before.json`, `unchanged-after.json`: requiredchecksผ่าน;content/engine/schema/implementation/packทุกhashเดิม.

ภาพ `slot-filter-*`, `slot-cards-*`, `layer-after-*` ตรวจสายตาแล้ว. ความล้มเหลวระหว่างพัฒนาเป็นharness: รอsheetanimationก่อนวัดfooterและใช้ชื่อslotจริง ศีรษะ/ชุดเกราะ;ไม่ใช่การเปลี่ยนเกณฑ์product. เก็บpre-animation-wait-native.json/ภาพfailedไว้ตามจริง.

VercelSUCCESS source`ff8ed2e689513cacfca885ee5bbb8d470d309903` ([deployment](https://vercel.com/chanon2/ro-idle-pve/4AYvDtGDvzxE4xmePuVrtDRUCoso));public4groupsผ่าน API/SIN1/content+packเดิม/24bundleSHA/login320390/opaquefooterhit-testและscrollfixedactions. AC01–04ผ่านทั้งหมด. Publicharnessใช้login+CSSfixture;ไม่ได้อ้างว่าเข้าบัญชีowner. ไม่แก้power/rates/commands/save/SQL/env/assets.
