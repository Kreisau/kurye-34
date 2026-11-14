import { applyVol, audioInit, audioTick, setMuted, sfx, vol } from './audio.js';
import { $, STEP } from './config.js';
import { G } from './g.js';
import { demoTrack, newShift, update } from './game.js';
import { QUAL, render, resize } from './render.js';
import { showCase, startDaily } from './meta.js';
import { load, save } from './save.js';
import { initSprites } from './sprites.js';
import { showStory } from './story.js';
import { startTutorial } from './tutorial.js';
import { goMenu, hudTick, keepAwake, showGarage, showScreen, togglePause, updateMenu } from './ui.js';

// First start: story, then the tutorial for new players; returning players go straight to a shift.
function startFlow(){
  const fresh=!G.S.tut&&G.S.shifts===0;
  const go=()=>fresh?startTutorial():newShift();
  if(G.S.story)go();
  else showStory(()=>{G.S.story=1;save();go();},fresh?'İLK GÜNE BAŞLA':'VARDİYAYA BAŞLA');
}
$('startBtn').addEventListener('click',()=>{audioInit();keepAwake();startFlow();});
$('tutBtn').addEventListener('click',()=>{audioInit();keepAwake();startTutorial();});
$('storyBtn').addEventListener('click',()=>{audioInit();showStory(goMenu,'MENÜYE DÖN');});
$('garageBtn').addEventListener('click',()=>{audioInit();showGarage();});
$('dailyBtn').addEventListener('click',()=>{audioInit();keepAwake();startDaily();});
$('caseBtn').addEventListener('click',()=>{audioInit();showCase();});
$('gBack').addEventListener('click',goMenu);
$('abandonBtn').addEventListener('click',goMenu);
$('resumeBtn').addEventListener('click',()=>{audioInit();togglePause(false);});
$('quitBtn').addEventListener('click',()=>{save();goMenu();});
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
  $('s-joy').value=Math.round((G.S.joy||1)*100);$('s-joy-n').textContent=$('s-joy').value;$('s-left').checked=!!G.S.left;
  showScreen('settings');
}
const applyHand=()=>document.body.classList.toggle('lefty',!!G.S.left);
$('s-joy').addEventListener('input',e=>{G.S.joy=e.target.value/100;$('s-joy-n').textContent=e.target.value;});
$('s-left').addEventListener('change',e=>{G.S.left=e.target.checked?1:0;applyHand();});
for(const k of ['music','sfx','amb'])$('v-'+k).addEventListener('input',e=>{vol()[k]=e.target.value/100;$('v-'+k+'-n').textContent=e.target.value;applyVol();});
$('v-sfx').addEventListener('change',()=>sfx('cash'));
$('sndBtn').addEventListener('click',()=>{audioInit();openSettings('menu');});
$('pSndBtn').addEventListener('click',()=>openSettings('pause'));
$('setBack').addEventListener('click',()=>{save();showScreen(setFrom);});

load();applyHand();resize();initSprites();demoTrack();updateMenu();showScreen('menu');
G.last=performance.now();G.acc=0;
export function frame(now){
  const dt=Math.min(.1,(now-G.last)/1000);G.last=now;
  if(G.state==='play'&&!G.paused){G.perfN++;G.perfT+=dt;if(G.perfN>=120){if(G.perfT/G.perfN>.022&&G.qi<QUAL.length-1){G.qi++;resize();}G.perfN=0;G.perfT=0;}}
  if(G.hitStop>0)G.hitStop-=dt;   // brief freeze on impacts
  else if(!G.paused){G.acc+=dt;let k=0;while(G.acc>=STEP&&k<8){update(STEP);G.acc-=STEP;k++;}if(k>=8)G.acc=0;}
  render();hudTick();audioTick();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
