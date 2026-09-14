# Sayfa açılışı — yükleme gecikmesi düzeltmesi

10 Eylül 2026. İstek: yeni bir çalışma sayfası açılırken oluşan beklemeyi düzeltmek. Soft tema, çalışma sekmeleri, filtre saklama, önizleme ve formlar korunur.

## Bulgu

- 42 sayfa ailesinin dosyası yalnız React.lazy ilk kez render edildiğinde isteniyordu. Menü, çalışma sekmesi, klavye odağı ve dokunma niyeti için ön yükleme yoktu.
- Sayfa değişince yeniden oluşturulan ErrorBoundary içinde yeni bir `Suspense fallback={null}` kuruluyordu. Bu yapı hazır sayfa yerine boş bir içerik alanının commit edilmesine izin veriyordu.
- İlk açılış sonrası `started` state değişikliği sayfa ağacına ek bir Suspense katmanı yerleştiriyor ve ilk sayfayı da yeniden kuruyordu.
- Küçük React sunucu render deneyi, import önceden çözülmüş olsa bile yeni bir React.lazy sarmalayıcısının ilk render'ının hâlâ suspend ettiğini gösterdi: dosya hazır, fallback var, loader çağrısı iki. Sadece import çağrısını erkene almak yeterli değildi.

## Değişiklik

- Renderer ve ön yükleme, aynı tip kontrollü `resolvePage` eşlemesini kullanır. Kaynak alias'ları, kimlikler, alt sayfalar ve query aktarımları aynı kurallardan çözülür.
- Sayfa başına tek kaynak: devam eden istek paylaşılır; çözülmüş modül ilk gösterim ve tekrar ziyaretlerde doğrudan render edilir. Ön yükleme sayfa bileşenini mount etmez; form effect'leri, kayıt işlemleri ve veri mutasyonları çalıştırmaz.
- Gerçek dahili bağlantılarda pointerover, focusin ve pointerdown kod yüklemesini başlatır. Portal menüler de kapsanır. Harici adresler, dosya indirmeleri, farklı pencere hedefleri ve fragment bağlantıları atlanır. Odaklandırma, tıklama ve gezinme tetiklenmez.
- Arayüz hazır olduktan sonra açık çalışma sekmeleri ve sık kullanılan öğrenci/grup/öğretmen sayfaları boşta hazırlanır. En fazla sekiz farklı sayfa ailesi, sırayla indirilir. Veri tasarrufunda, 2G bağlantıda ve görünmeyen sekmede arka plan hazırlığı yapılmaz. Kullanıcının doğrudan basması normal isteği başlatabilir.
- Komut ve tablo aksiyonlarıyla yapılan programatik yönlendirme de render başlamadan kod isteğini başlatır.
- Route içindeki boş Suspense sınırları ve `started` güncellemesi kaldırıldı. BrowserRouter/MemoryRouter geçişleri açıkça etkinleştirildi; ana bootstrap sınırı korunur. Hazır ekran yeni route hazır olana kadar görünür kalabilir; route'a yeni bir loader eklenmedi.
- Başarısız modül indirmesi görünür hata sınırına ulaşır. Tekrar dene başarısız kaynakları sıfırlar, hazır modülleri atmaz. Yeniden deneme de transition içinde yapılır.

## Doğrulama

- `npm test`: **139 geçti, 0 hata**. Beş yeni test: ortak pending istek, ilk/tekrar render'da beklememe, hata/yeniden deneme, dahili bağlantı kapsamı ve veri tasarrufu politikası.
- `npm run check:pages`: **117** navigasyon hedefi dolu/boş veriyle; **154** kaynak adresi doğru bileşen ailesiyle; **42** rapor alt sayfası doğrulandı.
- Aynı kontrol artık gerçek production sayfa kaynaklarını kullanarak 117 hedefi ön yükleme sonrasında ilk ve tekrar ziyaret olarak render ediyor: **234 render'da Suspense fallback yok**. Eager test bileşenleri bu ek kontrolün yerine kullanılmıyor.
- TypeScript ve Sites production build başarılı; `git diff --check` temiz.
- Bundle dağılımı: bootstrap 677,24 kB / gzip 203,01 kB; app 98,78 kB / gzip 29,06 kB. Önceki bootstrap/app toplamı 768,98 kB, yeni toplam 776,02 kB. Sayfa modülleri ayrı chunk olarak kalır; tüm sayfaları açılış paketine koyma yöntemi kullanılmadı. Mevcut 500 kB bootstrap uyarısı hâlâ açıktır.

## Sınır

İzinli tarayıcı önizlemesindeki önceki `ERR_BLOCKED_BY_CLIENT` engeli nedeniyle gerçek cihaz/ağ üzerinde tıklamadan boyamaya süre veya FPS ölçümü yapılmadı. Buradaki kanıt modül isteği, ön yüklenmiş gerçek bileşen render'ı, rota kapsamı ve derlemedir; milisaniye veya yüzde hızlanma iddiası değildir. İlk kez istenen ve henüz hazırlanmamış bir sayfanın gerçek ağ indirmesi hâlâ gerekebilir. API, auth ve üretim veri entegrasyonu bu düzeltmenin kapsamı değildir.
