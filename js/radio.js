import { $, playerZ } from './config.js';
import { G } from './g.js';

/* ---------- radio: tutorial steps (js/tutorial.js) and story lines while riding ----------
   Story lines come from three voices: Usta on the radio, 34's own thoughts, and the rival couriers.
   They follow the case file (G.S.clues), so the mystery moves forward during rides, not only on result screens.
   Every line needs its English in js/i18n.js. */

// The tutorial radio sits in the gap between the two mirrors; talk lines get a full-width strip under the mirrors
// (toast and countdown move down while it shows: --radB).
export function placeRadio() {
  const r = $('radio'), M = G.MIR;
  if (!M || r.hidden) return;
  const s = G.W / innerWidth;
  if (r.classList.contains('talk')) { r.style.left = r.style.width = r.style.top = ''; r.classList.remove('compact'); document.documentElement.style.setProperty('--radB', (r.offsetHeight + 8) + 'px'); return; }
  const gap = 8, x0 = (M.l + M.w) / s + gap, x1 = M.r / s - gap, w = Math.min(420, x1 - x0);
  r.style.left = (x0 + (x1 - x0 - w) / 2) + 'px'; r.style.width = w + 'px'; r.style.top = (M.y / s - (w < 260 ? 10 : 0)) + 'px';
  r.classList.toggle('compact', w < 260);
}
addEventListener('resize', () => setTimeout(placeRadio, 0));

const STORY = [
  [['USTA', 'Yavaş git demiyorum, sağ git diyorum. O gece de acele ediyordun.'], ['34', 'Bu sokakları ezbere biliyor gibiyim. Nereden?'], ['USTA', 'Adını bana sorma. Sen hatırlayınca ben de söylerim.']],
  [['USTA', 'Sol aynası kırık siyah bir motor görürsen bana haber ver.'], ['34', 'Kırık ayna. Artık her siyah motora iki kez bakıyorum.']],
  [['USTA', 'Çaycı yalan söylemez. Işıkları kapalı giden adam bir şeyden kaçıyordur.'], ['34', 'Karanlıkta farsız bir motor. Bu görüntü rüyalarımda da var.']],
  [['USTA', '34 numara sendin evlat. Bu mahallede en hızlı sendin.'], ['34', 'Müşteriler beni tanıyor. Ben onları tanımıyorum.']],
  [['USTA', 'Kara senin bölgeni aldı. Bölge almak için adam ezmek gerekmezdi ama.'], ['34', 'Kara. İsmi duyunca sol omzum sızlıyor.']],
  [['USTA', 'Önce Şişli’yi al, sonra menüden hesaplaşmaya git. Sol tarafını göremez, unutma.'], ['34', 'Bu gece bitecek. Ya o düşecek ya yine ben.']],
  [['USTA', 'Bölge artık senin. Kara da artık kimsenin yolunu kesmiyor.'], ['34', 'Adımı hâlâ hatırlamıyorum. Şimdilik numaram yetiyor.']],
];
const RIVAL = {
  red: { n: 'ALEV', intro: ['Bu cadde benim. Geri bas, çaylak.', '34 mü? Sana öldü diyorlardı.'], down: ['Tamam, tamam! Düştüğümü Kara’ya söyleme.'] },
  green: { n: 'ÇEVİK', intro: ['Yakalayabilirsen konuşuruz.', 'Paketini ben götüreyim, sen dinlen.'], down: ['O gece Kara’nın arkasındaydım. Fren lambası hiç yanmadı.'] },
  orange: { n: 'TOSUN', intro: ['Yol dar, ben genişim. Kusura bakma.', 'Usta’ya selam söyle. Hâlâ borcu var bana.'], down: ['Eskiden beraber çay içerdik biz. Hatırlamıyor musun?'] },
  purple: { n: 'GECE', intro: ['Seni gören olmadı. Beni de görmezler.', 'Geri dönmeyecektin 34.'], down: ['Kara seni o gece bilerek bekledi. Bölgeyi istiyordu.'] },
  boss: { n: 'KARA', intro: ['34. Mezardan mı çıktın?'], down: [] },
};

let Q = [], showT = 0, R = null;
export function radioReset() {
  Q = []; showT = 0; R = { story: false, met: {} };
  const r = $('radio'); if (r.classList.contains('talk')) { r.hidden = true; r.classList.remove('talk'); }
  document.documentElement.style.setProperty('--radB', '0px');
}
export function radioSay(who, txt) { if (!G.tut && Q.length < 2) Q.push([who, txt]); }
function show(who, txt) {
  const r = $('radio');
  r.classList.add('talk'); r.classList.remove('done'); r.classList.toggle('inner', who === '34');
  $('radioWho').textContent = who; $('radioTxt').textContent = who === '34' ? txt : '“' + txt + '”';
  r.hidden = false; placeRadio(); showT = Math.min(6.5, 2.6 + txt.length * .045);
}
export function rivalDownLine(r) {
  const L = RIVAL[r.p.id]; if (!L || !L.down.length || G.S.boss || R.met[r.p.id + 'd']) return;
  R.met[r.p.id + 'd'] = 1; if (G.S.clues >= 2 || r.p.id === 'red') radioSay(L.n, L.down[0]);
}
export function storyTick(dt) {
  if (!R || G.state !== 'play') return;
  if (showT > 0) { showT -= dt; if (showT <= 0) { const r = $('radio'); r.hidden = true; r.classList.remove('talk'); document.documentElement.style.setProperty('--radB', '0px'); showT = -1.2; } }
  else if (showT < 0) showT = Math.min(0, showT + dt);
  else if (Q.length) { const [w, t] = Q.shift(); show(w, t); }
  const pz = G.pos + playerZ;
  // a rival close by: one line per delivery each; the very first meeting uses the first line
  for (const rv of G.rivals) {
    const L = RIVAL[rv.p.id];
    if (!L || R.met[rv.p.id] || rv.down > 0 || Math.abs(rv.z - pz) > 700) continue;
    R.met[rv.p.id] = 1;
    const first = !G.S.met[rv.p.id]; if (first) G.S.met[rv.p.id] = 1;
    if (first || rv.boss || Math.random() < .35) radioSay(L.n, L.intro[first ? 0 : Math.floor(Math.random() * L.intro.length)]);
  }
  // one story line per delivery, a third of the way in; lines advance in order and loop within the current chapter
  if (!R.story && G.shift && !G.shift.boss && pz > G.finishZ * .33) {
    R.story = true;
    const ch = STORY[G.S.boss ? 6 : Math.min(5, G.S.clues)], l = ch[G.S.sl % ch.length]; G.S.sl++;
    radioSay(l[0], l[1]);
  }
}
