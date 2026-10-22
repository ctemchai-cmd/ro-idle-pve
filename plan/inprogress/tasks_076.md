# TASK-076 — แสดงธาตุสกิลและเกราะธาตุเป้าหมาย

Milestone: M4 · อ้างอิง D-102

## งานที่ต้องรอก่อนหน้า

- TASK-024, TASK-025, TASK-073 (done): รายละเอียดสกิล, live battle และการ์ดเปลี่ยนธาตุเกราะ

## เป้าหมายและขอบเขต

หน้าสกิลแสดงธาตุจากโปรแกรมจริง รวมดาเมจต่อเนื่อง/Passive/ผู้ช่วย/handler และแยกตามธาตุอาวุธจากธาตุตายตัว หน้าต่อสู้แสดงเกราะธาตุบอสและตัวที่โฟกัส อ่าน permanent source/card override ตามลำดับเดียวกับ engine ไม่คำนวณดาเมจใหม่ ไม่เปลี่ยนสูตร/สมดุล/ข้อมูลเกม/เซฟ/SQL/pack และไม่รัน balance simulation หรือรีสตาร์ต6173

## รายละเอียดและขั้นตอน

1. เพิ่ม client projection สำหรับชื่อธาตุและการอ่าน graph effects/status/triggers/summons/handler โดยป้องกันวงวนและไม่ผูกชื่อสกิล
2. แสดงป้ายธาตุขนาดเล็กพร้อมข้อความอ่านได้ในหน้าสกิล และระบุธาตุแต่ละผล เช่น Envenom hit ตามอาวุธ + DoT พิษ; heal/buff ไม่อ้างเป็น Holy
3. แสดงเกราะธาตุจริงใน boss HUD และตัวโฟกัส แยกจากธาตุอาวุธและบัฟ/debuff ไม่เพิ่ม API/save เมื่ออ่าน
4. ตรวจ targeted rules/UI, actual mobile Chrome320/390px, build/type/boundaries และ deploy ผ่าน main; ไม่แตะ owner save/private environment

## เกณฑ์ตรวจรับ

- [x] AC-01: ป้าย/คำอธิบายตรง authored skill effects ทั้ง126ท่า รวม Fire/Cold Bolt, Storm Gust, Envenom, Falcon, Auto Bolt, Hell Plant, Detonate, Heal/Healing Song; หลายธาตุแยกชัดและ graph มี cycle ไม่วนไม่จบ
- [x] AC-02: เกราะบอสตรง checkpoint ทุกโหมดและ priority card/source ล่าสุด→enemy tag→Neutral; Fire Endow เปลี่ยนธาตุอาวุธแต่ไม่เปลี่ยนเกราะหรือ fixed spell; projection ไม่แก้ state/RNG/timing/damage
- [x] AC-03: UI จริงบน mobile Chrome320/390px อ่านธาตุสกิล/บอสได้ ไม่ล้น ไม่ต้องบันทึกเมื่อเปิดดู และไม่มี browser error; ตรวจภาพจริง
- [ ] AC-04: build/type/boundaries/secrets ผ่าน content/packhashเดิม; push/deploy และ public smoke ผ่าน ไม่มี SQL/env/migration/owner-write/6173restart/balance simulation

## วิธีตรวจและหลักฐาน

Focused element presentation tests และ disposable isolated real Auth/PostgREST/PostgreSQL/mobile Chrome เท่านั้น ไม่ใช้ owner account/public mutations ผลเก็บ plan/evidence/task-076-*

## Blocker / คำถาม

ไม่มี ใช้ธาตุและลำดับ priority เดิมของ engine

## บันทึกการทำงานและ review

- 22ต.ค.2026: รับคำขอแสดงธาตุสกิลและเกราะเป้าหมาย เริ่ม implementation

- Local review: targeted33ผ่าน (5element+100damagepairchecks/all126definitions และ28regressions), build/type/boundaries/secretsผ่าน content/packเดิม; actual isolatedAuth/PostgREST/Postgres/mobileChrome3กลุ่มผ่าน 9skilldetails +Story/Tower/Daily +Angeling/HolyและliveFireEndow. ตรวจภาพ320/390แล้ว ไม่ล้น/0inspectioncommands. Publicshared demo local2กลุ่มผ่าน; รอactualdeploy AC04
- Failed fixture roundsเก็บไว้: round1ใช้VIT100เกินmanualcap; round2ใส่การ์ดในarmorว่างจึงยังไม่activeตามกติกาเดิม แก้เฉพาะtestfixtureเป็นVIT60และสวมarmorก่อน สุดท้ายผ่าน ไม่เปลี่ยนกติกาเพื่อให้เทสต์ผ่าน

| เกณฑ์ | วิธีตรวจ | ผลจริง |
| --- | --- | --- |
| AC-01 | authored126skills/indirect-effect graph/cycle guard + actualskillUI | ผ่าน targetedและui-live |
| AC-02 | 100damagepairs/sourcepriority + activeAngeling/Endow/focus/Story-Tower-Daily | ผ่าน targetedและui-live |
| AC-03 | actualChrome320/390, view-only command trace, full screenshots | ผ่าน3groups; ภาพตรวจแล้ว |
| AC-04 | build/readiness/actualproduction | build/readinessผ่าน รอhosted |
