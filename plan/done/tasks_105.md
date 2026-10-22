# TASK-105 — ตีบวกใช้หินเพิ่มตามระดับ

Milestone: M4 · ประเภท: พัฒนา/ตรวจรับ

## งานที่ต้องรอก่อนหน้า

TASK-027, TASK-099 (done)

## เป้าหมายและผลส่งมอบ

ตีบวกใช้หินเพิ่มตามระดับ ตามคำขอ22ต.ค.2026

## ขอบเขตและรายละเอียด

ใช้canonicaldata/sharedrulesและnativeROmetadata; ไม่รันbalancebatch ไม่อ่านprivateenv ไม่แตะownercloud/6173 ไม่มีSQLใหม่

## ขั้นตอนทำงาน

1. เก็บbefore/auditและเปลี่ยนauthorityเฉพาะส่วน
2. ต่อUI/metadataและตรวจfocusedrulesกับข้อมูลก่อนแก้
3. ตรวจมือถือจริงในisolatedChrome/build/publicdeployment แล้วreviewเกณฑ์

## เกณฑ์ตรวจรับ

- [x] AC-01: Refineใช้8×target oreแทน5×target รวม440oreถึง+10; gold77000/chance/pity/modifiers/cardgatesไม่เปลี่ยน
- [x] AC-02: success/failureจ่ายstepcostใหม่ครั้งเดียว insufficientfundsไม่เปลี่ยนstate; oldprogress/paidledgerไม่reprice; UI/build/deployผ่าน

## วิธีตรวจและหลักฐาน

Focused fixtures/static audit, isolatedChrome320/390 และpublicartifact SHA; เติมผลจริงก่อนdone

## Blocker / คำถาม

ไม่มี; ตัวเลขassistanttrialภายใต้คำขอ ไม่อ้างwhole-gamebalance

## บันทึกการทำงานและ review

เริ่ม22ต.ค.2026

- Local: M0/readiness8/build/type/boundaries/secrets/sourceassetchecks ผ่าน. 80unique focusedTSรวม378rawgoldensและmigration; ไม่มีbalancebatch. Staticauditเปลี่ยนเฉพาะAsuraSP/Blessingduration/Refineore คงFinger/ATK/gold/chance/ledger.

- Review23ต.ค.: 2/2ACผ่าน; publicVercel3groupsผ่าน API200SIN1/content/JS/6nativefilesSHA/manifest/login/nohostedwrites. Source`9f1bc77f8f73d4cf9331dd4be53e6e45fc83ccbf`. [หลักฐาน](../evidence/task-105-review.json)
- เก็บround1/2fixturesที่ผิดไว้: actorsเรียงตามIDไม่ใช่inputorder, immutablestateต้องclone, percentมีcomma และempty skill slotsถูกข้ามไม่เพิ่มSI; ไม่แก้productrulesเพื่อให้testผ่าน. Browserround1ใช้manifest.shell_visualsผิดชื่อจริงshell; finalตรวจ19actualdialogcomponents. Hostedround1public2groupsผ่านแต่temporaryPlaywrightหาย จึงติดตั้งtoolแยกในtmpและfinal3groupsผ่าน ไม่แก้เกณฑ์.
