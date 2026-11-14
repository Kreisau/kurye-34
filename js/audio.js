import { PW, clamp, maxSpeed, playerZ } from './config.js';
import { G } from './g.js';
import { input } from './input.js';
import { curBike } from './save.js';

/* ---------- audio ---------- */
// Everything is synthesized except the music (Gemini/Lyria tracks in music/, pre-looped by tools/make_loops.py).
// Graph: music / sfx (engine, horns, hits) / amb (city, rain, gulls, ferry) buses -> master -> compressor -> out.
const VOL_DEF = { music: .5, sfx: .8, amb: .5 };
const LEVEL = { music: .4, sfx: 1, amb: .6 };
const MASTER = 1.6;
const TRACKS = {
  menu: { url: 'music/menu.mp3', ls: .5, le: 70.4966 },
  ride: { url: 'music/ride.mp3', ls: .5, le: 96.4913 },
  tense: { url: 'music/ride-tense.mp3', ls: .5, le: 47.3695 },
};
export const vol = () => (G.S.vol ||= { ...VOL_DEF });

let A = null;               // current audio graph (swapped for offline renders)
G.AC = null; G.muted = false;

function build(ctx) {
  const a = { ctx, bus: {}, lastImpact: -9, buf: {}, loading: {}, mv: {}, mMode: null, hornGap: 0, ahT: 6, gullT: 3, ferryT: 14, lastT: 0, story: null };
  a.comp = ctx.createDynamicsCompressor();
  a.comp.threshold.value = -6; a.comp.knee.value = 10; a.comp.ratio.value = 3; a.comp.attack.value = .003; a.comp.release.value = .25;
  a.master = ctx.createGain(); a.master.connect(a.comp); a.comp.connect(ctx.destination);
  for (const k of ['music', 'sfx', 'amb']) { const g = ctx.createGain(); g.gain.value = 0; g.connect(a.master); a.bus[k] = g; }
  const sr = ctx.sampleRate;
  a.white = ctx.createBuffer(1, sr * 2, sr);
  { const d = a.white.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  a.brown = ctx.createBuffer(1, sr * 4, sr);
  { const d = a.brown.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
    const drift = d[d.length - 1] - d[0]; for (let i = 0; i < d.length; i++) d[i] -= drift * i / d.length; }
  a.echo = ctx.createGain(); a.echo.gain.value = .22;
  { const d = ctx.createDelay(.5), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    d.delayTime.value = .085; fb.gain.value = .28; lp.type = 'lowpass'; lp.frequency.value = 2200;
    a.echo.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(a.bus.sfx); }
  A = a; buildEngine(); buildAmb();
  return a;
}

/* ---------- primitives ---------- */
const now = () => A.ctx.currentTime;
const rnd = (a, b) => a + Math.random() * (b - a);
function dest(o) {
  const base = o.to || A.bus[o.bus || 'sfx'];
  if (o.pan && A.ctx.createStereoPanner) { const p = A.ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); p.connect(base); return p; }
  return base;
}
// attack -> optional hold at peak -> exponential release over dur
function env(g, t, o) {
  const a = o.att || .005, h = o.hold || 0;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.v, t + a);
  if (h) g.gain.setValueAtTime(o.v, t + a + h);
  g.gain.exponentialRampToValueAtTime(.0001, t + a + h + o.dur);
  return t + a + h + o.dur + .05;
}
function filt(n, o) {
  if (!(o.lp || o.bp || o.hp)) return n;
  const f = A.ctx.createBiquadFilter(); f.type = o.lp ? 'lowpass' : o.bp ? 'bandpass' : 'highpass';
  f.frequency.value = o.lp || o.bp || o.hp; f.Q.value = o.q || 1; n.connect(f); return f;
}
function tone(t, o) {
  const c = A.ctx, osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || (o.att || .005) + (o.hold || 0) + o.dur));
  filt(osc, o).connect(g); g.connect(dest(o));
  const end = env(g, t, o); osc.start(t); osc.stop(end);
  return osc;
}
function noise(t, o) {
  const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = o.buf || A.white; s.loop = true;
  f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || .7;
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.att || .003) + (o.hold || 0) + o.dur);
  s.connect(f); f.connect(g); g.connect(dest(o));
  const end = env(g, t, { att: .003, ...o }); s.start(t, Math.random() * 1.5); s.stop(end);
  return s;
}
function vibrato(osc, t, rate, depth, end) {
  const l = A.ctx.createOscillator(), g = A.ctx.createGain();
  l.frequency.value = rate; g.gain.value = depth; l.connect(g); g.connect(osc.frequency); l.start(t); l.stop(end);
}

/* ---------- one-shot effects ---------- */
const IMPACT = { hit: 1, crash: 1, bump: 1, pot: 1, junk: 1 };
export function sfx(kind, opt) {
  if (!A || G.muted) return;
  opt = opt || {};
  const t = opt.t != null ? opt.t : now(), pan = opt.pan || 0, w = opt.w || 'kick';
  if (IMPACT[kind]) { if (kind === 'hit' && t - A.lastImpact < .09) return; A.lastImpact = t; }
  switch (kind) {
    case 'click': tone(t, { f: 1700, type: 'square', dur: .03, v: .03, lp: 4000 }); break;
    case 'beep': tone(t, { f: 660, type: 'square', dur: .12, v: .05, lp: 3000 }); break;
    case 'go': tone(t, { f: 880, type: 'square', dur: .07, v: .05, lp: 3000 }); tone(t + .09, { f: 1320, type: 'square', dur: .22, v: .05, lp: 3500 }); break;
    case 'hit':
      tone(t, { f: 150, f2: 45, dur: .18, v: .55, pan }); noise(t, { dur: .14, v: .3, f: 900, pan });
      noise(t, { type: 'bandpass', f: 2600, q: 3, dur: .08, v: .12, pan }); break;
    case 'crash':
      noise(t, { type: 'bandpass', f: 2200, f2: 1300, q: 5, dur: .35, v: .22 });
      tone(t + .12, { f: 120, f2: 35, dur: .4, v: .75 }); noise(t + .12, { dur: .4, v: .45, f: 1400 });
      noise(t + .2, { type: 'bandpass', f: 3400, f2: 1500, q: 2.5, dur: .8, v: .14 });
      for (let i = 0; i < 4; i++) tone(t + .13 + i * .03 + rnd(0, .02), { f: rnd(1500, 3500), type: 'triangle', dur: .03, v: .08 });
      break;
    case 'bump': tone(t, { f: 95, f2: 40, dur: .13, v: .5 }); noise(t, { dur: .08, v: .2, f: 500 }); break;
    case 'pot':
      tone(t, { f: 80, f2: 35, dur: .18, v: .6 }); noise(t, { dur: .1, v: .25, f: 600 });
      for (let i = 0; i < 5; i++) noise(t + .05 + i * .045, { type: 'bandpass', f: 1800 + i * 120, q: 4, dur: .04, v: .1 });
      break;
    case 'junk':
      tone(t, { f: 110, f2: 50, dur: .12, v: .35 });
      for (let i = 0; i < 6; i++) { const ti = t + i * .05 + rnd(0, .03); tone(ti, { f: rnd(600, 3200), type: 'triangle', dur: rnd(.05, .1), v: .09 }); noise(ti, { type: 'highpass', f: 2500, dur: .03, v: .07 }); }
      break;
    case 'oil': {
      const o = tone(t, { f: 1850, dur: .5, hold: .2, v: .06, att: .03, bp: 1900, q: 2 }); vibrato(o, t, 17, 70, t + .8);
      noise(t, { type: 'bandpass', f: 2400, q: 2, dur: .6, v: .08 }); break;
    }
    case 'swing': case 'whoosh': {
      const lo = { kick: 700, bat: 450, chain: 900, bar: 380 }[w] || 700;
      noise(t, { type: 'bandpass', f: lo, f2: lo * 3.2, q: 1.4, dur: .18, v: .22, att: .04, pan });
      if (w === 'chain') for (let i = 0; i < 4; i++) tone(t + .03 + i * .04, { f: rnd(3500, 6000), dur: .04, v: .03, type: 'triangle', pan });
      break;
    }
    case 'impact':
      if (w === 'bat') { noise(t, { type: 'bandpass', f: 950, q: 9, dur: .14, v: .9, pan }); tone(t, { f: 240, f2: 130, dur: .1, v: .35, pan }); }
      else if (w === 'chain') { tone(t, { f: 150, f2: 60, dur: .1, v: .4, pan }); for (let i = 0; i < 7; i++) tone(t + rnd(0, .12), { f: rnd(2800, 6800), dur: .06, v: .05, type: 'triangle', pan }); noise(t, { type: 'highpass', f: 4000, dur: .12, v: .08, pan }); }
      else if (w === 'bar') { tone(t, { f: 140, f2: 60, dur: .1, v: .45, pan }); [523, 1312, 2350, 3710].forEach((f, i) => tone(t, { f, dur: [.7, .5, .35, .25][i], v: [.12, .08, .06, .04][i], pan })); }
      else { tone(t, { f: 170, f2: 70, dur: .11, v: .5, pan }); noise(t, { dur: .07, v: .25, f: 1200, pan }); }
      break;
    case 'down':
      noise(t, { type: 'bandpass', f: 2000, f2: 1200, q: 5, dur: .25, v: .15, pan }); tone(t + .1, { f: 100, f2: 40, dur: .25, v: .45, pan });
      noise(t + .15, { type: 'bandpass', f: 3200, f2: 1600, q: 2.5, dur: .6, v: .1, pan }); break;
    case 'nitro': noise(t, { type: 'bandpass', f: 300, f2: 3200, q: 1.2, dur: .7, v: .28, att: .05 }); tone(t, { f: 180, f2: 620, type: 'sawtooth', dur: .5, v: .05, lp: 1500 }); break;
    case 'cash':
      tone(t, { f: 2093, type: 'triangle', dur: .3, v: .09 }); tone(t + .07, { f: 2637, type: 'triangle', dur: .45, v: .09 });
      for (let i = 0; i < 3; i++) noise(t + .02 + i * .05, { type: 'highpass', f: 6000, dur: .04, v: .06 });
      break;
    case 'star': { const f = [880, 988, 1109, 1319, 1480][opt.i || 0]; tone(t, { f, dur: .45, v: .1 }); tone(t, { f: f * 2, dur: .25, v: .03 }); break; }
    case 'bell': tone(t, { f: 659, dur: 1.1, v: .12 }); tone(t, { f: 1819, dur: .3, v: .02 }); tone(t + .42, { f: 523, dur: 1.3, v: .12 }); tone(t + .42, { f: 1443, dur: .3, v: .02 }); break;
    case 'fail': tone(t, { f: 330, type: 'square', dur: .18, v: .04, lp: 1500 }); tone(t + .2, { f: 220, type: 'square', dur: .35, v: .04, lp: 1200 }); break;
  }
}
export function sfxStars(n, delay) {
  if (!A) return;
  const t = now() + (delay || .2);
  for (let i = 0; i < n; i++) sfx('star', { t: t + i * .16, i });
}

/* ---------- engine ---------- */
// Saw + detuned square + sub through a soft clipper and lowpass; a square LFO at half the firing rate
// gives the two-stroke "putt". Smaller bikes (higher pitch) get more putt and less sub.
function buildEngine() {
  const c = A.ctx, e = {};
  e.a = c.createOscillator(); e.a.type = 'sawtooth';
  e.b = c.createOscillator(); e.b.type = 'square'; e.b.detune.value = 9;
  e.sub = c.createOscillator(); e.sub.type = 'sine';
  e.ga = c.createGain(); e.ga.gain.value = .5; e.gb = c.createGain(); e.gb.gain.value = .22; e.gs = c.createGain(); e.gs.gain.value = .5;
  e.shape = c.createWaveShaper();
  const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(2.5 * x); } e.shape.curve = curve;
  e.lp = c.createBiquadFilter(); e.lp.type = 'lowpass'; e.lp.Q.value = 2;
  e.putt = c.createGain(); e.putt.gain.value = .7;
  e.lfo = c.createOscillator(); e.lfo.type = 'square'; e.lfoG = c.createGain(); e.lfoG.gain.value = 0;
  e.lfo.connect(e.lfoG); e.lfoG.connect(e.putt.gain);
  e.hs = c.createBufferSource(); e.hs.buffer = A.white; e.hs.loop = true;
  e.hf = c.createBiquadFilter(); e.hf.type = 'bandpass'; e.hf.frequency.value = 1400; e.hf.Q.value = 1.2; e.hg = c.createGain(); e.hg.gain.value = 0;
  e.out = c.createGain(); e.out.gain.value = 0;
  e.a.connect(e.ga); e.b.connect(e.gb); e.ga.connect(e.shape); e.gb.connect(e.shape);
  e.shape.connect(e.lp); e.sub.connect(e.gs); e.gs.connect(e.lp); e.lp.connect(e.putt); e.putt.connect(e.out);
  e.hs.connect(e.hf); e.hf.connect(e.hg); e.hg.connect(e.out); e.out.connect(A.bus.sfx);
  for (const o of [e.a, e.b, e.sub, e.lfo, e.hs]) o.start();
  A.eng = e;
}
// rpm 0..1, load 0..1 (throttle), p = bike pitch
export function engineSet(t, on, rpm, load, nitro, p) {
  const e = A.eng, ts = clamp((p - .85) / .6, 0, 1), k = .05;
  const f = (32 + 100 * rpm) * p * (nitro ? 1.08 : 1);
  e.a.frequency.setTargetAtTime(f, t, k); e.b.frequency.setTargetAtTime(f, t, k); e.sub.frequency.setTargetAtTime(f / 2, t, k);
  e.lfo.frequency.setTargetAtTime(f / 2, t, k);
  const depth = (.12 + .35 * ts) * (1 - rpm * .6);
  e.lfoG.gain.setTargetAtTime(depth / 2, t, k); e.putt.gain.setTargetAtTime(1 - depth / 2, t, k);
  e.gs.gain.setTargetAtTime(.3 + .5 * (1 - ts), t, k);
  e.lp.frequency.setTargetAtTime((260 + 1400 * rpm * (.4 + .6 * load)) * (1 + .3 * (1 - ts)) + (nitro ? 900 : 0), t, k);
  e.hg.gain.setTargetAtTime(on ? .006 + .02 * rpm * load : 0, t, k);
  e.out.gain.setTargetAtTime(on ? (.028 + .028 * rpm) * (.6 + .4 * load) * (nitro ? 1.25 : 1) : 0, t, .08);
}
function engineTick(t) {
  const st = G.state, on = !G.paused && (st === 'play' || st === 'count' || st === 'arrive');
  const b = curBike(), geared = b.id !== 'mob' && b.id !== 'sc';
  const rel = clamp(G.speed / Math.max(1, G.ST.top * maxSpeed), 0, 1.3);
  let rpm, load = 1;
  if (st === 'count' || G.crashT > 0) { rpm = .18 + (st === 'count' ? .05 * Math.max(0, Math.sin(G.clock * 7)) : 0); load = .3; }
  else if (geared) { const n = 5, x = Math.min(rel, 1) * n, gi = Math.min(n - 1, Math.floor(x)); rpm = .36 + .57 * (x - gi); }
  else rpm = .2 + .72 * Math.sqrt(Math.min(rel, 1));
  if (input.brake) load = .25; else if (st === 'arrive') load = .2; else if (rel > .97) load = .7;
  engineSet(t, on, Math.min(rpm, 1), load, G.nitroT > 0, b.pitch);
}

/* ---------- horns & siren ---------- */
// Car horns are a pair of electric disc horns a minor/major third apart; buses use air horns.
// res = diaphragm/bell resonances, drive = how hard the signal is clipped (rasp).
const HORNS = {
  taxi: { f: [415, 494], pat: [[0, .12], [.2, .14]], res: [1250, 2500], drive: 5 },
  dolmus: { f: [440, 554], pat: [[0, .1], [.16, .1], [.32, .3]], res: [1300, 2700], drive: 6 },
  bus: { f: [262, 330], pat: [[0, .9]], res: [800, 1700], drive: 8, att: .06, air: 1 },
  lux: { f: [370, 466], pat: [[0, .6]], res: [1100, 2300], drive: 3 },
  ticari: { f: [392, 466], pat: [[0, .35]], res: [1200, 2400], drive: 6 },
  eco: { f: [500], pat: [[0, .18], [.27, .18]], res: [1400, 2900], drive: 9 },
  car: { f: [415, 494], pat: [[0, .32]], res: [1250, 2500], drive: 5 },
};
let hornCurve = null;
function hornVoice(t, f, hold, v, pan, h, far) {
  const c = A.ctx, a = h.att || .012, end = t + a + hold + .1;
  const o1 = c.createOscillator(), o2 = c.createOscillator();
  o1.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = h.air ? 14 : 6;
  for (const o of [o1, o2]) { o.frequency.setValueAtTime(f * .93, t); o.frequency.exponentialRampToValueAtTime(f, t + .035); }
  const pre = c.createGain(); pre.gain.value = h.drive * .25;
  const sh = c.createWaveShaper();
  if (!hornCurve) { hornCurve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; hornCurve[i] = Math.tanh(3 * x); } }
  sh.curve = hornCurve;
  o1.connect(pre); o2.connect(pre); pre.connect(sh);
  const g = c.createGain(), out = c.createBiquadFilter();
  out.type = 'lowpass'; out.frequency.value = far ? 1800 : 5200;
  for (const [i, rf] of h.res.entries()) { const b = c.createBiquadFilter(); b.type = 'peaking'; b.frequency.value = rf; b.Q.value = 2.5; b.gain.value = i ? 6 : 10; sh.connect(b); b.connect(out); }
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = h.air ? 140 : 260; out.connect(hp); hp.connect(g);
  const rough = c.createOscillator(), rg = c.createGain(); rough.frequency.value = h.air ? 31 : 47; rg.gain.value = v * .12; rough.connect(rg); rg.connect(g.gain);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setValueAtTime(v, t + a + hold); g.gain.exponentialRampToValueAtTime(.0001, end);
  const d = dest({ pan }); g.connect(d); g.connect(A.echo);
  for (const o of [o1, o2, rough]) { o.start(t); o.stop(end + .02); }
}
export function horn(cat, t, v, pan, far) {
  if (!A || G.muted) return;
  const h = HORNS[cat] || HORNS.car;
  for (const [o, d] of h.pat) for (const f of h.f) hornVoice(t + o, f, d, v * .14 / h.f.length * 2, pan, h, far);
}
function hornTick(t, dt) {
  if (G.state !== 'play' || G.paused) return;
  const pz = G.pos + playerZ;
  A.hornGap = Math.max(0, A.hornGap - dt);
  for (const c of G.cars) {
    c.hcd = (c.hcd || 0) - dt;
    if (c.amb || c.hcd > 0 || A.hornGap > 0) continue;
    const dz = c.z - pz, dx = Math.abs(c.x - G.playerX), near = (c.hit + PW) / 2;
    const cutIn = dz < -60 && dz > -500 && dx < near && c.speed > G.speed * 1.15;   // you're slow in front of it
    const brush = Math.abs(dz) < 150 && dx < near + .06 && G.speed > c.speed * 1.1;            // you squeeze past it
    if (cutIn || brush) {
      horn(c.cat, t, .15 * clamp(1 - Math.abs(dz) / 3000, .3, 1), clamp((c.x - G.playerX) * 1.3, -1, 1));
      c.hcd = rnd(14, 20); A.hornGap = rnd(7, 11); break;
    }
  }
}
function sirenTick(t) {
  const on = !G.muted && !G.paused && (G.state === 'play' || G.state === 'count' || G.state === 'arrive');
  const amb = on ? G.cars.find(c => c.amb) : null;
  if (amb && !A.sir) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain(), p = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
    o.type = 'triangle'; g.gain.value = 0; o.connect(g); if (p) { g.connect(p); p.connect(A.bus.sfx); } else g.connect(A.bus.sfx); o.start();
    A.sir = { o, g, p };
  }
  if (!A.sir) return;
  if (!amb) { A.sir.g.gain.setTargetAtTime(0, t, .05); return; }
  const dz = Math.abs(G.pos + playerZ - amb.z);
  A.sir.o.frequency.setTargetAtTime(Math.floor(G.clock / .45) % 2 ? 960 : 700, t, .01);
  A.sir.g.gain.setTargetAtTime(clamp(1 - dz / 7000, 0, 1) * .06, t, .05);
  if (A.sir.p) A.sir.p.pan.setTargetAtTime(clamp((amb.x - G.playerX) * 1.2, -1, 1), t, .1);
  if (amb.honk && (A.ahonk = (A.ahonk || 0) - 1) <= 0) { horn('bus', t, .12 * clamp(1 - dz / 6000, .2, 1), 0); A.ahonk = 40; }
}

/* ---------- ambience ---------- */
function loopNoise(buf, type, f, q, to) {
  const c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = buf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0;
  s.connect(fl); fl.connect(g); g.connect(to); s.start(); return g;
}
function buildAmb() {
  A.bed = loopNoise(A.brown, 'lowpass', 420, .7, A.bus.amb);       // city rumble
  A.hush = loopNoise(A.white, 'bandpass', 900, .6, A.bus.amb);     // far traffic hush
  const r = loopNoise(A.white, 'highpass', 1200, .7, A.bus.amb);   // rain
  A.rain = r;
}
export function gull(t, v, pan) {
  for (let k = 0, n = 2 + Math.floor(Math.random() * 2); k < n; k++) {
    const tt = t + k * rnd(.28, .38), o = tone(tt, { f: rnd(1500, 1750), f2: rnd(1000, 1150), type: 'triangle', hold: .05, dur: .22, v, bp: 1500, q: 1.5, pan, bus: 'amb' });
    vibrato(o, tt, 28, 45, tt + .4);
  }
}
export function ferry(t, v) {
  for (const [f, m] of [[98, 1], [147, .8], [196, .35]]) tone(t, { f, type: 'sawtooth', att: .35, hold: 2.2, dur: 1.2, v: v * m, lp: 600, bus: 'amb' });
}
const seaRoute = () => { const r = G.route; return !!(r && ((r.A && r.A.sea) || (r.B && r.B.sea) || (r.D && r.D.sea))); };
function ambTick(t, dt) {
  const ride = G.state === 'play' || G.state === 'count' || G.state === 'arrive', story = !!A.story;
  const k = .4;
  A.bed.gain.setTargetAtTime(story ? 0 : ride ? .1 : .1, t, k);
  A.hush.gain.setTargetAtTime(story ? 0 : ride ? .012 + .008 * Math.min(1, G.speed / maxSpeed) : .01, t, k);
  A.rain.gain.setTargetAtTime(!story && G.route && G.route.ev === 'yagmur' && G.state !== 'menu' ? .18 : 0, t, k);
  if (story || G.paused || !seaRoute()) return;
  A.gullT -= dt; A.ferryT -= dt;
  if (A.gullT <= 0) { A.gullT = rnd(18, 35); gull(t, .03, rnd(-.8, .8)); }
  if (A.ferryT <= 0) { A.ferryT = rnd(50, 100); ferry(t, .06); }
}

/* ---------- story scene sounds ---------- */
export function storySfx(i) {
  if (!A) return;
  storyStop();
  const c = A.ctx, t = now() + .05, sg = c.createGain(); sg.connect(A.bus.sfx);
  A.story = sg;
  const to = sg;
  if (i === 0) {   // crossing ticker, a moped closing in
    for (let k = 0; k < 24; k++) tone(t + k * .16, { f: 2600, type: 'square', dur: .012, v: .03, lp: 5000, to });
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(165, t + 3.8);
    f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2200, t + 3.8);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + 3.8); g.gain.setTargetAtTime(.0001, t + 4.2, .3);
    o.connect(f); f.connect(g); g.connect(to); o.start(t); o.stop(t + 6);
  } else if (i === 1) {   // impact, then ringing ears
    sfx('crash', { t }); tone(t + .5, { f: 4200, att: 1, hold: 2, dur: 2, v: .02, to });
  } else if (i === 2) {   // hospital monitor + room tone
    for (let k = 0; k < 10; k++) tone(t + k, { f: 1000, dur: .12, v: .05, to });
    noise(t, { f: 300, att: .5, hold: 9, dur: 1, v: .05, to, buf: A.brown });
  } else if (i === 3) {   // paper
    for (let k = 0; k < 4; k++) noise(t + k * .09 + rnd(0, .05), { type: 'bandpass', f: rnd(3000, 5000), q: 1, dur: .07, v: .1, to });
  } else if (i === 4) {   // street at dusk, a moped idling, a gull
    noise(t, { f: 400, att: .6, hold: 9, dur: 1, v: .14, to, buf: A.brown });
    const o = tone(t, { f: 52, type: 'sawtooth', att: .4, hold: 9, dur: .5, v: .05, lp: 500, to }); vibrato(o, t, 13, 4, t + 10);
    gull(t + 1.6, .04, .5);
  } else if (i === 5) {   // drone + distant ferry
    for (const f of [55, 82.4]) tone(t, { f, att: 1.5, hold: 6, dur: 2, v: .06, to });
    ferry(t + .8, .05);
  }
}
export function storyStop() {
  if (!A || !A.story) return;
  const g = A.story, t = now(); A.story = null;
  g.gain.setTargetAtTime(0, t, .08); setTimeout(() => g.disconnect(), 600);
}

/* ---------- music ---------- */
function loadTrack(k) {
  if (A.buf[k]) return Promise.resolve(A.buf[k]);
  if (A.loading[k]) return A.loading[k];
  const a = A;
  return (a.loading[k] = fetch(TRACKS[k].url).then(r => r.arrayBuffer())
    .then(ab => new Promise((res, rej) => a.ctx.decodeAudioData(ab, res, rej)))
    .then(b => { a.loading[k] = null; a.buf[k] = b; return b; })
    .catch(() => { a.loading[k] = null; return null; }));
}
export function playTrack(k, t, gain, fade) {
  const b = A.buf[k]; if (!b) return null;
  const T = TRACKS[k], s = A.ctx.createBufferSource(), g = A.ctx.createGain();
  s.buffer = b; s.loop = true; s.loopStart = T.ls; s.loopEnd = T.le;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + (fade || .01));
  s.connect(g); g.connect(A.bus.music); s.start(t, T.ls);
  return { s, g };
}
function stopVoice(v, t, fade) {
  v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + fade);
  try { v.s.stop(t + fade + .05); } catch (e) { }
}
function musicTick(t) {
  const ride = G.state === 'play' || G.state === 'count' || G.state === 'arrive';
  const want = A.story ? 'off' : ride ? 'ride' : 'menu';
  if (want !== A.mMode) {
    for (const v of Object.values(A.mv)) stopVoice(v, t, 1);
    A.mv = {}; A.mMode = want;
    // keep only the buffers this mode needs: decoded music is large on phones
    if (want === 'ride') { A.buf.menu = null; loadTrack('ride'); loadTrack('tense'); }
    if (want === 'menu') { A.buf.ride = A.buf.tense = null; loadTrack('menu'); }
  }
  if (want === 'menu' && !A.mv.menu && A.buf.menu) A.mv.menu = playTrack('menu', t, 1, 1.5);
  if (want === 'ride' && !A.mv.ride && A.buf.ride && A.buf.tense) { A.mv.ride = playTrack('ride', t, 1, .8); A.mv.tense = playTrack('tense', t, 0, .01); }
  if (want === 'ride' && A.mv.ride) {
    const pz = G.pos + playerZ;
    const fight = G.rivals.some(r => r.down <= 0 && Math.abs(r.z - pz) < 400);
    A.fightT = fight ? (A.fightT || 0) + (t - (A.fightLast || t)) : 0; A.fightLast = t;
    if (G.state === 'play' && ((!G.tut && G.timeLeft <= 12) || A.fightT > 1.5)) A.tenseUntil = t + 6;
    const tense = G.state === 'play' && t < (A.tenseUntil || 0);
    A.mv.ride.g.gain.setTargetAtTime(tense ? 0 : 1, t, .7);   // never both tracks at once: they are different songs
    A.mv.tense.g.gain.setTargetAtTime(tense ? 1 : 0, t, .7);
  }
}

/* ---------- public ---------- */
export function applyVol() {
  if (!A) return;
  const v = vol(), t = now(), duck = G.paused ? .35 : 1;
  A.master.gain.setTargetAtTime(G.muted ? 0 : MASTER, t, .03);
  A.bus.music.gain.setTargetAtTime(v.music * LEVEL.music * duck, t, .1);
  A.bus.sfx.gain.setTargetAtTime(v.sfx * LEVEL.sfx, t, .05);
  A.bus.amb.gain.setTargetAtTime(v.amb * LEVEL.amb * duck, t, .1);
}
export function setMuted(m) { G.muted = m; applyVol(); }
export function audioInit() {
  if (G.AC) { if (G.AC.state !== 'running') G.AC.resume().catch(() => { }); return; }
  try {
    G.AC = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    build(G.AC); applyVol();
  } catch (e) { G.AC = null; A = null; }
}
export function audioTick() {
  if (!A || A.ctx !== G.AC) return;
  const t = now(), dt = Math.min(.1, Math.max(0, t - A.lastT)); A.lastT = t;
  if (A.duck !== G.paused) { A.duck = G.paused; applyVol(); }
  engineTick(t); hornTick(t, dt); sirenTick(t); ambTick(t, dt); musicTick(t);
}
// iOS can interrupt the context (calls, other apps); resume on the next touch.
addEventListener('pointerdown', () => { if (G.AC && G.AC.state !== 'running') G.AC.resume().catch(() => { }); }, true);
document.addEventListener('visibilitychange', () => {
  if (!G.AC) return;
  if (document.hidden) G.AC.suspend().catch(() => { }); else G.AC.resume().catch(() => { });
});

/* ---------- offline render (tools/sound_demo.py) ---------- */
// Builds a separate graph on an OfflineAudioContext, lets fn schedule into it, renders, restores the live graph.
export async function renderOffline(seconds, fn) {
  const live = A, off = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  build(off); A.master.gain.value = MASTER;
  const v = vol(); A.bus.music.gain.value = v.music * LEVEL.music; A.bus.sfx.gain.value = v.sfx * LEVEL.sfx; A.bus.amb.gain.value = v.amb * LEVEL.amb;
  try {
    await fn({ A, sfx, sfxStars, engineSet, horn, gull, ferry, storySfx, loadTrack, playTrack, setStoryOff: () => { A.story = null; } });
    return await off.startRendering();
  } finally { A = live; }
}
