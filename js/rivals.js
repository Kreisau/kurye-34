import { sfx } from './audio.js';
import { PW, RIVALS, clamp, lerp, maxSpeed, playerZ, segL } from './config.js';
import { G } from './g.js';
import { buzz, hitStop, sparks } from './fx.js';
import { card, damage, rivalMult } from './game.js';
import { rivalDownLine } from './radio.js';
import { bossEnd } from './meta.js';
import { SPR } from './sprites.js';
import { toast } from './ui.js';

/* ---------- rival couriers ---------- */
// Rivals now live in the same world as the player: they plan around traffic and road works ahead,
// steer with inertia (no teleporting sideways), and crash into cars, closures, roadside objects and walls.
// A kick or a shoulder-check shoves them sideways; if that sends them into something, they go down
// and the player gets a bonus.

// what they crashed into, as Turkish dative ("... çarptı")
const CAR_NAME = { taxiY: 'taksiye', taxiT: 'taksiye', taxiV: 'taksiye', car: 'arabaya', lux: 'cipe', hafif: 'minivana', van: 'minibüse', klasik: 'eski sedana', hurda: 'kamyonete', dolmus: 'dolmuşa', bus: 'otobüse' };

// Count: 2, 3 from delivery 8, +1 for the crowd event, +1 for the Kabadayı card (max 4). They start together behind the line,
// staggered and on alternating sides; each keeps its own side slot so two of them never ride on top of each other.
export function spawnRivals(){
  G.rivals=[];
  const quiet=false,n=Math.min(4,2+((G.route.d||0)>=8?1:0)+(G.route.ev==='rakip2'?1:0));
  const pool=RIVALS.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  for(let i=0;i<n;i++){const r=newRival(pool[i],(quiet?-4200:-1500)-i*1300,i%2?-.55:.55,0,(quiet?7:3)+i*2);r.slot=i%2?-1:1;r.lag=i*220;G.rivals.push(r);}
}
export function newRival(p,z,x,speed,cool){
  return {p,hp:p.hp,z,x,vx:0,speed,down:0,kick:0,wind:0,kside:1,cutT:2.5,cutCd:8,dodge:0,dsd:1,blk:0,cool,fall:0,spr:SPR.rv[p.id],
    stun:0,shoved:0,av:0,avT:0,hzLast:-1,contactCd:0};
}

const segAt=z=>G.segs[Math.floor(Math.max(0,z)/segL)%G.segs.length];
// a closed lane (road works or a parked car) at track position z covering lateral x
function closedAt(x,z){
  const s=segAt(z);if(!s||s.cl==null)return null;
  if((s.cl===2&&x>.36)||(s.cl===0&&x<-.36))return s.clk==='park'?'park etmiş arabaya':'yol çalışmasına';
  return null;
}
// how bad it is to ride along lateral x for the next `look` units
function laneRisk(r,x,look){
  let risk=0;
  for(const c of G.cars){
    const dz=c.z-r.z;if(dz<-60||dz>look)continue;
    if(Math.abs(c.x-x)<(c.hit+PW)/2+.1&&c.speed<r.speed*.98)risk+=1+3*(1-dz/look);
  }
  for(let d=0;d<look;d+=segL){if(closedAt(x,r.z+d)){risk+=2+4*(1-d/look);break;}}
  if(Math.abs(x)>.9)risk+=2;
  return risk;
}

function crashRival(r,what){
  if(r.down>0)return;
  const pz=G.pos+playerZ,near=Math.abs(r.z-pz)<3500,pan=clamp((r.x-G.playerX)*1.5,-1,1);
  r.down=4;r.fall=0;r.speed*=.35;r.vx*=.3;r.wind=0;r.kick=0;
  if(near)sfx('crash',{pan});
  if(r.boss){   // the boss gets back up, but every wreck costs him
    r.hp-=3;if(r.shoved>0&&near){sparks(Math.sign(r.x-G.playerX)||1,18);hitStop(.04);}
    toast('Kara '+what+' çarptı!');r.shoved=0;if(r.hp<=0)bossEnd(true);return;
  }
  r.out=true;   // a wrecked rival is out for the rest of this delivery
  if(r.shoved>0){
    G.S.st.kd++;const add=Math.round((15+r.p.hp*10)*2*rivalMult());G.bonus+=add;rivalDownLine(r);
    if(near){sparks(Math.sign(r.x-G.playerX)||1,18);hitStop(.04);buzz(50);}
    toast(r.p.n+' kurye '+what+' çarptı, saf dışı!  +'+add+' TL');
  }else if(near)toast(r.p.n+' kurye '+what+' çarptı, saf dışı');
  r.shoved=0;
}

function collide(r,dt){
  // walls and roadside objects
  if(Math.abs(r.x)>1){
    r.speed=Math.max(0,r.speed-maxSpeed*.6*dt);
    if(Math.abs(r.x)>1.18)return crashRival(r,'duvara');
    const s=segAt(r.z);
    for(const sp of s.sprites)if(sp.spr.solid&&Math.abs(r.x-sp.off)<sp.spr.hit+PW/2)return crashRival(r,'kaldırımdaki engele');
  }
  // closed lanes
  const cl=closedAt(r.x,r.z);if(cl)return crashRival(r,cl);
  // cars
  for(const c of G.cars){
    const dz=c.z-r.z;
    if(dz>-60&&dz<segL*.6&&Math.abs(c.x-r.x)<(c.hit+PW)/2&&r.speed>c.speed){
      const diff=(r.speed-c.speed)/maxSpeed;
      if(diff>.12||r.shoved>0||Math.abs(r.vx)>.5)return crashRival(r,CAR_NAME[c.k]||'arabaya');
      r.speed=c.speed*.85;r.z=c.z-40;return;
    }
  }
  // road hazards: rivals don't plan around these, so sometimes they eat a pothole or an oil patch
  const s=segAt(r.z),h=s&&s.hz;
  if(h&&s.index!==r.hzLast&&h.t!=='bump'&&Math.abs(r.x-h.x)<h.w/2+PW/2){
    r.hzLast=s.index;
    if(h.t==='pot'){r.speed*=.8;r.vx+=(Math.random()<.5?-1:1)*.25;}
    else if(h.t==='junk'){if(r.shoved>0)return crashRival(r,'yoldaki eşyaya');r.speed*=.6;}
    else{r.vx+=(Math.random()<.5?-1:1)*.7;r.stun=Math.max(r.stun,.6);}   // oil
  }
}

const liveNear=(r,d)=>G.rivals.some(o=>o!==r&&!o.dead&&o.down<=0&&Math.abs(o.z-r.z)<d);
export function updateRival(r,dt){
  const pz=G.pos+playerZ;
  r.kick-=dt;r.shoved=Math.max(0,r.shoved-dt);r.contactCd=Math.max(0,r.contactCd-dt);
  if(r.down>0){
    r.down-=dt;r.speed=Math.max(0,r.speed-maxSpeed*1.4*dt);r.z+=r.speed*dt;r.fall=Math.min(1.4,r.fall+dt*5);
    r.vx*=Math.exp(-3*dt);r.x=clamp(r.x+r.vx*dt,-1.2,1.2);
    if(r.down<=0&&r.out){r.dead=true;return;}
    if(r.down<=0){const hp0=r.boss?r.hp:r.p.hp;r.z=G.pos-1500-G.rivals.filter(o=>o!==r&&!o.dead&&o.z<G.pos).length*700;r.x=G.playerX>0?-.55:.55;r.speed=G.speed;r.fall=0;r.cool=2;r.hp=hp0;r.vx=0;r.stun=0;r.shoved=0;}
    return;
  }
  const p=r.p,gap=pz-r.z-(r.lag||0),cap=Math.min(maxSpeed*.98,G.ST.top*maxSpeed*1.15*p.spd);
  const g2=p.id==='purple'?gap-70:gap;
  let want=clamp(G.speed+clamp(g2*.9,-maxSpeed*.3,maxSpeed*.45)+Math.sin(G.clock*.7)*maxSpeed*.04,0,cap);
  if(p.id==='green'&&gap<-60&&gap>-900&&r.cutT>0){r.cutT-=dt;want=Math.min(cap,Math.max(G.speed*.97,G.ST.top*maxSpeed*.55));}
  if(r.cutT<=0){r.cutCd-=dt;if(r.cutCd<=0){r.cutT=2.5;r.cutCd=8;}}

  // where it wants to be relative to the player
  const side=r.slot&&liveNear(r,900)?r.slot:(Math.sign(r.x-G.playerX)||1);
  let tx=clamp(G.playerX+side*(p.id==='purple'?.35:.28),-.85,.85);
  if(gap<-60)tx=clamp(lerp(r.x+side*.3,G.playerX,p.id==='green'&&r.cutT<=0?0:p.cut),-.85,.85);
  if(r.dodge>0){r.dodge-=dt;tx=clamp(r.x+r.dsd*.5,-.85,.85);}

  // look about a second ahead; if that line is unsafe, pick the best lane and commit to it for a moment
  const look=Math.min(4000,700+r.speed);
  let target=tx;
  if(r.avT>0){r.avT-=dt;target=r.av;}
  else if(laneRisk(r,tx,look)>0){
    let best=tx,bs=1e9;
    for(const cx of [tx,-.66,0,.66,clamp(r.x,-.85,.85)]){const sc=laneRisk(r,cx,look)*10+Math.abs(cx-tx)+Math.abs(cx-r.x)*.5;if(sc<bs){bs=sc;best=cx;}}
    if(best!==tx){r.av=best;r.avT=.9;target=best;}
  }
  // brake for whatever is right in front if it can't get around it in time
  for(const c of G.cars){const dz=c.z-r.z;if(dz>0&&dz<500&&Math.abs(c.x-r.x)<(c.hit+PW)/2+.04)want=Math.min(want,c.speed*.95);}
  if(closedAt(r.x,r.z+450))want=Math.min(want,maxSpeed*.18);
  // other rivals: don't drive into the one ahead, steer off a rival right alongside
  for(const o of G.rivals){
    if(o===r||o.dead||o.down>0)continue;
    const dz=o.z-r.z,dx=o.x-r.x;
    if(dz>0&&dz<450&&Math.abs(dx)<.3)want=Math.min(want,o.speed*.97);
    if(Math.abs(dz)<300&&Math.abs(dx)<.32){const away=-(Math.sign(dx)||r.slot||1);target=clamp(r.x+away*.45,-.85,.85);}
  }

  r.speed+=clamp(want-r.speed,-maxSpeed*.5*dt,maxSpeed*.4*dt);
  r.z+=r.speed*dt;

  // lateral motion with inertia; while stunned (kicked, slipping) it just slides
  if(r.stun>0){r.stun-=dt;r.vx*=Math.exp(-2*dt);}
  else{
    const maxV=(r.dodge>0||target!==tx)?1:.6,wv=clamp((target-r.x)*3,-maxV,maxV);
    r.vx+=clamp(wv-r.vx,-3.5*dt,3.5*dt);
  }
  r.x=clamp(r.x+r.vx*dt,-1.3,1.3);
  for(const o of G.rivals){   // never draw two rivals on top of each other
    if(o===r||o.dead||o.down>0)continue;
    const dz=o.z-r.z,dx=o.x-r.x;
    if(Math.abs(dz)<140&&Math.abs(dx)<.2){const away=-(Math.sign(dx)||r.slot||1);r.x=clamp(r.x+away*Math.min(.2-Math.abs(dx),1.6*dt),-1.1,1.1);if(dz>0)r.z=Math.min(r.z,o.z-140);}
  }

  // shoulder-check: steering into a rival alongside shoves it
  const adx=Math.abs(r.x-G.playerX);
  if(Math.abs(r.z-pz)<120&&adx<.17&&r.contactCd<=0&&G.crashT<=0){
    const dir=Math.sign(r.x-G.playerX)||1,push=Math.max(0,(G.pvx||0)*dir);
    if(push>.2){r.vx+=dir*Math.min(1.4,push*1.3);r.stun=.35;r.shoved=2;r.contactCd=.4;G.playerX-=dir*.03;sfx('bump',{pan:dir*.5});}
    else if(adx<.12){r.x=G.playerX+dir*.12;}   // no overlapping sprites
  }

  collide(r,dt);
  if(r.down>0)return;

  r.cool-=dt;
  const inWin=gap>=-60&&gap<=120&&adx>=.1&&adx<=.38;
  if(r.wind>0){
    r.wind-=dt;
    if(r.wind<=0){r.kick=.3;if(inWin&&G.crashT<=0&&G.inv<=0&&(Math.sign(G.playerX-r.x)||1)===r.kside){G.playerX+=r.kside*p.push;G.speed*=.88;damage(p.dmg,p.n+' kurye vurdu');}}
  }else if(G.crashT<=0&&r.cool<=0&&r.stun<=0&&inWin&&Math.random()<dt*1.4*p.aggr){r.wind=.3;r.kside=Math.sign(G.playerX-r.x)||1;r.cool=(1.8+Math.random()*1.5)/p.aggr;}
}
