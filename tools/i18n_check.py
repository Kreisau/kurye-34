"""Lists Turkish text that the English layer leaves untranslated.
1) static: every string literal in js/ and every text node in index.html is run through toEN()
2) live: plays through the main screens in English and collects visible text that still looks Turkish
Usage: python3 tools/i18n_check.py http://127.0.0.1:8765 [shotdir]"""
import sys, re, glob, json
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]; OUT=sys.argv[2] if len(sys.argv)>2 else None
TR=re.compile(r"[çğıöşüÇĞİÖŞÜâ]")
lits=set()
for f in glob.glob('js/*.js'):
    if f.endswith('i18n.js'): continue
    s=open(f,encoding='utf8').read()
    for a,b in re.findall(r"'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`",s):
        t=a or b
        if TR.search(t) or re.search(r"[A-Za-z]{3,} [a-z]{3,}",t): lits.add(t)
h=open('index.html',encoding='utf8').read(); body=re.sub(r'<script.*?</script>','',h[h.index('<body>'):],flags=re.S)
lits|={t.strip() for t in re.findall(r'>([^<>]+)<',body) if t.strip()}
SKIP=json.loads(open('tools/i18n_keep.json',encoding='utf8').read())
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("if(!sessionStorage.k){sessionStorage.k=1;localStorage.setItem('kurye34',JSON.stringify({money:5000,shifts:0,tut:1,story:1,volV:2,lang:'en'}))}")
    pg.goto(BASE+'/'); pg.wait_for_timeout(500)
    res=pg.evaluate("async(l)=>{const {toEN}=await import('/js/i18n.js');return l.map(s=>[s,toEN(s)])}",sorted(lits))
    left=[(a,b) for a,b in res if TR.search(b) and not any(k in a for k in SKIP)]
    print('STATIC untranslated:',len(left))
    for a,b in left: print('  ',repr(a[:90]),'->',repr(b[:90]))
    # live walk
    seen=set()
    def grab(tag):
        for t in pg.evaluate("[...document.querySelectorAll('.screen:not([hidden]) *, .hud *, #toast, #radio *, .controls *')].flatMap(e=>[...e.childNodes].filter(n=>n.nodeType===3&&n.nodeValue.trim()&&e.offsetParent!==null).map(n=>n.nodeValue.trim()))"):
            if TR.search(t) and not any(k in t for k in SKIP): seen.add((tag,t))
        if OUT: pg.screenshot(path=f'{OUT}/en-{tag}.png')
    click=lambda sel: pg.evaluate(f"document.querySelector('{sel}').click()")
    I="const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');"
    ev=lambda body: pg.evaluate("(async()=>{"+I+body+"})()")
    grab('menu'); click('#sndBtn'); grab('settings'); click('#setBack'); click('#garageBtn'); pg.wait_for_timeout(200); grab('garage'); click('#gBack')
    click('#storyBtn'); pg.wait_for_timeout(200)
    for i in range(6): grab(f'story{i}'); click('#sNext'); pg.wait_for_timeout(150)
    click('#tutBtn'); pg.wait_for_timeout(1800)
    for i in range(7): grab(f'tut{i}'); ev("G.tut.flash=0.01"); pg.wait_for_timeout(350)
    ev("G.cars=[];G.rivals=[];G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600); grab('tut-result'); click('#resBtns button'); pg.wait_for_timeout(300); grab('cards0'); click('#picks button'); pg.wait_for_timeout(300); grab('brief')
    click('#offers button'); pg.wait_for_timeout(1700); grab('ride')
    ev("GM.damage(5,'Taksiye çarptın')"); pg.wait_for_timeout(100); grab('toast1')
    ev("const R=await import('/js/rivals.js');const r=R.newRival(C.RIVALS[2],G.pos+C.playerZ+20,1.25,G.speed,9);r.shoved=2;G.rivals=[r];"); pg.wait_for_timeout(300); grab('toast2')
    click('#pauseBtn'); grab('pause'); click('#resumeBtn')
    ev("G.rivals=[];G.cars=[];G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600); grab('delivered')
    click('#resBtns button'); pg.wait_for_timeout(300); click('#offers button'); pg.wait_for_timeout(1700)
    ev("G.timeLeft=.2"); pg.wait_for_timeout(600); grab('failed'); click('#resBtns button:last-child'); pg.wait_for_timeout(200)
    ev("G.S.pd=11;"); click('#startBtn'); pg.wait_for_timeout(200); grab('cards'); click('#picks button'); pg.wait_for_timeout(200); click('#offers button'); pg.wait_for_timeout(1700)
    ev("G.rivals=[];G.cars=[];G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600); grab('zone-taken'); click('#resBtns button'); pg.wait_for_timeout(200); grab('clue')
    click('#resBtns button'); pg.wait_for_timeout(300); grab('orders2'); click('#offers button'); pg.wait_for_timeout(1700)
    click('#pauseBtn'); grab('pause-pot'); click('#quitBtn'); grab('quit-arm'); click('#resumeBtn')
    ev("G.shift.i=4;G.rivals=[];G.cars=[];G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600); grab('shift-done')
    click('#resBtns button:last-child'); pg.wait_for_timeout(200); click('#caseBtn'); pg.wait_for_timeout(200); grab('case'); click('#resBtns button:last-child')
    ev("G.S.clues=5;G.S.pd=66;(await import('/js/ui.js')).updateMenu()"); grab('menu-sisli'); click('#caseBtn'); pg.wait_for_timeout(200); grab('case-sisli'); click('#resBtns button:last-child')
    ev("G.S.pd=72;(await import('/js/ui.js')).updateMenu()"); grab('menu2'); click('#caseBtn'); pg.wait_for_timeout(200); grab('case5'); click('#resBtns button'); pg.wait_for_timeout(2300); grab('boss')
    ev("G.timeLeft=.2"); pg.wait_for_timeout(700); grab('boss-fail'); click('#resBtns button'); pg.wait_for_timeout(2300)
    ev("const r=G.rivals[0];G.kickSide=1;r.x=G.playerX+.3;r.z=G.pos+C.playerZ;G.cars=[];for(let i=0;i<8;i++)GM.landHit(r,C.WPN[0],false);"); pg.wait_for_timeout(400); grab('boss-rage'); ev("const r=G.rivals[0];for(let i=0;i<20&&r.hp>0;i++)GM.landHit(r,C.WPN[0],false);"); pg.wait_for_timeout(300); grab('boss-toast'); pg.wait_for_timeout(1600); grab('ending')
    print('LIVE untranslated:',len(seen))
    for tag,t in sorted(seen): print('  ',tag,'|',t[:110])
    print('errors',errs)
