# TASK-184 — Event ภารกิจ/บอสสลับรายสัปดาห์

Milestone: M4 · D206–208

## งานที่ต้องรอก่อนหน้า
TASK-183

## ขอบเขต
4รอบหมุนเวียน mission/boss,แต้ม/เช็กอิน/ร้านแลกMVPและอาวุธLegendary+วัตถุดิบ;sharedengine/receipt/save. ยึด [design92](../design/92-events-story-shop.md).

## ขั้นตอน
1. เก็บbaselineและล็อกข้อมูล/สัญญา
2. ทำ shared rules/schema/data/UI
3. ตรวจขอบเขตพร้อมpending/reloadและrollback
4. root+filtered/native/hostedและบันทึกผล

## เกณฑ์ตรวจรับ
- [x] AC-01: พฤติกรรมตามขอบเขตใช้shared rulesและข้อมูลจริง
- [x] AC-02: ของ/สิทธิ์/แต้มจ่ายครั้งเดียวและข้อมูลผิดไม่เสียของ
- [x] AC-03: targeted+strict/M0/root-filteredผ่าน
- [x] AC-04: native320390และhostedreleaseผ่านก่อนdone

## ผลตรวจในเครื่อง
850 TS,18 new cases,actual React/native320390 7groups,M0/strict/root+filtered1701files identicalผ่าน;Vercel/publicผ่านแล้ว. ไม่SQL/env/owneraccess.

## เผยแพร่แล้ว
Source `185739035061b240db2bc14fe095e11f4314649d` / [Vercel SUCCESS](https://vercel.com/chanon2/ro-idle-pve/FZxDpRhcF5VW5wQEQNvX7JKNeHGp); public5groups/27bundleSHA/6modernSHA/mobilelogin+demo320390ผ่าน. Exact clean Git checkout build1701filesตรงกัน.
