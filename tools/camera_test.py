"""Rides a hilly Karaköy route twice (fixed camera vs dynamic camera) with the same seed and reports the
'void': how far below the horizon the visible road ends (px, canvas), i.e. the empty band behind a crest.
Usage: python3 tools/camera_test.py http://127.0.0.1:8765"""
import sys
from playwright.sync_api import sync_playwright
JS="""(async(off)=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const R=await import('/js/render.js');
  const D=C.DISTRICTS[2];G.shift={L:3,i:0,cards:{},earned:0};
  G.route={D,len:2400,curv:D.curv,hill:D.hill,up:D.up,seed:4242,A:C.prof('Galata'),B:C.prof('Cihangir'),d:5,ev:null,kind:'x',from:'Galata',to:'Cihangir',time:999,pay:50,rest:'x'};
  GM.startMission();G.state='play';G.paused=true;G.camOff=off;G.camP=null;G.camZ=null;
  let n=0,sum=0,mx=0,big=0,bsum=0,bmx=0,bbig=0;
  for(let k=0;k<60*70&&G.state==='play';k++){G.cars=[];G.rivals=[];G.inv=9;G.timeLeft=999;G.cond=100;GM.update(1/60);R.render();
    const v=Math.max(0,G.roadTop-G.HZ)/G.H;n++;sum+=v;mx=Math.max(mx,v);if(v>.08)big++;const bv=Math.max(0,G.H-G.roadBot)/G.H;bsum+=bv;bmx=Math.max(bmx,bv);if(bv>.03)bbig++;}
  G.paused=false;return {frames:n,avgVoidPct:+(100*sum/n).toFixed(1),maxVoidPct:+(100*mx).toFixed(1),framesOver8pct:big,bottomGapAvgPct:+(100*bsum/n).toFixed(1),bottomGapMaxPct:+(100*bmx).toFixed(1),framesBottomGap:bbig};})"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:6,tut:1,story:1,volV:2}))")
    pg.goto(sys.argv[1]+'/'); pg.wait_for_timeout(400)
    print('fixed  ',pg.evaluate(JS+'(true)')); print('dynamic',pg.evaluate(JS+'(false)')); print('errors',errs)
