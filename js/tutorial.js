import { audioInit, sfx } from './audio.js';
import { $, DISTRICTS, RIVALS, fmt, playerZ, prof, segL } from './config.js';
import { G } from './g.js';
import { demoTrack, newShift, startMission } from './game.js';
import { clearInput, input } from './input.js';
import { rateDelivery, starStr } from './rating.js';
import { save } from './save.js';
import { SPR } from './sprites.js';
import { goMenu, hideGameUI, renderResult, showGarage } from './ui.js';

/* ---------- tutorial: "İlk gün" ---------- */
// One fixed, gentle Kadıköy route. Each step waits for the player to do the move.
// No timer, the package never drops below 30%, so the tutorial cannot be failed.
const TOUCH = !matchMedia('(hover:hover) and (pointer:fine)').matches;
const PAY = 60;
const pz = () => G.pos + playerZ;

function markAhead() {
  for (const c of G.cars) if (c.z > pz() + 100 && c.z < pz() + segL * 70) c.tutA = 1;
}

const STEPS = [
  { target: '#joyBase', minT: 1.5,
    txt: ['Gaz otomatik. Sol yarıda parmağını sürükle, sağa sola kay.', 'Gaz otomatik. ← → ile sağa sola kay.'],
    check: (T, dt) => (T.acc += (Math.abs(input.steer || 0) > .25 || input.left || input.right) ? dt : 0) > 1 },
  { target: '[data-k="brake"]', minT: 1.5,
    txt: ['Önün kalabalıksa FREN’e bas. Basılı tut, yavaşla.', '↓ ile fren yap. Basılı tut, yavaşla.'],
    check: (T, dt) => (T.acc += input.brake ? dt : 0) > .6 },
  { target: null, minT: 1.5, maxT: 35, enter: markAhead,
    txt: ['Öndeki arabayı yanından sollayıp geç. Arkadan çarparsan paket hasar alır.'],
    check: () => { if (!G.cars.some(c => c.tutA)) markAhead(); return G.cars.some(c => c.tutA && c.z < pz() - 80); },
    exit: () => { for (const c of G.cars) delete c.tutA; } },
  { target: null, minT: 5.5,
    txt: ['Çukur, tümsek ve yere dökülen yağa dikkat. Her darbe paketi ezer; durumu sağ üstte, PAKET çubuğunda.'],
    check: () => true },
  { target: '[data-k="kick"]', minT: 2, maxT: 50,
    txt: ['Arkadan rakip kurye geliyor, üstteki aynalardan izle. Yanına gelince VUR’a bas.', 'Arkadan rakip kurye geliyor, üstteki aynalardan izle. Yanına gelince Boşluk ile vur.'],
    enter: T => {
      const p = RIVALS.find(r => r.id === 'green');
      T.rival = { p, hp: p.hp, z: pz() - 900, x: G.playerX > 0 ? -.5 : .5, speed: G.speed, down: 0, kick: 0, wind: 0, kside: 1, cutT: 2.5, cutCd: 8, dodge: 0, dsd: 1, blk: 0, cool: 3, fall: 0, spr: SPR.rv[p.id] };
      G.rivals = [T.rival];
    },
    check: T => {
      const r = T.rival;
      if (r.hp < r.p.hp || r.down > 0) return true;
      if (Math.abs(r.z - pz()) > 5000) { r.z = pz() - 900; r.speed = G.speed; }
      return false;
    } },
  { target: '#nitroBtn', minT: 1.5, maxT: 30,
    txt: ['Sana bir NİTRO verdim. Düz yolda bas: kısa bir hız patlaması.', 'Sana bir NİTRO verdim. Düz yolda N’ye bas: kısa bir hız patlaması.'],
    enter: () => { G.nitroN = 1; const nb = $('nitroBtn'); nb.hidden = false; nb.textContent = 'NİTRO ×1'; nb.classList.remove('used'); },
    check: () => G.nitroT > 0 },
  { target: null, minT: 0,
    txt: ['Gerisi sende. Normalde her siparişin süresi var, bugün yok. Paketi adrese götür.'],
    check: () => false },
];

function setPulse(sel) {
  document.querySelectorAll('.pulse').forEach(e => e.classList.remove('pulse'));
  if (sel) { const e = document.querySelector(sel); if (e) e.classList.add('pulse'); }
}

function showStep() {
  const T = G.tut, st = STEPS[T.step];
  $('radio').classList.remove('done');
  $('radioStep').textContent = (T.step + 1) + '/' + STEPS.length;
  $('radioTxt').textContent = st.txt[TOUCH ? 0 : st.txt.length - 1];
  setPulse(st.target);
}

function nextStep() {
  const T = G.tut;
  T.step++; T.stepT = 0; T.acc = 0; T.flash = 0;
  const st = STEPS[T.step];
  if (!st) return;
  if (st.enter) st.enter(T);
  showStep();
}

export function startTutorial() {
  const D = DISTRICTS[0];
  G.tut = { step: -1, stepT: 0, acc: 0, flash: 0, rival: null };
  G.shift = { L: 0, i: 0, cards: {}, earned: 0 };
  G.route = { D, kind: 'EĞİTİM', rest: 'Mahalle Pidecisi', from: 'Moda', to: 'Yeldeğirmeni', A: prof('Moda'), B: prof('Yeldeğirmeni'),
    len: 2200, time: 999, curv: D.curv * .6, hill: D.hill * .6, up: D.up, pay: PAY, d: 0, ev: null, seed: 3434 };
  startMission();
  G.rivals = []; G.nitroN = 0; $('nitroBtn').hidden = true;
  $('route').textContent = 'İLK GÜN · Moda → Yeldeğirmeni';
  $('radio').hidden = false;
  nextStep();
}

export function tutTick(dt) {
  const T = G.tut, st = STEPS[T.step];
  if (!st || G.state !== 'play') return;
  if (T.flash > 0) { T.flash -= dt; if (T.flash <= 0) nextStep(); return; }
  T.stepT += dt;
  const ok = st.check(T, dt);
  if (T.stepT >= st.minT && (ok || (st.maxT && T.stepT > st.maxT))) {
    if (st.exit) st.exit(T);
    T.flash = 1.1; sfx('beep'); setPulse(null);
    $('radio').classList.add('done');
    $('radioTxt').textContent = '✓ ' + $('radioTxt').textContent;
  }
}

export function tutStop() {
  G.tut = null; setPulse(null);
  $('radio').hidden = true;
}

export function tutFinish() {
  const rt = rateDelivery(true);
  G.S.money += PAY + rt.tip; G.S.tut = 1; save();
  tutStop(); G.shift = null;
  renderResult({
    eyebrow: 'İLK GÜN · EĞİTİM', title: 'İLK TESLİMAT',
    sub: '“' + rt.comment + '” · Yeldeğirmeni. Usta: “' + (rt.stars >= 4 ? 'İyi iş.' : rt.stars === 3 ? 'Fena değil.' : 'Paketi hırpaladın ama ilk gün sayılır.') + ' Müşteriler seni 1-5 yıldızla puanlar; puanın yüksek kaldıkça siparişler daha iyi öder. Gerçek vardiyada süre işler.”',
    rows: [['Müşteri puanı', starStr(rt.stars), 'stars'], ['Taşıma ücreti', fmt(PAY)], ['Bahşiş', fmt(rt.tip)], ['KASA', fmt(G.S.money), 'total']],
    buttons: [{ t: 'VARDİYAYA BAŞLA', cls: 'cta', fn: () => { audioInit(); newShift(); } }, { t: 'GARAJ', cls: 'ghost', fn: showGarage }, { t: 'MENÜ', cls: 'ghost', fn: goMenu }],
  });
}

// Skip from the radio: mark done and go straight to a real shift.
$('tutSkip').addEventListener('click', () => {
  G.S.tut = 1; save(); tutStop(); clearInput(); hideGameUI();
  G.state = 'menu'; G.paused = false; G.shift = null; demoTrack(); newShift();
});
