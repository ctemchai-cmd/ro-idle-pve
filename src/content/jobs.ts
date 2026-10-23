import { freeze, isObject, type DeepReadonly } from './value.ts';

export interface JobAdvancement { job_id: string; parent_job_id: string; minimum_level: number }
export interface JobDefinition {
  id: string;
  root: string;
  parent: string | null;
  stage: number;
  minimumLevel: number;
  /** Root through this job, inclusive. Sibling branches never appear here. */
  ancestors: string[];
}
export type JobCatalog = DeepReadonly<{ order: string[]; byId: Record<string, JobDefinition> }>;

/** Pure content compiler. Optional advancements extend the existing Class1→Class2 tree. */
export function createJobCatalog(progression: unknown): JobCatalog {
  const fail = (detail: string): never => { throw new TypeError(`INVALID_JOB_GRAPH: ${detail}`); };
  if (!isObject(progression) || !isObject(progression.class_tree) || !isObject(progression.promotion)) return fail('shape');
  const tree = progression.class_tree, class2Level = progression.promotion.class2_min_level;
  const level = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 1;
  const id = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9_]*$/.test(value);
  if (!level(class2Level) || !Object.keys(tree).length) return fail('class2 level or roots');
  const byId: Record<string, JobDefinition> = Object.create(null);
  const children: Record<string, string[]> = Object.create(null);
  const roots = Object.keys(tree);
  const add = (job: string, parent: JobDefinition | null, minimumLevel: number) => {
    if (!id(job) || byId[job]) return fail(`duplicate or invalid id ${job}`);
    if (parent && minimumLevel < parent.minimumLevel) return fail(`level decreases at ${job}`);
    byId[job] = { id: job, root: parent?.root ?? job, parent: parent?.id ?? null, stage: (parent?.stage ?? 0) + 1, minimumLevel, ancestors: [...(parent?.ancestors ?? []), job] };
    children[job] = [];
    if (parent) children[parent.id]!.push(job);
  };
  for (const root of roots) add(root, null, 1);
  for (const [root, branches] of Object.entries(tree)) {
    if (!Array.isArray(branches)) return fail(`branches of ${root}`);
    for (const branch of branches) {
      if (!id(branch)) return fail(`invalid child of ${root}`);
      add(branch, byId[root]!, class2Level);
    }
  }
  // Authored future rows remain inactive until the matching feature is enabled.
  // Explicit job_advancements also supports isolated generic/Class3 catalog fixtures.
  const extensions = progression.job_advancements ?? (progression.promotion.hi_class_enabled === true && isObject(progression.hi_class) ? progression.hi_class.job_advancements : []);
  if (!Array.isArray(extensions)) return fail('advancements shape');
  const pending = new Map<string, JobAdvancement>();
  for (const row of extensions) {
    if (!isObject(row) || !id(row.job_id) || !id(row.parent_job_id) || !level(row.minimum_level)
      || Object.keys(row).some(key => !['job_id', 'parent_job_id', 'minimum_level'].includes(key))) return fail('advancement shape');
    if (byId[row.job_id] || pending.has(row.job_id)) return fail(`duplicate id ${row.job_id}`);
    pending.set(row.job_id, { job_id: row.job_id, parent_job_id: row.parent_job_id, minimum_level: row.minimum_level });
  }
  const visiting = new Set<string>();
  const visit = (job: string): JobDefinition => {
    if (byId[job]) return byId[job]!;
    if (visiting.has(job)) return fail(`cycle at ${job}`);
    const row = pending.get(job);
    if (!row) return fail(`missing parent ${job}`);
    visiting.add(job);
    const parent = visit(row.parent_job_id);
    if (parent.stage < 2) return fail(`advancement parent is not Class2 or later: ${parent.id}`);
    add(row.job_id, parent, row.minimum_level);
    visiting.delete(job);
    return byId[job]!;
  };
  for (const job of pending.keys()) visit(job);
  const order: string[] = [];
  const walk = (job: string) => { order.push(job); for (const child of children[job]!) walk(child); };
  for (const root of roots) walk(root);
  return freeze({ order, byId });
}

export function jobAllowsSkill(catalog: JobCatalog, actor: { job_id: string; root_job_id: string }, skillClass: string): boolean {
  const job = catalog.byId[actor.job_id];
  return Boolean(job && job.root === actor.root_job_id && job.ancestors.includes(skillClass));
}
