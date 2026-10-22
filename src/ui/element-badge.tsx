import { elementName, skillDamageElements, type DamageElement } from '../client/elements.ts';
import type { SkillDefinition } from '../contracts/index.ts';
import { Icon } from './icon.tsx';

export function ElementBadge({ element, armor = false }: { element: DamageElement; armor?: boolean }) {
  const name = elementName(element), label = armor ? `เกราะธาตุ${name}` : element === 'weapon' ? name : `ธาตุ${name}`;
  return <span className={`element-badge element-${element}${armor ? ' armor-element' : ''}`} data-element={element} aria-label={label} title={element === 'weapon' ? 'ใช้ธาตุอาวุธ ณ ตอนใช้สกิล' : label}>
    {armor ? <Icon name="shield" /> : <i aria-hidden="true" />}<span>{armor ? 'เกราะ · ' : ''}{element === 'weapon' ? 'ตามอาวุธ' : name}</span>
  </span>;
}
export function SkillElements({ definition }: { definition: SkillDefinition }) {
  const elements = skillDamageElements(definition);
  return <div className="skill-elements" aria-label="ธาตุสกิล">{elements.length ? elements.map(element => <ElementBadge key={element} element={element} />) : <small>ไม่มีธาตุโจมตี</small>}</div>;
}
