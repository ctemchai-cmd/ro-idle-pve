# D210–211 — Boss icons, event currency and Artifact UI

ผู้ใช้ขอmodernbossicons,แต้มกิจกรรมเป็นicon,เมนูไม่ใช้ดาบไขว้เหมือนกัน;ขอปรับร้านสุ่มArtifactและย้ายArtifactไปต่อจากรองเท้า/แหวนในหน้าตัวละคร.

Renderer shell.enemy_skill_icons ผูก11legacy/passiveIDกับmodernplayerartตามrole;อีก8borrowedprogramใช้presentationของผู้เล่นเดิม. shared locateSkillIcon ใช้ในlazySkillIconและAssetPack.prepare;Timeline/Historyอ่านcacheเดียวกัน. แยกiconจากrecipeไม่แตะnativeVFX/audio. nativeS_badgeเป็นแต้ม;questscroll/MVPPoringcrown/mapflag/chestแยก4โหมด. ไม่มีเพิ่มcurrencyในwallet.

Character gear-col เพิ่มArtifactเป็นรายการที่4ต่อจากaccessoryซ้าย/shoesขวา. กดของที่ใส่เปิดsharedArtifactDetailSheetตรงตัว/ช่องพร้อมupgrade/lock/star/salvageconfirmation;ช่องว่างไปmanagement. ปุ่มเดิมในชื่ออาชีพเอาออก. จัดการArtifactอยู่buddy;Store5tabsและrouteartifact_drawใช้ArtifactSummonเดียว. Highjobpool/weights/pity/cost/stockยังsharedbackendเดิม;UIquoteจากclientfacadeอ่านกติกาจริง. Ticketหักก่อนCrystal,ผล1/10แสดงrarity/skill,repeatคำนวณใหม่จากlateststate,oldresultsคงเมื่อรอ/ล้มเหลว,singleflight/UUIDของSaveControllerเดิม. ไม่เดาrandomในUI.

Renderer/client/UI/sourcepackเท่านั้น: core/engine_data/schema/contenthashต้องเดิม2ae7…;runtimepackhashเปลี่ยนได้. งบ32MiBรวมmanifestและinitial<=1566701. ไม่SQL/env/newsavefields/ownerAuth/balancebatch/6173. ต้องตรวจcleancommittedGitarchiveรวมลบpayloadก่อนpush.
