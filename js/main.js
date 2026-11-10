import { audioInit, audioTick } from './audio.js';
import { $, STEP } from './config.js';
import { G } from './g.js';
import { demoTrack, newShift, update } from './game.js';
import { QUAL, render, resize } from './render.js';
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
$('gBack').addEventListener('click',goMenu);
$('abandonBtn').addEventListener('click',goMenu);
$('resumeBtn').addEventListener('click',()=>{audioInit();togglePause(false);});
$('quitBtn').addEventListener('click',()=>{save();goMenu();});
$('pauseBtn').addEventListener('click',()=>togglePause(true));
$('muteBtn').addEventListener('click',()=>{G.muted=!G.muted;$('muteBtn').textContent=G.muted?'SESSİZ':'SES';});

load();resize();initSprites();demoTrack();updateMenu();showScreen('menu');
G.last=performance.now();G.acc=0;
export function frame(now){
  const dt=Math.min(.1,(now-G.last)/1000);G.last=now;
  if(G.state==='play'&&!G.paused){G.perfN++;G.perfT+=dt;if(G.perfN>=120){if(G.perfT/G.perfN>.022&&G.qi<QUAL.length-1){G.qi++;resize();}G.perfN=0;G.perfT=0;}}
  if(!G.paused){G.acc+=dt;let k=0;while(G.acc>=STEP&&k<8){update(STEP);G.acc-=STEP;k++;}if(k>=8)G.acc=0;}
  render();hudTick();audioTick();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
