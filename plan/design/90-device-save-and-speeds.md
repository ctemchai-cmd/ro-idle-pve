# D201–202 — Bulk-sale PWA recovery and3× speed

D201 confirmed root: phone PWA reports COMMAND_TOO_LARGE after a large equipment salvage. Desktop opens the same save. Command schema permits500identifiers of120characters, while API blocked text.length>16384 before command/receipt processing. Browser durably retained original intent and repeatedly received413 before its normal cloud load.

The API and loopback gateway now share a finite256KiB UTF-8 budget. This covers500maximum Unicode identifiers plus JSON envelope, with strict schema/ownership/receipt/CAS/rule validation unchanged. API health exposes only command_body_limit_bytes for deployment checks. No split batches or client/controller/protocol changes: after API upgrade the existing pending sale is retried with its original UUID, and the normal receipt lookup prevents duplication. A stale revision reloads authoritative cloud rather than forcing a sale. Locked/equipped items still reject the entire batch.

Six focused regressions exercise the actual Fetch API/shared rules/signed checkpoint store:500equipment once;500cards/maximum Unicode IDs; exact/over/UTF8 byte boundaries; cached old413→newAPI→sameUUID ready→reopen; response loss no secondPOST; stale/locked/equipped selections. A real Chrome390fixture uses actual localStorage/browser ports/SaveController/TopHud and same signed API, reproduces413 then recovers500sale once after reopen. Synthetic loopback only, no owner Auth/cloud data or SQL. This proves implementation, not that the owner has already reconnected.

Keep bounded uppercase diagnostic code in failure HUD/settings/splash (max80, unknown fallback), never response bodies/keys/IDs/savepayloads. No reset/localstorage wipe/pending discard/price/schema/core changes.

TASK178 independently changes all visible combat speed controls1→2→3→1, including savedbattle/demo/skill preview. Share BattleSpeed type/next/options, normalize persisted4 to3 and retain3 in memory if localStorage writes fail. No account save, requests or server clock changes from selecting speed.

Actual BossField already advances a virtual target by wall delta×display speed, then shared engine at fixed≤50ms steps.3 requires no rule/interrupt changes. Test exact event/state identity at1/2/3 (and historical4) with casts that are interrupted, empty slots and seeded RNG; Timeline still projects the same shared engine.

Preserve server legacy battle.advance speed schema1/2/4 and terminal ticket timing4 maximum for old signed tickets/receipts and daily recovery compatibility. Current product does terminal-only settlement, with no speed parameter in start/finish.3× simply finishes later than the accepted historical maximum. Changing protocol/data would unnecessarily invalidate the five hashes and old recovery bridge.
