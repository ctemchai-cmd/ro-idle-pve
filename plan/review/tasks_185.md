# TASK-185 — Story บท13–15 endgame Lv100

Milestone: M4 · D206–208

## งานที่ต้องรอก่อนหน้า
TASK-014 (done)

## ขอบเขต
เพิ่ม90ด่าน13-1ถึง15-30,บอส/มอนnativeหลากหลาย,ก้าวความยากเหนือ12ชัดเจน,เกียร์100/เรทบทใหม่. ยึด [design92](../design/92-events-story-shop.md).

## ขั้นตอน
1. เก็บbaselineและล็อกข้อมูล/สัญญา
2. ทำ shared rules/schema/data/UI
3. ตรวจขอบเขตพร้อมpending/reloadและrollback
4. root+filtered/native/hostedและบันทึกผล

## เกณฑ์ตรวจรับ
- [x] AC-01: พฤติกรรมตามขอบเขตใช้shared rulesและข้อมูลจริง
- [x] AC-02: ของ/สิทธิ์/แต้มจ่ายครั้งเดียวและข้อมูลผิดไม่เสียของ
- [x] AC-03: targeted+strict/M0/root-filteredผ่าน
- [ ] AC-04: native320390และhostedreleaseผ่านก่อนdone

## ผลตรวจในเครื่อง
850 TS,18 new cases,actual React/native320390 7groups,M0/strict/root+filtered1700files identicalผ่าน;รอVercel/publicก่อนdone. ไม่SQL/env/owneraccess.
