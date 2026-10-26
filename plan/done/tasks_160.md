# TASK-160 — ปุ่ม RO Idle Adventure แบบ Modern

Milestone:M4 · D184 · [design73](../design/73-idle-adventure-controls.md)

## งานที่ต้องรอก่อนหน้า
TASK-158, TASK-159 (done).

## ขอบเขต
แทนClassicbevelด้วยIdleAdventure-style controlsตามภาพอ้างอิงล่าสุด. CSS/verification/docsเท่านั้น.

## รายละเอียด
primaryทอง/secondaryฟ้าอ่อน/selectedblue/corners12/softshadow;nofakeassets. คงพื้นที่แตะ/spacing/mobileportrait/framelessskills/cardsและgameplay.

## ขั้นตอน
1. ดูreferenceจริงและตรวจexistingselectors
2. แทนbuttonskinโดยเก็บstates/contrast/keyboard/reducedmotion
3. ตรวจactualReact320390/build/M0/hostedแล้วpublish

## เกณฑ์ตรวจรับ
- [x] AC-01:shop/cards/controlstates320390/primarygold/blue/danger/focus/disabled/press/darkbattleอ่านง่าย ไม่มีhardbevel
- [x] AC-02:rootbuild/M0/publicผ่าน;content/engine/schema/implementation/packเดิมและnoownerwrites

## วิธีตรวจ
Design73/evidence160/native+publicactualCSS/rootbuild/M0/fingerprintcompare.

## Blocker / คำถาม
ไม่มี;คำขอล่าสุดกำหนดROIdleAdventureชัดเจน.

## ผลตรวจ
Localnative3groups/14CardSheets/shop+states320390/rootbuild/M0ผ่าน,ทุกgameplayfingerprint/packเดิม;VercelSUCCESS source39a3f4f66/public4groups/24bundleSHAผ่าน.
