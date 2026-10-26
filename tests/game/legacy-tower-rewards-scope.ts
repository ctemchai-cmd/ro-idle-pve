import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const before = JSON.parse(readFileSync('plan/evidence/task-163/tower-before.json','utf8')) as {content_version:string;floor_rows:{floor:number;gold:number;crystal:number;bronze_card_count:number}[]};
const edits = JSON.parse(readFileSync('plan/evidence/task-163/source-edits.json','utf8')) as Record<string,{before:string;after:string}[]>;

/** Restore only the declared reward fields for earlier exact-scope oracles.
 * Actual reward programs, transaction semantics and migration have D187 tests. */
export function withoutD187Document<T>(key: string, value: T): T {
  const c = structuredClone(value) as any;
  if (key === 'tower.json') {
    delete c.reward_schedule; c.content_version = before.content_version;
    for (const row of c.floor_rows) {
      const old = before.floor_rows.find(r => r.floor === row.floor); assert(old);
      delete row.reward_resources;
      for (const k of ['gold','crystal','bronze_card_count'] as const) row[k] = old[k];
    }
  }
  return c;
}
export function legacyTowerDocumentBytes(file: string): Buffer {
  return Buffer.from(JSON.stringify(withoutD187Document('tower.json',JSON.parse(readFileSync(file,'utf8'))),null,2)+'\n');
}
export function withoutD187Source(file: string): Buffer {
  let text = readFileSync(file,'utf8');
  for (const edit of edits[file as keyof typeof edits] ?? []) {
    assert(edit.after && text.split(edit.after).length === 2, file+' exact declared D187 edit');
    text = text.replace(edit.after,edit.before);
  }
  return Buffer.from(text);
}
