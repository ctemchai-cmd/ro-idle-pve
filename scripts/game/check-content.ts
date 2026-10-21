import { loadValidatedContent } from '../../src/content/index.ts';
const result = loadValidatedContent();
if (!result.ok) { console.error(JSON.stringify(result.errors, null, 2)); process.exitCode = 1; }
else console.log(JSON.stringify({ content_hash: result.value.manifest.content_hash, skills_including_enemy: Object.keys(result.value.skills).length, items: Object.keys(result.value.items).length, statuses: Object.keys(result.value.statuses).length, immutable: Object.isFrozen(result.value) }));
