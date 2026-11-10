import { clamp, maxSpeed, playerZ } from './config.js';
import { G } from './g.js';
import { curBike } from './save.js';

/* ---------- audio ---------- */
G.AC=null;G.oscE=null;G.gE=null;G.muted=false;G.sirO=null;G.sirG=null;G.hoO=null;G.hoG=null;
export function audioInit(){
  if(G.AC){if(G.AC.state==='suspended')G.AC.resume().catch(()=>{});return;}
  try{G.AC=new(window.AudioContext||window.webkitAudioContext)();
    G.oscE=G.AC.createOscillator();G.oscE.type='sawtooth';const f=G.AC.createBiquadFilter();f.type='lowpass';f.frequency.value=700;
    G.gE=G.AC.createGain();G.gE.gain.value=0;G.oscE.connect(f);f.connect(G.gE);G.gE.connect(G.AC.destination);G.oscE.start();
  }catch(e){G.AC=null;}
}
export function audioTick(){
  if(!G.AC)return;const t=G.AC.currentTime,rel=G.speed/Math.max(1,G.ST.top*maxSpeed);
  const on=!G.muted&&!G.paused&&(G.state==='play'||G.state==='count');
  G.oscE.frequency.setTargetAtTime((46+rel*130)*curBike().pitch,t,.06);
  G.gE.gain.setTargetAtTime(on?.035+rel*.045:0,t,.08);
  const amb=G.cars.find(c=>c.amb);
  if(amb&&on){
    if(!G.sirO){G.sirO=G.AC.createOscillator();G.sirO.type='triangle';G.sirG=G.AC.createGain();G.sirG.gain.value=0;G.sirO.connect(G.sirG);G.sirG.connect(G.AC.destination);G.sirO.start();}
    const dz=Math.abs(G.pos+playerZ-amb.z);
    G.sirO.frequency.setTargetAtTime(Math.floor(G.clock/.45)%2?960:700,t,.01);
    G.sirG.gain.setTargetAtTime(clamp(1-dz/7000,0,1)*.06,t,.05);
  }else if(G.sirG)G.sirG.gain.setTargetAtTime(0,t,.05);
  const honk=!!(amb&&on&&amb.honk);
  if(honk&&!G.hoO){G.hoO=G.AC.createOscillator();G.hoO.type='sawtooth';G.hoO.frequency.value=380;const f=G.AC.createBiquadFilter();f.type='lowpass';f.frequency.value=1600;G.hoG=G.AC.createGain();G.hoG.gain.value=0;G.hoO.connect(f);f.connect(G.hoG);G.hoG.connect(G.AC.destination);G.hoO.start();}
  if(G.hoG){const dz=amb?Math.abs(G.pos+playerZ-amb.z):1e9,beat=(G.clock%.55)<.38;G.hoG.gain.setTargetAtTime(honk&&beat?clamp(1-dz/6000,0,1)*.07:0,t,.015);}
}
export function sfx(kind){
  if(!G.AC||G.muted)return;const t=G.AC.currentTime;
  if(kind==='beep'||kind==='go'){const o=G.AC.createOscillator(),g=G.AC.createGain();o.type='square';o.frequency.value=kind==='go'?880:440;g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(G.AC.destination);o.start(t);o.stop(t+.26);return;}
  const len=kind==='hit'?.25:.12,buf=G.AC.createBuffer(1,Math.floor(G.AC.sampleRate*len),G.AC.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  const src=G.AC.createBufferSource(),g=G.AC.createGain(),f=G.AC.createBiquadFilter();
  src.buffer=buf;g.gain.value=kind==='hit'?.35:.12;f.type=kind==='hit'?'lowpass':'highpass';f.frequency.value=kind==='hit'?900:1800;
  src.connect(f);f.connect(g);g.connect(G.AC.destination);src.start(t);
}
