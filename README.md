# Kurye 34

İstanbul'da motor kuryeliği. Road Rash tarzı, mobil öncelikli, pseudo-3D tarayıcı oyunu.

**Oyna:** https://kreisau.github.io/kurye-34/ (telefonda "Ana ekrana ekle" ile uygulama gibi kurulur, offline çalışır)

## Wiki

Oyunun tüm sistemleri (cezalar, motorlar, parçalar, kartlar, bölgeler, trafik, rakipler, ekonomi, hikâye) için: [docs/WIKI.md](docs/WIKI.md)

## Yapı

Derleme yok; düz ES modülleri.

| Dosya | İçerik |
|---|---|
| `index.html`, `style.css` | Markup ve stil |
| `js/main.js` | Buton bağlantıları, başlangıç, oyun döngüsü |
| `js/g.js` | Paylaşılan değişken durum (`G`) |
| `js/config.js` | Sabitler, semtler, motorlar, kartlar, yardımcılar |
| `js/sprites.js` | Prosedürel sprite'lar, tema |
| `js/save.js` | Kayıt (localStorage), motor istatistikleri |
| `js/track.js` | Yol üretimi |
| `js/game.js` | Vardiya, teslimat, hasar, `update()` |
| `js/traffic.js` | Trafik araçları; ambulans için acil koridoru (araçlar iki yana açılır) |
| `js/rivals.js` | Rakip kuryeler |
| `js/render.js` | Çizim, ayna, boyutlandırma |
| `js/ui.js` | HUD, menüler, garaj, sonuç ekranı |
| `js/input.js` | Joystick, dokunmatik butonlar, klavye |
| `js/audio.js` | Ses: motor, efektler, kornalar, ortam, hikâye sesleri (hepsi kodla), müzik döngüleri, ses ayarları |
| `js/rating.js` | Müşteri puanı (1-5 yıldız), bahşiş, ortalama puana göre ücret ±%10 |
| `js/radio.js` | Telsiz: eğitim kutusunun yerleşimi ve sürüş sırasında hikâye replikleri (Usta, 34'ün iç sesi, rakipler) |
| `js/tutorial.js` | Eğitim rotası "İlk gün", Usta'nın telsiz mesajları |
| `js/meta.js` | Uzun vadeli hedefler: ipuçları (dosya), Kara ile hesaplaşma, günün siparişi |
| `js/fx.js` | Darbe hissi: kıvılcım, kısa donma, titreşim |
| `js/street.js` | Sokak hayatı: trafik ışıkları ve yaya geçitleri, yayalar, polis çevirmesi, sokak köpekleri, ters yönden gelen kuryeler (vurulabilir, +60 TL) |
| `js/i18n.js` | İngilizce katmanı: ekrana giden her metni çevirir (Ayarlar → Dil) |
| `js/story.js` | Hikâye girişi (6 sahne, canvas çizimleri) |
| `music/` | Gemini (Lyria) müzikleri, `tools/make_loops.py` ile döngüye çevrilmiş (menü, sürüş, gergin sürüş) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA |
| `legacy/index.html` | Modüllere bölünmeden önceki tek dosya sürüm (referans) |
| `tools/play_tutorial.py` | Bot: hikâye → eğitim → ilk teslimat, ekran görüntüleriyle |
| `tools/make_loops.py` | Müzik MP3'lerini ölçü hizalı, dikişsiz döngülere çevirir |
| `tools/sound_demo.py` | Sesleri tarayıcıda çevrimdışı render edip WAV olarak kaydeder |
| `tools/meta_test.py` | İpucu, hesaplaşma, günün siparişi, saf dışı, ayarlar testleri |
| `tools/i18n_check.py` | İngilizcede çevrilmeden kalan metinleri listeler |
| `tools/bike_vis_test.py` | Motorun her ekran boyutunda ve yokuşta ekranda kaldığını ölçer |
| `tools/rival_spawn_test.py` | 4 rakip, 6 rota: iki rakip üst üste binmiyor |
| `tools/econ_sim.py` | Ekonomi modeli: orta seviye oyuncunun Kara'ya kaç dakikada ulaştığı ve o ana kadar neler aldığı |
| `tools/camera_test.py` | Sabit ve dinamik kamerayı yokuşlu rotada karşılaştırır |
| `tools/street_test.py` | Işık, yaya, çevirme, köpek, ters yön, ceza ve günün saati testleri |
| `tools/shift_test.py` | Vardiya kuralları: 5 teslimat, vardiya kasası, kasayı alma, kaybedince kasanın gitmesi, kart açılması, lanetli kartlar, telsiz |
| `tools/amb_test.py` | Ambulans: 16 rotada trafiğe sıkışmıyor, geçtikten sonra yakalanmıyor |
| `tools/ui_scan.py` | Tüm ekranları TR/EN ve 6 ekran boyutunda tarar; çakışan, kesilen, ekran dışına taşan öğeleri listeler |
| `tools/parity.py` | Eski ve yeni sürümü aynı seed/girdiyle çalıştırıp kare kare karşılaştırır |

## Lokal çalıştırma

```
python3 -m http.server 8000
```
Sonra http://localhost:8000 (modüller `file://` üzerinden açılmaz).

Yayın: `main` dalına push → GitHub Pages otomatik günceller. Service worker dosyaları arka planda yeniler; yeni sürüm bir sonraki açılışta görünür.
