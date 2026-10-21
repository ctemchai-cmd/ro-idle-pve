import type { SkillDefinition } from '../../contracts/index.ts';
import type { ValidatedContent } from '../../content/model.ts';
import type { Json, ObjectValue } from '../../content/value.ts';
import { freeze, isObject } from '../../content/value.ts';
/** Resolve learned level once at build time, keeping the base immutable. */
export function resolveSkill(id: string, level: number, content: ValidatedContent) {
  const definition = content.skills[id];
  if (!definition || !Number.isSafeInteger(level) || level < 1 || level > Number(definition.max_level)) throw new TypeError(`INVALID_SKILL_LEVEL:${id}:${level}`);
  const curves = definition.level_parameters as unknown as Record<string, number[]>;
  function resolve(value: Json): Json {
    if (Array.isArray(value)) return value.map(resolve);
    if (!isObject(value)) return value;
    if (Object.keys(value).length === 1 && typeof value.level_param === 'string') {
      const result = curves[value.level_param]?.[level - 1];
      if (result === undefined) throw new TypeError('UNRESOLVED_LEVEL_PARAM');
      return result;
    }
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolve(child)]));
  }
  return freeze({ level, definition: resolve(definition as unknown as ObjectValue) as unknown as SkillDefinition });
}
