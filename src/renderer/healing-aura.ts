/** Authored procedural HoT indicator, not a native STR effect. No combat or wall clock. */
export function healingAuraGeometry(gameMs: number, radius = 42) {
  const phase = gameMs / 1500, pulse = .85 + Math.sin(phase * Math.PI * 2) * .08;
  return { radius: radius * pulse, angle: gameMs / 4800,
    particles: Array.from({ length: 5 }, (_, i) => { const progress = ((gameMs / 1600 + i / 5) % 1 + 1) % 1; return { x: Math.sin(i * 2.4 + gameMs / 2100) * radius * .65, y: 5 - progress * 45, alpha: Math.sin(progress * Math.PI) * .65 }; }) };
}
export function drawHealingAura(context: CanvasRenderingContext2D, gameMs: number, x: number, y: number, radius = 42): void {
  const geometry = healingAuraGeometry(gameMs, radius);
  context.save(); context.translate(x, y + 4); context.globalCompositeOperation = 'screen';
  context.save(); context.scale(1, .34);
  const glow = context.createRadialGradient(0, 0, 4, 0, 0, geometry.radius);
  glow.addColorStop(0, '#77efab08'); glow.addColorStop(.65, '#56d89d30'); glow.addColorStop(1, '#9cfbd500');
  context.fillStyle = glow; context.beginPath(); context.arc(0, 0, geometry.radius, 0, Math.PI * 2); context.fill();
  context.strokeStyle = '#9cffe1b0'; context.lineWidth = 2; context.beginPath(); context.arc(0, 0, geometry.radius, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = '#6be6b16e'; context.lineWidth = 1.5; context.beginPath(); context.arc(0, 0, geometry.radius * .77, 0, Math.PI * 2); context.stroke();
  context.rotate(geometry.angle); context.strokeStyle = '#d3ffdcaf'; context.lineWidth = 2;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; context.beginPath(); context.moveTo(Math.cos(a) * geometry.radius * .84, Math.sin(a) * geometry.radius * .84); context.lineTo(Math.cos(a) * geometry.radius, Math.sin(a) * geometry.radius); context.stroke(); }
  context.restore(); context.fillStyle = '#b8ffd0';
  for (const particle of geometry.particles) { context.globalAlpha = particle.alpha; context.fillRect(particle.x - 1, particle.y - 4, 2, 7); context.fillRect(particle.x - 3, particle.y - 2, 6, 2); }
  context.restore();
}
