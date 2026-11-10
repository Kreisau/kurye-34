"""Run legacy and modular builds with identical seeded randomness, fake clock and inputs; compare."""
import hashlib, sys, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]  # e.g. http://127.0.0.1:8765
INIT = """
(()=>{let a=12345;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
let now=1000,cbs=[];performance.now=()=>now;
window.requestAnimationFrame=cb=>{cbs.push(cb);return cbs.length;};
window.__step=n=>{for(let i=0;i<n;i++){now+=1000/60;const q=cbs;cbs=[];q.forEach(f=>f(now));}};
try{localStorage.clear();}catch(e){}
window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));})();
"""

def snap(page, tag, out):
    url = page.evaluate("document.getElementById('c').toDataURL()")
    txt = page.evaluate("[...document.querySelectorAll('.hud,.screen:not([hidden]),#toast')].map(e=>e.innerText).join('|')")
    out.append((tag, hashlib.md5(url.encode()).hexdigest(), txt))
    return url

def run(path, shots):
    out, errs = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True)
        pg.route('**/fonts.g*/**', lambda r: r.abort())
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script(INIT)
        pg.goto(BASE + path); pg.wait_for_timeout(300)
        pg.evaluate('__step(90)'); snap(pg, 'menu', out)
        pg.evaluate("document.getElementById('garageBtn').click()"); pg.evaluate('__step(5)'); snap(pg, 'garage', out)
        pg.evaluate("document.getElementById('gBack').click()"); pg.evaluate('__step(5)')
        pg.evaluate("document.getElementById('startBtn').click()"); pg.evaluate('__step(5)'); snap(pg, 'brief', out)
        pg.evaluate("document.querySelector('#offers button').click()"); pg.evaluate('__step(240)'); snap(pg, 'countdown+start', out)
        seq = [('ArrowLeft', 40), (None, 120), ('ArrowRight', 70), ('ArrowDown', 30), (None, 300), ('ArrowLeft', 25), (None, 600)]
        for i, (k, n) in enumerate(seq):
            if k: pg.keyboard.down(k)
            pg.evaluate(f'__step({n})')
            if k: pg.keyboard.up(k)
            u = snap(pg, f'ride{i}', out)
        shots.append(u)
        pg.evaluate('__step(4000)'); snap(pg, 'long', out)
        errs += pg.evaluate('__errs')
        b.close()
    return out, errs

shots = []
A, ea = run('/legacy/index.html', shots)
B, eb = run('/index.html', shots)
ok = True
for a, b in zip(A, B):
    same = a[1] == b[1] and a[2] == b[2]
    ok &= same
    print(('OK  ' if same else 'DIFF'), a[0], '| canvas', a[1] == b[1], '| text', a[2] == b[2])
    if a[2] != b[2]: print('   legacy:', a[2][:200].replace('\n', ' '), '\n   new   :', b[2][:200].replace('\n', ' '))
print('errors legacy:', ea); print('errors new:', eb)
print('PARITY', 'PASS' if ok and not eb else 'FAIL')
print('long-run text:', B[-1][2][:300].replace('\n', ' '))
