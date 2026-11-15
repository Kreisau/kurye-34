import { G } from './g.js';

/* ---------- English layer ----------
   The game is written in Turkish. When the language is set to English, every piece of text that reaches the
   page is translated here: whole-sentence patterns first, then a phrase table (longest phrase wins).
   Place names, restaurant names and shop signs stay Turkish on purpose: it is Istanbul.
   Adding text to the game? Add its English here; tools/i18n_check.py lists anything still untranslated. */

const OBJ = {
  'taksiye': 'a taxi', 'arabaya': 'a car', 'cipe': 'an SUV', 'minivana': 'a van', 'minibüse': 'a minibus', 'eski sedana': 'an old sedan',
  'kamyonete': 'a pickup', 'dolmuşa': 'a dolmuş', 'otobüse': 'a bus', 'park etmiş arabaya': 'a parked car', 'yol çalışmasına': 'the road works',
  'duvara': 'the wall', 'kaldırımdaki engele': 'something on the pavement', 'yoldaki eşyaya': 'junk on the road',
};
const COL = { 'Kırmızı': 'Red', 'Yeşil': 'Green', 'Turuncu': 'Orange', 'Mor': 'Purple' };
const obj = s => OBJ[s] || s, col = s => COL[s] || s;

// sentence patterns (Turkish word order differs too much for phrase swapping)
const RX = [
  [/(\S+) kurye (.+?) çarptı, saf dışı!(\s+\+)/g, (m, c, o, t) => col(c) + ' courier crashed into ' + obj(o) + ' and is out!' + t],
  [/(\S+) kurye (.+?) çarptı, saf dışı/g, (m, c, o) => col(c) + ' courier crashed into ' + obj(o) + ' and is out'],
  [/Kara (.+?) çarptı!/g, (m, o) => 'Kara crashed into ' + obj(o) + '!'],
  [/Sıradaki ipucu: (\d+) vardiya sonra\./g, (m, n) => 'Next clue in ' + n + (n === '1' ? ' shift.' : ' shifts.')],
  [/(\S+) seviye (\d)/g, (m, a, n) => a + ' level ' + n],
  [/Taşıma ücreti \((\d+)%\)/g, 'Delivery fee ($1%)'],
  [/Süre bonusu \(([\d.,]+) sn\)/g, 'Time bonus ($1 s)'],
];

const EN = {
  // HUD and controls
  'SÜRE': 'TIME', 'KASA': 'CASH', 'PAKET': 'PACKAGE', 'SES': 'SOUND', 'SESSİZ': 'MUTED', 'RAKİP ARKADA': 'RIVAL BEHIND', 'ATLA': 'SKIP', 'VUR': 'HIT', 'FREN': 'BRAKE',
  'NİTRO': 'NITRO', 'NİTRO!': 'NITRO!', 'NİTRO ×': 'NITRO ×', 'km/sa': 'km/h', 'sn': 's',
  'Gaz otomatik · ← → yön · ↓ fren · Boşluk vur · N nitro · P duraklat': 'Auto throttle · ← → steer · ↓ brake · Space hit · N nitro · P pause',
  // menu
  'İSTANBUL · MOTO KURYE · PROTOTİP': 'ISTANBUL · MOTO COURIER · PROTOTYPE',
  'Her vardiya 3 teslimat. Kazan, garajı büyüt, sana çarpanı bul.': 'Three deliveries a shift. Earn, build your garage, find who hit you.',
  'Her vardiya 5 teslimat. Kasayı al ya da riske gir. Sana çarpanı bul.': 'Five deliveries a shift. Bank the pot or risk it. Find who hit you.',
  'VARDİYA': 'SHIFT',
  'KASA ALINDI': 'POT BANKED',
  'KASAYI AL VE BİTİR · ': 'BANK IT AND STOP · ',
  'LANETLİ': 'CURSED',
  'ÜCRET ×': 'FEE ×',
  'Vardiyayı erken kapattın. Para güvende; ama ipucu, yeni kart ve vardiya bonusu için beş teslimatı da bitirmen gerekir.': 'You closed the shift early. The money is safe, but clues, new cards and the shift bonus need all five deliveries.',
  'Kasaya giren': 'Banked',
  'VARDİYA KASASI (riskte)': 'SHIFT POT (at risk)',
  'Sıradaki teslimat ücreti': 'Next delivery fee',
  'Yeni kart açıldı': 'New card unlocked',
  '. Kart seçip devam et ya da kasayı al. Düşersen vardiya kasası gider.': '. Pick a card and ride on, or bank the pot. Fail and the shift pot is gone.',
  '. Beş teslimat da yerine ulaştı, kasa güvende.': '. All five deliveries made it; the pot is safe.',
  '. Kasaya girmemiş vardiya kazancı gitti.': '. The unbanked shift earnings are gone.',
  'Kaybedilen vardiya kazancı': 'Shift earnings lost',
  ' TESLİMAT': ' DELIVERIES',
  'Yedek Tüp': 'Spare Canister',
  'Her teslimatta +1 nitro.': '+1 nitro every delivery.',
  'Cam Eşya': 'Glassware',
  'Taşıma ücreti iki katı. Paket iki kat kırılgan.': 'Double delivery fee. The package is twice as fragile.',
  'Dikiz Ustası': 'Mirror Master',
  'Yere serdiğin her rakip +6 sn kazandırır.': 'Every rival you knock down adds 6 s.',
  'Seri Teslimat': 'Express Run',
  'Süre bonusu iki katı.': 'Double time bonus.',
  'Balata Bitik': 'Worn Brake Pads',
  'Maks. hız +%15. Fren yarı güçte.': 'Top speed +15%. Brakes at half strength.',
  'Tatlı Dil': 'Smooth Talker',
  'Müşteri puanı +1 yıldız.': 'Customer rating +1 star.',
  'Ekspres Sipariş': 'Express Order',
  'Taşıma ücreti +%60. Süre %20 kısa.': 'Delivery fee +60%. 20% less time.',
  'Tanıdık Polis': 'Friendly Cop',
  'Cezalar yarıya iner.': 'Fines are halved.',
  'Kabadayı': 'Tough Guy',
  'Rakip bonusu üç katı. Her teslimatta fazladan bir rakip.': 'Triple rival bonus. One extra rival every delivery.',
  'Çelik Tampon': 'Steel Bumper',
  'Araçlara hafif sürtünme pakete zarar vermez.': 'Light scrapes against cars do not hurt the package.',
  'Yavaş git demiyorum, sağ git diyorum. O gece de acele ediyordun.': 'I am not saying go slow, I am saying get there in one piece. You were in a hurry that night too.',
  'Bu sokakları ezbere biliyor gibiyim. Nereden?': 'I seem to know these streets by heart. How?',
  'Adını bana sorma. Sen hatırlayınca ben de söylerim.': 'Do not ask me your name. When you remember, I will say it too.',
  'Sol aynası kırık siyah bir motor görürsen bana haber ver.': 'If you see a black bike with a broken left mirror, tell me.',
  'Kırık ayna. Artık her siyah motora iki kez bakıyorum.': 'A broken mirror. I look twice at every black bike now.',
  'Çaycı yalan söylemez. Işıkları kapalı giden adam bir şeyden kaçıyordur.': 'The tea seller does not lie. A man riding with his lights off is running from something.',
  'Karanlıkta farsız bir motor. Bu görüntü rüyalarımda da var.': 'A bike with no headlight in the dark. I see it in my dreams too.',
  '34 numara sendin evlat. Bu mahallede en hızlı sendin.': 'You were number 34, son. The fastest in this neighbourhood.',
  'Müşteriler beni tanıyor. Ben onları tanımıyorum.': 'The customers know me. I do not know them.',
  'Kara senin bölgeni aldı. Bölge almak için adam ezmek gerekmezdi ama.': 'Kara took your patch. He did not have to run a man over for it.',
  'Kara. İsmi duyunca sol omzum sızlıyor.': 'Kara. My left shoulder aches when I hear the name.',
  'Önce Şişli’yi al, sonra menüden hesaplaşmaya git. Sol tarafını göremez, unutma.': 'Take Şişli first, then go to the showdown from the menu. Remember: he cannot see his left side.',
  'Bu gece bitecek. Ya o düşecek ya yine ben.': 'It ends tonight. Either he goes down or I do, again.',
  'Bölge artık senin. Kara da artık kimsenin yolunu kesmiyor.': 'The patch is yours now. And Kara is not cutting anyone off anymore.',
  'Adımı hâlâ hatırlamıyorum. Şimdilik numaram yetiyor.': 'I still do not remember my name. The number will do for now.',
  'Bu cadde benim. Geri bas, çaylak.': 'This street is mine. Back off, rookie.',
  '34 mü? Sana öldü diyorlardı.': '34? They said you were dead.',
  'Tamam, tamam! Düştüğümü Kara’ya söyleme.': 'All right, all right! Do not tell Kara I went down.',
  'Yakalayabilirsen konuşuruz.': 'Catch me and we will talk.',
  'Paketini ben götüreyim, sen dinlen.': 'Let me take your package. You rest.',
  'O gece Kara’nın arkasındaydım. Fren lambası hiç yanmadı.': 'I was behind Kara that night. His brake light never came on.',
  'Yol dar, ben genişim. Kusura bakma.': 'Narrow road, wide me. No offence.',
  'Usta’ya selam söyle. Hâlâ borcu var bana.': 'Say hello to Usta. He still owes me.',
  'Eskiden beraber çay içerdik biz. Hatırlamıyor musun?': 'We used to drink tea together. Do you not remember?',
  'Seni gören olmadı. Beni de görmezler.': 'Nobody saw you. They will not see me either.',
  'Geri dönmeyecektin 34.': 'You should not have come back, 34.',
  'Kara seni o gece bilerek bekledi. Bölgeyi istiyordu.': 'Kara waited for you on purpose that night. He wanted the patch.',
  '34. Mezardan mı çıktın?': '34. Did you climb out of a grave?',

  'PUAN': 'RATING', 'MOTOR': 'BIKE', 'SIRADAKİ': 'NEXT', 'Henüz yok': 'None yet',
  'Gaz otomatik.': 'Throttle is automatic.',
  'Sol yarıda parmağını sürükleyerek yön ver, sağda FREN ve VUR. Arkadan gelen kuryeleri üstteki aynalardan izle.': 'Drag on the left half to steer; BRAKE and HIT are on the right. Watch the mirrors for couriers coming up behind you.',
  '← → yön, ↓ fren, Boşluk vur, P duraklat. Arkadan gelen kuryeleri üstteki aynalardan izle.': '← → steer, ↓ brake, Space hit, P pause. Watch the mirrors for couriers coming up behind you.',
  'VARDİYAYA BAŞLA': 'START SHIFT', 'GÜNÜN SİPARİŞİ': 'DAILY ORDER', 'DOSYA': 'CASE FILE', 'HESAPLAŞMA': 'SHOWDOWN', 'GARAJ': 'GARAGE', 'EĞİTİM': 'TUTORIAL', 'HİKÂYE': 'STORY', 'AYARLAR': 'SETTINGS',
  'Vardiya #': 'Shift #', ' bölge açık': ' districts open',
  // garage
  'PARÇALAR': 'PARTS', 'TEÇHİZAT': 'GEAR', 'MOTORLAR': 'BIKES', 'GERİ': 'BACK', 'HIZ ': 'SPEED ', 'KALKIŞ': 'ACCELERATION', 'VİRAJ': 'CORNERING', 'DAYANIKLILIK': 'TOUGHNESS',
  'MAKS': 'MAX', 'KUŞANILDI': 'EQUIPPED', 'KUŞAN': 'EQUIP', 'SEÇİLİ': 'SELECTED', 'SEÇ': 'SELECT', ' alındı': ' bought', ' garajda': ' is in the garage', 'Maks. ': 'Top ', '0-maks': '0 to top',
  'Mobilet 50': 'Moped 50', 'Kurye 150': 'Courier 150',
  'Motor': 'Engine', 'Lastik': 'Tyres', 'Çanta': 'Bag', 'Mont': 'Jacket',
  '+%5 maks. hız, daha çabuk kalkış': '+5% top speed, quicker off the line',
  'Virajda daha az savrulma, daha keskin dönüş': 'Less drift in corners, sharper steering',
  'Paket hasarı %12 az': '12% less package damage',
  'Düştüğünde daha çabuk toparlanırsın': 'You recover faster after a fall',
  'Her seviye, teslimat başına 1 nitro hakkı: 2,5 sn +%25 hız': 'Each level gives 1 nitro per delivery: 2.5 s of +25% speed',
  'Tekme': 'Kick', 'Beyzbol Sopası': 'Baseball Bat', 'Zincir': 'Chain', 'Levye': 'Crowbar',
  'Bedava. Kısa menzil, hafif vuruş.': 'Free. Short reach, light hit.', 'İki kat güçlü vuruş, orta menzil.': 'Hits twice as hard, medium reach.',
  'En uzun menzil, orta güç.': 'Longest reach, medium power.', 'Her kuryeyi tek vuruşta yere serer.': 'Floors any courier in one hit.',
  // orders
  'SİPARİŞLER': 'ORDERS', '● ÇEVRİMİÇİ': '● ONLINE', 'KARTLARIN': 'YOUR CARDS', 'VARDİYAYI BIRAK': 'QUIT SHIFT', 'KABUL ET': 'ACCEPT',
  'VARDİYA #': 'SHIFT #', ' · TESLİMAT ': ' · DELIVERY ', ' · PUAN ': ' · RATING ', 'ücret +': 'pay +', 'ücret −': 'pay −',
  'YAKIN': 'SHORT', 'NORMAL': 'NORMAL', 'UZAK': 'LONG',
  'YAĞMUR': 'RAIN', 'Yol kaygan: virajda daha çok savrulursun.': 'Slippery road: you drift more in corners.',
  'YOĞUN TRAFİK': 'HEAVY TRAFFIC', 'Yolda her zamankinden fazla araç var.': 'More vehicles on the road than usual.',
  'KALABALIK': 'CROWDED', 'Bu rotada fazladan bir rakip kurye var. Aynalara bak.': 'One extra rival courier on this route. Check your mirrors.',
  'sahil': 'seaside', 'Arnavut kaldırımı': 'cobblestones', 'dik yokuş': 'steep hill', 'plazalar': 'office towers', 'villalar': 'villas', 'ahşap evler': 'wooden houses', 'tarihi doku': 'old town', 'mahalle arası': 'back streets',
  // cards
  'BİR KART SEÇ': 'PICK A CARD', 'SENDE ×': 'OWNED ×', 'KATLANIR': 'STACKS', 'KART': 'CARD',
  'Termos Çanta': 'Thermal Bag', 'Paket hasarı %30 az.': '30% less package damage.',
  'Taksici Dayı': 'Uncle Cabbie', 'Taksiler şerit değiştirmez.': 'Taxis stop changing lanes.',
  'Kısa Yol': 'Shortcut', 'Kalan teslimatlara +8 sn.': '+8 s on the remaining deliveries.',
  'Bonkör Müşteri': 'Generous Customer', 'Taşıma ücreti +%25.': 'Delivery fee +25%.',
  'Karbüratör Ayarı': 'Carb Tune', 'Maks. hız +%8.': 'Top speed +8%.',
  'Ağır El': 'Heavy Hand', 'Vuruş menzili +%30, rakip bonusu iki katı.': 'Hit reach +30%, rival bonus doubled.',
  'Kargo Sigortası': 'Cargo Insurance', 'Paket bir kez dağılmaktan kurtulur, %30 ile devam edersin.': 'Saves the package from being destroyed once; you carry on at 30%.',
  'Çelik Kask': 'Steel Helmet', 'Düştüğünde iki kat hızlı kalkarsın.': 'You get up twice as fast after a fall.',
  'Ara Sokak Bilgisi': 'Back-Street Know-How', 'Virajda savrulma %25 az.': '25% less drift in corners.',
  'Sessiz Egzoz': 'Quiet Exhaust', 'Rakip kurye seni geç fark eder.': 'Rival couriers notice you late.',
  // ride toasts
  ' · paket alındı': ' · package picked up', 'Adrese vardın': 'You have arrived', '% paket': '% package', 'Sigorta devrede: paket %30': 'Insurance kicked in: package at 30%',
  'Tümseğe hızlı girdin': 'You took a speed bump too fast', 'Çukura girdin': 'You hit a pothole', 'Yola düşen eşyaya çarptın': 'You hit junk on the road', 'Yağa bastın!': 'Oil slick!',
  'Duvara çarptın': 'You hit the wall', 'Park etmiş arabaya çarptın': 'You hit a parked car', 'Yol çalışmasına daldın': 'You ploughed into the road works',
  'Taksiye çarptın': 'You hit a taxi', 'Turkuaz taksiye çarptın': 'You hit a turquoise taxi', 'VIP taksiye çarptın': 'You hit a VIP taxi', 'Arabaya çarptın': 'You hit a car',
  'Lüks cipe çarptın': 'You hit a luxury SUV', 'Beyaz minivana çarptın': 'You hit a white van', 'Minibüse çarptın': 'You hit a minibus', 'Eski sedana çarptın': 'You hit an old sedan',
  'Kamyonete çarptın': 'You hit a pickup', 'Dolmuşa çarptın': 'You hit a dolmuş', 'Otobüse çarptın': 'You hit a bus', 'Ambulansa çarptın': 'You hit an ambulance',
  'Tabelaya çarptın': 'You hit a sign', 'Çınara çarptın': 'You hit a plane tree', 'Direğe çarptın': 'You hit a lamp post', 'Simitçiye çarptın': 'You hit the simit cart',
  'Ambulansa yol vermedin': 'You blocked the ambulance', 'Ambulansa yol verdin': 'You let the ambulance pass',
  ' kurye vurdu': ' courier hit you', ' kurye sendeledi': ' courier staggered', ' kurye yerde!': ' courier is down!', ' kurye saf dışı!': ' courier is out!',
  'Kırmızı': 'Red', 'Yeşil': 'Green', 'Turuncu': 'Orange', 'Mor': 'Purple',
  // street life
  'Yayaya çarptın': 'You hit a pedestrian', ' TL ceza, puan düştü': ' TL fine, rating down', 'İleride polis çevirmesi: ': 'Police checkpoint ahead: ', ' km/s altına yavaşla': ' km/h or below, slow down',
  'Çevirmede limit aşıldı (': 'Checkpoint limit exceeded (', ' km/s): ': ' km/h): ', 'Kırmızıda geçtin: ': 'You ran a red light: ', 'Bariyere çarptın': 'You hit the barrier', 'Dubaları devirdin': 'You knocked over the cones', ' TL ceza': ' TL fine', 'Kontrol tamam, kask yerinde': 'Checkpoint cleared, helmet on',
  'Köpek peşinde!': 'A dog is chasing you!', 'Ters yönden gelen kuryeye çarptın': 'You hit a wrong-way courier', 'Ters yön kuryesini devirdin!': 'Wrong-way courier knocked down!', 'Cezalar': 'Fines',
  'SABAH': 'MORNING', 'ÖĞLEN': 'NOON', 'AKŞAM': 'EVENING', 'GECE': 'NIGHT',
  // results
  'GARAJA GİT': 'GO TO GARAGE', 'YENİ VARDİYA': 'NEW SHIFT', 'MENÜ': 'MENU', 'DEVAM': 'CONTINUE', 'TEKRAR DENE': 'TRY AGAIN',
  'Teslimat': 'Deliveries', 'Yol': 'Distance', 'Kazanılan': 'Earned', 'Yere serilen kurye': 'Couriers knocked down', 'Yenen ceza': 'Fines paid',
  'Tamamlanan vardiya': 'Shifts completed', 'Sürüş süresi': 'Riding time', ' sa ': ' h ', ' dk': ' min', 'SON': 'THE END', 'KURYE 34 · SON': 'KURYE 34 · THE END',
  'DOSYA KAPANDI': 'CASE CLOSED', 'SERBEST SÜRÜŞ': 'FREE RIDE',
  'Usta dükkânın kepengini yarıya kadar indirdi, iki çay koydu. “Kaskını bırakmıyorsun, değil mi?” dedi.\n\nBırakmıyorsun. Şehir hâlâ aç, siparişler hâlâ geliyor. Artık kimseden kaçmıyorsun.\n\nOyunu bitirdin. Serbest sürüşte istediğin kadar vardiya alabilirsin; tüm ücretler +%10.': 'Usta pulled the shutter halfway down and poured two teas. “You’re not hanging up the helmet, are you?” he said.\n\nYou’re not. The city is still hungry, the orders keep coming. You’re not running from anyone anymore.\n\nYou finished the game. In free ride you can take as many shifts as you like; all pay +10%.',
  'Dosya kapandı. Serbest sürüş: istediğin kadar vardiya, tüm ücretler +%10.': 'Case closed. Free ride: as many shifts as you like, all pay +10%.',
  'KARTINI SEÇ': 'PICK YOUR CARD', 'Seçtiğin kart bu vardiyanın beş teslimatı boyunca geçerli.': 'The card you pick lasts all five deliveries of this shift.',
  'KART': 'CARD', 'DEVAM ET': 'CONTINUE', 'Devam et ya da kasayı al. Düşersen vardiya kasası gider.': 'Ride on or bank the pot. If you fail, the shift pot is lost.',
  'Termos Çanta': 'Thermal Bag', 'Paket hasarı %25 az.': 'Package damage 25% lower.', 'Kısa Yol': 'Shortcut', 'Her teslimata +8 sn.': '+8 s on every delivery.',
  'Bonkör Müşteri': 'Generous Customer', 'Taşıma ücreti +%25.': 'Delivery fee +25%.', 'Karbüratör Ayarı': 'Carb Tune', 'Maks. hız +%8.': 'Top speed +8%.',
  'Ağır El': 'Heavy Hand', 'Vuruş menzili +%30, rakip bonusu iki katı.': 'Hit range +30%, rival bonus doubled.',
  'Kargo Sigortası': 'Cargo Insurance', 'Paket bir kez dağılmaktan kurtulur, %30 ile devam edersin.': 'The package survives falling apart once; you carry on at 30%.',
  'BÖLGELER': 'DISTRICTS', 'Serbest sürüş · ': 'Free ride · ', ' vardiya.': ' shifts.', ' artık senin!': ' is yours now!', ' Sıradaki bölge: ': ' Next district: ',
  ' Bütün İstanbul senin. Kara seni bekliyor.': ' All of Istanbul is yours. Kara is waiting.', ' · ÜCRETLER +%10': ' · PAY +10%',
  'Vardiyayı erken kapattın. Para güvende; ama bölge ilerlemesi, ipucu ve vardiya bonusu için beş teslimatı da bitirmen gerekir.': 'You closed the shift early. The money is safe, but district progress, clues and the shift bonus need all five deliveries.',
  '\n\nŞişli’yi al, sonra Kara ile hesaplaş.': '\n\nTake Şişli, then settle it with Kara.',
  'Usta bir adres uzattı: “Kara Şişli’de çalışıyor. Şişli’yi al, son teslimatına yetiş, yüzleş. Dikkat et: sol tarafını göremez.”': 'Usta handed over an address: “Kara works Şişli. Take Şişli, catch his last delivery, face him. Careful: he can’t see his left side.”',
  '+%5 maks. hız, daha çabuk kalkış, daha iyi yol tutuş': '+5% top speed, quicker launch, better grip',
  'FPS göstergesi (performans kontrolü)': 'FPS counter (performance check)',
  'İLERLEMEYİ SIFIRLA': 'RESET PROGRESS', 'EMİN MİSİN? TÜM İLERLEME SİLİNECEK, TEKRAR BAS': 'SURE? ALL PROGRESS WILL BE LOST, TAP AGAIN',
  'Sıradaki ipucu: ': 'Next clue: ', ' tam vardiya sonra.': ' full shifts from now.', '\n\nTamamlanan vardiya: ': '\n\nShifts completed: ',
  '. Sadece beş teslimatın hepsi bitirilen vardiyalar sayılır; kasayı erken almak ya da kaybetmek ilerletmez.': '. Only shifts with all five deliveries count; banking early or failing does not move you forward.',
  'GÖRÜNÜM': 'LOOKS', 'Motor boyası': 'Bike paint', 'Kask': 'Helmet', ' alındı': ' bought', 'Fabrika': 'Factory', 'Lacivert': 'Navy',
  'Mat siyah': 'Matte black', 'Altın': 'Gold', 'Beyaz': 'White', 'Sarı': 'Yellow', 'Mavi': 'Blue', 'Pembe': 'Pink', 'Krom': 'Chrome',
  'Seviye başına +%3 maks. hız, daha çabuk kalkış, daha iyi yol tutuş': '+3% top speed per level, quicker launch, better grip', 'Seviye başına paket hasarı %7 az': 'Package damage 7% lower per level',
  'Seviye başına teslimatta 1 nitro hakkı: 2,5 sn +%25 hız': 'One nitro per delivery per level: 2.5 s at +25% speed',
  'ücretin %30’u': '30% of the fee', 'ücretin %50’si, −1 yıldız': '50% of the fee, −1 star', 'ücretin %60’ı': '60% of the fee', 'Bölge': 'District',
  'VARDİYAYI BIRAK · KASA GİDER (': 'QUIT SHIFT · POT IS LOST (', 'EMİN MİSİN? ': 'SURE? ', ' GİDECEK, TEKRAR BAS': ' WILL BE LOST, TAP AGAIN', 'Kara öfkelendi!': 'Kara is furious!',
  'Vardiyayı erken kapattın, para güvende. Vardiya bonusu ve yüksek seri ücretleri beş teslimatı da bitirenlere.': 'You closed the shift early, the money is safe. The shift bonus and the higher streak fees go to those who finish all five.',
  ' teslimat sonra, bölgeyi alınca.': ' deliveries from now, when the district is taken.', ' teslimat': ' deliveries', ' · Kara seni bekliyor': ' · Kara is waiting',
  '\n\nHer başarılı teslimat bölgeyi ilerletir. Kasayı kaybetmek ya da erken almak ilerlemeyi geri almaz.': '\n\nEvery successful delivery moves the district forward. Losing the pot or banking early never takes progress back.',
  'VARDİYA · ': 'SHIFT · ', 'VARDİYA · KASA': 'SHIFT · POT', 'VARDİYA · TESLİMAT ': 'SHIFT · DELIVERY ',
  'CEZALAR': 'FINES', 'Kırmızıda geçmek': 'Running a red light', 'Yayaya çarpmak': 'Hitting a pedestrian', '−1 yıldız': '−1 star',
  'Çevirmede 55 km/s üstü': 'Over 55 km/h at a checkpoint', 'Ambulansa yol vermemek': 'Not giving way to an ambulance', 'paket hasarı': 'package damage',
  'LİMİT 55': 'LIMIT 55',
  'Müşteri puanı': 'Customer rating', 'Taşıma ücreti': 'Delivery fee', 'Bahşiş': 'Tip', 'Rakip bonusu': 'Rival bonus', 'BU TESLİMAT': 'THIS DELIVERY',
  'TESLİM EDİLDİ': 'DELIVERED', 'Vardiya bonusu': 'Shift bonus', 'VARDİYA TOPLAMI': 'SHIFT TOTAL', 'VARDİYA TAMAM': 'SHIFT COMPLETE',
  '. Üç teslimat da yerine ulaştı.': '. All three deliveries made it.', ' Yeni bölge açıldı: ': ' New district unlocked: ',
  'VARDİYA BİTTİ': 'SHIFT OVER', 'Süre doldu, sipariş iptal. ': 'Out of time, order cancelled. ', 'Paket dağıldı. ': 'The package is wrecked. ', 'Süre doldu. ': 'Out of time. ',
  '. Bu vardiyada kazandığın para kasada.': '. You keep what you earned this shift.',
  'Kalan mesafe': 'Distance left', 'Kalan süre': 'Time left', 'Paket durumu': 'Package condition', 'Vardiya kazancı': 'Shift earnings',
  // customer comments
  'Yemek sıcacık, kutu jilet gibi. Eline sağlık!': 'Piping hot and the box is spotless. Well done!',
  'Bu hızla nasıl geldin? Sağ ol usta.': 'How did you get here that fast? Cheers, mate.',
  'Tam vaktinde, tertemiz. Beş yıldız.': 'Right on time, immaculate. Five stars.',
  'Biraz sallanmış ama sorun yok, teşekkürler.': 'A bit shaken up, but no harm done. Thanks.',
  'Zamanında geldi, sağ ol.': 'On time. Thanks.',
  'Gayet iyi, bir dahakine de sen gel.': 'Nice work. Hope it’s you again next time.',
  'Geldi işte. Ayran devrilmiş ama neyse.': 'Well, it arrived. The ayran tipped over, but never mind.',
  'Biraz geç kaldın ama idare eder.': 'You’re a little late, but it’ll do.',
  'Kutunun köşesi ezik, yine de teşekkürler.': 'The box is dented at the corner. Thanks anyway.',
  'Çorba poşete dökülmüş, sıcak da değil.': 'The soup has spilled into the bag, and it isn’t even warm.',
  'Neredeyse iptal ediyordum, bu kadar geç olmaz.': 'I nearly cancelled. This is far too late.',
  'Paketin hali içler acısı.': 'The state of this package is a disgrace.',
  'Bunu kabul etmek zorunda mıyım?': 'Do I really have to accept this?',
  'Uygulamaya şikâyet yazıyorum.': 'I’m filing a complaint in the app.',
  'Bir daha bu kuryeyi istemiyorum.': 'I never want this courier again.',
  'Bu yağmurda geldin ya, helal olsun.': 'You came through this rain. Respect.',
  'Sırılsıklam olmuşsun, al şu bahşişi.': 'You’re soaked through. Here, take a tip.',
  'Sipariş iptal. Yarım saattir bekliyorum.': 'Order cancelled. I’ve been waiting half an hour.',
  'Geç kaldın, başka yerden söyledim.': 'Too late. I ordered from somewhere else.',
  'Paket parçalanmış, iade istiyorum.': 'The package is in pieces. I want a refund.',
  'Bu ne hal? Teslim almıyorum.': 'What is this? I’m not accepting it.',
  // tutorial
  'İLK GÜN': 'FIRST DAY', 'İLK TESLİMAT': 'FIRST DELIVERY',
  'Solda sürükle, sağa sola kay.': 'Drag on the left to move side to side.', 'Gaz otomatik. ← → ile sağa sola kay.': 'Throttle is automatic. Use ← → to move side to side.',
  'FREN’e basılı tut, yavaşla.': 'Hold BRAKE to slow down.', '↓ tuşunu basılı tut, yavaşla.': 'Hold ↓ to slow down.',
  'Öndeki arabayı sollayıp geç.': 'Overtake the car ahead.', 'Çukur ve yağa dikkat, paket ezilir.': 'Mind potholes and oil: they crush the package.',
  'Aynada rakip! Yanına gelince VUR.': 'Rival in the mirror! HIT when he’s beside you.', 'Aynaya bak: rakip geliyor. Yanına gelince Boşluk ile vur!': 'Check the mirror: a rival is coming. Press Space when he’s beside you!',
  'Bir NİTRO verdim. Düz yolda bas.': 'Here’s one NITRO. Use it on a straight.', 'Bir NİTRO verdim. Düz yolda N’ye bas.': 'Here’s one NITRO. Press N on a straight.',
  'Bugün süre yok. Adrese git.': 'No timer today. Get to the address.',
  'İyi iş.': 'Good work.', 'Fena değil.': 'Not bad.', 'Paketi hırpaladın ama ilk gün sayılır.': 'You roughed up the package, but it’s your first day.',
  ' Müşteriler seni 1-5 yıldızla puanlar; yıldız yükseldikçe bahşiş büyür. Gerçek vardiyada süre işler.”': ' Customers rate you from 1 to 5 stars; more stars mean a bigger tip. On a real shift the clock is running.”',
  // story
  'Kadıköy, gece yarısına doğru. Yaya geçidinde yeşil yanıyordu.': 'Kadıköy, close to midnight. The crossing light was green.',
  'Bir motor sesi. Fren yok. Sonra hiçbir şey.': 'The sound of an engine. No brakes. Then nothing.',
  'Hastane. “Adınız? Sizi kimi arayalım?” Hiçbirini bilmiyorsun. Ne adını, ne evini.': 'A hospital. “Your name? Who should we call?” You know none of it. Not your name, not your home.',
  'Cebinden çıkan tek şey yırtık bir teslimat fişi. Üstünde okunabilen tek şey bir sayı: <b>34</b>.': 'All they found in your pocket was a torn delivery slip. The only thing you can read on it is a number: <b>34</b>.',
  'Taburcu olduğun gün kapıda biri bekliyor. “Ben Usta. Seni hastaneye getiren benim. Adın yoksa sana <b>Kurye 34</b> deriz. Motor sürebilir misin?”': 'The day you are discharged, someone is waiting at the door. “They call me Usta. I’m the one who brought you in. If you have no name, we’ll call you <b>Courier 34</b>. Can you ride?”',
  'Çarpan kurye durmadı. Plakayı gören olmadı. Ama bu şehirde her kurye eninde sonunda aynı sokaklardan geçer.': 'The courier who hit you never stopped. Nobody saw the plate. But in this city every courier rides the same streets sooner or later.',
  'KİM ÇARPTI?': 'WHO HIT ME?', 'KURYE 34 · İLK GÜN': 'COURIER 34 · FIRST DAY', 'BAŞLA': 'START', 'İLK GÜNE BAŞLA': 'START YOUR FIRST DAY', 'MENÜYE DÖN': 'BACK TO MENU',
  // case file
  'İPUCU': 'CLUE', 'Menüde HESAPLAŞMA açıldı.': 'SHOWDOWN is now open in the menu.',
  'Henüz ipucu yok. Bölgeleri aldıkça o gece hakkında bir şeyler öğreneceksin.': 'No clues yet. Take districts and you will learn more about that night.',
  'Dosya kapandı. Bölge senin: tüm ücretler +%10.': 'Case closed. The district is yours: all pay +10%.',
  'KIRIK AYNA': 'BROKEN MIRROR', 'IŞIKLARI KAPALI': 'LIGHTS OFF', '34 NUMARA': 'NUMBER 34', 'BÖLGE': 'TERRITORY', 'SON TESLİMAT': 'LAST DELIVERY',
  'Usta: “Seni yerden kaldırdığım gece asfaltta kırık bir ayna buldum. Sol ayna, siyah.” Sana çarpan motorun sol aynası yok.': 'Usta: “The night I picked you up off the road, I found a broken mirror on the tarmac. Left side, black.” The bike that hit you is missing its left mirror.',
  'Köşedeki çaycı o geceyi hatırlıyor: “Siyah kasklı biri ışıkları kapalı geçti. Kutusu da simsiyahtı, üstünde tek harf yoktu.”': 'The tea seller on the corner remembers that night: “Someone in a black helmet went by with his lights off. His box was pitch black too, not a letter on it.”',
  'Bir müşteri cebindeki fişe baktı: “Bu sipariş numarası değil, kurye numarası. Eskiden bu mahallede 34 numaralı bir kurye vardı. Bir gece ortadan kayboldu.” O kurye sendin.': 'A customer looked at the slip from your pocket: “That’s not an order number, it’s a courier number. There used to be a courier number 34 around here. One night he vanished.” That courier was you.',
  'Yere serdiğin rakiplerden biri konuştu: “Kara’yı mı arıyorsun? Senin eski bölgeni o aldı. Sen kaybolunca en çok o kazandı.”': 'One of the rivals you floored talked: “Looking for Kara? He took your old territory. Nobody gained more from you vanishing than he did.”',
  'Usta bir adres uzattı: “Kara bu gece son teslimatını yapıyor. Yetişirsen yüzleşirsin. Dikkat et: sol tarafını göremez.”': 'Usta handed you an address: “Kara makes his last delivery tonight. Catch him and you can face him. Remember: he can’t see his left side.”',
  // showdown
  'Kara’yı yere ser': 'take Kara down', 'KARA YERDE!': 'KARA IS DOWN!', 'SON': 'THE END', 'HESAP KAPANDI': 'SCORE SETTLED', 'KARA KAÇTI': 'KARA GOT AWAY',
  'Kara’nın kaskı asfaltta yuvarlandı. “Seni bölgeden atmak istedim, öldürmek değil” dedi. “Fren tutmadı.”': 'Kara’s helmet rolled across the tarmac. “I wanted you off the territory, not dead,” he said. “The brakes failed.”',
  'Adını hâlâ hatırlamıyorsun. Ama numaran var, bölgen var, bir de Usta’nın dükkânı. Şimdilik yeter.': 'You still don’t remember your name. But you have a number, a territory, and Usta’s shop. For now, that’s enough.',
  'Usta’dan prim': 'Bonus from Usta', 'Bölge senin': 'The district is yours', 'tüm ücretler +%10': 'all pay +10%',
  'Kara seni yere serdi ve gözden kayboldu. Sopa, zincir ya da levye onu daha çabuk düşürür; Çanta parçası da seni ayakta tutar.': 'Kara floored you and disappeared. A bat, chain or crowbar brings him down sooner; the Bag part keeps you standing.',
  'Süre doldu, Kara trafiğe karıştı. Onu arabalara ya da duvara doğru itmeyi dene: her kazada ağır hasar alır.': 'Time ran out and Kara melted into traffic. Try shoving him into cars or the wall: every wreck hurts him badly.',
  // daily order
  '. Bugünkü çift ödemeyi zaten aldın; rekor için tekrar deneyebilirsin.': '. You already collected today’s double pay; you can try again for a better time.',
  'Teslimat': 'Delivery', 'Günün ilk teslimi': 'First delivery of the day', 'TOPLAM': 'TOTAL', 'Kalan süre (bugünkü rekor)': 'Time left (today’s best)', 'OLMADI': 'FAILED',
  // settings and pause
  'Dil / Language': 'Dil / Language', 'Joystick hassasiyeti': 'Joystick sensitivity', 'Solak mod (joystick sağda, butonlar solda)': 'Left-handed mode (joystick right, buttons left)',
  'Müzik': 'Music', 'Efektler ve motor': 'Effects and engine', 'Ortam (şehir, yağmur, martı)': 'Ambience (city, rain, gulls)', 'TAMAM': 'DONE',
  'MOLA': 'BREAK', 'DURAKLATILDI': 'PAUSED', 'SES AYARLARI': 'SETTINGS',
};

let rx = null; const cache = new Map();
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function build() {
  const keys = Object.keys(EN).sort((a, b) => b.length - a.length);
  // a bare word must not match inside a longer word (KART in KARTLARIN, SON in SONRA)
  rx = new RegExp(keys.map(k => /^[\p{L}]+$/u.test(k) ? '(?<![\\p{L}])' + esc(k) + '(?![\\p{L}])' : esc(k)).join('|'), 'gu');
}
export function toEN(s) {
  if (!s || !/[\p{L}]/u.test(s)) return s;
  let out = cache.get(s);
  if (out !== undefined) return out;
  if (!rx) build();
  out = s;
  for (const [r, f] of RX) out = out.replace(r, f);
  out = out.replace(rx, m => EN[m]);
  out = out.replace(/%(\d+)/g, '$1%').replace(/(\d),(\d)(?!\d)/g, '$1.$2');   // %30 -> 30%, 2,5 -> 2.5
  if (cache.size > 3000) cache.clear();
  cache.set(s, out);
  return out;
}
export const isEN = () => G.S && G.S.lang === 'en';
// for text that never reaches the DOM as a text node (canvas, innerHTML)
export const L = s => isEN() ? toEN(s) : s;

const done = new WeakMap();
function node(n) {
  const v = n.nodeValue;
  if (done.get(n) === v) return;
  const p = n.parentElement;
  if (!p || p.closest('[data-noi18n],script,style')) return;
  const t = toEN(v);
  done.set(n, t);
  if (t !== v) n.nodeValue = t;
}
function walk(root) {
  if (root.nodeType === 3) return node(root);
  if (root.nodeType !== 1) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) node(n);
}
export function initI18n() {
  if (!isEN()) return;
  document.documentElement.lang = 'en';
  walk(document.body);
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') node(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
