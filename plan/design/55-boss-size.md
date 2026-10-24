# D166 — ขนาดบอสตรงกับการ์ด

ขนาดคือtraitเกมsmall/medium/largeในcards.monster_traits ไม่ใช่ขนาดภาพบนจอ. storyInputส่งsize_*tagให้sharedengineแล้วและใช้กับcardpredicates. Story/Tower/Dailyทุกdefinitionที่ใช้อยู่มีขนาดครบ. ตัวอย่างPoringกลาง/Whisperเล็ก/EddgaและBaphometใหญ่. LiveUIอ่านtagของactualactor;ก่อนเริ่มอ่านdefinitionเดียวกับmodefactoryผ่านhelperเดียว. Missing/ambiguousแสดงไม่ระบุ/ไม่เดาเป็นใหญ่. ไม่เปลี่ยนtrait/stat/carddamageเพื่อให้เข้าภาพหรือชื่อskin.

เพิ่มbadgeเล็กข้างเกราะธาตุในbossmetadata/focus และข้อมูลเลือกStory/Tower/Dailyก่อนเริ่มเพื่อเลือกcardทัน;layoutmobile320390ต้องไม่บีบชื่อ/เวลา. จัดบรรทัดmetadataออกจากชื่อถ้าจำเป็น;ไม่มีemoji/ไม่เพิ่มsave/networkrequests. Engineproofใช้การ์ดตีขนาดจริงเทียบtargettagsสามขนาด/HPdamageและcardproc;displayต้องตรงtagไม่inferจากmodeboss.
