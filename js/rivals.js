import { PW, RIVALS, clamp, lerp, maxSpeed, playerZ } from './config.js';
import { G } from './g.js';
import { sfx } from './audio.js';
import { card, damage } from './game.js';
import { SPR } from './sprites.js';
import { closureAt } from './track.js';

export function spawnRivals(){
  G.rivals=[];const quiet=card('sakin')>0,n=Math.min(3,1+((G.route.d||0)>=6?1:0)+(G.route.ev==='rakip2'?1:0));
  const pool=RIVALS.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  for(let i=0;i<n;i++){const p=pool[i];G.rivals.push({p,hp:p.hp,z:(quiet?-5200:-2500)-i*1800,x:i%2?-.55:.55,speed:0,down:0,kick:0,wind:0,kside:1,cutT:2.5,cutCd:8,dodge:0,dsd:1,blk:0,cool:(quiet?7:3)+i*2,fall:0,spr:SPR.rv[p.id]});}
}
export function updateRival(r,dt){
  const pz=G.pos+playerZ;
  r.kick-=dt;
  if(r.down>0){
    r.down-=dt;r.speed=Math.max(0,r.speed-maxSpeed*1.4*dt);r.z+=r.speed*dt;r.fall=Math.min(1.4,r.fall+dt*5);
    if(r.down<=0){r.z=G.pos-1500;r.x=G.playerX>0?-.55:.55;r.speed=G.speed;r.fall=0;r.cool=2;r.hp=r.p.hp;}
    return;
  }
  const p=r.p,gap=pz-r.z,cap=Math.min(maxSpeed*.98,G.ST.top*maxSpeed*1.15*p.spd);
  const g2=p.id==='purple'?gap-70:gap;
  let want=clamp(G.speed+clamp(g2*.9,-maxSpeed*.3,maxSpeed*.45)+Math.sin(G.clock*.7)*maxSpeed*.04,0,cap);
  if(p.id==='green'&&gap<-60&&gap>-900&&r.cutT>0){r.cutT-=dt;want=Math.min(cap,Math.max(G.speed*.97,G.ST.top*maxSpeed*.55));}
  if(r.cutT<=0){r.cutCd-=dt;if(r.cutCd<=0){r.cutT=2.5;r.cutCd=8;}}
  r.speed+=clamp(want-r.speed,-maxSpeed*.5*dt,maxSpeed*.4*dt);
  r.z+=r.speed*dt;
  const side=Math.sign(r.x-G.playerX)||1;
  let tx=clamp(G.playerX+side*(p.id==='purple'?.35:.28),-.85,.85);
  if(gap<-60)tx=lerp(r.x+side*.3,G.playerX,p.id==='green'&&r.cutT<=0?0:p.cut);
  if(r.dodge>0){r.dodge-=dt;tx=clamp(r.x+r.dsd*.5,-.85,.85);}
  for(const c of G.cars){const dz=c.z-r.z;if(dz>0&&dz<600&&Math.abs(c.x-r.x)<(c.hit+PW)/2+.05){tx=r.x+(r.x<c.x?-.4:.4);break;}}
  const kz=closureAt(r.z+500);if(kz){if(kz.lane===2&&tx>.3)tx=.1;if(kz.lane===0&&tx<-.3)tx=-.1;}
  const lsp=gap<-60&&!(r.dodge>0)?.55:.9;
  r.x=clamp(r.x+clamp(tx-r.x,-lsp*dt,lsp*dt),-.95,.95);
  r.cool-=dt;
  const adx=Math.abs(r.x-G.playerX),inWin=gap>=-60&&gap<=120&&adx>=.1&&adx<=.38;
  if(r.wind>0){
    r.wind-=dt;
    if(r.wind<=0){r.kick=.3;if(inWin&&G.crashT<=0&&G.inv<=0&&(Math.sign(G.playerX-r.x)||1)===r.kside){G.playerX+=r.kside*p.push;G.speed*=.88;damage(p.dmg,p.n+' kurye vurdu');}}
  }else if(G.crashT<=0&&r.cool<=0&&inWin&&Math.random()<dt*1.4*p.aggr){r.wind=.3;r.kside=Math.sign(G.playerX-r.x)||1;sfx('swing',{pan:clamp((r.x-G.playerX)*1.5,-1,1)});r.cool=(1.8+Math.random()*1.5)/p.aggr;}
}
