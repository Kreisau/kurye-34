import { $, el, rng } from './config.js';
import { storySfx, storyStop } from './audio.js';
import { showScreen } from './ui.js';

/* ---------- story intro ---------- */
// Six short scenes drawn on a canvas (placeholders until real art), text below, tap to advance.
const W = 360, H = 210;
const lerpN = (a, b, p) => a + (b - a) * p;

function grad(g, y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
  return gr;
}
function glow(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function skyline(g, seed, base, col, lit) {
  const R = rng(seed);
  for (let x = -10; x < W;) {
    const w = 26 + R() * 40, h = 50 + R() * 80;
    g.fillStyle = col; g.fillRect(x, base - h, w, h);
    for (let wy = base - h + 8; wy < base - 8; wy += 12)
      for (let wx = x + 5; wx < x + w - 6; wx += 9)
        if (R() < lit) { g.fillStyle = 'rgba(255,198,26,.5)'; g.fillRect(wx, wy, 4, 6); }
    x += w + 2;
  }
}
const roadL = y => lerpN(145, 0, (y - 120) / 90), roadR = y => lerpN(215, 360, (y - 120) / 90);

const SCENES = [
  { txt: 'Kadıköy, gece yarısına doğru. Yaya geçidinde yeşil yanıyordu.',
    draw(g, t) {
      g.fillStyle = grad(g, 0, 120, ['#07050d', '#1b1533']); g.fillRect(0, 0, W, H);
      skyline(g, 7, 122, '#120d22', .22);
      g.fillStyle = '#231c38'; g.beginPath(); g.moveTo(0, H); g.lineTo(W, H); g.lineTo(215, 120); g.lineTo(145, 120); g.fill();
      const y1 = 168, y2 = 198;
      g.fillStyle = 'rgba(217,212,204,.75)';
      for (let k = 0; k < 9; k++) {
        const a = k / 9 + .015, b = (k + .55) / 9;
        g.beginPath();
        g.moveTo(lerpN(roadL(y1), roadR(y1), a), y1); g.lineTo(lerpN(roadL(y1), roadR(y1), b), y1);
        g.lineTo(lerpN(roadL(y2), roadR(y2), b), y2); g.lineTo(lerpN(roadL(y2), roadR(y2), a), y2); g.fill();
      }
      g.fillStyle = '#2a2140'; g.fillRect(306, 92, 4, 90);
      g.fillStyle = '#120d22'; g.fillRect(297, 74, 22, 30);
      glow(g, 308, 89, 16, '95,211,141', .6);
      g.fillStyle = '#5fd38d'; g.beginPath(); g.arc(308, 89, 5, 0, 7); g.fill();
      // a single headlight closing in; it never reaches the camera, the next scene is the blackout
      const s = Math.min(1, t / 4), r = 8 + 110 * s * s;
      glow(g, 180, 132, r, '255,250,235', .95);
      g.fillStyle = `rgba(255,250,235,${.25 + .5 * s})`; g.fillRect(180 - r * 1.4, 131, r * 2.8, 2);
    } },
  { txt: 'Bir motor sesi. Fren yok. Sonra hiçbir şey.',
    draw(g, t) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const x = -40 + (t * 70) % 440, a = Math.max(0, .5 - t * .06);
      glow(g, x, 120, 22, '255,60,60', a);
      g.fillStyle = `rgba(255,90,90,${a})`; g.fillRect(x - 60, 119, 60, 2);
    } },
  { txt: 'Hastane. “Adınız? Sizi kimi arayalım?” Hiçbirini bilmiyorsun. Ne adını, ne evini.',
    draw(g, t) {
      g.fillStyle = grad(g, 0, H, ['#1d2a30', '#0f171b']); g.fillRect(0, 0, W, H);
      g.fillStyle = '#26363d'; g.fillRect(24, 36, 84, 72);
      g.fillStyle = '#0f171b'; for (let y = 40; y < 106; y += 7) g.fillRect(24, y, 84, 2);
      glow(g, 180, 6, 120, '220,245,240', .35);
      g.fillStyle = '#e8f4f0'; g.fillRect(120, 0, 120, 8);
      g.strokeStyle = '#4c5d63'; g.lineWidth = 2; g.beginPath(); g.moveTo(300, 36); g.lineTo(300, 200); g.stroke();
      g.fillStyle = 'rgba(200,230,240,.55)'; g.fillRect(290, 42, 20, 28);
      g.strokeStyle = 'rgba(200,230,240,.4)'; g.beginPath(); g.moveTo(300, 70); g.quadraticCurveTo(300, 150, 250, 160); g.stroke();
      g.fillStyle = '#0a0f10'; g.fillRect(214, 62, 66, 42); g.strokeStyle = '#34444a'; g.strokeRect(214, 62, 66, 42);
      g.strokeStyle = '#5fd38d'; g.lineWidth = 1.5; g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const x = 217 + i, ph = (i + t * 40) % 30;
        const y = 86 - (ph > 12 && ph < 14 ? 14 : ph >= 14 && ph < 16 ? -8 : 0);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.fillStyle = 'rgba(207,216,220,.22)'; g.fillRect(30, 168, 250, 42);
      g.fillStyle = 'rgba(232,244,240,.35)'; g.fillRect(40, 158, 70, 16);
    } },
  { txt: 'Cebinden çıkan tek şey yırtık bir teslimat fişi. Üstünde okunabilen tek şey bir sayı: <b>34</b>.',
    draw(g) {
      g.fillStyle = '#241d36'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(140,90,50,.35)'; g.lineWidth = 5; g.beginPath(); g.arc(72, 58, 26, 0, 7); g.stroke();
      g.save(); g.translate(190, 108); g.rotate(-.08);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-70, -84, 150, 148);
      g.fillStyle = '#efe8dc'; g.beginPath(); g.moveTo(-75, -88); g.lineTo(75, -88); g.lineTo(75, 48);
      for (let x = 75, i = 0; x > -75; x -= 10, i++) g.lineTo(x - 5, i % 2 ? 50 : 60);
      g.lineTo(-75, 54); g.fill();
      g.fillStyle = '#6b6470'; g.font = '700 9px Rubik, Arial, sans-serif'; g.fillText('TESLİMAT FİŞİ', -62, -70);
      g.fillStyle = '#c9c1b6'; for (let y = -60; y < -20; y += 9) g.fillRect(-62, y, 70 + ((y * 7) % 40), 3);
      g.fillStyle = '#1b1533'; g.font = '900 56px Rubik, Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('34', 0, 38);
      g.restore(); g.textAlign = 'left';
    } },
  { txt: 'Taburcu olduğun gün kapıda biri bekliyor. “Ben Usta. Seni hastaneye getiren benim. Adın yoksa sana <b>Kurye 34</b> deriz. Motor sürebilir misin?”',
    draw(g, t) {
      g.fillStyle = grad(g, 0, 170, ['#3a2346', '#f08a4b']); g.fillRect(0, 0, W, H);
      skyline(g, 21, 172, '#5a2d4e', .08);
      g.fillStyle = '#231c38'; g.fillRect(0, 172, W, 38);
      g.fillStyle = '#c9806b'; g.fillRect(60, 40, 240, 132);
      g.fillStyle = '#1b1533'; g.fillRect(90, 56, 180, 28);
      g.fillStyle = '#ffc61a'; g.font = '900 15px Rubik, Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('USTA MOTO KURYE', 180, 76); g.textAlign = 'left';
      for (let i = 0; i < 11; i++) { g.fillStyle = i % 2 ? '#f4eee6' : '#c4373a'; g.beginPath(); g.moveTo(66 + i * 21, 92); g.lineTo(87 + i * 21, 92); g.lineTo(90 + i * 21, 108); g.lineTo(63 + i * 21, 108); g.fill(); }
      g.fillStyle = 'rgba(255,214,140,.85)'; g.fillRect(78, 116, 96, 50);
      g.fillStyle = '#3a2a1a'; g.fillRect(196, 112, 44, 60);
      glow(g, 218, 140, 30, '255,214,140', .35);
      g.fillStyle = '#120d22'; g.beginPath(); g.arc(218, 128, 7, 0, 7); g.fill(); g.fillRect(209, 136, 18, 36);
      const bx = 262, by = 176;
      g.strokeStyle = '#120d22'; g.lineWidth = 4;
      g.beginPath(); g.arc(bx, by, 9, 0, 7); g.stroke(); g.beginPath(); g.arc(bx + 46, by, 9, 0, 7); g.stroke();
      g.fillStyle = '#2a4fd6'; g.beginPath(); g.moveTo(bx + 4, by - 6); g.lineTo(bx + 30, by - 6); g.lineTo(bx + 40, by - 20); g.lineTo(bx + 46, by - 20); g.lineTo(bx + 42, by - 4); g.lineTo(bx + 4, by + 2); g.fill();
      g.fillStyle = '#ffc61a'; g.fillRect(bx - 2, by - 26, 22, 18);
      g.fillStyle = '#1b1533'; g.fillRect(bx + 8, by - 10, 18, 4);
      glow(g, bx + 46, by - 18, 10, '255,250,220', .5 + .3 * Math.sin(t * 3));
    } },
  { txt: 'Çarpan kurye durmadı. Plakayı gören olmadı. Ama bu şehirde her kurye eninde sonunda aynı sokaklardan geçer.',
    draw(g, t) {
      g.fillStyle = grad(g, 0, H, ['#07050d', '#140f24']); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const x = 30 + i * 23; g.fillStyle = `rgba(127,180,255,${.04 + (i % 3) * .02})`; g.fillRect(x, 130, 2, 80); }
      glow(g, 180, 150, 40 + 6 * Math.sin(t * 2), '255,198,26', .25);
      g.fillStyle = '#ffc61a'; g.font = '900 44px Rubik, Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('KİM ÇARPTI?', 180, 98);
      g.fillStyle = '#c3b4d0'; g.font = '700 11px Rubik, Arial, sans-serif'; g.fillText('KURYE 34 · İLK GÜN', 180, 122); g.textAlign = 'left';
    } },
];

let idx = 0, t0 = 0, raf = 0, onDone = null, last = '';
const g = $('sCan').getContext('2d');
g.setTransform(2, 0, 0, 2, 0, 0);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

function loop(now) {
  const t = RM ? 10 : (now - t0) / 1000;
  SCENES[idx].draw(g, t);
  raf = requestAnimationFrame(loop);
}
function show(i) {
  idx = i; t0 = performance.now();
  const tx = $('sTxt'); tx.innerHTML = SCENES[i].txt;
  tx.style.animation = 'none'; void tx.offsetWidth; tx.style.animation = '';
  const d = $('sDots'); d.textContent = '';
  SCENES.forEach((_, k) => d.append(el('i', k === i ? 'on' : null)));
  $('sNext').textContent = i === SCENES.length - 1 ? last : 'DEVAM';
  storySfx(i);
}
function close() {
  cancelAnimationFrame(raf); raf = 0; storyStop();
  const f = onDone; onDone = null; if (f) f();
}

export function showStory(done, finalLabel) {
  onDone = done; last = finalLabel || 'BAŞLA';
  showScreen('story'); show(0);
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
const advance = () => { if (!onDone) return; if (idx < SCENES.length - 1) show(idx + 1); else close(); };
$('sNext').addEventListener('click', advance);
$('sCan').addEventListener('click', advance);
$('sSkip').addEventListener('click', close);
