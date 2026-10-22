export function CardGrade({ grade, rarity, variant }: { grade: string | undefined; rarity?: string; variant?: string }) {
  if (variant==='puppet') return <span className="card-grade puppet" data-card-grade="puppet">PUPPET</span>;
  return grade ? <span className={`card-grade ${grade} ${rarity==='rare'?'elite':''}`} data-card-grade={grade}>{grade==='mvp'?'MVP':grade==='mini'?'MINI':rarity==='rare'?'ELITE':rarity==='uncommon'?'Strong':'Normal'}</span> : null;
}
