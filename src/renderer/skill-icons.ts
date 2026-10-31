import type {RuntimeAssetIndex} from '../contracts/assets.ts';
import {locateAsset,locateSkillVisual} from './asset-locator.ts';
import {shellVisuals} from './shell.ts';

/** Icons are independent of the enemy's native animation/audio recipe. */
export function locateSkillIcon(index:RuntimeAssetIndex,skillId:string){
 const override=shellVisuals(index).enemy_skill_icons?.[skillId];
 return override?locateAsset(index,override.asset_id):locateSkillVisual(index,skillId).icon;
}
