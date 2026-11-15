import { applyVol, audioInit, audioTick, setMuted, sfx, vol } from './audio.js';
import { $, STEP } from './config.js';
import { G } from './g.js';
import { demoTrack, newShift, update } from './game.js';
import { QUAL, render, resize } from './render.js';
import { L, initI18n } from './i18n.js';
import { owedClues, showCase, showClue } from './meta.js';
import { load, resetProgress, save } from './save.js';
import { initSprites } from './sprites.js';
import { showStory } from './story.js';
import { startTutorial } from './tutorial.js';
import { cashOut, goMenu, hudTick, keepAwake, quitShift, showGarage, showScreen, togglePause, updateMenu } from './ui.js';

// First start: story, then the tutorial for new players; returning players go straight to a shift.
function startFlow(){
  const fresh=!G.S.tut&&G.S.shifts===0&&G.S.pd===0;
  const go=()=>fresh?startTutorial():newShift();
  if(G.S.story)go();
  else showStory(()=>{G.S.story=1;save();go();},fresh?'İLK GÜNE BAŞLA':'VARDİYAYA BAŞLA');
}
$('startBtn').addEventListener('click',()=>{audioInit();keepAwake();startFlow();});
$('tutBtn').addEventListener('click',()=>{audioInit();keepAwake();startTutorial();});
$('storyBtn').addEventListener('click',()=>{audioInit();showStory(goMenu,'MENÜYE DÖN');});
$('garageBtn').addEventListener('click',()=>{audioInit();showGarage();});
$('caseBtn').addEventListener('click',()=>{audioInit();showCase();});
$('gBack').addEventListener('click',goMenu);
$('abandonBtn').addEventListener('click',()=>{if(G.shift&&G.shift.earned>0&&!G.shift.boss)cashOut();else goMenu();});
$('resumeBtn').addEventListener('click',()=>{audioInit();togglePause(false);});
$('quitBtn').addEventListener('click',quitShift);
$('pauseBtn').addEventListener('click',()=>togglePause(true));
$('muteBtn').addEventListener('click',()=>{setMuted(!G.muted);$('muteBtn').textContent=G.muted?'SESSİZ':'SES';});
// Audio needs a user gesture (iOS); the first tap or key anywhere starts it, so the menu music can play.
for(const ev of ['pointerdown','keydown'])addEventListener(ev,()=>audioInit(),true);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&!b.closest('.controls'))sfx('click');},true);

/* ---------- sound settings ---------- */
let setFrom='menu';
function openSettings(from){
  setFrom=from;const v=vol();
  for(const k of ['music','sfx','amb']){const r=$('v-'+k);r.value=Math.round(v[k]*100);$('v-'+k+'-n').textContent=r.value;}
  $('s-joy').value=Math.round((G.S.joy||1)*100);$('s-joy-n').textContent=$('s-joy').value;$('s-left').checked=!!G.S.left;$('s-fps').checked=!!G.S.fps;$('s-lang').value=G.S.lang||'tr';$('s-lang').disabled=from==='pause';
  showScreen('settings');
}
const applyHand=()=>document.body.classList.toggle('lefty',!!G.S.left);
$('s-joy').addEventListener('input',e=>{G.S.joy=e.target.value/100;$('s-joy-n').textContent=e.target.value;});
$('s-lang').addEventListener('change',e=>{G.S.lang=e.target.value;save();location.reload();});
$('s-left').addEventListener('change',e=>{G.S.left=e.target.checked?1:0;applyHand();});
$('s-fps').addEventListener('change',e=>{G.S.fps=e.target.checked?1:0;$('fps').hidden=!G.S.fps;});
for(const k of ['music','sfx','amb'])$('v-'+k).addEventListener('input',e=>{vol()[k]=e.target.value/100;$('v-'+k+'-n').textContent=e.target.value;applyVol();});
$('v-sfx').addEventListener('change',()=>sfx('cash'));
$('sndBtn').addEventListener('click',()=>{audioInit();openSettings('menu');});
$('pSndBtn').addEventListener('click',()=>openSettings('pause'));
$('setBack').addEventListener('click',()=>{rArm=-1e9;$('resetBtn').textContent=L('İLERLEMEYİ SIFIRLA');save();showScreen(setFrom);});
// two taps: the first arms the button for 4 s, the second wipes progress (no browser dialogs, they freeze the game on some phones)
let rArm=-1e9;
$('resetBtn').addEventListener('click',()=>{
  if(performance.now()-rArm<4000){resetProgress();return;}
  rArm=performance.now();$('resetBtn').textContent=L('EMİN MİSİN? TÜM İLERLEME SİLİNECEK, TEKRAR BAS');
  setTimeout(()=>{if(performance.now()-rArm>=3900)$('resetBtn').textContent=L('İLERLEMEYİ SIFIRLA');},4000);
});

load();initI18n();applyHand();$('fps').hidden=!G.S.fps;resize();initSprites();demoTrack();updateMenu();showScreen('menu');
{const owed=owedClues();if(owed.length){updateMenu();showClue(owed[owed.length-1],[{t:'DEVAM',cls:'cta',fn:goMenu}]);}}
G.last=performance.now();G.acc=0;
// performance readout (Settings): frames per second, draw time, worst frame of the last half second, auto quality level
const FP={n:0,t:0,draw:0,worst:0};
function fpsTick(dt,draw){
  FP.n++;FP.t+=dt;FP.draw+=draw;FP.worst=Math.max(FP.worst,dt);
  if(FP.t<.5)return;
  $('fps').textContent=Math.round(FP.n/FP.t)+' FPS · draw '+(FP.draw/FP.n).toFixed(1)+' ms · max '+Math.round(FP.worst*1000)+' ms · Q'+(G.qi+1)+'/'+QUAL.length;
  FP.n=0;FP.t=0;FP.draw=0;FP.worst=0;
}
export function frame(now){
  let dt=Math.min(.1,(now-G.last)/1000);G.last=now;
  // snap to the display refresh period, so fixed 60 Hz steps don't beat against timer jitter (0 or 2 updates in a frame)
  for(const r of[1/60,1/120,1/90,1/30])if(Math.abs(dt-r)<.0025){dt=r;break;}
  if(G.state==='play'&&!G.paused){G.perfN++;G.perfT+=dt;if(G.perfN>=120){if(G.perfT/G.perfN>.022&&G.qi<QUAL.length-1){G.qi++;resize();}G.perfN=0;G.perfT=0;}}
  if(G.hitStop>0)G.hitStop-=dt;   // brief freeze on impacts
  else if(!G.paused){G.acc+=dt;let k=0;while(G.acc>=STEP&&k<8){update(STEP);G.acc-=STEP;k++;}if(k>=8)G.acc=0;}
  const r0=performance.now();render();if(G.S.fps)fpsTick(dt,performance.now()-r0);hudTick();audioTick();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
