export function CardGrade({ grade, rarity }: { grade: string | undefined; rarity?: string }) {
  return grade ? <span className={`card-grade ${grade} ${rarity==='rare'?'elite':''}`} data-card-grade={grade}>{grade==='mvp'?'MVP':grade==='mini'?'MINI':rarity==='rare'?'ELITE':rarity==='uncommon'?'Strong':'Normal'}</span> : null;
}
