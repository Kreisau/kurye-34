import { clamp, pick } from './config.js';
import { G } from './g.js';

/* ---------- customer rating & tips ---------- */
// Stars come from package condition, time left and number of hits.
// The rolling average of the last 20 ratings moves offer pay by up to ±10%.
const KEEP = 20;

const LINES = {
  5: ['Yemek sıcacık, kutu jilet gibi. Eline sağlık!', 'Bu hızla nasıl geldin? Sağ ol usta.', 'Tam vaktinde, tertemiz. Beş yıldız.'],
  4: ['Biraz sallanmış ama sorun yok, teşekkürler.', 'Zamanında geldi, sağ ol.', 'Gayet iyi, bir dahakine de sen gel.'],
  3: ['Geldi işte. Ayran devrilmiş ama neyse.', 'Biraz geç kaldın ama idare eder.', 'Kutunun köşesi ezik, yine de teşekkürler.'],
  2: ['Çorba poşete dökülmüş, sıcak da değil.', 'Neredeyse iptal ediyordum, bu kadar geç olmaz.', 'Paketin hali içler acısı.'],
  1: ['Bunu kabul etmek zorunda mıyım?', 'Uygulamaya şikâyet yazıyorum.', 'Bir daha bu kuryeyi istemiyorum.'],
};
const RAIN = ['Bu yağmurda geldin ya, helal olsun.', 'Sırılsıklam olmuşsun, al şu bahşişi.'];
const FAIL = {
  time: ['Sipariş iptal. Yarım saattir bekliyorum.', 'Geç kaldın, başka yerden söyledim.'],
  pkg: ['Paket parçalanmış, iade istiyorum.', 'Bu ne hal? Teslim almıyorum.'],
};
const TIP = { 1: 0, 2: 0, 3: .04, 4: .10, 5: .20 };

// How generous the destination neighborhood is.
function generosity(B) {
  let g = { villa: 1.6, plaza: 1.3, wood: 1.1, hist: 1, apt: 1 }[B && B.style] || 1;
  if (B && B.mix) { if (B.mix.lux) g *= 1.3; if (B.mix.eco) g *= .7; }
  return g;
}

export function rateDelivery(ok, why) {
  const r = G.route;
  if (!ok) return { stars: 1, tip: 0, comment: pick(Math.random, FAIL[why] || FAIL.time) };
  const tr = r.time > 0 ? G.timeLeft / r.time : .3;
  const score = .65 * G.cond / 100 + .35 * Math.min(1, tr / .35);
  const stars = clamp(1 + Math.round(score * 4) - (G.hits >= 6 ? 1 : 0), 1, 5);
  const tip = Math.round(r.pay * TIP[stars] * generosity(r.B) / 5) * 5;
  const pool = r.ev === 'yagmur' && stars >= 3 ? LINES[stars].concat(RAIN) : LINES[stars];
  return { stars, tip, comment: pick(Math.random, pool) };
}

export function recordRating(stars) {
  (G.S.ratings ||= []).push(stars);
  if (G.S.ratings.length > KEEP) G.S.ratings = G.S.ratings.slice(-KEEP);
}

export const avgRating = () => {
  const a = G.S.ratings || [];
  return a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0;
};
// No ratings yet: neutral. Average 5 → +10%, 3 → 0, 1 → −10%.
export const payMult = () => { const a = avgRating(); return a ? 1 + .05 * (a - 3) : 1; };
export const starStr = n => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
export function ratingLabel() {
  const a = G.S.ratings || [];
  return a.length ? '★ ' + avgRating().toFixed(1).replace('.', ',') + ' (' + a.length + ')' : 'Henüz yok';
}
export function payLabel() {
  const p = Math.round((payMult() - 1) * 100);
  return p ? (p > 0 ? 'ücret +%' : 'ücret −%') + Math.abs(p) : '';
}
