import { $, clamp } from './config.js';
import { G } from './g.js';
import { doKick, doNitro } from './game.js';
import { togglePause } from './ui.js';

export const input={left:false,right:false,brake:false,steer:0};

/* ---------- input ---------- */
export const joy=$('joy'),jb=$('joyBase'),jk=$('joyKnob');G.joyId=null;G.joyX=0;G.joyY=0;
export const btnSets=[];
export function resetJoy(){jb.style.left='';jb.style.top='';jk.style.transform='';jb.classList.add('idle');}
export function clearInput(){input.left=input.right=input.brake=false;input.steer=0;G.joyId=null;resetJoy();for(const b of btnSets){b.ids.clear();b.el.classList.remove('on');}}
// iOS can drop the pointerup of the steering finger (system gestures, edge swipes, multi-touch).
// Before this fix a lost pointerup kept the old steer value AND blocked every new touch on the pad,
// so the bike stayed stuck to one side. Now: a new touch on the pad always takes over, and the
// steer is released from several independent signals.
function joyEnd(){G.joyId=null;resetJoy();input.steer=0;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();G.joyId=e.pointerId;try{joy.setPointerCapture(e.pointerId);}catch(_){}G.joyX=e.clientX;G.joyY=e.clientY;jb.style.left=G.joyX+'px';jb.style.top=G.joyY+'px';jk.style.transform='';jb.classList.remove('idle');input.steer=0;});
joy.addEventListener('pointermove',e=>{if(e.pointerId!==G.joyId)return;const dx=clamp(e.clientX-G.joyX,-50,50),dy=clamp(e.clientY-G.joyY,-50,50);jk.style.transform='translate('+dx+'px,'+(dy*.3)+'px)';input.steer=Math.abs(dx)<6?0:clamp((dx-Math.sign(dx)*6)/44,-1,1);});
for(const t of['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(t,e=>{if(e.pointerId===G.joyId)joyEnd();});
// same events at window level, in case they are delivered to another element
for(const t of['pointerup','pointercancel'])addEventListener(t,e=>{if(e.pointerId===G.joyId)joyEnd();},true);
// touch-level fallback: no finger left on the left side -> release steering; no finger at all -> release everything
function touchEnd(e){
  if(G.joyId!==null&&![...e.touches].some(t=>t.clientX<innerWidth*.55))joyEnd();
  if(e.touches.length===0){for(const b of btnSets){b.ids.clear();b.el.classList.remove('on');}input.brake=false;}
}
addEventListener('touchend',touchEnd,true);addEventListener('touchcancel',touchEnd,true);
document.querySelectorAll('[data-k]').forEach(b=>{
  const k=b.dataset.k,ids=new Set();btnSets.push({el:b,ids});
  const upd=()=>{const v=ids.size>0;b.classList.toggle('on',v);if(k==='brake')input.brake=v;};
  b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}ids.add(e.pointerId);if(k==='kick')doKick();if(k==='nitro')doNitro();upd();});
  for(const t of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,e=>{ids.delete(e.pointerId);upd();});
});
export const KEYS={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'brake',KeyS:'brake'};
addEventListener('keydown',e=>{
  if(KEYS[e.code]){input[KEYS[e.code]]=true;e.preventDefault();}
  else if(e.code==='Space'||e.code==='KeyK'){if(G.state==='play'){e.preventDefault();if(!e.repeat)doKick();}}
  else if(e.code==='KeyN'||e.code==='ShiftLeft'){if(G.state==='play'){e.preventDefault();doNitro();}}
  else if(e.code==='KeyP'||e.code==='Escape')togglePause();
});
addEventListener('keyup',e=>{if(KEYS[e.code])input[KEYS[e.code]]=false;});
addEventListener('blur',()=>clearInput());
document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('dblclick',e=>e.preventDefault());
