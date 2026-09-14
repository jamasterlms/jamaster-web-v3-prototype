# Jamaster ürün arayüzü incelemesi — 8 Eylül 2026

Sonraki form incelemesi ve kaynakla doğrulanan düzeltmeler: [Form ve iş akışı incelemesi](form-flow-review.md).

Bu çalışma mevcut React/Vite/shadcn uygulamasında yapılmıştır. İlk HTML’in beyaz yüzeyleri, sarı vurgusu, pastel zemini, birleşik cam sidebar’ı ve iç içe günlük araç paneli korunmuştur. İkincil metinler ve durum etiketleri için daha okunabilir tonlar kullanılmıştır.

## Sonuç ve doğrulama sınırı

33 iş kuralı testi, 113 menü hedefinin statik React render kontrolü, kayıt adımlarının ayrı render kontrolü ve TypeScript/üretim derlemesi geçti. Form etiketlerinin bir elemana bağlandığı ve aynı render içinde yinelenen element kimliği bulunmadığı kontrol edildi. Bunlar cihaz veya tarayıcı etkileşim testi değildir.

Bu turda denetimli önizleme sunucusu başlatıldı. Tarayıcının önizlemeye erişimi `ERR_BLOCKED_BY_CLIENT` ile engellendi. Başka adres, port veya tarayıcı altyapısıyla engel aşılmaya çalışılmadı. Gerçek Safari, iPad, Android, Windows dokunmatik ve TV tarayıcılarında kusursuz çalışma iddiasında bulunulamaz. Aşağıdaki cihaz kabul testleri açık kalmaktadır.

## Düzeltilen bulgular

| Alan                 | Bulgu                                                                 | Uygulanan düzeltme                                                                                                   |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Telefon              | Altı haneli herhangi bir metin kabul ediliyordu                       | `libphonenumber-js/max` ile ülke numaralandırma kuralları, TR varsayılanı, uluslararası +/00 girişi, kanonik saklama |
| Mükerrer kayıt       | 05… ve +90… farklı kayıt sayılabiliyordu                              | Öğrenci ve öğretmende aynı kanonik telefon/e-posta kontrolü; öğrenci son kaydında yeniden kontrol                    |
| Maskeli eski telefon | Maskeli numara normal telefon gibi düzenleniyordu                     | Değişmeyen mevcut maske korunabilir; yeni maske kabul edilmez. Tam numara girilirse normal doğrulama çalışır         |
| Kayıt doğrulama      | Yalnızca birkaç kişisel alan kontrol ediliyordu                       | Tüm adımlarda alan bazlı hata, ilk hataya odak, doğum tarihi/ikinci telefon/URL/koşullu alan kontrolü                |
| Eğitim tercihleri    | “Özel” seçeneğinin giriş alanı yoktu                                  | Özel gün ve saat girişleri; boş durumda hata; seviye/alt seviye bağımlılığı                                          |
| Önizleme             | Kimlik, adres, şirket ve birçok tercih görünmüyordu                   | Kişisel/eğitim/görüşme bölümlerinin tam özeti ve bölüme dönüp düzenleme                                              |
| Öğrenci düzenleme    | Ana kayıt ile `profile` ayrışıyordu                                   | Ortak alan ve kayıt modeli; tutar, devam, mevcut grup ve kayıt tarihi korunur; ilişkili takvim adı güncellenir       |
| Form girdileri       | Telefon ve bazı giriş hataları yalnızca tarayıcı balonuna kalıyordu   | shadcn Input içinde ortak doğrulama, Türkçe alan içi hata ve uygun klavye/autocomplete                               |
| Görüşme              | Geçersiz sonuç/skor/tarih ve boş olumsuz neden kabul edilebiliyordu   | Ortak iş kuralı kontrolü; olumsuz neden hatası; dinamik yakın günler                                                 |
| Günlük akış          | “Bugün” ve hafta sabitti                                              | Gerçek gün/ay/yıl, önceki/sonraki hafta, bugüne dönüş; seçimin araç kapanınca korunması                              |
| Takvim               | Etkinlikler üst üste ve 08–19 dışındaki saatler görünmez olabiliyordu | Çakışan etkinlikler için ayrı sütunlar, etkinliklere göre saat aralığı, okunabilir detay etiketi                     |
| Dashboard            | Sabit günler, eksik yıl aralığı ve sabit küçük grafikler              | Güncel tarihler; tam yıl/ay kayıt aralıkları; kayıt ve görüşme verisinden grafikler; anlamlı boş durumlar            |
| Mesaj                | Tek/toplu alıcı modu düzenlenen kayda ait değildi                     | Mod kayıtta korunur; kanal bazlı alıcı kontrolü ve önizlemede doğru alıcı                                            |
| Tarih filtresi       | Ters tarih aralığı listeye hemen uygulanıyordu                        | Yerel seçim, doğrulama, Uygula/Temizle; kapatınca uygulanmayan seçimi bırakma                                        |
| Ayarlar              | Bir bölümün eski state’i diğer bölüm ayarlarını ezebiliyordu          | Yalnızca açık bölümün alanları kaydedilir; telefon/e-posta normalize edilir; sayı sınırları                          |
| Fiyatlandırma        | Kampanya anahtarı vardı, ayrıntıları yoktu                            | Ad, tutar, başlangıç/bitiş alanları ve doğrulama                                                                     |
| Satış özeti          | Kampanya/yöntem indirimi hesaba katılmıyordu; kuruş farkı oluşuyordu  | Tarihe uygun kampanya, yöntem indirimi ve ek indirim; kuruşlarla tutarlı taksit toplamı                              |
| Satış kaydı          | Öğrencinin ilk kayıt tarihi satış tarihiyle değişiyordu               | İlk kayıt tarihi korunur; satış tarihi satış kaydına yazılır                                                         |
| Dialog               | Dar yükseklik ve ekran klavyesi için alan sınırlıydı                  | Görsel viewport yüksekliğine uyum, içerik genişliğine göre form kolonları; opak arka katman korunur                  |
| Form kapatma         | Dış zemine yanlış dokunma formu kapatıyordu                           | Ana kayıt/görüşme ve bazı düzenleme formlarında dış tıklama koruması; açık kapatma ve Escape korunur                 |
| Ekran kilidi         | Odak altta kalan sayfaya kaçabiliyordu                                | Odak tuzağı olan shadcn Dialog; bu özellik kimlik doğrulaması değildir                                               |
| Duyarlı yerleşim     | Kontroller ve uzun metinler dar alanı zorluyordu                      | İçerik genişliğine göre kolonlar, metin kırılımı, select daralması, kaydırılabilir tablolar, güvenli ekran kenarları |
| Büyük ekran          | Çok geniş satırlar ve küçük ölçek seçenekleri                         | Sınırlı çalışma alanı genişliği; %125/%150 dahil ölçek; sidebar konumu buna uyumlu                                   |
| Erişilebilirlik      | Küçük dokunma alanları, düşük ikincil metin kontrastı                 | Dokunmatik hedefler, belirgin odak, kaydırma bölgeleri, yüksek kontrast tercihi ve yazdırma stilleri                 |
| Hata kurtarma        | Bir render hatası tüm sayfayı boş bırakabiliyordu                     | Sayfa/uygulama hata sınırı; yeniden deneme ve yenileme görünümü                                                      |
| CSV                  | Kullanıcı metni elektronik tabloda formül sayılabilirdi               | Formül başlatabilecek hücrelerin metin olarak dışa aktarılması                                                       |

Telefon doğrulaması numaranın yapısını kontrol eder; kişinin numaraya sahip olduğunu veya SMS alabildiğini kanıtlamaz. Öğrenciyle telefon teyidi alanı manuel bir işarettir. Uygulama uluslararası kimlik/pasaport alanını T.C. kimlik numarası gibi zorlamaz.

## Sayfa aileleri inceleme kapsamı

| Aile                               | Kaynak/kompozisyon kontrolü                                        | Etkileşim açısından açık kalan                                               |
| ---------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Panel ve rapor kartları            | Yerleşim, kayıt serileri, tarih, sayı, boş durum                   | Gerçek cihaz grafikleri, tooltip taşması, gerçek analitik API                |
| Öğrenciler ve kayıt                | Liste, filtre, profil, ortak alanlar, 4 adım, düzenleme, önizleme  | Gerçek tarayıcıda son kullanıcı kayıt senaryosu, eşzamanlı sunucu kayıtları  |
| Takvim/yoklama                     | Tarih gezinmesi, saat aralığı, çakışma hesabı, detay               | Dokunma/kaydırma, gece yarısını aşan etkinlikler; ders bazlı yoklama geçmişi |
| Görüşmeler                         | Sonuçlar, tarih, neden, not, geçmiş/takvim ilişkisi                | İç içe dialog odak dönüşü, gerçek gönderim/arama                             |
| Gruplar                            | Kapasite/atama ve ortak form/tablo bileşenleri                     | Çok kullanıcılı kapasite yarışı ve gerçek kimliklerle ilişkilendirme         |
| Öğretmenler                        | İletişim doğrulama, tekrar kayıt, maaş/gün alanları, isim yayılımı | Sunucu maaş/rol yetkileri                                                    |
| Eğitim/dönem/müfredat              | Alan türleri, tarih aralıkları, ortak dar ekran kuralları          | API kaynaklı gerçek seçenekler ve tüm iş kuralları                           |
| Giderler                           | Tutar/açıklama/dönem/tarih doğrulama, form düzeni                  | Muhasebe ve tekrar eden işlem çalıştırıcısı                                  |
| Fiyatlandırma/satış                | Kampanya, indirim, taksit hesabı, önizleme                         | Çoklu satış defteri, iade, kısmi ödeme ve sağlayıcı entegrasyonu             |
| Tahsilatlar                        | Tarih/tutar, profil ilişkisi, ortak tablo/detay                    | Gerçek ödeme işlemi ve mutabakat                                             |
| SMS/e-posta/WhatsApp               | Alıcı türü, doğrulama, şablon ve canlı metin önizlemesi            | Gönderim ve teslim raporları                                                 |
| Ayarlar/ekip/şube                  | Bölüm bazlı kayıt, alan etiketleri, ortak form/menü kuralları      | Sunucu yetkilendirmesi ve şube veri izolasyonu                               |
| Duyuru/sözleşme/dosya/destek       | Statik render ve ortak form/dialog/taşma kuralları                 | Uzak dosya saklama, yayınlama ve destek iş akışı                             |
| Otomasyon/doğrulama/ileri raporlar | Menü hedefleri ve ortak görünüm                                    | Arka plan görevleri, onay yetkisi ve eksik rapor veri alanları               |

113 hedefin statik olarak açılması, 113 hedefin her birindeki tüm iş aksiyonlarının test edildiği anlamına gelmez. `check:pages` komutunun kapsamı kaynakta açıkça tanımlanmıştır.

## Cihaz kabul matrisi — görsel test bekliyor

| Koşul                               | Uygulanan UI yaklaşımı                                  | Kontrol edilecek senaryo                                      |
| ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| 320/360/390 px telefon              | Tek kolon, mobil veri kartları, alt araç drawer’ı       | Kayıt/önizleme, uzun metin, seçim, klavye açma/kapatma        |
| 768/820 px tablet ve bölünmüş ekran | İçerik genişliğine göre kolonlar, dokunmatik hedefler   | Sidebar’ın içeriği ezmemesi, sağ araçlar, select çarpışmaları |
| 1024 px yatay tablet                | Kaydırılabilir veri tablosu, sabit araç paneli          | Tam klavye rotası ve yatay/dikey yön değişimi                 |
| 1280/1440/1920 px masaüstü          | Referans yerleşim ve daraltılabilir araç alanı          | Windows %125/%150 sistem ölçeği, uygulama %85–%150            |
| 2560/3840 px büyük ekran            | Maksimum çalışma genişliği ve ölçek seçenekleri         | TV tarayıcısı, kumanda/klavye, uzun mesafeden okunabilirlik   |
| Kısa yükseklik/ekran klavyesi       | Görsel viewport’e uyan dialog sınırı                    | iOS Safari ve Android sanal klavyesi                          |
| Erişilebilirlik                     | Odak, hata ilişkisi, azaltılmış hareket/yüksek kontrast | VoiceOver/NVDA, %200 metin/zoom, yalnızca klavye              |

## Üretime geçiş için açık işler

- Gerçek Jamaster API, kimlik doğrulama, rol/şube yetkileri ve sunucu doğrulaması bağlanmalıdır. UI kontrolü güvenlik sınırı değildir.
- Veriler tarayıcıda saklanır; cihazlar arası senkronizasyon, çakışma çözümü, yedekleme ve audit log yoktur. Gerçek kişisel veriler için üretim veri altyapısı gerekir.
- Bazı ileri raporlar ek API alanları bekler; bazı rapor özetleri başlangıç tasarım verisidir. Finans modeli öğrenci başına tek güncel paket/tam ödeme modelidir. Bu tur muhasebe altyapısı kurmamıştır.
- Numara sahipliği doğrulaması, mesaj gönderimi, JamAI modeli, otomasyon çalıştırıcısı ve dosya servisi ayrı entegrasyonlardır.
- Tarayıcı engeli kalkınca yukarıdaki cihaz matrisi gerçek etkileşimle tamamlanmalıdır. Özellikle portal odak sırası, klavye, %200 zoom ve takvim çakışmaları tekrar görülmelidir.
- Tek JS paketi yaklaşık 1.09 MB / 310 KB gzip’tir. Build başarılıdır fakat Vite boyut uyarısı verir. Üretim için route bazlı bölme ve gerçek cihaz performans ölçümü açık kalır; tek dosya HTML teslimi için mevcut paket düzeni korunmuştur.

## Tekrarlanabilir kontroller

```sh
npm ci
npm test
npm run check:pages
npm run build
node scripts/package-deliverables.mjs
```

Telefon doğrulama davranışı için kütüphanenin [resmî belgeleri](https://github.com/catamphetamine/libphonenumber-js) kullanıldı. Bu revizyonda jamaster-web’e yazılmadı; önceki kaynak karşılaştırması `docs/source-comparison.md` içinde korunur.
