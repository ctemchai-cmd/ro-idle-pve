# D176 — เลขใหญ่ขึ้นและเด้งกระแทกขึ้น

ผู้ใช้ขอเลขใหญ่ขึ้นอีกนิดและเด้งแรงขึ้น. ฐานCSSheight damage30→34,critical/total38→43,heal26→30,incoming24→27. Popgain18→26% และจบ110msแทน140ms. Firstframeโตประมาณ21–23%,ช่วงอ่านโตประมาณ10–15%สำหรับเลข4หลักที่ไม่ติดขอบ.

วิถีใช้parabolaเดิม:apex44%/size1.25→.6/fade70%→100%. Duration650→620ms,dx64→76world,height62→78world. Initialverticalspeedประมาณ+32%,horizontal+25%. ไม่มีshake/แสงเพิ่มหรือดาเมจเพิ่ม. Reducedmotionคงนิ่งและใช้ฐานขนาดใหม่. ยอดMultiHitยังใช้firstimpactarc/latesthitbounce/holdfadeของD174. ไม่แก้engine/assetpack/สถานะ/เซฟ.

Hostedตรวจพบfontใหญ่ขึ้นแล้วviewportclampทำให้healที่ขอบซ้ายเด้งย้อนตอนย่อ:แก้retain actualpainted originตั้งแต่firstvisibleframe ทั้งhit/heal/total;ไม่กลับไปanchorนอกขอบหลังย่อ. Nativeตรวจขอบ24/696worldทั้ง4kind×320390.
