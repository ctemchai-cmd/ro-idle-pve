# D165 — เพดานสกิลสัมพันธ์กับจุดปลดและคืนทุนส่วนเกิน

Class2ปลด20/30/40: rank r ต้อง character level = unlock + ceil(40×(r−1)/9). ดังนั้นเต็ม10ที่60/70/80. ตัวอย่างปลด40: 40,45,49,54,58,63,67,72,76,80. เป็นassistant distributionตามเป้าผู้ใช้ ไม่ใช่สูตรRO. Class1คงเดิม/full46; Hi explicit70..88/80..89คงเดิม. ไม่มีautomatic upgrade.

`skillRankUnlockLevels`/`characterSkillCap`เป็นauthorityเดียวสำหรับquote/validation/UI/migration;UIระบุเต็มที่และระดับถัดไป. Awakenต้องbaseMaxและHiก่อนตามเดิม;ไม่ถอนสถานะAwakenที่ทำไปแล้ว แต่ลดcurrentrankที่เกินเพดานและคืนเฉพาะAw-upgrades;ทุนbase/ค่าปลุกคงอยู่เพื่อresetภายหลัง.

Migrationลดเฉพาะcurrentphaseของสกิลที่เกินเพดาน คงrankล่าง/loadout/skillsอื่น/NPC/gear/status. คืนgold/manualหรือgold/shardsส่วนเกินและหักจากactiveledgerพร้อมกัน. Legacyledgerรวมทุนหลายrankจึงเทียบทั้งvectorและcostversionกับimmutable pre-D165 snapshot ก่อนแยกส่วนเกิน;ไม่ใช้currentquote/ไม่เฉลี่ย/ไม่คืนมากกว่าทุนจริง. ไม่พบทุนคืน0;รุ่นราคาหรือยอดที่พิสูจน์ไม่ได้ failทั้งmigrationโดยไม่เขียนข้อมูล. ไม่มีราคาใหม่ในแพตช์นี้. Testsต้องทดสอบแม้เปลี่ยนราคาปัจจุบันก็ยังคืนตามsnapshotเก่า.

ใช้backup-before-migrate/receipt/CASเดิม:ขั้นโหลดพบรุ่นเก่าแสดงpreview→สำรองแล้วอัปเดตเซฟ→commitหนึ่งrevision→reload/replayไม่คืนซ้ำ. ทุก10slotsปรับเมื่อเปิดslotนั้น ไม่ต้องSQLหรือแก้ownerโดยตรง. เก็บsignedbackupเดิม. Overflowห้ามcommitบางส่วน. ตัวอย่างLv40/skill7→1คืน2100gold+420manual.

M0 authored example buildsปรับเฉพาะrank/paidbudget/dryqueueให้legalด้วยgenerator skill_caps.py;เก็บoriginalในskill-rank-before-136 fixtureสำหรับhistoricalscopeguard. ผลDPS/evidenceเก่าเป็นsnapshotก่อนD165 ไม่ใช่บิลด์legalใหม่ที่Lv70;ห้ามเปลี่ยนlabelผลวัดเดิม. งานนี้ไม่รันbalanceใหม่และไม่แก้program/CT/SP/damage.
