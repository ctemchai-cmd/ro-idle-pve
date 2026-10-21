import type { Command, Receipt } from '../../contracts/index.ts';
import { loadValidatedContent } from '../../content/index.ts';
import { ContentValidator } from '../../content/validation.ts';
import { canonical } from '../../content/value.ts';
import type { Json, ObjectValue } from '../../content/value.ts';
import { initializeAccount } from './initialize.ts';
import type { CreateAccountCommand } from './initialize.ts';

/** Validated account rules facade. API supplies time/seed/hash, never formulas. */
export class AccountCreationRules {
  protected readonly content;
  protected readonly validator;
  readonly versions;
  constructor() {
    const result = loadValidatedContent(); if (!result.ok) throw new Error('CONTENT_UNAVAILABLE');
    this.content = result.value;
    this.validator = new ContentValidator(structuredClone(this.content.schemas) as unknown as Record<string, ObjectValue>);
    const { content_hash, content_version, rules_version } = this.content.manifest;
    this.versions = { content_hash, content_version, rules_version };
  }
  parse(input: unknown): Command { this.validator.shape('command', input as Json, { source: 'account command', path: '' }); return input as Command; }
  canonical(value: unknown): string { return canonical(value); }
  prepare(command: CreateAccountCommand, requestHash: string, serverAt: string, localDay: string, seed: number) {
    const state = initializeAccount(this.content, command.params, serverAt, localDay, seed);
    this.validator.shape('account-state', state as unknown as Json, { source: 'server initial account', path: '' });
    const receipt: Receipt = { request_id: command.request_id, request_hash: requestHash, outcome: 'committed', committed_revision: 1, server_at: serverAt, ...this.versions, result: { code: 'ACCOUNT_CREATED', resource_delta: { ...state.wallet }, created_instance_ids: state.inventory.map(item => item.instance_id), removed_instance_ids: [], pending_claim_ids: [], battle_id: null, reason_key: null, ledger_entry_ids: [], refunded_ledger_entries: [] }, command_type: 'account.create', schema_version: 1 };
    this.validator.shape('receipt', receipt as unknown as Json, { source: 'server creation receipt', path: '' });
    return { state, receipt };
  }
}
