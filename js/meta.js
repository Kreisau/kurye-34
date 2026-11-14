import { sfx, sfxStars } from './audio.js';
import { $, BOSS, DISTRICTS, EVENTS, RESTS, fmt, pick, playerZ, prof, rng } from './config.js';
import { G } from './g.js';
import { KINDS, startMission, unlocked } from './game.js';
import { clearInput } from './input.js';
import { newRival } from './rivals.js';
import { payMult, starStr } from './rating.js';
import { save } from './save.js';
import { distStr, goMenu, hideGameUI, renderResult, showGarage, toast } from './ui.js';

/* ---------- long-term goals: the case file, the showdown, the daily order ---------- */
// One clue per finished shift once the shift count reaches `at`. Five clues unlock the showdown with Kara.
export const CLUES = [
  { at: 1, t: 'KIRIK AYNA', d: 'Usta: “Seni yerden kaldırdığım gece asfaltta kırık bir ayna buldum. Sol ayna, siyah.” Sana çarpan motorun sol aynası yok.' },
  { at: 3, t: 'IŞIKLARI KAPALI', d: 'Köşedeki çaycı o geceyi hatırlıyor: “Siyah kasklı biri ışıkları kapalı geçti. Kutusu da simsiyahtı, üstünde tek harf yoktu.”' },
  { at: 5, t: '34 NUMARA', d: 'Bir müşteri cebindeki fişe baktı: “Bu sipariş numarası değil, kurye numarası. Eskiden bu mahallede 34 numaralı bir kurye vardı. Bir gece ortadan kayboldu.” O kurye sendin.' },
  { at: 7, t: 'BÖLGE', d: 'Yere serdiğin rakiplerden biri konuştu: “Kara’yı mı arıyorsun? Senin eski bölgeni o aldı. Sen kaybolunca en çok o kazandı.”' },
  { at: 9, t: 'SON TESLİMAT', d: 'Usta bir adres uzattı: “Kara bu gece son teslimatını yapıyor. Yetişirsen yüzleşirsin. Dikkat et: sol tarafını göremez.”' },
];
const BOSS_PRIZE = 2000;

export function nextClue() {
  const c = CLUES[G.S.clues];
  if (!c || G.S.shifts < c.at) return null;
  G.S.clues++; save();
  return c;
}
export function showClue(c, buttons) {
  const n = G.S.clues, ready = n >= CLUES.length && !G.S.boss;
  sfx('bell');
  renderResult({ eyebrow: 'KİM ÇARPTI? · İPUCU ' + n + '/' + CLUES.length, title: c.t, sub: c.d + (ready ? '\n\nMenüde HESAPLAŞMA açıldı.' : ''), rows: [], buttons });
}
export function showCase() {
  const n = G.S.clues, ready = n >= CLUES.length && !G.S.boss, next = CLUES[n];
  const body = n ? CLUES.slice(0, n).map((c, i) => (i + 1) + '. ' + c.t + ': ' + c.d).join('\n\n') : 'Henüz ipucu yok. Vardiya bitirdikçe o gece hakkında bir şeyler öğreneceksin.';
  const tail = G.S.boss ? '\n\nDosya kapandı. Bölge senin: tüm ücretler +%10.' : next ? '\n\nSıradaki ipucu: ' + Math.max(1, next.at - G.S.shifts) + ' vardiya sonra.' : '';
  const buttons = [{ t: 'MENÜ', cls: 'ghost', fn: goMenu }];
  if (ready) buttons.unshift({ t: 'HESAPLAŞMA', cls: 'cta', fn: startBoss });
  renderResult({ eyebrow: 'DOSYA · ' + n + '/' + CLUES.length + ' İPUCU', title: 'KİM ÇARPTI?', sub: body + tail, rows: [], buttons });
}

/* ---------- showdown ---------- */
export function startBoss() {
  const D = DISTRICTS[Math.min(DISTRICTS.length - 1, 4)], a = D.pool[0], b = D.pool[1];
  G.shift = { L: G.S.shifts, i: 0, cards: {}, earned: 0, boss: true };
  G.route = { D, kind: 'HESAPLAŞMA', rest: 'Usta Moto Kurye', from: a, to: b, A: prof(a), B: prof(b), len: 2400, time: 150, curv: D.curv, hill: D.hill * .7, up: D.up, pay: 0, d: 6, ev: null, seed: 34034 };
  startMission();
  const r = newRival(BOSS, G.pos + playerZ + 500, -.4, 0, 4); r.boss = true;
  G.rivals = [r];
  $('route').textContent = 'HESAPLAŞMA · Kara’yı yere ser';
}
export function bossEnd(win, why) {
  if (!G.shift || !G.shift.boss || G.shift.over) return;
  G.shift.over = true;
  if (win) {
    toast('KARA YERDE!', 1600, true);
    setTimeout(() => {
      if (!G.shift || !G.shift.boss) return;
      G.state = 'result'; clearInput(); hideGameUI();
      const first = !G.S.boss; G.S.boss = 1; if (first) G.S.money += BOSS_PRIZE; save(); G.shift = null;
      sfxStars(5);
      renderResult({
        eyebrow: 'KİM ÇARPTI? · SON', title: 'HESAP KAPANDI',
        sub: 'Kara’nın kaskı asfaltta yuvarlandı. “Seni bölgeden atmak istedim, öldürmek değil” dedi. “Fren tutmadı.”\n\nAdını hâlâ hatırlamıyorsun. Ama numaran var, bölgen var, bir de Usta’nın dükkânı. Şimdilik yeter.',
        rows: first ? [['Usta’dan prim', fmt(BOSS_PRIZE)], ['Bölge senin', 'tüm ücretler +%10'], ['KASA', fmt(G.S.money), 'total']] : [['KASA', fmt(G.S.money), 'total']],
        buttons: [{ t: 'GARAJA GİT', cls: 'cta', fn: showGarage }, { t: 'MENÜ', cls: 'ghost', fn: goMenu }],
      });
    }, 1300);
  } else {
    G.state = 'result'; clearInput(); hideGameUI(); G.shift = null; sfx('fail');
    renderResult({
      eyebrow: 'HESAPLAŞMA', title: 'KARA KAÇTI',
      sub: why === 'pkg' ? 'Kara seni yere serdi ve gözden kayboldu. Sopa ya da zincirle, bir de daha hızlı bir motorla şansın artar.' : 'Yol bitti, Kara trafiğe karıştı. Onu arabalara ya da duvara doğru itmeyi dene: her kazada ağır hasar alır.',
      rows: [], buttons: [{ t: 'TEKRAR DENE', cls: 'cta', fn: startBoss }, { t: 'GARAJ', cls: 'ghost', fn: showGarage }, { t: 'MENÜ', cls: 'ghost', fn: goMenu }],
    });
  }
}

/* ---------- daily order ---------- */
export const dailyKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const dailyDone = () => !!(G.S.daily && G.S.daily.d === dailyKey() && G.S.daily.done);
export function startDaily() {
  const key = dailyKey(); let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const R = rng(h), L = Math.min(G.S.shifts, 8), d = L * 3 + 2, kind = KINDS[2];
  const D = DISTRICTS[Math.floor(R() * unlocked())];
  const len = Math.round(Math.min(2400, (600 + d * 90) * kind.len)), ref = Math.min(.75, .30 + d * .012);
  const pool = D.pool.slice(), a = pool.splice(Math.floor(R() * pool.length), 1)[0], b = pick(R, pool), ev = pick(R, Object.keys(EVENTS));
  G.shift = { L: G.S.shifts, i: 0, cards: {}, earned: 0, daily: key };
  G.route = { D, kind: 'GÜNÜN SİPARİŞİ', rest: pick(R, RESTS), from: a, to: b, A: prof(a), B: prof(b), len, time: Math.round((len / (60 * ref) + 10) * D.tmul),
    curv: D.curv, hill: D.hill, up: D.up, pay: Math.round((40 + d * 18) * kind.pay * 1.2 * payMult()), d, ev, seed: (R() * 1e9) | 0 };
  startMission();
  $('route').textContent = 'GÜNÜN SİPARİŞİ · ' + a + ' → ' + b;
}
export function dailyFinish(ok, why, rt) {
  const key = G.shift.daily, to = G.route.to, buttons = [{ t: 'TEKRAR DENE', cls: 'cta', fn: startDaily }, { t: 'MENÜ', cls: 'ghost', fn: goMenu }];
  const prev = G.S.daily && G.S.daily.d === key ? G.S.daily : { d: key, done: 0, best: 0 };
  if (ok) {
    const first = !prev.done, base = Math.round(G.route.pay * G.cond / 100) + Math.round(G.timeLeft * 1.5) + G.bonus + rt.tip, total = base * (first ? 2 : 1);
    G.S.money += total; G.S.daily = { d: key, done: 1, best: Math.max(prev.best, +G.timeLeft.toFixed(1)) }; save();
    sfxStars(rt.stars); if (G.AC) sfx('cash', { t: G.AC.currentTime + .25 + rt.stars * .16 });
    renderResult({ eyebrow: 'GÜNÜN SİPARİŞİ · ' + key, title: 'TESLİM EDİLDİ', sub: '“' + rt.comment + '” · ' + to + (first ? '' : '. Bugünkü çift ödemeyi zaten aldın; rekor için tekrar deneyebilirsin.'),
      rows: [['Müşteri puanı', starStr(rt.stars), 'stars'], ['Teslimat', fmt(base)], ['Günün ilk teslimi', first ? '×2' : '—'], ['TOPLAM', fmt(total), 'total'], ['Kalan süre (bugünkü rekor)', G.timeLeft.toFixed(1) + ' sn (' + G.S.daily.best.toFixed(1) + ')'], ['KASA', fmt(G.S.money)]], buttons });
  } else {
    save(); sfx('fail');
    renderResult({ eyebrow: 'GÜNÜN SİPARİŞİ · ' + key, title: 'OLMADI', sub: (why === 'time' ? 'Süre doldu. ' : 'Paket dağıldı. ') + '“' + rt.comment + '”',
      rows: [['Kalan mesafe', distStr()], ['Paket durumu', G.cond + '%']], buttons });
  }
  G.shift = null;
}
