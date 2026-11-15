# Kurye 34 Wiki

Oyundaki her sistemin referansı. Değerler koddan alınmıştır (`js/config.js`, `js/game.js`, `js/street.js`, `js/traffic.js`, `js/rating.js`, `js/meta.js`). Kod değişince bu sayfa da güncellenmelidir.

Birimler: hız `km/s` olarak ekranda görünür, tam hız (`maxSpeed`) 130 km/s sayılır. Yol uzunluğu `segment` ile ölçülür, 1 segment = 2 m.

## İçindekiler

1. [Oyun akışı](#1-oyun-akışı)
2. [Vardiya, teslimat ve ekonomi](#2-vardiya-teslimat-ve-ekonomi)
3. [Motorlar](#3-motorlar)
4. [Parçalar (yükseltmeler)](#4-parçalar-yükseltmeler)
5. [Silahlar](#5-silahlar)
6. [Kartlar](#6-kartlar)
7. [Bölgeler (biyomlar)](#7-bölgeler-biyomlar)
8. [Mahalleler ve trafik karışımı](#8-mahalleler-ve-trafik-karışımı)
9. [Vardiya saatleri ve olaylar](#9-vardiya-saatleri-ve-olaylar)
10. [Trafik araçları](#10-trafik-araçları)
11. [Yol tehlikeleri](#11-yol-tehlikeleri)
12. [Sokak hayatı: ışık, yaya, çevirme, köpek, ters kurye](#12-sokak-hayatı)
13. [Cezalar ve hasar tablosu](#13-cezalar-ve-hasar-tablosu)
14. [Ambulans ve yol verme](#14-ambulans-ve-yol-verme)
15. [Rakip kuryeler](#15-rakip-kuryeler)
16. [Müşteri puanı ve bahşiş](#16-müşteri-puanı-ve-bahşiş)
17. [Hikâye: dosya, ipuçları, Kara](#17-hikâye-dosya-ipuçları-kara)
18. [Nitro](#18-nitro)
19. [Kontroller](#19-kontroller)
20. [Test araçları](#20-test-araçları)

---

## 1. Oyun akışı

1. Menüden vardiya başlatılır. Her vardiya **5 teslimattır** (`NDEL`). Vardiya başında 6 karttan rastgele 3'ü sunulur, birini seçersin; kart bütün vardiya boyunca geçerlidir.
2. Her teslimatta 3 sipariş sunulur (YAKIN, NORMAL, UZAK). Biri kabul edilir.
3. Restorandan paketi alıp müşteriye süre dolmadan ve paket dağılmadan götürürsün.
4. Teslimat bitince kazanç **vardiya kasasına** (pot) girer. Para ana kasaya iki durumda geçer: kasayı alırsan (vardiya yarıda biter) ya da beş teslimatı bitirirsen.
5. Her teslimattan sonra ya **DEVAM ET** (sıradaki teslimat daha çok öder) ya da **KASAYI AL VE BİTİR**.
6. **Bir teslimat başarısız olursa** (süre dolar ya da paket dağılır) vardiya biter ve kasaya girmemiş kazanç gider. Ana kasa etkilenmez.
7. **İlerleme başarılı teslimat sayısıyla** olur: her başarılı teslimat bölgeyi ilerletir (bölge başına 12). Kasayı kaybetmek ya da erken almak ilerlemeyi geri almaz; kasa sadece bir para kumarıdır. Beş teslimatın hepsini bitirmek ayrıca vardiya bonusu verir.

## 2. Vardiya, teslimat ve ekonomi

### Sipariş türleri

| Tür | Uzunluk çarpanı | Ücret çarpanı |
|---|---|---|
| YAKIN | 0,75 | 0,75 |
| NORMAL | 1 | 1 |
| UZAK | 1,35 | 1,5 |

`seviye = min(12, başarılı teslimat / 6)` ve `d = seviye × 3 + vardiyadaki teslimat sırası` (0'dan başlar). Ücret, rota uzunluğu, trafik ve rakip sayısı `d` ile büyür; bütün bölgeler alınınca seviye 12'de kalır.

- **Uzunluk:** `min(2400, min(1780, 600 + d × 90) × tür)` segment (0,9 km ile 4,8 km arası). Taban 1.780'de durduğu için üç tür her seviyede birbirinden ayrı kalır (en fazla 1.335 / 1.780 / 2.400).
- **Taşıma ücreti:** `(40 + d × 15) × tür × olay × Bonkör Müşteri kartı × seri çarpanı × (Kara yenildiyse 1,1)`. Olay varsa ×1,2.
- **Süre:** bölgenin **referans motoruna** göre hesaplanır, senin motoruna göre değil: `uzunluk / (60 × referans × 0,5) + 10` saniye (Karaköy ×1,12, Fatih ×1,08). Referans hızlar: Kadıköy 62, Üsküdar 70, Karaköy 81, Beşiktaş 91, Fatih 101, Şişli 111 km/s. Motorun referanstan yavaşsa süre kendi motoruna göre bir tabana çekilir (`uzunluk / (60 × kendi hızın × 0,62) + 8`): teslimat her zaman mümkündür ama dardır. **Daha hızlı motor, Motor parçası ve Karbüratör kartı doğrudan boş süre demektir.**
- **Süre bonusu:** `ücret × kalan süre oranı × 0,5`. Sürenin yarısı kalmışsa ücretin dörtte biri kadar bonus.
- **Paket hasarı ücreti düşürür:** ücret × paket durumu yüzdesi.

### Seri çarpanı (vardiya içinde)

| Teslimat | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Ücret çarpanı | ×1 | ×1,15 | ×1,3 | ×1,5 | ×1,75 |

### Vardiya sonu

- Beş teslimat tamamlanınca: kasa + **vardiya bonusu** (`50 + seviye × 25` TL).
- Kasayı almak (KASAYI AL VE BİTİR) o ana kadarki kazancı bankaya geçirir; vardiya bonusu verilmez, bölge ilerlemesi kalır. Aynı buton teslimatlar arasında sipariş ekranında da vardır.
- Sürüş sırasında duraklatıp vardiyayı bırakmak kasayı siler; buton tutarı gösterir ve ikinci dokunuşu ister.

### Gizli çarpan yok

Müşteri puanı ve vardiya saati ücreti etkilemez. Yıldızlar sadece bahşişi belirler. Tek kalıcı ücret artışı Kara'yı yenince gelen +%10'dur.

## 3. Motorlar

Üst hız `top`, tam hızın oranıdır. Ekranda km/s = `top × 130`. Parçalar ve kartlarla üst hız `1,3`'e (169 km/s) kadar çıkabilir.

| Motor | Fiyat | Üst hız | Hızlanma (`acc`, düşük = hızlı) | Yol tutuş | Direksiyon | Dayanıklılık (hasar çarpanı) |
|---|---|---|---|---|---|---|
| Mobilet 50 | 0 | 0,48 (62 km/s) | 5,5 | 0,80 | 0,85 | 1,10 |
| Scooter 125 | 1.200 | 0,60 (78 km/s) | 4,8 | 1,00 | 1,00 | 1,00 |
| Kurye 150 | 3.000 | 0,72 (94 km/s) | 4,2 | 1,05 | 1,05 | 0,90 |
| Naked 250 | 6.500 | 0,85 (110 km/s) | 3,6 | 1,15 | 1,20 | 1,00 |
| Sport 600 | 12.000 | 1,00 (130 km/s) | 3,0 | 1,25 | 1,25 | 1,05 |

Notlar:
- Parçalar (motor, çanta, nitro) motora değil **sürücüye** aittir; motor değiştirince kaybolmaz.
- Sport 600, Motor 5. seviyede 150 km/s yapar; nitro ve Karbüratör kartı onu 169 km/s sınırına kadar taşır.
- Virajda savrulma hızın karesiyle büyür: hızlı motorda keskin virajlara girerken fren gerekir. Yol tutuş ve direksiyon motor büyüdükçe iyileşir.
- Hasar çarpanı yüksekse paket daha çok yıpranır.
- Motorların görünümü yalnızca genel tiplere benzer; gerçek marka ya da model adı kullanılmaz.

## 4. Parçalar (yükseltmeler)

Üç parça vardır: Motor, Çanta, Nitro. Her biri **5 seviyeye** kadar gelişir. Seviye bedelleri: 300, 700, 1.500, 3.000, 5.000 TL (bir parçanın tamamı 10.500 TL).

| Parça | Seviye başına etki | 5. seviyede toplam |
|---|---|---|
| Motor | +%3 maksimum hız, −%3,6 hızlanma süresi, virajda −%4,2 savrulma, direksiyon +%2,4 | +%15 hız, −%18 hızlanma süresi, −%21 savrulma, +%12 direksiyon |
| Çanta | Paket hasarı −%7,2 | −%36 |
| Nitro | Teslimat başına +1 nitro hakkı | 5 nitro |

Geçmiş: 0.36'da Lastik ve Mont kaldırıldı (etkileri Motor'a geçti, harcanan para iade edildi). 0.39'da parçalar 3'ten 5 seviyeye çıktı; eski kayıtlarda 1/2/3 seviyeler 2/3/5 olur, toplam güç aynı kalır.

## Görünüm (kozmetik)

Garajın GÖRÜNÜM bölümünde motor boyası ve kask rengi alınır. Oynanışa etkisi yoktur. Alınan renk kalıcıdır; bir kere alınan renge dokununca giyilir. Boya, arkadan görünen kaportada ve çantanın alt şeridinde görünür.

| Motor boyası | Fiyat | Kask | Fiyat |
|---|---|---|---|
| Fabrika | 0 | Fabrika | 0 |
| Kırmızı | 600 | Beyaz | 400 |
| Lacivert | 600 | Sarı | 500 |
| Yeşil | 800 | Kırmızı | 500 |
| Turuncu | 800 | Mavi | 700 |
| Mat siyah | 1.200 | Pembe | 900 |
| Altın | 2.500 | Krom | 2.000 |

## 5. Silahlar

Rakip kuryelere ve ters yönden gelenlere vurmak için kullanılır. Menzil `lmax` yanal mesafedir.

| Silah | Fiyat | Güç | Yanal menzil | Not |
|---|---|---|---|---|
| Tekme | 0 | 1 | 0,36 | Bedava, kısa menzil |
| Beyzbol Sopası | 600 | 2 | 0,42 | İki kat güçlü, orta menzil |
| Zincir | 1.500 | 1,5 | 0,50 | En uzun menzil |
| Levye | 3.000 | 3 | 0,42 | Her kuryeyi tek vuruşta yere serer |

Ağır El kartı vuruş menzilini %30 artırır.

## 6. Kartlar

Vardiya başında 6 karttan rastgele 3'ü sunulur, birini seçersin. Kart vardiyanın beş teslimatı boyunca geçerlidir, vardiya bitince sıfırlanır. Açılım, lanet ya da katlanma yoktur.

| Kart | Etki |
|---|---|
| Termos Çanta | Paket hasarı %25 az |
| Kısa Yol | Her teslimata +8 sn (daha çok süre bonusu ve yıldız payı) |
| Bonkör Müşteri | Taşıma ücreti +%25 |
| Karbüratör Ayarı | Maksimum hız +%8; süre limiti kısalmaz, yani doğrudan boş süre |
| Ağır El | Vuruş menzili +%30, rakip bonusu iki katı |
| Kargo Sigortası | Paket bir kez dağılmaktan kurtulur, %30 ile devam edersin |

## 7. Bölgeler (biyomlar)

**Bölge fethi:** bölgeler sırayla alınır: Kadıköy, Üsküdar, Karaköy, Beşiktaş, Fatih, Şişli. Bir bölgede **12 başarılı teslimat** yapınca bölge senin olur ve sıradaki açılır (vardiyanın ortasında bile; sonraki teslimat yeni bölgede geçer). Menüde "SIRADAKİ: Üsküdar · 3/12 teslimat" ve "BÖLGELER: 1/6" görünür; her teslimat sonucunda "Bölge" satırı ilerlemeyi gösterir. Başarısız teslimat ve kaybedilen kasa ilerlemeyi geri almaz.

Kara yenildikten sonra (serbest sürüş) menüde bölge seçimi açılır; istediğin bölgede vardiya alırsın.

`curv` viraj, `hill` tepe sıklığı, `up` yokuş yukarı oranı, `traf` trafik çarpanı, `pot` çukur/tehlike yoğunluğu, `bus` otobüs çarpanı, `sea` sahil kenarı.

| Bölge | Işık/tema | Karakter | Viraj | Tepe | Trafik | Çukur | Otobüs | Yol genişliği | Süre çarpanı |
|---|---|---|---|---|---|---|---|---|---|
| Kadıköy | Gün batımı | Çarşı sokakları | 1,0 | 0,8 | 1,0 | 1,0 | 1,0 | 2000 | 1,00 |
| Üsküdar | Sabah | Sahil yolu, vapurlar | 1,2 | 1,0 | 0,9 | 1,0 | 1,0 | 2000 | 1,00 |
| Karaköy | Gece | Dik yokuşlar, 2 park şeridi | 0,9 | 1,8 | 1,1 | 1,2 | 0,8 | 2000 | 1,12 |
| Beşiktaş | Öğlen | Sahil yolu, bol otobüs | 1,4 | 1,0 | 1,0 | 1,0 | 1,6 | 2000 | 1,00 |
| Fatih | Altın saat | Arnavut kaldırımı, bol çukur, 3 park şeridi, yol çalışması yok | 1,5 | 1,4 | 0,9 | 2,2 | 0,7 | 1700 (dar) | 1,08 |
| Şişli | Neon | Plazalar, yoğun trafik | 1,7 | 1,2 | 1,4 | 1,0 | 2,5 | 2400 (geniş) | 1,00 |

Mahalle havuzları (bir teslimatın başlangıç ve bitiş noktası bölge havuzundan seçilir):

- **Kadıköy:** Moda, Yeldeğirmeni, Fenerbahçe, Caferağa, Rasimpaşa, Osmanağa, Koşuyolu, Acıbadem, Göztepe, Kozyatağı
- **Üsküdar:** Kuzguncuk, Çengelköy, Salacak, Altunizade, Beylerbeyi, Bağlarbaşı, Doğancılar, Valide-i Atik, İcadiye, Kandilli
- **Karaköy:** Galata, Cihangir, Tarlabaşı, Kasımpaşa, Tophane, Şişhane, Asmalımescit, Çukurcuma, Firuzağa, Hacıahmet
- **Beşiktaş:** Ortaköy, Bebek, Akaretler, Abbasağa, Arnavutköy, Etiler, Levent, Ulus, Kuruçeşme, Yıldız
- **Fatih:** Balat, Fener, Sultanahmet, Kumkapı, Aksaray, Vefa, Zeyrek, Çarşamba, Samatya, Cibali
- **Şişli:** Nişantaşı, Kurtuluş, Mecidiyeköy, Feriköy, Bomonti, Teşvikiye, Esentepe, Fulya, Osmanbey, Harbiye

## 8. Mahalleler ve trafik karışımı

Her mahallenin bir **stili**, **eğimi**, **deniz kenarı** bilgisi, **Arnavut kaldırımı** durumu ve **araç karışımı** vardır.

Stil (görünüm ve bahşiş): `apt` apartman, `plaza` plaza, `villa` villa, `wood` ahşap ev, `hist` tarihi doku.

Araç karışımı etiketleri (o mahallede hangi araç türü sık görülür):

| Etiket | Etki |
|---|---|
| t | Taksi ×2,2 |
| d | Dolmuş ×2,5 |
| l | Lüks ×4, eski araç ×0,4 |
| e | Eski araç ×2,5, lüks ×0,3 |
| b | Otobüs ×2 |
| h | Ticari ×2,5 |

Örnekler: Galata, Şişhane, Çukurcuma, Asmalımescit tarihi doku ve Arnavut kaldırımlı; Bebek, Ortaköy, Arnavutköy, Kuruçeşme sahil kenarı ve lüks ağırlıklı; Mecidiyeköy, Aksaray, Doğancılar dolmuş ve otobüs yoğun; Balat, Fener, Cibali ahşap ev ve Arnavut kaldırımı.

Bahşiş cömertliği (varış mahallesine göre): villa ×1,6, plaza ×1,3, ahşap ×1,1, diğer ×1. Mahallede lüks araç etiketi ×1,3, eski araç etiketi ×0,7 ekler.

## 9. Vardiya saatleri ve olaylar

### Vardiya saati (seviyeye göre döner)

| Saat | Trafik çarpanı | Işık |
|---|---|---|
| SABAH | ×1,15 | sabah |
| ÖĞLEN | ×1,0 | gündüz |
| AKŞAM | ×1,3 | gün batımı (Fatih'te altın saat) |
| GECE | ×0,7 | gece (Şişli'de neon) |

### Olaylar

Teslimata olay gelme olasılığı, vardiyadaki teslimat sırasına göre: 1. teslimat %0 (ilk 2 vardiyada) sonra %20, 2. %40, 3. %60, 4. %70, 5. %80.

| Olay | Etki |
|---|---|
| YAĞMUR | Yol kaygan: viraj savrulması ×1,35, yağ lekesinde kayma daha uzun, yağ lekesi sıklığı ×1,4. Yağmur sesi ve görüntüsü |
| YOĞUN TRAFİK | Araç sayısı ×1,5 |
| KALABALIK | Fazladan bir rakip kurye |

Olaylı siparişler %20 daha çok öder.

## 10. Trafik araçları

Araç sayısı: `min(17, round((10 + min(4, d/3)) × (1,05 − 0,25 × motor hızı) × bölge trafiği × saat trafiği × olay))`. Yani trafik ilerlemeyle yavaş artar ve hızlı motorlarda biraz azalır.

`Hız`: tam hızın oranı. `Şerit`: şerit değiştirme eğilimi (ani manevra yapan araçlar).

| Araç | Tür | Ağırlık | Hız aralığı | Şerit eğilimi | Çarpma mesajı |
|---|---|---|---|---|---|
| Sarı taksi | taksi | 0,22 | 0,38-0,58 | 0,7 | Taksiye çarptın |
| Turkuaz taksi | taksi | 0,05 | 0,32-0,48 | yok | Turkuaz taksiye çarptın |
| VIP taksi | taksi | 0,02 | 0,28-0,42 | yok | VIP taksiye çarptın |
| Araba | araba | 0,28 | 0,30-0,48 | yok | Arabaya çarptın |
| Lüks cip | lüks | 0,05 | 0,42-0,62 | 0,6 | Lüks cipe çarptın |
| Beyaz minivan | ticari | 0,10 | 0,30-0,45 | 0,4 | Beyaz minivana çarptın |
| Minibüs | ticari | 0,10 | 0,28-0,40 | yok | Minibüse çarptın |
| Eski sedan | eski | 0,08 | 0,38-0,58 | 0,5 | Eski sedana çarptın |
| Kamyonet | eski | 0,05 | 0,20-0,30 | 0,3 | Kamyonete çarptın |
| Dolmuş | dolmuş | 0,08 | 0,30-0,45 | 0,9 | Dolmuşa çarptın |
| Otobüs | otobüs | 0,08 | 0,22-0,32 | yok | Otobüse çarptın |

### Şerit değiştirme kuralları

- Araç şerit değiştirmeden önce **yaklaşık 1 saniye** sağa ya da sola **sinyal** verir (parlak turuncu lamba). Şerit değiştirmeye eğilimli araçlar 0,8 sn sinyal verir.
- Araç, sürücüye çok yakınsa (yaklaşık 1,5 saniyelik menzil içinde ya da hemen yanında) şerit değiştirmeyi **başlatmaz**; başlamışsa son anda vazgeçer.
- Önündeki araç yavaşsa ve yan şerit boşsa sollamak için de aynı sinyal kuralı geçerlidir.

### Otobüs ve dolmuş

- Otobüs durakları yol boyunca yaklaşık her 110-170 segmentte bir yer alır. Otobüs duraklara yanaşır, bekler ve sağ şeride geri döner.
- Dolmuşlar ara sıra yolda durur. Sağ şeride geçerken diğer araçlar gibi sinyal verir; yolcu için ancak sürücünün epey önünde (en az ~1,5 sn) ya da arkasındayken durur ve dururken sağ sinyali yanar.
- Otobüs durağa çekilirken sağ sinyal verir; şerit kesmesi gerekiyorsa ve sürücü yakınsa o durağı atlar.
- Kamyonetten düşen eşya da sürücünün en az ~1,5 sn önüne düşer.
- Ambulans geldiğinde duraktaki araçlar da yol verir (aşağıdaki bölüm).

## 11. Yol tehlikeleri

### Yüzey tehlikeleri

| Tehlike | Etki | Hasar |
|---|---|---|
| Tümsek | Hız ×0,85; kısa sıçrama. Hızlıysan (motorun %80'inden fazlası) pakete hasar | 5 (yavaşsan 0) |
| Çukur | Hız ×0,72 | 4 |
| Yola düşen eşya | Hız ×0,6 | 6 |
| Yağ lekesi | Kayma (0,9 sn, yağmurda 1,3 sn), rastgele yöne savrulma | 0 |

**Kasis uyarısı:** tabela, motorunun üst hızıyla yaklaşık 1,3 saniyelik mesafede durur (hızlı motorda daha erken) ve kasise kadar yola üç çift beyaz bant çizilir; bantları görünce fren, kasise %80'in altında girmek için yeter. Çukurun çevresinde açık renkli kırık asfalt halkası vardır, uzaktan seçilir.

Tehlike sıklığı bölgenin `pot` değeriyle artar (Fatih en yoğun). Teslimat ilerledikçe aralık biraz sıklaşır. Çukur ve yağ lekesi, tümsekten yaklaşık %35 daha seyrek çıkar (0.33'te azaltıldı).

### Yol çalışması ve park

- **Yol çalışması:** bir şerit 25-44 segment kapanır. Başta ve sonda bariyer (katı), arada koniler. Koniler çarpınca **dağılır** ve hızı ×0,9 yavaşlatır; durdurmaz. Bariyere çarparsan düşersin. (Fatih'te yol çalışması yok.)
- **Park halindeki arabalar:** sağ şeritte park sırası. Her araba ayrı çarpışma kutusuna sahiptir; aralardan geçilebilir. Çarpmak düşürür. Karaköy'de 2, Fatih'te 3 park şeridi vardır.
- **Kaldırım, duvar:** yoldan sağa ya da sola taşarsan duvara çarparsın.

## 12. Sokak hayatı

Sokak olayları rotanın tohumuna göre yerleşir ve **olay bütçesi** uygulanır: olaylar arasında en az yaklaşık 240-300 segment boşluk vardır, ters yönden gelen kurye ışık ya da çevirme yakınında çıkmaz.

### Trafik ışıkları ve yaya geçitleri

- Köprü tipi (yolun üstünden geçen, direği boydan boya yanan, uzaktan okunsun diye büyük lambalı ve parlak haleli) ışık. Döngü 13 sn: yeşil 6,8 sn, sarı 8 sn'ye kadar, kırmızı 13 sn'ye kadar.
- Rotada 1 ışık, rota 1.400 segmentten uzunsa 2 ışık bulunur.
- Kırmızıda araçlar durur, 2-4 yaya geçer. **Kırmızıda geçersen taban ücretin %30'u kadar ceza.**
- Yayaya çarparsan **taban ücretin %50'si kadar ceza, düşersin (18 hasar) ve o teslimatta −1 yıldız** alırsın.

### Polis çevirmesi

- 3. teslimat sayacından sonra (d ≥ 3) %30 ihtimalle bir çevirme çıkar. Yaklaşık 4 saniye önceden uyarı verir.
- Çevirmeden **55 km/s'den hızlı** geçersen **taban ücretin %60'ı kadar ceza**. Yavaş geçersen ceza yok. Konum ya da şerit fark etmez, çizgiyi geçerkenki hızına bakılır.
- Çevirmeye yaklaşınca uyarı metni limiti söyler, ekranın kenarı kırmızı-mavi yanıp söner (Reduce Motion açıksa sabit mor ton) ve alttaki hız göstergesi limit etiketiyle birlikte limitin üstündeyken kırmızı, altındayken yeşil olur.

### Sokak köpekleri

- Rotada %40 ihtimalle bir köpek bulunur. Köpek peşine takılır ve seni sendeletir (kısa kayma). Sadece rahatsız eder, hasar vermez.

### Ters yönden gelen kurye

- 5. teslimat sayacından sonra (d ≥ 4) 26-44 sn arayla görünür. Belirgin sarı mont ve kırmızı kaskla ayırt edilir, üstünde uyarı işareti vardır.
- **Vurabilirsin:** silahınla vurursan düşer ve `30 × (1 + d/12)` TL bonus (başta 30, sonda ~130; Ağır El kartıyla ×2) kazandırır.
- Çarparsan düşersin (14 hasar).

## 13. Cezalar ve hasar tablosu

### Paket hasarı (paket durumu %100'den başlar, 0 olursa teslimat başarısız olur)

Hasar = temel değer × motorun dayanıklılık çarpanı × çanta parçası × kartlar.

| Olay | Temel hasar | Ek etki |
|---|---|---|
| Araca yavaş sürtmek | 6 | Hız ×0,85 |
| Araca hızlı çarpmak (fark > üst hızın %45'i) | 14 | Düşme, hız ×0,3 |
| Duvar | 14 | Düşme |
| Katı yol kenarı nesnesi | 14 (el arabası 16) | Düşme |
| Park halindeki arabaya çarpmak | 14 | Düşme |
| Yol çalışması bariyeri | 14 | Düşme |
| Ters yönden gelen kurye | 14 | Düşme |
| Yaya | 18 | Düşme, 100 TL ceza, −1 yıldız |
| Tümsek (hızlıyken) | 5 | Hız ×0,85 |
| Çukur | 4 | Hız ×0,72 |
| Yola düşen eşya | 6 | Hız ×0,6 |
| Ambulansa yol vermemek | 8 | Bir kez |
| Rakip kurye çarpması | 6-12 (rakibe göre) | |

Her hasardan sonra 0,8 sn dokunulmazlık vardır (arka arkaya hasar yemezsin). Kargo Sigortası kartı paket sıfırlanınca bir kez %30 ile devam ettirir.

### Para cezaları

| Ceza | Tutar (taban ücretin yüzdesi) | Başta | Sonda |
|---|---|---|---|
| Kırmızı ışıkta geçmek | %30 | 10 TL | ~190 TL |
| Yayaya çarpmak | %50 | 20 TL | ~320 TL |
| Çevirmede 55 km/s üstü | %60 | ~50 TL (çevirme d ≥ 3'te başlar) | ~385 TL |

Taban ücret `40 + d × 15` TL'dir (tür, olay ve seri çarpanı hariç); ceza 5 TL'ye yuvarlanır, en az 10 TL. Böylece ceza oyunun başında da sonunda da aynı ağırlıkta hissedilir. Cezalar teslimat gelirinden düşer. Aynı liste oyun içinde duraklatma ekranında da yer alır.

## 14. Ambulans ve yol verme

- Teslimat başladıktan 15-35 sn sonra ilk ambulans, sonra 35-65 sn arayla yenisi gelir. Arkadan seni yakalar.
- **Acil koridoru:** orta şeritteki araçlar iki yana açılır, kenar şeritlerdekiler banka çekilir. Ambulans geçerken seni yakalayabilir.
- Ambulansın önünde, onu engelleyecek şekilde 1,3 sn'den uzun kalırsan **"Ambulansa yol vermedin"** hasarı (8) alırsın.
- Ambulans geçtikten sonra kimse onu geçmeye çalışmaz; trafik normale döner. Ambulans sürücüye çarparsan düşersin ("Ambulansa çarptın").
- Duraktaki otobüsler, durup bekleyen dolmuşlar ve yol çalışması önünde sıkışan araçlar da yol verir; kimse sıkışıp kalmaz.

## 15. Rakip kuryeler

Rakipler aynı yolda sürer, trafiğe ve yol çalışmasına bakarak şerit seçer, düşerse o teslimat boyunca saf dışı kalır. Onları **vurarak ya da araca/duvara doğru iterek** düşürürsen bonus alırsın: `(8 + HP × 5) × (1 + d/12)` TL; rakibi saf dışı bırakmak ya da araca/duvara çarptırmak ×2, Ağır El ×2. Bonus ücretlerle birlikte büyür: başta dövüş ek gelirdir, ana gelir değil.

Rakip sayısı: 2 (d ≥ 8 olunca 3), KALABALIK olayı +1; en fazla 4. Hepsi birlikte startın gerisinde, aralıklı ve sırayla sağ/sol tarafta başlar. Her rakibin kendi tarafı vardır ve diğer rakipleri görür: öndekine bindirmez, yanındakinden uzaklaşır, iki rakip üst üste binmez.

| Rakip | Etiket | Hız çarpanı | Saldırganlık | Hasar | Dayanıklılık (HP) | Şerit kesme | İtme gücü | Karakter |
|---|---|---|---|---|---|---|---|---|
| Kırmızı | ALEV | 1,05 | 2,2 | 12 | 2 | 0,2 | 0,30 | En saldırgan, sert vurur |
| Yeşil | ÇEVİK | 1,18 | 0,6 | 6 | 1 | 1,0 | 0,18 | En hızlı, sık şerit keser, zayıf |
| Turuncu | TOSUN | 0,98 | 1,3 | 9 | 3 | 0,3 | 0,22 | En yavaş ama en sağlam |
| Mor | GECE | 1,10 | 1,6 | 10 | 1,5 | 0,5 | 0,22 | Dengeli, sinsi |

Rakibin üst hızı: `min(0,98, motor hızın × 1,15 × hız çarpanı)`. Yani motorun hızlandıkça rakipler de seninle birlikte hızlanır.

## 16. Müşteri puanı ve bahşiş

Puan teslimat sonunda 1-5 yıldız olarak verilir.

`skor = 0,65 × paket durumu + 0,35 × min(1, kalan süre oranı / 0,25)`

| Skor | Yıldız |
|---|---|
| ≥ 0,90 | 5 |
| ≥ 0,75 | 4 |
| ≥ 0,55 | 3 |
| ≥ 0,35 | 2 |
| altı | 1 |

- Yayaya çarptıysan −1 yıldız.
- Paket sağlam ve sürenin en az dörtte biri kalmışsa 5 yıldız garantidir; temiz ve zamanında bir sürüş genellikle 4-5 yıldız alır.
- Sonuç ekranında **Paket durumu** ve **Kalan süre** satırları puanın nedenini gösterir.
- Başarısız teslimat her zaman 1 yıldız.

### Bahşiş

`bahşiş = ücret × oran × mahalle cömertliği`, 5 TL'ye yuvarlanır.

| Yıldız | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Oran | 0 | 0 | %4 | %10 | %20 |

## 17. Hikâye: dosya, ipuçları, Kara

Oyuncu, bir gece kendisini yerden kaldıran Usta'nın yanında kurye olarak çalışır; kendisine kimin çarptığını arar. Her **bölge fethinde** bir **ipucu** açılır (ilk beş bölge). Son bölge Şişli, Kara'nın bölgesidir.

| İpucu | Ne zaman |
|---|---|
| KIRIK AYNA | Kadıköy alınınca (12. teslimat) |
| IŞIKLARI KAPALI | Üsküdar (24) |
| 34 NUMARA | Karaköy (36) |
| BÖLGE | Beşiktaş (48) |
| SON TESLİMAT | Fatih (60) |

Dosya ekranı sıradaki ipucuna kaç teslimat kaldığını gösterir. İpucu, bölge alındığı teslimatın sonucunda (vardiya ortasında bile) verilir. Eski kayıtlarda tamamlanan her vardiya 6 teslimat sayılır; hak edilmiş ama verilmemiş ipucu varsa oyun açılışta verilir.

Beş ipucu toplanıp **Şişli de alınınca** (72. teslimat) menüde **HESAPLAŞMA** açılır: Kara ile bir kovalamaca. Kara, rakiplerin en güçlüsüdür (hız çarpanı 1,12, saldırganlık 1,7, **HP 16**). Canı yarıya inince **öfkelenir** ve 1,7 kat daha sık saldırır. Duvara ya da araca çarpması ona 3 HP kaybettirir. Yol, hangi motorla olursan ol süreden önce bitmeyecek kadar uzundur: dövüşü yalnızca 150 saniyelik süre ya da paketin dağılması bitirir. Yenersen **2.000 TL** ödül alırsın, dosya kapanır ve bölge senin olur: tüm ücretler kalıcı olarak +%10.

Kara yenilince sonuç ekranında oyunun genel istatistikleri (teslimat, yol, kazanılan para, yere serilen kurye, ödenen ceza, tamamlanan vardiya, sürüş süresi) görünür, ardından **SON** sahnesi gelir. Bundan sonra oyun **serbest sürüş** olarak devam eder: vardiyalar aynı kurallarla sürer, ücretler +%10'dur, Dosya ekranında istatistikler görünür.

### Oyun süresi ve ekonomi hedefi

`tools/econ_sim.py` oyunun kendi formülleriyle "orta seviye oyuncuyu" (%80 paket, motorun üst hızının %72'si ortalama hız, teslimat başına %8-25 başarısızlık) modeller. Hedef: Kara'ya yaklaşık 2 saatte ulaşmak, o noktada 5 motor ve parçaların çoğu alınmış olsun. Mevcut ayarla (0.40, bölge başına 12 teslimat) model medyan 111-138 dakika veriyor; 150'lik motor yaklaşık 18. teslimatta, 250'lik 36., Sport 600 son bölgede alınıyor.

`tools/ride_bot.py` kural tabanlı bir sürücüye (dikkatli, ortalama, gazcı) gerçek teslimatlar yaptırır. 0.40 ölçümü: dikkatli sürücü hiçbir bölgede kaybetmiyor, ortalama sürücü teslimat başına %0-20, gazcı Fatih'te %50'ye kadar kaybediyor; süreden kayıp yok. Bot insan değildir, eğilimi gösterir. Her denge değişikliğinden sonra çalıştırılmalıdır.

Hesaplaşmada yalnızca bu savaşta gergin müzik çalar. Sürüş sırasında telsizden Usta, 34'ün iç sesi ve rakipler hikâye repliklerini ilerleme durumuna göre söyler.

## 18. Nitro

- Teslimat başına hakkın: Nitro parçası seviyesi (en fazla 5).
- Kullanınca **2,5 saniye boyunca** üst hız ×1,25 (169 km/s sınırına kadar) ve hızlanma ×2.
- Kamera nitroda hafifçe geri çekilir (Reduce Motion açıksa kamera efektleri kapalıdır).

## 19. Kontroller

Gaz otomatiktir. Ekranın alt ortasındaki **hız göstergesi** anlık hızı km/s olarak gösterir. Mobilde sol tarafta direksiyon joystick'i, sağ tarafta VUR, FREN ve (nitro hakkın varsa) NİTRO butonları bulunur; Ayarlar'dan sol el seçilirse yerleşim aynalanır. Masaüstünde klavye: sol/sağ ok ya da A/D ile direksiyon, aşağı ok ya da S ile fren, `Boşluk` veya `K` ile vur (tekme/silah), `N` veya sol `Shift` ile nitro, `P` veya `Esc` ile duraklatma. Sekme arka plana geçince oyun otomatik duraklar.

Ayarlarda **İLERLEMEYİ SIFIRLA** butonu tüm ilerlemeyi (para, motorlar, parçalar, ipuçları, istatistikler, hikâye) siler; ayarlar korunur. Yanlışlıkla basılmasın diye ilk dokunuş butonu 4 saniyeliğine kurar, ikinci dokunuş siler. Ayarlardaki **FPS göstergesi** açılınca sol alt köşede saniyedeki kare sayısı (FPS), ortalama çizim süresi (draw), son yarım saniyenin en uzun karesi (max) ve otomatik kalite seviyesi (Q1-Q4) görünür. Oyun yavaş cihazda kare süresi uzarsa kaliteyi kendiliğinden düşürür (çözünürlük azalır, Q3'ten itibaren arka bina sırası çizilmez). Ayarlarda ses seviyeleri (müzik, efekt, ortam), dil (Türkçe / İngilizce) ve el seçimi bulunur. Yan aynalarda arkandaki araçlar ve kuryeler görünür.

## 20. Test araçları

Hepsi `python3 tools/<test>.py http://127.0.0.1:8765` ile çalışır (headless Chrome, Playwright).

| Araç | Ne test eder |
|---|---|
| `street_test` | Işık, yaya, çevirme, köpek, ters yön, ceza, sonuç ekranı |
| `ride_bot` | Denge ölçümü: üç beceri seviyesinde sürücü, bölge bölge başarısızlık, paket, yıldız, gelir; `MODE=bikes` motorları, `MODE=boss` Kara'yı ölçer |
| `econ_sim` | Ekonomi modeli: Kara'ya kaç dakikada varılır, o ana kadar neler alınır |
| `meta_test` | Bölge fethi, ipuçları, Kara ile hesaplaşma, bitiş, serbest sürüşte bölge seçimi, ayarlar |
| `shift_test` | Vardiya kartı, 5 teslimat, kasa, kartların etkisi, Şişli koşulu, parça iadesi, telsiz |
| `amb_test` | Ambulans 16 rotada sıkışmıyor, geçtikten sonra yakalanmıyor |
| `rival_test` | Rakiplerin itilmesi ve düşmesi |
| `camera_test` | Sabit ve dinamik kamerayı tepelik rotada karşılaştırır |
| `bike_vis_test` | Motor her ekran boyutunda ve yokuşta görünür kalıyor mu |
| `ui_scan` | Tüm ekranlar, TR/EN, 6 ekran boyutu: çakışma ve taşma (`--fonts` ile gerçek font ölçüleri) |
| `i18n_check` | İngilizcesi eksik metinler |
| `play_tutorial` | Hikâye, eğitim ve ilk teslimat botu |
