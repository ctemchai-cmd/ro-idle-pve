# TASK177 — Phone PWA Hunter save diagnosis, not recovered

The same save opens on desktop; phone PWA displays generic reconnect. Actual public failure identifier remains unknown. No direct Supabase server credential is available in local configuration; no owner Auth/cloud reads/writes performed. Public API/manifest healthy/current.

Existing HUD/settings/initial-load failure now display only SaveSnapshot.reason as bounded uppercase identifier (max80), with UNKNOWN_SAVE_ERROR for other text. No response bodies/headers/IDs/keys/player payloads rendered. Retry/maintenance/singlewriter/UUID/receipt/checkpoint logic untouched; no data/reset/storage discard or repair claim.

Native320390 synthetic Hunter tests cover four representative codes, unsafe-text suppression, bounded layout, retry and settings. These prove diagnostic display, not reproduction of the owner's issue. `native.json` explicitly records owner_recovered:false. After release the owner must report the actual code on phone so the exact cause can be reproduced and fixed. TASK177 remains inprogress.
