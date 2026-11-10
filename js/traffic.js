import { CARTYPES, LANES, PW, clamp, drawDist, maxSpeed, pick, playerZ, segL } from './config.js';
import { G } from './g.js';
import { card, damage } from './game.js';
import { SPR } from './sprites.js';
import { toast } from './ui.js';

export const nearLane=x=>x<-.33?0:x>.33?2:1;
export function laneFree(lx,c,gap){gap=gap||700;const ln=nearLane(lx);if(G.closures.some(k=>k.lane===ln&&c.z>k.z0-1400&&c.z<k.z1))return false;for(const o of G.cars){if(o===c)continue;if((Math.abs(o.x-lx)<.45||Math.abs(o.tl-lx)<.1)&&Math.abs(o.z-c.z)<gap)return false;}return true;}
export function respawn(c,initial){
  const zq=G.pos+playerZ+drawDist*segL*(initial?.45:.65),sq=G.segs[Math.floor(zq/segL)],pf=(sq&&sq.pf)||G.route.A;
  const ws=CARTYPES.map(t=>t.w*((pf&&pf.mix[t.cat])||1)),tot=ws.reduce((a,b)=>a+b,0);
  let r=Math.random()*tot,t=CARTYPES[0];
  for(let i=0;i<CARTYPES.length;i++){r-=ws[i];if(r<0){t=CARTYPES[i];break;}}
  const sp0=SPR[t.k==='car'?'cars':t.k],spr=Array.isArray(sp0)?pick(Math.random,sp0):sp0;
  c.spr=spr;c.hit=spr.ww*.88/G.roadW;c.msg=t.msg;c.k=t.k;c.cat=t.cat;c.wild=Math.random()<(t.wild||0);c.bus=t.k==='bus';c.st='drive';c.cool=0;c.done=-1;c.sig=0;c.sigT=0;c.ht=6+Math.random()*8;c.drop=4+Math.random()*4;c.amb=false;c.dead=false;c.brk=false;
  const d=G.route&&G.route.d?G.route.d:0;
  c.base=G.ST.top*maxSpeed*(t.sp[0]+Math.random()*(t.sp[1]-t.sp[0]))/.6*(.8+Math.min(.15,d*.02));c.speed=c.base;
  const pz=G.pos+playerZ;
  for(let k=0;k<8;k++){
    const lane=(c.bus||t.k==='dolmus')&&Math.random()<.75?LANES[2]:pick(Math.random,LANES);
    c.x=lane;c.tl=lane;c.lt=1+Math.random()*3;
    c.z=initial?pz+600+Math.random()*drawDist*segL*.9:pz+drawDist*segL*(.5+Math.random()*.3);
    if(laneFree(lane,c,900))break;
  }
}
export function spawnCars(){G.cars=[];const d=G.route.d||0;const n=Math.round((10+Math.min(10,d))*(G.route.D?G.route.D.traf:1)*(G.route.ev==='trafik'?1.6:1));for(let i=0;i<n;i++){const c={};respawn(c,true);G.cars.push(c);}}
export function spawnAmb(){
  const lane=LANES[1];
  G.cars.push({spr:SPR.amb,hit:SPR.amb.ww*.88/G.roadW,msg:'Ambulansa çarptın',k:'amb',amb:true,wild:true,bus:false,st:'drive',cool:0,done:-1,sig:0,sigT:0,
    base:Math.min(maxSpeed*.98,G.ST.top*maxSpeed*1.3+maxSpeed*.05),speed:G.ST.top*maxSpeed,x:lane,tl:lane,lt:99,z:G.pos+playerZ-4600,blockT:0,fined:false,passed:false,dead:false,brk:false});
}
export function wantLane(c,lx){
  if(c.wild){c.tl=lx;return;}
  if(c.sigT>0)return;
  c.pend=lx;c.sigT=.9;c.sig=Math.sign(lx-c.x)||1;
}
export function busWant(c,dt,want){
  if(c.st==='drive'){const s=G.stopsZ.find(z=>z>c.z+250);if(s!==undefined&&s!==c.done&&s-c.z<2400){c.st='pull';c.sz=s;c.tl=.9;}return want;}
  if(c.st==='pull'){const rem=c.sz-c.z;if(rem<60){c.st='stop';c.wait=2.5+Math.random()*2;return 0;}return Math.min(want,Math.max(250,rem*1.3));}
  if(c.st==='stop'){c.wait-=dt;const busy=G.cars.some(o=>o!==c&&Math.abs(o.x-LANES[2])<.3&&o.z>c.z-300&&o.z<c.z+600);
    if(c.wait<=0&&(!busy||c.wait<-3)){c.st='merge';c.tl=LANES[2];c.done=c.sz;}return 0;}
  if(Math.abs(c.x-LANES[2])<.04)c.st='drive';
  return want*.6;
}
export function updateCars(dt){
  const pz=G.pos+playerZ,calm=card('taksici')>0;
  const amb=G.cars.find(o=>o.amb);
  for(const c of G.cars){
    let lead=null,lg=1e9;
    for(const o of G.cars){if(o===c)continue;const g=o.z-c.z;if(g>0&&g<lg&&Math.abs(o.x-c.x)<(o.hit+c.hit)/2+.03){lg=g;lead=o;}}
    const pg=pz-c.z;
    if(G.state==='play'&&pg>0&&pg<lg&&Math.abs(G.playerX-c.x)<(c.hit+PW)/2+.03){lg=pg;lead={speed:G.speed,z:pz,p:true};}
    for(const k of G.closures){const g=k.z0-c.z;if(k.lane===nearLane(c.x)&&g>0&&g<lg&&g<1600){lg=g;lead={speed:0,z:k.z0};}}
    for(const r of G.rivals){const g=r.z-c.z;if(g>0&&g<lg&&Math.abs(r.x-c.x)<(c.hit+PW)/2+.03){lg=g;lead={speed:r.down>0?0:r.speed,z:r.z};}}
    let want=c.bus?busWant(c,dt,c.base):c.base;
    if(c.k==='dolmus'){
      c.ht-=dt;
      if(c.st==='drive'&&c.ht<=0){const ahead=c.z-pz;
        if(nearLane(c.x)!==2){if(laneFree(LANES[2],c,450)){c.tl=LANES[2];c.ht=1.5;}else c.ht=3;}
        else if(ahead>300&&ahead<3500&&Math.abs(c.x-c.tl)<.05){c.st='halt';c.wait=2+Math.random()*1.5;c.tl=.85;c.ht=8+Math.random()*8;}
        else c.ht=2;}
      if(c.st==='halt'){c.wait-=dt;want=0;if(c.wait<=0){c.st='drive';c.tl=LANES[nearLane(c.x)];}}
    }
    if(c.k==='hurda'&&G.state==='play'){
      c.drop-=dt;
      if(c.drop<=0){c.drop=5+Math.random()*5;const ahead=c.z-pz,idx=Math.floor(c.z/segL)-1,sg=G.segs[idx];
        if(ahead>500&&ahead<3200&&sg&&!sg.hz&&idx<G.segs.length-drawDist)sg.hz={t:'junk',x:clamp(c.x+(Math.random()-.5)*.2,-.9,.9),w:.2,hit:false,v:Math.floor(Math.random()*3)};}
    }
    const shut=j=>G.closures.some(k=>k.lane===j&&c.z>k.z0-1400&&c.z<k.z1);
    if(c.amb){
      c.honk=!!(lead&&lg<1400&&lead.speed<c.base*.8);
      if(lead&&lead.p&&lg<900){c.blockT+=dt;if(c.blockT>1.3&&!c.fined){c.fined=true;damage(8,'Ambulansa yol vermedin');const pl=nearLane(G.playerX),op=[0,1,2].filter(j=>j!==pl&&!shut(j));if(op.length)c.tl=LANES[pick(Math.random,op)];}}
      if(!c.passed&&c.z>pz+150){c.passed=true;c.base=maxSpeed*.98;if(!c.fined&&G.state==='play'){G.bonus+=10;toast('Ambulansa yol verdin  +10 TL');}}
    }else if(amb&&amb.z<c.z&&c.z-amb.z<2600){
      if(!c.bus&&c.st==='drive'){
        const al=nearLane(amb.x),cl=nearLane(c.x);
        if(cl===al){
          const sd=c.x>amb.x?1:c.x<amb.x?-1:(Math.random()<.5?-1:1);
          let moved=false;
          for(const j of[al+sd,al-sd])if(j>=0&&j<3&&!shut(j)&&laneFree(LANES[j],c,500)){c.tl=LANES[j];moved=true;break;}
          if(!moved)want=Math.min(want,c.base*.3);
        }else if(!shut(cl))c.tl=Math.sign(c.x)*.82;
        c.sig=0;c.sigT=0;c.yld=true;
      }
      want=Math.min(want,c.base*.6);
    }else if(c.yld){c.yld=false;if(c.st==='drive')c.tl=LANES[nearLane(c.tl)];}
    const free=c.st==='drive',still=calm&&c.cat==='taxi';
    c.cool-=dt;
    if(c.sigT>0){c.sigT-=dt;if(c.sigT<=0){if(laneFree(c.pend,c,500))c.tl=c.pend;else c.sig=0;}}
    else if(c.sig&&Math.abs(c.x-c.tl)<.04)c.sig=0;
    if(lead&&lg<1500){
      if(free&&c.cool<=0&&lead.speed<c.base*.8&&!still&&!(c.sigT>0)){
        const li=nearLane(c.tl);
        for(const j of(Math.random()<.5?[li-1,li+1]:[li+1,li-1]))if(j>=0&&j<3&&laneFree(LANES[j],c,c.wild?450:700)){wantLane(c,LANES[j]);c.cool=2.5;break;}
      }
      want=Math.min(want,lead.speed+(lg-450)*1.2);
    }
    if(c.wild&&!still&&free){c.lt-=dt;if(c.lt<=0){c.lt=((c.k==='klasik'||c.k==='lux'||c.k==='taxiY')?1:c.k==='hurda'?9:1.5)+Math.random()*3;if(Math.random()<.5){const li=nearLane(c.tl),j=pick(Math.random,[li-1,li+1].filter(i=>i>=0&&i<3));if(laneFree(LANES[j],c,450))c.tl=LANES[j];}}}
    want=Math.max(0,want);
    if(want<c.speed-maxSpeed*.01||c.speed<maxSpeed*.02)c.brkT=.35;else c.brkT=Math.max(0,(c.brkT||0)-dt);
    c.brk=c.brkT>0;
    c.speed+=clamp(want-c.speed,-maxSpeed*(c.k==='dolmus'?1.4:.7)*dt,maxSpeed*.22*dt);
    c.z+=c.speed*dt;
    if(lead&&lead.z-c.z<320){c.z=lead.z-320;c.speed=Math.min(c.speed,lead.speed);}
    const ls=c.wild?1:.7;c.x+=clamp(c.tl-c.x,-ls*dt,ls*dt);
    if(c.amb){if(c.z>pz+drawDist*segL*1.2)c.dead=true;}
    else if(c.z<G.pos-4000||c.z>pz+drawDist*segL*1.6)respawn(c,false);
  }
}
