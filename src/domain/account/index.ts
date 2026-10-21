import { loadValidatedContent } from '../../content/index.ts';
export function getRuntimeStatus() {
  const content = loadValidatedContent();
  return content.ok ? { ok: true, content_version: content.value.manifest.content_version, content_hash: content.value.manifest.content_hash, combat: 'shared_engine', persistence: 'not_configured' }
    : { ok: false, errors: content.errors };
}
