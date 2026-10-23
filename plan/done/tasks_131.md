# TASK-131 — สกิลหมู่รวมพลังเมื่อเหลือเป้าเดียว และปรับสายดาเมจที่ตามอยู่

Milestone: M4 follow-up · ประเภท: พัฒนา/ตรวจรับ · อ้างอิง D-161 / design/50-boss-focus-balance.md

## งานที่ต้องรอก่อนหน้า

TASK-129 และ TASK-130 done: controlled audit และ Awaken identities ที่ขึ้นเว็บแล้ว

## เป้าหมายและขอบเขต

ยังตีหมู่ได้ แต่เมื่อเหลือศัตรูตัวเดียวเพิ่มพลังตามโปรแกรมสกิล ใช้ร่วมกับ direct/DoT และคำอธิบายทุก rank; ปรับตัวเลขสายเวท/Alchemist ที่ผล audit ตามอยู่และวัดใหม่ ไม่ล้างเซฟ/ราคา/คิว/สถานะ/อุปกรณ์หรือปรับความยากด่าน

## ขั้นตอน

1. เก็บ frozen content ก่อนปรับและนิยาม bonus/จุดประเมิน/ผลต่อ periodic/summon
2. เพิ่ม typed optional composition field และใช้ shared engine เท่านั้น; ปรับค่าที่ระบุเป็นรายสกิลโดย generator ที่รันซ้ำได้
3. ตรวจเป้าเดียว/หลายเป้า/เป้าตาย/ถูกขัด/periodic/1×2×4/checkpoint และข้อความจริง
4. เปรียบเทียบบิลด์เดิม seed เดิม แล้วค้น candidate บิลด์ใหม่แยกจาก fixed A/B ทั้ง Class2/Hi-class และตรวจ gear1/20/40/60
5. ตรวจ build/browser/เซฟเข้ากันได้ ปล่อย Vercel และตรวจ public read-only; ไม่เข้า owner account หรือ restart6173

## เกณฑ์ตรวจรับ

- [x] AC-01: สกิลหมู่ยังตีหลายเป้าได้ พลังเพิ่มเฉพาะ resolve ที่มีศัตรู living/targetable ตัวเดียว; ฝั่งฝ่ายเดียวกัน/ตัวตาย/untargetable ไม่นับ; direct/periodic snapshot ไม่บวกซ้ำและไม่เพิ่มให้ normal/heal
- [x] AC-02: ราคา/ทุน/IDs/เลเวล/CT/ACD/SP/interrupt/4-slot/uncapped buffs เดิม; descriptions แสดง bonus จริง และทุกการเปลี่ยนข้อมูลระบุได้
- [x] AC-03: มี fixed A/B และ candidate re-screen หลายระดับ/gear/seed พร้อม total/skill/team DPS; รายงานผลและข้อจำกัดตามจริง ไม่ปิด TASK041 จาก dummy ตัวเดียว
- [x] AC-04: targeted/full regression/build/boundaries/mobile/public deployment ผ่านพร้อมหลักฐาน

## วิธีตรวจและหลักฐาน

tests/game/boss-focus.test.ts; scripts/game/boss-focus-audit.ts; plan/evidence/task-131/ เก็บ frozen input, seeds, build, stats, costs, per-skill metrics และ review

ผู้ตรวจ: Codex · รอบ review:1 · local และ hosted ผ่าน

## Blocker / คำถาม

ไม่มี ผู้ใช้ยืนยันคง AoE แต่รวมพลังเมื่อเหลือศัตรูตัวเดียว

## Review รอบ1

636/636 TS,28targeted+25copy/support+14oracles+9scope/native4groups320390/root+filteredbuild623836gzip/M0readinessผ่าน. วัด15640ไฟต์พร้อมequivalence2448inputs และหลักฐานก่อนหลัง แก้ historical oracles6จุดตาม intentional power changes โดยไม่ตัด rollback/ราคา/interrupt/parity tests. ยังรอ hosted ก่อน AC04/done.

## Review รอบ2 — hosted

source`b2cb7425d` VercelSUCCESS; actualAPI99a55/SIN1/auth401/nativepack32/24bundleSHA/publicHighWizard-Wizard-Alchemist35%/mobile320390/0errors/0writes ผ่าน4groups. ViewedhostedWizard320. ไม่มีSQL/envใหม่หรือownerwrite/6173restart. [ผลตรวจ](../evidence/task-131-review.json) · [รายงานบาลานซ์](../evidence/task-131/README.md).
