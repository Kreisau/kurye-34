"""Ambulance check: on 16 routes (all districts, heavy traffic, player in every lane) the ambulance must get past without
getting stuck in traffic, and must not be caught again once it has passed.
Usage: python3 tools/amb_test.py http://127.0.0.1:8765"""
import sys,json
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]
I="const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const TR=await import('/js/traffic.js');const UI=await import('/js/ui.js');"
class H:
    def __init__(s):
        s.p=sync_playwright().start();s.b=s.p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        s.pg=s.b.new_page();s.errs=[];s.pg.on('pageerror',lambda e:s.errs.append(str(e)));s.pg.route('**/fonts.g*/**',lambda r:r.abort())
        s.pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:500,shifts:6,tut:1,story:1,volV:2}))");s.pg.goto(BASE+'/');s.pg.wait_for_timeout(700)
    def ev(s,body): return s.pg.evaluate("(async()=>{"+I+body+"})()")
    def close(s): s.b.close();s.p.stop()
h=H()
res=h.ev("""
const out=[];
for(let tr=0;tr<16;tr++){
  UI.goMenu();G.shift={L:5+tr%4,i:2,cards:{},earned:0};
  let o;for(let k=0;k<300;k++){o=GM.makeOffer(GM.KINDS[2]);if(o.D.name===C.DISTRICTS[tr%6].name)break;}
  o.seed=1000+tr;if(tr%3===0)o.ev='trafik';G.route=o;GM.startMission();G.state='play';G.timeLeft=9999;G.rivals=[];G.ambT=9999;
  const lane=[.66,-.66,0][tr%3];
  // warm up 6 s, then spawn
  let t=0;const step=()=>{G.inv=99;G.playerX=lane;G.timeLeft=9999;G.ambT=9999;GM.update(1/60);t+=1/60;};
  for(let k=0;k<360;k++)step();
  if(G.state!=='play'){out.push({tr,skip:G.state});continue;}
  TR.spawnAmb();const a=G.cars.find(c=>c.amb);const t0=t;let tPass=null,stuck=0,caught=0,maxGap=0,fined=false,gone=false,minAfter=1e9;
  for(let k=0;k<60*40;k++){
    step();if(G.state!=='play')break;
    if(a.dead||!G.cars.includes(a)){gone=true;break;}
    const gap=a.z-(G.pos+C.playerZ);
    if(tPass==null){if(a.speed<a.base*.3)stuck+=1/60;if(a.passed)tPass=t-t0;}
    else{maxGap=Math.max(maxGap,gap);if(maxGap>1500){minAfter=Math.min(minAfter,gap);if(gap<400)caught+=1/60;}}
    fined=a.fined;
  }
  out.push({tr,d:o.D.name,ev:o.ev||'',cars:G.cars.length,lane,tPass:tPass&&+tPass.toFixed(1),stuck:+stuck.toFixed(1),caught:+caught.toFixed(1),minAfter:Math.round(minAfter),gone,fined});
}
return out;""")
ok=True
for r in res:
    bad=r.get('stuck',0)>2 or r.get('caught',0)>0 or (r.get('tPass') is None and 'skip' not in r)
    ok&=not bad;print('FAIL' if bad else 'ok  ',json.dumps(r,ensure_ascii=False))
print('errors',h.errs);h.close()
print('ALL PASS' if ok and not h.errs else 'SOME FAILED')
