export function CardGrade({ grade }: { grade: string | undefined }) {
  return grade ? <span className={`card-grade ${grade}`} data-card-grade={grade}>{grade==='mvp'?'MVP':grade==='mini'?'MINI':'Normal'}</span> : null;
}
