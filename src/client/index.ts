import { loadValidatedContent } from './content.ts';

export function inspectProjectContent() {
  const result = loadValidatedContent();
  if (!result.ok) return result;
  const content = result.value;
  return { ok: true as const, value: {
    version: content.manifest.content_version,
    hash: content.manifest.content_hash,
    skills: Object.values(content.skills).filter(skill => skill.class_id !== 'enemy').length,
    equipment: Object.values(content.items).filter(item => item.kind === 'equipment').length,
    cards: Object.values(content.items).filter(item => item.kind === 'card').length,
    stages: Array.isArray(content.documents['stages.json']?.stages) ? content.documents['stages.json'].stages.length : 0,
  } };
}
