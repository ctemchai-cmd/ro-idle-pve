import { elementName, skillDamageElements, type DamageElement } from '../client/elements.ts';
import type { SkillDefinition } from '../contracts/index.ts';
import { Icon } from './icon.tsx';
import { useState } from 'react';
import { ElementGuide, ElementGuideButton } from './element-guide.tsx';

export function ElementBadge({ element, armor = false }: { element: DamageElement; armor?: boolean }) {
  const [open, setOpen] = useState(false);
  const name = elementName(element), label = armor ? `เกราะธาตุ${name}` : element === 'weapon' ? name : `ธาตุ${name}`;
  const badge=<span className={`element-badge element-${element}${armor ? ' armor-element' : ''}`} data-element={element} aria-label={label} title={element === 'weapon' ? 'ใช้ธาตุอาวุธ ณ ตอนใช้สกิล' : label}>
    {armor ? <Icon name="shield" /> : <i aria-hidden="true" />}<span>{armor ? 'เกราะ · ' : ''}{element === 'weapon' ? 'ตามอาวุธ' : name}</span>
  </span>;
  return armor&&element!=='weapon'?<><button type="button" className="element-armor-guide" aria-label={label} title="ดูตารางธาตุ" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{badge}</button>{open&&<ElementGuide armor={element} onClose={()=>setOpen(false)}/>}</>:badge;
}
export function SkillElements({ definition }: { definition: SkillDefinition }) {
  const elements = skillDamageElements(definition);
  return <div className="skill-elements" aria-label="ธาตุสกิล">{elements.length ? elements.map(element => <ElementBadge key={element} element={element} />) : <small>ไม่มีธาตุโจมตี</small>}<ElementGuideButton attack={elements.find(e=>e!=='weapon')} /></div>;
}
