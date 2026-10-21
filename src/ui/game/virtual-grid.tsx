import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Keep visible inventory rows mounted; filters and bulk selection still use the full list. */
export function VirtualGrid<T>({ items, renderItem }: { items: readonly T[]; renderItem: (item: T, index: number) => ReactNode }) {
  const root = useRef<HTMLDivElement>(null), grid = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ row: 0, count: 12, columns: 6, pitch: 64, gap: 6 });
  useLayoutEffect(() => {
    const node = root.current!, cells = grid.current!, viewport = node.closest<HTMLElement>('.page-layer');
    if (!viewport) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const style = getComputedStyle(cells), columns = style.gridTemplateColumns.split(/\s+/).length || 6, gap = parseFloat(style.rowGap) || 0;
      const cell = cells.querySelector<HTMLElement>('.bag-cell'), pitch = (cell?.getBoundingClientRect().height ?? 58) + gap;
      const rows = Math.ceil(items.length / columns), offset = viewport.getBoundingClientRect().top - node.getBoundingClientRect().top;
      const row = Math.min(Math.max(0, rows - 1), Math.max(0, Math.floor(offset / pitch) - 2)), count = Math.ceil(viewport.clientHeight / pitch) + 4;
      setRange(old => old.row === row && old.count === count && old.columns === columns && old.pitch === pitch && old.gap === gap ? old : { row, count, columns, pitch, gap });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure(); viewport.addEventListener('scroll', schedule, { passive: true });
    const resize = new ResizeObserver(schedule); resize.observe(node); resize.observe(viewport);
    return () => { viewport.removeEventListener('scroll', schedule); resize.disconnect(); cancelAnimationFrame(raf); };
  }, [items.length]);
  const rows = Math.ceil(items.length / range.columns), row = Math.min(range.row, Math.max(0, rows - 1));
  const start = row * range.columns, end = Math.min(items.length, (row + range.count) * range.columns);
  return <div ref={root} className="bag-window" data-window-start={start} style={{ position: 'relative', height: Math.max(0, rows * range.pitch - range.gap) }}>
    <div ref={grid} className="bag-grid" role="group" aria-label="ของในกระเป๋า" style={{ position: 'absolute', top: row * range.pitch, left: 0, right: 0 }}>
      {items.slice(start, end).map((item, index) => renderItem(item, start + index))}
    </div>
  </div>;
}
