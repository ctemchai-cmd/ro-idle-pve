import type { AssetPack } from '../renderer/pack.ts';
import { elementName, skillDamageElements, type DamageElement } from '../client/elements.ts';
import type { SkillDefinition } from '../contracts/index.ts';
import { ElementGlyph } from './element-glyph.tsx';
import { useState } from 'react';
import { ElementGuide, ElementGuideButton } from './element-guide.tsx';

export function ElementBadge({ element, armor = false, weaponElement, pack, compact = false }: { element: DamageElement; armor?: boolean; weaponElement?: DamageElement; pack?: AssetPack | null; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const name = elementName(element), label = armor ? `เกราะธาตุ${name}` : element === 'weapon' ? name : `ธาตุ${name}`;
  const badge=<span className={`element-badge element-${element}${armor ? ' armor-element' : ''}${compact ? ' compact' : ''}`} data-element={element} aria-label={label} title={element === 'weapon' ? 'ใช้ธาตุอาวุธ ณ ตอนใช้สกิล' : label}>
    <ElementGlyph pack={pack} element={element==='weapon'&&weaponElement?weaponElement:element} /><span className="element-label">{armor ? 'เกราะ · ' : ''}{element === 'weapon' ? `ตามอาวุธ${weaponElement?' · '+elementName(weaponElement):''}` : name}</span>
  </span>;
  return armor&&element!=='weapon'?<><button type="button" className="element-armor-guide" aria-label={label} title="ดูตารางธาตุ" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{badge}</button>{open&&<ElementGuide armor={element} onClose={()=>setOpen(false)}/>}</>:badge;
}
export function SkillElements({ definition, weaponElement, pack }: { definition: SkillDefinition; weaponElement?: DamageElement; pack?: AssetPack | null }) {
  const elements = skillDamageElements(definition);
  return <div className="skill-elements" aria-label="ธาตุสกิล">{elements.length ? elements.map(element => <ElementBadge pack={pack} key={element} element={element} weaponElement={weaponElement} />) : <small>ไม่มีธาตุโจมตี</small>}<ElementGuideButton attack={elements.find(e=>e!=='weapon')} /></div>;
}
