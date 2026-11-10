"""Bot plays: story -> tutorial -> first real delivery. Reads game state via the page's own module instance.
Usage: python3 tools/play_tutorial.py http://127.0.0.1:8765 outdir"""
import sys, time, json
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
STATE = "(async()=>{const {G}=await import('/js/g.js');const pz=G.pos+900*(1/Math.tan(50*Math.PI/180))*1.3;" \
        "return {state:G.state,step:G.tut?G.tut.step:null,x:G.playerX,cond:G.cond,money:G.S.money,ratings:G.S.ratings,tut:G.S.tut,story:G.S.story," \
        "riv:G.rivals.map(r=>({dz:r.z-pz,x:r.x,hp:r.hp,down:r.down})),cars:G.cars.filter(c=>c.z-pz>0&&c.z-pz<3000).map(c=>({dz:c.z-pz,x:c.x}))}})()"

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page()
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'ERR_FAILED' not in m.text and errs.append(m.text))
    pg.goto(BASE + '/'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/0-menu.png')
    pg.evaluate("document.getElementById('startBtn').click()")
    for i in range(6):
        pg.wait_for_timeout(2700 if i == 0 else 900)
        pg.screenshot(path=f'{OUT}/1-story{i}.png')
        pg.evaluate("document.getElementById('sNext').click()")
    pg.wait_for_timeout(500)
    S = lambda: pg.evaluate(STATE)
    kb = pg.keyboard
    def hold(k, ms): kb.down(k); pg.wait_for_timeout(ms); kb.up(k)
    def steer_to(tx):
        x = S()['x']
        if abs(tx - x) > .08: hold('ArrowRight' if tx > x else 'ArrowLeft', int(min(400, abs(tx - x) * 500)))
    t0 = time.time(); shots = set(); log = []
    while time.time() - t0 < 240:
        s = S()
        if s['state'] == 'result': break
        st = s['step']
        if st is not None and st not in shots:
            shots.add(st); log.append((round(time.time() - t0, 1), st, pg.inner_text('#radioTxt')))
            pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/2-tut-step{st}.png')
        if s['state'] != 'play': pg.wait_for_timeout(200); continue
        if st == 0: hold('ArrowLeft', 700); hold('ArrowRight', 700)
        elif st == 1: hold('ArrowDown', 900)
        elif st == 4 and s['riv']:
            r = s['riv'][0]
            if abs(r['dz']) < 400: steer_to(r['x'] - .3 if r['x'] > s['x'] else r['x'] + .3); kb.press('Space')
            else: pg.wait_for_timeout(150)
        elif st == 5: kb.press('KeyN'); pg.wait_for_timeout(300)
        else:
            # avoid the nearest car ahead in our lane
            ahead = [c for c in s['cars'] if c['dz'] < 1500 and abs(c['x'] - s['x']) < .3]
            if ahead: steer_to(-.6 if ahead[0]['x'] > -.1 else .6)
            else: pg.wait_for_timeout(150)
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/3-tut-result.png')
    res_tut = pg.inner_text('#result'); st_tut = S()
    pg.evaluate("[...document.querySelectorAll('#resBtns button')][0].click()"); pg.wait_for_timeout(400)
    brief = pg.inner_text('#bEyebrow')
    pg.evaluate("document.querySelector('#offers button').click()")
    t1 = time.time()
    while time.time() - t1 < 150:
        s = S()
        if s['state'] == 'result': break
        if s['state'] != 'play': pg.wait_for_timeout(200); continue
        ahead = [c for c in s['cars'] if c['dz'] < 1500 and abs(c['x'] - s['x']) < .3]
        if ahead: steer_to(-.6 if ahead[0]['x'] > -.1 else .6)
        else: pg.wait_for_timeout(150)
    pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/4-delivery-result.png')
    res_del = pg.inner_text('#result'); st_del = S()
    b.close()

print('STEP LOG:'); [print(' ', l) for l in log]
print('TUT RESULT:', res_tut.replace('\n', ' | ')[:400])
print('after tut:', {k: st_tut[k] for k in ('money', 'ratings', 'tut', 'story')})
print('BRIEF:', brief)
print('DELIVERY RESULT:', res_del.replace('\n', ' | ')[:400])
print('after delivery:', {k: st_del[k] for k in ('money', 'ratings')})
print('ERRORS:', errs)
