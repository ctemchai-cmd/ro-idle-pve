# D191 — Gate of Hell: explicitly accepted high damage

TASK167. ผู้ใช้เสนอ1500–3000% แล้วลดเป็น1200–2500%ถ้าแรงไป. หลังรายงานผล96boundedfights:Chosen1200–2500beforeHP+standardAwakenขึ้น9.9k→26.3kDPSในChampion100power/dummyเทียบของ/บิลด์เดียวกัน ผู้ใช้เลือกชัดเจน “ใช้ 1,200–2,500% ก่อนโบนัส HP ยอมให้ท่าแรงขึ้นมาก”. ข้อนี้แทนเป้าสมดุล10kเดิมเฉพาะGate;ไม่เนิฟสกิลอื่นเพื่อชดเชยอัตโนมัติ.

NormalLv1–10 power12→25 (P.ATK), Awaken27.5→36.25 (110–145%ของNormalMaxตามcurveเดิม), Awpen20→35%เดิม. FullHPactualsacrifice99%ทำให้คูณ1.99:Normal2388→4975% ก่อนเกราะ/คริ. HP20%เสีย19%→1.19,เหลือ≤1%ไม่เสียเพิ่ม→1.0. คงcost5balls/58SP/CT600ms/ACD1300ms/weapon/1hit/crit/HPretain1%/snapshot/start-resolve/interrupt/IDs/prices/nativeart. Fingerไม่เปลี่ยน:72matchedsinglecastDEF0/300/1000พบAw1ประมาณ+29%/Aw10+70%,rawรวม+32%/+74%.

Sourceoftruth hi-class-v2.json และacolyte authoredcurvesตรงกัน. Archivedscopeoraclesคืนเฉพาะ2powerarraysจากbefore167;actualnewpower/mechanicsทดสอบแยก. Saveupdatebackupflowเดิม/ไม่SQL/ไม่owner access. ไม่อ้างว่าเป็นglobalclassbalance.

## เกณฑ์ตรวจ
AC01:ทั้ง20ranksตรงcurve/แก้เฉพาะGatepower/otherprogramcosttimeHPpenunchanged
AC02:actualengineHPfull/20%/≤1%/interrupt/crit/speedcheckpointยังถูกต้อง,96A/Bรายงานผลและคำยืนยันผู้ใช้
AC03:รายละเอียดสกิล/มือถือ320390/fullTS/root-filteredbuild/publicผ่าน
