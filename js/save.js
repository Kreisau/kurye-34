import { BIKES, WPN, clamp } from './config.js';
import { G } from './g.js';

/* ---------- save ---------- */
G.S={money:0,owned:['mob'],cur:'mob',up:{},shifts:0,best:0,weapons:['kick'],wpn:'kick',ratings:[],tut:0,story:0,volV:2};
export function load(){try{const d=JSON.parse(localStorage.getItem('kurye34')||'{}');
  G.S.money=Math.max(0,d.money|0);
  if(Array.isArray(d.owned))G.S.owned=d.owned.filter(id=>BIKES.some(b=>b.id===id));
  if(!G.S.owned.includes('mob'))G.S.owned.unshift('mob');
  if(d.cur&&G.S.owned.includes(d.cur))G.S.cur=d.cur;
  if(d.up&&typeof d.up==='object')for(const b of BIKES)if(Array.isArray(d.up[b.id]))G.S.up[b.id]=d.up[b.id].concat([0,0,0,0,0]).slice(0,5).map(v=>clamp(v|0,0,3));
  G.S.shifts=d.shifts|0;G.S.best=d.best|0;
  if(Array.isArray(d.weapons))G.S.weapons=d.weapons.filter(id=>WPN.some(w=>w.id===id));
  if(!G.S.weapons.includes('kick'))G.S.weapons.unshift('kick');
  if(d.wpn&&G.S.weapons.includes(d.wpn))G.S.wpn=d.wpn;
  if(Array.isArray(d.ratings))G.S.ratings=d.ratings.map(n=>n|0).filter(n=>n>=1&&n<=5).slice(-20);
  G.S.tut=d.tut?1:0;G.S.story=d.story?1:0;
  if(d.vol&&typeof d.vol==='object'&&d.volV===2){G.S.vol={music:.5,sfx:.8,amb:.5};for(const k in G.S.vol)if(typeof d.vol[k]==='number')G.S.vol[k]=clamp(d.vol[k],0,1);}
}catch(e){}}
export function save(){try{localStorage.setItem('kurye34',JSON.stringify(G.S));}catch(e){}}
export const ups=id=>G.S.up[id]||(G.S.up[id]=[0,0,0,0,0]);
export const curBike=()=>BIKES.find(b=>b.id===G.S.cur)||BIKES[0];
export const curWpn=()=>WPN.find(w=>w.id===G.S.wpn)||WPN[0];
export const upCost=(b,lv)=>Math.round(Math.max(60,b.price*.12)*[1,2,4][lv]/10)*10;
export function stats(b,u,c){c=c||{};return{
  top:Math.min(1,b.top*(1+.05*u[0])*(1+.08*(c.turbo||0))),
  accT:b.acc*(1-.06*u[0]),
  cent:(1/b.grip)*(1-.12*u[1])*(c.yolbilir?.75:1),
  steer:b.steer*(1+.06*u[1]),
  dmg:b.dur*(1-.12*u[2])*Math.pow(.7,c.termos||0),
  crashT:1.1*(1-.15*u[3])*(c.kask?.5:1)
};}
