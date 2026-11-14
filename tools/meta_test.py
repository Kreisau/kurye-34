"""Checks for clues, showdown, daily order, knockouts, settings. Usage: python3 tools/meta_test.py http://127.0.0.1:8765 [shotdir]"""
import sys
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]; OUT=sys.argv[2] if len(sys.argv)>2 else None
I="const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const R=await import('/js/rivals.js');const S=await import('/js/save.js');"
def ev(pg,body): return pg.evaluate("(async()=>{"+I+body+"})()")
click=lambda pg,sel: pg.evaluate(f"document.querySelector('{sel}').click()")
res=lambda pg: {'title':pg.inner_text('#resTitle'),'eyebrow':pg.inner_text('#resEyebrow'),'btns':pg.evaluate("[...document.querySelectorAll('#resBtns button')].map(b=>b.textContent)")}
ok=True
def check(name,cond,info=''):
    global ok; ok&=bool(cond); print(('ok  ' if cond else 'FAIL'),name,info)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for (w,h,tag) in [(390,844,'phone'),(1180,820,'ipad')]:
        c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True); pg=c.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
        pg.add_init_script("if(!sessionStorage.k){sessionStorage.k=1;localStorage.setItem('kurye34',JSON.stringify({money:100,shifts:0,tut:1,story:1,volV:2}))}")
        pg.goto(BASE+'/'); pg.wait_for_timeout(500)
        check(tag+' menu buttons', pg.inner_text('#dailyBtn')=='GÜNÜN SİPARİŞİ ×2' and pg.inner_text('#caseBtn')=='DOSYA 0/5', pg.inner_text('#caseBtn'))
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-menu.png')
        # shift completion -> clue
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(1600)
        ev(pg,"G.shift.i=2;G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600)
        r=res(pg); check(tag+' shift done', r['title']=='VARDİYA TAMAM' and r['btns']==['DEVAM'], r)
        click(pg,'#resBtns button'); pg.wait_for_timeout(200); r=res(pg)
        check(tag+' clue shown', 'İPUCU 1/5' in r['eyebrow'] and r['title']=='KIRIK AYNA', r)
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-clue.png')
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300)
        check(tag+' menu case 1/5', pg.inner_text('#caseBtn')=='DOSYA 1/5')
        # knockouts
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(1600)
        k=ev(pg,"""G.timeLeft=999;const pz=G.pos+C.playerZ;const r=R.newRival(C.RIVALS[1],pz+20,.3,G.speed,99);G.rivals=[r];G.kickSide=1;
          GM.landHit(r,C.WPN[0],false);const a={down:r.down>0,out:!!r.out};r.down=0;r.hp=1;GM.landHit(r,C.WPN[0],false);return {first:a,second:{out:!!r.out},bonus:G.bonus};""")
        pg.wait_for_timeout(5200); n=ev(pg,"return G.rivals.length")
        check(tag+' 2nd knockdown = out, removed', k['first']=={'down':True,'out':False} and k['second']['out'] and n==0, (k,n))
        # daily
        ev(pg,"(await import('/js/ui.js')).goMenu()"); click(pg,'#dailyBtn'); pg.wait_for_timeout(1600)
        route=pg.inner_text('#route'); m0=ev(pg,"return G.S.money")
        ev(pg,"G.rivals=[];G.cars=[];G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600); r=res(pg); rows=pg.inner_text('#resRows')
        m1=ev(pg,"return G.S.money"); check(tag+' daily first x2', r['title']=='TESLİM EDİLDİ' and '×2' in rows and m1>m0, (route,m1-m0))
        click(pg,'#resBtns button'); pg.wait_for_timeout(1600); route2=pg.inner_text('#route')
        ev(pg,"G.rivals=[];G.cars=[];G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600); rows=pg.inner_text('#resRows'); m2=ev(pg,"return G.S.money")
        check(tag+' daily same route, no 2nd bonus', route==route2 and '—' in rows and 0<m2-m1<m1-m0, (m2-m1,))
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300)
        check(tag+' daily marked done', pg.inner_text('#dailyBtn').endswith('✓'))
        # showdown
        ev(pg,"G.S.clues=5;S.save();(await import('/js/ui.js')).updateMenu()")
        check(tag+' showdown button', pg.inner_text('#caseBtn')=='HESAPLAŞMA')
        click(pg,'#caseBtn'); pg.wait_for_timeout(200); r=res(pg); check(tag+' dossier', r['btns'][0]=='HESAPLAŞMA', r['btns'])
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-case.png')
        click(pg,'#resBtns button'); pg.wait_for_timeout(2500)
        s=ev(pg,"return {n:G.rivals.length,boss:!!G.rivals[0].boss,hp:G.rivals[0].hp,bar:!document.getElementById('bossBar').hidden,state:G.state}")
        check(tag+' boss spawned', s['n']==1 and s['boss'] and s['hp']==7 and s['bar'], s)
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-boss.png')
        ev(pg,"G.timeLeft=.3"); pg.wait_for_timeout(800); r=res(pg); check(tag+' boss escapes on timeout', r['title']=='KARA KAÇTI', r)
        click(pg,'#resBtns button'); pg.wait_for_timeout(2500); m0=ev(pg,"return G.S.money")
        ev(pg,"const r=G.rivals[0];G.kickSide=1;r.x=G.playerX+.3;r.shoved=2;r.x=1.25;"); pg.wait_for_timeout(700)
        hp=ev(pg,"return G.rivals[0].hp"); check(tag+' boss wreck costs 3 hp', hp==4, hp)
        ev(pg,"const r=G.rivals[0];r.down=0;G.kickSide=1;for(let i=0;i<4&&r.hp>0;i++)GM.landHit(r,C.WPN[0],false);"); pg.wait_for_timeout(1900)
        r=res(pg); m1=ev(pg,"return G.S.money"); check(tag+' boss win + prize', r['title']=='HESAP KAPANDI' and m1-m0==2000, (r['title'],m1-m0))
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-ending.png')
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300)
        check(tag+' case closed, pay +10%', pg.inner_text('#caseBtn')=='DOSYA ✓' and abs(ev(pg,"return (await import('/js/rating.js')).payMult()/ (1+.05*((await import('/js/rating.js')).avgRating()-3)||1)")-1.1)<.2)
        # settings
        click(pg,'#sndBtn'); pg.wait_for_timeout(200)
        pg.evaluate("const r=document.getElementById('s-joy');r.value=150;r.dispatchEvent(new Event('input'));const c=document.getElementById('s-left');c.checked=true;c.dispatchEvent(new Event('change'))")
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-settings.png')
        click(pg,'#setBack'); sv=pg.evaluate("JSON.parse(localStorage.kurye34)")
        check(tag+' settings saved', sv['joy']==1.5 and sv['left']==1 and pg.evaluate("document.body.classList.contains('lefty')"), (sv['joy'],sv['left']))
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(2500)
        box=pg.evaluate("(()=>{const r=document.querySelector('.rpad').getBoundingClientRect(),j=document.getElementById('joyBase').getBoundingClientRect();return {rpadLeft:r.left<innerWidth/2,joyRight:j.left>innerWidth/2}})()")
        check(tag+' lefty layout', box['rpadLeft'] and box['joyRight'], box)
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-lefty-ride.png')
        check(tag+' no page errors', not errs, errs); c.close()
print('ALL PASS' if ok else 'SOME FAILED')
