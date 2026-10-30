import type{ValidatedContent}from'../../src/content/model.ts';
import{towerRow as liveRow,towerBoss as liveBoss}from'../../src/domain/modes/tower.ts';
/** Earlier polynomial oracles exclude only the explicit D204 late modifier. Current modifier has independent tests. */
export function historicalTowerContent(content:ValidatedContent):ValidatedContent{const c=structuredClone(content);delete(c.documents['tower.json']as Record<string,unknown>).late_difficulty;return c;}
export const towerRow=(floor:number,content:ValidatedContent)=>liveRow(floor,historicalTowerContent(content));
export const towerBoss=(floor:number,content:ValidatedContent)=>liveBoss(floor,historicalTowerContent(content));
