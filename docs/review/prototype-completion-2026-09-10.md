# Prototip akışlarının tamamlanması — 10 Eylül 2026

Bu kayıt, önceki incelemelerde servis bağlantısı beklediği için kapalı bırakılmış işlemlerden hangilerinin artık yerel olarak denenebildiğini açıklar. Kullanıcının son isteğiyle `/payment` için örnek ödeme adımları etkinleştirildi. Canlı API başarıları taklit edilmez; para, mesaj, parola ve doğrulama sınırındaki işlemlerin önizleme olduğu ekranda belirtilir. Bu belge üretim veya tüm cihazlarda kusursuzluk onayı değildir.

Kaynak: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f` (main bu çalışmada tekrar kontrol edildi). Kaynak uygulamaya yazılmadı. React/Vite/TypeScript, Tailwind ve özelleştirilmiş shadcn yapısı korundu.

## Bu pakette kapanan prototip işleri

| Alan | Artık denenebilen davranış |
| --- | --- |
| Ödeme merkezi | Üç açık kalem, önceki ödeme, seçim/özet/tutar, işlem oluşturma, aktif işleme dönme, iptal, geçmiş ve kart yönetimi. İstendiğinde onay penceresiyle başlangıca dönme. |
| Checkout | Özet → fatura adresi → ödeme yöntemi → kontrol. Kayıtlı adres/kart veya yeni bilgiler; alan doğrulama; deneme bilgilerini doldurma; onaydan önce geri dönüp düzenleme. |
| Ödeme sonuçları | Başarılı ödeme, kart reddi, sonucu beklenen işlem; doğrulamayı onaylama/reddetme, düzeltme ve yeniden deneme. Onaylanan kalemler geçmişe taşınır. İptal ve ret borcu kapatmaz. İşlem sürerken aynı kalem tekrar tahsil edilemez. |
| Ödeme devamlılığı | İşlem, maskelenmiş kart metadatası ve açıkça kaydedilen adresler `sessionStorage` içinde korunur. PAN/CVC ve kaydedilmeyen form taslağı tutulmaz. Şubelerin ödeme denemeleri ayrıdır; başka şubenin tokenı bulunamaz. Bu, uygulamanın bütünü için gerçek tenant izolasyonu değildir. |
| Aktiviteler | Taslak oluştur/düzenle/sil, yayımla, kapat, tekrar aç, arşivle; toplu yayımla/arşivle/çoğalt; isteğe bağlı hedef grup, uygun olmayan kayıtların ayrı sonucu. Tür ve notlandırma seçimleri boş başlar; kaynakta isteğe bağlı olan maksimum puan alt bölümdedir. |
| Öğrenci portalı | Profil seçimine göre atanmış dersler, çalışma listesi/detayı, metin teslimi, teslim durumu, öğretmen geri bildirimi, notlar ve grup duyuruları. Taslak/arşiv aktiviteleri ve özel öğretmen notları öğrenci ekranında gösterilmez. |
| Öğretmen portalı | Atanmış gruplar/öğrenciler, aktivite detay ve teslimler, puan/harf/geçti-kaldı değerlendirmesi, özel not, düzeltme isteme ve yeniden teslim. Grup duyurusu öğrenci portalında görünür. |
| İletişim | Tekil/toplu alıcı çözümü, geçerli adres/telefon ve mükerrer kontrolü, içerik önizlemesi, gönderim denemesi, yerel geçmiş. WhatsApp konuşmasında cevap denemesi. Hiçbir harici mesaj gönderilmez. |
| Öğrenci belgeleri | Satış ve belge türü seçimi, PDF/PNG/JPEG/WebP yükleme, tür/içerik/boyut kontrolü, önizleme, düzenlemeye dönüş, saklama ve indirme. İmza var işareti ve tarih; dijital imza üretilmez. |
| Bildirimler | Üst menü ve bildirim sayfası ortak veri kullanır; okundu/okunmadı, tür/arama, tümünü okundu yapma, hedefe gitme ve kategori tercihleri. |
| Hesap/ayarlar | Bildirim tercihleri, şifre formu kontrolü, servis alanlarının doğrulanması ve gizli anahtarları saklamadan taslak kaydı; tenant ayar taslakları. |
| Giriş/yenileme/yoklama | Önizleme sınırı açık olan etkileşimli formlar. Kaynak rol sırası Öğrenci/Öğretmen/Personel. Kaynak girişte 6 karakter, yenilemede ayrıca büyük/küçük harf ve rakam; eksik reset tokenı durumu. Yoklamada telefon ve kod adımları; gerçek SMS veya devam kaydı yok. |
| Dışa aktarma | Ortak tablo menüsünde filtrelenmiş/seçilmiş kayıtlar için XLSX eklendi. CSV/JSON korundu. Türkçe karakterler ve sayısal değerler korunur; kullanıcı metni Excel formülüne dönüşmez. |
| Takvim | Düzenleme modunda boş alanda aralık seçimi, dersi sürükleme, süreyi fare/klavyeyle değiştirme. Değişiklik önce mevcut ders formunda incelenir. Gece yarısında görüntü için bölünen dersin asıl kimliği ve süresi korunur. |
| Ortak görünüm | İsteğe bağlı form bölümlerinin üst boşluğu; hover ile input arka planı değiştirme kaldırıldı; focus yüzeyi soft kalır. Portal/ödeme aksiyonlarında dar alan düzeni, takvimde iç içe interaktif düğme ve eksik SVG sembolleri düzeltildi. |

## Önceki isteklerin korunma durumu

| İstek grubu | Kod karşılığı ve kabul sınırı |
| --- | --- |
| İlk HTML'nin soft dili, sarı vurgu ve cam yüzeyler | Tema ve sayfa yüzeyleri korundu. Yeni ekranlar ortak Card/Input/Dialog/Select/Tab/DataTable kullanır. Gerçek ekran görüntüsüyle son karşılaştırma yapılamadı. |
| Sidebar tek parça, sola hizalı, içeriği ezmeden açılma | Önceki ortak sidebar/overlay ve dokunmatik Sheet çözümü korundu. Yeni ödeme/portal akışları sidebar yerleşimini değiştirmez. Hover koordinat kabulü açık. |
| Gerçek adresler, kalıcı çalışma sekmeleri, yoğunluk | Kaynak adres eşlemeleri, kapatma, geri dönüş filtreleri, ikon→padding→font daralması ve açık sayfalar menüsü korundu. Sekme aralığı ayarı eklenmedi. |
| Sağ panel | Sticky ve viewport sınırı, iç scroll; önizlemede ileri/geri/kapat; önizleme sırasında günlük akış/JamAI gizli. Akıllı öneriler JamAI içindedir. |
| Mobil navbar/drawer/klavye | Önceki safe-area, visualViewport, sabit dialog header/footer ve ileri/geri/kapat araçları korundu. Uzun formlar ortak kaydırılabilir gövdeyi kullanır. Gerçek iOS/Android klavye kabulü açık. |
| Küçük kartlar/uzun tutarlar, tablo hover ve ikon aksiyonları | Mevcut taşma sınırlamaları ve ortak tablo düzeni korundu; yeni portal/ödeme alanları sarılabilir. Takvim kısa etkinlik yoğunluğu ve buton yapısı ayrıca düzeltildi. Cihaz ölçümü yapılmadı. |
| Telefon/profil resmi/alan doğrulama | Ortak ülke kodlu telefon ve profil görseli inputları korundu; belgeler ayrı dosya doğrulayıcı kullanır. Kayıt önizlemesi, düzeltme, koşullu alanlar ve zorunlu/isteğe bağlı sıralaması SSR kontrollerindedir. |
| Ölçek ve yükleme | %70–150 seçenekleri, ilk açılış Breathing orb ve hazır rotaların beklemeden render edilmesi korundu. Yeni sayfa geçişlerine yapay bekleme veya orb eklenmedi. |

## Doğrulama kanıtı

- `npm test`: **175 geçti, 0 hata**. Ödeme tamamla/ret/iptal/yenileme/tekrar tahsilat koruması, şube ayrımı, kaydedilmeyen kart verisi; teslim/iade/yeniden teslim/not döngüsü; atanmadığı aktiviteye teslimi reddetme; kaynak parola kuralları; takvim koordinatı/gece yarısı; belge türü; XLSX içerikleri.
- `npm run check:pages`: **115** mevcut navigasyon hedefi dolu/boş veriyle; **154** kaynak route kalıbının doğru bileşen ailesi; **42** rapor yaprağı; **115** hazırlanmış rotada ilk ve tekrar render'da Suspense fallback yok. Eski logdaki sabit `117` ifadesi gerçek katalog uzunluğu ile değiştirildi.
- Yeni SSR durumları: örnek ödeme kontrolü, öğrenci teslim alanı, öğretmen detay/teslim ayrımı, portal duyurusu, hesap şifresi, giriş rolü, eksik/geçerli reset bağlantısı, yoklama kod adımı ve takvimde iç içe düğme olmaması.
- XLSX ayrıca bağımsız `openpyxl` ile açıldı: Türkçe metin, sayısal tutar, formül gibi başlayan düz metin, sabit başlık ve filtre aralığı doğrulandı.
- TypeScript + Sites/Vite üretim derlemesi ve `git diff --check` başarılı. Bootstrap **698,81 kB / 209,47 kB gzip**, app **100,94 kB / 29,60 kB gzip**. XLSX **11,96 kB** ayrı ve yalnız dışa aktarımda yüklenir. 500 kB uyarısı sürer; ağ/cihaz performansı ölçümü değildir.
- İzinli tarayıcı önizlemesinde önceki `ERR_BLOCKED_BY_CLIENT` engeli sürmektedir; alternatif erişimle aşılmadı. SSR, gerçek fare/touch/klavye/TV veya görsel kabul yerine sayılmaz.

## Sunumda deneme sırası

1. `/payment`: kalem seç → devam et → kayıtlı adres/kartla adımları ilerlet veya “Deneme bilgilerini doldur” → kontrol/onay → doğrulamayı onayla. Merkez/geçmişe dön.
2. Aynı merkezde ödeme denemesini sıfırla; kart reddi ve sonuç bekleniyor senaryolarını ayrı ayrı seç. Ret sonrası borcun açık kaldığını ve yeniden denenebildiğini kontrol et.
3. `/student/activities/activity-speaking`: Elif Yılmaz profiliyle çalışma teslim et. `/teacher/activities/activity-speaking/submissions`: Selin Demir profiliyle düzeltme iste; öğrenci tekrar teslim etsin; öğretmen not versin. Öğrenci not/geri bildirimini görür.
4. `/admin/activities`: yeni çalışma kaydet; listeden toplu yayımla/çoğalt/arşivle. Öğretmen duyurusunu öğrenci portalında kontrol et.
5. Öğrenci detayında belgelerden satışa bağlı dosya yükle, önizle, düzenle, kaydet ve indir. İletişimde alıcı/içerik önizlemesinden gönderimi dene; geçmişi aç.
6. Takvim → Düzenle: aralık seç veya dersi taşı; açılan formda tarih/süreyi kontrol etmeden kaydetme. Tablo dışa aktarımından Excel indir.

## Prototipten sonra kalan gerçek bağımlılıklar

Bu paketten sonra da gerçek auth/OTP/şifre/abonelikten çıkış, ödeme sağlayıcısı/3DS/webhook/idempotency, mesaj gönderimi, dijital imza/dosya servisi, otomasyon işçisi, LLM ve sunucu yetki/tenant izolasyonu bağlı değildir. Yerel notlar, ayarlar, dosyalar ve kayıtlar cihazlar arasında senkronize olmaz. Kart denemeleri gerçek finansal işlem değildir.

Kaynak raporlarındaki bonus, dondurma, iptal/iade, lifecycle ve sunucu risk eşikleri gibi mevcut koleksiyonların karşılamadığı alanlar için veri alınamadı durumu korunur. Route bulunması bu işlevlerin canlı veya birebir tamam olduğu anlamına gelmez. Bunları yanlış rakamlarla dolu göstermedik.

Kalan kabul: 320–3840 px gerçek tarayıcı matrisi, Safari/Windows ölçek, iOS/Android klavye ve drawer, ekran okuyucu/%200 zoom, 10.000 kayıt/16 sekme ve yoğun takvim performansı, iki gerçek kullanıcı/şube ile API izinleri. Bu kapılar kapanmadan “production hazır” denmemeli.
