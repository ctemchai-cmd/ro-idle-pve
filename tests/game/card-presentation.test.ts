import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Diff, statValue } from '../../src/ui/game/kit.tsx';
import { modifierText } from '../../src/ui/game/buddy.tsx';

test('new card statistics display percentage units and SP-cost improvements have the correct color',()=>{
 for(const key of ['fire_resistance','magical_guard_percent','sp_cost_percent','move_speed_percent','revive_hp_bonus','freeze_resistance'])assert.equal(statValue(key,.1),'10%',key);
 assert.equal(statValue('physical_attack',120),'120');assert.equal(statValue('attack_speed',100),'100');
 assert.match(renderToStaticMarkup(createElement(Diff,{before:.25,after:.08,keyName:'sp_cost_percent'})),/class="up">8%/);
 assert.match(renderToStaticMarkup(createElement(Diff,{before:0,after:.25,keyName:'sp_cost_percent'})),/class="down">25%/);
 assert.equal(modifierText({id:'weakness',stat:'fire_resistance',op:'add_flat',bucket:'bonus',value:-.1}),'ต้านไฟ -10%');
});
