import { G } from './g.js';

/* ---------- impact feedback: sparks, hit-stop, vibration ---------- */
const P = [];
let last = 0;
// side: -1 left of the player, 1 right, 0 centre. Coordinates are canvas pixels around the player sprite.
export function sparks(side, n, col) {
  const dw = G.pdw || G.K * .2, x = G.W / 2 + side * dw * .45, y = (G.py || G.H * .8) - dw * .55;
  for (let i = 0; i < n; i++) {
    const a = (side ? (side > 0 ? 0 : Math.PI) : -Math.PI / 2) + (Math.random() - .5) * 2.2, v = dw * (2 + Math.random() * 5);
    P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - dw * 2, t: .25 + Math.random() * .3, c: col || (Math.random() < .5 ? '#ffc61a' : '#fff3c4') });
  }
  if (P.length > 120) P.splice(0, P.length - 120);
}
export function fxDraw(ctx) {
  const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!P.length) return;
  const g = G.K * 9, w = Math.max(2, G.K * .012);
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t -= dt; if (p.t <= 0) { P.splice(i, 1); continue; }
    if (!G.paused) { p.vy += g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    ctx.globalAlpha = Math.min(1, p.t * 5); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, w, w);
  }
  ctx.globalAlpha = 1;
}
export function hitStop(s) { G.hitStop = Math.max(G.hitStop || 0, s); }
// Android only: iOS Safari has no vibration API
export function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }
