# TASK-081 — ลดการ์ดจากฟาร์มให้แรร์เฉลี่ย1–3ใบต่อ12ชั่วโมง

Milestone: M4 · D-107 · Dependencies: TASK-073, TASK-038, TASK-040 (done)

## งานที่ต้องรอก่อนหน้า

- TASK-073, TASK-038, TASK-040 (done)

## ขอบเขตและรายละเอียด

ผู้ใช้เลือกแรร์มากเฉลี่ย1–3ใบ/12h จากเดิม20–40%ทุก5min จึงเป็น1–2%ทุก5minตามordinalด่าน versioncard_farm_v2 คงquality/Normal-Mini-MVPpool/tier/cardidentity/stats/gacha/gear/currenciesเดิม จำนวนเป็นค่าเฉลี่ยไม่รับประกัน เก็บitems/pendingเก่าและoldfrozenprofileจนsettleoldintervalครั้งเดียวแล้วfarm.claimติดตั้งv2สำหรับช่วงถัดไป ไม่ย้อนหลังลดของสะสม ไม่เพิ่มสูตรใหม่หรือSQL

## ขั้นตอนและผลส่งมอบ

1. ตรวจsourceและการผูกข้อมูลเดิม แล้วปรับจุดแสดงผล/เรทตามขอบเขต
2. ตรวจownershipหรือfrozenrewardcutoverด้วยfixedfixtures และตรวจstaticmathเฉพาะที่เปลี่ยน
3. ตรวจbuild/M0ตามข้อมูลที่เปลี่ยน และactualmobile320/390ด้วยAuth/SQLทดสอบชั่วคราว
4. Push/deploy ตรวจpublicproduction แล้วสรุปหลักฐาน/ย้ายdone

## เกณฑ์ตรวจรับ

- [ ] AC-01: ทุก130ด่านchance1–2%ทุก300000msเพิ่มตามordinal; staticexpectation12h144rolls=1.44–2.88ใบ ไม่มีpity/guaranteeหรือkill/speedinput
- [ ] AC-02: เปลี่ยนเฉพาะfarmchance/version/documentation ไม่แตะquality/grade/tierweights/cardpower/gacha/gear/resource/dropinterval; owned/pendingitemsเดิมคงbytevalues
- [ ] AC-03: Oldfrozenv1intervalใช้profileเดิมจนreserveครั้งเดียว แล้วfarm.claimติดตั้งv2; retry/split/fullbag/12hcapไม่reroll/จ่ายซ้ำ และoldno-cardไม่retroactive
- [ ] AC-04: Focusedfarm/migrationchecks/M0/build/type/boundaries/secretsและactualmobilefarmrates/hostednewdataผ่าน ไม่มีownerwrite/6173restart/SQL/env/newassetsหรือbalancebatchใหม่

## Review

รอหลักฐานจริง
