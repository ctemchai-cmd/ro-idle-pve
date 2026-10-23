# หน้า Preview สกิลทุกอาชีพ

D152 · TASK119 · 23 ตุลาคม2026. Public read-only `/skill-preview`, เปิดจากตั้งค่าเป็นแท็บใหม่เพื่อไม่รบกวนไฟต์/เซฟ. Lazy routeแยกจากbootstrapเกม.

ใช้catalogจริง19อาชีพ/126สกิล รวมสกิลClass1ที่สืบทอดและPassive/สกิลcopyRogue. เลือกอาชีพ/สกิล/rank/เพศจากpresetจริง;querystringแชร์selectionได้. ไม่มีHi-classสกิลที่ยังไม่ได้สร้าง. ใช้icon/ตัวละคร/weapon/VFX/เสียงจากpackเดียวกับเกม.

Disposable SkillPreviewSessionใช้shared createBattle/advanceUntil/BattleRenderer. Skilldefinitionผ่านresolveSkillที่rankเลือก ไม่เปลี่ยนCT/ACD/cost/formulas. SIใช้3000msเดิม,4slotsเดิม;Activeใส่ช่องแรกที่เหลือnull. AllyHP35%,SP1000/ATK=MATK300ที่baseตัวอย่างLv70,enemyHP1000000/DEF30. เตรียม5บอลเฉพาะสกิลกินบอล โดยแก้เฉพาะinitialcheckpoint sandboxก่อนrestore ไม่ยกเว้นต้นทุนจริง. SpellBreakerมีศัตรูร่ายท่าจริง;Passiveแสดงผลจริงและnormalattackบริบท ไม่มีcastปลอม. ไม่เรียกตัวเลขตัวอย่างว่าbalance/บัญชีผู้ใช้.

Play/replay/pause,1x/2x/4x,เปิดเสียงหลังusergesture,รายละเอียดผล/CT/ACD/SPและeventlogกระชับ. animationใช้rAFและvirtualtimeต่อเนื่อง,หยุดเวลาตอนhidden;cleanuprAF/audio/packเมื่อออก. การเลือกเร็วserializeprepareเพื่อไม่ให้sceneเก่าทับsceneใหม่,แสดงerror/retryเมื่อโหลดไม่สำเร็จ. Mobile320/390ไม่ล้นแนวนอน,focus/labelsเข้าถึงได้.

AC: catalogครบ/validselection;all126ranks1/maxสร้างและresolveจริง/Passivesไม่cast;readonlyไม่มีaccountcommands;nativeeffects/heal/buff/spheres/summon/casting/audioบนChromeจริง;rapidselection/visibility/replay/resizeและbuild/publicproductionผ่าน. ไม่เปลี่ยนbalanceหรือsaveprotocol.
