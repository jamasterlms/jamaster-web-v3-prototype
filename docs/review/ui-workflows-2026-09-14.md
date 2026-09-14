# 14 Eylül — UI ve iş akışları

Bu kayıt yeni kullanıcı taleplerinin uygulamasını ve doğrulanmış sınırlarını ayırır. Kaynak karşılaştırması jamaster-web `c85bebcac6804fa9c7069b6594a5c615554d8854` üzerinden yapıldı. Referans ekranlar, önceki soft tasarım ve mevcut React/shadcn yapısı korundu.

## Bu turdaki değişiklikler

| İstek                         | Uygulama                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ürün dışı dolaşım kontrolleri | Panel/giriş/rol seçimi/ödeme senaryoları açılır sabit Prototip menüsüne taşındı. Gerçek hata kurtarma eylemleri yerinde. `VITE_PROTOTYPE_TOOLS=false` sunum menüsünü kapatır; yetkilendirme sağlamaz.                                                                                                                                       |
| Sabit toplu işlemler          | DataTable, grup öğrencileri, aktiviteler, yoklama QR ve ödeme seçimi tek portal katmanını paylaşır. Seçim yoksa gizli, birden çok bar yığılır, başarılı kısmi işlemler yalnız tamamlanan seçimleri temizler.                                                                                                                                |
| Takvim                        | Batch gün stiliyle çakışma ayrıldı. Filtre etiketleri, tarih araçları, sticky gün/saat başlıkları, sınırlı grid scroll, ay görünümü, ek etkinlik sayısı ve tam ekran katmanları düzeltildi. Tarih/görünüm tek URL güncellemesinde yazılır. Ters yönde sürükleme iki uç hücreyi kapsar. Öğretmenler ID ile eşleşir; silinmiş filtre görünür. |
| Kurulum                       | Sağ panelin başlığında Kurulum açılır alanı; kaynak uygulamadaki yedi adım ve hedefler var. İlerleme yalnız doğrulanmış onboarding booleans varsa gösterilir; veri sayısından sahte tamamlanma türetilmez.                                                                                                                                  |
| Adlandırma                    | Görüşme sekmesi Görüşmeler, gelir/gider sayfası Muhasebe. Şube seçicisinin Çalışma alanı açıklaması korunur.                                                                                                                                                                                                                                |
| Ödeme merkezi                 | İlk başarılı yüklemede tüm ödeme kalemleri seçili. Açık URL alt seçimi, geçersiz kimlikler ve kullanıcının temizlediği seçim genişletilmez. Servis/şube kapsam değişiminde seçim sıfırlanır.                                                                                                                                                |
| Hesap ayarları                | Çalışma alanı ayarlarıyla aynı sol bölüm menüsü ve sağ içerik düzeni; ikinci büyük başlıklar kaldırıldı.                                                                                                                                                                                                                                    |
| Ayar düzenleme                | Genel/profil alanları tıklama ile açılan editörler. Profil, genel, banka, kurum, entegrasyon, tercihler ve bildirimlerde değişiklik varsa alttan Kaydet/Vazgeç. Telefon/alan doğrulaması korunur. Klavye gezinmesi kapalı editörleri de açar; sabit bar dokunmada odak kaybedip kaçmaz.                                                     |
| Alt sekmeler                  | Detay içi sekmeler üst bölümdeki ayrı soft pill görünümünü kullanır; alt çizgi yok.                                                                                                                                                                                                                                                         |
| Çoklu mesaj grupları          | Canonical grup ID'leriyle birden çok seçim, seçili etiketler, tekilleştirilmiş alıcı sayısı ve aynı alıcı listesinden önizleme. Silinmiş/belirsiz grup tüm öğrencilere dönüşmez. Bulk mod eski tek adresi kullanmaz. Denenmiş mesaj düzenlenince yeni taslak kimliği oluşur.                                                                |
| Duyuru taslakları             | Admin durum/kit­le/arama filtreleri, taslak kaydetme, önizleme, yayımlama ve taslağa alma; öğretmenler yalnız kendi grup taslaklarını görür/düzenler. Taslaklar öğrenci/öğretmen yayın akışından çıkarılır. Eski grup isimleri tam dizinde tekilse ID'ye çözülür.                                                                           |
| Üst araçlar                   | Ölçek, kilit, tam ekran ve hassas bilgi görünümü üç nokta içinde; bildirim, panel ve profil tutarlı dış kontroller. Ölçek alt sınırı %70.                                                                                                                                                                                                   |
| Yardım/uyarı                  | İstenen entegrasyon açıklaması kaldırıldı; gizli anahtarlar yine saklanmaz. Yardım dialog'unda başlık ayrılmış, arama iç kaydırmada sticky.                                                                                                                                                                                                 |

## Doğrulama

- TypeScript derlemesi başarılı.
- 228 iş kuralı/regresyon testi geçti. Yeni testler ödeme varsayılan seçimi, çoklu alıcı kapsamı ve tekilleştirme, duyuru taslak gizliliği ve takvim ters sürüklemesini kapsıyor.
- SSR kontrolü: 134 menü hedefi dolu/boş veriyle, 154 kaynak adres kalıbı, 42 rapor alt sayfası. Hazırlanmış sayfa ailelerinin ilk/tekrar render'ında ek route loader yok.
- Production build başarılı. Ana paket yaklaşık 779 kB / gzip 237 kB; Vite'ın 500 kB uyarısı sürüyor. Bu bir gerçek cihaz hız ölçümü değildir.
- Dört bağımsız salt okunur agent incelemesi: takvim, iletişim, ayarlar ve toplu işlemler. Bulgular uygulamaya işlendi.
- Resmî önizleme ortamı önceki denemede `ERR_BLOCKED_BY_CLIENT` verdi. Bu turdaki kontroller gerçek tarayıcı/cihaz, görsel screenshot veya yazılım klavyesi kabul testi değildir; alternatif adresle kısıtlama aşılmadı.

## Hâlâ üretim kabulü gerektirenler

1. Canlı kimlik doğrulama/ALTCHA, ödeme, SMS/e-posta/WhatsApp, polling ve onboarding-status servisleri bağlı değil. İlgili yerel senaryolar canlı işlem başarısı sayılmaz.
2. Şube seçimi UI/filtre durumunu ayırsa da iş verilerinin tamamı şube bazlı servis/store izolasyonuna sahip değil; gerçek çok kiracılı üretim güvenliği tamamlanmış sayılmaz.
3. Kaynak uygulamadaki öğrenci toplu grup atama/pasife alma/mesaj ve grup arşiv/transfer mutasyonlarının hepsi port edilmedi. Bu tur mevcut toplu işlemlerin sabit UI'sını birleştirir; iş semantiği bilinmeyen işlemler taklit edilmedi.
4. Gerçek telefon/tablet/TV, klavye açık-kapalı, %200 tarayıcı zoom, 10.000 satır ve 16 sekme için cihaz kabulü yapılmalı.
5. Bazı raporların sunucu hesaplama sözleşmeleri ve gerçek eğitim videosu kayıtları hâlâ gerekli. Yerel rehber klipleri gerçek ürün ekran kaydı olarak sunulmamalı.

Bu nedenle “bütün ürün üretime hazır” sonucu çıkarılamaz. Bu turdaki UI ve yerel akış değişiklikleri, testlerden geçen prototip güncellemesidir.

Son görsel düzenleme: Prototip tetikleyicisi sidebar üst katmanında küçük, düşük kontrastlı ikon düğmesine çevrildi; hover/klavye odağında belirginleşir. Masaüstü sidebar footer alanı düğme için yer ayırır. ZIP teslimi güncel commit kaynaklarından üretilir.
