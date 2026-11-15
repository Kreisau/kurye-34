"""Shift rules: 5 deliveries, earnings stay in the shift pot until banked, cash-out, losing the pot on failure,
shift card, district conquest, rider-wide parts (removed parts refunded), story radio.
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
    r=ev("return {upg:G.S.upg,money:G.S.money,cost:SV.upCost(null,0)}")
    check('old per-bike parts merged, moved to 5 levels (1->2, 2->3); tyres (lv 3) refunded', r['upg']==[2,0,3,0,0] and r['money']==1000+1900 and r['cost']==300, r)
    r=ev("""const S=await import('/js/sprites.js');const b=SV.curBike();const a=S.bikeSprites(b,'kick',{paint:'std',helm:'std'})[1],c=S.bikeSprites(b,'kick',{paint:'alt',helm:'kro'})[1];
      const snap=JSON.stringify(G.S);localStorage.setItem('kurye34',JSON.stringify({money:5,cos:{paint:'alt',helm:'xx',own:['p:alt']}}));SV.load();const cos=JSON.parse(JSON.stringify(G.S.cos));localStorage.setItem('kurye34',snap);SV.load();
      return {diff:a!==c,cos};""")
    check('paint and helmet make a different sprite; save keeps owned paint, drops unknown helmet', r['diff'] and r['cos']['paint']=='alt' and r['cos']['helm']=='std', r)
    ev("G.S.money=1000;")
    # full shift
    ev("UI.goMenu();GM.newShift();")
    c=ev("return {t:document.getElementById('resTitle').textContent,n:document.querySelectorAll('#picks button').length}")
    check('shift opens with a card pick (3 of 6)', c['t']=='KARTINI SEÇ' and c['n']==3, c)
    pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200)
    held=ev("return Object.keys(G.shift.cards)"); pots=[]
    for i in range(5):
        pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500)
        ev(arrive); pg.wait_for_timeout(2600)
        s=ev("return {money:G.S.money,pot:G.shift?G.shift.earned:null,i:G.shift?G.shift.i:null,cards:Object.keys(G.shift?G.shift.cards:{}),title:document.getElementById('resTitle').textContent,shifts:G.S.shifts,sub:document.getElementById('resSub').textContent}")
        pots.append(s)
        if i<4: pg.evaluate("document.querySelector('#resBtns button').click()"); pg.wait_for_timeout(200)
    check('money stays out of the bank during the shift', all(x['money']==1000 and x['pot']>0 and x['cards']==held for x in pots[:4]) and len(held)==1, [(x['money'],x['pot']) for x in pots[:4]])
    check('fifth delivery banks the pot, counts the shift, conquers the district (shift 4 = Üsküdar done)', pots[4]['money']>1000+pots[3]['pot'] and pots[4]['shifts']==3 and pots[4]['title']=='VARDİYA TAMAM' and 'Üsküdar: 1/2' in pots[4]['sub'], pots[4])
    m0=pots[4]['money']
    # cash out after the second delivery
    ev("UI.goMenu();GM.newShift();"); pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200)
    for i in range(2):
        pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500); ev(arrive); pg.wait_for_timeout(2600)
        if i==0: pg.evaluate("document.querySelector('#resBtns button').click()"); pg.wait_for_timeout(200)
    pot=ev("return G.shift.earned"); pg.evaluate("document.querySelector('#resBtns button:last-child').click()"); pg.wait_for_timeout(200)
    s=ev("return {money:G.S.money,shifts:G.S.shifts,title:document.getElementById('resTitle').textContent,shift:G.shift}")
    check('cash-out banks the pot without counting the shift', s['money']==m0+pot and s['shifts']==3 and s['title']=='KASA ALINDI' and s['shift'] is None, s)
    m1=s['money']
    # fail on the second delivery
    ev("UI.goMenu();GM.newShift();"); pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500); ev(arrive); pg.wait_for_timeout(2600)
    pg.evaluate("document.querySelector('#resBtns button').click()"); pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500)
    ev("G.rivals=[];G.cars=[];G.timeLeft=.05;"); pg.wait_for_timeout(600)
    s=ev("return {money:G.S.money,title:document.getElementById('resTitle').textContent,rows:document.getElementById('resRows').textContent}")
    check('failing loses the pot, bank untouched', s['money']==m1 and s['title']=='VARDİYA BİTTİ' and 'Kaybedilen' in s['rows'], s)
    # cards and pay
    r=ev("""UI.goMenu();G.shift={L:3,i:0,cards:{},earned:0};const avg=a=>a.reduce((x,y)=>x+y)/a.length;const base=[];for(let k=0;k<60;k++)base.push(GM.makeOffer(GM.KINDS[1]).pay);
      G.shift.cards={bahsis:1};const b=[];for(let k=0;k<60;k++)b.push(GM.makeOffer(GM.KINDS[1]).pay);
      const st0=SV.stats(SV.curBike(),SV.ups(),{}),st1=SV.stats(SV.curBike(),SV.ups(),{termos:1,turbo:1});
      const seen=new Set();for(let k=0;k<200;k++)UI.drawCards().forEach(c=>seen.add(c.id));
      G.shift.cards={};G.shift.i=3;const late=[];for(let k=0;k<60;k++)late.push(GM.makeOffer(GM.KINDS[1]).pay);G.shift=null;
      return {bahsis:+(avg(b)/avg(base)).toFixed(2),dmg:+(st1.dmg/st0.dmg).toFixed(2),top:+(st1.top/st0.top).toFixed(2),seen:seen.size,streak:avg(late)>avg(base)*1.3};""")
    check('cards: +25% pay, -30% damage, +8% speed; all six get offered; later deliveries pay more', 1.15<r['bahsis']<1.35 and r['dmg']==0.7 and r['top']==1.08 and r['seen']==6 and r['streak'], r)
    # conquest: Kara's showdown needs all clues and the last district
    r=ev("""const M=await import('/js/meta.js');const s0=G.S.shifts,c0=G.S.clues;G.S.clues=5;G.S.shifts=10;const a=M.bossReady();G.S.shifts=12;const b=M.bossReady();
      const z=GM.zone();G.S.shifts=s0;G.S.clues=c0;return {a,b,z};""")
    check('showdown opens only after Şişli (shift 12) is taken', r['a'] is False and r['b'] is True and r['z']==5, r)
    # story radio
    ev("UI.goMenu();GM.newShift();"); pg.evaluate("document.querySelector('#picks button').click()"); pg.wait_for_timeout(200); pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(1500)
    ev("G.rivals=[];G.cars=[];G.inv=99;G.timeLeft=99;G.pos=G.finishZ*.4;"); pg.wait_for_timeout(700)
    s=ev("const r=document.getElementById('radio');return {shown:!r.hidden&&r.classList.contains('talk'),who:document.getElementById('radioWho').textContent,txt:document.getElementById('radioTxt').textContent}")
    check('story line on the radio during the ride', s['shown'] and s['who'] in('USTA','34') and len(s['txt'])>15, s)
    check('no page errors', not errs, errs)
print('ALL PASS' if ok else 'SOME FAILED')
