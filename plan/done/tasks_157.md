# TASK-157 — แก้เลขการ์ดทับแผงและแสดงการ์ดในรายละเอียดอุปกรณ์และกรองช่องการ์ด

Milestone:M4 · D181 · [design70](../design/70-card-layer-and-slot-info.md)

## งานที่ต้องรอก่อนหน้า
TASK-154, TASK-156 (done).

## ขอบเขต
แก้stackingของgrid/bulkfooterและเพิ่มรายการการ์ดพร้อมผลในSlotSheetหน้าตัวละคร. เพิ่มslotfilterการ์ด6ช่อง+Allร่วมRarityและclearhiddenselection;UI-only/noSQL.

## รายละเอียด
ใช้cardView/modifierTextเดิมและprogress.cardsของactor/slot. ไม่มีcardsในslotว่างหรือsocketล็อก. มือถือportraitและปุ่มท้ายแผงอ่านง่าย.

## ขั้นตอน
1. ตรวจstackingcontextและcaptureก่อน/หลังจากhit-testingจริง
2. แก้CSSจำกัดbadgeในcellและลำดับfooter
3. เพิ่มcurrentequippedcardinfo/scrollbody/fixedactions
4. ตรวจnative320390/regression/build/M0/publicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01:เลข/grade/owner/selectionไม่ทะลุpanelขณะย่อย,scroll/expand/confirm/cancelเดิม
- [x] AC-02:การ์ดในSlotSheetตรงactor/slot/order/level/effects;empty/locked/NPC/longtextและfooterถูกต้อง
- [x] AC-03:กรองช่องการ์ด6ส่วน/All+Rarity/select-all/clear/emptyและAddCardเฉพาะslot;gearfilterเดิม
- [x] AC-04:native/regression/rootbuild/M0/publicผ่าน,content/packเดิม ไม่มีownerwrites

## วิธีตรวจ
T157-AC01..04/design70;nativehit-testingและactualReact/disposablememory,review/evidence157.

## Blocker / คำถาม
ไม่มี;ผู้ใช้ขอทั้งสามส่วนชัดเจน.

## ผลตรวจ
Local native12groups/rootbuild/M0ผ่าน;content/packเดิม. VercelSUCCESS sourceff8ed2e68/public4groups/24bundleSHA/login320390/CSSfixtureผ่าน;ไม่มีownerwrites.
