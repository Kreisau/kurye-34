import { AWN, CAR_COLORS, DISTRICTS, FACADES, RIVALS, SHOPS, THEMES, def, pal, pick, rng, shade } from './config.js';
import { G } from './g.js';
import { buildGrads } from './render.js';

export const SS=2;
export function mk(w,h,fn){const c=document.createElement('canvas');c.width=w*SS;c.height=h*SS;const g=c.getContext('2d');g.scale(SS,SS);fn(g,w,h);return c;}
export function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

/* ---------- procedural sprites ---------- */
export function carSprite(body,kind,lit){
  const w=160,h=kind==='bus'?200:kind==='van'?160:kind==='taxi'?134:118;
  return mk(w,h,g=>{
    const bot=h-4;let bodyTop;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(w/2,bot-2,w*.47,7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#141018';g.fillRect(16,bot-22,26,20);g.fillRect(w-42,bot-22,26,20);
    if(kind==='bus'||kind==='van'){
      const top=kind==='bus'?6:20;
      g.fillStyle=body;rr(g,8,top,w-16,bot-14-top,kind==='bus'?10:20);g.fill();
      const wy=top+(kind==='bus'?34:14),wh=(bot-top)*.34;
      g.fillStyle='#2b3047';rr(g,20,wy,w-40,wh,6);g.fill();
      g.fillStyle='rgba(255,255,255,.14)';g.fillRect(26,wy+4,(w-52)*.4,5);
      if(kind==='bus'){g.fillStyle='#120d10';g.fillRect(38,top+8,w-76,20);g.fillStyle='#ff9a2e';g.font='bold 12px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('BELEDİYE',w/2,top+19);}
      else{g.fillStyle='#2e8f8c';g.fillRect(8,wy+wh+10,w-16,7);}
      bodyTop=wy+wh+20;
    }else{
      const bt=h*.48;
      g.fillStyle=shade(body,-.15);g.beginPath();g.moveTo(26,bt);g.lineTo(42,h*.2);g.lineTo(w-42,h*.2);g.lineTo(w-26,bt);g.closePath();g.fill();
      g.fillStyle='#2b3047';g.beginPath();g.moveTo(36,bt-4);g.lineTo(48,h*.25);g.lineTo(w-48,h*.25);g.lineTo(w-36,bt-4);g.closePath();g.fill();
      g.fillStyle=body;rr(g,8,bt,w-16,bot-14-bt,12);g.fill();
      if(kind==='taxi'){if(lit){g.fillStyle='rgba(255,240,160,.45)';g.beginPath();g.ellipse(w/2,h*.2-9,42,15,0,0,Math.PI*2);g.fill();}g.fillStyle='#120d22';g.fillRect(w/2-30,h*.2-18,60,17);g.fillStyle=lit?'#fff1a8':'#9a8a4a';g.fillRect(w/2-28,h*.2-16,56,13);g.fillStyle='#120d22';g.font='bold 11px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('TAKSİ',w/2,h*.2-9);}
      bodyTop=bt+6;
    }
    g.fillStyle='#ff3b3b';rr(g,14,bodyTop,24,10,3);g.fill();rr(g,w-38,bodyTop,24,10,3);g.fill();
    const py=Math.min(bot-34,bodyTop+16);
    g.fillStyle='#f4eee6';g.fillRect(w/2-26,py,52,14);g.fillStyle='#2a4fd6';g.fillRect(w/2-26,py,7,14);
    g.fillStyle='#120d22';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('34 KRY',w/2+3,py+7.5);
    g.fillStyle='#1d1726';g.fillRect(10,bot-18,w-20,6);
  });
}
export function bikeSprite(o){
  const w=180,h=172,cx=90;
  return mk(w,h,g=>{
    const b=h-4;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(cx,b-1,34,6,0,0,Math.PI*2);g.fill();
    g.fillStyle='#15111a';rr(g,cx-9,b-46,18,46,8);g.fill();
    g.fillStyle='#2a2533';rr(g,cx-13,b-58,26,14,4);g.fill();
    g.fillStyle='#f4eee6';g.fillRect(cx-12,b-70,24,10);
    g.fillStyle='#ff3b3b';g.fillRect(cx-8,b-77,16,6);
    g.strokeStyle='#22202c';g.lineWidth=11;g.lineCap='round';g.lineJoin='round';
    const leg=(s,k)=>{g.beginPath();g.moveTo(cx+s*14,b-94);if(k){g.lineTo(cx+s*52,b-82);g.lineTo(cx+s*84,b-80);}else{g.lineTo(cx+s*30,b-64);g.lineTo(cx+s*24,b-42);}g.stroke();};
    const wp=o.wpn||'kick',armed=!!o.kick&&wp!=='kick';
    leg(-1,o.kick===-1&&!armed);leg(1,o.kick===1&&!armed);
    g.strokeStyle='#1a1622';g.lineWidth=5;g.beginPath();g.moveTo(cx-54,b-102);g.lineTo(cx+54,b-102);g.stroke();
    g.fillStyle='#1a1622';g.fillRect(cx-60,b-116,8,8);g.fillRect(cx+52,b-116,8,8);
    g.fillStyle=o.jacket;g.beginPath();g.moveTo(cx-30,b-140);g.lineTo(cx+30,b-140);g.lineTo(cx+20,b-92);g.lineTo(cx-20,b-92);g.closePath();g.fill();
    g.strokeStyle=o.jacket;g.lineWidth=9;
    for(const s of[-1,1]){g.beginPath();g.moveTo(cx+s*27,b-134);if(armed&&s===o.kick)g.lineTo(cx+s*60,b-132);else g.lineTo(cx+s*48,b-104);g.stroke();}
    if(armed){
      const s=o.kick,hx=cx+s*62,hy=b-132;
      if(wp==='bat'){g.strokeStyle='#b07a3a';g.lineWidth=6;g.beginPath();g.moveTo(hx,hy);g.lineTo(hx+s*22,hy-32);g.stroke();g.lineWidth=11;g.beginPath();g.moveTo(hx+s*12,hy-16);g.lineTo(hx+s*23,hy-33);g.stroke();}
      else if(wp==='chain'){g.strokeStyle='#c4c8d2';g.lineWidth=2.5;for(let i=0;i<8;i++){g.beginPath();g.ellipse(hx+s*(4+i*3.2),hy-6-i*i*.6,3,2,i%2?0:Math.PI/2,0,Math.PI*2);g.stroke();}}
      else{g.strokeStyle='#5d6470';g.lineWidth=6;g.beginPath();g.moveTo(hx,hy+4);g.lineTo(hx+s*20,hy-30);g.lineTo(hx+s*27,hy-26);g.stroke();}
    }
    g.fillStyle=o.helmet;g.beginPath();g.arc(cx,b-152,15,0,Math.PI*2);g.fill();
    g.fillStyle='rgba(0,0,0,.25)';g.fillRect(cx-15,b-150,30,4);
    g.fillStyle=o.box;rr(g,cx-29,b-130,58,46,5);g.fill();
    g.fillStyle=shade(o.box,.18);g.fillRect(cx-29,b-130,58,7);
    g.fillStyle=o.box==='#ffc61a'?'#120d22':'#f4eee6';g.font='bold 15px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(o.label,cx,b-104);
  });
}
export function buildingSprite(R){
  const floors=3+Math.floor(R()*5),fh=34,w=240,shopH=50,roofH=28,h=roofH+floors*fh+shopH;
  const col=pick(R,FACADES),aw=pick(R,AWN),name=pick(R,SHOPS),shop=R()<.45;
  return mk(w,h,g=>{
    g.fillStyle='#2a2238';rr(g,26,8,40,18,7);g.fill();g.fillRect(40,3,4,7);
    g.beginPath();g.arc(120,roofH-2,11,Math.PI*1.05,Math.PI*1.95);g.lineTo(120,roofH-2);g.fill();
    g.strokeStyle='#2a2238';g.lineWidth=2;g.beginPath();g.moveTo(180,roofH);g.lineTo(180,2);g.moveTo(170,8);g.lineTo(190,8);g.moveTo(172,14);g.lineTo(188,14);g.stroke();
    g.fillStyle=col;g.fillRect(0,roofH,w,h-roofH);
    g.fillStyle=shade(col,-.3);g.fillRect(0,roofH,w,5);
    for(let f=0;f<floors;f++){
      const y=roofH+6+f*fh;
      for(let c=0;c<4;c++){
        const x=16+c*56,lit=R()<G.TH.lit;
        g.fillStyle=shade(col,-.35);g.fillRect(x-2,y+2,36,24);
        g.fillStyle=lit?(R()<.85?G.TH.win[0]:G.TH.win[1]):'#3a3148';g.fillRect(x,y+4,32,20);
        if(lit){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x+15,y+4,2,20);}
      }
      g.fillStyle=shade(col,-.22);g.fillRect(8,y+fh-8,w-16,4);
      g.fillStyle=shade(col,-.42);g.fillRect(8,y+fh-19,w-16,2);
      for(let bx=12;bx<w-12;bx+=8)g.fillRect(bx,y+fh-18,2,10);
    }
    const sy=h-shopH;
    if(!shop){
      g.fillStyle=shade(col,-.12);g.fillRect(0,sy,w,shopH);g.fillStyle=shade(col,-.3);g.fillRect(0,sy,w,4);
      g.fillStyle='#3a2a22';g.fillRect(w/2-16,sy+12,32,shopH-12);g.fillStyle='rgba(255,220,150,.5)';g.fillRect(w/2-12,sy+16,24,8);
      for(const x of[22,70,154,202]){g.fillStyle='#3a3148';g.fillRect(x-12,sy+14,24,22);g.fillStyle=shade(col,-.4);for(let i=0;i<4;i++)g.fillRect(x-12+i*7,sy+14,2,22);}
    }else{
    g.fillStyle='#231b30';g.fillRect(0,sy,w,shopH);
    g.fillStyle='rgba(255,207,122,.85)';g.fillRect(14,sy+20,w*.55,shopH-24);
    g.fillStyle='#3a2f48';g.fillRect(w*.66,sy+18,w*.22,shopH-18);
    const step=w*.55/12;
    for(let i=0;i<12;i++){g.fillStyle=i%2?aw:'#efe7dc';const x0=14+i*step;g.beginPath();g.moveTo(x0,sy+18);g.lineTo(x0+step,sy+18);g.lineTo(x0+step+2,sy+28);g.lineTo(x0+2,sy+28);g.fill();}
    g.fillStyle='#16111f';g.fillRect(10,sy+2,w-20,16);
    g.fillStyle='#f4eee6';g.font='bold 12px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(name,w/2,sy+10);}
  });
}
export function treeSprite(R){
  return mk(170,230,g=>{
    g.fillStyle='#7c715f';g.fillRect(78,120,14,110);
    g.fillStyle='#a49a86';g.fillRect(82,140,4,20);g.fillRect(84,182,3,14);
    const greens=['#2c4436','#3a5641','#4b6a4c','#5d7c55'];
    for(let i=0;i<26;i++){g.fillStyle=pick(R,greens);const a=R()*Math.PI*2,d=R()*50;g.beginPath();g.arc(85+Math.cos(a)*d*1.1,80+Math.sin(a)*d*.8,22+R()*16,0,Math.PI*2);g.fill();}
  });
}
export function lampSprite(flip){
  return mk(80,300,g=>{
    if(flip){g.translate(80,0);g.scale(-1,1);}
    const gr=g.createRadialGradient(19,36,2,19,36,34);gr.addColorStop(0,'rgba(255,226,160,.9)');gr.addColorStop(1,'rgba(255,226,160,0)');
    g.fillStyle=gr;g.beginPath();g.arc(19,36,34,0,Math.PI*2);g.fill();
    g.fillStyle='#2a2533';g.fillRect(60,30,6,270);
    g.strokeStyle='#2a2533';g.lineWidth=5;g.beginPath();g.moveTo(63,34);g.quadraticCurveTo(60,16,30,22);g.lineTo(18,28);g.stroke();
    g.fillStyle='#fff1c9';rr(g,6,30,26,8,3);g.fill();
  });
}
export function catSprite(c){
  return mk(60,50,g=>{
    g.fillStyle=c;g.beginPath();g.ellipse(30,36,16,12,0,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(30,18,10,0,Math.PI*2);g.fill();
    g.beginPath();g.moveTo(21,13);g.lineTo(23,2);g.lineTo(28,10);g.fill();
    g.beginPath();g.moveTo(39,13);g.lineTo(37,2);g.lineTo(32,10);g.fill();
    g.strokeStyle=c;g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(44,42);g.quadraticCurveTo(58,40,54,24);g.stroke();
  });
}
export function cartSprite(){
  return mk(140,130,g=>{
    g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(70,124,60,6,0,0,Math.PI*2);g.fill();
    g.fillStyle='#8a2a2c';g.fillRect(10,14,120,8);
    g.fillStyle='rgba(246,231,200,.6)';g.fillRect(16,22,108,42);
    g.strokeStyle='#8a2a2c';g.lineWidth=3;g.strokeRect(16,22,108,42);
    g.strokeStyle='#b8743a';g.lineWidth=6;
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){g.beginPath();g.arc(36+i*34,34+j*18,8,0,Math.PI*2);g.stroke();}
    g.fillStyle='#c4373a';rr(g,10,64,120,44,6);g.fill();
    g.fillStyle='#f4eee6';g.font='bold 15px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('SİMİT',70,86);
    g.fillStyle='#15111a';g.beginPath();g.arc(32,112,12,0,Math.PI*2);g.arc(108,112,12,0,Math.PI*2);g.fill();
  });
}
export function gateSprite(){
  return mk(440,240,g=>{
    g.fillStyle='#2a2533';g.fillRect(12,40,10,200);g.fillRect(418,40,10,200);
    g.fillStyle='#ffc61a';rr(g,6,24,428,62,8);g.fill();
    g.fillStyle='#120d22';g.font='bold 40px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('TESLİMAT',220,57);
    for(let i=0;i<22;i++){g.fillStyle=i%2?'#120d22':'#f4eee6';g.fillRect(6+i*19.5,86,19.6,10);}
  });
}
export function mosque(g,x,y,s,m){m=m||2;
  g.beginPath();g.arc(x,y-30*s,26*s,Math.PI,0);g.fill();
  g.fillRect(x-30*s,y-30*s,60*s,30*s);
  g.beginPath();g.arc(x-34*s,y-16*s,14*s,Math.PI,0);g.fill();
  g.beginPath();g.arc(x+34*s,y-16*s,14*s,Math.PI,0);g.fill();
  g.fillRect(x-50*s,y-16*s,100*s,16*s);
  g.fillRect(x-1,y-64*s,2,10*s);
  const ms=[];for(let i=0;i<m/2;i++)ms.push(x-(62+20*i)*s,x+(62+20*i)*s);
  for(const mx of ms){
    const mh=(Math.abs(mx-x)>70*s?72:88)*s;
    g.fillRect(mx-2.5*s,y-mh,5*s,mh);
    g.beginPath();g.moveTo(mx-3*s,y-mh);g.lineTo(mx,y-mh-16*s);g.lineTo(mx+3*s,y-mh);g.fill();
    g.fillRect(mx-4*s,y-mh*.62,8*s,2*s);
  }
}
export function bridge(g,bx,span,by,s){
  const th=72*s;
  g.fillStyle=G.TH.water;g.fillRect(bx-110*s,by-6,span+220*s,14);
  g.fillStyle=G.FARC;g.strokeStyle=G.FARC;
  g.fillRect(bx-3,by-th,6,th);g.fillRect(bx+span-3,by-th,6,th);
  g.fillRect(bx-120*s,by-14,span+240*s,4);
  g.lineWidth=1.6;
  g.beginPath();g.moveTo(bx,by-th+2);g.quadraticCurveTo(bx+span/2,by-6,bx+span,by-th+2);g.stroke();
  g.beginPath();g.moveTo(bx,by-th+2);g.quadraticCurveTo(bx-60*s,by-30,bx-120*s,by-14);g.stroke();
  g.beginPath();g.moveTo(bx+span,by-th+2);g.quadraticCurveTo(bx+span+60*s,by-30,bx+span+120*s,by-14);g.stroke();
  g.lineWidth=.7;
  for(let i=1;i<12;i++){const t=i/12,cx=bx+span*t,cy=(1-t)*(1-t)*(by-th+2)+2*(1-t)*t*(by-6)+t*t*(by-th+2);g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,by-12);g.stroke();}
}
export function galata(g,x,y,s){
  g.fillRect(x-10*s,y-58*s,20*s,58*s);g.fillRect(x-12*s,y-62*s,24*s,5*s);
  g.beginPath();g.moveTo(x-11*s,y-62*s);g.lineTo(x,y-88*s);g.lineTo(x+11*s,y-62*s);g.fill();
  const f=g.fillStyle;g.fillStyle=G.TH.win[0];for(let i=0;i<3;i++)g.fillRect(x-6*s+i*5*s,y-52*s,2*s,3*s);g.fillStyle=f;
}
export function maiden(g,x,y){
  g.beginPath();g.ellipse(x,y,26,5,0,0,Math.PI*2);g.fill();
  g.fillRect(x-14,y-14,28,12);g.fillRect(x-5,y-34,10,22);g.fillRect(x+8,y-22,6,10);
  g.beginPath();g.moveTo(x-6,y-34);g.lineTo(x,y-46);g.lineTo(x+6,y-34);g.fill();
}
export function aqueduct(g,x0,x1,y){
  g.fillRect(x0,y-46,x1-x0,46);
  g.save();g.globalCompositeOperation='destination-out';
  for(let x=x0+6;x<x1-14;x+=22){
    g.beginPath();g.moveTo(x,y);g.lineTo(x,y-16);g.arc(x+7,y-16,7,Math.PI,0);g.lineTo(x+14,y);g.closePath();g.fill();
    g.beginPath();g.moveTo(x,y-26);g.lineTo(x,y-32);g.arc(x+7,y-32,7,Math.PI,0);g.lineTo(x+14,y-26);g.closePath();g.fill();
  }
  g.restore();
}
export function makeFar(kind){
  return mk(1200,160,(g,w,h)=>{
    const base=h-4,hy=x=>base-18-14*Math.sin(x/w*Math.PI*6)-9*Math.sin(x/w*Math.PI*14+1);
    g.fillStyle=G.FARC;
    if(kind==='towers'){
      const fy=x=>base-12-5*Math.sin(x/w*Math.PI*4);
      g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=10)g.lineTo(x,fy(x));g.lineTo(w,h);g.closePath();g.fill();
      const R=rng(9);
      for(let x=6;x<w-20;x+=16+R()*26){
        const th=34+R()*96,tw=14+R()*22,y=fy(x);
        g.fillStyle=G.FARC;g.fillRect(x,y-th,tw,th+12);if(R()<.3)g.fillRect(x+tw/2-1,y-th-16,2,16);
        for(let yy=y-th+5;yy<y-4;yy+=7)for(let xx=x+3;xx<x+tw-3;xx+=5)if(R()<.22){g.fillStyle=G.TH.win[R()<.5?0:1];g.fillRect(xx,yy,2,3);}
      }
      return;
    }
    if(kind==='kizkulesi'){
      g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=10)g.lineTo(x,hy(x)-6);g.lineTo(w,h);g.closePath();g.fill();
      mosque(g,180,hy(180)-6,1.1,6);mosque(g,420,hy(420)-6,.8,4);mosque(g,880,hy(880)-6,.9,4);galata(g,1080,hy(1080)-6,.8);
      g.fillStyle=G.TH.water;g.fillRect(0,base-16,w,20);g.fillStyle=G.FARC;maiden(g,560,base-8);
      return;
    }
    g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=10)g.lineTo(x,hy(x));g.lineTo(w,h);g.closePath();g.fill();
    if(kind==='bridge'){bridge(g,300,240,base-8,1);g.fillStyle=G.FARC;mosque(g,140,hy(140),1,4);mosque(g,650,hy(650),.8,2);mosque(g,1030,hy(1030),.6,2);galata(g,860,hy(860),1);}
    else if(kind==='galata'){mosque(g,250,hy(250),1.2,4);galata(g,620,hy(620),1.7);mosque(g,960,hy(960),.9,2);}
    else if(kind==='ortakoy'){bridge(g,330,420,base-8,1.4);g.fillStyle=G.FARC;mosque(g,450,base-10,.7,2);mosque(g,1000,hy(1000),.7,2);}
    else if(kind==='peninsula'){aqueduct(g,60,520,hy(290)+4);mosque(g,720,hy(720),1.4,4);mosque(g,1020,hy(1020),1.1,6);}
  });
}
export function makeNear(){
  return mk(1200,120,(g,w,h)=>{
    const R=rng(77);let x=0;
    while(x<w){
      const bw=40+R()*70,bh=36+R()*72;
      g.fillStyle=G.NEARC;g.fillRect(x,h-bh,bw,bh);g.fillRect(x+bw*.2,h-bh-6,8,6);
      for(let wy=h-bh+8;wy<h-8;wy+=12)for(let wx=x+6;wx<x+bw-8;wx+=11)if(R()<.08+G.TH.lit*.4){g.fillStyle=R()<.8?G.TH.win[0]:G.TH.win[1];g.fillRect(wx,wy,4,5);}
      x+=bw+2+R()*6;
    }
  });
}
export function woodSprite(R){
  const floors=2+Math.floor(R()*2),fh=44,w=200,roofH=26,shopH=36,h=roofH+floors*fh+shopH;
  const col=pick(R,['#c96f4a','#e3b04b','#7aa0a8','#b5654f','#e8d8b8','#8a6d9c','#9c4a3c']);
  return mk(w,h,g=>{
    g.fillStyle='#8a3b2c';g.beginPath();g.moveTo(0,roofH+2);g.lineTo(20,4);g.lineTo(w-20,4);g.lineTo(w,roofH+2);g.closePath();g.fill();
    g.fillStyle=col;g.fillRect(0,roofH,w,h-roofH);
    g.fillStyle=shade(col,-.12);for(let y=roofH+6;y<h-shopH;y+=7)g.fillRect(0,y,w,1.5);
    g.fillStyle=shade(col,.1);g.fillRect(40,roofH+4,120,floors*fh-8);
    g.fillStyle=shade(col,-.35);g.fillRect(36,roofH+floors*fh-6,128,7);
    for(let f=0;f<floors;f++){const y=roofH+10+f*fh;
      for(const x of[10,50,89,128,168]){const lit=R()<G.TH.lit;g.fillStyle='#f4eee6';g.fillRect(x-2,y-2,26,32);g.fillStyle=lit?G.TH.win[0]:'#3a3148';g.fillRect(x,y,22,28);g.fillStyle='#f4eee6';g.fillRect(x+10,y,2,28);}}
    const sy=h-shopH;g.fillStyle=shade(col,-.35);g.fillRect(0,sy,w,shopH);
    g.fillStyle='#5a3a2a';g.fillRect(80,sy+6,40,shopH-6);
    g.globalAlpha=.7;g.fillStyle=G.TH.win[0];g.fillRect(14,sy+10,52,18);g.fillRect(134,sy+10,52,18);g.globalAlpha=1;
  });
}
export function towerSprite(R){
  const floors=10+Math.floor(R()*10),fh=16,w=220,h=floors*fh+64;
  const col=pick(R,['#2a3550','#36324a','#1f3a48','#3b2f4f']);
  return mk(w,h,g=>{
    g.fillStyle=col;g.fillRect(0,22,w,h-22);
    for(let f=0;f<floors;f++)for(let c=0;c<10;c++){const lit=R()<G.TH.lit;g.fillStyle=lit?(R()<.7?G.TH.win[0]:G.TH.win[1]):shade(col,-.3);g.fillRect(8+c*21,28+f*fh,15,10);}
    g.fillStyle='#120d22';g.fillRect(0,h-40,w,40);
    g.fillStyle=pick(R,['#ff7ad9','#7ff0ff','#ffc61a']);g.fillRect(20,h-34,w-40,6);
    g.fillStyle=pick(R,['#ff7ad9','#7ff0ff']);g.fillRect(w/2-50,4,100,14);
  });
}
export function minivanSprite(){
  const w=160,h=150;
  return mk(w,h,g=>{
    const bot=h-4;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(w/2,bot-2,w*.47,7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#141018';g.fillRect(16,bot-22,26,20);g.fillRect(w-42,bot-22,26,20);
    g.fillStyle='#1d1726';g.fillRect(22,6,w-44,3);g.fillRect(22,6,5,9);g.fillRect(w-27,6,5,9);
    g.fillStyle='#eef0f2';rr(g,10,14,w-20,bot-28,14);g.fill();
    g.fillStyle='#2b3047';rr(g,24,24,w-48,46,6);g.fill();
    g.fillStyle='rgba(255,255,255,.18)';g.fillRect(30,28,40,5);
    g.fillStyle='#ff3b3b';rr(g,11,24,10,54,3);g.fill();rr(g,w-21,24,10,54,3);g.fill();
    g.fillStyle='#b9bec6';g.fillRect(w/2-1,74,2,50);
    g.fillStyle='#f4eee6';g.fillRect(w/2-26,bot-42,52,14);g.fillStyle='#2a4fd6';g.fillRect(w/2-26,bot-42,7,14);
    g.fillStyle='#120d22';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('34 HK 20',w/2+3,bot-34.5);
    g.fillStyle='#2a2733';g.fillRect(10,bot-22,w-20,9);
  });
}
export function sedan80Sprite(col,mod){
  const w=160,h=112;
  return mk(w,h,g=>{
    const bot=h-4,bt=h*.46;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(w/2,bot-2,w*.47,7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#141018';g.fillRect(14,bot-22,28,20);g.fillRect(w-42,bot-22,28,20);
    if(mod){g.fillStyle='#c4c8d2';g.fillRect(22,bot-16,12,8);g.fillRect(w-34,bot-16,12,8);}
    g.fillStyle=shade(col,-.12);g.beginPath();g.moveTo(30,bt);g.lineTo(40,h*.16);g.lineTo(w-40,h*.16);g.lineTo(w-30,bt);g.closePath();g.fill();
    g.fillStyle=mod?'#0c0a10':'#2b3047';g.beginPath();g.moveTo(38,bt-3);g.lineTo(46,h*.2);g.lineTo(w-46,h*.2);g.lineTo(w-38,bt-3);g.closePath();g.fill();
    g.fillStyle=col;g.fillRect(6,bt,w-12,bot-14-bt);
    g.fillStyle='#ff3b3b';g.fillRect(10,bt+8,40,12);g.fillRect(w-50,bt+8,40,12);
    g.fillStyle='#ffa31a';g.fillRect(10,bt+8,12,12);g.fillRect(w-22,bt+8,12,12);
    g.fillStyle='#1d1726';g.fillRect(50,bt+8,w-100,12);
    g.fillStyle='#f4eee6';g.fillRect(w/2-26,bt+24,52,14);g.fillStyle='#2a4fd6';g.fillRect(w/2-26,bt+24,7,14);
    g.fillStyle='#120d22';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(mod?'34 BR 61':'34 KL 88',w/2+3,bt+31.5);
    g.fillStyle='#b8bcc6';g.fillRect(6,bot-18,w-12,6);
    if(mod){g.fillStyle='#1d1726';g.fillRect(14,bt-8,w-28,5);g.fillRect(20,bt-8,5,10);g.fillRect(w-25,bt-8,5,10);}
  });
}
export function dolmusSprite(){
  const v=carSprite('#f2c230','van');
  return mk(v.width/SS,v.height/SS,g=>{
    g.drawImage(v,0,0,v.width/SS,v.height/SS);
    for(let i=0;i<18;i++)for(let r=0;r<2;r++){g.fillStyle=(i+r)%2?'#120d22':'#f4eee6';g.fillRect(8+i*8,88+r*5,8,5);}
    g.fillStyle='#120d22';g.fillRect(40,3,80,15);
    g.fillStyle='#f2c230';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('DOLMUŞ',80,11);
  });
}
export function ambSprite(){
  const v=carSprite('#f4f4f2','van');
  return mk(v.width/SS,v.height/SS,g=>{
    g.drawImage(v,0,0,v.width/SS,v.height/SS);
    g.fillStyle='#d8343a';g.fillRect(8,88,v.width/SS-16,10);
    g.font='bold 15px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('112',80,107);
    g.fillStyle='#2a2533';g.fillRect(44,7,72,11);
  });
}
export function hurdaSprite(col){
  const w=160,h=150;
  return mk(w,h,g=>{
    const bot=h-4;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(w/2,bot-2,w*.47,7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#141018';g.fillRect(16,bot-22,26,20);g.fillRect(w-42,bot-22,26,20);
    g.fillStyle=shade(col,-.15);rr(g,40,40,80,40,8);g.fill();g.fillStyle='#2b3047';g.fillRect(50,46,60,16);
    g.save();g.translate(52,26);g.rotate(-.15);g.fillStyle='#e8e4dc';g.fillRect(0,0,30,46);g.fillStyle='#b9b4aa';g.fillRect(3,20,24,2);g.restore();
    g.fillStyle='#2a6fb0';rr(g,96,32,26,40,4);g.fill();
    g.strokeStyle='#8a5a2a';g.lineWidth=6;g.beginPath();g.moveTo(20,70);g.lineTo(70,20);g.moveTo(88,74);g.lineTo(140,28);g.stroke();
    g.fillStyle='#16131a';g.beginPath();g.ellipse(126,64,14,10,0,0,Math.PI*2);g.fill();
    g.strokeStyle='#5d6470';g.lineWidth=3;g.beginPath();g.moveTo(28,66);g.lineTo(28,42);g.lineTo(44,42);g.lineTo(44,66);g.stroke();
    g.fillStyle=col;g.fillRect(8,70,w-16,bot-84);
    g.fillStyle=shade(col,-.25);g.fillRect(8,70,w-16,5);
    g.fillStyle='rgba(120,60,30,.5)';g.fillRect(22,92,18,8);g.fillRect(110,102,24,6);
    g.fillStyle='#ff3b3b';g.fillRect(10,78,16,14);g.fillRect(w-26,78,16,14);
    g.fillStyle='#f4eee6';g.fillRect(w/2-26,bot-40,52,14);g.fillStyle='#2a4fd6';g.fillRect(w/2-26,bot-40,7,14);
    g.fillStyle='#120d22';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('34 HR 07',w/2+3,bot-32.5);
    g.fillStyle='#5a5560';g.fillRect(8,bot-20,w-16,8);
  });
}
export function junkSprite(v){
  return mk(90,70,g=>{
    g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(45,64,38,5,0,0,Math.PI*2);g.fill();
    if(v===0){g.fillStyle='#16131a';g.beginPath();g.ellipse(45,40,34,26,0,0,Math.PI*2);g.fill();g.fillStyle='#3a3540';g.beginPath();g.ellipse(45,40,16,12,0,0,Math.PI*2);g.fill();g.fillStyle='#0b090e';g.beginPath();g.ellipse(45,40,10,7,0,0,Math.PI*2);g.fill();}
    else if(v===1){g.fillStyle='#b8864a';g.fillRect(14,18,62,46);g.fillStyle='#9a6e38';g.fillRect(14,18,62,10);g.fillStyle='#d9c08a';g.fillRect(40,18,10,46);}
    else{g.fillStyle='#2a6fb0';g.beginPath();g.moveTo(22,20);g.lineTo(68,20);g.lineTo(62,64);g.lineTo(28,64);g.closePath();g.fill();g.fillStyle='#1d4f80';g.fillRect(20,16,50,6);}
  });
}
export function coneSprite(){return mk(40,60,g=>{g.fillStyle='#1d1726';g.fillRect(4,52,32,8);g.fillStyle='#f08a4b';g.beginPath();g.moveTo(20,2);g.lineTo(32,54);g.lineTo(8,54);g.closePath();g.fill();g.fillStyle='#f4eee6';g.fillRect(12,26,16,7);});}
export function barrierSprite(){
  return mk(200,100,g=>{
    g.fillStyle='#2a2533';g.fillRect(20,40,8,60);g.fillRect(172,40,8,60);
    for(let i=0;i<11;i++){g.fillStyle=i%2?'#d8343a':'#f4eee6';g.beginPath();g.moveTo(i*20,30);g.lineTo(i*20+20,30);g.lineTo(i*20+10,60);g.lineTo(i*20-10,60);g.fill();}
    g.fillStyle='#ffa31a';g.beginPath();g.arc(100,18,9,0,Math.PI*2);g.fill();
  });
}
export function wsignSprite(){
  return mk(90,200,g=>{
    g.fillStyle='#2a2533';g.fillRect(42,80,6,120);
    g.save();g.translate(45,45);g.rotate(Math.PI/4);g.fillStyle='#f08a4b';g.fillRect(-30,-30,60,60);g.strokeStyle='#120d22';g.lineWidth=3;g.strokeRect(-26,-26,52,52);g.restore();
    g.fillStyle='#120d22';g.textAlign='center';g.textBaseline='middle';g.font='bold 11px sans-serif';g.fillText('YOL',45,40);g.font='bold 8px sans-serif';g.fillText('ÇALIŞMASI',45,52);
  });
}
export function restSprite(name){
  const w=260,h=230,R=rng(name.length*977+name.charCodeAt(0)),col=pick(R,FACADES);
  return mk(w,h,g=>{
    g.fillStyle=col;g.fillRect(0,20,w,h-20);g.fillStyle=shade(col,-.3);g.fillRect(0,20,w,5);
    for(let f=0;f<2;f++)for(let c=0;c<4;c++){const x=18+c*60,y=34+f*42;g.fillStyle=shade(col,-.35);g.fillRect(x-2,y-2,40,30);g.fillStyle=R()<G.TH.lit?G.TH.win[0]:'#3a3148';g.fillRect(x,y,36,26);}
    const sy=120;
    g.fillStyle='#1d1626';g.fillRect(0,sy,w,h-sy);
    g.fillStyle='#c4373a';g.fillRect(6,sy+4,w-12,30);
    let fs=20;g.font='bold '+fs+'px sans-serif';while(g.measureText(name).width>w-28&&fs>10){fs--;g.font='bold '+fs+'px sans-serif';}
    g.fillStyle='#f4eee6';g.textAlign='center';g.textBaseline='middle';g.fillText(name,w/2,sy+19);
    const st=(w-12)/14;for(let i=0;i<14;i++){g.fillStyle=i%2?'#c4373a':'#efe7dc';g.beginPath();g.moveTo(6+i*st,sy+34);g.lineTo(6+(i+1)*st,sy+34);g.lineTo(8+(i+1)*st,sy+46);g.lineTo(8+i*st,sy+46);g.fill();}
    g.fillStyle='rgba(255,207,122,.9)';g.fillRect(16,sy+50,150,h-sy-56);
    g.fillStyle='rgba(60,30,30,.5)';for(const x of[40,80,120]){g.beginPath();g.arc(x,sy+78,9,0,Math.PI*2);g.fill();g.fillRect(x-11,sy+86,22,20);}
    g.fillStyle='#3a2f48';g.fillRect(180,sy+50,62,h-sy-50);g.fillStyle='rgba(255,207,122,.6)';g.fillRect(188,sy+58,46,30);
  });
}
export function destSprite(){
  const R=rng((Math.random()*1e9)|0),floors=4+Math.floor(R()*3),fh=34,w=240,roofH=24,gh=56,top=72,h=top+roofH+floors*fh+gh,col=pick(R,FACADES);
  return mk(w,h,g=>{
    g.fillStyle=col;g.fillRect(0,top+roofH,w,h-top-roofH);g.fillStyle=shade(col,-.3);g.fillRect(0,top+roofH,w,5);
    for(let f=0;f<floors;f++)for(let c=0;c<4;c++){const x=16+c*56,y=top+roofH+8+f*fh;g.fillStyle=shade(col,-.35);g.fillRect(x-2,y-2,36,24);g.fillStyle=R()<G.TH.lit?G.TH.win[0]:'#3a3148';g.fillRect(x,y,32,20);}
    const sy=h-gh;g.fillStyle=shade(col,-.15);g.fillRect(0,sy,w,gh);
    g.fillStyle='#ffd58a';g.fillRect(w/2-22,sy+6,44,gh-6);g.fillStyle='#3a2a22';g.fillRect(w/2-18,sy+12,36,gh-12);g.fillStyle='rgba(255,213,138,.6)';g.fillRect(w/2-14,sy+16,28,10);
    g.fillStyle='#2a4fd6';g.fillRect(w/2+28,sy+10,30,14);g.fillStyle='#f4eee6';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('No 7',w/2+43,sy+17.5);
    const px=w/2,py=8;g.fillStyle='#f08a4b';g.beginPath();g.moveTo(px-22,py+26);g.lineTo(px,py+66);g.lineTo(px+22,py+26);g.closePath();g.fill();
    g.beginPath();g.arc(px,py+24,22,0,Math.PI*2);g.fill();g.fillStyle='#f4eee6';g.beginPath();g.arc(px,py+24,9,0,Math.PI*2);g.fill();
  });
}
export function luxSprite(){
  const w=170,h=140;
  return mk(w,h,g=>{
    const bot=h-4;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(w/2,bot-2,w*.47,7,0,0,Math.PI*2);g.fill();
    g.fillStyle='#141018';g.fillRect(16,bot-26,30,24);g.fillRect(w-46,bot-26,30,24);
    g.fillStyle='#2a2733';g.fillRect(28,14,w-56,4);
    g.fillStyle='#121016';rr(g,10,20,w-20,bot-34,12);g.fill();
    g.fillStyle='#050408';rr(g,24,30,w-48,40,6);g.fill();
    g.fillStyle='rgba(255,255,255,.1)';g.fillRect(30,34,50,4);
    g.fillStyle='#b8bcc6';g.fillRect(10,78,w-20,3);
    g.fillStyle='#ff2a2a';g.fillRect(14,86,w-28,5);g.fillStyle='#ff5a5a';g.fillRect(14,83,26,11);g.fillRect(w-40,83,26,11);
    g.fillStyle='#f4eee6';g.fillRect(w/2-26,100,52,14);g.fillStyle='#2a4fd6';g.fillRect(w/2-26,100,7,14);
    g.fillStyle='#120d22';g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('34 AB 01',w/2+3,107.5);
    g.fillStyle='#1d1a22';g.fillRect(10,bot-18,w-20,8);
  });
}
export function vipSprite(lit){
  const v=carSprite('#18161e','van');
  return mk(v.width/SS,v.height/SS,g=>{
    g.drawImage(v,0,0,v.width/SS,v.height/SS);
    g.fillStyle='#18161e';g.fillRect(8,88,144,10);
    if(lit){g.fillStyle='rgba(255,240,160,.45)';g.beginPath();g.ellipse(80,11.5,36,12,0,0,Math.PI*2);g.fill();}
    g.fillStyle=lit?'#fff1a8':'#9a8a4a';g.fillRect(56,5,48,13);g.fillStyle='#120d22';g.font='bold 9px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('TAKSİ',80,11.5);
    g.fillStyle='#d9b45a';g.font='bold 11px sans-serif';g.fillText('VIP',80,93);
  });
}
export function villaSprite(R){
  const w=240,h=200,col=pick(R,['#efe9df','#e6dccb','#d9d4c7','#f2eee6']),roof=pick(R,['#5a3a32','#3a3440','#7a4a3a']);
  return mk(w,h,g=>{
    g.fillStyle='#2f4a36';g.beginPath();g.ellipse(26,92,18,70,0,0,Math.PI*2);g.fill();g.beginPath();g.ellipse(214,98,16,62,0,0,Math.PI*2);g.fill();
    g.fillStyle=roof;g.beginPath();g.moveTo(40,62);g.lineTo(120,22);g.lineTo(200,62);g.closePath();g.fill();
    g.fillStyle=col;g.fillRect(50,60,140,96);
    for(let f=0;f<2;f++)for(let c=0;c<3;c++){const x=62+c*42,y=70+f*42;g.fillStyle=R()<G.TH.lit?G.TH.win[0]:'#3a3148';g.fillRect(x,y,30,30);g.fillStyle=col;g.fillRect(x+14,y,2,30);}
    g.fillStyle='#b8ad9c';g.fillRect(0,150,w,50);g.fillStyle='#a19583';for(let x=0;x<w;x+=24)g.fillRect(x,150,22,4);
    g.fillStyle='#2a2533';g.fillRect(100,158,40,42);g.strokeStyle='#5d6470';g.lineWidth=2;for(let x=104;x<140;x+=6){g.beginPath();g.moveTo(x,158);g.lineTo(x,200);g.stroke();}
  });
}
export function histSprite(R){
  const floors=3+Math.floor(R()*2),fh=40,w=240,h=30+floors*fh+56,col=pick(R,['#cdb48e','#c9a27a','#b9a78a','#d8c3a0','#a88e74']);
  return mk(w,h,g=>{
    g.fillStyle=shade(col,-.25);g.fillRect(0,18,w,14);g.fillStyle=col;g.fillRect(0,30,w,h-30);
    for(let f=0;f<floors;f++){const y=38+f*fh;
      for(let c=0;c<4;c++){const x=18+c*56;
        g.fillStyle=shade(col,-.3);g.beginPath();g.moveTo(x-2,y+30);g.lineTo(x-2,y+10);g.arc(x+15,y+10,17,Math.PI,0);g.lineTo(x+32,y+30);g.closePath();g.fill();
        g.fillStyle=R()<G.TH.lit?G.TH.win[0]:'#3a3148';g.beginPath();g.moveTo(x,y+30);g.lineTo(x,y+10);g.arc(x+15,y+10,15,Math.PI,0);g.lineTo(x+30,y+30);g.closePath();g.fill();}
      g.fillStyle=shade(col,-.18);g.fillRect(0,y+fh-6,w,4);}
    const sy=h-56;g.fillStyle=shade(col,-.12);g.fillRect(0,sy,w,56);
    g.fillStyle='#3a2a22';g.beginPath();g.moveTo(w/2-22,h);g.lineTo(w/2-22,sy+22);g.arc(w/2,sy+22,22,Math.PI,0);g.lineTo(w/2+22,h);g.closePath();g.fill();
    for(const x of[30,170]){g.fillStyle=R()<.5?'rgba(255,207,122,.8)':'#3a3148';g.fillRect(x,sy+14,40,30);}
  });
}
export function railSprite(){return mk(200,60,g=>{g.fillStyle='#d9d4cc';g.fillRect(4,10,8,50);g.fillRect(188,10,8,50);g.fillRect(0,8,200,7);g.fillRect(0,30,200,4);});}
export function ferrySprite(){
  return mk(320,150,g=>{
    g.fillStyle='#f4eee6';g.beginPath();g.moveTo(10,100);g.lineTo(310,100);g.lineTo(290,130);g.lineTo(30,130);g.closePath();g.fill();
    g.fillStyle='#1d1726';g.fillRect(30,118,260,6);
    g.fillStyle='#f4eee6';g.fillRect(50,62,220,40);g.fillRect(80,36,160,28);
    g.fillStyle='#2b3047';for(let i=0;i<9;i++)g.fillRect(60+i*23,72,14,12);for(let i=0;i<6;i++)g.fillRect(92+i*24,44,14,10);
    g.fillStyle='#1d1726';g.fillRect(150,8,22,30);g.fillStyle='#c4373a';g.fillRect(150,14,22,8);
    g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,132,320,4);
  });
}
export function stopSprite(){
  return mk(220,190,g=>{
    g.fillStyle='#2a2533';g.fillRect(14,30,6,160);g.fillRect(196,30,6,160);
    g.fillStyle='#3a6fb0';g.fillRect(4,22,212,14);
    g.fillStyle='rgba(180,220,255,.25)';g.fillRect(24,40,170,110);
    g.fillStyle='#ffc61a';rr(g,150,2,64,22,4);g.fill();
    g.fillStyle='#120d22';g.font='bold 12px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('DURAK',182,13);
    g.fillStyle='#2a2533';g.fillRect(40,150,140,6);
    const P=(x,c,hh)=>{g.fillStyle=c;g.beginPath();g.arc(x,190-hh-8,8,0,Math.PI*2);g.fill();rr(g,x-9,190-hh,18,hh,6);g.fill();};
    P(60,'#4a3b5c',62);P(100,'#7a3c3c',70);P(150,'#2f5a4a',56);
  });
}
export function signSprite(){
  return mk(80,200,g=>{
    g.fillStyle='#2a2533';g.fillRect(37,60,6,140);
    g.fillStyle='#f4eee6';g.beginPath();g.moveTo(40,4);g.lineTo(76,66);g.lineTo(4,66);g.closePath();g.fill();
    g.fillStyle='#c4373a';g.beginPath();g.moveTo(40,12);g.lineTo(68,61);g.lineTo(12,61);g.closePath();g.fill();
    g.fillStyle='#f4eee6';g.beginPath();g.moveTo(40,24);g.lineTo(60,56);g.lineTo(20,56);g.closePath();g.fill();
    g.fillStyle='#120d22';g.beginPath();g.arc(40,55,9,Math.PI,0);g.fill();
  });
}
export const SPR={},BIKESPR={},BSETS={},FARS={},NEARS={};G.FAR=undefined;G.NEAR=undefined;
export function bset(style){
  const key=style+'_'+G.DIS.theme;if(BSETS[key])return BSETS[key];
  const R=rng(2024+DISTRICTS.indexOf(G.DIS)*131+style.length*7),f={wood:woodSprite,plaza:towerSprite,villa:villaSprite,hist:histSprite}[style]||buildingSprite,ww=style==='wood'?2000:style==='villa'?2200:2600;
  return BSETS[key]=Array.from({length:8},()=>def(f(R),ww));
}
export function setTheme(D){
  if(!G.DIS||G.DIS.theme!==D.theme)for(const k in BSETS)delete BSETS[k];
  G.DIS=D;G.TH=THEMES[D.theme];G.roadW=D.roadW||2000;G.FOG=G.TH.fog;G.FARC=G.TH.far;G.NEARC=G.TH.near;G.PAL=pal(G.TH);
  G.FAR=FARS[D.far+D.theme]||(FARS[D.far+D.theme]=makeFar(D.far));
  G.NEAR=NEARS[D.theme]||(NEARS[D.theme]=makeNear());
  buildGrads();
}
export function bikeSprites(b,w){w=w||'kick';const key=b.id+w;return BIKESPR[key]||(BIKESPR[key]=[-1,0,1].map(k=>bikeSprite({kick:k,box:b.box,jacket:b.jacket,helmet:b.helmet,label:b.lbl,wpn:w})));}
export function initSprites(){
  const R=rng(2024);
  SPR.rail=def(railSprite(),620);SPR.ferry=def(ferrySprite(),3400);SPR.durak=def(stopSprite(),1100);
  SPR.sign=def(signSprite(),420,{solid:true,hit:.04,msg:'Tabelaya çarptın'});
  SPR.trees=[0,1,2].map(()=>def(treeSprite(R),1150,{solid:true,hit:.05,msg:'Çınara çarptın'}));
  SPR.lampR=def(lampSprite(false),380,{solid:true,hit:.05,msg:'Direğe çarptın'});
  SPR.lampL=def(lampSprite(true),380,{solid:true,hit:.05,msg:'Direğe çarptın'});
  SPR.cats=['#d9893e','#1d1a20','#e8e2da'].map(c=>def(catSprite(c),220));
  SPR.cart=def(cartSprite(),620,{solid:true,hit:.15,msg:'Simitçiye çarptın'});
  SPR.gate=def(gateSprite(),4600);
  SPR.cars=CAR_COLORS.map(c=>def(carSprite(c,'car'),760,{by:.47}));
  SPR.taxiY=[true,false].map(l=>def(carSprite('#ffc61a','taxi',l),760,{by:.48}));
  SPR.taxiT=[true,false].map(l=>def(carSprite('#27b7b0','taxi',l),760,{by:.48}));
  SPR.taxiV=[true,false].map(l=>def(vipSprite(l),820,{by:.38}));
  SPR.lux=def(luxSprite(),840,{by:.37});
  SPR.van=def(carSprite('#d9dde0','van'),820,{by:.38});
  SPR.bus=def(carSprite('#f2b705','bus'),900,{by:.38});
  SPR.cone=def(coneSprite(),220);SPR.barrier=def(barrierSprite(),1100);SPR.wsign=def(wsignSprite(),420);
  SPR.dolmus=def(dolmusSprite(),820,{by:.38});
  SPR.amb=def(ambSprite(),820,{by:.38});
  SPR.hurda=[def(hurdaSprite('#5a7a9a'),800,{by:.43}),def(hurdaSprite('#b8a888'),800,{by:.43})];
  SPR.junk=[0,1,2].map(v=>def(junkSprite(v),300));
  SPR.hafif=def(minivanSprite(),780,{by:.6});
  SPR.klasik=[def(sedan80Sprite('#d8cba8',false),760,{by:.42}),def(sedan80Sprite('#ece8e0',true),760,{by:.42}),def(sedan80Sprite('#7a2a30',false),760,{by:.42})];
  SPR.rv={};for(const p of RIVALS)SPR.rv[p.id]=[-1,0,1].map(k=>bikeSprite({kick:k,box:p.box,jacket:p.jacket,helmet:p.helmet,label:''}));
}
