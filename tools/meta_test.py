"""Checks for clues, district conquest, showdown, ending and free ride, knockouts, settings. Usage: python3 tools/meta_test.py http://127.0.0.1:8765 [shotdir]"""
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
        pg.add_init_script("if(!sessionStorage.k){sessionStorage.k=1;localStorage.setItem('kurye34',JSON.stringify({money:100,shifts:1,pd:11,tut:1,story:1,volV:2}))}")
        pg.goto(BASE+'/'); pg.wait_for_timeout(500)
        check(tag+' menu: case 0/5, Kadıköy 11/12, no free-ride picker', pg.inner_text('#caseBtn')=='DOSYA 0/5' and 'Kadıköy · 11/12' in pg.inner_text('#mShift') and not pg.is_visible('#zonePick'), pg.inner_text('#mShift'))
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-menu.png')
        # the twelfth delivery takes the district (mid-shift, no full shift needed) -> clue; cashing out keeps the progress
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#picks button'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(1600)
        ev(pg,"G.pos=G.finishZ-C.playerZ-C.segL*9;"); pg.wait_for_timeout(2600)
        r=res(pg); check(tag+' delivery 12 takes Kadıköy', r['title']=='TESLİM EDİLDİ' and r['btns']==['DEVAM'] and 'Kadıköy artık senin' in pg.inner_text('#resSub') and 'Kadıköy ✓' in pg.inner_text('#resRows'), r)
        click(pg,'#resBtns button'); pg.wait_for_timeout(200); r=res(pg)
        check(tag+' clue shown, shift goes on', 'İPUCU 1/5' in r['eyebrow'] and r['title']=='KIRIK AYNA' and r['btns'][0]=='DEVAM ET' and len(r['btns'])==2, r)
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-clue.png')
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300); r=res(pg); check(tag+' cash-out', r['title']=='KASA ALINDI', r)
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300)
        check(tag+' menu case 1/5, Üsküdar next', pg.inner_text('#caseBtn')=='DOSYA 1/5' and 'Üsküdar · 0/12' in pg.inner_text('#mShift') and pg.inner_text('#mZones')=='1/6', pg.inner_text('#mShift'))
        # a failed delivery ends the shift but takes no progress back
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#picks button'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(1600)
        ev(pg,"G.timeLeft=.2"); pg.wait_for_timeout(700); r=res(pg)
        check(tag+' fail keeps district progress', r['title']=='VARDİYA BİTTİ' and ev(pg,"return G.S.pd")==12, r)
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300)
        # knockouts
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#picks button'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(1600)
        k=ev(pg,"""G.timeLeft=999;const pz=G.pos+C.playerZ;const r=R.newRival(C.RIVALS[1],pz+20,.3,G.speed,99);G.rivals=[r];G.kickSide=1;
          GM.landHit(r,C.WPN[0],false);const a={down:r.down>0,out:!!r.out};r.down=0;r.hp=1;GM.landHit(r,C.WPN[0],false);return {first:a,second:{out:!!r.out},bonus:G.bonus};""")
        pg.wait_for_timeout(5200); n=ev(pg,"return G.rivals.length")
        check(tag+' 2nd knockdown = out, removed', k['first']=={'down':True,'out':False} and k['second']['out'] and n==0, (k,n))
        # showdown
        ev(pg,"(await import('/js/ui.js')).goMenu();G.S.clues=5;G.S.pd=66;S.save();(await import('/js/ui.js')).updateMenu()")
        check(tag+' no showdown before Şişli is taken', pg.inner_text('#caseBtn')!='HESAPLAŞMA', pg.inner_text('#caseBtn'))
        ev(pg,"G.S.pd=72;S.save();(await import('/js/ui.js')).updateMenu()")
        check(tag+' showdown button', pg.inner_text('#caseBtn')=='HESAPLAŞMA')
        click(pg,'#caseBtn'); pg.wait_for_timeout(200); r=res(pg); check(tag+' dossier', r['btns'][0]=='HESAPLAŞMA', r['btns'])
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-case.png')
        click(pg,'#resBtns button'); pg.wait_for_timeout(2500)
        s=ev(pg,"return {n:G.rivals.length,boss:!!G.rivals[0].boss,hp:G.rivals[0].hp,bar:!document.getElementById('bossBar').hidden,state:G.state}")
        check(tag+' boss spawned', s['n']==1 and s['boss'] and s['hp']==16 and s['bar'] and ev(pg,'return G.finishZ/C.segL')>4500, s)
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-boss.png')
        ev(pg,"G.timeLeft=.3"); pg.wait_for_timeout(800); r=res(pg); check(tag+' boss escapes on timeout', r['title']=='KARA KAÇTI', r)
        click(pg,'#resBtns button'); pg.wait_for_timeout(2500); m0=ev(pg,"return G.S.money")
        ev(pg,"const r=G.rivals[0];G.kickSide=1;r.x=G.playerX+.3;r.shoved=2;r.x=1.25;"); pg.wait_for_timeout(700)
        hp=ev(pg,"return G.rivals[0].hp"); check(tag+' boss wreck costs 3 hp', hp==13, hp)
        ev(pg,"const r=G.rivals[0];r.down=0;r.vx=0;G.playerX=-.3;r.x=0;r.z=G.pos+C.playerZ;G.cars=[];G.kickSide=1;for(let i=0;i<5;i++)GM.landHit(r,C.WPN[0],false);GM.update(1/60);const rage=!!r.rage;for(let i=0;i<20&&r.hp>0;i++)GM.landHit(r,C.WPN[0],false);window.__rage=rage;"); pg.wait_for_timeout(1900)
        check(tag+' Kara rages below half health', pg.evaluate('window.__rage'))
        r=res(pg); m1=ev(pg,"return G.S.money"); check(tag+' boss win + prize', r['title']=='HESAP KAPANDI' and m1-m0==2000, (r['title'],m1-m0))
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-ending.png')
        check(tag+' ending shows lifetime stats', 'Teslimat' in pg.inner_text('#resRows') and 'Sürüş süresi' in pg.inner_text('#resRows'), pg.inner_text('#resRows')[:120])
        click(pg,'#resBtns button:last-child'); pg.wait_for_timeout(300)
        r=res(pg); check(tag+' closing scene', r['title']=='DOSYA KAPANDI', r['title'])
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-end2.png')
        click(pg,'#resBtns button:first-child'); pg.wait_for_timeout(300)
        check(tag+' free ride in menu', 'Serbest sürüş' in pg.inner_text('#lede') and pg.is_visible('#zonePick'), pg.inner_text('#lede'))
        pg.locator('#zonePick button').nth(4).click(); pg.wait_for_timeout(200)
        click(pg,'#startBtn'); pg.wait_for_timeout(200)
        check(tag+' free ride: picked district (Fatih) used', 'Fatih' in pg.inner_text('#resEyebrow') and 'Fatih' in pg.inner_text('#mShift'), pg.inner_text('#resEyebrow'))
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-free.png')
        ev(pg,"(await import('/js/ui.js')).goMenu()")
        check(tag+' case closed, pay +10%', pg.inner_text('#caseBtn')=='DOSYA ✓' and abs(ev(pg,"return (await import('/js/rating.js')).payMult()")-1.1)<1e-9)
        # settings
        click(pg,'#sndBtn'); pg.wait_for_timeout(200)
        pg.evaluate("const r=document.getElementById('s-joy');r.value=150;r.dispatchEvent(new Event('input'));const c=document.getElementById('s-left');c.checked=true;c.dispatchEvent(new Event('change'))")
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-settings.png')
        click(pg,'#setBack'); sv=pg.evaluate("JSON.parse(localStorage.kurye34)")
        check(tag+' settings saved', sv['joy']==1.5 and sv['left']==1 and pg.evaluate("document.body.classList.contains('lefty')"), (sv['joy'],sv['left']))
        click(pg,'#startBtn'); pg.wait_for_timeout(200); click(pg,'#picks button'); pg.wait_for_timeout(200); click(pg,'#offers button'); pg.wait_for_timeout(2500)
        box=pg.evaluate("(()=>{const r=document.querySelector('.rpad').getBoundingClientRect(),j=document.getElementById('joyBase').getBoundingClientRect();return {rpadLeft:r.left<innerWidth/2,joyRight:j.left>innerWidth/2}})()")
        check(tag+' lefty layout', box['rpadLeft'] and box['joyRight'], box)
        if OUT: pg.screenshot(path=f'{OUT}/{tag}-lefty-ride.png')
        check(tag+' no page errors', not errs, errs); c.close()
print('ALL PASS' if ok else 'SOME FAILED')
