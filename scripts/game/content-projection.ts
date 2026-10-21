/** Canonical engine-data projection, shared by the M0 and runtime manifests. */
export function engineProjection(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) return value.map(child => engineProjection(child, depth + 1));
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  const drop = new Set<string>();
  if (depth === 0) for (const key of ['presentations', 'notes', 'author', 'authoring_status', 'status', 'reference_profiles', 'reference_cases', 'builds', 'checkpoints', 'checkpoint_limits', 'reference_team', 'reference_teams', 'long_term_target', 'supreme_analysis']) drop.add(key);
  if (row.id && ['active', 'passive', 'equipment', 'card'].includes(String(row.kind))) for (const key of ['name_key', 'presentation_id']) drop.add(key);
  if (row.id && ['enemy', 'summon'].includes(String(row.kind))) drop.add('presentation');
  if (row.id && row.chapter && row.index && row.encounter) for (const key of ['background', 'music', 'solutions', 'balance_target', 'recommended_party_level']) drop.add(key);
  return Object.fromEntries(Object.entries(row).filter(([key]) => !drop.has(key)).map(([key, child]) => [key, engineProjection(child, depth + 1)]));
}
