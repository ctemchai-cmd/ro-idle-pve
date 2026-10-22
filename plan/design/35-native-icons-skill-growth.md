# Native RO UI และการเติบโตสกิล — 22 ตุลาคม 2026

D-130–134 / TASK-101–105. ตัวเลขเป็น assistant trial ตามคำขอผู้ใช้ ไม่ใช่สูตร reverse-engineered ของ RO และไม่ใช่ผล balance simulation.

- Upgrade: native lv_up_off43×43. EXP: Battle Manual24×24. ใบธาตุ: Elemental Converter ไฟ/น้ำ/ดิน/ลม24×24จากmetadataเดิม. ดู refs ใน src/renderer/shell-visuals.json.
- อาชีพ19รูปใช้ native skill art ประจำอาชีพ ไม่อ้างว่าเป็น official job-emblem set. Crop first sprite frame ผ่าน AssetPack.iconUrl cache; aria-labelคงชื่ออาชีพ. รูปทั้งหมดมีอยู่เดิมในpack.
- เอา how-to/coaching ที่ซ้ำออกจากหน้าเกม แต่คง costs/effects/requirements/refund/risk warnings. ขณะกำลังวางสกิลคงชื่อที่เลือกและปุ่มยกเลิก. ระดับการ์ดในbagแสดงเลขล้วนไม่มี C.
- Asura: ATK curveเดิม, SPcurveทุกระดับ×4 = 1102.5–2047.5%ของcurrent SPก่อนจ่าย. ไม่ใช่×4ดาเมจรวม และไม่คูณmax SP. ใช้สูตรเดิม/จ่ายSPทั้งหมดขั้นต่ำ30+5spheres/cast1300/ACD1600/ขัดแล้วไม่คืน. Finger/Tripleและสกิลอื่นไม่แก้.
- Blessing: duration_ms Lv1–10 = 5500,6000,6500,7000,7500,8000,8500,9000,9500,10000 ทั้งattack_up/magic_up. ผู้ใช้แก้ข้อเสนอ20sเป็นสูงสุด10s. คงmagnitude/SP/CT/ACD/independent additive instances per-source per-expiry ไม่มีrefresh/cap.
- Refine: ore=8×target(+60%จาก5×target); +1…+10ใช้8…80 รวม440เมื่อสำเร็จทุกขั้น. Gold/chance/pity/modifiers/card gatesเดิม; failureจ่ายขั้นปัจจุบันและยังสะสมpity. No old-cost repricing/retroactive debit/refund. Economy generatorรักษาincome reference5×targetเพื่อไม่เพิ่มรายได้หินชดเชยการเพิ่มsinkเอง.

Content/packเปลี่ยน: ใช้existing signed-backup/migrate flowเมื่อจบไฟต์และreload ไม่ต้องSQL/envใหม่ ไม่แตะowner cloud save/6173โดยตรง. Source checks/M0/static audit/focused engine+UItests/public artifact proofต้องผ่านก่อนdone.
