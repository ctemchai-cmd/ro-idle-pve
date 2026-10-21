// Test-only (isolated loopback stacks): validate a modified account state and sign it exactly like the API.
// stdin: {"account_id","revision","state"[,"content_hash","legacy"]}; stdout: {"state_hash","signature"}. Never used by the deployed app.
// TASK-040: `content_hash` + `legacy` sign an older-content fixture (not validated against today's schema) to exercise migration.
import { createHash, createHmac } from 'node:crypto';
import { AccountCommandRules } from '../../src/domain/account/commands.ts';

if (process.env.RO_SUPABASE_LOCAL_STACK !== '1') throw new Error('ISOLATED_LOOPBACK_REQUIRED');
const key = process.env.SAVE_SIGNING_KEY ?? ''; if (key.length < 32) throw new Error('SIGNING_KEY_NOT_CONFIGURED');
const input = JSON.parse(await new Promise<string>(resolve => { let text = ''; process.stdin.on('data', chunk => text += chunk); process.stdin.on('end', () => resolve(text)); })) as { account_id: string; revision: number; state: unknown; content_hash?: string; legacy?: boolean };
const rules = new AccountCommandRules(), state = input.legacy ? input.state : rules.validateAccount(input.state), stateHash = createHash('sha256').update(rules.canonical(state)).digest('hex');
const signature = createHmac('sha256', key).update(rules.canonical({ account_id: input.account_id, revision: input.revision, state_hash: stateHash, content_hash: input.content_hash ?? rules.versions.content_hash, schema_version: 1, key_version: 1 })).digest('base64url');
process.stdout.write(JSON.stringify({ state_hash: stateHash, signature }));
