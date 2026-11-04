import type{ValidatedContent}from'../../src/content/model.ts';
import{towerRow as liveRow,towerBoss as liveBoss}from'../../src/domain/modes/tower.ts';
/** Earlier polynomial oracles exclude the explicit D204 late modifier and D216 boss profile, each covered independently. */
export function historicalTowerContent(content:ValidatedContent):ValidatedContent{const c=structuredClone(content);delete(c.documents['tower.json']as Record<string,unknown>).late_difficulty;delete(c.documents['enemies.json']as Record<string,unknown>).boss_combat;return c;}
export const towerRow=(floor:number,content:ValidatedContent)=>liveRow(floor,historicalTowerContent(content));
export const towerBoss=(floor:number,content:ValidatedContent)=>liveBoss(floor,historicalTowerContent(content));
