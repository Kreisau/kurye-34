import { G } from './g.js';

document.documentElement.lang='tr';
export const $=id=>document.getElementById(id);
export const cvs=$('c'),ctx=cvs.getContext('2d');
export const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- constants ---------- */
export const STEP=1/60,segL=200,LANES=[-0.66,0,0.66],camH=1100,drawDist=200,FOGD=4.2;
G.roadW=2000;
export const camDepth=1/Math.tan(50*Math.PI/180),playerZ=900*camDepth*1.3,maxSpeed=segL/STEP;
export const BRK=-maxSpeed*1.1,DEC=-maxSpeed/5,OFFDEC=-maxSpeed/1.6,OFFLIM=maxSpeed/4,CENT=0.3;
export const PW=0.15,BIKE_WW=570,M_PER_SEG=2,KMH=130;
export const THEMES={
  dusk:{sky:['#1b1533','#3a2350','#7a3c66','#e0784e'],fog:'#83495f',far:'#3d2a57',near:'#251a3c',sun:'#ffd08a',glow:'255,208,138',road:['#47414f','#423c4a'],side:['#867982','#7c7079'],water:'#4a3a6a',lit:.4,win:['#ffd58a','#a8d4ff'],lane:'#ddd5cc'},
  morning:{sky:['#4f7fb8','#86acd4','#e3c0a8','#f7d9b4'],fog:'#cbb9b4',far:'#7d8db0',near:'#5f6e90',sun:'#fff3d6',glow:'255,240,210',road:['#56545c','#504e56'],side:['#a69e99','#9b938e'],water:'#3d6d99',lit:.12,win:['#ffe3b0','#cfe3f5'],lane:'#e6e0d8'},
  night:{sky:['#04050d','#0b1230','#1a2350','#35305f'],fog:'#222a4e',far:'#141a38',near:'#0b0f26',sun:'#e8ecf7',glow:'200,210,255',moon:true,road:['#2f2d37','#2a2832'],side:['#56515f','#4e4957'],water:'#151c3a',lit:.68,win:['#ffcf7a','#9fd2ff'],lane:'#c9c3bb'},
  day:{sky:['#2c6bb2','#4d8dcf','#8bbfe7','#d2e8f3'],fog:'#a8c3d6',far:'#6d88a3',near:'#4f657d',sun:'#fffbe8',glow:'255,250,225',road:['#4e4c53','#49474e'],side:['#b1a8a0','#a69d95'],water:'#2e77a7',lit:.05,win:['#e8eef2','#bcd4e6'],lane:'#eeeae4'},
  golden:{sky:['#33264a','#874650','#d98848','#f7c46c'],fog:'#c18a5e',far:'#6b4049',near:'#4a2c35',sun:'#ffe2a2',glow:'255,226,162',road:['#74675b','#6a5d52'],side:['#a08d7a','#958270'],water:'#6a5a70',lit:.25,win:['#ffd58a','#ffe8c0'],lane:'#e6dccb'},
  neon:{sky:['#090515','#1d0a37','#47105c','#9d2f6c'],fog:'#47195a',far:'#21103a',near:'#140927',sun:'#f2d7ff',glow:'230,140,255',moon:true,road:['#33303b','#2e2b36'],side:['#5b5367','#534b5f'],water:'#1e1235',lit:.75,win:['#7ff0ff','#ff7ad9'],lane:'#d8d0e0'}
};
export function pal(T){return{
  light:{road:T.road[0],side:T.side[0],rumble:T.cobble?'#b3a28c':'#f2c230',lane:T.lane},
  dark:{road:T.road[1],side:T.side[1],rumble:T.cobble?'#7d6d5a':'#211b2b',lane:null},
  start:{road:'#e9e3db',side:T.side[0],rumble:'#e9e3db',lane:null},
  cobL:{road:'#74675b',side:T.side[0],rumble:'#b3a28c',lane:null},cobD:{road:'#6a5d52',side:T.side[1],rumble:'#7d6d5a',lane:null},
  fin1:{road:'#ffc61a',side:'#9a8a6a',rumble:'#ff5a5a',lane:null},
  fin2:{road:'#1d1726',side:'#9a8a6a',rumble:'#f4eee6',lane:null}};}
export const FACADES=['#d4a373','#c9806b','#a7bfa6','#d9c9a3','#b98fa6','#8ea9c7','#e0b07a','#c7b8a0'];
export const AWN=['#c4373a','#2e8f6c','#2a6fb0','#d98a1f'];
export const SHOPS=['BAKKAL','BÜFE','BERBER','ÇAY OCAĞI','TERZİ','KASAP','FIRIN','TEKEL','KIRTASİYE','LOKANTA'];
export const CAR_COLORS=['#c9cdd6','#2f3445','#8c2f39','#3f5a7a','#e8e2da','#5b6b4f'];
export const DISTRICTS=[
  {name:'Kadıköy',stops:['Moda','Yeldeğirmeni','Fenerbahçe'],curv:1,hill:.8,up:.5,theme:'dusk',far:'bridge',style:'apt',sea:0,bus:1,traf:1,pot:1,tag:'Gün batımı, çarşı sokakları'},
  {name:'Üsküdar',stops:['Kuzguncuk','Çengelköy','Salacak'],curv:1.2,hill:1,up:.5,theme:'morning',far:'kizkulesi',style:'apt',sea:-1,bus:1,traf:.9,pot:1,tag:'Sabah, sahil yolu, vapurlar'},
  {name:'Karaköy',stops:['Galata','Cihangir','Tarlabaşı'],curv:.9,hill:1.8,up:.75,theme:'night',far:'galata',style:'apt',sea:0,bus:.8,traf:1.1,pot:1.2,tag:'Gece, dik yokuşlar'},
  {name:'Beşiktaş',stops:['Ortaköy','Bebek','Akaretler'],curv:1.4,hill:1,up:.5,theme:'day',far:'ortakoy',style:'apt',sea:1,bus:1.6,traf:1,pot:1,tag:'Öğlen, sahil yolu, bol otobüs'},
  {name:'Fatih',stops:['Balat','Fener','Sultanahmet'],curv:1.5,hill:1.4,up:.45,theme:'golden',far:'peninsula',style:'wood',sea:0,bus:.7,traf:.9,pot:2.2,tag:'Arnavut kaldırımı, bol çukur'},
  {name:'Şişli',stops:['Nişantaşı','Kurtuluş','Mecidiyeköy'],curv:1.7,hill:1.2,up:.6,theme:'neon',far:'towers',style:'tower',sea:0,bus:2.5,traf:1.4,pot:1,tag:'Plazalar, yoğun trafik'}
];
export const POOLS={
  'Kadıköy':['Moda','Yeldeğirmeni','Fenerbahçe','Caferağa','Rasimpaşa','Osmanağa','Koşuyolu','Acıbadem','Göztepe','Kozyatağı'],
  'Üsküdar':['Kuzguncuk','Çengelköy','Salacak','Altunizade','Beylerbeyi','Bağlarbaşı','Doğancılar','Valide-i Atik','İcadiye','Kandilli'],
  'Karaköy':['Galata','Cihangir','Tarlabaşı','Kasımpaşa','Tophane','Şişhane','Asmalımescit','Çukurcuma','Firuzağa','Hacıahmet'],
  'Beşiktaş':['Ortaköy','Bebek','Akaretler','Abbasağa','Arnavutköy','Etiler','Levent','Ulus','Kuruçeşme','Yıldız'],
  'Fatih':['Balat','Fener','Sultanahmet','Kumkapı','Aksaray','Vefa','Zeyrek','Çarşamba','Samatya','Cibali'],
  'Şişli':['Nişantaşı','Kurtuluş','Mecidiyeköy','Feriköy','Bomonti','Teşvikiye','Esentepe','Fulya','Osmanbey','Harbiye']
};
export const ROADWS={'Fatih':1700,'Şişli':2400};
export const TMUL={'Karaköy':1.12,'Fatih':1.08};
for(const D of DISTRICTS){D.pool=POOLS[D.name];D.roadW=ROADWS[D.name]||2000;D.tmul=TMUL[D.name]||1;}
export const NB={
  'Fenerbahçe':[1,'apt',0,0,'l'],'Caferağa':[0,'apt',0,0,'td'],'Osmanağa':[0,'apt',0,0,'tdb'],'Yeldeğirmeni':[0,'apt',0,1,'e'],'Rasimpaşa':[0,'apt',0,1,'e'],
  'Göztepe':[0,'apt',0,0,'l'],'Moda':[0,'apt',0,1,'l'],'Kozyatağı':[0,'plaza',0,0,'b'],'Koşuyolu':[0,'villa',0,1,''],'Acıbadem':[0,'apt',0,1,''],
  'Kuzguncuk':[-1,'wood',0,0,''],'Çengelköy':[-1,'wood',0,0,''],'Beylerbeyi':[-1,'wood',0,0,'l'],'Salacak':[-1,'apt',0,0,'d'],'Kandilli':[-1,'villa',0,1,'l'],
  'Altunizade':[0,'plaza',0,0,'b'],'Doğancılar':[0,'apt',0,2,'d'],'Valide-i Atik':[0,'hist',0,2,'e'],'İcadiye':[0,'apt',0,2,''],'Bağlarbaşı':[0,'apt',0,1,'d'],
  'Tophane':[1,'hist',0,0,'t'],'Galata':[0,'hist',1,2,'t'],'Şişhane':[0,'hist',1,2,'t'],'Çukurcuma':[0,'hist',1,2,'e'],'Cihangir':[0,'apt',0,2,'t'],
  'Tarlabaşı':[0,'apt',0,1,'eh'],'Hacıahmet':[0,'apt',0,1,'eh'],'Kasımpaşa':[0,'apt',0,1,'ed'],'Asmalımescit':[0,'hist',1,1,'t'],'Firuzağa':[0,'apt',0,2,'e'],
  'Ortaköy':[1,'hist',0,0,'lt'],'Bebek':[1,'villa',0,0,'l'],'Arnavutköy':[1,'wood',0,0,'l'],'Kuruçeşme':[1,'apt',0,0,'l'],'Etiler':[0,'villa',0,1,'l'],
  'Ulus':[0,'villa',0,2,'l'],'Levent':[0,'plaza',0,0,'lb'],'Abbasağa':[0,'apt',0,1,'d'],'Akaretler':[0,'hist',0,1,'td'],'Yıldız':[0,'apt',0,2,''],
  'Balat':[-1,'wood',1,1,'e'],'Fener':[-1,'wood',1,1,'e'],'Cibali':[-1,'hist',1,0,'eh'],'Kumkapı':[1,'hist',0,0,'t'],'Samatya':[1,'apt',0,0,'e'],
  'Sultanahmet':[0,'hist',1,0,'tb'],'Aksaray':[0,'apt',0,0,'dbh'],'Zeyrek':[0,'wood',1,2,'e'],'Vefa':[0,'hist',1,1,'e'],'Çarşamba':[0,'apt',0,1,'e'],
  'Nişantaşı':[0,'apt',0,0,'l'],'Teşvikiye':[0,'apt',0,1,'l'],'Mecidiyeköy':[0,'plaza',0,0,'dbh'],'Esentepe':[0,'plaza',0,1,'d'],'Bomonti':[0,'plaza',0,0,''],
  'Osmanbey':[0,'apt',0,0,'h'],'Harbiye':[0,'apt',0,0,'b'],'Kurtuluş':[0,'apt',0,1,'e'],'Feriköy':[0,'apt',0,1,'e'],'Fulya':[0,'apt',0,0,'']
};
export function mixOf(t){const m={};if(t.includes('t'))m.taxi=2.2;if(t.includes('d'))m.dolmus=2.5;if(t.includes('l')){m.lux=4;m.eco=.4;}if(t.includes('e')){m.eco=2.5;m.lux=.3;}if(t.includes('b'))m.bus=2;if(t.includes('h'))m.ticari=2.5;return m;}
export const PROF={};
export function prof(n){if(PROF[n])return PROF[n];const r=NB[n]||[0,'apt',0,1,''];return PROF[n]={name:n,sea:r[0],style:r[1],cobble:!!r[2],hill:r[3],mix:mixOf(r[4])};}
export function pdesc(p){return(p.sea?'sahil':p.cobble?'Arnavut kaldırımı':p.hill===2?'dik yokuş':{plaza:'plazalar',villa:'villalar',wood:'ahşap evler',hist:'tarihi doku'}[p.style])||'mahalle arası';}
export const RESTS=['Usta Dürüm','Mahalle Pidecisi','Köşe Kokoreç','Mantı Evi','Lahmacun Sarayı','Kumpir Köşesi','Balık Ekmek','Tantuni Durağı','Döner Sofrası','Pilavcı Amca','Çiğ Köfte Noktası','Börek Fırını','Kebap Ocağı','Tostçu','Ev Yemekleri'];
G.TH=THEMES.dusk;G.DIS=DISTRICTS[0];G.FOG=G.TH.fog;G.FARC=G.TH.far;G.NEARC=G.TH.near;G.PAL=pal(G.TH);
export const BIKES=[
  {id:'mob',n:'Mobilet 50',lbl:'50',price:0,top:.48,acc:5.5,grip:.8,steer:.85,dur:1.1,pitch:1.45,box:'#9a8f7d',jacket:'#3b3a4a',helmet:'#e8e2da'},
  {id:'sc',n:'Scooter 125',lbl:'125',price:1500,top:.6,acc:4.8,grip:1,steer:1,dur:1,pitch:1.2,box:'#d9d4c7',jacket:'#2b2d42',helmet:'#ffc61a'},
  {id:'k150',n:'Kurye 150',lbl:'150',price:4500,top:.72,acc:4.2,grip:.95,steer:.95,dur:.9,pitch:1,box:'#2a6fb0',jacket:'#1f2a3a',helmet:'#f4eee6'},
  {id:'n250',n:'Naked 250',lbl:'250',price:12000,top:.85,acc:3.6,grip:1.15,steer:1.2,dur:1,pitch:.88,box:'#1d1a20',jacket:'#262130',helmet:'#1d1a20'},
  {id:'s600',n:'Sport 600',lbl:'600',price:30000,top:1,acc:3,grip:1,steer:1.05,dur:1.15,pitch:.78,box:'#ffc61a',jacket:'#120d22',helmet:'#c4373a'}
];
export const UPG=[
  {n:'Motor',d:'+%5 maks. hız, daha çabuk kalkış'},
  {n:'Lastik',d:'Virajda daha az savrulma, daha keskin dönüş'},
  {n:'Çanta',d:'Paket hasarı %12 az'},
  {n:'Mont',d:'Düşünce daha çabuk toparlanırsın'},
  {n:'Nitro',d:'Her seviye, teslimat başına 1 nitro hakkı: 2.5 sn +%25 hız'}
];
export const CARDS=[
  {id:'termos',t:'Termos Çanta',d:'Paket hasarı %30 az.',stack:true},
  {id:'taksici',t:'Taksici Dayı',d:'Taksiler şerit değiştirmez.'},
  {id:'kisayol',t:'Kısa Yol',d:'Kalan teslimatlara +8 sn.',stack:true},
  {id:'bahsis',t:'Bahşişçi Müşteri',d:'Taşıma ücreti +%25.',stack:true},
  {id:'turbo',t:'Karbüratör Ayarı',d:'Maks. hız +%8.',stack:true},
  {id:'eldiven',t:'Ağır El',d:'Vuruş menzili +%30, rakip bonusu iki katı.'},
  {id:'sigorta',t:'Kargo Sigortası',d:'Paket bir kez dağılmaktan kurtulur, %30 ile devam edersin.'},
  {id:'kask',t:'Çelik Kask',d:'Düşünce iki kat hızlı kalkarsın.'},
  {id:'yolbilir',t:'Ara Sokak Bilgisi',d:'Virajda savrulma %25 az.'},
  {id:'sakin',t:'Sessiz Egzoz',d:'Rakip kurye seni geç fark eder.'}
];
export const EVENTS={
  yagmur:{t:'YAĞMUR',d:'Yol kaygan: virajda daha çok savrulursun.'},
  trafik:{t:'YOĞUN TRAFİK',d:'Yolda her zamankinden fazla araç var.'},
  rakip2:{t:'KALABALIK',d:'Bu rotada fazladan bir rakip kurye var. Aynalara bak.'}
};
export const CARTYPES=[
  {k:'taxiY',cat:'taxi',w:.22,sp:[.38,.58],msg:'Taksiye çarptın',wild:.7},
  {k:'taxiT',cat:'taxi',w:.05,sp:[.32,.48],msg:'Turkuaz taksiye çarptın'},
  {k:'taxiV',cat:'taxi',w:.02,sp:[.28,.42],msg:'VIP taksiye çarptın'},
  {k:'car',cat:'car',w:.28,sp:[.3,.48],msg:'Arabaya çarptın'},
  {k:'lux',cat:'lux',w:.05,sp:[.42,.62],msg:'Lüks cipe çarptın',wild:.6},
  {k:'hafif',cat:'ticari',w:.1,sp:[.3,.45],msg:'Beyaz minivana çarptın',wild:.4},
  {k:'van',cat:'ticari',w:.1,sp:[.28,.4],msg:'Minibüse çarptın'},
  {k:'klasik',cat:'eco',w:.08,sp:[.38,.58],msg:'Eski sedana çarptın',wild:.5},
  {k:'hurda',cat:'eco',w:.05,sp:[.2,.3],msg:'Kamyonete çarptın',wild:.3},
  {k:'dolmus',cat:'dolmus',w:.08,sp:[.3,.45],msg:'Dolmuşa çarptın',wild:.9},
  {k:'bus',cat:'bus',w:.08,sp:[.22,.32],msg:'Otobüse çarptın'}
];
export const WPN=[
  {id:'kick',n:'Tekme',d:'Bedava. Kısa menzil, hafif vuruş.',price:0,zb:60,za:120,lmax:.36,pow:1},
  {id:'bat',n:'Beyzbol Sopası',d:'İki kat güçlü vuruş, orta menzil.',price:800,zb:80,za:150,lmax:.42,pow:2},
  {id:'chain',n:'Zincir',d:'En uzun menzil, orta güç.',price:2000,zb:100,za:200,lmax:.5,pow:1.5},
  {id:'bar',n:'Levye',d:'Her kuryeyi tek vuruşta yere serer.',price:4500,zb:80,za:150,lmax:.42,pow:3}
];
export const RIVALS=[
  {id:'red',n:'Kırmızı',box:'#d8343a',jacket:'#3a1a1e',helmet:'#d8343a',lbl:'ALEV',spd:1.05,aggr:2.2,dmg:12,hp:2,cut:.2,push:.3},
  {id:'green',n:'Yeşil',box:'#2fae5e',jacket:'#1d3a2a',helmet:'#e8e2da',lbl:'ÇEVİK',spd:1.18,aggr:.6,dmg:6,hp:1,cut:1,push:.18},
  {id:'orange',n:'Turuncu',box:'#f2862e',jacket:'#3a2a1a',helmet:'#f2862e',lbl:'TOSUN',spd:.98,aggr:1.3,dmg:9,hp:3,cut:.3,push:.22},
  {id:'purple',n:'Mor',box:'#7a3fd0',jacket:'#22183a',helmet:'#1d1a20',lbl:'GECE',spd:1.1,aggr:1.6,dmg:10,hp:1.5,cut:.5,push:.22}
];

/* ---------- utils ---------- */
export const lerp=(a,b,p)=>a+(b-a)*p, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const easeIn=(a,b,p)=>a+(b-a)*p*p, easeInOut=(a,b,p)=>a+(b-a)*((-Math.cos(p*Math.PI)/2)+.5);
export const pick=(R,a)=>a[Math.floor(R()*a.length)];
export function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function shade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=a<0?0:255,p=Math.abs(a);r=Math.round(r+(t-r)*p);g=Math.round(g+(t-g)*p);b=Math.round(b+(t-b)*p);return'rgb('+r+','+g+','+b+')';}
export const def=(img,ww,o)=>Object.assign({img,ww,half:ww/G.roadW/2,solid:false,hit:0,msg:''},o||{});
export const fmt=n=>Math.round(n).toLocaleString('tr-TR')+' TL';
export const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
