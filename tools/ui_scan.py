"""UI overlap scan: visits every screen (menu, garage, settings, orders, results, clue, case, story, pause, HUD, tutorial)
in phone, small phone, iPad, landscape and desktop sizes, in Turkish and English, and reports text or controls that
overlap, get clipped or run off screen.
Usage: python3 tools/ui_scan.py http://127.0.0.1:8765 [--fonts node_modules/@fontsource/rubik] [--shots]"""
import sys,json
from playwright.sync_api import sync_playwright
BASE=sys.argv[1] if len(sys.argv)>1 and sys.argv[1].startswith('http') else 'http://127.0.0.1:8765'
SHOTS='--shots' in sys.argv
# --fonts DIR: a local @fontsource/rubik package (npm pack @fontsource/rubik), so text metrics match real devices
FONTS=sys.argv[sys.argv.index('--fonts')+1] if '--fonts' in sys.argv else None
I="const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const UI=await import('/js/ui.js');const M=await import('/js/meta.js');const TU=await import('/js/tutorial.js');"
CHECK=r"""(rootSel)=>{
 const vis=e=>{if(e.closest('[hidden]'))return false;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return false;const cs=getComputedStyle(e);return cs.visibility!=='hidden'&&+cs.opacity>0.05;};
 let mm=document.getElementById('mirrors');if(!mm){mm=document.createElement('div');mm.id='mirrors';mm.style.cssText='position:fixed;pointer-events:none;z-index:0';document.body.append(mm);}
 const roots=rootSel.split(',').map(s=>document.querySelector(s)).filter(e=>e&&vis(e));
 const leaves=[];
 for(const root of roots)for(const e of root.querySelectorAll('*')){
   if(!vis(e))continue;
   const t=e.tagName;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
   if(own||['BUTTON','INPUT','SELECT','CANVAS','OUTPUT'].includes(t)||e.classList.contains('pbar')||e.classList.contains('track')||e.matches('.bars i,.pips i'))leaves.push(e);
 }
 for(const r of roots)if([...r.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))leaves.push(r);
 const name=e=>(e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ').join('.'):''))+' "'+(e.textContent||'').trim().slice(0,24)+'"';
 const out=[];
 // text rects: use Range rects so we compare the ink, not the box
 const clipTo=(rs,b)=>rs.map(r=>({left:Math.max(r.left,b.left),right:Math.min(r.right,b.right),top:Math.max(r.top,b.top),bottom:Math.min(r.bottom,b.bottom)})).filter(r=>r.right>r.left&&r.bottom>r.top);
 const rectsOf=e=>{const b=e.getBoundingClientRect();if(['BUTTON','INPUT','SELECT','CANVAS'].includes(e.tagName)||!e.firstChild)return [b];
   const rs=[];for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim()){const rg=document.createRange();rg.selectNodeContents(n);rs.push(...rg.getClientRects());}
   let out=rs.length?rs:[b];for(let a=e;a&&a!==document.body;a=a.parentElement){const cs=getComputedStyle(a);if(cs.overflow!=='visible'||cs.textOverflow==='ellipsis')out=clipTo(out,a.getBoundingClientRect());}return out;};
 const R=leaves.map(rectsOf);
 for(let i=0;i<leaves.length;i++)for(let j=i+1;j<leaves.length;j++){
   const a=leaves[i],b=leaves[j];if(a.contains(b)||b.contains(a))continue;
   let bw=0,bh=0;for(const p of R[i])for(const q of R[j]){const w=Math.min(p.right,q.right)-Math.max(p.left,q.left),h=Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top);if(w>2&&h>2&&w*h>bw*bh){bw=w;bh=h;}}
   if(bw)out.push('OVERLAP '+name(a)+' x '+name(b)+' '+Math.round(bw)+'x'+Math.round(bh));
 }
 for(const e of leaves){
   const cs=getComputedStyle(e);if(cs.textOverflow==='ellipsis')continue;
   if(e.scrollWidth>e.clientWidth+1&&e.clientWidth>0&&cs.overflow!=='visible')out.push('CLIPPED '+name(e)+' '+e.scrollWidth+'>'+e.clientWidth);
   const rr=rectsOf(e);if(!rr.length)continue;const r={left:Math.min(...rr.map(x=>x.left)),right:Math.max(...rr.map(x=>x.right))};if(r.right>innerWidth+1||r.left<-1)out.push('OFFSCREEN '+name(e)+' '+Math.round(r.left)+'..'+Math.round(r.right)+' / '+innerWidth);
 }
 return out;}"""
VIEWS=[('iphone',390,844,True),('se',375,667,True),('small',320,568,True),('ipad',820,1180,True),('land',844,390,True),('desktop',1280,800,False)]
MIRJS="const mm=document.getElementById('mirrors');if(mm){mm.hidden=true;if(G.MIR&&!document.getElementById('hud').hidden){const k=innerWidth/G.W,Mi=G.MIR;mm.innerHTML='<canvas id=mirL></canvas><canvas id=mirR></canvas>';for(const [id,x] of [['mirL',Mi.l],['mirR',Mi.r]]){const c=document.getElementById(id);c.style.cssText='position:fixed;left:'+x*k+'px;top:'+Mi.y*k+'px;width:'+Mi.w*k+'px;height:'+Mi.h*k+'px';}mm.hidden=false;}}"
STEPS=[
 ('menu','#menu',"UI.goMenu();"),
 ('garage','#garage,#toast',"UI.showGarage();UI.toast('Mont seviye 1',99999);"),
 ('settings','#settings',"document.getElementById('sndBtn').click();"),
 ('brief','#brief',"UI.goMenu();G.shift={L:7,i:1,cards:{eldiven:1,sigorta:2,kisayol:1},earned:0};GM.prepDelivery();"),
 ('result-pick','#result',"G.shift={L:7,i:0,cards:{},earned:0};G.route=GM.makeOffer(GM.KINDS[2]);GM.startMission();G.state='play';G.fine=150;G.bonus=85;UI.finish(true);"),
 ('result-final','#result',"G.shift={L:7,i:2,cards:{},earned:300};G.route=GM.makeOffer(GM.KINDS[2]);GM.startMission();G.state='play';UI.finish(true);"),
 ('result-fail','#result',"G.shift={L:7,i:1,cards:{},earned:120};G.route=GM.makeOffer(GM.KINDS[2]);GM.startMission();G.state='play';UI.finish(false,'time');"),
 ('clue','#result',"UI.goMenu();M.showClue(M.CLUES[3],[{t:'GARAJA GİT',cls:'cta',fn:()=>{}}]);"),
 ('case','#result',"UI.goMenu();M.showCase();"),
 ('story','#story',"UI.goMenu();document.getElementById('storyBtn').click();"),
 ('pause','#pause',"UI.goMenu();G.shift={L:7,i:0,cards:{},earned:0};G.route=GM.makeOffer(GM.KINDS[2]);GM.startMission();G.state='play';UI.togglePause(true);"),
 ('hud','#hud,#toast,#cd,#controls,#bossBar,#mirrors',"UI.togglePause(false);G.timeLeft=7.3;G.state='play';UI.toast('Turuncu kurye kaldırımdaki engele çarptı, saf dışı!  +110 TL',99999);UI.hudTick();"),
 ('hud-radio','#hud,#toast,#cd,#radio,#controls,#mirrors',"const RD=await import('/js/radio.js');RD.radioReset();RD.radioSay('USTA','Kara senin bölgeni aldı. Bölge almak için adam ezmek gerekmezdi ama.');G.paused=false;G.timeLeft=7.3;await new Promise(r=>setTimeout(r,400));G.paused=true;UI.toast('Turuncu kurye kaldırımdaki engele çarptı, saf dışı!  +110 TL',99999);UI.hudTick();await new Promise(r=>setTimeout(r,100));UI.hudTick();"),
 ('result-pick2','#result',"G.paused=false;UI.goMenu();G.S.cu=10;G.shift={L:7,i:1,cards:{cam:1},earned:640};G.route=GM.makeOffer(GM.KINDS[2]);GM.startMission();G.state='play';UI.finish(true);"),
 ('tutorial','#hud,#radio,#controls',"UI.goMenu();TU.startTutorial();"),
]
res={}
import os
FONT_CSS="@font-face{font-family:'Rubik';font-style:normal;font-weight:500;src:url(https://fonts.gstatic.com/rubik-latin-ext-500-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:500;src:url(https://fonts.gstatic.com/rubik-latin-500-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:700;src:url(https://fonts.gstatic.com/rubik-latin-ext-700-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:700;src:url(https://fonts.gstatic.com/rubik-latin-700-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:800;src:url(https://fonts.gstatic.com/rubik-latin-ext-800-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:800;src:url(https://fonts.gstatic.com/rubik-latin-800-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:900;src:url(https://fonts.gstatic.com/rubik-latin-ext-900-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}\n@font-face{font-family:'Rubik';font-style:normal;font-weight:900;src:url(https://fonts.gstatic.com/rubik-latin-900-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}"
def font_route(r):
  u=r.request.url
  if not FONTS: return r.abort()
  if 'googleapis' in u: return r.fulfill(body=FONT_CSS,content_type='text/css')
  f=FONTS+'/files/'+u.rsplit('/',1)[1]
  return r.fulfill(path=f,content_type='font/woff2') if os.path.exists(f) else r.abort()
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for lang in ['tr','en']:
    for vn,w,hh,touch in VIEWS:
      ctx=b.new_context(viewport={'width':w,'height':hh},device_scale_factor=2,has_touch=touch,is_mobile=touch and w<700)
      pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.route('**/fonts.g*/**',font_route)
      pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:2480,shifts:7,tut:1,story:1,volV:2,clues:3,lang:'%s',owned:['m50'],cur:'m50',weapons:['kick'],wpn:'kick'}))"%lang)
      pg.goto(BASE+'/');pg.evaluate('document.fonts.ready');pg.wait_for_timeout(900)
      for sn,roots,js in STEPS:
        try:
          pg.evaluate("(async()=>{"+I+js+"})()");pg.wait_for_timeout(350 if sn not in('tutorial','story') else 1600)
          if sn=='tutorial':pg.evaluate("(async()=>{"+I+"if(G.state==='count')G.state='play';})()");pg.wait_for_timeout(2500)
          pg.evaluate("(async()=>{"+I+MIRJS+"})()")
          issues=pg.evaluate(CHECK,roots+(',#mirrors' if 'hud' in roots else ''))
        except Exception as e: issues=['ERROR '+str(e)[:150]]
        for it in issues: res.setdefault(it,[]).append(f'{lang}/{vn}/{sn}')
        if SHOTS: pg.screenshot(path=f'ui-{lang}-{vn}-{sn}.png')
      for e in errs: res.setdefault('PAGEERROR '+e[:120],[]).append(f'{lang}/{vn}')
      ctx.close()
for k,v in sorted(res.items(),key=lambda x:x[0]):
  print(k,'\n    ',', '.join(v[:8])+(' (+%d)'%(len(v)-8) if len(v)>8 else ''))
print('TOTAL',len(res))
print('ALL PASS' if not res else 'ISSUES FOUND')
