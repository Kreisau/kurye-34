import { BASE_CARDS, BIKES, CARDS, WPN, clamp } from './config.js';
import { G } from './g.js';

/* ---------- save ---------- */
G.S={money:0,owned:['mob'],cur:'mob',upg:[0,0,0,0,0],cu:0,sl:0,met:{},shifts:0,best:0,weapons:['kick'],wpn:'kick',ratings:[],tut:0,story:0,volV:2,clues:0,boss:0,daily:null,joy:1,left:0,lang:'tr',st:{del:0,km:0,earned:0,kd:0,fines:0,t:0}};
export function load(){try{const d=JSON.parse(localStorage.getItem('kurye34')||'{}');
  G.S.money=Math.max(0,d.money|0);
  if(Array.isArray(d.owned))G.S.owned=d.owned.filter(id=>BIKES.some(b=>b.id===id));
  if(!G.S.owned.includes('mob'))G.S.owned.unshift('mob');
  if(d.cur&&G.S.owned.includes(d.cur))G.S.cur=d.cur;
  // parts belong to the rider now, not to one bike; old saves keep the best level they had on any bike
  if(Array.isArray(d.upg))G.S.upg=d.upg.concat([0,0,0,0,0]).slice(0,5).map(v=>clamp(v|0,0,3));
  else if(d.up&&typeof d.up==='object')for(const k in d.up)if(Array.isArray(d.up[k]))d.up[k].slice(0,5).forEach((v,i)=>{G.S.upg[i]=Math.max(G.S.upg[i],clamp(v|0,0,3));});
  G.S.shifts=d.shifts|0;G.S.best=d.best|0;
  G.S.cu=clamp(d.cu!=null?d.cu|0:G.S.shifts,0,CARDS.length-BASE_CARDS);G.S.sl=d.sl|0;if(d.met&&typeof d.met==='object')G.S.met=d.met;
  if(Array.isArray(d.weapons))G.S.weapons=d.weapons.filter(id=>WPN.some(w=>w.id===id));
  if(!G.S.weapons.includes('kick'))G.S.weapons.unshift('kick');
  if(d.wpn&&G.S.weapons.includes(d.wpn))G.S.wpn=d.wpn;
  if(Array.isArray(d.ratings))G.S.ratings=d.ratings.map(n=>n|0).filter(n=>n>=1&&n<=5).slice(-20);
  G.S.tut=d.tut?1:0;G.S.story=d.story?1:0;
  if(d.lang==='en')G.S.lang='en';
  G.S.clues=clamp(d.clues|0,0,5);G.S.boss=d.boss?1:0;G.S.left=d.left?1:0;
  if(d.st&&typeof d.st==='object')for(const k in G.S.st)G.S.st[k]=Math.max(0,+d.st[k]||0);
  if(typeof d.joy==='number')G.S.joy=clamp(d.joy,.5,1.6);
  if(d.daily&&typeof d.daily.d==='string')G.S.daily={d:d.daily.d,done:d.daily.done?1:0,best:+d.daily.best||0};
  if(d.vol&&typeof d.vol==='object'&&d.volV===2){G.S.vol={music:.5,sfx:.8,amb:.5};for(const k in G.S.vol)if(typeof d.vol[k]==='number')G.S.vol[k]=clamp(d.vol[k],0,1);}
}catch(e){}}
export function save(){try{localStorage.setItem('kurye34',JSON.stringify(G.S));}catch(e){}}
export const ups=()=>G.S.upg;
export const stat=(k,v)=>{G.S.st[k]=(G.S.st[k]||0)+v;};
export const curBike=()=>BIKES.find(b=>b.id===G.S.cur)||BIKES[0];
export const curWpn=()=>WPN.find(w=>w.id===G.S.wpn)||WPN[0];
export const upCost=(b,lv)=>[200,500,1200][lv];
export function stats(b,u,c){c=c||{};return{
  top:Math.min(1,b.top*(1+.05*u[0])*(1+.08*(c.turbo||0))*(c.frensiz?1.15:1)),
  accT:b.acc*(1-.06*u[0]),
  cent:(1/b.grip)*(1-.12*u[1])*(c.yolbilir?.75:1),
  steer:b.steer*(1+.06*u[1]),
  dmg:b.dur*(1-.12*u[2])*Math.pow(.7,c.termos||0)*(c.cam?2:1),
  crashT:1.1*(1-.15*u[3])*(c.kask?.5:1)
};}
