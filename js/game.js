import { audioInit, sfx } from './audio.js';
import { $, BIKES, BRK, CARDS, CENT, DEC, DISTRICTS, EVENTS, M_PER_SEG, OFFDEC, OFFLIM, PW, RESTS, clamp, el, fmt, lerp, maxSpeed, pdesc, pick, playerZ, prof, segL } from './config.js';
import { G } from './g.js';
import { clearInput, input } from './input.js';
import { layoutMirrors } from './render.js';
import { spawnRivals, updateRival } from './rivals.js';
import { payLabel, payMult, ratingLabel } from './rating.js';
import { curBike, curWpn, stats, ups } from './save.js';
import { SPR, bikeSprites, setTheme } from './sprites.js';
import { buildTrack, closureAt, findSeg } from './track.js';
import { spawnAmb, spawnCars, updateCars } from './traffic.js';
import { tutTick } from './tutorial.js';
import { finish, keepAwake, showScreen, toast } from './ui.js';

/* ---------- state ---------- */
G.W=400;G.H=300;G.K=200;G.HZ=140;G.skyGrad=null;G.sunGrad=null;
G.route=null;G.state='menu';G.paused=false;G.shift=null;G.ST=stats(BIKES[0],[0,0,0,0]);G.PSPR=null;
G.pos=0;G.playerX=0;G.speed=0;G.lean=0;G.crashT=0;G.crashSide=1;G.inv=0;G.kickT=0;G.kickSide=1;G.shakeT=0;G.flashT=0;
G.slipT=0;G.slipDir=1;G.bumpT=0;G.ambT=99;G.brakeK=0;G.nitroN=0;G.nitroT=0;G.arriveT=0;G.hitT=0;G.graceT=0;
G.timeLeft=0;G.cond=100;G.bonus=0;G.clock=0;G.countT=0;G.lastCount=0;G.playerY=0;G.farOff=0;G.nearOff=0;G.offroad=false;
G.cars=[];G.rivals=[];
export const card=id=>G.shift?G.shift.cards[id]||0:0;
export const rain=()=>G.route&&G.route.ev==='yagmur'&&G.state!=='menu';

/* ---------- shift flow ---------- */
export function newShift(){G.shift={L:G.S.shifts,i:0,cards:{},earned:0};prepDelivery();}
export const unlocked=()=>Math.min(DISTRICTS.length,2+G.S.shifts);
export const KINDS=[{k:'YAKIN',len:.75,pay:.75},{k:'NORMAL',len:1,pay:1},{k:'UZAK',len:1.35,pay:1.5}];
export function makeOffer(kind){
  const L=G.shift.L,i=G.shift.i,d=L*3+i,D=DISTRICTS[Math.floor(Math.random()*unlocked())],loop=Math.floor(L/DISTRICTS.length);
  const len=Math.round(Math.min(2400,(600+d*90)*kind.len)),ref=Math.min(.75,.30+d*.012);
  const time=Math.round((len/(60*ref)+10)*D.tmul+8*card('kisayol'));
  const chance=[L>=2?.2:0,.4,.7][i];
  const ev=Math.random()<chance?pick(Math.random,Object.keys(EVENTS)):null;
  const pool=D.pool.slice(),a=pool.splice(Math.floor(Math.random()*pool.length),1)[0],b=pick(Math.random,pool);
  return{D,kind:kind.k,rest:pick(Math.random,RESTS),from:a,to:b,A:prof(a),B:prof(b),len,time,curv:D.curv*(1+loop*.15),hill:D.hill,up:D.up,
    pay:Math.round((40+d*18)*kind.pay*(ev?1.2:1)*(1+.25*card('bahsis'))*payMult()),d,ev,seed:(Math.random()*1e9)|0};
}
export function prepDelivery(){
  const offers=KINDS.map(makeOffer);
  $('bEyebrow').textContent='VARDİYA #'+(G.shift.L+1)+' · TESLİMAT '+(G.shift.i+1)+'/3 · '+curBike().n+' · PUAN '+ratingLabel()+(payLabel()?' · '+payLabel():'');
  const box=$('offers');box.textContent='';
  for(const o of offers){
    const b=el('button','order');b.type='button';
    const top=el('div','otop');top.append(el('b',null,o.rest),el('span','opay',fmt(o.pay)));
    const chips=el('div','chips');chips.append(el('span','chip',o.kind));
    if(o.ev)chips.append(el('span','chip ev',EVENTS[o.ev].t));
    chips.append(el('span','chip',pdesc(o.A)+' → '+pdesc(o.B)));
    b.append(top,el('div','oroute',o.from+' → '+o.to),el('div','ometa',o.D.name+' · '+(o.len*M_PER_SEG/1000).toFixed(1)+' km · '+o.time+' sn'),chips);
    if(o.ev)b.append(el('div','oev',EVENTS[o.ev].d));
    b.append(el('span','oacc','KABUL ET'));
    b.addEventListener('click',()=>{audioInit();keepAwake();G.route=o;startMission();});
    box.append(b);
  }
  const ids=Object.keys(G.shift.cards).filter(k=>G.shift.cards[k]>0);
  $('bCardsWrap').hidden=!ids.length;
  const ch=$('bCards');ch.textContent='';
  for(const id of ids){const c=CARDS.find(x=>x.id===id);ch.append(el('span','chip',c.t+(G.shift.cards[id]>1?' ×'+G.shift.cards[id]:'')));}
  showScreen('brief');$('brief').scrollTop=0;
}
export function startMission(){
  const b=curBike();
  setTheme(G.route.D);
  buildTrack(G.route,G.route.seed);
  G.ST=stats(b,ups(b.id),G.shift.cards);G.PSPR=bikeSprites(b,G.S.wpn);
  G.slipT=0;G.bumpT=0;G.graceT=0;G.ambT=15+Math.random()*20;G.pos=0;G.playerX=0;G.speed=0;G.lean=0;G.crashT=0;G.inv=0;G.kickT=0;G.cond=100;G.hits=0;G.bonus=0;G.timeLeft=G.route.time;G.flashT=0;G.shakeT=0;
  G.playerX=(G.route.side0||1)*.72;G.nitroN=ups(b.id)[4]||0;G.nitroT=0;G.arriveT=0;
  spawnCars();spawnRivals();
  clearInput();G.paused=false;
  G.state='count';G.countT=1.2;G.lastCount=0;
  showScreen(null);
  $('hud').hidden=false;$('controls').hidden=false;$('keyhint').hidden=false;
  layoutMirrors();
  const nb=$('nitroBtn');nb.hidden=!G.nitroN;nb.textContent='NİTRO ×'+G.nitroN;nb.classList.remove('used');
  const r=$('route');r.textContent=(G.shift.i+1)+'/3 · '+G.route.from+' → '+G.route.to;
  if(G.route.ev){r.append(' · ');r.append(el('em',null,EVENTS[G.route.ev].t));}
}
export function demoTrack(){
  const D=DISTRICTS[unlocked()-1];setTheme(D);
  G.route={D,A:prof(D.pool[0]),B:prof(D.pool[1]),from:'',to:'',len:1200,time:0,curv:D.curv,hill:D.hill,up:D.up,pay:0,d:0,ev:null,seed:13};
  G.ST=stats(curBike(),ups(G.S.cur));
  buildTrack(G.route,G.route.seed);G.pos=0;spawnCars();G.rivals=[];G.PSPR=bikeSprites(curBike(),G.S.wpn);
}

/* ---------- update ---------- */
export function damage(a,msg){
  if(G.graceT>0)return;G.graceT=.8;
  const n=Math.max(1,Math.round(a*G.ST.dmg));
  G.cond=Math.max(G.tut?30:0,G.cond-n);G.hits++;G.flashT=.25;G.shakeT=.25;sfx('hit');
  toast(msg+'  −'+n+'% paket');
  if(G.cond<=0){
    if(card('sigorta')>0){G.shift.cards.sigorta--;G.cond=30;toast('Sigorta devrede: paket %30');}
    else finish(false,'pkg');
  }
}
export function crash(msg,dmg){
  if(G.inv>0||G.crashT>0)return;
  G.crashT=G.ST.crashT;G.crashSide=Math.sign(G.playerX)||1;G.speed*=.3;sfx('crash');
  damage(dmg,msg);
}
export function hitHazard(h){
  const rel=G.speed/Math.max(1,G.ST.top*maxSpeed);
  if(h.t==='bump'){sfx('bump');G.bumpT=.35;G.speed*=.85;if(rel>.8)damage(5,'Tümseğe hızlı girdin');else G.shakeT=.12;}
  else if(h.t==='pot'){sfx('pot');G.bumpT=.3;G.speed*=.72;damage(5,'Çukura girdin');}
  else if(h.t==='junk'){sfx('junk');G.bumpT=.3;G.speed*=.6;damage(6,'Yola düşen eşyaya çarptın');}
  else{G.slipT=rain()?1.3:.9;G.slipDir=Math.random()<.5?-1:1;toast('Yağa bastın!');sfx('oil');}
}
export function doNitro(){
  if(G.state!=='play'||G.nitroN<=0||G.nitroT>0||G.crashT>0)return;
  G.nitroN--;G.nitroT=2.5;sfx('nitro');toast('NİTRO!');
  const nb=$('nitroBtn');nb.textContent='NİTRO ×'+G.nitroN;if(!G.nitroN)nb.classList.add('used');
}
export function doKick(){
  if(G.state!=='play'||G.crashT>0||G.kickT>0)return;
  const wp=curWpn(),pz=G.pos+playerZ;let best=null,bd=1e9;
  for(const r of G.rivals){if(r.down>0)continue;const s=Math.abs(r.z-pz)+Math.abs(r.x-G.playerX)*400;if(s<bd){bd=s;best=r;}}
  G.kickSide=best&&Math.abs(best.z-pz)<600?(Math.sign(best.x-G.playerX)||1):((input.left||input.steer<-.2)?-1:(input.right||input.steer>.2)?1:G.kickSide);
  G.kickT=wp.id==='kick'?.35:.45;G.hitT=.15;sfx('swing',{w:wp.id,pan:G.kickSide*.4});
}
export function tryHit(){
  const wp=curWpn(),g=card('eldiven')>0,zb=wp.zb*(g?1.3:1),za=wp.za*(g?1.3:1),lmax=wp.lmax*(g?1.2:1),pz=G.pos+playerZ;
  for(const r of G.rivals){
    if(r.down>0)continue;const gz=r.z-pz,dx=r.x-G.playerX;
    if(gz>=-zb&&gz<=za&&Math.abs(dx)>=.1&&Math.abs(dx)<=lmax&&Math.sign(dx)===G.kickSide){G.hitT=0;landHit(r,wp,g);return;}
  }
}
export function landHit(best,wp,g){
  {
    best.hp-=wp.pow;best.wind=0;G.shakeT=.15;sfx('impact',{w:wp.id,pan:clamp((best.x-G.playerX)*1.5,-1,1)});
    if(best.hp<=0){
      sfx('down',{pan:clamp((best.x-G.playerX)*1.5,-1,1)});best.down=best.p.id==='orange'?3:5;best.speed*=.5;best.fall=0;best.kick=0;
      const add=Math.round((15+best.p.hp*10)*(g?2:1));G.bonus+=add;toast(best.p.n+' kurye yerde!  +'+add+' TL');
    }else{best.speed*=.8;best.x=clamp(best.x+G.kickSide*.2,-.95,.95);best.cool=Math.max(best.cool,1.2);toast(best.p.n+' kurye sendeledi');}
  }
}
export function bgScroll(seg,dz){G.farOff+=.0015*seg.curve*dz/segL;G.nearOff+=.003*seg.curve*dz/segL;}

export function update(dt){
  G.clock+=dt;
  const pSeg=findSeg(G.pos+playerZ),startPos=G.pos;
  G.flashT=Math.max(0,G.flashT-dt);G.shakeT=Math.max(0,G.shakeT-dt);
  if(G.state==='menu'){
    G.speed=maxSpeed*.32;G.pos+=G.speed*dt;G.playerX=lerp(G.playerX,0,dt*2);G.lean=lerp(G.lean,0,dt*4);G.kickT=0;G.offroad=false;
    if(G.pos+playerZ>G.finishZ-segL*30)G.pos=0;
    updateCars(dt);bgScroll(pSeg,G.pos-startPos);return;
  }
  if(G.state==='count'){
    if(G.lastCount===0){G.lastCount=1;toast(G.route.rest+' · paket alındı',1400);sfx('beep');}
    G.countT-=dt;if(G.countT<=0){G.state='play';sfx('go');}
    return;
  }
  if(G.state==='arrive'){
    const sd=G.route.side||1,rem=G.finishZ-(G.pos+playerZ);
    G.speed=Math.max(0,Math.min(G.speed,rem*2.5));G.pos+=G.speed*dt;
    G.playerX=lerp(G.playerX,sd*1.02,Math.min(1,dt*2.5));G.lean=lerp(G.lean,sd*.15,Math.min(1,dt*4));
    updateCars(dt);G.arriveT-=dt;if(G.arriveT<=0||rem<40)finish(true);
    return;
  }
  if(G.state!=='play')return;
  const sp=G.speed/maxSpeed,top=Math.min(maxSpeed,G.ST.top*maxSpeed*(G.nitroT>0?1.25:1)),acc=top/G.ST.accT*(G.nitroT>0?2:1);
  G.nitroT=Math.max(0,G.nitroT-dt);
  G.pos+=G.speed*dt;
  if(G.crashT>0){
    G.crashT-=dt;G.speed=Math.max(0,G.speed+BRK*2*dt);G.lean=lerp(G.lean,G.crashSide*1.3,dt*8);
    if(G.crashT<=0){G.playerX=clamp(G.playerX,-.75,.75);G.lean=0;G.inv=1.2;const k=closureAt(G.pos+playerZ);if(k){if(k.lane===2)G.playerX=Math.min(G.playerX,.2);else G.playerX=Math.max(G.playerX,-.2);}}
  }else if(G.slipT>0){
    G.slipT-=dt;G.playerX+=G.slipDir*dt*1.1*Math.max(.35,sp);G.lean=Math.sin(G.clock*20)*.22;
  }else{
    const sr=dt*2.4*Math.max(.35,sp)*G.ST.steer,st=clamp((input.steer||0)+(input.right?1:0)-(input.left?1:0),-1,1);
    G.playerX+=sr*st;
    G.lean=lerp(G.lean,st*.22,Math.min(1,dt*8));
    if(!input.brake)G.brakeK=0;
    if(input.brake){G.brakeK=Math.min(1,G.brakeK+dt*3);G.speed-=maxSpeed*(.12+.33*G.brakeK)*dt;}
    else if(G.speed<top)G.speed=Math.min(top,G.speed+acc*dt*(1.35-.85*G.speed/top));
    else G.speed=Math.max(top,G.speed+DEC*.5*dt);
  }
  G.playerX-=dt*2.2*sp*sp*pSeg.curve*CENT*G.ST.cent*(rain()?1.35:1);
  const slope=(pSeg.p2.wy-pSeg.p1.wy)/segL;
  G.speed-=slope*G.ST.top*maxSpeed*.22*dt;
  G.offroad=Math.abs(G.playerX)>1;
  if(G.offroad){
    if(G.speed>OFFLIM)G.speed+=OFFDEC*dt;
    if(Math.abs(G.playerX)>1.22)crash('Duvara çarptın',14);
    else{
      const next=G.segs[(pSeg.index+1)%G.segs.length];
      for(const s of pSeg.sprites.concat(next.sprites))if(s.spr.solid&&Math.abs(G.playerX-s.off)<s.spr.hit+PW/2){crash(s.spr.msg,s.spr===SPR.cart?16:14);break;}
    }
  }
  if(G.crashT<=0&&G.state==='play'&&pSeg.cl!=null){const cl=pSeg.cl;if((cl===2&&G.playerX>.36)||(cl===0&&G.playerX<-.36))crash(pSeg.clk==='park'?'Park etmiş arabaya çarptın':'Yol çalışmasına daldın',14);}
  if(G.crashT<=0&&G.state==='play'){const h=pSeg.hz;if(h&&!h.hit&&Math.abs(G.playerX-h.x)<h.w/2+PW/2){h.hit=true;hitHazard(h);}}
  if(G.crashT<=0&&G.state==='play'){
    const pz=G.pos+playerZ;
    for(const c of G.cars){
      const dz=c.z-pz;
      if(dz>-60&&dz<segL*.6&&G.speed>c.speed&&Math.abs(G.playerX-c.x)<(c.hit+PW)/2){
        const diff=(G.speed-c.speed)/maxSpeed;
        if(G.inv>0)G.speed=c.speed*.9;
        else if(diff>G.ST.top*.45)crash(c.msg,14);
        else{G.speed=c.speed*.85;damage(6,c.msg);}
        G.pos=c.z-playerZ-30;break;
      }
    }
  }
  G.speed=clamp(G.speed,0,maxSpeed);G.playerX=clamp(G.playerX,-1.3,1.3);
  G.inv=Math.max(0,G.inv-dt);G.kickT=Math.max(0,G.kickT-dt);G.graceT=Math.max(0,G.graceT-dt);G.bumpT=Math.max(0,G.bumpT-dt);
  updateCars(dt);if(G.cars.some(c=>c.dead))G.cars=G.cars.filter(c=>!c.dead);
  for(const r of G.rivals)updateRival(r,dt);
  if(G.hitT>0){G.hitT-=dt;tryHit();}
  G.ambT-=dt;if(G.ambT<=0){G.ambT=35+Math.random()*30;if(!G.cars.some(c=>c.amb))spawnAmb();}
  for(const r of G.rivals){
    const g=r.z-(G.pos+playerZ);
    if(r.down<=0&&g>0&&g<160&&Math.abs(r.x-G.playerX)<.2&&G.speed>r.speed){
      G.speed=Math.max(r.speed,G.speed*.98);r.blk+=dt;
      if(r.blk>.8){r.blk=0;r.cutT=0;r.cutCd=8;r.dodge=1;r.dsd=r.x>=G.playerX?1:-1;r.speed=Math.max(r.speed,G.speed);}
    }else r.blk=Math.max(0,r.blk-dt);
  }
  if(G.tut)tutTick(dt);
  if(G.state!=='play')return;
  if(!G.tut)G.timeLeft-=dt;
  if(G.pos+playerZ>=G.finishZ-segL*10){G.state='arrive';G.arriveT=1.6;clearInput();toast('Adrese vardın');sfx('bell');}
  else if(G.timeLeft<=0){G.timeLeft=0;finish(false,'time');}
  bgScroll(pSeg,G.pos-startPos);
}
