/** Pure orbital geometry; the count comes from combat state, animation never creates a sphere. */
export function spiritSpherePoints(count: number, gameMs: number, radius = 35) {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => {
    const angle = gameMs / 650 + index * Math.PI * 2 / count;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * 12 - 55, front: Math.sin(angle) >= 0 };
  });
}
export function drawSpiritSpheres(ctx: CanvasRenderingContext2D, count: number, now: number, front: boolean, x: number, y: number) {
  for (const point of spiritSpherePoints(count, now)) {
    if (point.front !== front) continue;
    ctx.save(); ctx.translate(x + point.x, y + point.y);
    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 12); glow.addColorStop(0, '#f2fdffff'); glow.addColorStop(.3, '#8edbffb0'); glow.addColorStop(1, '#72bcff00');
    ctx.fillStyle = glow; ctx.fillRect(-12, -12, 24, 24);
    ctx.fillStyle = '#599bdc'; ctx.fillRect(-4, -3, 8, 6); ctx.fillRect(-3, -4, 6, 8);
    ctx.fillStyle = '#d5f3ff'; ctx.fillRect(-3, -2, 6, 4); ctx.fillRect(-2, -3, 4, 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(-2, -2, 3, 3); ctx.restore();
  }
}
