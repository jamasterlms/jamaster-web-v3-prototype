# Jamaster Workspace

React 19, Vite 8, TypeScript, Tailwind CSS 4 ve shadcn/ui ile Jamaster LMS çalışma alanı.

İlk tasarımdaki beyaz yüzeyler, pastel çevre zemini, kıvrımlı sayfa sekmeleri ve sade tipografi korunur. shadcn/Radix; dialog, menü, seçici, sekme, form, tablo ve sidebar davranışlarını sağlar. Görsel düzen tema tokenları ve uygulamaya ait CSS ile tanımlanır.

## Bu güncelleme

Son durum: [14 Eylül UI ve iş akışı incelemesi](docs/review/ui-workflows-2026-09-14.md). Önceki sunum adımları: [Prototip akışları — 10 Eylül](docs/review/prototype-completion-2026-09-10.md). `/payment` artık başarılı/ret/bekleyen ödeme denemeleri; adres/kart/kontrol/doğrulama/geçmiş adımlarını içerir. Aktivite yayımlama, öğrenci teslimi, öğretmen değerlendirmesi, iletişim önizlemesi, belge yükleme ve Excel dışa aktarma eklendi.

8 Eylül kapsamlı ürün arayüzü incelemesi, düzeltmeler ve açık cihaz/API kabul işleri `docs/production-ui-review.md` içindedir. Uzun formların zorunlu/isteğe bağlı ayrımı ve Jamaster-web karşılaştırması `docs/form-flow-review.md` içindedir. Önceki görsel kararlar `docs/design-review.md` içinde korunur.

- React Router ile `/admin/...` adresleri kullanılır. Hosting yapılandırmasında `single-page-application` geri dönüşü vardır; sayfa adresinden doğrudan açma ve yenileme desteklenir. Tek dosya HTML, `file://` altında MemoryRouter kullanır.
- Çalışma sekmeleri Genel grubuyla açılır; ziyaret edilen sayfalar eklenir, tekrar ziyaretlerde aynı sekme kullanılır. Sekmeler kapanabilir, daralabilir ve listeden seçilebilir. Kapatma düğmesi hover veya klavye odağında görünür; dokunmatik cihazlarda görünür kalır. Sayfa durumu ve filtreler şube/sayfa anahtarıyla `sessionStorage` içinde saklanır; sayfa ağacı arka planda açık tutulmaz.
- Sidebar kapalı ve açık durumda tek, kesintisiz bir cam paneldir. Dar menü ve tam menü aynı bağlantı elemanlarını kullanır; odak yeniden oluşturulmaz. Sağ araç alanı kapanabilir; mobilde Günlük akış ve JamAI alt çubuktan shadcn Drawer ile açılır.
- Tema kullanıcının verdiği ilk `Jamaster-Prototip.html` dosyasındaki renkleri kullanır: `#ffdb39` sarı vurgu, `#48424e` yazı, `#5b5062` erik tonu ve `#0da992` mint. Ölçek seçenekleri %70–150 aralığındadır; rem ölçüleri portal içeriğini de kapsar. Mobil ölçek okunabilirlik için %100’dür.
- Ek dialog, input ve select sarmalayıcıları kaldırıldı. Özelleştirilmiş shadcn Dialog, Dropdown Menu, Popover, Select, Input, Navigation Menu, Drawer ve Data Table bileşenleri kullanılır. Avatar/Badge/Progress de shadcn tabanlıdır. İş alanına ait kişi satırı ve başlık kompozisyonları ortak kalır.
- Tablo sütun menüsü birden çok seçime açıktır; mobil kartlarda toplu seçim ve sıralama kullanılır. Tarih aralığı filtresi seçimi açıkça gösterir, arama alanı tek düğmeyle temizlenebilir.
- Öğrenci, grup, öğretmen, gider, finans ve mesaj listelerinde shadcn Table/TanStack Table üzerinden sayfalama ve sütun görünürlüğü bulunur. Masaüstü tablo mobilde kartlara dönüşür. Öğrencilerde çoklu seçim ve CSV çıktısı vardır.
- Kayıt, grup, öğretmen, gider, fiyatlandırma ve iletişim alanları jamaster-web kaynaklarıyla karşılaştırıldı. Kaynak eşleştirmesi `docs/source-comparison.md` içinde tutulur.

- Kayıt ve profil düzenleme ortak alan/model kullanır. Tam önizleme, bölüm düzenleme, alan içi hata, doğum tarihi ve telefon kontrolü bulunur. Telefonlar ülke koduyla saklanır; mevcut maskeli telefon değişmeden korunabilir.
- Kampanya ayrıntıları, satışta yöntem indirimi ve taksit kuruş dağılımı aynı özet içinde kontrol edilir. Günlük araçlar ve takvim güncel tarihle çalışır; çakışan etkinlikler ayrı sütunlara yerleşir.

## Çalıştırma

Node.js 22.18 veya üzeri:

```sh
npm ci
npm run dev
```

```sh
npm run build
npm test
npm run check:pages
npm run preview
```

`check:pages` 134 güncel navigasyon hedefini dolu/boş veriyle, 154 kaynak adres kalıbını ve 42 rapor alt sayfasını statik React render ile kontrol eder. Hazırlanmış rotaların ilk/tekrar render sırasında ek bekleme göstermediğini doğrular. `npm test` 228 iş kuralı ve regresyon senaryosunu çalıştırır. Bunlar gerçek tarayıcı veya görsel test değildir.

## Proje düzeni

| Konum                         | Sorumluluk                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/app`                     | Uygulama kabuğu, yönlendirme, çalışma sekmeleri, görünüm tercihleri, ortak state/reducer                 |
| `src/components/ui`           | Resmî shadcn/ui bileşenleri                                                                              |
| `src/components/layout`       | Sidebar, üst çubuk, sayfa sekmeleri, günlük akış                                                         |
| `src/components/shared`       | Kişi satırı, bölüm başlığı, metrikler ve öğrenci seçimi                                                  |
| `src/features/dashboard`      | İlk tasarımın özet kartları, grafik ve akış bileşenleri                                                  |
| `src/features/students`       | Arama, filtreleme, kayıt adımları, öğrenci profili                                                       |
| `src/features/education`      | Grup listesi/detayı/atama, öğretmen kadrosu/programı, eğitimler, dönemler, müfredat                      |
| `src/features/calendar`       | Haftalık/günlük program, filtreler ve yoklama                                                            |
| `src/features/meetings`       | Görüşme gündemi, geçmiş, kayıt formu ve iş kuralları                                                     |
| `src/features/finance`        | Giderler, fiyat paketleri, satış, tahsilat, abonelik ve analiz sayfaları                                 |
| `src/features/communications` | Kanala göre mesajlar, şablonlar, alıcı ve içerik düzenleme                                               |
| `src/features/administration` | Ekip/şube, doğrulama, otomasyon, sözleşme, dosya, duyuru ve destek                                       |
| `src/features/settings`       | Her ayar kategorisine özel alanlar                                                                       |
| `src/features/insights`       | Rapor kataloğu, dağılımlar, eğitim raporu filtreleri                                                     |
| `src/features/operations`     | Tipli alan modelleri, güncelleme reducer’ı ve kayıt sağlayıcısı                                          |
| `src/features/jamai`          | Yerel öğrenci/gündem özetleri                                                                            |
| `src/styles`                  | Tema; temel bileşen, kabuk, sidebar, çalışma sekmeleri, sağ araçlar, dashboard, dialog ve sayfa stilleri |
| `src/data`                    | jamaster-web menü envanteri ve başlangıç kayıtları                                                       |
| `scripts`                     | Statik sayfa kontrolü ve paylaşılabilir dosya üretimi                                                    |

Genel `ModulePage` kaldırıldı. Alan sayfaları kendi bileşenleri ve işlemleriyle yönlendirilir. Ortak bileşenler görsel tutarlılığı sağlar.

## Görsel düzen ve etkileşimler

- Sayfa içi gezinme, başlık ve açıklamanın altında bireysel pill bağlantılar kullanır. Öğrenci durumlarının sayıları kayıtlardan hesaplanır.
- Cam efekti sidebar, pasif çalışma sekmeleri ve küçük gezinme kontrollerindedir. Beyaz veri yüzeyleri ve dialog içerikleri opaktır. Desteklemeyen tarayıcılarda ve azaltılmış saydamlık tercihinde opak alternatif kullanılır.

- Sidebar varsayılan dar görünür. Fareyle üzerine gelince içerik üzerine genişler; ana içerik genişliği değişmez. Dokunmatik ekranlarda düğmeyle açılır; mobilde shadcn Sheet kullanılır. Klavye ile odaklanınca da genişler.
- Sidebar’ın masaüstünde kaybolmasına neden olan eski global `.hidden { display:none!important }` kuralı kaldırıldı. Tailwind’in duyarlı görünürlük sınıfları korunur.
- Menü grupları ve 134 navigasyon hedefi kaynak adres envanteriyle kontrol edilir.
- Ortalanmış dialoglar 150 ms giriş, 120 ms çıkış animasyonu ve opaklık kullanan arka katmanla açılır. Blur kullanılmaz. Escape/odak tuzağı Radix tarafından sağlanır; azaltılmış hareket tercihi desteklenir.
- Günlük akış ve JamAI aynı yuvarlatılmış panelin iç başlığındaki küçük geçiş kontrolünü kullanır; dış sekmeler kaldırılmıştır. Arama logonun altında ve ⌘K/Ctrl+K ile açılır.
- Grup kapasitesi kontrol edilir; öğrenci ataması öğrenci kaydına yansır. Grup düzenlemesi ilgili öğrencileri günceller. Öğretmen adı değişince grup, öğrenci ve takvim bilgileri güncellenir.
- Görüşme formunda eksik sonuç ve tarih alanında hata ve odak yönlendirmesi vardır; notun karakter sayısı gösterilir. Görüşmeler mevcut doğrulama kurallarıyla geçmişe kaydedilir. Takip tarihi takvime eklenir. SMS taslağında başlık, alıcı ve tam mesaj içeriği korunur.
- Gider, fiyat paketi, satış, ödeme kaydı, mesaj şablonu, ekip bilgileri, duyuru, sözleşme ve otomasyon kuralları düzenlenebilir.
- Dosya ekranı güncel öğrenci/takvim CSV’lerini üretir; 2 MB’a kadar çalışma dosyaları tarayıcıya eklenip indirilebilir. Sözleşme metni ve destek taslakları indirilebilir.

## Entegrasyon sınırı

Bu, işlevsel bir **sunum prototipidir**. Başlangıç kayıtları tasarım içindir. Para, mesaj, parola ve doğrulama adımlarında gerçek işlem yapılmadığı açıkça belirtilir. Gerçek Jamaster veritabanına, ödeme sağlayıcısına veya mesaj gönderim servisine bağlı değildir; jamaster-web reposuna değişiklik yapılmadı.

Kayıtlar React state ve sürümlenmiş `localStorage` anahtarlarında tutulur. Aynı tarayıcı ve adres içinde yenilemeden sonra korunur; başka cihazlarla eşitlenmez. Tarayıcı depolaması engelliyse oturum içindeki işlemler çalışır. Şube değiştirmek arayüz bağlamını değiştirir; ayrı sunucu verisi veya yetki denetimi yüklemez.

JamAI yerel kurallarla özet üretir; LLM bağlantısı yoktur. Mesajlar taslak ve gönderim denemesi olarak saklanır; dışarıya gönderilmez. Otomasyon kuralları düzenlenir; arka planda zamanlanmış görev çalışmaz. Ödeme ekranı yerel kayıt oluşturur, para tahsil etmez. Dosyalar uzak sunucuya yüklenmez. Ekran kilidi kimlik doğrulaması değildir.

Eğitim ve finans raporları mevcut kayıtların karşılayabildiği alanları kullanır. Bonus, dondurma, lifecycle, iptal/iade ve sunucunun risk eşikleri gibi eksik veri aileleri için veri alınamadı durumu korunur. Öğrenci finansında çoklu satış, taksit ve kısmi tahsilat yerel defteri vardır; `/payment` şube/lisans ödeme akışı bundan ayrıdır. Gerçek ödeme, mutabakat ve iki kullanıcı/şube doğrulaması API entegrasyonu gerektirir.

Ödeme denemeleri şubeye göre `sessionStorage` içinde devam eder; ham kart numarası/CVC saklanmaz. Öğrenci ve öğretmen portallarındaki profil seçici sunum bağlamıdır, kimlik doğrulaması değildir. İzinli önizleme erişimi engellendiğinden son sürüm gerçek cihazlarda görsel olarak doğrulanamadı.

## Paylaşım

Üretim derlemesinden sonra:

```sh
node scripts/package-deliverables.mjs
```

- `deliverables/Jamaster-Prototip.html`: React uygulaması, CSS, logo, ikonlar ve fontlar gömülü tek dosya. Tarayıcıda doğrudan açılır.
- `deliverables/Jamaster-React-Vite.zip`: Kurulabilir proje kaynakları.

Bu revizyonda denetimli önizleme başlatıldı; tarayıcı erişimi `ERR_BLOCKED_BY_CLIENT` ile engellendi. Kaynak ve statik render incelemesi yapıldı; tarayıcıda görsel inceleme yapılamadı. Görsel/e2e doğrulama ve Safari/Mac cihaz testi tamamlanamadı. Üretim derlemesi, iş kuralları, statik sayfa render’ı ve çevrimdışı dosya bütünlüğü kontrol edildi.

shadcn/ui ve Lucide MIT lisanslıdır. Lisans metinleri proje kökünde bulunur.

### Rol bazlı yardım ve erişim ekranları

Sidebar footer'ındaki Yardım merkezi ve `/help`, role uygun 36 metinli Türkçe rehber arasından ilgili içeriği gösterir. Ortak PageHeading başlığındaki oynat ikonu sayfanın rehberini shadcn Dialog içinde açar. Videolar sessiz, 24 saniye, altyazılı ve bölüm atlamalıdır; dialog açılmadan oynatıcı yüklenmez. Katalog `src/features/help/tutorials.json`; dosyalar `public/tutorials` altında. Yeniden üretmek için `python3 scripts/generate-tutorial-videos.py --output /tmp/jamaster-tutorials` (Pillow + ffmpeg/ffprobe gerekir). Gerçek ekran kayıtları katalogdaki dosyalarla değiştirilebilir.

`/access/examples?role=student` ve `?role=teacher` giriş, hesap, oturum ve yetki durumlarını inceletir. Yanlış kimlik bilgisi, bağlantı hatası ve 30 saniyelik deneme sınırı login formunda; diğer durumlar erişim ekranlarında gösterilir. Bu bir UI prototipidir: gerçek kimlik doğrulama, e-posta/SMS, sunucu yetki kontrolü ve destek gönderimi yoktur. Kurtarma bağlantıları rol içinde ve aynı origin'de kalır. Eski `/admin/support` bağlantısı yardım merkezini açar; talep taslakları korunur.

Yeni ekranlara sidebar'ın **Uygulama ekranları** grubundan ulaşabilirsiniz. Giriş ve erişim ekranları ilk soft paletle yenilendi. Takvim filtreleri URL'de saklanır; fullscreen açılan dialogları gizlemez, değişmiş ders taslağı kapatılırken onay ister. Son inceleme: `docs/review/soft-access-completion-2026-09-14.md`.
