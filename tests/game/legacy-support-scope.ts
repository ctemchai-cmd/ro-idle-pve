/** D164 has its own exact frozen all-definition and runtime tests in support-attack.test.ts.
 * Historical scope checks normalize only the six explicitly added M.ATK applications.
 */
export function withoutD164TeamMagic<T>(value: T): T {
  const copy = structuredClone(value), ids = new Set(['knight_battle_cry','priest_impositio','merchant_loud_voice','blacksmith_weapon_perfection','whitesmith_maximum_overthrust','bard_battle_song']);
  function visit(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const row = node as Record<string, unknown>;
    if (typeof row.id === 'string' && ids.has(row.id) && Array.isArray(row.effects)) row.effects = row.effects.filter(e => (e as { id: string }).id !== 'support_magic_up');
    Object.values(row).forEach(visit);
  }
  visit(copy); return copy;
}
