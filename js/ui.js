import { audioInit, sfx, sfxStars } from './audio.js';
import { $, BIKES, CARDS, DISTRICTS, NDEL, STREAK, ZONE_DEL, KMH, M_PER_SEG, UPG, UPMAX, PAINT, HELM, WPN, clamp, el, fmt, maxSpeed, num, playerZ, segL } from './config.js';
import { G } from './g.js';
import { isEN } from './i18n.js';
import { card, conquered, demoTrack, inPot, newShift, prepDelivery, zone } from './game.js';
import { radioReset } from './radio.js';
import { clearInput } from './input.js';
import { curBike, save, stats, upCost, ups } from './save.js';
import { rateDelivery, ratingLabel, recordRating, starStr } from './rating.js';
import { bikeSprites } from './sprites.js';
import { bossEnd, bossReady, nextClue, showClue } from './meta.js';
import { tutFinish, tutStop } from './tutorial.js';
import { COP_LIMIT, copAhead } from './street.js';

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
  // speedometer; when a police checkpoint is coming up it shows the limit and turns red above it
  const kmh=Math.round(G.speed/maxSpeed*KMH),cop=G.state==='play'?copAhead():null,over=cop!==null&&kmh>COP_LIMIT;
  if($('spd').hidden)$('spd').hidden=false;
  setText('spdV',String(kmh));setText('spdU',isEN()?'km/h':'km/sa');
  if(hudCache.cop!==(cop!==null)){hudCache.cop=cop!==null;$('spdLim').hidden=cop===null;$('copFx').classList.toggle('on',cop!==null);}
  if(hudCache.over!==over){hudCache.over=over;$('spd').classList.toggle('over',over);$('spd').classList.toggle('ok',cop!==null&&!over);}
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
  const D=DISTRICTS[zone()];
  $('mShift').textContent=G.S.boss?'Serbest sürüş · '+D.name:zoneLine();
  $('mZones').textContent=conquered()+'/'+DISTRICTS.length;
  const zp=$('zonePick');zp.hidden=!G.S.boss;zp.textContent='';
  if(G.S.boss)DISTRICTS.forEach((d,i)=>{const b=el('button','zchip'+(i===G.S.fz?' on':''),d.name);b.type='button';b.addEventListener('click',()=>{G.S.fz=i;save();updateMenu();});zp.append(b);});
  $('lede').textContent=G.S.boss?'Dosya kapandı. Serbest sürüş: istediğin kadar vardiya, tüm ücretler +%10.':'Her vardiya 5 teslimat. Kasayı al ya da riske gir. Sana çarpanı bul.';
  const ready=bossReady(),cb=$('caseBtn');
  cb.textContent=ready?'HESAPLAŞMA':'DOSYA '+(G.S.boss?'✓':G.S.clues+'/5');cb.classList.toggle('hotb',ready);
}
// district progress as the player reads it: "Kadıköy · 3/10 teslimat"
const zoneLine=()=>{const D=DISTRICTS[zone()];return G.S.pd>=DISTRICTS.length*ZONE_DEL?D.name+' · Kara seni bekliyor':D.name+' · '+(G.S.pd%ZONE_DEL)+'/'+ZONE_DEL+' teslimat';};
export function hideGameUI(){$('spd').hidden=true;$('copFx').classList.remove('on');hudCache.cop=null;hudCache.over=null;$('cd').hidden=true;$('hud').hidden=true;$('controls').hidden=true;$('keyhint').hidden=true;$('rivalHint').hidden=true;$('radio').hidden=true;$('bossBar').hidden=true;radioReset();}
export function renderResult(o){
  $('resEyebrow').textContent=o.eyebrow;$('resTitle').textContent=o.title;$('resSub').textContent=o.sub;
  const rows=$('resRows');rows.textContent='';
  for(const [k,v,cls] of o.rows){rows.append(el('dt',cls,k),el('dd',cls,v));}
  const pk=$('picks');pk.textContent='';$('pickWrap').hidden=!o.picks;
  if(o.picks)for(const c of o.picks){
    const b=el('button','opt');b.type='button';
    b.append(el('small',null,'KART'),el('b',null,c.t),el('span',null,c.d));
    b.addEventListener('click',()=>{G.shift.cards={[c.id]:1};sfx('beep');prepDelivery();});
    pk.append(b);
  }
  const bt=$('resBtns');bt.textContent='';
  for(const x of o.buttons||[]){const b=el('button',x.cls,x.t);b.type='button';b.addEventListener('click',x.fn);bt.append(b);}
  showScreen('result');
}
export function drawCards(){
  const pool=CARDS.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,3);
}
// a new shift opens with one card for the whole shift
export function showShiftCards(){
  renderResult({eyebrow:'VARDİYA · '+(G.S.boss?DISTRICTS[zone()].name:zoneLine()),title:'KARTINI SEÇ',
    sub:'Seçtiğin kart bu vardiyanın beş teslimatı boyunca geçerli.',rows:[],picks:drawCards(),buttons:[{t:'MENÜ',cls:'ghost',fn:goMenu}]});
}
// Shift rules: every delivery's earnings go into the shift pot. After each delivery you either bank the pot and end
// the shift, or ride on for a higher fee. Failing a delivery loses whatever is still in the pot.
// District progress counts successful deliveries (G.S.pd), so the pot is a money gamble only; a full shift adds the shift bonus.
export function cashOut(){
  const got=G.shift.earned;G.S.money+=got;save();sfx('cash');
  const eyebrow='VARDİYA · KASA';G.shift=null;
  renderResult({eyebrow,title:'KASA ALINDI',sub:'Vardiyayı erken kapattın, para güvende. Vardiya bonusu ve yüksek seri ücretleri beş teslimatı da bitirenlere.',
    rows:[['Kasaya giren',fmt(got),'total'],['KASA',fmt(G.S.money)]],buttons:endButtons()});
}
// what this delivery did for the district conquest (call after G.S.pd++)
function zoneNote(){
  if(G.S.boss||G.S.pd>DISTRICTS.length*ZONE_DEL)return '';
  if(G.S.pd%ZONE_DEL)return '';
  const z=G.S.pd/ZONE_DEL,D=DISTRICTS[z-1],nx=DISTRICTS[z];
  return ' '+D.name+' artık senin!'+(nx?' Sıradaki bölge: '+nx.name+'.':' Bütün İstanbul senin. Kara seni bekliyor.');
}
const endButtons=()=>[{t:'GARAJA GİT',cls:'cta',fn:showGarage},{t:'YENİ VARDİYA',cls:'ghost',fn:()=>{audioInit();newShift();}},{t:'MENÜ',cls:'ghost',fn:goMenu}];
export function finish(ok,why){
  if(G.state!=='play'&&G.state!=='arrive')return;
  if(G.shift&&G.shift.boss){bossEnd(false,why);return;}
  G.state='result';clearInput();hideGameUI();
  if(G.tut){tutFinish();return;}
  const rt=rateDelivery(ok,why),to=G.route.to;recordRating(rt.stars);
  if(ok){G.S.st.del++;G.S.st.km+=G.route.len*M_PER_SEG/1000;}G.S.st.fines+=G.fine||0;
  const eyebrow='VARDİYA · TESLİMAT '+(G.shift.i+1)+'/'+NDEL;
  if(ok){
    const pay=Math.round(G.route.pay*G.cond/100),tr=Math.max(0,Math.min(1,G.timeLeft/Math.max(1,G.route.time))),tb=Math.round(G.route.pay*tr*.5),fine=Math.round(G.fine||0),total=Math.max(0,pay+tb+G.bonus+rt.tip-fine);
    G.shift.earned+=total;G.S.st.earned+=total;
    const zl0=G.S.boss?null:zoneLine();G.S.pd++;const note=zoneNote(),clue=nextClue();
    const rows=[['Müşteri puanı',starStr(rt.stars),'stars'],['Paket durumu',G.cond+'%'],['Kalan süre',Math.min(100,Math.max(0,Math.round(100*G.timeLeft/Math.max(1,G.route.time))))+'%'],['Taşıma ücreti ('+G.cond+'%)',fmt(pay)],['Süre bonusu ('+num(G.timeLeft,1)+' sn)',fmt(tb)],['Bahşiş',fmt(rt.tip)],['Rakip bonusu',fmt(G.bonus)]].concat(fine?[['Cezalar','−'+fmt(fine)]]:[],[['BU TESLİMAT',fmt(total),'total']],G.S.boss||G.S.pd>DISTRICTS.length*ZONE_DEL?[]:[['Bölge',note?zl0.split(' · ')[0]+' ✓':zoneLine()]]);
    const sub='“'+rt.comment+'” · '+to;
    sfxStars(rt.stars);if(rt.tip&&G.AC)sfx('cash',{t:G.AC.currentTime+.25+rt.stars*.16});
    if(G.shift.i<NDEL-1){
      rows.push(['VARDİYA KASASI (riskte)',fmt(G.shift.earned),'risk'],['Sıradaki teslimat ücreti','×'+num(STREAK[G.shift.i+1],2)]);
      save();
      const btns=[{t:'DEVAM ET',cls:'cta',fn:()=>{G.shift.i++;sfx('beep');prepDelivery();}},{t:'KASAYI AL VE BİTİR · '+fmt(G.shift.earned),cls:'ghost',fn:cashOut}];
      renderResult({eyebrow,title:'TESLİM EDİLDİ',sub:sub+'.'+note+' Devam et ya da kasayı al. Düşersen vardiya kasası gider.',rows,
        buttons:clue?[{t:'DEVAM',cls:'cta',fn:()=>showClue(clue,btns)}]:btns});
    }else{
      const sb=50+G.shift.L*25,got=G.shift.earned+sb;G.S.money+=got;G.S.shifts++;
      save();
      rows.push(['Vardiya bonusu',fmt(sb)],['VARDİYA TOPLAMI',fmt(got),'total'],['KASA',fmt(G.S.money)]);
      const eb=endButtons();
      renderResult({eyebrow,title:'VARDİYA TAMAM',sub:sub+'. Beş teslimat da yerine ulaştı, kasa güvende.'+note,rows,buttons:clue?[{t:'DEVAM',cls:'cta',fn:()=>showClue(clue,eb)}]:eb});
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
let quitArm=-1e9;
const potAtRisk=()=>G.shift&&inPot()&&G.shift.earned>0;
const quitLabel=()=>potAtRisk()?'VARDİYAYI BIRAK · KASA GİDER ('+fmt(G.shift.earned)+')':'VARDİYAYI BIRAK';
export function quitShift(){
  if(potAtRisk()&&performance.now()-quitArm>4000){quitArm=performance.now();$('quitBtn').textContent='EMİN MİSİN? '+fmt(G.shift.earned)+' GİDECEK, TEKRAR BAS';return;}
  save();goMenu();
}
export function togglePause(force){
  if(G.state!=='play'&&G.state!=='count')return;
  G.paused=force!==undefined?force:!G.paused;
  $('pause').hidden=!G.paused;if(G.paused)clearInput();
  // leaving mid-ride loses the pot: say so on the button, and ask for a second tap
  quitArm=-1e9;$('quitBtn').textContent=quitLabel();
}

/* ---------- garage ---------- */
export function showGarage(){
  if(G.state!=='menu'){G.state='menu';hideGameUI();demoTrack();}
  renderGarage();showScreen('garage');$('garage').scrollTop=0;
}
export function renderGarage(){
  const b=curBike(),u=ups(b.id),st=stats(b,u);
  $('gMoney').textContent=fmt(G.S.money);$('gName').textContent=b.n;
  const pv=$('gPrev'),g=pv.getContext('2d');g.clearRect(0,0,pv.width,pv.height);g.drawImage(bikeSprites(b,G.S.wpn,G.S.cos)[G.S.wpn==='kick'?1:2],0,0,pv.width,pv.height);
  const bars=$('gBars');bars.textContent='';
  const bar=(k,v)=>{const i=el('i'),f=el('b');f.style.width=Math.round(clamp(v,.04,1)*100)+'%';i.append(f);bars.append(el('span',null,k),i);};
  bar('HIZ '+Math.round(st.top*KMH)+' km/sa',st.top);
  bar('KALKIŞ',(st.top/st.accT)/.3);
  bar('VİRAJ',(st.steer/st.cent)/1.7);
  bar('DAYANIKLILIK',(1/st.dmg)/1.6);
  const ul=$('gUps');ul.textContent='';
  UPG.forEach((up,k)=>{
    if(k===1||k===3)return;   // tyres and jacket were folded into the engine
    const lv=u[k]||0,row=el('div','item'),info=el('div'),t=el('div','t',up.n),pips=el('span','pips');
    for(let i=0;i<UPMAX;i++)pips.append(el('i',i<lv?'on':null));
    t.append(pips);info.append(t,el('div','d',up.d));
    const btn=el('button','buy');btn.type='button';
    if(lv>=UPMAX){btn.textContent='MAKS';btn.disabled=true;}
    else{const c=upCost(b,lv);btn.textContent=fmt(c);btn.disabled=G.S.money<c;
      btn.addEventListener('click',()=>{if(G.S.money<c)return;G.S.money-=c;u[k]=lv+1;save();sfx('cash');toast(up.n+' seviye '+u[k]);renderGarage();});}
    row.append(info,btn);ul.append(row);
  });
  // looks: paint and helmet swatches; tap an owned one to wear it, tap a new one to buy and wear it
  const cl=$('gCos');cl.textContent='';const cs=G.S.cos;
  for(const [kind,list,key,lab] of[['p',PAINT,'paint','Motor boyası'],['h',HELM,'helm','Kask']]){
    const row=el('div','crow');row.append(el('span','clab',lab));const sw=el('div','sws');
    for(const it of list){const own=cs.own.includes(kind+':'+it.id),on=cs[key]===it.id,b2=el('button','sw'+(on?' on':'')+(own?'':' lock'));b2.type='button';
      b2.style.setProperty('--c',it.c||(kind==='p'?'#2a2533':b.helmet));b2.title=it.n;b2.setAttribute('aria-label',it.n+(own?'':' · '+fmt(it.p)));
      b2.append(el('i'),el('small',null,own?(on?'✓':''):fmt(it.p)));
      if(!own&&G.S.money<it.p)b2.disabled=true;
      b2.addEventListener('click',()=>{if(!own){if(G.S.money<it.p)return;G.S.money-=it.p;cs.own.push(kind+':'+it.id);sfx('cash');toast(it.n+' alındı');}else sfx('beep');cs[key]=it.id;save();renderGarage();});
      sw.append(b2);}
    row.append(sw);cl.append(row);}
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
  G.PSPR=bikeSprites(b,G.S.wpn,G.S.cos);
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
