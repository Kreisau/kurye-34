"""Render sound previews offline in headless Chrome (same synth code as the game) and save WAVs.
Usage: python3 tools/sound_demo.py http://127.0.0.1:8765 OUTDIR"""
import sys, base64, wave
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
PRE = """async (spec) => {
  const au = await import('/js/audio.js');
  const buf = await au.renderOffline(spec.sec, async (X) => { await (new Function('X', 'return (async()=>{' + spec.body + '})()'))(X); });
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, out = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) { out[2*i] = Math.max(-1, Math.min(1, L[i])) * 32767; out[2*i+1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  let s = ''; const u8 = new Uint8Array(out.buffer); for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(s);
}"""

SFX = """
const {A,sfx,sfxStars,horn,gull,ferry}=X; let t=.3; const step=(d)=>{const r=t;t+=d;return r;};
for (const k of ['click','beep','go']) sfx(k,{t:step(.6)});
for (const k of ['hit','crash','bump','pot','junk','oil']) sfx(k,{t:step(1.2)});
for (const w of ['kick','bat','chain','bar']) { const s=step(1.1); sfx('swing',{t:s,w}); sfx('impact',{t:s+.18,w}); }
sfx('down',{t:step(1.4)}); sfx('nitro',{t:step(1.3)});
{ const s=step(1.6); for(let i=0;i<5;i++) sfx('star',{t:s+i*.16,i}); sfx('cash',{t:s+1}); } step(.6);
sfx('bell',{t:step(2.2)}); sfx('fail',{t:step(1.2)});
for (const c of ['taxi','dolmus','bus','lux','ticari','eco','car']) horn(c,step(1.2),.22,0);
gull(step(1.6),.07,-.5); ferry(step(4.5),.08);
"""

RIDE = """
const {A,sfx,horn,engineSet,loadTrack,playTrack}=X;
await loadTrack('ride'); await loadTrack('tense');
const r=playTrack('ride',0,1,.8), te=playTrack('tense',0,0,.01);
A.bed.gain.value=.1; A.hush.gain.value=.018;
// Mobilet 50: pull away, cruise, brake, pull away again
const dt=.02; let t=0;
const run=(sec,p,geared,f)=>{ for(let k=0;k<sec/dt;k++,t+=dt){ const s=f(k*dt/sec); let rpm;
  if(geared){const x=Math.min(s.rel,1)*5,g=Math.min(4,Math.floor(x));rpm=.36+.57*(x-g);} else rpm=.2+.72*Math.sqrt(Math.min(s.rel,1));
  engineSet(t,true,Math.min(rpm,1),s.load,!!s.nitro,p);} };
run(1,1.45,false,()=>({rel:0,load:.3}));
run(6,1.45,false,u=>({rel:Math.min(1,u*1.2),load:1}));
run(3,1.45,false,()=>({rel:1,load:.7}));
run(1.5,1.45,false,u=>({rel:1-u*.6,load:.25}));
run(3,1.45,false,u=>({rel:.4+u*.6,load:1}));
horn('taxi',4.5,.2,-.6); horn('dolmus',9,.2,.7); sfx('pot',{t:11}); horn('bus',13.3,.18,.4);
// Kurye 150 (geared): through the gears, then nitro
run(8,1.0,true,u=>({rel:Math.min(1,u*1.1),load:1}));
run(3,1.0,true,u=>({rel:1,load:1,nitro:u<.8}));
sfx('nitro',{t:22.5}); horn('lux',20,.2,-.4);
// tension: last seconds of a delivery
r.g.gain.setTargetAtTime(0,26,.7); te.g.gain.setTargetAtTime(1,26,.7);
run(9,1.0,true,()=>({rel:1,load:.7}));
sfx('crash',{t:31}); sfx('bell',{t:35});
engineSet(t,false,.2,.2,false,1);
"""

SEAM = """
const {A,loadTrack}=X; const out=[];
for (const [k,T,start] of [['menu',70.4966,0],['ride',96.4913,7],['tense',47.3695,14]]) {
  const b=await loadTrack(k); const s=A.ctx.createBufferSource(); s.buffer=b; s.loop=true; s.loopStart=.5; s.loopEnd=T;
  const g=A.ctx.createGain(); g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(1,start+.3); g.gain.setValueAtTime(1,start+6.4); g.gain.linearRampToValueAtTime(0,start+6.8);
  s.connect(g); g.connect(A.bus.music); s.start(start, T-3.5); s.stop(start+7);
}
"""

def save(name, b64):
    raw = base64.b64decode(b64)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(44100); w.writeframes(raw)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(BASE + '/'); pg.wait_for_timeout(500)
    for name, sec, body in [('kurye34-efektler', 36, SFX), ('kurye34-surus', 37, RIDE), ('kurye34-muzik-dongu-gecisleri', 21, SEAM)]:
        save(name, pg.evaluate(PRE, {'sec': sec, 'body': body})); print('rendered', name)
    print('errors', errs)
