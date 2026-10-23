# TASK-120 — สมุดสกิลในเกมและแตะรายละเอียด Timeline

Milestone: M4 · D153 · [design44](../design/44-skill-catalog-and-timeline.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-020, TASK-024, TASK-070, TASK-119 (done).

## เป้าหมายและผลส่งมอบ
อ่านสกิลทุกอาชีพในเกมเพื่อเลือกบิลด์ และแตะTimelineเพื่อรู้สกิลนั้นทำอะไรได้.

## ขอบเขตและรายละเอียด
ตามdesign44. ไม่แก้engine/balance/เซฟหรือเปิดHi-class.

## ขั้นตอนการทำงาน
1. ตรวจcatalog/ข้อความ/Timeline/session snapshotsและทางเข้าUI
2. แยกข้อมูลcatalog/รายละเอียดresolvedใช้ร่วมกับหน้าสกิล;เพิ่มdialogภายในเกม
3. เชื่อมTimelineทั้งdraft/live/history/log และตรวจactualrank/focus/readonly/mobile
4. build/targeted/readiness/realChrome→pushmain→publicก่อนdone

## เกณฑ์ตรวจรับ
- [x] AC-01: สมุดสกิลภายในเกมเข้าได้จากSettings/หน้าสกิล/เปลี่ยนอาชีพ;19jobs126skillsรวมinherit/passive/copy/ยังไม่เรียน เลือกrank/searchอ่านผลได้และไม่มีลิงก์เปิดแท็บใหม่ในเมนูเกม
- [x] AC-02: Timeline draft/live/หลังจบและLogแตะดูรายละเอียดได้;ใช้actualactor resolveddefinitionและrankจากsessionพร้อมเวลา/ผลเดิม,missingไม่เดา;ปิดกลับTimelineได้โดยไม่หยุดหรือresetไฟต์
- [x] AC-03: อ่านcatalog/Timelineไม่มีsavecommandsหรือsimulationใหม่/ไม่มีbody-VFX-audioโหลดจากcatalog;สกิลคิวอาชีพทุนและcontent/packhashไม่เปลี่ยน;nativeicons320390/focus/Escape/เลือกเร็วไม่stale
- [ ] AC-04: targeted/build/boundaries/readiness/actualAuthAPI-SQL-mobileและpublicproductionผ่านก่อนdone ไม่SQL/env/ownerwrite/balancebatch

## วิธีตรวจและหลักฐาน
T120-AC-01–04 ในacceptance-matrix/design44. Unit readonly/runtime+actualChrome320390/AuthAPI/SQL/public. ผู้ตรวจ:Codex · รอบ1 localผ่าน/รอpublic AC04.

## Blocker / คำถาม
ไม่มี

## บันทึกการทำงานและ review
28targeted+4previewregressions/build/root-filtered/boundaries/readiness8/actualAuthAPI-SQL-mobile5groupsผ่าน;frozenfinalr5. Readonly0commands/0body-VFX-audioเพิ่ม;onlyintentionalbattle.start_story/finish. รอpush/hostedก่อนdone.
