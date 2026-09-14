En güncel inceleme: [14 Eylül UI ve iş akışları](ui-workflows-2026-09-14.md). Bu kayıt, aşağıdaki eski tamamlanma iddialarından önceliklidir.

# Güncel kayıt

[14 Eylül kalan işler uygulaması ve açık kabul sınırları](completion-ledger-2026-09-14.md) güncel durumdur. Aşağıdaki kayıtlar önceki paketlerin tarihçesidir.

# Jamaster UI — uygulama ve kabul kaydı

**Güncel UI paketi:** [14 Eylül soft erişim ve eksik akışlar](soft-access-completion-2026-09-14.md): 134 menü hedefi, 183 test; yeni ekranlar alt sidebar menüsünde. Takvim fullscreen/taslak/query/gece devamı ve yardım focus/rol sorunları kapatıldı.

**14 Eylül ek paketi:** [Rol bazlı erişim ve yardım](access-help-2026-09-14.md): 36 rehber, 17 erişim ekranı; 179 test, 114 menü hedefi.

**Son paket — prototip akışları:** [10 Eylül ödeme/portal/aktivite/iletişim/belge tamamlaması](prototype-completion-2026-09-10.md). 175 test; 115 menü hedefi; 154 kaynak adresi ve 42 rapor yaprağı. Önceki kayıtlardaki ödeme, aktivite teslim/değerlendirme, iletişim denemesi ve XLSX beklemelerinin yerel karşılıkları bu pakette uygulandı. Canlı servis ve gerçek cihaz kabulü ayrı açık kalır. Aşağıdaki eski kayıtlar tarihçedir.

**Güncel devam: 10 Eylül 2026.** [Sayfa açılışındaki yükleme gecikmesi](navigation-loading-2026-09-10.md): ortak rota çözümü, niyet/boşta ön yükleme, hazır modülleri bekletmeden render ve geçişte boşalan içerik sınırının kaldırılması; 139 test, 117 gerçek route için ilk/tekrar hazır render kontrolü. [Öğrenci bilgileri, geçmiş ve tablo işlemleri](student-workflows-2026-09-10.md): yerinde bilgi düzenleme, kaynak geçmiş filtreleri, belge satış seçimi, güvenli toplu CSV/JSON. [Önceki kaynak eşleme kaydı](completion-2026-09-10.md): 154 kaynak adresi, 42 rapor alt sayfası, sticky önizleme ve yoğun sekmeler. Aşağıdaki 9 Eylül kayıtları tarihî paket durumudur. Servis ve cihaz kabulü hâlâ açıktır.

9 Eylül 2026. Çalışma dalı: `ui/completion-2026-09-09`. Kaynak karşılaştırması: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Başlangıç plan commit'i: `bf41a70`; bu paket öncesi yayın: v12 / `df0a522701164f643d356dff96b6fc581b4c6cbe` (başarılı).

Kullanıcının “ok go” onayıyla uygulama başladı. Bu kayıt tamamlanmış ürün beyanı değildir. Aşağıdaki kod değişiklikleri yapıldı; görsel/cihaz kabulü ve kaynakla tam işlev eşliği açık. İlk dört paket v12 olarak yayımlandı. Bu kaydın devamındaki beşinci paket aynı Site için yeni yayına hazırlanıyor; yayın sonucu Sites kaydında izlenir.

İlk uygulama paketi `81d9948` commit'iyle çalışma dalına kaydedildi. İkinci paket (`fa00419`) eğitim kataloğu/seviyeler, öğrenci finansı ve ayar kapsamını içerir. Üçüncü paket (`02dc905`) takvim/yoklama ve grup/öğretmen detay yönlendirmelerini kapsar. Dördüncü paket çoklu grup üyeliği ve grup öğretmen atamalarını ekler; aşağıdaki kayıt bu paketleri birlikte izler. Beşinci paket `ui-refinement-notes-schedule.md` içinde belgelenmiştir.

## Uygulanan değişiklikler

- Beşinci paket: JamAI önerileri/kısayollar, önceki üst sekme stili, ikon tablo aksiyonları, yalnız ilk açılış orb'u, isteğe bağlı alanların üst boşluğu; gerçek grup notları ve toplu ders programı sayfaları. Kaynak alanları, tarih/saat doğrulaması, kayıt önizlemesi, çakışma uyarıları ve atomik kayıt eklendi. Ayrıntılar `ui-refinement-notes-schedule.md` içinde.

- Dördüncü paket: kimlik tabanlı çoklu grup üyeliği, bir kez çalışan eski kayıt geçişi, neden/tarih içeren ekleme-çıkarma dialogları, öğrenci grup geçmişi ve grup öğretmenleri alt sayfası eklendi. Liste/filtre/rapor/önizleme/yoklama tüketicileri ortak üyelik kaynağına bağlandı. Öğretmen atama tarih/kimlik değişmezliği ve sınıf öğretmeni rol geçişi korundu. Ayrıntılar `group-membership-implementation.md` içinde.

- Route eşleme pathname üzerinden yapılıyor. Query filtreleri route'u bozmaz; grup/öğretmen/personel edit istekleri yeniden açılır. Kaynak personel `staffId`, kullanıcı/şube `id` düzenleme adresleri okunur. Yanlış ID boş yeni kayda dönüşmez.
- Sayfa state'i route/şube değişiminde önceki değeri yeni anahtara yazmaz. Öğretmen, ödeme durumu, görüşme tarih aralığı ve yoklama oturumu URL filtreleriyle eşlenir. Yoklama tarih/oturum değişikliği atomiktir.
- Ölçek seçeneklerine %70, %75 ve %80 eklendi. Geçersiz ölçek yazılmaz. Mobilde kullanıcı ölçeği iptal edilmiyor; coarse pointer inputlarında fiziksel yazı/hedef alt sınırı korunuyor.
- Küçük sayfa bağlantılarındaki dekoratif alt çizgi kaldırıldı. Çalışma sekmesi maskesi güncel referans eğrisine göre değiştirildi. X metnin yanında mevcut soft zeminiyle korunuyor; query içeren sekmeler doğru başlık buluyor.
- Sidebar açılıp kapanırken aynı navigasyon ağacı ve satır geometrisi kullanılıyor. Açılmış alt menüler kapanışta yok olmuyor. Arama/isim/rol sola yaslı; avatar, arama ve link ikonları aynı sütuna oturuyor. Profil dropdown'ı açıkken hover kapanışı duruyor. Mobilde menü genişliği içerik sınırına uyuyor ve uzun etiketler satıra geçiyor.
- `thinking-orbs@0.3.1` gerçek app/route Suspense yükleme sınırlarında `breathing` olarak eklendi. Reduced motion ve arka plan sekmesinde animasyon duruyor; yapay bekleme yok. Sayfalar ayrı lazy chunk'lara ayrıldı.
- `react-phone-number-input@3.4.18`: ülke/arama kodu seçicisi, arama, uluslararası yapıştırma, E.164 değer API'si, shadcn Popover/Command kompozisyonu. Mevcut maskeli telefon değişene kadar korunuyor. Ortak telefon kullanan formlar değer API'sine geçirildi.
- Kayıtta öğrenci/eğitim tipi, görüşme tipi ve sonucu açık seçim bekler. Kaynakta opsiyonel danışman/eğitim/sebep alanları zorunlu yapılmıyor. Kaynak enum'lu olumsuz sebepler iki formun farklı kodlarına normalize edilir. Olumsuz görüşmede 1–5 seçimi korunur. Opsiyonel sebep alt bölüme taşındı.
- Profil düzeltmesi eski eksik kayıt/görüşmeyi yeniden doldurmayı zorlamıyor; değişen iletişim alanları doğrulanıyor. Cinsiyet, kan grubu, medeni durum ve ayrı kişisel meslek alanları eklendi. Kaynak/kurum/şirket alanları yeni değer kabul eden combobox; isimden e-posta oluşturma eklendi. Eksik danışman kendiliğinden başka bir kullanıcıya atanmıyor.
- Görüşme geçmişi en yeni yedi kayıt; rapor gezinmesi sınırda durur. Dün başlayan kaynak tarih alt sınırı date inputunda bulunur. Tarih sorgusu kaynakta istendiğinde görüşme tarihini kullanır.
- Takvim ay/hafta/gün/liste, görünüm/düzenleme, ders tipi/öğretmen/derslik filtreleri; mobilde hafta listesi. Ders ekleme, düzenleme, iptal durumu ve onaylı silme eklendi. Gece yarısı gösterim segmentleri aynı ders kimliğini korur; öğretmen düzeltmesi mevcut atamayı kaybetmez. Kısa etkinlik yoğunluğu azaltıldı.
- `/admin/groups/:id/polling` artık gerçek manuel yoklama ekranına açılır. Takvim detayından tarih ve oturum taşınır. Öğrenci yoklama linki `/history?tab=polling` kullanır; eski adres hâlâ çalışır.
- İptal edilmiş dersler günlük akış/bugünkü ders/JamAI gündeminden çıkar. Bildirimde sabit “7 Eylül” hesabı kaldırıldı. Bugünkü görüşme önerisi bugünün tarih filtresini açar.
- Banka hesapları ID'li ayrı kayıtlar: yeni/edit/default/aktiflik/onaylı silme, taslak değiştirme onayı, kaynak zorunlulukları, opsiyonel IBAN ve legacy geçiş. Son hesap silinince legacy hesap yeniden ortaya çıkmaz.
- Kurum adı ayarı seçili şube adını değiştirmez. iyzico sandbox/canlı ortam seçimi eklendi; anahtarlar tarayıcı depolamasına yazılmaz, bağlı olmayan servis için sahte test başarısı üretilmez.
- Şube formu kaynak alanlarıyla ayrıldı: adres, e-posta/telefon, aylık ödeme, ödeme günü, ACTIVE/INACTIVE/SUSPENDED/CLOSED, açıklama/site, para birimleri/dil ve ödeme açıklaması. Kaydet/edit ID ve alanları korur. Üst şube seçici sabit üç ad yerine şube koleksiyonunu okur.
- Personelde zorunlu telefon/e-posta, seçimli şube, opsiyonel unvan ve doğru durum seçenekleri. Maaş/prim bölümü yalnız personelde görünür; prim yüzdesi kayıt sınırında oran değerine dönüşür. Kullanıcı kaydı sonrası detay açılır.
- Gecikmiş alacaklar satış toplamı yerine vadesi geçmiş taksitleri gösterir. Ek indirimsiz satışlar gerçekten filtrelenir. Satış lifecycle durumu ödeme bakiyesinden türetilmez. Mevcut verinin hesaplayamadığı özel raporlar bütün satışları göstermez; veri alınamaması gerçek sıfır sonuçtan ayrılır. Eğitim görüşme raporu ana görüşme ajandasına düşmez; danışmansız öğrenciler filtrelenir, detay aksiyonları profil açar.
- Kod incelemesinde bulunan dört regresyon düzeltildi: ders düzenleme mevcut dersliği korur; şube satırına e-posta eklemek eski yetkili bilgisini ezmez; ders türü/durumu kayıt sınırında doğrulanır; gece yarısını aşan dersin bitiş tarihi edit/iptal işleminde korunur.
- Eğitim, süre/bonus dönemi, program dönemi ve müfredat ayrı kaynak formlarına ayrıldı. Süre dönemi WEEK/MONTH ve bonus hakkını tutar; program dönemi başlangıç/bitiş tarihini tutar. Katalog kimlikleri rename/reorder sırasında korunur; ilişkili kayıt silme kontrolü, aktiflik, URL filtreleri, CSV, mobil aksiyonlar ve önizlemeli sabit footer bulunur.
- Seviye/alt seviye eğitimden bağımsız ortak katalog oldu. Kaynak `/super/settings?tab=level` adresinde düzenlenir. Uydurma `.1/.2` seçenekleri kaldırıldı; mevcut ad/ID ilişkileri korunur. Grup, kayıt, fiyatlandırma ve müfredat seçenekleri canlı katalogları okur.
- Yeni grup ve öğrenci atamalarında pasif/silinmiş seviyeler ve alt seviyeler kayıt doğrulamasında reddedilir. Değişmeyen eski çiftler korunur; opsiyonel boş öğrenci tercihi zorunluya dönüşmez. Aynı normalize eğitim adına yeni kayıt/yeniden adlandırma reddedilir. Eski müfredatta temizlenen seviye ve ders sayısı tarihî hücrelerden geri gelmez.
- Öğrenci finansı `courses`, `saleHistory`, `installments` ve tahsilat görünümlerine ayrıldı. Satış ID'si, arama ve tarih/durum filtreleri uygulanır. Aynı URL filtresiyle alt görünüm değiştirildiğinde filtre yeni görünümün hafızasına da yazılır.
- Taksit aksiyonundan eklenen tahsilat seçilen taksite işlenir; geçmiş havuz ödemelerinin dağılımı korunur. Hedef taksit bakiyesi, kuruş toplamı, ödeme yöntemi ve aktif TRY banka hesabı kayıt sınırında kontrol edilir. Tahsilat formunda önizleme/son onay, banka hesabı ve opsiyonel not vardır.
- Öğrenci yoklama geçmişine tarih filtresi, CSV, bilinen seviye/derslik/giriş alanları eklendi. Manuel işaretleme sahte giriş saati üretmez; iptal edilen dersin yoklaması değiştirilemez. Eski polling-history adresi gerçek içerik göstererek kanonik adrese geçer.
- Yeni dersin opsiyonel eğitim seçimi katalog kimliğini kullanır. Eski ad temelli ders ilişkileri yalnız tek bir eşleşme varsa çözülür; belirsiz değerler kendiliğinden başka eğitime atanmaz.
- Kullanıcı, şube ve süper yönetici ayar menüleri ayrıldı. Süper genel ayarlarda kaynak kurum/durum, AI, servis çözümleme ve onay tercihleri; sağlayıcı alt görünümlerinde doğru formlar bulunur. SMTP güvenliği SSL/TLS/şifrelemesiz seçimidir. Sunucuya bağlı olmayan güvenlik ve servis ayarları sahte kayıt başarısı üretmez.

- Üçüncü paket: yoklama merkezi ile grup güncel/geçmiş ekranları ayrıldı; tarih/tip/durum/sıralama, roster ayrıntıları ve CSV/JSON eklendi. Silinen veya yeniden planlanan derslerin snapshot'ları korunur; özel ders öğrenci seçimi ve yanlış oturum koruması vardır. Kaydedilmiş dersin zaman/katılımcı değişikliği ve başka şubede kaydı olan event'in yeniden işaretlenmesi engellenir.
- Grup `/schedule` ve öğretmen `/history?tab=schedule` ilgili takvimi açar; yeni ders bağlamı aktarılır. Source form query ID'leri ve telefon ön doldurması okunur. Yanlış form kimliği yeni kayıt oluşturmaz. Ayrıntılar [üçüncü paket kaydında](calendar-detail-implementation.md).

## Kanıt ve sınırlar

- Son kapanış kontrolü: `npm test` **113 geçti / 0 hata**; `npm run build` başarılı; `npm run check:pages` başarılı; `git diff --check` temiz. 113 hedef dolu/boş koleksiyonlarla, altı süper ayar query bölümü, kullanıcı kapsamı ve eski öğrenci alt adreslerinin gerçek içerikleri kontrol edildi. Grup/öğretmen scoped takvim, yoklama geçmişi, yeni grup öğretmenleri/öğrenci grupları alt sayfaları ve yanlış form kimliği/tarih/oturum durumları da render edildi. Grup notları/filtreleri, toplu program, yanlış satış kimliği, takvim tarih aktarımı ve JamAI öneri yerleşimi de kontroldedir. Bunlar cihaz kabulü değildir.
- Statik render gerçek React sayfa implementasyonlarını önceden yükler; lazy fallback'i sayfa kontrolü olarak saymaz. Bu kontrol DOM/etiket/kompozisyon hatalarını yakalar; mouse, ölçüm, portal, gerçek klavye ya da görsel sonuç kanıtı değildir.
- Son build'de app chunk 106,64 kB, ana bootstrap chunk 641,43 kB, ortak input chunk 173,00 kB. Vite 500 kB uyarısı hâlâ var. Bunlar toplam ilk yük/ağ/runtime performans ölçümü değildir; performans kabulü açık.
- Kapsamlı kod incelemesindeki beş katalog bulgusu kapandı: normalize ad çakışması, temizlenen eski seviye/ders sayısının geri gelmesi, derslerin eğitim silme korumasından kaçması ve silinmiş seviyeye yeni atama. Eski ad temelli dersler tek eşleşmede kimliğe taşınır; belirsiz ilişkiler silme/yeniden adlandırmayı engeller. Filtre senkronizasyonu sekme kimliğini ve açıkça boşaltılmış URL parametresini de ayırt eder. Bu sonuç inceleme kapsamına aittir, bütün ürünün hatasızlığı beyanı değildir.
- Sites preview süreci çalışır durumdayken izinli tarayıcı adresi `ERR_BLOCKED_BY_CLIENT` döndürdü. Sites preview troubleshooting sınırı izlendi; farklı host/port/tarayıcı yolu denenmedi. Görsel kabul, input'a yaklaşma hatasının yeniden üretimi, cihaz/OS ölçek ölçümü ve screenshot kanıtları bu nedenle **BLOKE**.
- Workspace ve Operations ders/öğrenci/grup koleksiyonları hâlâ globaldir; şube adı seçimi veri yüklemesi veya sahiplik oluşturmaz. Yeni yoklama çakışma koruması yalnız başka şubede zaten kaydedilmiş aynı event'i engeller. Tam branch izolasyonu ve ilk kaydın sahipliği hâlâ üretim engelidir.
- Auth, şube erişimi, API, ödeme, mesaj gönderimi, JamAI ve dosya hizmetleri mevcut yerel modelle production bağlantısı kazanmış değildir. Local/session storage kayıtları gerçek servis entegrasyonu diye sunulamaz.

## Plan görevlerinin durumu

| Görev                      | Durum                                                                                | Kalan somut iş                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Route/query              | Kısmen uygulandı                                                                     | Tüm kaynak query parametreleri ve alt sayfa varsayılanları; çalışan tarayıcıda geri/ileri, draft ve çok sekme senaryosu.                                       |
| 2 Sayfa/alan envanteri     | Araştırma kaydı var                                                                  | `route-inventory.json` içindeki incelenmemiş hedefler; her aksiyon ve filtrenin tek tek kabulü. 113 hedefin render edilmesi eşlik kabulü değildir.             |
| 3 Soft/responsive/loading  | Kod değişti, görsel kabul bloke                                                      | Kart büyük tutar/uzun ad ölçümleri; cam/border karşılaştırması; tüm ölçek hitbox ve loader cihaz ölçümleri.                                                    |
| 4 Sidebar/sekme            | Kod değişti, görsel kabul bloke                                                      | 3/8/16 sekme, hover/touch/focus, tüm linkler ve profil menüsü, gerçek koordinat karşılaştırması.                                                               |
| 5 Sağ panel                | Mevcut altyapı korundu, bazı bağlantılar düzeltildi                                  | Öneriler JamAI’ye taşındı; devam eşiği raporla %90 oldu. Tam yükseklik/scroll ölçümü; 4 entity tek/çift tık; sunucu eşikleri hâlâ kabul bekliyor.              |
| 6 Alanlar                  | Kataloglar ve telefon alanı uygulandı                                                | Country combobox focus dönüşü/telefon caret kabulü; bütün sayfaların kalan alan taraması.                                                                      |
| 7 Dialog/klavye            | Mevcut ortak footer ve toolbar korundu                                               | Gerçek iOS/Android klavye, nested dialog, unsaved close/back, footer/visualViewport kabulü.                                                                    |
| 8 Detaylar                 | Edit, scoped takvim, çoklu üyelik/işlem geçmişi ve öğretmen atamaları uygulandı      | Aktif satış lookup/onayı, özel ders tercihlerinin sunucudan yüklenmesi; öğretmen kişisel/sertifika/öğrenci/maaş/geçmiş datasetleri; personel izin dalları.     |
| 9 Kayıt/görüşme            | Kaynak doğrulama ve seçim farkları düzeltildi                                        | Rapor bağlamında filtrelenmiş öğrenci sırası; JamAI tercih kalıcılığı; kaynakla bütün create/edit koşulları.                                                   |
| 10 Takvim/yoklama          | Takvim/editor, yerel yoklama merkezi, grup current/past ve öğrenci geçmişi uygulandı | Gerçek branch dataset/QR dashboard, polling/schedule kimliği, polling window ve receiver; drag/resize/range select; gerçek check-in ve devam paydası kaynağı.  |
| 11 Tablolar/filtreler      | Mobil açma ve unavailable durumu eklendi                                             | Çoklu kaynak filtreleri ve URL eşliği tüm sayfalarda; hover genişliği ölçümü; 10.000 kayıt performansı.                                                        |
| 12 Rapor/öneri             | Yanlış bazı sonuçlar durduruldu                                                      | Kaynak leaf kolonları/summary/chart/export; tarih/lifecycle/bonus/freeze/transfer datasets; server-owned eşikler. Aşağıdaki araştırma dosyaları uygulanmalı.   |
| 13 Ayarlar                 | Kapsam ayrımı, alanlar ve banka/tahsilat bağlantısı uygulandı                        | Sunucudan tenant/branch inheritance yükleme; güvenli servis kaydı/testi; ID bazlı branch scope ve yetki uygulaması.                                            |
| 14 Eğitim/müfredat         | Kaynak tipli dört form ve ortak katalog uygulandı                                    | Gerçek program/akademik dönem datası; eksik legacy ilişkilerin kullanıcı tarafından tamamlanması; görsel/etkileşim kabulü.                                     |
| 15 Finans/iletişim/yönetim | Kısmen incelendi                                                                     | Personel accessibleBranches, branchPermissions/permission sets ve güvenli parola akışı; gerçek ödeme/iptal/iade; kalan yönetim ve iletişim kaynak aksiyonları. |
| 16 Cihaz/performance       | Otomatik kontroller; görsel kapı bloke                                               | Tarayıcı erişimi, cihaz matrisi, erişilebilirlik ve gerçek performans kanıtı.                                                                                  |
| 17 Üretim                  | Açık                                                                                 | Auth/API/kapsam/servis entegrasyonu ve gerçek iki kullanıcı/şube kabulü.                                                                                       |

## İzlenecek kaynak kayıtları

- [Form karşılaştırması](source-forms.md)
- [Takvim/yoklama sözleşmesi](source-calendar.md)
- [Sidebar, personel, şube ve ayarlar](source-inventory.md)
- [Eğitim raporları](education-reports.md)
- [Finans raporları](finance-reports.md)
- [Eğitim ve ortak seviyeler uygulaması](learning-implementation.md)
- [Öğrenci finansı ve ayarlar uygulaması](finance-settings-implementation.md)
- [Grup/öğretmen kaynak detay aksiyonları](source-detail-actions.md)
- [Takvim/yoklama ve detay yönlendirme uygulaması](calendar-detail-implementation.md)
- [Grup üyelikleri ve öğretmen atamaları](group-membership-implementation.md)
- [Tam uygulama planı](../superpowers/plans/2026-09-09-ui-completion-plan.md)

Önizleme erişimi açıldıktan sonra ilk kabul sırası: ortak sidebar/sekme/scale → telefon ve uzun dialog/klavye → kayıt/görüşme/edit → takvim/yoklama → banka/personel/şube. Görsel kabul ayrıca tamamlanmalı; servis bağımlılıkları açıkken “production hazır” denmemeli.

## 10 Eylül — Birleşik ödeme merkezi ve mobil araçlar

- Kaynak main yeniden incelendi; `/payment` merkezi, bağlantı checkout adımları, kayıtlı kartlar/geçmiş, eski adreslerin uyumu ve collector şube ödemeleri doğru bileşenlere taşındı. Ayrıntılı kaynak/alan karşılaştırması: [payment-center-2026-09-10.md](payment-center-2026-09-10.md).
- Drawer genişlik/yükseklik/safe-area, klavye koordinatı, mobil navbar araçları ve odak iadesi düzenlendi. Standalone query değişimi sayfayı yeniden mount etmiyor.
- Şube ödeme sayfasındaki öğrenci satış defteri eşleşmesi kaldırıldı; sunucu sayfaları ikinci kez bölünmüyor.
- 150 birim testi başarılı; 154 kaynak rota/42 rapor yapısı ve ödeme alanlarının SSR kontrolleri başarılı. Gerçek cihaz/klavye kabulü tarayıcı erişim engeli nedeniyle açık.
- Auth/API ve banka bağlantısı mevcut olmadığından ödeme servisi varsayılan olarak kapalı. Gerçek ödeme veya kart saklama yapıldığı iddia edilmez; bağlantı eksikliği görünürdür.

## 10 Eylül — Ödeme hata akışları ve mobil form devam incelemesi

- Başarısız manuel kontrolün eski OPEN ile ödeme girişini açması giderildi; eski sorgular ayrıldı. 409/408 ve belirsiz iptal/ödeme sonuçları doğrulama bekler. Enter ile adım atlama da düğmeyle aynı koşullara bağlıdır.
- Tahsilat formu kaynakla tekrar karşılaştırıldı: ret sonrası düzenleme, tarih/referans doğrulaması, her açılışta güncel ödeme/tutar kontrolü, kaydırılabilir gövde ve sabit footer düzeltildi.
- Ödeme arama/durum filtreleri URL'de korunur. Kodlanmış token bir kez çözülür; bozuk bağlantı isteğe dönüşmez.
- Drawer klavye araç çubuğu alt kenara bağlandı; pinch zoom yanlış klavye tespiti giderildi. 159 birim testi ve tüm mevcut sayfa/rota SSR kontrolleri geçti. Gerçek cihaz kabulü ve servis entegrasyonları açık.
- Bulgular, kapsam ve doğrulama: [payment-recovery-2026-09-10.md](payment-recovery-2026-09-10.md).
