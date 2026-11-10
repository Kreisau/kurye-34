"""Rival behaviour check: plays a delivery with 3 rivals forced in, counts clipping frames
(rival overlapping a car or a closed lane while not down) and rival crashes; then a shove test.
Usage: python3 tools/rival_test.py http://127.0.0.1:8765"""
import sys, time
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]
PROBE = """(async()=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');
 const pz=G.pos+C.playerZ; let clip=0;
 for(const r of G.rivals){ if(r.down>0)continue;
   for(const c of G.cars){const dz=c.z-r.z; if(Math.abs(dz)<50&&Math.abs(c.x-r.x)<(c.hit+C.PW)/2-.02)clip++;}
   const s=G.segs[Math.floor(r.z/C.segL)%G.segs.length]; if(s&&s.cl!=null&&((s.cl===2&&r.x>.4)||(s.cl===0&&r.x<-.4)))clip++; }
 return {clip, state:G.state, down:G.rivals.filter(r=>r.down>0).length, n:G.rivals.length, bonus:G.bonus,
   near:G.rivals.map(r=>({dz:Math.round(r.z-pz),x:+r.x.toFixed(2)}))};})()"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []; toasts = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:6,tut:1,story:1}))")
    pg.goto(BASE + '/'); pg.wait_for_timeout(500)
    pg.evaluate("document.getElementById('startBtn').click()"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelectorAll('#offers button')[2].click()"); pg.wait_for_timeout(1800)
    pg.evaluate("""(async()=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const R=await import('/js/rivals.js');
      const pz=G.pos+C.playerZ; G.rivals=C.RIVALS.slice(0,3).map((p,i)=>R.newRival(p,pz-600-i*500,[-.6,0,.6][i],G.speed,3)); G.timeLeft=999;})()""")
    pg.evaluate("new MutationObserver(()=>{const t=document.getElementById('toast').textContent;(window.__t||(window.__t=[])).push(t)}).observe(document.getElementById('toast'),{childList:true,characterData:true,subtree:true})")
    # shove tests first: (a) car right beside the rival, (b) rival near the wall
    for name, setup in [('into car', "const c=G.cars[0]; c.z=r.z+120; c.x=.66; c.speed=G.speed*.5; c.base=c.speed; r.x=.3;"),
                        ('into wall', "r.x=.82;G.playerX=.5;")]:
        pg.evaluate("""(async()=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const R=await import('/js/rivals.js');
          G.crashT=0;G.inv=0;G.playerX=0;const pz=G.pos+C.playerZ;const r=R.newRival(C.RIVALS[2],pz+20,.3,G.speed,99);G.rivals=[r];"""+setup+"""})()""")
        b0 = pg.evaluate("(async()=>{const {G}=await import('/js/g.js');return G.bonus})()")
        kb = pg.keyboard; kb.press('Space'); pg.wait_for_timeout(1500)
        a = pg.evaluate("(async()=>{const {G}=await import('/js/g.js');const r=G.rivals[0];return {down:r.down>0,x:+r.x.toFixed(2),bonus:G.bonus}})()")
        print('shove', name, '-> down', a['down'], 'x', a['x'], 'bonus +', a['bonus'] - b0, '|', (pg.evaluate("window.__t||[]") or [])[-1:])
    # long run with an in-page per-frame clip counter
    pg.evaluate("""(async()=>{const {G}=await import('/js/g.js');const C=await import('/js/config.js');const R=await import('/js/rivals.js');
      const pz=G.pos+C.playerZ; G.rivals=C.RIVALS.slice(0,3).map((p,i)=>R.newRival(p,pz-600-i*500,[-.6,0,.6][i],G.speed,3)); G.timeLeft=999; G.cond=100;
      window.__clip=0;window.__fr=0;const tick=()=>{window.__fr++;for(const r of G.rivals){if(r.down>0)continue;
        for(const c of G.cars){if(Math.abs(c.z-r.z)<50&&Math.abs(c.x-r.x)<(c.hit+C.PW)/2-.02)window.__clip++;}
        const s=G.segs[Math.floor(r.z/C.segL)%G.segs.length];if(s&&s.cl!=null&&((s.cl===2&&r.x>.42)||(s.cl===0&&r.x<-.42)))window.__clip++;}
        requestAnimationFrame(tick);};requestAnimationFrame(tick);})()""")
    clips = 0; frames = 0; t0 = time.time(); kb = pg.keyboard
    while time.time() - t0 < 45:
        s = pg.evaluate(PROBE); frames += 1; clips += s['clip']
        if s['state'] != 'play': break
        k = ['ArrowLeft', 'ArrowRight', 'Space', None][frames % 4]
        if k: kb.down(k); pg.wait_for_timeout(120); kb.up(k)
        else: pg.wait_for_timeout(120)
    print('per-frame clips', pg.evaluate('window.__clip'), 'of', pg.evaluate('window.__fr'), 'frames')
    toasts = [t for t in pg.evaluate("window.__t||[]") if 'kurye' in t]
    print('probe frames', frames, 'clip samples', clips, '| final', s)
    print('rival toasts:', sorted(set(toasts))[:12])
    print('errors', errs)
