# TASK-121 — ฐานลำดับอาชีพและสืบทอดสกิลสำหรับ Hi-class

Milestone: M5 · [design45](../design/45-hi-class-implementation.md)

## งานที่ต้องรอก่อนหน้า
TASK-014, TASK-024, TASK-112, TASK-118, TASK-120 (done).

## เป้าหมายและผลส่งมอบ
มีแหล่งข้อมูลลำดับอาชีพร่วมกันสำหรับ validation, การเรียน/compile สกิล, สมุดสกิล และ preview เพื่อไม่ทำสกิล Class 2 หายเมื่อเพิ่ม Hi-class. ระบุสัญญาและงานที่ต้องเสร็จก่อนเปิดจริง.

## ขอบเขตและรายละเอียด
ทำส่วนโครงสร้างที่ไม่ขึ้นกับคำตอบเรื่องเลื่อนอาชีพ/ขอบเขตแพตช์. ยังไม่เปิด Hi-class, เพิ่มพลัง, ปลดด่าน, เปลี่ยน cap70 หรือแก้เซฟผู้ใช้. จำนวนอาชีพ/สกิลที่ใช้งานจริงยัง19/126.

## ขั้นตอนการทำงาน
1. ตรวจจุดที่สมมติว่าอาชีพมีแค่ root/current และข้อจำกัด schema/ราคา/ภาพ/เซฟ
2. เพิ่ม pure job catalog ที่ตรวจ parent/root/cycle/duplicate และหา ancestry ได้หลายขั้น
3. ใช้ catalog ร่วมกันใน loader/domain/client; ตรวจ current behavior และ fixture Hi-class/Class3 ที่ยังไม่เปิดจริง
4. ตรวจ targeted/build/boundaries/readiness; งานเปิด Hi-class ต้องมี task แยกและหลักฐาน runtime ก่อนปล่อย

## เกณฑ์ตรวจรับ
- [x] AC-01: catalog สร้าง19อาชีพเดิมตามลำดับเดิม และ fixture4ขั้นคืน ancestry ที่ถูกต้อง;ปฏิเสธ parentหาย/cycle/duplicate/cross-root โดยไม่แก้ input
- [x] AC-02: การเรียน/validate/compile/สมุดสกิล/preview ใช้ ancestry เดียวกัน;Hi-classfixtureสืบทอดClass1+Class2ของตน ไม่ได้ท่าสายพี่น้อง/ต่างroot
- [x] AC-03: Class2จริง19อาชีพ126สกิล/cap70/lockedบท10–12/ทุนและloadoutเดิมคงพฤติกรรม;targeted tests/typecheck/build/boundariesผ่าน
- [x] AC-04: design45 ระบุรายการต้องทำก่อนเปิดHi-class/คำตอบที่ยังรอ/26ท่าใหม่/ภาพ/อัปเลเวล/เซฟ/Awaken และไม่อ้างว่าHi-classเสร็จจากฐานโครงสร้าง

## วิธีตรวจและหลักฐาน
T121-AC-01–04 ในacceptance-matrix. Unit invalid graph/ancestry/no-mutation/current-catalog parity, targeted progression/catalog/preview/content regression, build/boundaries/readiness. หลักฐานเติมหลังรันจริง.

## Blocker / คำถาม
ไม่มีคำถามค้างในฐานงานนี้. ผู้ใช้ยืนยันเก็บบิลด์/Awakenตั้งแต่Hi-class/ต้องสกิลMax/กลับLv1/ใช้เศษใหม่จากดันหลังๆและรวม-ย่อยเศษสองทิศ. งานเปิดจริงแยกตามdesign45.

## บันทึกการทำงานและ review
- 23ต.ค.2026 เริ่มตรวจจริง พบallowedSkill/สองcatalogกรองเพียงroot/current;class_treeปัจจุบันมีเพียงClass1→Class2;schema/ราคา/ภาพ/เพดานยังClass2. ไม่มีการเปิดHi-classจากการเตรียมด่าน.

- Review:65targetedTSผ่าน(รวม5jobgraphcases),typecheck/build/boundariesผ่าน. Current19/126/cap70และpackเดิม;Hi-Classfixtureเป็นpureancestry/quote/compile ไม่ใช่การเปิดใช้จริง. เริ่มรอบแรกพบclientfastpathไม่ได้สร้างjobsและguideส่งallowedSkillไม่ครบ แก้แล้วรอบ2+buildผ่าน. ไม่รันbalancebatch/ไม่SQL/ไม่แตะownerหรือ6173/ยังไม่deployฐานนี้เดี่ยวๆ.
