# สัญญาเซฟที่ใช้งานจริง

วันที่: 20 ตุลาคม 2026 · TASK-022 · [ผลตรวจ](../evidence/task-022-review.json)

**ปัจจุบัน D-084/TASK-060 ใช้ start/finish-only ตามหัวข้อท้ายไฟล์ ส่วน incremental checkpoints ด้านล่างเป็นสัญญารุ่นก่อนที่เก็บไว้สำหรับ diagnostic adapters**

D-087/TASK-063: sharedtransportสำหรับทุกmutationใช้ `POST /api/commands` พร้อม `x-ro-checkpoint: include` เพื่อรับ `{receipt, checkpoint?}` ในroundtripเดียว Serverอ่านcheckpointจากDBและverifyเส้นทางเดียวกับGETหลังcommit ไม่มีการสร้างstateจากreceiptdelta ถ้าอ่านไม่ได้ยังคืนreceiptเพื่อfallback ไม่ทำconfirmedwriteเป็นerrorแล้วส่งซ้ำ Clientตรวจowner/schema/version/hash/history/minimumrevisionก่อนpersist/readyโดยใช้validatorเดียวกับGET checkpoint ไม่ใช้optimisticwallet

Servers/clientsรุ่นเก่ายังใช้receipt-onlyได้: fallbackGETcheckpointโดยไม่lookupreceiptที่เพิ่งตอบสำเร็จซ้ำ ส่วนoutcomeไม่ทราบ/refreshยังlookupUUIDเดิมก่อนretryและcheckpointตามเดิม `Server-Timing` แยกauth/command/checkpoint/totalเฉพาะเวลาในhandler ไม่รวมnetwork/coldmoduleinit และ `x-ro-api-region` เปิดเผยเฉพาะregionไม่มีข้อมูลบัญชี ไม่มีSQL/env/contenthashใหม่

APIสร้างrules/validatorsหลังAuthผ่านเท่านั้น โดยใช้AccountCommandRulesซึ่งสืบทอดCreationRulesชุดเดียวต่อAPIinstance ไม่validate/compileข้อมูลเกมซ้ำสองชุด ไม่มีownerstateหรือAuthdecisionในcache Request-specificstate/time/RNGยังเป็นlocalvariablesที่ผ่านCAS/HMACตามเดิม

ส่วนนี้ลงรายละเอียด implementation ของ design11 ไม่เปลี่ยนกติกาเล่นหรือเพิ่ม multiplayer ฐานข้อมูลเป็นเจ้าของเวลาและ revision; TypeScript domain เป็นเจ้าของสูตร ไม่มีสูตรเงิน/ดาเมจซ้ำใน SQL

## ขอบเขตและข้อมูลเข้าออก

| ส่วน | รับ | คืน/รับผิดชอบ |
| --- | --- | --- |
| AccountCommandRules | Command ที่ผ่าน closed schema, AccountState, StoredBattle, เวลาจาก DB, request hash | สำเนา state, immutable receipt, keep/delete/upsert battle; business rejection ไม่เปลี่ยน state |
| reserveFarm | state, cursor/time ตัวเลข, UTC สำหรับบันทึก, claim ID, validated content | state ใหม่ที่จอง fixed pending bundle และเลื่อน cursor/carry/RNG; ไม่จ่าย wallet |
| API recurring handlers | verified Auth UID + intent | ตรวจ canonical hash/receipt/version/history signature/revision แล้วส่ง proposal เข้า repository |
| game_commit_command | UID จาก server, expected revision, signed proposal | CAS transaction เดียวสำหรับ save/receipt/history/battle; rejected receipt ไม่เพิ่ม revision |
| SaveController | injected network/storage/lock ports | สถานะ ready/saving/offline/read_only/incompatible และ checkpoint ล่าสุด; ไม่คำนวณทรัพย์สินจาก receipt delta |
| browser ports | Auth session, environment scope, Web Locks/localStorage | HTTP adapters และ backup ตาม owner/environment; ไม่เก็บ credentials ใน backup |

GET `/api/checkpoint` อ่าน save/history/battle/DB UTC ใน snapshot เดียว ลงนาม HMAC ฝั่ง server และตรวจ SHA256 ของ state ทั้งฝั่ง API/เบราว์เซอร์ HMAC key อยู่เฉพาะ server เบราว์เซอร์ไม่สามารถพิสูจน์ HMAC เอง; local cache ไม่มีอำนาจเขียนทับ cloud

## คำสั่งและการกู้

`account.create` ใช้ grant เดิม ส่วน `reward.claim`, `farm.claim`, `battle.advance`, `battle.retreat` ผ่าน recurring boundary คำสั่งระบบตัวละคร/สกิล/ของ/โหมดจะเพิ่ม reducers ที่จุดนี้ตาม task ของตน คำสั่งที่ยังไม่รองรับไม่ถูกถือว่าผ่านแล้ว

ก่อนส่ง client เก็บ intent พร้อม UUID เดิมลง backup ถ้าคำตอบหาย ให้ lookup receipt ก่อน ส่งซ้ำ UUID/payload เดิมเมื่อยังไม่มี receipt แล้วโหลด checkpoint authoritative; ไม่สร้าง UUID ใหม่ให้การ retry อัตโนมัติ ID เดิมคนละ payload ถูกปฏิเสธ revision เก่าต้อง reconcile ไม่ merge snapshot เงิน/ของ ไม่มี raw snapshot upload/autosave ที่เขียนทับยอดใหม่

Web Locks ให้หนึ่งแท็บเขียน แท็บอื่นเปิดดูและลองยึด lock หลังแท็บเดิมปิดได้ Backend CAS ยังป้องกันสองอุปกรณ์ ไม่มีการเชื่อมต่อแล้ว client หยุดคำสั่งถาวรและ invalidate คำตอบจาก epoch เก่า checkpoint ต่ำกว่า revision ที่ทราบจาก receipt ถูกปฏิเสธ เมื่อ refresh/reconnect ที่มี active battle ให้ retreat ผ่านคำสั่งเดิม ไม่เดินไฟต์ย้อนหลังตอนปิดหน้า

## ช่วงฟาร์มกับไฟต์

ฟาร์ม online/AFK ใช้ cursor เดียว ไม่จ่ายตาม kill ในฉาก จองได้เฉพาะช่วงยังไม่จอง สูงสุด12ชั่วโมง และ pending queue32 ใช้ frozen rate/rarity/tier/definition snapshot, integer carry และ shared seeded RNG (rarity ก่อน definition สอง draws/ชิ้น) จองสำเร็จแล้ว pending ไม่เปลี่ยนตามราคาใหม่ รับเข้ากระเป๋าด้วย `reward.claim` แยกครั้งเดียว หากเต็มไม่เลื่อน cursor/กินของอย่างเงียบ

`battle.advance` restore shared engine checkpoint ให้เวลาไม่เกิน DB elapsed/request/5000ms ต่อครั้ง มี lease15000ms และ ticket180000ms ตำแหน่ง คิว สถานะ RNG และ metrics อยู่ใน checkpoint เดียว ผล terminal ยังเก็บไว้ให้ reducer ของ Story/Tower/daily ทำ mode settlement ใน TASK-025/035/036 ไม่แจกผลชนะชั่วคราวที่ task นี้ Retreat ลบ pointer/checkpoint ใน transaction เดียวและไม่จ่ายรายได้จาก kill

## ขอบเขตหลักฐาน

195 TypeScript tests, build และ isolated real PostgreSQL/Auth/PostgREST/SMTP/Chrome ผ่าน ทดสอบ CAS/rollback/owner/RLS, farm12h144ชิ้น288draws, battle DB credit, lost response/refresh/offline/two tabs มีรูป `docs/screenshots/save-reconnect-local.png` ที่ปิดอีเมลแล้ว

Active battle/farm rate/pending บางเคสใช้ server-owned fixtures เพื่อพิสูจน์ storage protocol; game loop, mode factories/settlement และ AFK UX ครบวงจรยังเป็น TASK-025/035/036/038 การเปลี่ยน content hash ยังปฏิเสธเซฟรุ่นเก่าโดยชัดเจน migration compatibility เต็มเป็น TASK-040 ไม่มี hosted project/Vercel หรือหลักฐานบน Safari/มือถือจริง

## สำรอง/กู้คืน/ย้ายรุ่น (TASK-040, D-064)

| การกระทำ | ใครเริ่ม | สิ่งที่เซิร์ฟเวอร์ทำ | ไม่ทำ |
| --- | --- | --- | --- |
| ส่งออก `backup.export` | ผู้เล่น (ตั้งค่า › สำรอง) | ไม่มี — client สร้างไฟล์จาก checkpoint ที่ตรวจแล้ว (`backupFile`) | ไม่ใส่ battle/token/อีเมล |
| ตรวจไฟล์ (import preview) | ผู้เล่น | ไม่มี — client ตรวจรูปแบบ + sha256 แล้วเทียบ revision/บัญชี/รุ่น | ไม่ส่ง state ในไฟล์เป็นคำสั่ง |
| `save.migrate` | ผู้เล่นกดหลังเห็น before/after (checkpoint ตอบ 409 `SAVE_MIGRATION_REQUIRED`) | ตรวจลายเซ็นของรุ่นเดิม → `migrateAccountState` + validator → สำรองแถวเดิม (migration) → revision+1 | schema ใหม่กว่า (`UPDATE_REQUIRED`) / ID ไม่รู้จัก (`MIGRATION_UNSUPPORTED`) ไม่เขียนอะไร |
| `backup.restore_request` `history:N` | ผู้เล่นเมื่อ checkpoint ตอบ 503 `SAVE_INTEGRITY_FAILED` พร้อม candidate | ใช้ signed tip ของ revision เดียวกันเท่านั้น → สำรองแถวเสีย (quarantine, ไม่มีลายเซ็น) → revision+1 | ไม่กู้ถ้าเซฟปกติ (`RECOVERY_NOT_NEEDED`), ไม่ใช้ revision เก่ากว่า tip |
| `account.reset` | ผู้เล่นพิมพ์ RESET ในโซนอันตราย | สำรองแถวปัจจุบัน (reset) → state ใหม่ Lv.1 พร้อมตัวนับรายวันของวันนี้ → revision+1 | ไม่รีเซ็ต revision/receipts |
| `backup.restore_request` `backup:<id>` | ผู้เล่น (undo reset) | เฉพาะ reset backup ล่าสุดที่ยังไม่ถูก restore, ตรวจลายเซ็น → สำรองแถวปัจจุบัน (restore) → `guardRestore` → revision+1 | ไม่ restore backup เหตุผลอื่น/ซ้ำ |

ทุกการเขียนผ่าน `game_commit_maintenance` (advisory lock, receipt replay, CAS, ลบ battle checkpoint, history, เก็บ backup 10 ชุด) `guardRestore`/`resetAccount` ไม่ย้อน `farm.reserved_through` และรวมตัวนับวันนี้/เมื่อวาน (daily attempts/chests, shop, daily objectives) แบบค่ามากสุด wallet/ของ/ความคืบหน้าใช้ของจุดที่เลือกทั้งก้อน หลักฐาน: `tests/game/save-backup.test.ts`, `supabase/tests/storage_ownership.sql` (`plan/evidence/task-040-postgres.json`), live `BACKUP_040` ใน `scripts/test_game_shell_live.cjs` ข้อจำกัด: ลำดับรุ่น content ไม่มีเลขเวอร์ชันเรียง จึงถือว่า hash ต่างที่ผ่าน validator = รุ่นเก่า ถ้าถอยโค้ดต้องใช้ maintenance/backup migration กู้แทน

## D-071 เร่งความเร็วไฟต์บอส (TASK-055, 20 ต.ค. 2026)

`battle.advance` รับ `speed` 1/2/4 (ไม่ส่ง = 1) `calculateBattleCredit` ให้เวลาเกม = min(`requested_game_ms` − เวลาปัจจุบัน, (DB now − last ack) × speed, `max_credited_wall_gap_ms` × speed) ค่าอื่นได้ `INVALID_CLOCK_INPUT` และ schema ปฏิเสธก่อนถึง reducer; lease 15 วินาที, ticket 180 วินาที และกติกา offline/reconnect นับตามเวลาจริงเหมือนเดิม ฝั่ง browser ทำนายล่วงหน้าได้ถึง confirmed + 5000 × speed ความเร็วเป็นค่าของเบราว์เซอร์ (localStorage) ไม่อยู่ในเซฟ จึงไม่มีการย้ายโครงสร้างเซฟ รางวัล AFK/ฟาร์มยังคิดตามเวลาจริงทั้งหมด

D-083/TASK-059: browser ส่ง periodic acknowledgement ทุก **4000ms wall time** จากเริ่ม request ไม่ใช่หลัง response เพื่อเผื่อ latency ภายใน cap5000ms; writer ไม่พร้อมให้รอหนึ่งคำสั่ง ไม่สะสมคำสั่งย้อนหลัง RAF/shared prediction ยังเดินทุก frame การเปลี่ยนความเร็วยืนยันเวลาที่ผ่านมาด้วยความเร็วเดิมก่อนสลับ และตั้ง deadline ใหม่ตาม request นั้น คำสั่งผู้เล่น/terminal settlement ยังผ่าน atomic receipts เดิม; ผลที่คาดการณ์ว่าจบแล้วรอ periodic ack ถัดไปก่อนจ่ายจริง (ปกติไม่เกิน4วินาที+network) Hidden/offline/refresh ยังคง suspend/reconcile/retreat ไม่อ้างว่าจะเก็บผลการต่อสู้ที่ยังไม่ได้ยืนยันเมื่อปิดหน้า


## D-084 · เซฟเฉพาะเริ่ม/จบไฟต์ (TASK-060)

แทน D-083: runtimeไม่มีperiodicackและการเปลี่ยน1×/2×/4×ไม่ส่งcommand มีwriteตอนเริ่มเพื่อเก็บseed/build/fullinitialsnapshotและกันdailyattempt จากนั้นclientใช้sharedengineต่อเนื่องจนterminalแล้วส่ง `battle.finish {battle_id}` เพียงครั้งเดียว Serverrestore snapshotที่ตนเก็บและจำลองถึงterminalด้วยengine/modePolicyเดียวกัน ไม่รับHP/damage/reward/ผลชนะที่clientอ้าง Story/Tower/dailyใช้settlementเดิมและatomicreceipt/CAS/history/deletecheckpointในtransactionเดียว

Finishไม่ใช้heartbeatlease15s แต่ตรวจDBelapsed>=ceil(replayed terminalgame_ms/4)และticket<180s ตัวหาร4คือความเร็วสูงสุดที่เลือกได้ เป็นassistant timing baseline ไม่ใช่การตรวจประวัติความเร็วที่เลือกทุกช่วง (ทุกความเร็วให้ผลจำลองเดียวกัน) Legacybattle.advanceยังมีcreditcap/leaseเดิมสำหรับdiagnosticและhistoricaltests แต่gameclientไม่เรียก ไม่เก็บschedulerเก่าที่ไม่ได้ใช้

Manualretreatของdailyส่งrequested_game_msได้ serverจำลองจากsnapshotเดิมถึงmin(request,DBelapsed×4,time_limit)ก่อนเก็บHP/phase/chests ปลายทางอยู่ในticketdayเดิม ส่วนrefresh/hidden/reconnectส่งretreatไม่มีtimeclaimจึงคงsnapshotเริ่มและไม่เดินบอสย้อนหลัง Attemptยังเสียตั้งแต่start กรณีfinishresponseหายให้reconcileUUID/receiptเดิมก่อนrecovery ไม่มีเงินจากpredictionและไม่สร้างfinishintentซ้ำเมื่อrerender

## D-085 · เริ่มใหม่และซ่อมดันรายวันที่ติดมาจากเกมก่อน (TASK-061)

account.resetยังbackup-before-write แต่daily_recordsของเกมใหม่ว่างทั้งหมด (attempt/phase/HP/rewardedchests) แยกจากguardRestoreที่ยังเก็บตัวนับที่ใช้ไป การซื้อร้านค้าและภารกิจรายวันยังใช้policyเดิม

เซฟจากresetเก่าที่dailyยังไม่unlockแต่มีdaily_recordsเป็นcarry-over: contentmigrationpreviewจะแสดงการแก้ กดสำรองแล้วอัปเดตเซฟจึงbackupและล้างเฉพาะdaily_records/pendingdaily ไม่ล้างroster/wallet/inventory/Story/Tower ไม่ล้างdailyของเกมที่unlockแล้ว ผู้ใช้แก้เป้าหมายเป็นVercel; ไม่มีการเขียนDB6173หรือcloudsaveจากเครื่องโดยตรง
## D-119 · Pending intent at a content migration barrier (22 Oct 2026)

An original receipt remains definitive when `/api/checkpoint` responds with a migration preview instead of a normal checkpoint. Release that completed pending intent only if the preview revision is at least both the receipt revision and the prior checkpoint revision. This lets the explicitly requested backup/migration proceed without replaying the boss start.

If the API returns an explicit HTTP409 body `{code:"CONTENT_VERSION_MISMATCH"}` for an uncommitted command, retain its complete UUID/type/params/envelope as optional `rejectedForUpdate` in the local `SaveBackup` before clearing `pending`. This is a local audit record, never a command to replay under the updated rules. A client-side checkpoint validation error with the same code is not proof of refusal. Unknown network/timeout/401/5xx outcomes and stale migration previews keep the exact pending command.

Maintenance UI offers “ตรวจผลรายการค้าง” while intent/writer ownership is unresolved. It must not create another migration UUID at that gate. Backup-before-write, revision CAS, server receipts, signed history, migration battle termination and the account-state/SQL schemas are unchanged.


22ต.ค.2026 D-127–129: กติกา reward batch / Refineflat+percent / Enchantรายslot / CrystalAFKและgearchance ใช้ [design34](34-reward-slot-economy-tuning.md) และcanonicaldataล่าสุดเหนือค่าตัวอย่างเก่า
