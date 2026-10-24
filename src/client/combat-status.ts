import type { StatusDefinition } from '../contracts/index.ts';
import { bindStatusParams } from '../domain/combat/program.ts';
import { loadValidatedContent } from './content.ts';
import type { ActorRenderView, StatusRenderGroup, StatusRenderInstance } from '../contracts/presentation.ts';
import type { BattleState } from '../domain/combat/index.ts';
import { heldResourceModifiers } from '../domain/combat/resources.ts';
import { statusNames, statNames } from './status-labels.ts';
import { elementName, type Element } from './elements.ts';

const loaded = loadValidatedContent(); if (!loaded.ok) throw new Error('CONTENT_UNAVAILABLE');
const content = loaded.value, labels = content.documents['strings.th.json']!.strings as unknown as Record<string, string>;
const units = Object.fromEntries((content.documents['stat-definitions.json']!.stats as unknown as { id: string; unit: string }[]).map(s => [s.id, s.unit]));
const percent = (value: number) => (value * 100).toLocaleString('th-TH', { maximumFractionDigits: 1 }) + '%';
type Details = Pick<ActorRenderView, 'statuses' | 'healing_aura' | 'spirit_spheres' | 'spirit_sphere_capacity' | 'spirit_attack_bonus' | 'spirit_attack_per_sphere'>;
const cache = new WeakMap<BattleState, Record<string, Details>>();

/** A read-only projection per immutable combat checkpoint. Never used by rules or persistence. */
export function battleStatusViews(state: BattleState): Record<string, Details> {
  const cached = cache.get(state); if (cached) return cached;
  const result: Record<string, Details> = {};
  for (const actor of state.actors) {
    const groups = new Map<string, StatusRenderGroup>(); let healingAura = false;
    const add = (skillId: string, polarity: 'buff' | 'debuff', instance: StatusRenderInstance) => {
      const key = `${skillId}:${polarity}`, skill = content.skills[skillId];
      const group = groups.get(key) ?? { id: key, name: skill ? labels[String(skill.name_key)] ?? skillId : instance.name, polarity, icon_skill_id: skill ? skillId : null, stacks: 0, next_expiry_at: instance.expires_at, instances: [] };
      group.instances = [...group.instances, instance]; group.next_expiry_at = Math.min(group.next_expiry_at, instance.expires_at);
      // One Blessing applies P.ATK and M.ATK: count repeated applications, not its two effects.
      const counts = new Map<string, number>(); for (const row of group.instances) counts.set(row.status_id, (counts.get(row.status_id) ?? 0) + 1);
      group.stacks = Math.max(...counts.values()); groups.set(key, group);
    };
    for (const status of actor.statuses) {
      if (status.expires_at <= state.game_time_ms) continue;
      const definition = content.statuses[status.status_id] as unknown as StatusDefinition;
      const parts = bindStatusParams(definition.modifiers,status.params).map(m => { const value=Number(m.value);return `${statNames[m.stat]??m.stat} ${value>=0?'+':''}${m.op==='add_percent'||units[m.stat]==='ratio'?percent(value):value.toLocaleString('th-TH')}`; });
      if(definition.damage_charge){const charge=bindStatusParams(definition.damage_charge,status.params);parts.push('สกิลโจมตีถัดไปทั้งท่า Ignore DEF/MDEF','ตีปกติไม่ใช้');if(Number(charge.crit_damage_bonus))parts.push('ดาเมจคริ +'+percent(Number(charge.crit_damage_bonus)));}
      if(definition.skill_echo){const echo=bindStatusParams(definition.skill_echo,status.params);parts.push('Bolt '+echo.tiers.filter(t=>Number(t.chance)>0).map(t=>'×'+t.multiplier+' '+percent(Number(t.chance))).join(' → '),'สุ่มสูงก่อน');}
      if(definition.allows_magical_crit)parts.push('เวททำคริได้');
      if (actor.hp > 0 && definition.periodic?.effects.some(e => e.type === 'heal')) healingAura = true;
      if (definition.periodic) parts.push(`ทำงานทุก ${definition.periodic.interval_ms / 1000}s`);
      if (status.params.power_ratio !== undefined) parts.push(`${percent(status.params.power_ratio)} ${definition.periodic?.effects.some(e => 'formula'in e&&e.formula.id === 'physical_power') ? 'P.ATK' : 'M.ATK'}`);
      if (definition.restrictions.includes('no_normal_attack')) parts.push('หยุดการโจมตีและใช้สกิล');
      else if (definition.restrictions.includes('no_new_skill')) parts.push('ใช้สกิลไม่ได้');
      if (status.status_id === 'provoke') parts.push('บังคับโจมตีผู้ยั่วยุ');
      if (definition.weapon_element) parts.push(`เสริมธาตุ ${elementName(definition.weapon_element as Element)}`);
      const name = statusNames[status.status_id] ?? status.status_id;
      add(status.source.definition_id, definition.polarity, { instance_id: status.instance_id, status_id: status.status_id, name, source_actor_id: status.source.owner_actor_id, applied_at: status.applied_at, expires_at: status.expires_at, description: parts.join(' · ') || name,...(definition.visual_link?{link_color:definition.visual_link.color}:{}),...(definition.visual_field?{field_color:definition.visual_field.color}:{}) });
    }
    for (const shield of actor.shields) if (shield.remaining > 0 && shield.expires_at > state.game_time_ms) add(shield.source.definition_id, 'buff', { instance_id: shield.instance_id, status_id: 'shield', name: 'โล่ดูดซับ', source_actor_id: shield.source.owner_actor_id, applied_at: null, expires_at: shield.expires_at, description: `ดูดซับได้อีก ${shield.remaining.toLocaleString('th-TH')} HP` });
    const sphere = (content.documents['stat-definitions.json']!.combat_resources as unknown as { id: string; maximum: number }[]).find(r => r.id === 'spirit_spheres')!;
    result[actor.actor_id] = {
      healing_aura: healingAura, statuses: [...groups.values()].sort((a, b) => a.polarity.localeCompare(b.polarity) || a.next_expiry_at - b.next_expiry_at),
      ...((content.jobs.byId[actor.stat_blueprint.job_id??'']?.ancestors.includes('monk') || actor.spirit_spheres > 0) ? { spirit_spheres: actor.spirit_spheres, spirit_sphere_capacity: sphere.maximum, spirit_attack_bonus: heldResourceModifiers(actor, content).filter(m => m.stat === 'physical_attack' && m.op === 'add_percent').reduce((sum, m) => sum + Number(m.value), 0), spirit_attack_per_sphere: heldResourceModifiers({ ...actor, spirit_spheres: 1 }, content).filter(m => m.stat === 'physical_attack' && m.op === 'add_percent').reduce((sum, m) => sum + Number(m.value), 0) } : {}),
    };
  }
  cache.set(state, result); return result;
}
