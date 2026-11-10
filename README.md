# Kurye 34

İstanbul'da motor kuryeliği. Road Rash tarzı, mobil öncelikli, pseudo-3D tarayıcı oyunu.

**Oyna:** https://kreisau.github.io/kurye-34/ (telefonda "Ana ekrana ekle" ile uygulama gibi kurulur, offline çalışır)

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
| `js/traffic.js` | Trafik araçları |
| `js/rivals.js` | Rakip kuryeler |
| `js/render.js` | Çizim, ayna, boyutlandırma |
| `js/ui.js` | HUD, menüler, garaj, sonuç ekranı |
| `js/input.js` | Joystick, dokunmatik butonlar, klavye |
| `js/audio.js` | Ses: motor, efektler, kornalar, ortam, hikâye sesleri (hepsi kodla), müzik döngüleri, ses ayarları |
| `js/rating.js` | Müşteri puanı (1-5 yıldız), bahşiş, ortalama puana göre ücret ±%10 |
| `js/tutorial.js` | Eğitim rotası "İlk gün", Usta'nın telsiz mesajları |
| `js/story.js` | Hikâye girişi (6 sahne, canvas çizimleri) |
| `music/` | Gemini (Lyria) müzikleri, `tools/make_loops.py` ile döngüye çevrilmiş (menü, sürüş, gergin sürüş) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA |
| `legacy/index.html` | Modüllere bölünmeden önceki tek dosya sürüm (referans) |
| `tools/play_tutorial.py` | Bot: hikâye → eğitim → ilk teslimat, ekran görüntüleriyle |
| `tools/make_loops.py` | Müzik MP3'lerini ölçü hizalı, dikişsiz döngülere çevirir |
| `tools/sound_demo.py` | Sesleri tarayıcıda çevrimdışı render edip WAV olarak kaydeder |
| `tools/parity.py` | Eski ve yeni sürümü aynı seed/girdiyle çalıştırıp kare kare karşılaştırır |

## Lokal çalıştırma

```
python3 -m http.server 8000
```
Sonra http://localhost:8000 (modüller `file://` üzerinden açılmaz).

Yayın: `main` dalına push → GitHub Pages otomatik günceller. Service worker dosyaları arka planda yeniler; yeni sürüm bir sonraki açılışta görünür.
