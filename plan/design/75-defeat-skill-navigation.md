# D186 — ปรับทีมหลังแพ้เปิดหน้าสกิล

26ตุลาคม2026 · TASK162. ปุ่มปรับทีมของResultCard(Story/Tower defeated/timeout)ให้closeผลและเปิดgo(skills)แทนgo(team). ใช้Shell.goเดิมซึ่งคงcharacterselectionปัจจุบัน. ไม่เปลี่ยนlabel/icon/layout/Auto/รางวัล/retry/DailyResultหรือsave. ไม่มีเพิ่มปุ่มใหม่ในDaily.

ตรวจnativeactualResultCard/DailyResult16modecases320390และclose→skillsทั้งStory/Tower;rootbuild/M0/publicartifact/mobile. Fivegameplayfingerprints/packเดิม. UI-only;ไม่มีfull748/balancebatch/ownerwrites/SQL/env.
