# D195 — Character level reset with full refund

TASK171. ผู้ใช้ยืนยันเลือกmain/NPCกลับLv1/Class1+คืนทุนทั้งหมดสำหรับlevel/Break/skill/Awaken/Status;เก็บgear/cards/Refine/Enchant,ถอดของใส่ไม่ได้กลับinventory. โลก/ด่าน/daily/farm/ร้าน/กาชา/ตัวอื่นคงเดิม. sharedquote/confirmation/atomiccommand/UUID. ราคาเก่าarchiveคิดเฉพาะmissingoldprefix,บวกfutureactualpaidledger;ไม่injectตอนmigration. เก็บfuturelevel/Breakledgerหลังcompact. Rejectbadcount/overflow/activebattle;repeat/reset-relevelไม่เพิ่มทรัพยากร.

## เกณฑ์ตรวจ
AC01: data/schema/source scope/quoteตรงต้นทุน
AC02: legacy/new/mixed/reload/atomic/replay/overflow/keepownership
AC03: native320390/fullTS/root-filtered/M0/public

Legacy accounting: pre-featurecompaction discarded level/Break entries. Quote uses only missing oldest level/gate prefix from immutableprogression-costs-v1 archive, plus all retainedactual vectors (including future versions/discounts). Reconstructed prefix rows are markedlegacy_<feature>_<requestUUID> and archived in existing refunded_ledger_entries; no accountmigration/newsavefields ornewreceiptfields. Future free level grants must retain zero-paid level quantities so they cannot be mistaken for the old discarded prefix. Clear refunded scopes only after the same transaction credits wallet; repeatedreset/relevel uses currentretainedpayments.
