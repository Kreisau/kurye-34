"""Rivals must arrive one at a time: counts and timing of spawns over a delivery.
Usage: python3 tools/rival_spawn_test.py http://127.0.0.1:8765"""
import sys
from playwright.sync_api import sync_playwright
JS="""(async()=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');
  const D=C.DISTRICTS[0];G.shift={L:3,i:0,cards:{kabadayi:1},earned:0};
  G.route={D,len:2400,curv:D.curv,hill:D.hill,up:D.up,seed:77,A:C.prof('Moda'),B:C.prof('Moda'),d:9,ev:'rakip2',kind:'x',from:'a',to:'b',time:999,pay:50,rest:'x'};
  GM.startMission();G.state='play';G.paused=true;
  const first=G.rivals.length,queued=G.rivalWait.length,times=[];let n0=G.rivals.length,maxLive=0;
  for(let k=0;k<60*90&&G.state==='play';k++){G.cars=[];G.inv=9;G.timeLeft=999;G.cond=100;GM.update(1/60);if(G.rivals.length>n0){times.push(+(k/60).toFixed(1));n0=G.rivals.length;}
    maxLive=Math.max(maxLive,G.rivals.filter(r=>!r.out&&!r.dead&&r.down<=0).length);}
  return {first,queued,total:G.rivals.length,times,maxLive};})()"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:6,tut:1,story:1,volV:2}))")
    pg.goto(sys.argv[1]+'/'); pg.wait_for_timeout(400); r=pg.evaluate(JS)
    ok=r['first']==1 and r['queued']==3 and r['total']>=2 and r['maxLive']<=2 and all(b-a>=15 for a,b in zip(r['times'],r['times'][1:])) and not errs
    print(('ok  ' if ok else 'FAIL'),r,errs); sys.exit(0 if ok else 1)
