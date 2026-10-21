import raw from '../generated/content.json';
import { validateContent } from './loader.ts';
import type { Result, ValidatedContent } from './model.ts';

export { validateContent } from './loader.ts';
export type { ValidatedContent, ContentIssue, Result, ContentManifest } from './model.ts';
export function loadValidatedContent(): Result<ValidatedContent> { return validateContent(raw); }
/** IDs stay stable in v1; later renames must supply an explicit migration map. */
export function resolveAliases(id: string, aliases: Readonly<Record<string, string>>): string {
  const seen = new Set<string>();
  while (Object.hasOwn(aliases, id)) {
    if (seen.has(id)) throw new TypeError(`Alias cycle at ${id}`);
    seen.add(id); id = aliases[id]!;
  }
  return id;
}
