"""Street life checks: lights/crossings, pedestrians, checkpoint, dog, wrong-way courier, fines, time of day.
Usage: python3 tools/street_test.py http://127.0.0.1:8765 [shotdir]"""
import sys
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]; OUT=sys.argv[2] if len(sys.argv)>2 else None
I="const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const ST=await import('/js/street.js');const S=ST.S;const pz=()=>G.pos+C.playerZ;"
ok=True
def check(name,cond,info=''):
    global ok; ok&=bool(cond); print(('ok  ' if cond else 'FAIL'),name,info)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:500,shifts:6,tut:1,story:1,volV:2}))")
    pg.goto(BASE+'/'); pg.wait_for_timeout(500)
    ev=lambda body: pg.evaluate("(async()=>{"+I+body+"})()")
    shot=lambda n: OUT and pg.screenshot(path=f'{OUT}/st-{n}.png')
    click=lambda sel: pg.evaluate(f"document.querySelector('{sel}').click()")
    # time of day
    tods=ev("const out=[];for(let L=0;L<4;L++){G.shift={L,i:0,cards:{},earned:0};const o=GM.makeOffer(GM.KINDS[1]);out.push([GM.tod(L).k,o.D.theme]);}G.shift=null;return out;")
    check('time of day per shift', [t[0] for t in tods]==['SABAH','ÖĞLEN','AKŞAM','GECE'] and tods[0][1]=='morning' and tods[1][1]=='day' and tods[3][1] in('night','neon'), tods)
    click('#startBtn'); pg.wait_for_timeout(300); eb=pg.inner_text('#bEyebrow'); check('brief shows time', 'AKŞAM +%10' in eb, eb)
    click('#offers button:last-child'); pg.wait_for_timeout(1700)
    ev("let k=0;while(!S.lights.length&&++k<40){G.route=GM.makeOffer(GM.KINDS[2]);GM.startMission();G.state='play';}")
    s=ev("G.timeLeft=999;return {lights:S.lights.length,xw:G.segs.filter(s=>s.xw).length,cops:S.cops.length,dogs:S.dogs.length,d:G.route.d}")
    check('lights and crossings placed', s['lights']>=1 and s['xw']==3*s['lights'], s)
    # cars stop at red
    r=ev("""const l=S.lights[0];G.rivals=[];G.inv=99;G.pos=l.z-C.playerZ-3200;G.speed=0;G.paused=true;
      l.off=(9-G.clock%13+13)%13;l.was=false; const c=G.cars[0];G.cars=[c];c.z=l.z-900;c.x=0;c.tl=0;c.speed=c.base;c.st='drive';c.k='car';c.bus=false;c.wild=false;
      for(let k=0;k<150;k++){G.speed=0;GM.update(1/60);} return {st:l.st,carSpeed:Math.round(c.speed),before:c.z<l.z,gap:Math.round(l.z-c.z),peds:S.peds.length};""")
    check('car stops at red, pedestrians cross', r['st']=='red' and r['carSpeed']<30 and r['before'] and r['peds']>=2, r)
    ev("const l=S.lights[0];G.pos=l.z-C.playerZ-1500;G.playerX=-.33;for(let k=0;k<3;k++)GM.update(1/60);G.paused=true;(await import('/js/render.js')).render();"); pg.wait_for_timeout(150); shot('red-light')
    r=ev("""const l=S.lights[0];const run=st=>{l.passed=false;G.fine=0;G.pos=l.z-C.playerZ-800;l.off=((st==='red'?10:2)-G.clock%13+13)%13;for(let i=0;i<40;i++){G.inv=99;G.speed=C.maxSpeed*.4;GM.update(1/60);}return G.fine;};
      const a=run('red'),b=run('green');l.off=(9-G.clock%13+13)%13;l.was=false;G.pos=l.z-C.playerZ-1500;for(let k=0;k<30;k++){G.speed=0;GM.update(1/60);}return {red:a,green:b,peds:S.peds.length};""")
    check('running a red light is fined, green is not', r['red']==75 and r['green']==0 and r['peds']>=1, r)
    r=ev("""S.lights.forEach(l=>l.passed=true);const p=S.peds[0];p.x=.2;G.fine=0;G.inv=0;G.crashT=0;G.graceT=0;G.pos=p.z-C.playerZ;G.playerX=p.x;const c0=G.cond;GM.update(1/60);return {fine:G.fine,pedHit:G.pedHit,crash:G.crashT>0,lost:c0-G.cond,flee:!!p.flee};""")
    check('hitting a pedestrian: fine, rating flag, crash', r['fine']==100 and r['pedHit'] and r['crash'] and r['flee'], r)
    # checkpoint
    r=ev("""G.crashT=0;G.inv=99;G.fine=0;S.peds=[];S.cops=[{n:0,z:pz()+600,side:1,warn:false,done:false}];G.speed=C.maxSpeed*.45;for(let k=0;k<90;k++){G.speed=C.maxSpeed*.45;GM.update(1/60);}const a=G.fine;
      S.cops=[{n:0,z:pz()+600,side:1,warn:false,done:false}];for(let k=0;k<400&&!S.cops[0].done;k++){G.speed=C.maxSpeed*.2;GM.update(1/60);}return {fast:a,slow:G.fine-a};""")
    check('checkpoint: fast fined, slow not', r['fast']==150 and r['slow']==0, r)
    ev("G.pos=S.cops[0].z-C.playerZ-2600;G.playerX=0;GM.update(1/60);(await import('/js/render.js')).render();"); pg.wait_for_timeout(150); shot('cop')
    # dog
    r=ev("""G.fine=0;S.cops=[];G.slipT=0;G.cars=[];S.dogs=[{z0:pz()+500,z:pz()+500,x:1.08,side:1,st:'wait',t:0,nip:0}];G.playerX=.6;let slipped=false,st='';
      for(let k=0;k<200;k++){G.speed=C.maxSpeed*.25;GM.update(1/60);if(G.slipT>0)slipped=true;if(S.dogs[0])st=S.dogs[0].st;if(k===60){(await import('/js/render.js')).render();}}return {slipped,st};""")
    check('dog chases and makes you wobble', r['slipped'], r)
    ev("S.dogs=[{z0:pz()+300,z:pz()+260,x:G.playerX+.25,side:1,st:'chase',t:5,nip:1}];GM.update(1/60);(await import('/js/render.js')).render();"); pg.wait_for_timeout(150); shot('dog')
    r=ev("""S.dogs=[];G.slipT=0;G.crashT=0;G.inv=0;G.graceT=0;G.playerX=.33;S.onc=[{z:pz()+1500,x:.33,v:C.maxSpeed*.3,honk:false}];(await import('/js/render.js')).render();await new Promise(r=>setTimeout(r,200));
      let cr=false;for(let k=0;k<120;k++){G.speed=C.maxSpeed*.3;GM.update(1/60);if(G.crashT>0)cr=true;}return {crash:cr};""")
    check('wrong-way courier collision', r['crash'], r)
    ev("G.crashT=0;G.inv=99;S.onc=[{z:pz()+1100,x:-.33,v:0,honk:true}];G.playerX=.2;GM.update(1/60);(await import('/js/render.js')).render();"); pg.wait_for_timeout(150); shot('oncoming')
    # fines on the result screen
    ev("G.paused=false;G.fine=150;G.cars=[];S.onc=[];S.cops.forEach(c=>c.done=true);S.lights.forEach(l=>l.passed=true);G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2700)
    rows=pg.inner_text('#resRows'); check('fines row on result', 'Cezalar' in rows and '−150 TL' in rows, rows.replace('\n',' | ')[:160])
    # a full night ride for a visual
    ev("(await import('/js/ui.js')).goMenu();G.shift={L:3,i:0,cards:{},earned:0};G.route=GM.makeOffer(GM.KINDS[1]);GM.startMission();"); pg.wait_for_timeout(3500); shot('night')
    check('no page errors', not errs, errs)
print('ALL PASS' if ok else 'SOME FAILED')
