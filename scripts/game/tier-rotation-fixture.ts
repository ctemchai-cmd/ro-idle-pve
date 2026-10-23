// Disposable loopback tests only; never called by the product or against owner data.
import type { AccountState } from '../../src/contracts/index.ts';
import { applySandboxRoster } from '../../src/client/roster.ts';
import { actor, battle, skill, step } from '../../tests/game/combat-fixtures.ts';
if(process.env.RO_SUPABASE_LOCAL_STACK!=='1')throw Error('ISOLATED_REQUIRED');
const state=JSON.parse(await new Promise<string>(resolve=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>resolve(s));})) as AccountState;
state.inventory.push({kind:'equipment',instance_id:'tier20_staff',definition_id:'equipment_staff_20',rarity_id:'epic',training:false,locked:true,options:[{id:'opt_atk',roll:500}]});
state.roster[0]!.equipment.weapon='tier20_staff';
state.roster[0]!.slot_progress.weapon={refine:5,refine_failures:2,enchant:{line_id:'offense',level:2},cards:[null,null,null]};
state.inventory.push({kind:'equipment',instance_id:'new_tier20',definition_id:'equipment_staff_20',rarity_id:'rare',training:false,locked:false,options:[]});
for(const a of state.roster)a.active_slots=[null,null,null,null];
const prepared=applySandboxRoster(state,'skill.set_loadout',{character_id:'main',skill_ids:['mage_fire_bolt',null,null,null]});
const cut=skill('cut',0,500,0);cut.effects=[{id:'cut',type:'interrupt',target:'foe'}];
const a=actor('a','player',[cut],true),b=actor('b','enemy',[skill('long',2500,500,0)],true);b.stat_blueprint.derived_offsets.attack_speed=200;
const controlled=battle([a,b],17,30000),expected=step(controlled,30000);
process.stdout.write(JSON.stringify({state:prepared,controlled,expected}));
