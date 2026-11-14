"""Rides a hilly route and reports where the bike sits on screen (bottom edge y / canvas H, top edge y / H).
Fails when the bike is cut off. Usage: python3 tools/bike_vis_test.py http://127.0.0.1:8765"""
import sys
from playwright.sync_api import sync_playwright
JS="""(async()=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const R=await import('/js/render.js');
  const D=C.DISTRICTS[2];G.shift={L:3,i:0,cards:{},earned:0};
  G.route={D,len:2400,curv:D.curv,hill:D.hill,up:D.up,seed:4242,A:C.prof('Galata'),B:C.prof('Cihangir'),d:5,ev:null,kind:'x',from:'Galata',to:'Cihangir',time:999,pay:50,rest:'x'};
  GM.startMission();G.state='play';G.paused=true;G.camP=null;G.camZ=null;G.camL=null;
  let n=0,bot=0,top=9,cut=0;
  for(let k=0;k<60*70&&G.state==='play';k++){G.cars=[];G.rivals=[];G.inv=9;G.timeLeft=999;G.cond=100;GM.update(1/60);R.render();
    const dh=G.pdw*.9,b=G.py/G.H,t=(G.py-dh)/G.H;n++;bot=Math.max(bot,b);top=Math.min(top,t);if(b>.99||t<.02)cut++;}
  G.paused=false;return {W:G.W,H:G.H,frames:n,maxBottomPct:+(100*bot).toFixed(1),minTopPct:+(100*top).toFixed(1),framesCut:cut};})()"""
bad=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(1920,969),(1366,650),(390,844),(844,390),(768,1024)]:
        pg=b.new_page(viewport={'width':w,'height':h}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
        pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:6,tut:1,story:1,volV:2}))")
        pg.goto(sys.argv[1]+'/'); pg.wait_for_timeout(400)
        r=pg.evaluate(JS); print(w,h,r,errs); bad+=r['framesCut']>0; pg.close()
print('BAD' if bad else 'OK')
