"""Rivals must never ride on top of each other: 4 rivals over several deliveries, counts frames where two live rivals overlap
(|dz| < 140 and |dx| < 0.2) and the longest overlap streak. Usage: python3 tools/rival_spawn_test.py http://127.0.0.1:8765"""
import sys
from playwright.sync_api import sync_playwright
JS="""(async(seed)=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');
  const D=C.DISTRICTS[seed%6];G.shift={L:3,i:0,cards:{kabadayi:1},earned:0};
  G.route={D,len:2400,curv:D.curv,hill:D.hill,up:D.up,seed,A:C.prof('Moda'),B:C.prof('Moda'),d:9,ev:'rakip2',kind:'x',from:'a',to:'b',time:999,pay:50,rest:'x'};
  GM.startMission();G.state='play';G.paused=true;const n=G.rivals.length;let ov=0,run=0,maxRun=0,frames=0;
  for(let k=0;k<60*60&&G.state==='play';k++){G.inv=9;G.timeLeft=999;G.cond=100;GM.update(1/60);frames++;
    const L=G.rivals.filter(r=>!r.dead&&r.down<=0);let hit=false;
    for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)if(Math.abs(L[i].z-L[j].z)<140&&Math.abs(L[i].x-L[j].x)<.2)hit=true;
    if(hit){ov++;run++;maxRun=Math.max(maxRun,run);}else run=0;}
  return {n,frames,overlapFrames:ov,longestOverlap:maxRun};})"""
bad=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:6,tut:1,story:1,volV:2}))")
    pg.goto(sys.argv[1]+'/'); pg.wait_for_timeout(400)
    for seed in [11,23,37,41,58,64]:
        r=pg.evaluate(JS+f'({seed})'); ok=r['n']==4 and r['longestOverlap']<=12; bad+=not ok; print(('ok  ' if ok else 'FAIL'),seed,r)
    print('errors',errs); bad+=bool(errs)
print('ALL PASS' if not bad else 'FAILED'); sys.exit(1 if bad else 0)
