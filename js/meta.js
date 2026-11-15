import { sfx, sfxStars } from './audio.js';
import { $, BOSS, DISTRICTS, ZONE_SHIFTS, fmt, num, playerZ, prof } from './config.js';
import { G } from './g.js';
import { startMission } from './game.js';
import { clearInput } from './input.js';
import { newRival } from './rivals.js';
import { payMult, starStr } from './rating.js';
import { save } from './save.js';
import { distStr, goMenu, hideGameUI, renderResult, showGarage, toast } from './ui.js';

/* ---------- long-term goals: the case file, the showdown, the daily order ---------- */
// One clue per finished shift once the shift count reaches `at`. Five clues unlock the showdown with Kara.
export const CLUES = [
  { at: 2, t: 'KIRIK AYNA', d: 'Usta: “Seni yerden kaldırdığım gece asfaltta kırık bir ayna buldum. Sol ayna, siyah.” Sana çarpan motorun sol aynası yok.' },
  { at: 4, t: 'IŞIKLARI KAPALI', d: 'Köşedeki çaycı o geceyi hatırlıyor: “Siyah kasklı biri ışıkları kapalı geçti. Kutusu da simsiyahtı, üstünde tek harf yoktu.”' },
  { at: 6, t: '34 NUMARA', d: 'Bir müşteri cebindeki fişe baktı: “Bu sipariş numarası değil, kurye numarası. Eskiden bu mahallede 34 numaralı bir kurye vardı. Bir gece ortadan kayboldu.” O kurye sendin.' },
  { at: 8, t: 'BÖLGE', d: 'Yere serdiğin rakiplerden biri konuştu: “Kara’yı mı arıyorsun? Senin eski bölgeni o aldı. Sen kaybolunca en çok o kazandı.”' },
  { at: 10, t: 'SON TESLİMAT', d: 'Usta bir adres uzattı: “Kara Şişli’de çalışıyor. Şişli’yi al, son teslimatına yetiş, yüzleş. Dikkat et: sol tarafını göremez.”' },
];
const BOSS_PRIZE = 2000;

// lifetime numbers, shown on the ending screen and in the closed case file
export function statRows() {
  const s = G.S.st, m = Math.round(s.t / 60), hm = (m >= 60 ? Math.floor(m / 60) + ' sa ' : '') + (m % 60) + ' dk';
  return [['Teslimat', String(s.del)], ['Yol', num(s.km, 1) + ' km'], ['Kazanılan', fmt(Math.round(s.earned))], ['Yere serilen kurye', String(s.kd)],
    ['Yenen ceza', fmt(Math.round(s.fines))], ['Tamamlanan vardiya', String(G.S.shifts)], ['Sürüş süresi', hm]];
}
// the showdown opens once all five clues are in and the last district (Kara's) is taken
export const bossReady = () => G.S.clues >= CLUES.length && G.S.shifts >= DISTRICTS.length * ZONE_SHIFTS && !G.S.boss;
export function nextClue() {
  const c = CLUES[G.S.clues];
  if (!c || G.S.shifts < c.at) return null;
  G.S.clues++; save();
  return c;
}
export function showClue(c, buttons) {
  const n = G.S.clues, ready = bossReady();
  sfx('bell');
  renderResult({ eyebrow: 'KİM ÇARPTI? · İPUCU ' + n + '/' + CLUES.length, title: c.t, sub: c.d + (ready ? '\n\nMenüde HESAPLAŞMA açıldı.' : n >= CLUES.length ? '\n\nŞişli’yi al, sonra Kara ile hesaplaş.' : ''), rows: [], buttons });
}
export function showCase() {
  const n = G.S.clues, ready = bossReady(), next = CLUES[n];
  const body = n ? CLUES.slice(0, n).map((c, i) => (i + 1) + '. ' + c.t + ': ' + c.d).join('\n\n') : 'Henüz ipucu yok. Vardiya bitirdikçe o gece hakkında bir şeyler öğreneceksin.';
  const tail = G.S.boss ? '\n\nDosya kapandı. Bölge senin: tüm ücretler +%10.' : next ? '\n\nSıradaki ipucu: ' + Math.max(1, next.at - G.S.shifts) + ' vardiya sonra.' : '';
  const buttons = [{ t: 'MENÜ', cls: 'ghost', fn: goMenu }];
  if (ready) buttons.unshift({ t: 'HESAPLAŞMA', cls: 'cta', fn: startBoss });
  renderResult({ eyebrow: 'DOSYA · ' + n + '/' + CLUES.length + ' İPUCU', title: 'KİM ÇARPTI?', sub: body + tail, rows: G.S.boss ? statRows() : [], buttons });
}

/* ---------- showdown ---------- */
export function startBoss() {
  const D = DISTRICTS[DISTRICTS.length - 1], a = D.pool[0], b = D.pool[1];
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
        rows: (first ? [['Usta’dan prim', fmt(BOSS_PRIZE)], ['Bölge senin', 'tüm ücretler +%10']] : []).concat(statRows(), [['KASA', fmt(G.S.money), 'total']]),
        buttons: [{ t: 'SON', cls: 'cta', fn: showEnding }],
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

// the closing scene: the story is over, the city stays open
export function showEnding() {
  renderResult({
    eyebrow: 'KURYE 34 · SON', title: 'DOSYA KAPANDI',
    sub: 'Usta dükkânın kepengini yarıya kadar indirdi, iki çay koydu. “Kaskını bırakmıyorsun, değil mi?” dedi.\n\nBırakmıyorsun. Şehir hâlâ aç, siparişler hâlâ geliyor. Artık kimseden kaçmıyorsun.\n\nOyunu bitirdin. Serbest sürüşte istediğin kadar vardiya alabilirsin; tüm ücretler +%10.',
    rows: [], buttons: [{ t: 'SERBEST SÜRÜŞ', cls: 'cta', fn: goMenu }, { t: 'GARAJ', cls: 'ghost', fn: showGarage }],
  });
}
