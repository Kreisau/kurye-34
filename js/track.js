import { LANES, def, drawDist, easeIn, easeInOut, pick, rng, segL } from './config.js';
import { G } from './g.js';
import { SPR, bset, destSprite, restSprite } from './sprites.js';

/* ---------- track ---------- */
G.segs=[];G.trackLen=0;G.finishZ=0;G.stopsZ=[];G.closures=[];
export const closureAt=z=>G.closures.find(k=>z>=k.z0&&z<k.z1);
export function signature(pf,R){
  const dir=R()<.5?-1:1;
  if(pf.sea)addRoad(20,110,20,dir*.8,0);
  else if(pf.hill===2)addRoad(25,40,25,dir*1.5,R()<.6?60:-50);
  else if(pf.cobble)for(let i=0;i<4;i++)addRoad(8,10,8,(i%2?-1:1)*dir*6,0);
  else if(pf.style==='plaza')addRoad(20,110,20,dir*.6,0);
  else for(let i=0;i<3;i++)addRoad(15,15,15,0,(i%2?-1:1)*25);
}
export const lastY=()=>G.segs.length?G.segs[G.segs.length-1].p2.wy:0;
export function addSeg(curve,y){const n=G.segs.length;G.segs.push({index:n,p1:{wy:lastY(),wz:n*segL},p2:{wy:y,wz:(n+1)*segL},curve,sprites:[],hz:null,cl:null,clk:null,color:(G.TH.cobble?n%2:Math.floor(n/3)%2)?G.PAL.dark:G.PAL.light,clip:0,fog:1,looped:false});}
export function addRoad(e,h,l,c,y){e=Math.round(e);h=Math.round(h);l=Math.round(l);const sy=lastY(),ey=sy+y*segL,t=e+h+l;
  for(let n=0;n<e;n++)addSeg(easeIn(0,c,n/e),easeInOut(sy,ey,n/t));
  for(let n=0;n<h;n++)addSeg(c,easeInOut(sy,ey,(e+n)/t));
  for(let n=0;n<l;n++)addSeg(easeInOut(c,0,n/l),easeInOut(sy,ey,(e+h+n)/t));}
export function buildTrack(rt,seed){
  G.segs=[];G.stopsZ=[];const R=rng(seed);
  addRoad(10,20,10,0,0);
  let sigA=false,sigB=false;
  while(G.segs.length<rt.len){
    if(!sigA&&G.segs.length>rt.len*.2){sigA=true;signature(rt.A,R);continue;}
    if(!sigB&&G.segs.length>rt.len*.65){sigB=true;signature(rt.B,R);continue;}
    const t=R(),dir=R()<.5?-1:1;
    const cur=Math.min(7,[2,3.5,5][Math.floor(R()*3)]*rt.curv);
    const ph=G.segs.length<rt.len/2?rt.A:rt.B,hm=[.5,1,1.7][ph.hill]*rt.hill,upb=ph.hill===2?.7:rt.up;
    const hl=Math.min(70,[15,30,45][Math.floor(R()*3)]*hm)*(R()<upb?1:-1);
    const L=20+R()*25,Hd=20+R()*60;
    if(t<.32)addRoad(L,Hd,L,dir*cur,R()<.5?hl:0);
    else if(t<.52){addRoad(L,Hd/2,L,-dir*cur,0);addRoad(L,Hd/2,L,dir*cur,R()<.5?hl:0);}
    else if(t<.78)addRoad(L,Hd,L,R()<.4?dir*cur*.4:0,hl);
    else addRoad(15,20+R()*40,15,0,0);
  }
  const fi=G.segs.length;
  addRoad(20,drawDist+80,20,0,0);
  G.finishZ=fi*segL;G.trackLen=G.segs.length*segL;G.closures=[];
  for(const g of G.segs){g.pf=g.index<fi*.5?rt.A:rt.B;g.sea=g.pf.sea;g.cobble=g.pf.cobble;g.color=g.cobble?(g.index%2?G.PAL.cobD:G.PAL.cobL):(Math.floor(g.index/3)%2?G.PAL.dark:G.PAL.light);}
  const SR=rng(seed^0x9e37),D=G.DIS,sea=D.sea,lampN=D.theme==='night'||D.theme==='neon'?10:16;
  const land=sd=>sd?-sd:(SR()<.5?-1:1);
  for(let n=12;n<G.segs.length;n++){
    const s=G.segs[n];
    if(n%7===0&&Math.abs(n-fi)>4)for(const side of[-1,1])if(side!==s.sea&&SR()<.88){const b=pick(SR,bset(s.pf.style));s.sprites.push({spr:b,off:side*(1.2+b.half+SR()*.3)});}
    if(s.sea&&n%3===0)s.sprites.push({spr:SPR.rail,off:s.sea*1.1});
    if(s.sea&&n%60===25)s.sprites.push({spr:SPR.ferry,off:s.sea*(2.8+SR()*2.4)});
    if(s.pf.style!=='plaza'&&n%5===2&&Math.abs(n-fi)>8&&SR()<.35)s.sprites.push({spr:pick(SR,SPR.trees),off:land(s.sea)*(1.12+SR()*.06)});
    if(n%lampN===8)s.sprites.push({spr:SPR.lampL,off:-1.07},{spr:SPR.lampR,off:1.07});
    else if(SR()<.012)s.sprites.push({spr:pick(SR,SPR.cats),off:land(s.sea)*(1.04+SR()*.08)});
    else if(SR()<.008)s.sprites.push({spr:SPR.cart,off:land(s.sea)*1.14});
  }
  const nWorks=D.name==='Fatih'?0:1+(SR()<.4?1:0),nPark=D.name==='Fatih'?3:D.name==='Karaköy'?2:(SR()<.6?1:0);
  const plan=[];for(let i=0;i<nWorks;i++)plan.push('works');for(let i=0;i<nPark;i++)plan.push('park');
  const parked=SPR.cars.concat(SPR.klasik,[SPR.hafif]);
  for(const kind of plan){
    for(let tries=0;tries<10;tries++){
      const n0=70+Math.floor(SR()*Math.max(1,fi-170)),len=25+Math.floor(SR()*20),n1=n0+len;
      if(n1>fi-30||G.closures.some(k=>n0<k.n1+15&&n1>k.n0-15))continue;
      const lane=kind==='park'?2:(SR()<.5?0:2),sd=lane===2?1:-1;
      G.closures.push({n0,n1,z0:n0*segL,z1:n1*segL,lane,kind});
      for(let n=n0;n<n1;n++){G.segs[n].cl=lane;G.segs[n].clk=kind;}
      if(kind==='works'){
        G.segs[n0-12].sprites.push({spr:SPR.wsign,off:sd*1.1});
        G.segs[n0].sprites.push({spr:SPR.barrier,off:LANES[lane]});
        for(let n=n0;n<n1;n+=2)G.segs[n].sprites.push({spr:SPR.cone,off:sd*.34});
        G.segs[n1-1].sprites.push({spr:SPR.barrier,off:LANES[lane]});
      }else for(let n=n0+2;n<n1-1;n+=5)G.segs[n].sprites.push({spr:pick(SR,parked),off:.72});
      break;
    }
  }
  for(let n=50+Math.floor(SR()*40);n<fi-30;n+=110+Math.floor(SR()*60)){if(G.segs[n].cl!=null)continue;G.segs[n].sprites.push({spr:SPR.durak,off:1.18});G.stopsZ.push(n*segL);}
  const dd=rt.d||0,wb=.12,wp=.45*D.pot,wo=.35*(rt.ev==='yagmur'?1.4:1),tot=wb+wp+wo;
  for(let n=60+Math.floor(SR()*30);n<fi-20;){
    const r=SR()*tot,t=r<wb?'bump':r<wb+wp?'pot':'oil';
    if(t==='bump'){G.segs[n].hz={t,x:0,w:2.4,hit:false};G.segs[n-12].sprites.push({spr:SPR.sign,off:1.1});}
    else G.segs[n].hz={t,x:pick(SR,LANES)+(SR()-.5)*.2,w:t==='pot'?.24:.5,hit:false,r:SR()};
    n+=Math.max(14,Math.round((32+SR()*50)/(1+Math.min(.6,dd*.03))/Math.sqrt(D.pot)));
  }
  const ls0=G.segs[5].sea?-G.segs[5].sea:1,ls=G.segs[fi].sea?-G.segs[fi].sea:1;rt.side0=ls0;rt.side=ls;
  if(rt.rest){const rs=def(restSprite(rt.rest),2600);G.segs[5].sprites.push({spr:rs,off:ls0*(1.2+rs.half)});}
  const ds=def(destSprite(),2600);G.segs[fi].sprites.push({spr:ds,off:ls*(1.2+ds.half)});
}
export const findSeg=z=>G.segs[Math.floor(Math.max(0,z)/segL)%G.segs.length];
