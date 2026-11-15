"""Balance probe: a rule-based rider plays deliveries headlessly (no rendering) at three skill levels
(careful, average, reckless). It is not a human: read trends, not absolute numbers.
Usage: python3 tools/ride_bot.py http://127.0.0.1:8765 [runs_per_delivery]
  MODE=progress (default)  the expected bike and parts in each district, level by level
  MODE=bikes               all five bikes in the same district, plus engine and card variants
  MODE=boss                the showdown with Kara, each weapon on the two top bikes"""
import sys, json
from playwright.sync_api import sync_playwright
RUNS=int(sys.argv[2]) if len(sys.argv)>2 else 3
JS=r"""
(async(cfg)=>{
const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');
const {input}=await import('/js/input.js');const ST=await import('/js/street.js');const M=await import('/js/meta.js');
const {LANES,PW,maxSpeed,playerZ,segL,KMH}=C;
G.paused=true;
const PROF={careful:{react:.2,look:2.6,red:1,cop:1,bump:1,amb:1,curve:.7},average:{react:.35,look:1.6,red:1,cop:1,bump:.6,amb:1,curve:.9},reckless:{react:.4,look:1.1,red:0,cop:0,bump:0,amb:0}};
async function ride(L,i,bike,upg,profName,kindIdx,card,wpn,boss){
  const P=PROF[profName];
  G.S.shifts=L;G.S.pd=L*6+i;G.S.boss=0;G.S.cur=bike;if(!G.S.owned.includes(bike))G.S.owned.push(bike);G.S.upg=[upg[0],0,upg[1],0,upg[2]];G.S.wpn=wpn||'bat';if(!G.S.weapons.includes(G.S.wpn))G.S.weapons.push(G.S.wpn);
  G.tut=null;G.shift={L,i,cards:card?{[card]:1}:{},earned:0};
  if(boss){G.S.clues=5;G.S.pd=72;M.startBoss();}else{G.route=GM.makeOffer(GM.KINDS[kindIdx]);GM.startMission();}
  const src={};let lastToast='';let crashes=0,pc=0,tDec=0,dec={lane:1,brake:false},pend={lane:1,brake:false},steps=0,kicks=0,stopT=0;
  const res={};
  while((G.state==='count'||G.state==='play'||G.state==='arrive')&&steps<60*400){
    steps++;
    if(G.state==='play'){
      const pz=G.pos+playerZ,v=G.speed,top=G.ST.top*maxSpeed;
      tDec-=1/60;
      if(tDec<=0){tDec=P.react;dec=pend;
        const look=P.look*Math.max(v,top*.5);
        const score=LANES.map((Lx,li)=>{let t=9;
          for(const c of G.cars){const dz=c.z-pz;if(dz<-120||dz>look)continue;
            const inLane=Math.abs(c.x-Lx)<(c.hit+PW)/2+.06||(c.sig&&c.sigT>0&&Math.abs(c.pend-Lx)<.2)||Math.abs(c.tl-Lx)<(c.hit+PW)/2;
            if(!inLane)continue;if(c.amb&&dz<0)continue;const rel=v-c.speed;if(rel<=0&&dz>300)continue;t=Math.min(t,Math.max(0,dz)/Math.max(200,rel));}
          for(const k of G.closures){if(k.lane!==li)continue;const dz=k.z0-pz;if(pz<k.z1&&dz<look)t=Math.min(t,Math.max(0,dz)/Math.max(200,v));}
          const n0=Math.floor(pz/segL),n1=Math.min(G.segs.length-1,n0+Math.ceil(look/segL));
          for(let n=n0;n<=n1;n++){const h=G.segs[n].hz;if(!h||h.hit||h.t==='bump')continue;if(Math.abs(h.x-Lx)<h.w/2+PW/2+.04)t=Math.min(t,.25+(n-n0)*segL/Math.max(200,v)*.6);}
          if(P.amb&&li===1){const a=G.cars.find(c=>c.amb);if(a&&a.z<pz&&pz-a.z<3500)t=Math.min(t,.3);}
          return t;});
        const cur=LANES.reduce((b,Lx,li)=>Math.abs(Lx-G.playerX)<Math.abs(LANES[b]-G.playerX)?li:b,0);
        let best=cur;for(let li=0;li<3;li++)if(score[li]>score[best]+.25&&Math.abs(li-cur)<=1)best=li;
        if(Math.abs(best-cur)===1&&score[best]<=score[cur]+.25)best=cur;
        // far lane better? go through the middle if the middle is not worse than staying
        if(best===cur){for(let li=0;li<3;li++)if(Math.abs(li-cur)===2&&score[li]>score[cur]+.6&&score[1]>=Math.min(score[cur],.8))best=1;}
        let brake=score[best]<.55;
        // red light
        if(P.red)for(const l of ST.S.lights){const dz=l.z-pz;if(dz>0&&!l.passed&&(l.st==='red'||l.st==='yellow')&&dz<v*v/(2*.3*maxSpeed)+900)brake=true;}
        if(P.cop)for(const c of ST.S.cops){const dz=c.z-pz;if(!c.done&&dz>0&&dz<v*1.6+1500&&v/maxSpeed*KMH>C.KMH*0+52)brake=true;}
        if(P.bump){const n0=Math.floor(pz/segL),wn=Math.max(16,Math.round(G.ST.top*60*1.3*P.bump));for(let n=n0;n<n0+wn&&n<G.segs.length;n++){const h=G.segs[n].hz;if(h&&h.t==='bump'&&!h.hit&&v>top*.78)brake=true;}}
        if(P.curve){const n0=Math.floor(pz/segL);let need=0;for(let n=n0;n<n0+10&&n<G.segs.length;n++)need=Math.max(need,Math.abs(G.segs[n].curve));const sp=v/maxSpeed,cf=2.2*sp*sp*need*.3*G.ST.cent*(G.route.ev==='yagmur'?1.35:1),au=2.4*Math.max(.35,sp)*G.ST.steer;if(cf>au*P.curve)brake=true;}
        for(const p of ST.S.peds){const dz=p.z-pz;if(dz>0&&dz<v*.9+400&&Math.abs(p.x-LANES[best])<.3)brake=true;}
        pend={lane:best,brake};
      }
      input.steer=Math.max(-1,Math.min(1,(LANES[dec.lane]-G.playerX)*7));input.brake=dec.brake&&G.speed>maxSpeed*.02||false;
      if(G.speed<maxSpeed*.03)stopT+=1/60;
      for(const r of G.rivals){if(r.down>0)continue;const gz=r.z-pz,dx=Math.abs(r.x-G.playerX);if(gz>-70&&gz<140&&dx>=.1&&dx<=.4&&G.kickT<=0){GM.doKick();kicks++;break;}}
      if(!boss&&G.nitroN>0&&G.nitroT<=0&&G.timeLeft<G.route.time*.5&&!dec.brake)GM.doNitro();
      if(boss&&P.slow&&G.speed>G.ST.top*maxSpeed*P.slow)input.brake=true;
      {const tt=document.getElementById('toast').textContent;if(tt!==lastToast){lastToast=tt;const m=tt.match(/^(.*?)\s+−(\d+)% paket/);if(m){const k=m[1].replace(/^(Kırmızı|Yeşil|Turuncu|Mor) kurye vurdu/,'Rakip vurdu');src[k]=(src[k]||0)+(+m[2]);}}}
      const cr=G.crashT>0?1:0;if(cr&&!pc)crashes++;pc=cr;
      res.cond=G.cond;res.tl=G.timeLeft;res.fine=G.fine;res.bonus=G.bonus;res.hits=G.hits;
    }
    GM.update(1/60);
    if(boss&&G.shift&&G.shift.over)break;
  }
  input.steer=0;input.brake=false;
  if(boss){let w=0;while(w++<200&&G.state!=='result'){GM.update(1/60);await new Promise(r=>setTimeout(r,10));}}
  const title=document.getElementById('resTitle').textContent,ok=title==='HESAP KAPANDI'||title==='TESLİM EDİLDİ'||title==='VARDİYA TAMAM';
  const sub=document.getElementById('resSub').textContent;
  const earned=ok&&!boss?Math.max(0,Math.round(G.route.pay*res.cond/100)+Math.round(G.route.pay*Math.max(0,res.tl)/G.route.time*.5)+res.bonus-res.fine):0;
  return {ok,earned,secs:steps/60,why:ok?'':(sub.includes('Süre')?'time':'pkg'),time:G.route.time,len:G.route.len,pay:G.route.pay,ev:G.route.ev,cond:res.cond,tl:Math.max(0,res.tl),fine:res.fine,bonus:res.bonus,hits:res.hits,crashes,stars:G.S.ratings[G.S.ratings.length-1],kicks,src,stopT:+stopT.toFixed(1),top:Math.round(G.ST.top*KMH),ncars:G.cars.length};
}
const out=[];
for(const sc of cfg.scen)for(const prof of cfg.profs){const rs=[];
  for(let i=0;i<5;i++)for(let k=0;k<cfg.runs;k++)rs.push(await ride(sc.L,i,sc.bike,sc.upg,prof,1+((i+k)%2),sc.card||null,sc.wpn,sc.boss));
  out.push({L:sc.L,bike:sc.bike,upg:sc.upg,prof,tag:sc.tag||'',rs});}
return out;})
"""
import os
MODE=os.environ.get('MODE','progress')
if MODE=='progress':
    SC=[dict(L=0,bike='mob',upg=[0,0,0],wpn='kick'),dict(L=1,bike='mob',upg=[0,0,0],wpn='kick'),dict(L=2,bike='sc',upg=[1,1,0],wpn='bat'),dict(L=3,bike='sc',upg=[2,1,0],wpn='bat'),
        dict(L=4,bike='k150',upg=[2,2,1],wpn='bat'),dict(L=5,bike='k150',upg=[2,2,1],wpn='bat'),dict(L=6,bike='k150',upg=[3,2,1],wpn='chain'),dict(L=7,bike='n250',upg=[3,2,1],wpn='chain'),
        dict(L=8,bike='n250',upg=[3,3,2],wpn='chain'),dict(L=9,bike='n250',upg=[4,3,2],wpn='chain'),dict(L=10,bike='n250',upg=[4,3,2],wpn='bar'),dict(L=11,bike='s600',upg=[4,3,3],wpn='bar')]
    PROFS=['careful','average','reckless']
elif MODE=='bikes':
    SC=[dict(L=L,bike=bk,upg=[2,2,1],wpn='bat',tag=bk) for L in (4,9) for bk in ('mob','sc','k150','n250','s600')]
    SC+=[dict(L=9,bike='n250',upg=[0,2,1],wpn='bat',tag='engine 0'),dict(L=9,bike='n250',upg=[5,2,1],wpn='bat',tag='engine 5'),
         dict(L=9,bike='n250',upg=[2,2,1],wpn='bat',card='turbo',tag='card turbo'),dict(L=9,bike='n250',upg=[2,2,1],wpn='bat',card='kisayol',tag='card kisayol'),
         dict(L=9,bike='n250',upg=[2,2,1],wpn='bat',card='termos',tag='card termos')]
    PROFS=['careful','average']
else:
    SC=[dict(L=12,bike=bk,upg=[4,3,2],wpn=w,boss=True,tag=bk+' '+w) for bk in ('n250','s600') for w in ('kick','bat','chain','bar')]
    PROFS=['careful','average']
ZN=['Kadıköy','Üsküdar','Karaköy','Beşiktaş','Fatih','Şişli']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:0,tut:1,story:1,volV:2,uv:2}))")
    pg.goto(sys.argv[1]+'/'); pg.wait_for_timeout(500)
    allr=[]
    for sc in SC:
        allr+=pg.evaluate(JS+'('+json.dumps(dict(scen=[sc],profs=PROFS,runs=RUNS))+')')
    if MODE=='boss':
        for r in allr:
            rs=r['rs'];w=[x for x in rs if x['ok']]
            print(f"{r['tag']:12s} {r['prof']:8s} wins {len(w)}/{len(rs)}  avg fight secs {sum(x['secs'] for x in rs)/len(rs):4.0f}  end package {sum((x['cond'] or 0) for x in rs)/len(rs):3.0f}  lost by: time/road {sum(1 for x in rs if not x['ok'] and x['why']=='time')} package {sum(1 for x in rs if not x['ok'] and x['why']=='pkg')}")
    else:
        print('zone      L  bike  upg      prof      n  fail%(time/pkg)  used%  cond  crashes  stars  fine  bonus  stop_s  top  cars')
        for r in allr:
            rs=r['rs'];n=len(rs);ok=[x for x in rs if x['ok']];av=lambda f,xs=rs:(sum(f(x) for x in xs)/max(1,len(xs)))
            ft=sum(1 for x in rs if not x['ok'] and x['why']=='time');fp=sum(1 for x in rs if not x['ok'] and x['why']=='pkg')
            ern=av(lambda x:x['earned'],ok);sec=av(lambda x:x['secs'])
            print(f"{ZN[min(5,r['L']//2)]:9s} {r['L']:2d} {r['bike']:5s} {str(r['upg']):9s} {r['prof']:9s} {n:2d}  {100*(n-len(ok))//n:3d}% ({ft}/{fp})      {100*av(lambda x:1-x['tl']/x['time'],ok):4.0f}  {av(lambda x:x['cond'],ok):4.0f}  {av(lambda x:x['crashes']):5.1f}   {av(lambda x:x['stars'],ok):4.1f}  {av(lambda x:x['fine']):4.0f}  {av(lambda x:x['bonus']):4.0f}  {av(lambda x:x['stopT']):5.1f}  {rs[0]['top']:3d}  {av(lambda x:x['ncars']):4.1f} | earn/ok {ern:4.0f} secs {sec:4.0f} TL/min {60*sum(x['earned'] for x in rs)/max(1,sum(x['secs'] for x in rs)):4.0f} {r['tag']}")
    print('errors',errs[:3])
