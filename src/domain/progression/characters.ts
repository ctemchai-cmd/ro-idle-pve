import type { AccountState, Command, PrimaryStats } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import { ProgressionRejection } from './rejection.ts';
import { createJobCatalog, type JobAdvancement, type JobCatalog } from '../../content/jobs.ts';
import{characterResetQuote,CHARACTER_RESET_FEATURES}from'./character-reset.ts';
import{equipmentFit,equipmentSlots}from'../build/equipment-definition.ts';
export { ProgressionRejection } from './rejection.ts';

export type Character = AccountState['roster'][number];
export type RootJob = Character['root_job_id'];
export type RosterCommand = Extract<Command, { type: 'party.set' | 'character.level_up' | 'character.breakthrough' | 'character.allocate_status' | 'character.reset_build' | 'character.change_job' | 'character.reset_level' }>;
type Wallet = AccountState['wallet'];
export interface ProgressionData {
  cost_version: string;
  release: { level_cap: number; enabled_job_stages?: number[] };
  initial_state: { initial_active_skill_grants: { skill_level: number } };
  class_tree: Record<RootJob, Character['job_id'][]>;
  job_advancements?: JobAdvancement[];
  /** Derived runtime index, never a second authored table or a saved field. */
  job_catalog?: JobCatalog;
  promotion: { class2_min_level: number; hi_class_enabled?: boolean; class3_enabled?: boolean };
  hi_class?: {
    minimum_level: number;
    level_cap: number;
    job_advancements: JobAdvancement[];
    level_rows: ProgressionData['progression']['level_rows'];
    breakthrough_gates: ProgressionData['progression']['breakthrough_gates'];
  };
  progression: {
    base_local_cap: number;
    level_rows: { level: number; total_status_points: number; next_level_cost: Partial<Wallet> | null }[];
    breakthrough_gates: { at_level: 20 | 40 | 60 | 80; unlocks_local_cap: Character['local_cap']; cost: Partial<Wallet> }[];
  };
  status_allocation: { base: PrimaryStats; manual_value_max: number; cost_by_new_value: { new_value: number; point_cost: number }[] };
}
export function progressionData(content: ValidatedContent): ProgressionData {
  const data = content.documents['progression.json'] as unknown as ProgressionData;
  if (!data.promotion.hi_class_enabled) return { ...data, job_catalog: content.jobs };
  const hi = data.hi_class;
  if (!hi || hi.level_rows[0]?.level !== data.progression.level_rows.at(-1)?.level) throw new Error('MISSING_HI_PROGRESSION');
  return { ...data, job_catalog: content.jobs, job_advancements: hi.job_advancements, progression: { ...data.progression,
    level_rows: [...data.progression.level_rows.slice(0, -1), ...hi.level_rows],
    breakthrough_gates: [...data.progression.breakthrough_gates, ...hi.breakthrough_gates],
  } };
}
export function rootForJob(job: Character['job_id'], data: ProgressionData): RootJob | null {
  return (data.job_catalog ?? createJobCatalog(data)).byId[job]?.root as RootJob ?? null;
}
/** Fourth highest across the full roster, including main and off-team companions. */
export function rosterLevelCap(roster:readonly Pick<Character,'level'>[]):number {
 const levels=roster.map(a=>a.level).sort((a,b)=>b-a);return(levels[3]??levels.at(-1)??1)+20;
}
export function effectiveLevelCap(actor: Character, data: ProgressionData) {
  const job = (data.job_catalog ?? createJobCatalog(data)).byId[actor.job_id];
  const classCap = data.promotion.hi_class_enabled && job && job.stage < 3 ? data.hi_class!.minimum_level : data.release.level_cap;
  return Math.min(data.release.level_cap, actor.local_cap, classCap);
}

/** Direct Hi promotion preserves a build. Switching branches/roots retains the existing reset policy. */
export function jobChangePlan(actor: Character, target: Character['job_id'], data: ProgressionData) {
  const jobs = createJobCatalog({ ...data, job_advancements: data.hi_class?.job_advancements ?? data.job_advancements ?? [] });
  const next = jobs.byId[target], current = jobs.byId[actor.job_id];
  if (!next || !current) throw new ProgressionRejection('INVALID_JOB');
  if (actor.job_id === target) throw new ProgressionRejection('JOB_UNCHANGED');
  if (actor.kind === 'npc' && next.root !== actor.root_job_id) throw new ProgressionRejection('NPC_ROOT_IMMUTABLE');
  if (next.stage >= 3 && !data.promotion.hi_class_enabled) throw new ProgressionRejection('HI_CLASS_UNAVAILABLE');
  if (next.stage >= 4 && !data.promotion.class3_enabled) throw new ProgressionRejection('CLASS3_UNAVAILABLE');
  if (data.release.enabled_job_stages && !data.release.enabled_job_stages.includes(next.stage)) throw new ProgressionRejection('CLASS_STAGE_UNAVAILABLE');
  if (actor.level < next.minimumLevel) throw new ProgressionRejection('CLASS_LEVEL_REQUIRED');
  if (data.hi_class && actor.level > data.hi_class.minimum_level && next.stage < 3) throw new ProgressionRejection('PROMOTION_DOWNGRADE_BLOCKED');
  if (next.stage >= 3 && current.stage < next.stage && next.parent !== actor.job_id) throw new ProgressionRejection('PROMOTION_PARENT_REQUIRED');
  const preservesBuild = next.stage >= 3 && next.parent === actor.job_id && next.root === actor.root_job_id;
  const gender = next.ancestors.includes('bard') ? 'male' : next.ancestors.includes('dancer') ? 'female' : actor.gender;
  return { root: next.root as RootJob, preservesBuild, gender };
}
export function levelQuote(actor: Character, target: number, data: ProgressionData): Partial<Wallet> {
  if (!Number.isInteger(target) || target <= actor.level) throw new ProgressionRejection('INVALID_TARGET_LEVEL');
  if (target > effectiveLevelCap(actor, data)) throw new ProgressionRejection('LEVEL_CAP_REACHED');
  const cost: Partial<Wallet> = {};
  for (let level = actor.level; level < target; level++) {
    const row = data.progression.level_rows.find(r => r.level === level);
    if (!row?.next_level_cost) throw new Error('MISSING_LEVEL_COST');
    for (const key of Object.keys(row.next_level_cost) as (keyof Wallet)[]) cost[key] = (cost[key] ?? 0) + row.next_level_cost[key]!;
  }
  return cost;
}
export function allocationQuote(before: PrimaryStats, after: PrimaryStats, data: ProgressionData): number {
  let cost = 0;
  for (const key of Object.keys(before) as (keyof PrimaryStats)[]) {
    if (!Number.isInteger(after[key]) || after[key] < before[key] || after[key] > data.status_allocation.manual_value_max) throw new ProgressionRejection('INVALID_STATUS_ALLOCATION');
    for (let value = before[key] + 1; value <= after[key]; value++) {
      const row = data.status_allocation.cost_by_new_value.find(r => r.new_value === value);
      if (!row) throw new Error('MISSING_STATUS_COST'); cost += row.point_cost;
    }
  }
  if (!cost) throw new ProgressionRejection('NO_STATUS_CHANGE');
  return cost;
}
function reject(code: string): never { throw new ProgressionRejection(code); }
export function assertParty(state: AccountState, placements: AccountState['team']): void {
  if (placements.length !== 4 || new Set(placements.map(p => p.character_id)).size !== 4 || new Set(placements.map(p => p.position)).size !== 4) reject('INVALID_TEAM');
  const actors = placements.map(p => state.roster.find(a => a.character_id === p.character_id));
  if (actors.some(a => !a) || actors.filter(a => a!.kind === 'main').length !== 1 || new Set(actors.filter(a => a!.kind === 'npc').map(a => a!.root_job_id)).size !== 3) reject('INVALID_TEAM');
}
/** Clone is owned by the enclosing command transaction. No clock/RNG/network/storage. */
export function applyRosterCommand(state: AccountState, command: RosterCommand, content: ValidatedContent): string {
  if (state.active_battle) reject('BUILD_LOCKED_DURING_BATTLE');
  const data = progressionData(content), zero = () => Object.fromEntries(Object.keys(state.wallet).map(k => [k, 0])) as Wallet;
  if (command.type === 'party.set') { assertParty(state, command.params.placements); state.team = structuredClone(command.params.placements); return 'PARTY_UPDATED'; }
  const actor = state.roster.find(a => a.character_id === command.params.character_id); if (!actor) reject('CHARACTER_NOT_FOUND');
  const addInvestment = (feature: string, quantity: number, cost: Partial<Wallet>) => {
    for (const key of Object.keys(cost) as (keyof Wallet)[]) if (state.wallet[key] < cost[key]!) reject('INSUFFICIENT_RESOURCES');
    for (const key of Object.keys(cost) as (keyof Wallet)[]) state.wallet[key] -= cost[key]!;
    state.paid_ledger.push({ entry_id: `investment_${command.request_id}`, character_id: actor.character_id, feature_id: feature, skill_id: null, quantity, cost_version: data.cost_version, cost_versions: [data.cost_version], paid_resources: { ...zero(), ...cost }, refund_state: 'active', refund_command_id: null });
  };
  const reset = (features: readonly ('stats' | 'skills')[], root: RootJob = actor.root_job_id) => {
    if (features.includes('stats')) {
      const investments = state.paid_ledger.filter(e => e.character_id === actor.character_id && e.feature_id === 'status' && e.refund_state === 'active');
      actor.unspent_status_points += investments.reduce((n, e) => n + e.quantity, 0);
      actor.primary_stats = { ...data.status_allocation.base };
      for (const row of investments) { row.refund_state = 'refunded'; row.refund_command_id = command.request_id; }
    }
    if (features.includes('skills')) {
      // Future skill upgrades use feature_id=skill and the same actual-paid ledger.
      for (const row of state.paid_ledger.filter(e => e.character_id === actor.character_id && ['skill','skill_awaken'].includes(e.feature_id) && e.refund_state === 'active')) {
        for (const key of Object.keys(state.wallet) as (keyof Wallet)[]) {
          const total = state.wallet[key] + row.paid_resources[key]; if (!Number.isSafeInteger(total)) reject('RESOURCE_OVERFLOW'); state.wallet[key] = total;
        }
        row.refund_state = 'refunded'; row.refund_command_id = command.request_id;
      }
      const starter = Object.values(content.skills).filter(s => s.class_id === root && s.kind === 'active' && Number(s.unlock_level) <= 1).map(s => String(s.id));
      if (starter.length !== 2) throw new Error('STARTER_SKILL_CATALOG_MISMATCH');
      actor.awakened_skills = [];
      actor.skill_levels = Object.fromEntries(starter.map(id => [id, data.initial_state.initial_active_skill_grants.skill_level]));
      actor.active_slots = [starter[0]!, starter[1]!, null, null];
    }
  };
  switch (command.type) {
    case 'character.reset_level': {
      const quote=characterResetQuote(state,actor.character_id);if(!quote.canReset)reject('CHARACTER_ALREADY_RESET');
      const wallet={...state.wallet};for(const key of Object.keys(wallet)as(keyof Wallet)[]){const value=wallet[key]+quote.refund[key];if(!Number.isSafeInteger(value))reject('RESOURCE_OVERFLOW');wallet[key]=value;}
      // Reconstructed historical prefixes are archived in this reset receipt, not kept in the save.
      for(const[feature,quantity,paid]of[['character_level',quote.oldLevels,quote.legacyLevels],['breakthrough',quote.oldGates,quote.legacyGates]]as const)if(quantity>0)state.paid_ledger.push({entry_id:`legacy_${feature}_${command.request_id}`,character_id:actor.character_id,feature_id:feature,skill_id:null,quantity,cost_version:quote.legacyCostVersion,cost_versions:[quote.legacyCostVersion],paid_resources:{...paid},refund_state:'active',refund_command_id:null});
      for(const row of state.paid_ledger)if(row.character_id===actor.character_id&&row.refund_state==='active'&&CHARACTER_RESET_FEATURES.includes(row.feature_id)){row.refund_state='refunded';row.refund_command_id=command.request_id;}
      // All refundable payments are covered by the quote; reset restores free starter grants.
      reset(['stats','skills']);actor.level=1;actor.job_id=actor.root_job_id;actor.local_cap=data.progression.base_local_cap as Character['local_cap'];actor.completed_gate_ids=[];actor.unspent_status_points=data.progression.level_rows[0]!.total_status_points;
      for(const slot of equipmentSlots){const id=actor.equipment[slot],item=state.inventory.find(i=>i.instance_id===id);if(id&&(!item||equipmentFit(actor,slot,item,content)))actor.equipment[slot]=null;}
      state.wallet=wallet;return'CHARACTER_LEVEL_RESET';
    }
    case 'character.level_up': {
      if(command.params.target_level>rosterLevelCap(state.roster))reject('ROSTER_LEVEL_CAP_REACHED');
      const cost = levelQuote(actor, command.params.target_level, data), previous = data.progression.level_rows.find(r => r.level === actor.level)!, next = data.progression.level_rows.find(r => r.level === command.params.target_level)!;
      addInvestment('character_level', command.params.target_level - actor.level, cost);
      actor.unspent_status_points += next.total_status_points - previous.total_status_points; actor.level = command.params.target_level; return 'CHARACTER_LEVELLED';
    }
    case 'character.breakthrough': {
      const gate = data.progression.breakthrough_gates.find(g => g.at_level === command.params.gate_level);
      if (!gate || actor.level !== gate.at_level || actor.local_cap !== gate.at_level || actor.completed_gate_ids.includes(gate.at_level)) reject('BREAKTHROUGH_UNAVAILABLE');
      addInvestment('breakthrough', 1, gate.cost); actor.completed_gate_ids.push(gate.at_level); actor.local_cap = gate.unlocks_local_cap; return 'BREAKTHROUGH_COMPLETED';
    }
    case 'character.allocate_status': {
      const cost = allocationQuote(actor.primary_stats, command.params.allocation, data);
      if (actor.unspent_status_points < cost) reject('INSUFFICIENT_STATUS_POINTS');
      addInvestment('status', cost, {}); actor.unspent_status_points -= cost; actor.primary_stats = { ...command.params.allocation }; return 'STATUS_ALLOCATED';
    }
    case 'character.reset_build': reset(command.params.features); return 'BUILD_RESET';
    case 'character.change_job': {
      const job = command.params.job_id, plan = jobChangePlan(actor, job, data), root = plan.root;
      const compatibility = content.documents['equipment.json']!.weapon_compatibility as Readonly<Record<string, string>>;
      const weapon = state.inventory.find(i => i.instance_id === actor.equipment.weapon), definition = weapon && content.items[weapon.definition_id];
      if (definition && definition.weapon_type !== compatibility[job]) {
        // Canonical inventory includes equipped instances; never duplicate the object.
        if (state.inventory.length >= Number(content.documents['equipment.json']!.inventory_capacity)) reject('INVENTORY_FULL');
        actor.equipment.weapon = null;
      }
      if (!plan.preservesBuild) reset(['stats', 'skills'], root);
      actor.root_job_id = root; actor.job_id = job; actor.gender = plan.gender;
      return plan.preservesBuild ? 'HI_CLASS_PROMOTED' : 'JOB_CHANGED';
    }
  }
}

export function validateProgression(state: AccountState, content: ValidatedContent): void {
  const data = progressionData(content), npcRoots = new Set<RootJob>();
  for (const actor of state.roster) {
    if (rootForJob(actor.job_id, data) !== actor.root_job_id || actor.level > effectiveLevelCap(actor, data)) throw new Error('INVALID_CHARACTER_PROGRESSION');
    const job = content.jobs.byId[actor.job_id];
    if (!job || actor.level < job.minimumLevel || (job.ancestors.includes('bard') && actor.gender !== 'male') || (job.ancestors.includes('dancer') && actor.gender !== 'female')) throw new Error('INVALID_CHARACTER_PROGRESSION');
    if (actor.kind === 'npc') { if (actor.character_id !== `npc_${actor.root_job_id}` || npcRoots.has(actor.root_job_id)) throw new Error('INVALID_ROSTER_IDENTITY'); npcRoots.add(actor.root_job_id); }
    const gates = data.progression.breakthrough_gates.filter(g => actor.completed_gate_ids.includes(g.at_level));
    const cap = gates.at(-1)?.unlocks_local_cap ?? data.progression.base_local_cap;
    if (actor.local_cap !== cap || gates.some((g, index) => g.at_level !== 20 * (index + 1) || actor.level < g.at_level)) throw new Error('INVALID_BREAKTHROUGH_STATE');
    const invested = state.paid_ledger.filter(e => e.character_id === actor.character_id && e.feature_id === 'status' && e.refund_state === 'active').reduce((n, e) => n + e.quantity, 0);
    const total = data.progression.level_rows.find(r => r.level === actor.level)!.total_status_points;
    if (actor.unspent_status_points + invested !== total) throw new Error('STATUS_BUDGET_MISMATCH');
    if (!invested && Object.keys(actor.primary_stats).some(k => actor.primary_stats[k as keyof PrimaryStats] !== data.status_allocation.base[k as keyof PrimaryStats])) throw new Error('UNFUNDED_STATUS_ALLOCATION');
  }
  if (npcRoots.size !== 6 || !state.roster.some(a => a.kind === 'main' && a.character_id === 'main')) throw new Error('INVALID_ROSTER_IDENTITY');
}
