import { horn, sfx } from './audio.js';
import { KMH, def, drawDist, maxSpeed, playerZ, rng, segL } from './config.js';
import { G } from './g.js';
import { card, crash } from './game.js';
import { buzz, hitStop, sparks } from './fx.js';
import { mk, rr } from './sprites.js';
import { toast } from './ui.js';

/* ---------- street life: traffic lights with crossings, pedestrians, police checkpoint,
   street dogs, wrong-way couriers. Set up per delivery from the route seed. ---------- */
export const S = { lights: [], peds: [], dogs: [], cops: [], onc: [], oncT: 0 };
let IMG = null;
const CYCLE = 13, GREEN = 6.8, YELLOW = 8;   // seconds: green until 6.8, yellow until 8, red until 13
const PED_FINE = 100, COP_FINE = 150, COP_LIMIT = 45, ONC_BONUS = 60;

function sprites() {
  if (IMG) return;
  const flipper = (g, w, flip) => { if (flip) { g.translate(w, 0); g.scale(-1, 1); } };
  const light = st => mk(60, 260, g => {
    g.fillStyle = '#2a2533'; g.fillRect(27, 76, 6, 184); g.fillStyle = '#15111a'; rr(g, 13, 2, 34, 78, 7); g.fill();
    [['#ff3b3b', 'red'], ['#ffc61a', 'yellow'], ['#3ddc84', 'green']].forEach(([c, k], i) => {
      const on = k === st, y = 17 + i * 24;
      if (on) { g.globalAlpha = .35; g.fillStyle = c; g.beginPath(); g.arc(30, y, 15, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.fillStyle = on ? c : '#3a3344'; g.beginPath(); g.arc(30, y, 9, 0, 7); g.fill();
    });
  });
  const ped = (coat, hair, f, flip) => mk(60, 150, g => {
    flipper(g, 60, flip);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(30, 146, 16, 4, 0, 0, 7); g.fill();
    const a = f ? 13 : -13;
    g.strokeStyle = '#221c2e'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(30, 94); g.lineTo(30 + a, 142); g.moveTo(30, 94); g.lineTo(30 - a, 142); g.stroke();
    g.fillStyle = coat; rr(g, 18, 42, 24, 58, 9); g.fill();
    g.strokeStyle = coat; g.lineWidth = 7; g.beginPath(); g.moveTo(30, 54); g.lineTo(30 - a * .9, 86); g.stroke();
    g.fillStyle = '#e2b48c'; g.beginPath(); g.arc(31, 28, 12, 0, 7); g.fill();
    g.fillStyle = hair; g.beginPath(); g.arc(29, 25, 12.5, Math.PI * .85, Math.PI * 1.95); g.fill();
  });
  const dog = (f, flip) => mk(110, 72, g => {
    flipper(g, 110, flip);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(55, 68, 34, 4, 0, 0, 7); g.fill();
    const c = '#b08a5a', a = f ? 9 : -9;
    g.strokeStyle = c; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); for (const [x, s] of [[34, 1], [42, -1], [70, 1], [78, -1]]) { g.moveTo(x, 44); g.lineTo(x + a * s, 66); } g.stroke();
    g.beginPath(); g.moveTo(26, 34); g.quadraticCurveTo(10, 28, 12, 14); g.stroke();
    g.fillStyle = c; g.beginPath(); g.ellipse(55, 38, 31, 13, 0, 0, 7); g.fill();
    g.beginPath(); g.arc(88, 26, 12, 0, 7); g.fill(); rr(g, 92, 24, 16, 10, 4); g.fill();
    g.fillStyle = '#7a5a36'; g.beginPath(); g.moveTo(80, 18); g.lineTo(84, 4); g.lineTo(92, 16); g.fill();
    g.fillStyle = '#15111a'; g.beginPath(); g.arc(92, 23, 2, 0, 7); g.fill(); g.beginPath(); g.arc(107, 27, 2.5, 0, 7); g.fill();
  });
  const cop = () => mk(90, 172, g => {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(40, 168, 20, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#1b2440'; g.fillRect(29, 100, 9, 66); g.fillRect(42, 100, 9, 66);
    rr(g, 24, 46, 32, 60, 9); g.fill();
    g.fillStyle = '#d7f24a'; g.fillRect(24, 70, 32, 7); g.fillRect(24, 86, 32, 5);
    g.strokeStyle = '#1b2440'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(54, 54); g.lineTo(72, 30); g.stroke();
    g.fillStyle = '#e2b48c'; g.beginPath(); g.arc(40, 32, 12, 0, 7); g.fill();
    g.fillStyle = '#f4eee6'; rr(g, 26, 14, 28, 11, 4); g.fill(); g.fillStyle = '#1b2440'; g.fillRect(24, 23, 32, 4);
    g.fillStyle = '#f4eee6'; g.beginPath(); g.arc(74, 20, 14, 0, 7); g.fill(); g.fillStyle = '#d8343a'; g.beginPath(); g.arc(74, 20, 11, 0, 7); g.fill();
    g.fillStyle = '#f4eee6'; g.fillRect(66, 17, 16, 6);
  });
  const csign = () => mk(120, 150, g => {
    g.fillStyle = '#2a2533'; g.fillRect(56, 70, 8, 80);
    g.fillStyle = '#f4eee6'; rr(g, 4, 4, 112, 70, 8); g.fill(); g.fillStyle = '#1b3c8c'; rr(g, 9, 9, 102, 60, 6); g.fill();
    g.fillStyle = '#f4eee6'; g.textAlign = 'center'; g.font = '900 24px Arial Black, Arial, sans-serif'; g.fillText('POLİS', 60, 36);
    g.font = '900 15px Arial Black, Arial, sans-serif'; g.fillText('ÇEVİRME', 60, 58);
  });
  // a courier coming straight at you: headlight on, seen from the front
  const oncoming = () => mk(180, 172, g => {
    const b = 168, cx = 90;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, b - 1, 34, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#15111a'; rr(g, cx - 9, b - 48, 18, 48, 8); g.fill();
    g.fillStyle = '#2a2533'; rr(g, cx - 15, b - 70, 30, 30, 8); g.fill();
    g.fillStyle = '#3b2f4a'; rr(g, cx - 34, b - 76, 68, 9, 4); g.fill();
    g.fillStyle = '#4a3a2a'; rr(g, cx - 26, b - 132, 52, 62, 14); g.fill();
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 22, b - 118); g.lineTo(cx - 32, b - 78); g.moveTo(cx + 22, b - 118); g.lineTo(cx + 32, b - 78); g.stroke();
    g.fillStyle = '#c9c2b6'; g.beginPath(); g.arc(cx, b - 142, 18, 0, 7); g.fill(); g.fillStyle = '#15111a'; rr(g, cx - 13, b - 148, 26, 10, 4); g.fill();
    g.globalAlpha = .35; g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(cx, b - 58, 22, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(cx, b - 58, 10, 0, 7); g.fill();
  });
  const coats = [['#c4373a', '#2a1f1a'], ['#2a6fb0', '#5a4632'], ['#e8e2da', '#1d1a20'], ['#3f8f5a', '#7a3b22']];
  IMG = {
    light: { red: light('red'), yellow: light('yellow'), green: light('green') },
    ped: coats.map(([c, h]) => [0, 1].map(f => [ped(c, h, f, false), ped(c, h, f, true)])),
    dog: [0, 1].map(f => [dog(f, false), dog(f, true)]),
    cop: cop(), onc: oncoming(), csign: def(csign(), 420),
  };
}

export function streetClear() { S.lights = []; S.peds = []; S.dogs = []; S.cops = []; S.onc = []; G.pedHit = false; G.fine = 0; }
export function streetSetup() {
  streetClear();
  if (G.tut || !G.shift || G.shift.boss || !G.route) return;
  sprites();
  const R = rng(((G.route.seed || 1) ^ 0x51ee) >>> 0), fi = Math.floor(G.finishZ / segL), d = G.route.d || 0, seg = G.segs;
  // a flat, fairly straight stretch with nothing else on it
  // `strict` wants a flat, fairly straight stretch; later tries accept gentler requirements so hilly routes still get lights
  const free = (n, strict) => {
    if (n < 100 || n > fi - 60) return false;
    for (let i = n - 22; i < n + 12; i++) { const s = seg[i]; if (!s || s.cl != null || s.xw || s.chk || (s.hz && Math.abs(i - n) < 8)) return false; }
    return Math.abs(seg[n + 4].p2.wy - seg[n - 16].p1.wy) / (20 * segL) < (strict ? .2 : .45) && Math.abs(seg[n].curve) < (strict ? 3 : 5);
  };
  const place = (count, gap, fn) => {
    for (let i = 0; i < count; i++) for (let t = 0; t < 60; t++) {
      const n = 100 + Math.floor(R() * Math.max(1, fi - 170));
      if (!free(n, t < 30) || used.some(u => Math.abs(u - n) < gap)) continue;
      used.push(n); fn(n); break;
    }
  };
  const used = [];
  place(1 + (fi > 1100 ? 1 : 0) + (d >= 6 ? 1 : 0), 160, n => {
    for (let k = 1; k <= 3; k++) seg[n + k].xw = true;
    S.lights.push({ n, z: n * segL, off: R() * CYCLE, st: 'green', was: false, passed: false });
  });
  if (d >= 2 && R() < .4) place(1, 120, n => {
    const side = seg[n].sea > 0 ? -1 : 1;
    seg[n].chk = true; seg[n - 16].sprites.push({ spr: IMG.csign, off: side * 1.1 });
    S.cops.push({ n, z: n * segL, side, warn: false, done: false });
  });
  place((R() < .55 ? 1 : 0) + (d >= 5 && R() < .4 ? 1 : 0), 90, n => {
    const side = seg[n].sea ? -seg[n].sea : (R() < .5 ? -1 : 1);
    S.dogs.push({ z0: n * segL, z: n * segL, x: side * 1.08, side, st: 'wait', t: 0, nip: 0 });
  });
  S.oncT = 10 + R() * 10;
}
export const lightsAhead = () => S.lights;

export function streetTick(dt) {
  if (!S.lights.length && !S.dogs.length && !S.cops.length && !S.onc.length && !(G.route && G.route.d >= 3 && G.shift && !G.shift.boss && !G.tut)) return;
  const pz = G.pos + playerZ; let canHit = G.crashT <= 0 && G.inv <= 0;
  for (const l of S.lights) {
    const ph = (G.clock + l.off) % CYCLE; l.st = ph > YELLOW ? 'red' : ph > GREEN ? 'yellow' : 'green';
    if (l.st === 'red' && !l.was) {
      const dz = l.z - pz;
      if (dz > -400 && dz < 14000) for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) {
        const dir = Math.random() < .5 ? -1 : 1;
        S.peds.push({ z: l.z + segL * (1.3 + Math.random() * 2.4), x: -dir * (1.12 + Math.random() * .3), dir, v: .4 + Math.random() * .22, c: Math.floor(Math.random() * 4), ph: Math.random() * 9, l });
      }
    }
    l.was = l.st === 'red';
  }
  for (const p of S.peds) {
    const hurry = p.flee ? 3.2 : p.l.st === 'green' ? 1.7 : 1;
    p.x += p.dir * p.v * hurry * dt;
    if (!p.flee && canHit && Math.abs(p.z - pz) < 70 && Math.abs(p.x - G.playerX) < .12) {
      p.flee = true; p.dir = Math.sign(p.x - G.playerX) || p.dir;
      canHit = false; G.pedHit = true; G.fine += PED_FINE; crash('Yayaya çarptın', 18);
      toast('Yayaya çarptın: ' + PED_FINE + ' TL ceza, puan düştü', 2400);
    }
  }
  if (S.peds.length) S.peds = S.peds.filter(p => Math.abs(p.x) < 1.6 && p.z > pz - 2000);
  for (const c of S.cops) {
    const dz = c.z - pz;
    if (!c.warn && dz > 0 && dz < 4200) { c.warn = true; toast('İleride polis çevirmesi: yavaşla', 2000); sfx('whistle'); }
    if (!c.done && dz < 0) {
      c.done = true;
      if (G.speed / maxSpeed * KMH > COP_LIMIT) { G.fine += COP_FINE; toast('Çevirmede yavaşlamadın: ' + COP_FINE + ' TL ceza', 2400); sfx('whistle'); }
      else toast('Kontrol tamam, kask yerinde', 1600);
    }
  }
  for (const d of S.dogs) {
    if (d.st === 'wait') { if (d.z0 - pz < 800 && d.z0 - pz > -100) { d.st = 'chase'; d.t = 5; d.nip = .5; sfx('bark'); toast('Köpek peşinde!', 1400); } continue; }
    if (d.st === 'chase') {
      d.t -= dt; const cap = maxSpeed * .4, want = pz + 20 - d.z;
      d.z += Math.max(-cap * dt, Math.min(cap * dt, want));
      const tx = G.playerX + d.side * .2; d.x += Math.max(-1.3 * dt, Math.min(1.3 * dt, tx - d.x));
      if (Math.abs(d.z - pz) < 120 && Math.abs(d.x - G.playerX) < .27) {
        d.nip -= dt;
        if (d.nip <= 0 && G.crashT <= 0) { d.nip = 1.1; G.slipT = Math.max(G.slipT, .3); G.slipDir = -d.side; sfx('bark'); }
      }
      if (d.t <= 0 || pz - d.z > 800) d.st = 'quit';
    } else { d.x += d.side * 1.2 * dt; d.z += maxSpeed * .1 * dt; }
  }
  if (S.dogs.length) S.dogs = S.dogs.filter(d => !(d.st === 'quit' && (Math.abs(d.x) > 1.4 || pz - d.z > 1500)));
  if (G.route && G.route.d >= 3 && G.shift && !G.shift.boss && !G.tut) {
    S.oncT -= dt;
    if (S.oncT <= 0) { S.oncT = 14 + Math.random() * 12; S.onc.push({ z: pz + drawDist * segL * .75, x: Math.random() < .5 ? -.33 : .33, v: maxSpeed * .3, honk: false }); }
  }
  for (const o of S.onc) {
    if (o.ko) { o.fall = Math.min(1.4, o.fall + dt * 5); o.vx *= Math.exp(-3 * dt); o.x = Math.max(-1.25, Math.min(1.25, o.x + o.vx * dt)); continue; }
    o.z -= o.v * dt; const dz = o.z - pz;
    if (!o.honk && dz < 2400) { o.honk = true; if (G.AC) horn('eco', G.AC.currentTime, .12, Math.max(-1, Math.min(1, (o.x - G.playerX) * 1.5))); }
    if (canHit && !o.hit && Math.abs(dz) < 80 && Math.abs(o.x - G.playerX) < .14) { o.hit = true; canHit = false; crash('Ters yönden gelen kuryeye çarptın', 14); }
  }
  if (S.onc.length) S.onc = S.onc.filter(o => o.z > pz - 800);
}

// Wrong-way couriers can be hit too. They close in fast, so the hit window ahead grows with the closing speed.
export function oncTarget(pz) {
  let best = null, bd = 1e9;
  for (const o of S.onc) { if (o.ko) continue; const dz = o.z - pz; if (dz < -80 || dz > 2500) continue; const sc = dz * .3 + Math.abs(o.x - G.playerX) * 400; if (sc < bd) { bd = sc; best = o; } }
  return best;
}
export function oncHit(wp, side, glove) {
  const pz = G.pos + playerZ;
  for (const o of S.onc) {
    if (o.ko || o.hit) continue;
    const gz = o.z - pz, dx = o.x - G.playerX, ahead = wp.za + (G.speed + o.v) / 30;   // two frames of closing distance: the hit lands as it passes, not from afar
    if (gz < -wp.zb || gz > ahead || Math.abs(dx) < .06 || Math.abs(dx) > wp.lmax * (glove ? 1.2 : 1) + .04 || Math.sign(dx) !== side) continue;
    o.ko = true; o.fall = 0; o.vx = side * .7;
    const add = ONC_BONUS * (glove ? 2 : 1); G.bonus += add;
    const pan = Math.max(-1, Math.min(1, dx * 1.5));
    sfx('impact', { w: wp.id, pan }); sfx('down', { pan }); sparks(side, 16); hitStop(.06); buzz(60); G.shakeT = .15;
    toast('Ters yön kuryesini devirdin!  +' + add + ' TL', 1800);
    return true;
  }
  return false;
}

// things for the renderer, same shape as cars: {z, img, ww, x}
export function streetObjs() {
  const out = [];
  if (!IMG) return out;
  for (const l of S.lights) for (const sd of [-1, 1]) out.push({ z: l.z + 30, img: IMG.light[l.st], ww: 250, x: sd * 1.07, rot: 0 });
  for (const p of S.peds) out.push({ z: p.z, img: IMG.ped[p.c][Math.floor(G.clock * (p.flee ? 12 : 6) + p.ph) % 2][p.dir > 0 ? 0 : 1], ww: 200, x: p.x, rot: 0 });
  for (const c of S.cops) out.push({ z: c.z, img: IMG.cop, ww: 290, x: c.side * 1.06, rot: 0 });
  for (const d of S.dogs) out.push({ z: d.z, img: IMG.dog[d.st === 'wait' ? 0 : Math.floor(G.clock * 10) % 2][(d.st === 'quit' ? d.side : -d.side) > 0 ? 0 : 1], ww: 330, x: d.x, rot: 0 });
  for (const o of S.onc) out.push({ z: o.z, img: IMG.onc, ww: 570, x: o.x, rot: o.ko ? o.fall * Math.sign(o.vx || 1) : 0 });
  return out;
}
