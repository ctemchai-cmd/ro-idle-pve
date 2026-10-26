# D181 — ชั้นแสดงผลตอนย่อยและข้อมูลการ์ดในช่องอุปกรณ์

26ตุลาคม2026 · TASK157. ผู้ใช้แจ้งเลขบนการ์ดทะลุpanelข้อมูลขณะเลือกย่อย และขอให้แตะอุปกรณ์ในหน้าตัวละครแล้วเห็นการ์ดที่ใส่พร้อมคำอธิบายทันที.

Rootcause: bag-cellpositionrelativeไม่มีstackingcontext;small/cardgrade/ownerbadgesมีz-index1/3จึงแข่งกับbulkstickyfooterที่zauto. ให้bag-cellisolation:isolateและfooterz2(ใต้pageheaderz3),พื้นfooterใช้สีทึบเพื่อไม่เห็นgridจางๆผ่านalpha;ไม่เพิ่มzสูงแบบสุ่ม. Native dialogtoplayerยังจัดfocus/Escapeตามเดิม. ตรวจpaint/hitorderจริงตรงbadgeที่ซ้อนinspectorระหว่างscroll/expand;ก่อนแก้จำลองค่าautoและalphaเดิมเพื่อจับอาการ.

SlotSheetแสดงsectionการ์ดที่สวมใส่ เฉพาะactor/slotที่เลือกและsocketเปิดตามRefine. ใช้progress.cardsตามลำดับช่อง ไม่หาcardจากitemใหม่/ไม่แสดงcardของNPCอื่น/ไม่แสดงการ์ดdormantในช่องไร้อุปกรณ์. แสดงภาพnative30×40,ชื่อ,ลำดับช่อง,rarity,LvและผลจริงจากcardView/modifierTextเดียวกับหน้าการ์ด. ไม่aggregateหรือคำนวณสูตรซ้ำ. ข้อความยาวscrollในcontent;อัปเกรด/เปลี่ยนยังอยู่footerที่มองเห็นได้.

คำขอเพิ่มระหว่างงาน:แท็บการ์ดในBackpackเพิ่มslotfilter6ช่อง+ทั้งหมด ใช้itemdefinition.slotจริงผสมRarityแบบAND. Select-allใช้เฉพาะfreecardsที่แสดง;เปลี่ยนslot/rarity/resetล้างbulkเพื่อไม่ส่งhiddenIDs;inspectorแสดงเฉพาะใบในfilterปัจจุบันและslot/resetล้างตัวที่เคยแตะ. ไม่กระทบgearfilterหรือcardsของAlltab. AddCardในUpgradeSheetยังกรองcardInventory(state,slot)เดิมและต้องตรวจnativeว่าไม่ปนslot.

UI-only;ไม่แก้rules/prices/command/save/schema/content/pack/audioหรือownerdata. NoSQL/env/balancebatch/6173restart. ไม่ต้องfull740ซ้ำ;ตรวจactualnativeและrequiredbuild/M0พร้อมtargetedregressionตามscope.

AC01:เลขระดับ/rarity/owner/selectionของgridไม่ทับinspectorหรือdialog;scroll/expandมือถือ320390และกดย่อย/ยกเลิกทำงานเดิม.
AC02:SlotSheetแสดงเฉพาะการ์ดของslot/actorปัจจุบันตามลำดับและระดับจริง,1–3ใบ/empty/NPC/locked/longtext;ผลdirect/bonus/armor/procใช้helperเดิม,ปุ่มท้ายsheetเข้าถึงได้.
AC03:slotfilterครบ6ช่อง/All+Rarity/select-allreset/empty/gearเดิมและAddCardไม่ปนslot.
AC04:native320390+existingbulk/singlecardregression/rootbuild/M0/publicbundleผ่าน;content/packhashไม่เปลี่ยน ไม่มีownerwrites.
