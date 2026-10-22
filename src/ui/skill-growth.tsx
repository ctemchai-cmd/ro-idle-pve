import { useMemo } from 'react';
import { skillLevelComparison, skillUpgradeChanges, type SkillOption } from '../client/skills.ts';
import './skill-growth.css';

/** Read-only level preview from the same resolved definitions used by combat. */
export function SkillGrowth({ skill }: { skill: SkillOption }) {
  const { rows, spOnly } = useMemo(() => skillLevelComparison(skill), [skill]);
  const current = rows[Math.max(0, skill.level - 1)]!, next = skill.level > 0 ? rows[skill.level] : undefined;
  const changes = next ? skillUpgradeChanges(current, next) : [];
  return <section className="skill-growth" aria-label="ผลการอัปเลเวลสกิล">
    {spOnly && <p className="skill-growth-note">อัปเลเวลลด SP · ผล/เวลาเท่าเดิม</p>}
    {next && <div className="skill-upgrade-diff"><h3>Lv.{next.level} · เปลี่ยนจากตอนนี้</h3>{changes.length ? changes.map((text, i) => <p key={i}>{text}</p>) : <p>ผลที่แสดงเท่าเดิม</p>}{next.level > skill.cap && <small>ดูตัวอย่าง · เกินเพดานปัจจุบัน {skill.cap}</small>}</div>}
    {!!skill.notes?.length && <details className="skill-notes" key={`${skill.id}-notes`}><summary>เงื่อนไขสกิล</summary>{skill.notes.map((note,i)=><p key={i}>{note}</p>)}</details>}
    <details className="skill-levels" key={skill.id}><summary>เทียบ Lv.1–{skill.max}</summary>
      <p className="skill-growth-caption">แสดงเฉพาะส่วนที่เปลี่ยน · ก่อนบัฟในไฟต์</p>
      {spOnly ? <table aria-label="SP แต่ละเลเวล"><thead><tr><th>Lv.</th><th>SP</th></tr></thead><tbody>{rows.map(row => <tr key={row.level} aria-current={row.level === skill.level ? 'true' : undefined}><th>{row.level}</th><td>{row.sp}</td></tr>)}</tbody></table>
        : <ol>{rows.map((row, i) => <li key={row.level} aria-current={row.level === skill.level ? 'true' : undefined}><b>Lv.{row.level}{row.sp !== null ? ` · SP ${row.sp}` : ''}</b>{(i ? skillUpgradeChanges(rows[i - 1]!, row).filter(text => !text.startsWith('SP ')) : row.effects).map((text, j) => <p key={j}>{text}</p>)}</li>)}</ol>}
    </details>
  </section>;
}
