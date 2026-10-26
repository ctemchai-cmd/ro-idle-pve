import type { CombatBonus, StatBlueprint } from '../../contracts/index.ts';
import { checked } from '../math/index.ts';

/** Data predicates only. No skill/card IDs, RNG, status mutations or extra hits. */
export function conditionalCombatBonuses(sources:Readonly<StatBlueprint['permanent_sources']>,damageType:CombatBonus['damage_types'][number],origin:CombatBonus['origins'][number],skillId:string):{damage:number;penetration:number}{
 let damage=0,penetration=0;
 for(const source of sources)for(const bonus of source.combat_bonuses??[]){
  if(!bonus.damage_types.includes(damageType)||!bonus.origins.includes(origin)||bonus.skill_ids&&!bonus.skill_ids.includes(skillId))continue;
  damage=checked(damage+(bonus.damage_bonus??0));penetration=checked(penetration+(bonus.penetration_bonus??0));
 }
 return{damage,penetration};
}
