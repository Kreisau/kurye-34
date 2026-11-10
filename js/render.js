import { $, BIKE_WW, FOGD, RM, camDepth, camH, ctx, cvs, drawDist, lerp, maxSpeed, playerZ, segL } from './config.js';
import { G } from './g.js';
import { rain } from './game.js';
import { SPR, rr } from './sprites.js';
import { findSeg } from './track.js';

export const drops=Array.from({length:90},(_,i)=>({x:Math.random(),y:Math.random(),v:1.6+Math.random()*1.2,l:.03+Math.random()*.04}));

/* ---------- render ---------- */
export function project(p,cx,cy,cz){
  p.cx=-cx;p.cy=p.wy-cy;p.cz=p.wz-cz;
  p.s=camDepth/p.cz;
  p.sx=Math.round(G.W/2+p.s*p.cx*G.K);
  p.sy=Math.round(G.HZ-p.s*p.cy*G.K);
  p.sw=Math.round(p.s*G.roadW*G.K);
}
export function poly(x1,y1,x2,y2,x3,y3,x4,y4,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.lineTo(x4,y4);ctx.closePath();ctx.fill();}
export function drawSeg(s){
  const c=s.color,x1=s.p1.sx,y1=s.p1.sy,w1=s.p1.sw,x2=s.p2.sx,y2=s.p2.sy,w2=s.p2.sw;
  const r1=w1/6,r2=w2/6,l1=w1/40,l2=w2/40;
  ctx.fillStyle=c.side;ctx.fillRect(0,y2,G.W,y1-y2);
  if(s.sea<0)poly(0,y1,x1-w1*1.16,y1,x2-w2*1.16,y2,0,y2,G.TH.water);
  else if(s.sea>0)poly(x1+w1*1.16,y1,G.W,y1,G.W,y2,x2+w2*1.16,y2,G.TH.water);
  poly(x1-w1-r1,y1,x1-w1,y1,x2-w2,y2,x2-w2-r2,y2,c.rumble);
  poly(x1+w1+r1,y1,x1+w1,y1,x2+w2,y2,x2+w2+r2,y2,c.rumble);
  poly(x1-w1,y1,x1+w1,y1,x2+w2,y2,x2-w2,y2,c.road);
  if(c.lane){const lw1=w1*2/3,lw2=w2*2/3;let lx1=x1-w1+lw1,lx2=x2-w2+lw2;
    for(let i=1;i<3;i++,lx1+=lw1,lx2+=lw2)poly(lx1-l1/2,y1,lx1+l1/2,y1,lx2+l2/2,y2,lx2-l2/2,y2,c.lane);}
  if(s.clk==='works'){const a0=s.cl===0?-1:1/3,b0=s.cl===0?-1/3:1;poly(x1+a0*w1,y1,x1+b0*w1,y1,x2+b0*w2,y2,x2+a0*w2,y2,'rgba(240,138,75,.22)');}
  if(s.fog<1){ctx.globalAlpha=1-s.fog;ctx.fillStyle=G.FOG;ctx.fillRect(0,y2,G.W,y1-y2);ctx.globalAlpha=1;}
}
export function jag(cx,cy,rx,ry,seed,col){
  ctx.fillStyle=col;ctx.beginPath();
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,k=.7+.3*Math.abs(Math.sin(seed*91.7+i*2.3)),x=cx+Math.cos(a)*rx*k,y=cy+Math.sin(a)*ry*k;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  ctx.closePath();ctx.fill();
}
export function drawHazard(s,a){
  const h=s.hz;if(s.p1.cz<=camDepth||s.p2.sy>=s.clip)return;
  const x1=s.p1.sx,y1=s.p1.sy,w1=s.p1.sw,x2=s.p2.sx,y2=s.p2.sy,w2=s.p2.sw;
  ctx.globalAlpha=a;
  if(h.t==='bump'){
    const r1=Math.max(2,s.p1.s*80*G.K),r2=Math.max(1.5,s.p2.s*80*G.K);
    const xm=(x1+x2)/2,wm=(w1+w2)/2,ym=(y1+y2)/2-(r1+r2)/2;
    for(let i=0;i<10;i++){const a0=-1+i/5,b0=-1+(i+1)/5,sk=.1;poly(x1+a0*w1,y1,x1+b0*w1,y1,xm+(b0+sk)*wm,ym,xm+(a0+sk)*wm,ym,i%2?'#1d1726':'#ffc61a');}
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(xm-wm,ym,wm*2,Math.max(1,(y1-ym)*.14));
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x1-w1,y1-Math.max(1,(y1-ym)*.12),w1*2,Math.max(1,(y1-ym)*.12));
  }else if(h.t==='junk'){
    const j=SPR.junk[h.v],sc=s.p1.s;drawSprite(j.img,j.ww,sc,x1+sc*h.x*G.roadW*G.K,y1,s.clip,a,0);
  }else if(y1-y2>=1){
    const wa=(w1+w2)/2,ex=(x1+x2)/2+h.x*wa,ey=(y1+y2)/2,rx=h.w/2*wa,ry=Math.max(1,(y1-y2)*.5);
    if(h.t==='pot'){
      jag(ex,ey,rx*1.2,ry*1.3,h.r,'#8a7f86');
      jag(ex,ey+ry*.08,rx*.95,ry,h.r+.37,'#0b0910');
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(ex-rx*.8,ey-ry*.7,rx*1.6,Math.max(1,ry*.35));
      ctx.fillStyle='rgba(130,110,90,.6)';ctx.beginPath();ctx.ellipse(ex,ey+ry*.4,rx*.55,ry*.28,0,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='rgba(6,4,10,.9)';ctx.beginPath();ctx.ellipse(ex,ey,rx,ry,0,0,Math.PI*2);ctx.fill();
      const lw=Math.max(1,ry*.16);
      for(const [c,ox,sx,sy] of[['rgba(255,80,200,.75)',-.05,.8,.72],['rgba(80,220,255,.75)',.05,.6,.54],['rgba(255,225,80,.65)',0,.4,.36]]){
        ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.beginPath();ctx.ellipse(ex+ox*rx,ey,rx*sx,ry*sy,0,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(ex-rx*.35,ey-ry*.35,rx*.16,ry*.12,0,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.globalAlpha=1;
}
G.MIR=null;
export function layoutMirrors(){
  const hud=$('hud');if(hud.hidden){G.MIR=null;return;}
  const s=G.W/innerWidth,hb=hud.getBoundingClientRect().bottom,mw=Math.min(G.W*(G.H>G.W?.3:.2),170*s),mh=mw*.46,pad=14*s;
  G.MIR={w:mw,h:mh,y:hb*s-8*s,l:pad,r:G.W-pad-mw};
}
export function mirror(mx,side,obs){
  const my=G.MIR.y,mw=G.MIR.w,mh=G.MIR.h;
  ctx.save();
  ctx.fillStyle='#16111f';rr(ctx,mx-3,my-3,mw+6,mh+6,mh*.4);ctx.fill();
  rr(ctx,mx,my,mw,mh,mh*.36);ctx.clip();
  const hy=my+mh*.42,vx=mx+mw*(side<0?.72:.28),U=mw*.85,gh=my+mh-hy;
  ctx.fillStyle=G.TH.sky[2];ctx.fillRect(mx,my,mw,hy-my);
  ctx.fillStyle=G.TH.side[1];ctx.fillRect(mx,hy,mw,gh);
  ctx.fillStyle=G.TH.road[0];ctx.beginPath();ctx.moveTo(vx,hy);ctx.lineTo(vx+(1-G.playerX)*U,my+mh);ctx.lineTo(vx+(-1-G.playerX)*U,my+mh);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;
  for(const lx of[-.33,.33]){ctx.beginPath();ctx.moveTo(vx,hy);ctx.lineTo(vx+(lx-G.playerX)*U,my+mh);ctx.stroke();}
  for(const o of obs){
    const k=1/(1+o.dz/320),gx=vx+(o.x-G.playerX)*U*k,gy=hy+gh*k,dw=o.ww/G.roadW*U*k,dh=dw*o.img.height/o.img.width;
    if(gx+dw<mx||gx-dw>mx+mw)continue;
    ctx.drawImage(o.img,gx-dw/2,gy-dh,dw,dh);
    const lr=Math.max(1.2,dw*.06);ctx.fillStyle='rgba(255,246,200,.95)';
    if(o.car){for(const d of[-.32,.32]){ctx.beginPath();ctx.arc(gx+d*dw,gy-dh*.3,lr,0,Math.PI*2);ctx.fill();}}
    else{ctx.beginPath();ctx.arc(gx,gy-dh*.4,lr*1.3,0,Math.PI*2);ctx.fill();}
    if(o.amb){const on=Math.floor(G.clock*8)%2,rad=Math.max(1.8,dw*.09);
      ctx.fillStyle=on?'#ff2a2a':'#2a6bff';ctx.beginPath();ctx.arc(gx-dw*.15,gy-dh*.93,rad,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=on?'#2a6bff':'#ff2a2a';ctx.beginPath();ctx.arc(gx+dw*.15,gy-dh*.93,rad,0,Math.PI*2);ctx.fill();}
  }
  const gr=ctx.createLinearGradient(mx,my,mx+mw,my+mh);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(.5,'rgba(255,255,255,0)');
  ctx.fillStyle=gr;ctx.fillRect(mx,my,mw,mh);
  ctx.restore();
}
export function drawMirrors(){
  if(!G.MIR)return;
  const pz=G.pos+playerZ,obs=[];
  for(const c of G.cars){const dz=pz-c.z;if(dz>40&&dz<4500)obs.push({dz,x:c.x,img:c.spr.img,ww:c.spr.ww,car:true,amb:c.amb});}
  for(const r of G.rivals){const dz=pz-r.z;if(dz>-40&&dz<4500&&r.down<=0)obs.push({dz:Math.max(40,dz),x:r.x,img:r.spr[1],ww:BIKE_WW,car:false});}
  obs.sort((a,b)=>b.dz-a.dz);
  mirror(G.MIR.l,-1,obs);mirror(G.MIR.r,1,obs);
}
export function drawSprite(img,ww,sc,x,y,clip,alpha,rot){
  const dw=ww*sc*G.K;if(!(dw>=1)||dw>G.W*6)return;
  const dh=dw*img.height/img.width,dx=x-dw/2,dy=y-dh;
  if(dx>G.W||dx+dw<0)return;
  ctx.globalAlpha=alpha;
  if(rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(img,-dw/2,-dh,dw,dh);ctx.restore();}
  else{const ch=clip?Math.max(0,dy+dh-clip):0;if(ch<dh)ctx.drawImage(img,0,0,img.width,Math.max(1,img.height-img.height*ch/dh),dx,dy,dw,dh-ch);}
  ctx.globalAlpha=1;
}
export function layer(img,off,h){const w=Math.round(img.width*h/img.height);let x=-Math.floor((((off%1)+1)%1)*w);for(;x<G.W;x+=w)ctx.drawImage(img,x,G.HZ-h+2,w+1,h);}
export function drawBg(){
  ctx.fillStyle=G.skyGrad;ctx.fillRect(0,0,G.W,G.HZ+2);
  const sx=G.W*.72,sy=G.HZ-G.K*.22,sr=G.K*.11;
  ctx.fillStyle=G.sunGrad;ctx.fillRect(sx-sr*4,sy-sr*4,sr*8,sr*8);
  ctx.fillStyle=G.TH.sun;ctx.beginPath();ctx.arc(sx,sy,G.TH.moon?sr*.6:sr,0,Math.PI*2);ctx.fill();
  layer(G.FAR,G.farOff,Math.round(G.K*.42));
  layer(G.NEAR,G.nearOff,Math.round(G.K*.2));
  ctx.fillStyle=G.NEARC;ctx.fillRect(0,G.HZ+1,G.W,G.H-G.HZ);
}
export function drawPlayer(pSeg,pp){
  if(G.inv>0&&G.crashT<=0&&Math.floor(G.clock*14)%2)return;
  const sc=camDepth/playerZ,img=G.PSPR[G.kickT>0?(G.kickSide<0?0:2):1];
  const dw=BIKE_WW*sc*G.K,dh=dw*img.height/img.width,sp=G.speed/maxSpeed;
  let y=G.HZ-sc*lerp(pSeg.p1.cy,pSeg.p2.cy,pp)*G.K;
  y+=G.offroad?(Math.random()*2-1)*2.5*sp:Math.sin(G.clock*28)*(pSeg.cobble?1.6:.6)*sp;
  if(G.bumpT>0)y-=Math.sin((1-G.bumpT/.35)*Math.PI)*G.K*.07;
  ctx.save();ctx.translate(G.W/2,y);ctx.rotate(G.lean);ctx.drawImage(img,-dw/2,-dh,dw,dh);
  if(G.nitroT>0){
    const f=.7+Math.random()*.5;
    for(const sx of[-.13,.13]){const gr=ctx.createLinearGradient(0,-dh*.3,0,-dh*.3+dh*.28*f);gr.addColorStop(0,'rgba(220,240,255,.95)');gr.addColorStop(1,'rgba(60,140,255,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(dw*sx-dw*.035,-dh*.3);ctx.lineTo(dw*sx+dw*.035,-dh*.3);ctx.lineTo(dw*sx,-dh*.3+dh*.28*f);ctx.closePath();ctx.fill();}
  }
  ctx.restore();
  if(G.nitroT>0&&!RM){
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=Math.max(1,G.K*.008);ctx.beginPath();
    for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,r0=G.K*(.9+Math.random()*.4),r1=r0+G.K*.5;ctx.moveTo(G.W/2+Math.cos(a)*r0,G.HZ+Math.sin(a)*r0*.6);ctx.lineTo(G.W/2+Math.cos(a)*r1,G.HZ+Math.sin(a)*r1*.6);}
    ctx.stroke();
  }
}
export function drawRain(){
  ctx.fillStyle='rgba(20,26,48,.28)';ctx.fillRect(0,0,G.W,G.H);
  ctx.strokeStyle='rgba(170,200,255,.5)';ctx.lineWidth=1.2;ctx.beginPath();
  const n=RM?30:drops.length;
  for(let i=0;i<n;i++){const d=drops[i],y=((d.y+G.clock*d.v)%1)*G.H*1.1-G.H*.05,x=((d.x-G.clock*.15)%1+1)%1*G.W;ctx.moveTo(x,y);ctx.lineTo(x-G.H*d.l*.25,y+G.H*d.l);}
  ctx.stroke();
}
export function render(){
  const N=G.segs.length,base=findSeg(G.pos),bp=(G.pos%segL)/segL;
  const pSeg=findSeg(G.pos+playerZ),pp=((G.pos+playerZ)%segL)/segL;
  G.playerY=lerp(pSeg.p1.wy,pSeg.p2.wy,pp);
  ctx.save();
  if(G.shakeT>0&&!RM)ctx.translate(Math.round((Math.random()*2-1)*4),Math.round((Math.random()*2-1)*3));
  drawBg();
  let maxy=G.H,x=0,dx=-(base.curve*bp);
  for(let n=0;n<drawDist;n++){
    const s=G.segs[(base.index+n)%N];
    s.looped=s.index<base.index;const f=n/drawDist;s.fog=Math.exp(-f*f*FOGD);s.clip=maxy;
    const cz=G.pos-(s.looped?G.trackLen:0);
    project(s.p1,G.playerX*G.roadW-x,G.playerY+camH,cz);
    project(s.p2,G.playerX*G.roadW-x-dx,G.playerY+camH,cz);
    x+=dx;dx+=s.curve;
    if(s.p1.cz<=camDepth||s.p2.sy>=s.p1.sy||s.p2.sy>=maxy)continue;
    drawSeg(s);maxy=s.p1.sy;
  }
  const B=new Array(drawDist);
  const put=(z,o)=>{const idx=Math.floor(z/segL);if(idx<0||idx>=N)return;const n=idx-base.index;if(n<1||n>=drawDist)return;o.pct=(z%segL)/segL;(B[n]||(B[n]=[])).push(o);};
  for(const c of G.cars)put(c.z,{img:c.spr.img,ww:c.spr.ww,x:c.x,rot:0,by:c.spr.by||.4,brake:c.brk,siren:c.amb,
    blink:c.bus&&c.st!=='drive'?(c.st==='pull'||(c.st==='stop'&&c.wait>1.2)?1:-1):(c.sig||0)});
  if(G.state==='play'||G.state==='count')for(const r of G.rivals)if(r.z>0){
    const img=r.down>0?r.spr[1]:(r.kick>0||r.wind>0)?r.spr[r.kside<0?0:2]:r.spr[1];
    put(r.z,{img,ww:BIKE_WW,x:r.x,rot:r.down>0?r.fall*(r.x>G.playerX?1:-1):0,warn:r.wind>0&&r.down<=0});
  }
  const pN=Math.floor((G.pos+playerZ)/segL)-base.index;
  for(let n=drawDist-1;n>0;n--){
    const s=G.segs[(base.index+n)%N],a=Math.max(.12,s.fog);
    if(s.hz)drawHazard(s,a);
    // cars and couriers inside this segment are farther than its edge sprites (barriers, poles), so draw them first, far to near
    const b=B[n];
    if(b){if(b.length>1)b.sort((p,q)=>q.pct-p.pct);for(const o of b){
      const sc=lerp(s.p1.s,s.p2.s,o.pct),ox=lerp(s.p1.sx,s.p2.sx,o.pct)+sc*o.x*G.roadW*G.K,oy=lerp(s.p1.sy,s.p2.sy,o.pct);
      drawSprite(o.img,o.ww,sc,ox,oy,s.clip,a,o.rot);
      if(o.warn&&oy<=s.clip){
        const dw=o.ww*sc*G.K,dh=dw*o.img.height/o.img.width,rad=Math.max(6,dw*.14),wy=oy-dh*1.08;
        ctx.fillStyle='#ff5a5a';ctx.beginPath();ctx.arc(ox,wy,rad,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#f4eee6';ctx.font='bold '+Math.round(rad*1.5)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',ox,wy);
      }
      if((o.brake||o.siren)&&oy<=s.clip){
        const dw=o.ww*sc*G.K,dh=dw*o.img.height/o.img.width;ctx.globalAlpha=a;
        if(o.brake){ctx.fillStyle='rgba(255,40,40,.95)';for(const d of[-1,1])ctx.fillRect(ox+d*dw*.36-dw*.07,oy-dh*o.by-dw*.01,dw*.14,dw*.08);}
        if(o.siren){const on=Math.floor(G.clock*8)%2;ctx.fillStyle=on?'#ff2a2a':'#2a6bff';ctx.fillRect(ox-dw*.22,oy-dh*.955,dw*.2,dh*.065);ctx.fillStyle=on?'#2a6bff':'#ff2a2a';ctx.fillRect(ox+dw*.02,oy-dh*.955,dw*.2,dh*.065);}
        ctx.globalAlpha=1;
      }
      if(o.blink&&Math.floor(G.clock*3)%2&&oy<=s.clip){const dw=o.ww*sc*G.K,dh=dw*o.img.height/o.img.width;ctx.globalAlpha=a;ctx.fillStyle='#ffa31a';ctx.fillRect(ox+o.blink*dw*.38-dw*.06,oy-dh*o.by,dw*.12,dw*.07);ctx.globalAlpha=1;}
    }}
    for(const sp of s.sprites){const sc=s.p1.s;if(n<pN&&sp.spr.ww*sc*G.K>G.W*.45)continue;drawSprite(sp.spr.img,sp.spr.ww,sc,s.p1.sx+sc*sp.off*G.roadW*G.K,s.p1.sy,s.clip,a,0);}
  }
  drawPlayer(pSeg,pp);
  if(rain())drawRain();
  ctx.restore();
  if(G.state==='play'||G.state==='count')drawMirrors();
  if(G.flashT>0){ctx.fillStyle='rgba(255,70,70,'+(G.flashT*1.4).toFixed(3)+')';ctx.fillRect(0,0,G.W,G.H);}
}

/* ---------- resize & loop ---------- */
export const QUAL=[1200,900,720,560];G.qi=0;G.perfN=0;G.perfT=0;
export function resize(){
  const vw=innerWidth,vh=innerHeight,r=Math.min(window.devicePixelRatio||1,QUAL[G.qi]/Math.min(vw,vh));
  G.W=Math.max(200,Math.round(vw*r));G.H=Math.max(150,Math.round(vh*r));cvs.width=G.W;cvs.height=G.H;
  const portrait=vh>vw;
  G.K=portrait?Math.min(G.H*.39,G.W*.62):Math.min(G.H*.47,G.W*.32);
  G.HZ=Math.round((portrait?G.H*.84:G.H*.97)-G.K*1.17);
  buildGrads();layoutMirrors();
}
export function buildGrads(){
  G.skyGrad=ctx.createLinearGradient(0,0,0,G.HZ);
  G.TH.sky.forEach((c,i)=>G.skyGrad.addColorStop([0,.35,.72,1][i],c));
  const sx=G.W*.72,sy=G.HZ-G.K*.22,sr=G.K*.11;
  G.sunGrad=ctx.createRadialGradient(sx,sy,sr*.5,sx,sy,sr*(G.TH.moon?2.2:4));
  G.sunGrad.addColorStop(0,'rgba('+G.TH.glow+',.55)');G.sunGrad.addColorStop(1,'rgba('+G.TH.glow+',0)');
}
addEventListener('resize',resize);
