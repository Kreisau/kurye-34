import { audioInit, sfx, sfxStars } from './audio.js';
import { $, BIKES, CARDS, DISTRICTS, KMH, M_PER_SEG, UPG, WPN, clamp, el, fmt, maxSpeed, playerZ, segL } from './config.js';
import { G } from './g.js';
import { card, demoTrack, newShift, prepDelivery, unlocked } from './game.js';
import { clearInput } from './input.js';
import { curBike, save, stats, upCost, ups } from './save.js';
import { rateDelivery, ratingLabel, recordRating, starStr } from './rating.js';
import { bikeSprites } from './sprites.js';
import { tutFinish, tutStop } from './tutorial.js';

/* ---------- HUD & UI ---------- */
export const hudCache={};
export function setText(id,v){if(hudCache[id]!==v){hudCache[id]=v;$(id).textContent=v;}}
export function distStr(){const m=Math.max(0,(G.finishZ-G.pos-playerZ)/segL*M_PER_SEG);return m>=1000?(m/1000).toFixed(1)+' km':Math.round(m/10)*10+' m';}
export function hudTick(){
  if($('hud').hidden)return;
  setText('time',G.tut?'—':G.timeLeft.toFixed(1));
  $('time').classList.toggle('warn',G.timeLeft<10);
  $('prog').style.width=(clamp((G.pos+playerZ)/G.finishZ,0,1)*100).toFixed(1)+'%';
  setText('dist',distStr());
  setText('kmh',Math.round(G.speed/maxSpeed*KMH)+' km/sa');
  setText('money',fmt(G.S.money+G.bonus));
  const p=$('pkg');p.style.width=G.cond+'%';p.classList.toggle('low',G.cond<40);
  const cdv=G.state==='play'&&G.timeLeft<=10?Math.ceil(G.timeLeft):0,cd=$('cd');
  if(cdv){if(cd.hidden)cd.hidden=false;if(hudCache.cd!==cdv){hudCache.cd=cdv;cd.textContent=cdv;sfx('beep');}}
  else if(!cd.hidden){cd.hidden=true;hudCache.cd=0;}
}
G.toastTimer=0;
export function toast(msg,ms,big){const t=$('toast');t.textContent=msg;t.classList.toggle('big',!!big);t.classList.add('show');clearTimeout(G.toastTimer);G.toastTimer=setTimeout(()=>t.classList.remove('show'),ms||1300);}
export function showScreen(id){for(const s of['menu','garage','brief','result','pause','story','settings'])$(s).hidden=s!==id;}
export function updateMenu(){
  $('mMoney').textContent=fmt(G.S.money);
  $('mBike').textContent=curBike().n;
  $('mRating').textContent=ratingLabel();
  $('mShift').textContent='Vardiya #'+(G.S.shifts+1)+' · '+unlocked()+'/6 bölge açık';
}
export function hideGameUI(){$('cd').hidden=true;$('hud').hidden=true;$('controls').hidden=true;$('keyhint').hidden=true;$('rivalHint').hidden=true;$('radio').hidden=true;}
export function renderResult(o){
  $('resEyebrow').textContent=o.eyebrow;$('resTitle').textContent=o.title;$('resSub').textContent=o.sub;
  const rows=$('resRows');rows.textContent='';
  for(const [k,v,cls] of o.rows){rows.append(el('dt',cls,k),el('dd',cls,v));}
  const pk=$('picks');pk.textContent='';$('pickWrap').hidden=!o.picks;
  if(o.picks)for(const c of o.picks){
    const b=el('button','opt');b.type='button';
    const have=card(c.id);
    b.append(el('small',null,have?'SENDE ×'+have:(c.stack?'KATLANIR':'KART')),el('b',null,c.t),el('span',null,c.d));
    b.addEventListener('click',()=>{G.shift.cards[c.id]=have+1;G.shift.i++;sfx('beep');prepDelivery();});
    pk.append(b);
  }
  const bt=$('resBtns');bt.textContent='';
  for(const x of o.buttons||[]){const b=el('button',x.cls,x.t);b.type='button';b.addEventListener('click',x.fn);bt.append(b);}
  showScreen('result');
}
export function drawCards(){
  const pool=CARDS.filter(c=>c.stack||!card(c.id));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,3);
}
export function finish(ok,why){
  if(G.state!=='play'&&G.state!=='arrive')return;
  G.state='result';clearInput();hideGameUI();
  if(G.tut){tutFinish();return;}
  const rt=rateDelivery(ok,why),to=G.route.to;recordRating(rt.stars);
  const eyebrow='VARDİYA #'+(G.shift.L+1)+' · TESLİMAT '+(G.shift.i+1)+'/3';
  const endButtons=[{t:'GARAJA GİT',cls:'cta',fn:showGarage},{t:'YENİ VARDİYA',cls:'ghost',fn:()=>{audioInit();newShift();}},{t:'MENÜ',cls:'ghost',fn:goMenu}];
  if(ok){
    const pay=Math.round(G.route.pay*G.cond/100),tb=Math.round(G.timeLeft*1.5),total=pay+tb+G.bonus+rt.tip;
    G.S.money+=total;G.shift.earned+=total;
    const rows=[['Müşteri puanı',starStr(rt.stars),'stars'],['Taşıma ücreti ('+G.cond+'%)',fmt(pay)],['Süre bonusu ('+G.timeLeft.toFixed(1)+' sn)',fmt(tb)],['Bahşiş',fmt(rt.tip)],['Rakip bonusu',fmt(G.bonus)],['BU TESLİMAT',fmt(total),'total']];
    const sub='“'+rt.comment+'” · '+to;
    sfxStars(rt.stars);if(rt.tip&&G.AC)sfx('cash',{t:G.AC.currentTime+.25+rt.stars*.16});
    if(G.shift.i<2){
      rows.push(['KASA',fmt(G.S.money)]);save();
      renderResult({eyebrow,title:'TESLİM EDİLDİ',sub,rows,picks:drawCards(),buttons:[]});
    }else{
      const sb=50+G.shift.L*25;G.S.money+=sb;G.shift.earned+=sb;G.S.shifts++;G.S.best=Math.max(G.S.best,G.S.shifts);save();
      rows.push(['Vardiya bonusu',fmt(sb)],['VARDİYA TOPLAMI',fmt(G.shift.earned),'total'],['KASA',fmt(G.S.money)]);
      renderResult({eyebrow,title:'VARDİYA TAMAM',sub:sub+'. Üç teslimat da yerine ulaştı.'+(1+G.S.shifts<DISTRICTS.length?' Yeni bölge açıldı: '+DISTRICTS[1+G.S.shifts].name+'.':''),rows,buttons:endButtons});
      G.shift=null;
    }
  }else{
    save();sfx('fail');
    renderResult({eyebrow,title:'VARDİYA BİTTİ',
      sub:(why==='time'?'Süre doldu, sipariş iptal. ':'Paket dağıldı. ')+'“'+rt.comment+'” · '+to+'. Bu vardiyada kazandığın para kasada.',
      rows:[['Müşteri puanı',starStr(rt.stars),'stars'],['Kalan mesafe',distStr()],['Paket durumu',G.cond+'%'],['Vardiya kazancı',fmt(G.shift.earned),'total'],['KASA',fmt(G.S.money)]],buttons:endButtons});
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
