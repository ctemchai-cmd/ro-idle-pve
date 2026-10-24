# TASK-139 — ร้านแลกเป็นชุดและปรับUIเศษสกิล/Panel

Milestone: M4 · D167 · design56

## งานที่ต้องรอก่อนหน้า

TASK-051, TASK-124, TASK-138 (done)

## ขอบเขตและผลส่งมอบ

ทำห้าข้อที่ผู้ใช้ขอ:แลกเศษสกิล/ลบCrystalhow-to/เพิ่มร้านและราคา/buymax/Panelธีมสอดคล้อง. Sharedshopquote/reducer/max99;noowner/SQL/env/6173. ไม่ปรับbattle/gachaprice/dropratesหรือresetrights.

## ขั้นตอน

1. ตรวจauthority/freezeร้านเก่า/กำหนดราคาและโควตาพร้อมบันทึก
2. sharedpurequote/max/reducer/schema+loader validation/serveronecommit
3. UIseg/flow/stepper/spacing/buymax/singleflightและPanelwhite-blue
4. ทดสอบเงิน/สิทธิ์/oldcounter/overflow/99/replayจริงและมือถือ
5. fulltest/build/review/deploy/hostedก่อนdone

## เกณฑ์ตรวจรับ

- [x] AC-01: แลกเศษสกิลมีtab/flow/nativeicons/quantity/spacingและปุ่ม44pxอ่านง่าย320390,รวม10→1/ย่อย1→5เดิม;กรอกผิด/เงินไม่พอ/กดย้ำไม่สร้างหลายคำสั่ง
- [x] AC-02: ข้อความCrystalจากAFK/หาCrystalถูกเอาออกจากร้าน/การ์ด/อุปกรณ์ทั้งหมด ไม่มีช่องว่างทิ้งไว้
- [x] AC-03: Crystal20ครั้งต่อวัน×10Crystal/25000gold;แพ็กวัสดุ10ครั้ง/วัน,Gold2500/3000/4000/5000,scroll6000/99สิทธิ์;grantเดิม/nonGoldpriceเดิม/ซื้อไปแล้วไม่นับใหม่
- [x] AC-04: แลกทั้งหมดคิดmin(เงิน,โควตา,ขีดจำกัด,capacity)ด้วยsharedquote;1command/receipt/revision,20Crystalexchangeและ99scrollได้ในครั้งเดียว;overflow/ขาดเงิน/replay/dayrollไม่จ่ายซ้ำหรือหักบางส่วน
- [x] AC-05: Panelร้าน/แลกเศษ/หอคอย/ดัน/กาชา/Refine/Stats/เลือกอาชีพใช้white-blue surfacesสอดคล้อง ไม่แตะrarity/glow/ข้อมูลต่อสู้และmobileportrait
- [ ] AC-06: unit/actualreducerและHTTP-receipt+mobile320390interaction/pending/reject/overflow/build+filtered/hostedผ่านก่อนdone;ไม่SQL/env/owner/6173

## วิธีตรวจและหลักฐาน

T139-AC01–06:tests/game/shop-batch.test.ts;isolatedmobile+APIreceipt;plan/evidence/task-139-review.json. Localผ่าน672TS/29targeted/8mobile-HTTPgroups/root+filteredbuild; รอVercelและhosted.

## Blocker / คำถาม

ไม่มี
