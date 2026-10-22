# Native RO UI และการเติบโตสกิล — 22 ตุลาคม 2026

D-130–134 / TASK-101–105. ตัวเลขเป็น assistant trial ตามคำขอผู้ใช้ ไม่ใช่สูตร reverse-engineered ของ RO และไม่ใช่ผล balance simulation.

- ประวัติ D-130 (ถูกแทนด้วย D-135/136 ด้านล่าง): Upgrade เคยใช้ lv_up_off43×43 และ19อาชีพเคยใช้ skill art ซึ่งผู้ใช้ปฏิเสธแล้ว ห้ามนำกลับมาแทน job emblems.
- EXP: Battle Manual24×24. ใบธาตุ: Elemental Converter ไฟ/น้ำ/ดิน/ลม24×24จากmetadataเดิม. ดู refs ใน src/renderer/shell-visuals.json.
- เอา how-to/coaching ที่ซ้ำออกจากหน้าเกม แต่คง costs/effects/requirements/refund/risk warnings. ขณะกำลังวางสกิลคงชื่อที่เลือกและปุ่มยกเลิก. ระดับการ์ดในbagแสดงเลขล้วนไม่มี C.
- Asura: ATK curveเดิม, SPcurveทุกระดับ×4 = 1102.5–2047.5%ของcurrent SPก่อนจ่าย. ไม่ใช่×4ดาเมจรวม และไม่คูณmax SP. ใช้สูตรเดิม/จ่ายSPทั้งหมดขั้นต่ำ30+5spheres/cast1300/ACD1600/ขัดแล้วไม่คืน. Finger/Tripleและสกิลอื่นไม่แก้.
- Blessing: duration_ms Lv1–10 = 5500,6000,6500,7000,7500,8000,8500,9000,9500,10000 ทั้งattack_up/magic_up. ผู้ใช้แก้ข้อเสนอ20sเป็นสูงสุด10s. คงmagnitude/SP/CT/ACD/independent additive instances per-source per-expiry ไม่มีrefresh/cap.
- Refine: ore=8×target(+60%จาก5×target); +1…+10ใช้8…80 รวม440เมื่อสำเร็จทุกขั้น. Gold/chance/pity/modifiers/card gatesเดิม; failureจ่ายขั้นปัจจุบันและยังสะสมpity. No old-cost repricing/retroactive debit/refund. Economy generatorรักษาincome reference5×targetเพื่อไม่เพิ่มรายได้หินชดเชยการเพิ่มsinkเอง.

Content/packเปลี่ยน: ใช้existing signed-backup/migrate flowเมื่อจบไฟต์และreload ไม่ต้องSQL/envใหม่ ไม่แตะowner cloud save/6173โดยตรง. Source checks/M0/static audit/focused engine+UItests/public artifact proofต้องผ่านก่อนdone.

## D-135/136 correction after user visual rejection23October

The D-130 choice of skill art as class emblems and lv_up_off as Upgrade was rejected. Use actualOriginClass UI_Common_Profession_Icon1–33 mapped by published profession id/name/icon (19currentjobs), storedlocally withsource/checksums. No skill/item/customglyphfallback forclassicons. User subsequently explicitly requested a skill icon containing+ forUpgrade: useSM_MOVINGRECOVERY24px withcentralplus. This is a user-authorizedpresentationreuse, not a claim that the originalROclient calls this Upgrade. OtherD132–134combat/economy rules unchanged.

## D-137 — ทดลอง12modern skill icons ตามไฟล์ผู้ใช้

ใช้ exact mapping ใน `assets/modern/suggestion-migrate.txt` กับ Acolyte4และMonk8. Meditationผูกกับ `acolyte_meditation` ซึ่งเป็น passiveร่วมที่Monkใช้จริง. นำเข้าเฉพาะ12ภาพ128×128ผ่าน `scripts/import_modern_skill_icons.py` เก็บsource/SHA/sidecar; ไม่ย้ายทั้งคลังและไม่แก้ต้นฉบับ. ภาพใหม่อ่านผ่านpresentationร่วมของหน้าสกิล/สี่ช่อง/Timeline/status/spheres ใช้smoothingสำหรับภาพmodern. Skilldefinitions/VFX/audio/formulasและenginecontenthashไม่เปลี่ยน ไม่มีSQL/env/save migrationใหม่. ไม่อ้างว่าภาพผู้ใช้เป็นnativeROที่ตรวจแหล่งแล้ว.

Importerปฏิเสธlocalpathนอก `assets/modern` และsourceSHAที่เปลี่ยน; visualreviewต้องดูภาพจริงแยกจากautomaticdecode. Payloadที่เปลี่ยนจะไม่สืบทอดคำว่าreviewed. ตรวจactualmobile320/390และpublicartifactก่อนปิดTASK106.
