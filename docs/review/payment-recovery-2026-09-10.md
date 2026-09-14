# Ödeme hata akışları ve mobil form incelemesi

Kaynak `jamasterlms/jamaster-web` main tekrar kontrol edildi: `7810bd1720c57749f6d5249536ba015f2a53694f`. Tahsilat formunun `paymentType`, isteğe bağlı `paymentDate`, en fazla 255 karakter `paymentReference` ve `notes` sözleşmesi kaynakla karşılaştırıldı.

## Bulgular ve düzeltmeler

| Bulgu | Düzeltme |
| --- | --- |
| Başarısız manuel durum sorgusu, gösterilen eski OPEN yanıtını doğrulama sayabiliyordu. | Sorgu sonucu gösterilen kayıttan ayrıldı. Yalnız manuel sorgunun başarılı, güncel OPEN yanıtı yeniden ödeme girişini açar. Hata veya geçersizleşmiş yanıt kilidi açmaz. |
| Eski ve aynı anda çalışan sorgular karışabiliyordu. | İstek sırası izlenir; eski yanıt güncel veriyi değiştiremez. Token/servis/etkinlik değişimi ayrı kaynak oluşturur; effect temizliği bekleyen sorgunun çağırana dönen sonucunu da geçersizleştirir. |
| 409 sonrası yenilemenin başarısız olması tekrar ödeme akışını yeterince kilitlemiyordu. | 409, 408 ve belirsiz ödeme/iptal sonuçları doğrulama görünümünde kalır. Terminal sunucu durumu önceliklidir. Mutasyon otomatik tekrarlanmaz. |
| Enter ile adım geçişi devre dışı düğmenin koşullarını atlayabiliyordu. | Submit ve düğme aynı veri-hazırlık koşullarını uygular. Adres/kartlar alınmadan alan adımına geçilmez; kaynak hatası ilk adımda da gösterilir. |
| Tahsilat formunda düzeltilebilir sunucu reddi de formu kilitliyordu. | Bilinen ret alanları düzeltmeye izin verir. Sonucu belirsiz kayıt tekrar gönderilemez; önce güncel liste kontrol edilir. |
| Tahsilat penceresi yeniden açıldığında eski tutar/durum kullanılabiliyordu. | Her açılış listeyi doğrular. Bulunmayan/ödenmiş kayıt form açmaz; güncel tutar kullanılır. Kapanırken liste yenilenir. Sunucu atomikliği/idempotency yine gereklidir. |
| Geçersiz tarih, istek öncesinde hata verip belirsiz tahsilat gibi gösterilebiliyordu. | Gönderim öncesi doğrulama, ilişkili alan mesajı ve ilk hataya odak. Boş isteğe bağlı değerler gönderilmez. |
| Uzun tahsilat formunda kaydırılabilir gövde sınıfı eksikti. | Mevcut `dialog-form-body` kullanılır. Başlık/alt aksiyonlar sabit, alanlar kaydırılabilir; isteğe bağlı bölümün boşluğu korunur. |
| Ödeme filtreleri görünüm değişince kayboluyordu. | Arama/durum URL'de tutulur. Temizleme seçili ödeme kimliklerini ve diğer parametreleri silmez. |
| Kodlanmış token ikinci kez kodlanabiliyordu. | Tek segment bir kez çözülür; bozuk/fazla segmentli bağlantı API'ye gönderilmez. Token kalıcı depoya veya çalışma sekmelerine eklenmez. |
| Drawer araç çubuğu, viewport CSS güncellemesinden önce ölçülmüş konumu kullanıyordu. | Klavye için ayrılan alt kenara CSS ile bağlanır. Vaul hareketi/yükseklik değişimi JS ölçümü gerektirmez; araç çubuğu odak tuzağında kalır. |
| Pinch zoom klavye açılması sanılabiliyordu. | Klavye tespiti viewport yüksekliğini yakınlaştırma oranıyla birlikte değerlendirir. Normal adres çubuğu yükseklik değişimi de klavye sayılmaz. |

## Doğrulama ve sınırlar

- **159 birim testi geçti.** Yeni kontroller: başarısız yenilemede eski OPEN, ters sırada sonuçlanan sorgular, token/kapsam terk etme, manuel açık durum doğrulaması, ret/belirsizlik ayrımı, tahsilat tarih/referansları, token kodlaması ve pinch zoom/klavye geometrisi.
- TypeScript ve Sites üretim derlemesi başarılı. Bootstrap 677,82 kB (203,17 kB gzip); önceki 500 kB uyarısı devam ediyor. Ödeme modülleri ayrı parçalarda kalır. Bu turda yeni bağımlılık eklenmedi.
- Gerçek PaymentOverview SSR'ında URL araması geri yüklenir ve eşleşmeyen satırı çıkarır. `check:pages`: 115 menü hedefi dolu/boş; 154 kaynak rota; 42 rapor yaprağı; 117 hazırlanmış sayfada ilk/tekrar render sırasında Suspense fallback yok.
- Bunlar cihaz kabulü değildir. İzinli önizlemedeki önceki `ERR_BLOCKED_BY_CLIENT` engeli nedeniyle Safari/Chrome klavye, drawer sürükleme ve landscape görsel kabulü doğrulanmadı. Engeli aşmak için alternatif tarayıcı/URL kullanılmadı.
- Auth/API ve gerçek banka/3DS entegrasyonu bağlı değil. Kaynak yöneticisinin servis anahtarı değişimi, uygulama genelinde tenant izolasyonu anlamına gelmez. Entegrasyonda oturum/tenant/şube değişince PaymentProvider ve form ağacı kapsam anahtarıyla yeniden kurulmalı; kimlik başlıkları gerçek API istemcisinden gelmelidir.
- Bootstrap paket boyutu, gerçek mesaj/dosya servisleri, XLSX ve iki kullanıcı/şube üretim kabulü önceki açık işler olarak duruyor.
