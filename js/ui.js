import { audioInit, sfx, sfxStars } from './audio.js';
import { $, BASE_CARDS, BIKES, CARDS, DISTRICTS, NDEL, STREAK, KMH, M_PER_SEG, UPG, WPN, clamp, el, fmt, maxSpeed, num, playerZ, segL } from './config.js';
import { G } from './g.js';
import { isEN } from './i18n.js';
import { card, demoTrack, inPot, newShift, prepDelivery, unlocked } from './game.js';
import { radioReset } from './radio.js';
import { clearInput } from './input.js';
import { curBike, save, stats, upCost, ups } from './save.js';
import { rateDelivery, ratingLabel, recordRating, starStr } from './rating.js';
import { bikeSprites } from './sprites.js';
import { bossEnd, dailyDone, dailyFinish, nextClue, showClue } from './meta.js';
import { tutFinish, tutStop } from './tutorial.js';

/* ---------- HUD & UI ---------- */
export const hudCache={};
export function setText(id,v){if(hudCache[id]!==v){hudCache[id]=v;$(id).textContent=v;}}
export function distStr(){const m=Math.max(0,(G.finishZ-G.pos-playerZ)/segL*M_PER_SEG);return m>=1000?num(m/1000,1)+' km':Math.round(m/10)*10+' m';}
export function hudTick(){
  if($('hud').hidden)return;
  setText('time',G.tut?'—':G.timeLeft.toFixed(1));
  const tw=G.timeLeft<10;if(hudCache.tw!==tw){hudCache.tw=tw;$('time').classList.toggle('warn',tw);}
  const pw=(clamp((G.pos+playerZ)/G.finishZ,0,1)*100).toFixed(1)+'%';if(hudCache.pw!==pw){hudCache.pw=pw;$('prog').style.width=pw;}
  setText('dist',distStr());
  setText('kmh',Math.round(G.speed/maxSpeed*KMH)+(isEN()?' km/h':' km/sa'));
  setText('money',fmt(Math.max(0,(inPot()?G.shift.earned:G.S.money)+G.bonus-(G.fine||0))));
  if(hudCache.cond!==G.cond){hudCache.cond=G.cond;const p=$('pkg');p.style.width=G.cond+'%';p.classList.toggle('low',G.cond<40);}
  const cdv=G.state==='play'&&G.timeLeft<=10?Math.ceil(G.timeLeft):0,cd=$('cd');
  if(cdv){if(cd.hidden)cd.hidden=false;if(hudCache.cd!==cdv){hudCache.cd=cdv;cd.textContent=cdv;sfx('beep');}}
  if(cdv){const t=$('toast'),tb=t.classList.contains('show')&&!t.classList.contains('big')?Math.round(t.getBoundingClientRect().bottom)+6:0;if(hudCache.cdTop!==tb){hudCache.cdTop=tb;cd.style.top=tb?tb+'px':'';}}
  else if(!cd.hidden){cd.hidden=true;hudCache.cd=0;}
  const boss=G.shift&&G.shift.boss?G.rivals.find(r=>r.boss):null,bb=$('bossBar');
  if(bb.hidden!==!boss)bb.hidden=!boss;
  if(boss){$('bossHp').style.width=clamp(boss.hp/boss.p.hp,0,1)*100+'%';if(G.MIR)bb.style.top=(G.MIR.y/(G.W/innerWidth)+4)+'px';}
}
G.toastTimer=0;
export function toast(msg,ms,big){
  // in the garage, confirmations go into the header line instead of floating over the list
  if(!$('garage').hidden){const m=$('gMsg');m.textContent=msg;m.classList.add('show');clearTimeout(G.gMsgT);G.gMsgT=setTimeout(()=>m.classList.remove('show'),ms||1800);return;}
  const t=$('toast');t.textContent=msg;t.classList.toggle('big',!!big);t.classList.toggle('menu',$('hud').hidden);t.classList.add('show');clearTimeout(G.toastTimer);G.toastTimer=setTimeout(()=>t.classList.remove('show'),ms||1300);}
export function showScreen(id){for(const s of['menu','garage','brief','result','pause','story','settings'])$(s).hidden=s!==id;}
export function updateMenu(){
  $('mMoney').textContent=fmt(G.S.money);
  $('mBike').textContent=curBike().n;
  $('mRating').textContent=ratingLabel();
  $('mShift').textContent='Vardiya #'+(G.S.shifts+1)+' · '+unlocked()+'/6 bölge açık';
  $('dailyBtn').textContent='GÜNÜN SİPARİŞİ'+(dailyDone()?' ✓':' ×2');
  const ready=G.S.clues>=5&&!G.S.boss,cb=$('caseBtn');
  cb.textContent=ready?'HESAPLAŞMA':'DOSYA '+(G.S.boss?'✓':G.S.clues+'/5');cb.classList.toggle('hotb',ready);
}
export function hideGameUI(){$('cd').hidden=true;$('hud').hidden=true;$('controls').hidden=true;$('keyhint').hidden=true;$('rivalHint').hidden=true;$('radio').hidden=true;$('bossBar').hidden=true;radioReset();}
export function renderResult(o){
  $('resEyebrow').textContent=o.eyebrow;$('resTitle').textContent=o.title;$('resSub').textContent=o.sub;
  const rows=$('resRows');rows.textContent='';
  for(const [k,v,cls] of o.rows){rows.append(el('dt',cls,k),el('dd',cls,v));}
  const pk=$('picks');pk.textContent='';$('pickWrap').hidden=!o.picks;
  if(o.picks)for(const c of o.picks){
    const b=el('button','opt'+(c.curse?' curse':''));b.type='button';
    const have=card(c.id);
    b.append(el('small',null,have?'SENDE ×'+have:c.curse?'LANETLİ':(c.stack?'KATLANIR':'KART')),el('b',null,c.t),el('span',null,c.d));
    b.addEventListener('click',()=>{G.shift.cards[c.id]=have+1;G.shift.i++;sfx('beep');prepDelivery();});
    pk.append(b);
  }
  const bt=$('resBtns');bt.textContent='';
  for(const x of o.buttons||[]){const b=el('button',x.cls,x.t);b.type='button';b.addEventListener('click',x.fn);bt.append(b);}
  showScreen('result');
}
export function drawCards(){
  const pool=CARDS.slice(0,BASE_CARDS+G.S.cu).filter(c=>c.stack||!card(c.id));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const out=[];let curse=0;
  for(const c of pool){if(c.curse&&curse)continue;if(c.curse)curse++;out.push(c);if(out.length===3)break;}
  return out;
}
// Shift rules: every delivery's earnings go into the shift pot. After each delivery you either bank the pot and end
// the shift, or take a card and ride on for a higher fee. Failing a delivery loses whatever is still in the pot.
// Only a full shift (NDEL deliveries) counts for progress: clues, new districts, new cards, shift bonus.
function cashOut(){
  const got=G.shift.earned;G.S.money+=got;save();sfx('cash');
  const eyebrow='VARDİYA #'+(G.shift.L+1)+' · '+(G.shift.i+1)+'/'+NDEL+' TESLİMAT';G.shift=null;
  renderResult({eyebrow,title:'KASA ALINDI',sub:'Vardiyayı erken kapattın. Para güvende; ama ipucu, yeni kart ve vardiya bonusu için beş teslimatı da bitirmen gerekir.',
    rows:[['Kasaya giren',fmt(got),'total'],['KASA',fmt(G.S.money)]],buttons:endButtons()});
}
const endButtons=()=>[{t:'GARAJA GİT',cls:'cta',fn:showGarage},{t:'YENİ VARDİYA',cls:'ghost',fn:()=>{audioInit();newShift();}},{t:'MENÜ',cls:'ghost',fn:goMenu}];
export function finish(ok,why){
  if(G.state!=='play'&&G.state!=='arrive')return;
  if(G.shift&&G.shift.boss){bossEnd(false,why);return;}
  G.state='result';clearInput();hideGameUI();
  if(G.tut){tutFinish();return;}
  const rt=rateDelivery(ok,why),to=G.route.to;recordRating(rt.stars);
  if(G.shift.daily){dailyFinish(ok,why,rt);return;}
  const eyebrow='VARDİYA #'+(G.shift.L+1)+' · TESLİMAT '+(G.shift.i+1)+'/'+NDEL;
  if(ok){
    const pay=Math.round(G.route.pay*G.cond/100),tb=Math.round(G.timeLeft*1.5)*(card('kombo')>0?2:1),fine=Math.round((G.fine||0)*(card('cezasiz')>0?.5:1)),total=Math.max(0,pay+tb+G.bonus+rt.tip-fine);
    G.shift.earned+=total;
    const rows=[['Müşteri puanı',starStr(rt.stars),'stars'],['Taşıma ücreti ('+G.cond+'%)',fmt(pay)],['Süre bonusu ('+num(G.timeLeft,1)+' sn)',fmt(tb)],['Bahşiş',fmt(rt.tip)],['Rakip bonusu',fmt(G.bonus)]].concat(fine?[['Cezalar','−'+fmt(fine)]]:[],[['BU TESLİMAT',fmt(total),'total']]);
    const sub='“'+rt.comment+'” · '+to;
    sfxStars(rt.stars);if(rt.tip&&G.AC)sfx('cash',{t:G.AC.currentTime+.25+rt.stars*.16});
    if(G.shift.i<NDEL-1){
      rows.push(['VARDİYA KASASI (riskte)',fmt(G.shift.earned),'risk'],['Sıradaki teslimat ücreti','×'+num(STREAK[G.shift.i+1],2)]);
      renderResult({eyebrow,title:'TESLİM EDİLDİ',sub:sub+'. Kart seçip devam et ya da kasayı al. Düşersen vardiya kasası gider.',rows,picks:drawCards(),
        buttons:[{t:'KASAYI AL VE BİTİR · '+fmt(G.shift.earned),cls:'ghost',fn:cashOut}]});
    }else{
      const sb=50+G.shift.L*25,got=G.shift.earned+sb;G.S.money+=got;G.S.shifts++;G.S.best=Math.max(G.S.best,G.S.shifts);
      const nc=G.S.cu<CARDS.length-BASE_CARDS?CARDS[BASE_CARDS+G.S.cu++]:null;save();const clue=nextClue();
      rows.push(['Vardiya bonusu',fmt(sb)],['VARDİYA TOPLAMI',fmt(got),'total'],['KASA',fmt(G.S.money)]);
      if(nc)rows.push(['Yeni kart açıldı',nc.t,'stars']);
      const eb=endButtons();
      renderResult({eyebrow,title:'VARDİYA TAMAM',sub:sub+'. Beş teslimat da yerine ulaştı, kasa güvende.'+(1+G.S.shifts<DISTRICTS.length?' Yeni bölge açıldı: '+DISTRICTS[1+G.S.shifts].name+'.':''),rows,buttons:clue?[{t:'DEVAM',cls:'cta',fn:()=>showClue(clue,eb)}]:eb});
      G.shift=null;
    }
  }else{
    const lost=G.shift.earned;save();sfx('fail');
    renderResult({eyebrow,title:'VARDİYA BİTTİ',
      sub:(why==='time'?'Süre doldu, sipariş iptal. ':'Paket dağıldı. ')+'“'+rt.comment+'” · '+to+'. Kasaya girmemiş vardiya kazancı gitti.',
      rows:[['Müşteri puanı',starStr(rt.stars),'stars'],['Kalan mesafe',distStr()],['Paket durumu',G.cond+'%'],['Kaybedilen vardiya kazancı','−'+fmt(lost),'risk'],['KASA',fmt(G.S.money)]],buttons:endButtons()});
    G.shift=null;
  }
}
export function goMenu(){tutStop();G.state='menu';G.paused=false;G.shift=null;hideGameUI();demoTrack();updateMenu();showScreen('menu');}
export function togglePause(force){
  if(G.state!=='play'&&G.state!=='count')return;
  G.paused=force!==undefined?force:!G.paused;
  $('pause').hidden=!G.paused;if(G.paused)clearInput();
}

/* ---------- garage ---------- */
export function showGarage(){
  if(G.state!=='menu'){G.state='menu';hideGameUI();demoTrack();}
  renderGarage();showScreen('garage');$('garage').scrollTop=0;
}
export function renderGarage(){
  const b=curBike(),u=ups(b.id),st=stats(b,u);
  $('gMoney').textContent=fmt(G.S.money);$('gName').textContent=b.n;
  const pv=$('gPrev'),g=pv.getContext('2d');g.clearRect(0,0,pv.width,pv.height);g.drawImage(bikeSprites(b,G.S.wpn)[G.S.wpn==='kick'?1:2],0,0,pv.width,pv.height);
  const bars=$('gBars');bars.textContent='';
  const bar=(k,v)=>{const i=el('i'),f=el('b');f.style.width=Math.round(clamp(v,.04,1)*100)+'%';i.append(f);bars.append(el('span',null,k),i);};
  bar('HIZ '+Math.round(st.top*KMH)+' km/sa',st.top);
  bar('KALKIŞ',(st.top/st.accT)/.3);
  bar('VİRAJ',(st.steer/st.cent)/1.7);
  bar('DAYANIKLILIK',(1/st.dmg)/1.6);
  const ul=$('gUps');ul.textContent='';
  UPG.forEach((up,k)=>{
    const lv=u[k]||0,row=el('div','item'),info=el('div'),t=el('div','t',up.n),pips=el('span','pips');
    for(let i=0;i<3;i++)pips.append(el('i',i<lv?'on':null));
    t.append(pips);info.append(t,el('div','d',up.d));
    const btn=el('button','buy');btn.type='button';
    if(lv>=3){btn.textContent='MAKS';btn.disabled=true;}
    else{const c=upCost(b,lv);btn.textContent=fmt(c);btn.disabled=G.S.money<c;
      btn.addEventListener('click',()=>{if(G.S.money<c)return;G.S.money-=c;u[k]=lv+1;save();sfx('cash');toast(up.n+' seviye '+u[k]);renderGarage();});}
    row.append(info,btn);ul.append(row);
  });
  const wl=$('gWpn');wl.textContent='';
  for(const wp of WPN){
    const own=G.S.weapons.includes(wp.id),sel=wp.id===G.S.wpn,row=el('div','item'+(sel?' sel':'')),info=el('div');
    info.append(el('div','t',wp.n),el('div','d',wp.d));
    const btn=el('button','buy');btn.type='button';
    if(sel){btn.className='buy alt';btn.textContent='KUŞANILDI';btn.disabled=true;}
    else if(own){btn.className='buy alt';btn.textContent='KUŞAN';btn.addEventListener('click',()=>{G.S.wpn=wp.id;save();renderGarage();});}
    else{btn.textContent=fmt(wp.price);btn.disabled=G.S.money<wp.price;
      btn.addEventListener('click',()=>{if(G.S.money<wp.price)return;G.S.money-=wp.price;G.S.weapons.push(wp.id);G.S.wpn=wp.id;save();sfx('cash');toast(wp.n+' alındı');renderGarage();});}
    row.append(info,btn);wl.append(row);
  }
  const bl=$('gBikes');bl.textContent='';
  for(const bk of BIKES){
    const own=G.S.owned.includes(bk.id),sel=bk.id===G.S.cur,row=el('div','item'+(sel?' sel':'')),info=el('div');
    info.append(el('div','t',bk.n),el('div','d','Maks. '+Math.round(bk.top*KMH)+' km/sa · 0-maks '+Math.round(bk.acc*1.17)+' sn'));
    const btn=el('button','buy');btn.type='button';
    if(sel){btn.className='buy alt';btn.textContent='SEÇİLİ';btn.disabled=true;}
    else if(own){btn.className='buy alt';btn.textContent='SEÇ';btn.addEventListener('click',()=>{G.S.cur=bk.id;save();renderGarage();});}
    else{btn.textContent=fmt(bk.price);btn.disabled=G.S.money<bk.price;
      btn.addEventListener('click',()=>{if(G.S.money<bk.price)return;G.S.money-=bk.price;G.S.owned.push(bk.id);G.S.cur=bk.id;save();sfx('cash');toast(bk.n+' garajda');renderGarage();});}
    row.append(info,btn);bl.append(row);
  }
  G.PSPR=bikeSprites(b,G.S.wpn);
}

/* ---------- buttons ---------- */
G.wake=null;
export function keepAwake(){try{if(navigator.wakeLock&&!G.wake)navigator.wakeLock.request('screen').then(w=>{G.wake=w;w.addEventListener('release',()=>{G.wake=null;});}).catch(()=>{});}catch(e){}}

/* ---------- desktop: fit menu cards to the window ----------
   On a mouse-driven screen the cards are enlarged (x1.3). On a laptop that pushed the lower part of most screens
   below the window edge. Here each visible card is scaled so it fits the window height (down to x0.75; below that it scrolls). */
const DESK=matchMedia('(hover:hover) and (pointer:fine)');
let fitQ=0;
function fitCards(){
  fitQ=0;
  for(const c of document.querySelectorAll('.screen:not([hidden]) .card')){
    if(!DESK.matches){if(c.style.zoom)c.style.zoom='';continue;}
    c.style.zoom='1';
    const big=innerWidth>=700&&innerHeight>=600?1.3:1,fit=(innerHeight-34)/c.offsetHeight,z=fit<.75?1:Math.min(big,fit);   // long lists (garage) keep normal size and scroll
    c.style.zoom=z.toFixed(3);
  }
}
const fitSoon=()=>{if(!fitQ)fitQ=requestAnimationFrame(fitCards);};
addEventListener('resize',fitSoon);DESK.addEventListener('change',fitSoon);
new MutationObserver(fitSoon).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitSoon);
fitSoon();
