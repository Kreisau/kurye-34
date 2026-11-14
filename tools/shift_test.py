"""Shift rules: 5 deliveries, earnings stay in the shift pot until banked, cash-out, losing the pot on failure,
card unlocks, cursed cards, rider-wide parts, story radio.
Usage: python3 tools/shift_test.py http://127.0.0.1:8765"""
import sys
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]
I="const {G}=await import('/js/g.js');const C=await import('/js/config.js');const GM=await import('/js/game.js');const UI=await import('/js/ui.js');const SV=await import('/js/save.js');const RD=await import('/js/radio.js');"
ok=True
def check(name,cond,info=''):
    global ok; ok&=bool(cond); print(('ok  ' if cond else 'FAIL'),name,info)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("if(!sessionStorage.k){sessionStorage.k=1;localStorage.setItem('kurye34',JSON.stringify({money:1000,shifts:2,tut:1,story:1,volV:2,up:{mob:[1,0,2,0,0],sc:[0,3,1,0,0]}}))}")
    pg.goto(BASE+'/'); pg.wait_for_timeout(500)
    ev=lambda body: pg.evaluate("(async()=>{"+I+body+"})()")
    arrive="G.rivals=[];G.cars=[];G.inv=99;G.timeLeft=50;G.pos=G.finishZ-C.playerZ-C.segL*9;"
    r=ev("return {upg:G.S.upg,cu:G.S.cu,cost:SV.upCost(null,0)}")
    check('old per-bike parts merged into rider parts; cards unlocked from past shifts', r['upg']==[1,3,2,0,0] and r['cu']==2, r)
    # full shift
    ev("UI.goMenu();GM.newShift();"); pots=[]
    for i in range(5):
        pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500)
        ev(arrive); pg.wait_for_timeout(2600)
        s=ev("return {money:G.S.money,pot:G.shift?G.shift.earned:null,i:G.shift?G.shift.i:null,picks:document.querySelectorAll('#picks button').length,title:document.getElementById('resTitle').textContent,shifts:G.S.shifts,cu:G.S.cu}")
        pots.append(s)
        if i<4: pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200)
    check('money stays out of the bank during the shift', all(x['money']==1000 and x['pot']>0 and x['picks']==3 for x in pots[:4]), [(x['money'],x['pot']) for x in pots[:4]])
    check('fifth delivery banks the pot, counts the shift, unlocks a card', pots[4]['money']>1000+pots[3]['pot'] and pots[4]['shifts']==3 and pots[4]['cu']==3 and pots[4]['title']=='VARDİYA TAMAM', pots[4])
    m0=pots[4]['money']
    # cash out after the second delivery
    ev("UI.goMenu();GM.newShift();")
    for i in range(2):
        pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500); ev(arrive); pg.wait_for_timeout(2600)
        if i==0: pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200)
    pot=ev("return G.shift.earned"); pg.evaluate("document.querySelector('#resBtns button').click()"); pg.wait_for_timeout(200)
    s=ev("return {money:G.S.money,shifts:G.S.shifts,title:document.getElementById('resTitle').textContent,shift:G.shift}")
    check('cash-out banks the pot without counting the shift', s['money']==m0+pot and s['shifts']==3 and s['title']=='KASA ALINDI' and s['shift'] is None, s)
    m1=s['money']
    # fail on the second delivery
    ev("UI.goMenu();GM.newShift();")
    pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500); ev(arrive); pg.wait_for_timeout(2600)
    pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500)
    ev("G.rivals=[];G.cars=[];G.timeLeft=.05;"); pg.wait_for_timeout(600)
    s=ev("return {money:G.S.money,title:document.getElementById('resTitle').textContent,rows:document.getElementById('resRows').textContent}")
    check('failing loses the pot, bank untouched', s['money']==m1 and s['title']=='VARDİYA BİTTİ' and 'Kaybedilen' in s['rows'], s)
    # cards
    r=ev("""UI.goMenu();G.shift={L:3,i:0,cards:{},earned:0};const base=[];for(let k=0;k<40;k++)base.push(GM.makeOffer(GM.KINDS[1]).pay);G.shift.cards={cam:1};const cam=[];for(let k=0;k<40;k++)cam.push(GM.makeOffer(GM.KINDS[1]).pay);
      const avg=a=>a.reduce((x,y)=>x+y)/a.length;const st0=SV.stats(SV.curBike(),SV.ups(),{}),st1=SV.stats(SV.curBike(),SV.ups(),{cam:1,frensiz:1});
      G.S.cu=10;let curses=0,n=0;G.shift.cards={};for(let k=0;k<200;k++){const d=UI.drawCards();n+=d.length;curses=Math.max(curses,d.filter(c=>c.curse).length);}
      G.shift.i=3;const late=[];for(let k=0;k<40;k++)late.push(GM.makeOffer(GM.KINDS[1]).pay);G.shift=null;
      return {ratio:+(avg(cam)/avg(base)).toFixed(2),dmg:+(st1.dmg/st0.dmg).toFixed(2),top:+(st1.top/st0.top).toFixed(2),maxCurse:curses,drawn:n,streak:avg(late)>avg(base)*1.3};""")
    check('cursed cards: double pay, double damage, faster; at most one curse per draw; later deliveries pay more', 1.7<r['ratio']<2.4 and r['dmg']==2 and r['top']==1.15 and r['maxCurse']==1 and r['drawn']==600 and r['streak'], r)
    # story radio
    ev("UI.goMenu();GM.newShift();"); pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500)
    ev("G.rivals=[];G.cars=[];G.inv=99;G.timeLeft=99;G.pos=G.finishZ*.4;"); pg.wait_for_timeout(700)
    s=ev("const r=document.getElementById('radio');return {shown:!r.hidden&&r.classList.contains('talk'),who:document.getElementById('radioWho').textContent,txt:document.getElementById('radioTxt').textContent}")
    check('story line on the radio during the ride', s['shown'] and s['who'] in('USTA','34') and len(s['txt'])>15, s)
    check('no page errors', not errs, errs)
print('ALL PASS' if ok else 'SOME FAILED')
