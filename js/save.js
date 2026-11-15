import { BIKES, HELM, LVL_DEL, PAINT, TOPCAP, UPMAX, WPN, clamp } from './config.js';
import { G } from './g.js';

/* ---------- save ---------- */
G.S={money:0,owned:['mob'],cur:'mob',pd:0,upg:[0,0,0,0,0],uv:2,cos:{paint:'std',helm:'std',own:['p:std','h:std']},sl:0,fz:5,met:{},shifts:0,best:0,weapons:['kick'],wpn:'kick',ratings:[],tut:0,story:0,volV:2,clues:0,boss:0,joy:1,left:0,lang:'tr',st:{del:0,km:0,earned:0,kd:0,fines:0,t:0}};
export function load(){try{const d=JSON.parse(localStorage.getItem('kurye34')||'{}');
  G.S.money=Math.max(0,d.money|0);
  if(Array.isArray(d.owned))G.S.owned=d.owned.filter(id=>BIKES.some(b=>b.id===id));
  if(!G.S.owned.includes('mob'))G.S.owned.unshift('mob');
  if(d.cur&&G.S.owned.includes(d.cur))G.S.cur=d.cur;
  // parts belong to the rider now, not to one bike; old saves keep the best level they had on any bike
  if(Array.isArray(d.upg))G.S.upg=d.upg.concat([0,0,0,0,0]).slice(0,5).map(v=>clamp(v|0,0,UPMAX));
  else if(d.up&&typeof d.up==='object')for(const k in d.up)if(Array.isArray(d.up[k]))d.up[k].slice(0,5).forEach((v,i)=>{G.S.upg[i]=Math.max(G.S.upg[i],clamp(v|0,0,3));});
  G.S.shifts=d.shifts|0;
  // progress counts successful deliveries since 0.40; older saves counted full shifts of five
  G.S.pd=d.pd!=null?Math.max(0,d.pd|0):G.S.shifts*LVL_DEL;
  // parts went from 3 to 5 levels in 0.39: old levels 1/2/3 become 2/3/5 (same power, a bit more to buy)
  if(d.uv!==2){for(const k of[0,2,4])G.S.upg[k]=[0,2,3,5][Math.min(3,G.S.upg[k])];}
  if(d.cos&&typeof d.cos==='object'){const o=Array.isArray(d.cos.own)?d.cos.own.filter(x=>typeof x==='string'):[];
    G.S.cos={paint:PAINT.some(p=>p.id===d.cos.paint)?d.cos.paint:'std',helm:HELM.some(h=>h.id===d.cos.helm)?d.cos.helm:'std',own:[...new Set(['p:std','h:std',...o])]};
    if(!G.S.cos.own.includes('p:'+G.S.cos.paint))G.S.cos.paint='std';if(!G.S.cos.own.includes('h:'+G.S.cos.helm))G.S.cos.helm='std';}
  G.S.sl=d.sl|0;G.S.fz=clamp(d.fz!=null?d.fz|0:5,0,5);
  // tyres (1) and jacket (3) are gone: refund what was spent on them
  for(const k of[1,3]){for(let l=0;l<G.S.upg[k];l++)G.S.money+=[200,500,1200][l]||0;G.S.upg[k]=0;}if(d.met&&typeof d.met==='object')G.S.met=d.met;
  if(Array.isArray(d.weapons))G.S.weapons=d.weapons.filter(id=>WPN.some(w=>w.id===id));
  if(!G.S.weapons.includes('kick'))G.S.weapons.unshift('kick');
  if(d.wpn&&G.S.weapons.includes(d.wpn))G.S.wpn=d.wpn;
  if(Array.isArray(d.ratings))G.S.ratings=d.ratings.map(n=>n|0).filter(n=>n>=1&&n<=5).slice(-20);
  G.S.tut=d.tut?1:0;G.S.story=d.story?1:0;
  if(d.lang==='en')G.S.lang='en';
  G.S.clues=clamp(d.clues|0,0,5);G.S.boss=d.boss?1:0;G.S.left=d.left?1:0;G.S.fps=d.fps?1:0;
  if(d.st&&typeof d.st==='object')for(const k in G.S.st)G.S.st[k]=Math.max(0,+d.st[k]||0);
  if(typeof d.joy==='number')G.S.joy=clamp(d.joy,.5,1.6);
  if(d.vol&&typeof d.vol==='object'&&d.volV===2){G.S.vol={music:.5,sfx:.8,amb:.5};for(const k in G.S.vol)if(typeof d.vol[k]==='number')G.S.vol[k]=clamp(d.vol[k],0,1);}
}catch(e){}}
// wipe all progress (money, bikes, parts, clues, stats, story) but keep the settings, then start over
export function resetProgress(){
  const k={volV:2,lang:G.S.lang,joy:G.S.joy,left:G.S.left,fps:G.S.fps};if(G.S.vol)k.vol=G.S.vol;
  try{localStorage.setItem('kurye34',JSON.stringify(k));}catch(e){}
  location.reload();
}
export function save(){try{localStorage.setItem('kurye34',JSON.stringify(G.S));}catch(e){}}
export const ups=()=>G.S.upg;
export const curBike=()=>BIKES.find(b=>b.id===G.S.cur)||BIKES[0];
export const curWpn=()=>WPN.find(w=>w.id===G.S.wpn)||WPN[0];
export const upCost=(b,lv)=>[300,700,1500,3000,5000][lv];
export function stats(b,u,c){c=c||{};return{
  top:Math.min(TOPCAP,b.top*(1+.03*u[0])*(1+.08*(c.turbo||0))),
  accT:b.acc*(1-.036*u[0]),
  cent:(1/b.grip)*(1-.042*u[0]),
  steer:b.steer*(1+.024*u[0]),
  dmg:b.dur*(1-.072*u[2])*Math.pow(.75,c.termos||0),
  crashT:1.1
};}
