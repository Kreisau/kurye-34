"""Joystick stuck-steer regression test: simulates a lost pointerup (as iOS can do), then checks recovery.
Usage: python3 tools/joy_test.py http://127.0.0.1:8765"""
import sys
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]
ST="(async()=>{const I=await import('/js/input.js');const {G}=await import('/js/g.js');return {steer:+I.input.steer.toFixed(2),brake:I.input.brake,joyId:G.joyId}})()"
def ev(pg,t,id,x,y,target='joy'):
    pg.evaluate(f"document.getElementById('{target}').dispatchEvent(new PointerEvent('{t}',{{pointerId:{id},clientX:{x},clientY:{y},bubbles:true,pointerType:'touch'}}))")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.add_init_script("localStorage.setItem('kurye34',JSON.stringify({money:0,shifts:2,tut:1,story:1}))")
    pg.goto(BASE+'/'); pg.wait_for_timeout(400)
    pg.evaluate("document.getElementById('startBtn').click()"); pg.wait_for_timeout(200)
    pg.evaluate("document.querySelector('#offers button').click()"); pg.wait_for_timeout(3500)
    ok=True
    # 1) normal drag right and release
    ev(pg,'pointerdown',11,100,600); ev(pg,'pointermove',11,160,600); s1=pg.evaluate(ST); ev(pg,'pointerup',11,160,600); s2=pg.evaluate(ST)
    print('normal: held',s1,'released',s2); ok&=s1['steer']==1 and s2['steer']==0
    # 2) lost pointerup, a new finger on the pad must take over
    ev(pg,'pointerdown',12,100,600); ev(pg,'pointermove',12,160,600)
    ev(pg,'pointerdown',13,120,620); s3=pg.evaluate(ST); ev(pg,'pointerup',13,120,620); s4=pg.evaluate(ST)
    print('lost up -> new touch:',s3,'after its release',s4); ok&=s3['steer']==0 and s3['joyId']==13 and s4['steer']==0
    # 3) lost pointerup, release delivered only as touchend with no fingers left
    ev(pg,'pointerdown',14,100,600); ev(pg,'pointermove',14,160,600)
    pg.evaluate("window.dispatchEvent(new TouchEvent('touchend',{touches:[],bubbles:true}))"); s5=pg.evaluate(ST)
    print('lost up -> touchend:',s5); ok&=s5['steer']==0 and s5['joyId'] is None
    # 4) pointerup delivered to another element (window level)
    ev(pg,'pointerdown',15,100,600); ev(pg,'pointermove',15,160,600); ev(pg,'pointerup',15,300,600,'c'); s6=pg.evaluate(ST)
    print('up on other element:',s6); ok&=s6['steer']==0
    # 5) real touch via CDP: drag right across the screen and lift on the right half
    pg.touchscreen.tap(100,600); s7=pg.evaluate(ST); print('real tap:',s7); ok&=s7['steer']==0
    print('PASS' if ok and not errs else 'FAIL', errs)
