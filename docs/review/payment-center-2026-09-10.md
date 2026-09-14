# Birleşik ödeme merkezi ve mobil araç alanı

Kaynak: `jamasterlms/jamaster-web`, main `7810bd1720c57749f6d5249536ba015f2a53694f`. Bu turda main ve mevcut branch listesi yeniden kontrol edildi. İncelenen kaynaklar: `app/[locale]/payment/**`, `components/payment-checkout/**`, `hooks/payment/**`, kart/adres hook'ları, eski admin/super ödeme girişleri ve şube tahsilat sayfası.

## Kaynak karşılaştırması

| Alan | Kaynak davranış | Yeni arayüz |
| --- | --- | --- |
| Merkez | `/payment`, active/cards/history | Tek merkez, URL ile görünüm/seçim, soft özet kartları, seçili kalem toplamı, aktif ödeme, kayıtlı kartlar ve geçmiş |
| Kapsam | Kurum faturası / şube ödemesi / öğrenci taksiti | Kapsam servis yanıtından gelir; rol veya çalışma alanı adından tahmin edilmez |
| Eski girişler | Admin checkout ve super billing hâlâ mevcut | `/admin/payments`, checkout, `/super/billing`, cards/history `/payment` adresine yönlenir; kimlik ve query korunur. Navigasyonda ödeme mutasyonu yapılmaz |
| Ödeme | `/payment/[token]`, özet → adres → yöntem → kontrol | Dört adım, geri/düzenle, zorunlu alanlar üstte, ayrı boşluklu isteğe bağlı bölüm, onay ve sabit alt aksiyonlar |
| Fatura adresi | Ad, soyad, e-posta, telefon, kimlik, açık adres, il, ülke, posta kodu | Tüm alanlar/placeholder'lar; ülke kodlu telefon bileşeni, TR doğrulaması, API formatına dönüşüm; adres kaydetme isteğe bağlı |
| Kart | Yeni veya kayıtlı kart, ay/yıl/CVC, kaydetme | Alan doğrulaması, Luhn/son kullanım kontrolü, yalnız son dört hane ile inceleme; PAN/CVC local/session storage'a yazılmaz |
| Kart kimlikleri | Yönetimde kart ilişkisinin ID'si, ödemede gerçek kart ID'si | İki kimlik tipli modelde ayrıdır; tenant default ve branch priority semantiği korunur |
| Sonuç | OPEN/PROCESSING/COMPLETED/CANCELLED/SUPERSEDED | Terminal sunucu durumu önceliklidir; belirsiz yanıt yeni ödemeyi kapatır. Durum kontrollü aralıklarla sorgulanır; banka HTML'i ana DOM dışında sandbox iframe'dedir |
| Öğrenci taksiti | Kaynak token checkout henüz desteklemiyor | Kart görünümü gizlenir, çevrim içi ödeme açıkça kullanılamaz; öğrenci tahsilat/maaş/defter sayfaları korunur |
| Şubelerden tahsilat | `/super/branches/payments`, şube/ad/tutar/vade/ödeme tarihi, bağlantı/manuel kayıt | Önceki öğrenci satış defteri eşleşmesi kaldırıldı. Kaynak kolonları, arama/sıralama/sunucu sayfalaması ve ikon aksiyonları eklendi |

## Mobil ve gezinme düzeltmeleri

- Drawer'ın eski `align-self:start` ve `height:100%` mirası kaldırıldı. Tek flex gövde kalan yüksekliği kullanır, enine uzar; header/handle alanı içerik yüksekliğine eklenip taşmaz. İç kaydırma ve safe-area korunur.
- Vaul giriş yeniden konumlandırması kapatıldı; kullanılabilir yükseklik/alt konum `visualViewport` üzerinden tek yerde yönetilir. Klavye araç çubuğu Vaul transform'u için yerel koordinata çevrilir. Genişlik/orientasyon değişimi klavye tespitinde eski yükseklik tabanını sıfırlar.
- İki alt araç düğmesi gerçek DrawerTrigger'dır. Kapatırken açan düğmeye odak döner; sayfa veya masaüstü kırılımı değişince mobil drawer kapanır.
- Navbar'ın iki tarafına da `flex:1` uygulayan geniş seçici ve sıra numarasına göre gizlenen düğmeler kaldırıldı. Sol grup esner; sağ grup sabit kalır. İkincil araçlar mobil/tablette erişilebilir menüye taşınır. Dokunma hedefleri fiziksel 44px minimumdur.
- Standalone sayfanın ErrorBoundary anahtarı query değişince yeniden mount etmez. Ödeme sekmesi/seçimi değişiminde tüm sayfa tekrar kurulmaz.
- Ödeme token'ları ve giriş/portal adresleri kalıcı çalışma sekmelerine eklenmez.
- DataTable sunucu sayfalamasını destekler; sunucudan gelen sayfayı istemcide ikinci kez bölmez veya ikinci pagination footer göstermez.

## Doğrulama

- Birim testleri: ödeme seçimi/yuvarlama/para birimi, geçmiş birleştirme, adres/telefon/kart, sadece seçilen kaynakla checkout payload, terminal/belirsiz durumlar, eski adresler, tenant/branch kart kimlikleri, öğrenci kapsamı, collector uçları ve çalışma sekmelerine token yazılmaması.
- SSR kontrolleri: ödeme alanları/etiketler/placeholder'lar, zorunlu/isteğe bağlı sırası, uzun açıklama/büyük tutar, mobil kart yapısı, bütün sonuç ekranları, banka iframe sandbox, 30 satırlı sunucu sayfasının tekrar kırpılmaması.
- Mevcut kontroller korunur: 115 benzersiz menü hedefi dolu/boş, 154 kaynak rota, 42 rapor alt sayfası; 117 gerçek ön yüklenmiş hedefte ilk/tekrar render sırasında Suspense fallback yok. Menüdeki sayı düşüşü birleştirilen ödeme alias'larından gelir.
- Responsive CSS 320–600, 767, 900, 1199 ve büyük ekran koşulları açısından incelendi. **Bu statik inceleme gerçek cihaz testi değildir.** Önceki izinli tarayıcı önizleme erişim engeli (`ERR_BLOCKED_BY_CLIENT`) giderilmiş değildir; gerçek Safari/Chrome klavye, Vaul sürükleme ve landscape kabulü bekler.

- `npm test`: **150 geçti, 0 hata**. TypeScript/Sites üretim derlemesi başarılı. Mevcut bootstrap paketinin 500 kB uyarısı sürüyor; ödeme modülleri ayrı parçalarda kalıyor.

## Servis sınırı / entegrasyon

`PaymentProvider` gerçek kimlik doğrulaması yapılmış istemciden üretilen `createPaymentService(transport)` kabul eder. Transport kaynak Jamaster API istemcisini kullanmalı, tenant/branch/oturum başlıklarını UI verilerinden türetmemeli; GET/POST/PUT/DELETE ve checkout için 60s timeout'u uygulamalıdır. Tekil yanıtlar ham payload, kart/adres listeleri `{data:...}` olarak kaynak sözleşmesini izler. HTTP hataları `PaymentServiceError` durum kodu ve belirsizlik bilgisi ile dönmelidir. Bağlam değişiminde provider ilgili oturum/kapsam anahtarıyla yeniden kurulmalıdır.

Bu çalışma alanında auth/API bağlantısı yoktur. Varsayılan servis kapalıdır; tutarların yerine `—` ve tekrar deneme durumu gösterilir. **Gerçek kart saklama, 3DS ile tahsilat, tenant erişimini açma veya tahsilat kaydetme tamamlandı diye sunulmaz.** Arayüz/servis sözleşmesi hazırlanmıştır; mevcut kaynakla üretim entegrasyonu ve banka test ortamında uçtan uca doğrulama hâlâ gerekir. Tarayıcıya işlem sonucu uyduran örnek ödeme kaydı eklenmedi.

Diğer mevcut açık konular: gerçek auth/şube yetkisi/API izolasyonu, mesaj ve dosya servisleri, XLSX ve gerçek iki kullanıcı/şube kabulü. Bu turda tasarım değişikliğiyle ilgisiz servisler eklenmedi.
