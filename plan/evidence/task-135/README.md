# คำอธิบายพลังโจมตี รางวัลอัตโนมัติ และ Auto Battle

24 ตุลาคม 2026 · TASK133–135 / D164

## สิ่งที่เปลี่ยน

- คำอธิบายทุกสกิลและทุกระดับแยก **P.ATK** กับ **M.ATK** รวม Passive, HoT, การ์ด, Timeline และ Asura ที่ใช้ P.ATK+SP
- บัฟโจมตีทีม Battle Cry, Impo, Loud Voice, Weapon Perfection, Maximum Overthrust และ Bard Battle Song เพิ่ม M.ATK ด้วย ratio/เป้าหมาย/เวลาเดียวกับ P.ATK รวม Awaken บัฟเฉพาะตัวไม่เปลี่ยน
- ชนะ Story/Tower จ่ายรางวัลและช่วงฟาร์มที่ปิดในคำสั่ง finish เดียว ไม่มีปุ่มรับรางวัลหรือคำสั่งย้ายฟาร์มเพิ่ม กระเป๋าเต็มยังบันทึกชัยชนะและเก็บของเดิมไว้รับอัตโนมัติหลังมีพื้นที่
- Auto Battle ที่หน้าแรก/หอคอย ต่อ frontier หลังยืนยันผลจริง ชนะล้างตัวนับ แพ้หรือหมดเวลา **3 ครั้งติด** หยุดตามที่ผู้ใช้ยืนยัน
- กดหยุดปล่อยไฟต์ปัจจุบันให้จบ ยกเลิกไฟต์ถัดไปได้ตั้งแต่ intro; เปลี่ยนหน้า ซ่อนเกม เน็ตขาด รีโหลด หรือเปลี่ยนเซฟไม่เริ่ม Auto ต่อเอง

## ผลตรวจ

- **650/650 tests** ผ่าน รวม 3040 คำอธิบาย, exact frozen definition/ราคา/เวลา, บัฟทั้งสองค่าและ independent expiry, atomic win/AFK/replay/fullbag และ pure Auto transitions
- **37 regression checks** สำหรับ goldens และข้อความเดิมที่เปลี่ยนตามคำขอผ่าน
- root และ build ที่ตัด source asset library/private/docs/evidence ออกผ่าน: **626,129 gzip bytes**, pack เดิม **33,108,285 bytes**, PWA `1a190b6527500800`
- Actual disposable Auth/Postgres/API/SQL/Chrome **7+2 กลุ่ม** บน320/390: Story3ชนะต่อกันใช้6คำสั่ง start/finish ไม่มี reward/farm/advance request เพิ่ม; Tower2ชั้น, แพ้ชั้น200สามครั้งไม่มีครั้งที่สี่, หยุดintro, หยุดระหว่างไฟต์ให้จบครั้งเดียว, เปลี่ยนหน้าระหว่างintro, กระเป๋าเต็มแล้วได้การ์ดinstanceเดิม, response-loss/reconnectไม่จ่ายซ้ำ, reloadไม่เริ่มAuto และคำอธิบายจริงของImpo/Loud

[main7groups](../task-135-mobile-live.json) · [extra2groups](../task-134-mobile-live.json) · [actual stack](../task-135-local-stack.json) · [full tests](full-tests.txt) · [root build](build.txt) · [filtered build](filtered-build.txt)

Content hash `3b95a929ebae50fb99d488d58306527cea4017dd0e260197f6bf3d35c814b5dc`.

## กติกาและข้อจำกัด

Auto ใช้ engine/ความเร็วเดิมและ SaveController เดิม รางวัลอิง receipt; ไม่มีการรันเกมต่อขณะปิดหน้าจอ ไม่มี SQL/env ใหม่ และไม่ได้อ่านหรือเขียนบัญชีผู้เล่นจริง. การทดสอบมือถือเป็น Chrome จำลอง ไม่ใช่เครื่อง Android ของผู้เล่น. ยังไม่อ้างว่า balance ทุกทีมหลังบัฟเวทเท่ากัน.

รอบแรกพบ golden ที่คัดลอก stat ผิดเป็นphysicalแทนmagicalและข้อความคาดหวังเก่า แก้ oracle ตามนิยามใหม่แล้วรันครบ650ผ่าน. รอบ browser แรกพบ race ในการ seed บัญชีทดสอบนอก protocol และ init script บน about:blank; แก้ตัวทดสอบและเก็บรอบล้มเหลวไว้ใน `.local/auto-battle-debug/round1` ไม่ใช่การแก้หรือรีเซ็ตเซฟผู้เล่น.

## เผยแพร่

Source `7a76b40cc` ขึ้น Vercel สำเร็จและผ่าน public hosted 4 กลุ่ม: API hash/SIN1/auth401, SHA ของ24bundles, nativeคำอธิบายImpo/Loud/Asura/Bolt320/390, ไม่มี error หรือ owner writes. [Hosted proof](../task-135-hosted.json). TASK133–135 done.
