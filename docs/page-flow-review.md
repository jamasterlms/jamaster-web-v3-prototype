# Sayfa ve veri akışı incelemesi — 8 Eylül 2026

Bu tur, onaylanan soft tasarımı değiştirmeden sayfaların kayıt, düzenleme, geçmiş, filtre ve boş durumlarını ele alır. React/Vite ve özelleştirilmiş shadcn bileşenleri korunur. Yeni geçmiş listeleri masaüstünde Data Table, dar ekranlarda kart olarak sunulur. Zorunlu alanlar önce, görünüm ve diğer isteğe bağlı tercihler sonra gelir.

## Kaynak karşılaştırması

`jamasterlms/jamaster-web` deposundaki `7810bd1720c57749f6d5249536ba015f2a53694f` revizyonu okundu. Kaynak depoya yazılmadı.

| Kaynak | Doğrulanan davranış | Uygulanan düzeltme |
| --- | --- | --- |
| `hooks/main/group/group-polling.ts` | Yoklama `groupId`, `scheduleId`, öğrenci ve ders başlangıcına bağlı; durum `present`, `absent` veya `null` | Ders oturumuna bağlı kayıt; katıldı/katılmadı/bekliyor; tarihi olmayan eski durumlara ders tarihi atamama |
| `admin/groups/[groupId]/polling/_components/current-polling.tsx` | Öğrencinin belirli oturumdaki yoklaması düzenlenir; gelecek ders için henüz yoklama alınmaz | Ders, grup ve tarih seçimi; başlamamış dersin işaretleme/kaydetme işlemini kapatma |
| `admin/groups/[groupId]/polling/_components/past-polling.tsx` | Geçmiş oturumlar, katılım durumu ve kayıtlı öğrenciler ayrı incelenir | Geçmiş yoklamaya dönüş, öğrenci geçmişi, oturum öğrenci listesini koruma |
| `admin/reports/collections/config.tsx` | Ödeme tarihi, tutarı, ödeme yöntemi, danışman ve öğrenci ilişkisi | Tahsilatları öğrenci kayıt tarihinden ayırma; ödeme tarihi/yöntemi/danışman filtreleri |
| `components/forms/admin/contract-form.tsx` | Ad (3), açıklama (5), metin (10 karakter) ve iki görünüm tercihi; bu ekran şablon yönetimidir | Yanlış öğrenci belgesi formunu sözleşme şablonu formuna dönüştürme; önizleme ve fiyatlandırmaya bağlama |
| `admin/verification-requests/config.tsx` | Ayrı talep kimliği; işlem tipi, talep eden, tarih, PENDING/APPROVED/REJECTED; ret notu zorunlu | Öğrencilerden kendiliğinden talep üretmeyi kaldırma; durum filtresi, karar tarihi ve ret notu kontrolü |
| `components/forms/super/branch-form.tsx` | Ad/adres/telefon/e-posta, ödeme günü/tutarı, durum ve ek ayarlar | Kaynak farkı belgelendi; bu turdaki genel ekip formu düzeltmeleri aşağıda. Tam şube formu eşliği tamamlanmadı. |

`admin/...` kısaltmaları kaynakta `app/[locale]/(main)/admin/...` altındadır.

## Sayfa sayfa düzeltmeler

### Takvim ve yoklamalar

- Eski “Kaydet” işlemi yalnızca bildirim gösteriyordu; işaretler öğrenci kimliğine göre tek bir haritada tutuluyordu.
- Yeni yoklama kayıtları şube ve ders oturumu kimliğiyle ayrılır. Öğrenci işaretleri taslakta tutulur; kaydet ve değişiklikleri geri al işlemleri çalışır. Başka oturuma geçince taslaklar birbirine karışmaz.
- Bekleyen durum `null` olarak saklanır. Kaynak modelde olmayan “İzinli” artık bir yoklama sonucu olarak yazılmaz.
- Geçmiş yoklama düzenlendiğinde aynı kayıt güncellenir; ikinci bir kayıt sayılıp devam oranını şişirmez. Grup değişen öğrencinin eski yoklama kaydı korunur.
- Mevcut ders kayıtlarına açık grup ilişkileri eklendi. Kaydedilmiş eski etkinlikler yalnızca bilinen başlangıç kaydıyla kimlik, başlık ve tarih eşleşirse bu ilişkiyi alır.
- Takvimde hafta/gün görünümü değiştiğinde gösterilen dönem aynı tarihe bağlı kalır.

### Öğrenci profili ve gruplar

- `/admin/students/:id/payments`, `/polling-history` ve `/history` gerçek öğrenci alt sayfalarıdır. Satış ve tahsilat geçmişi ayrı listeler; yoklama geçmişi ders tarihi, grup ve durum gösterir.
- Detaydaki devam oranı kayıtlı yoklamalardan hesaplanır. Kayıt yoksa yüzde üretmek yerine boş durum gösterilir. Kalan bakiye tahsilatlardan hesaplanır.
- Atanmamış danışmana otomatik kişi adı yazılması kaldırıldı.
- Grup düzenlemesi üye bilgilerini ve gruba bağlı takvimdeki öğretmen/dersliği birlikte günceller.
- Gruba atama, aktif öğrenci ve aktif hedef grupla sınırlıdır; kapasite ve tekrar atama işlem anında yeniden kontrol edilir. Potansiyel kaydı bu düğme ile kendiliğinden aktif öğrenciye dönüştürmez.

### Görüşmeler

- Ay ve yıl etiketleri gerçek etkinlik tarihinden hesaplanır; “EYL” sabit etiketi ve seri gün numarasının takvim günü sanılması kaldırıldı.
- Planlanan görüşmeden açılan form ilgili etkinliği bilir. Sonuç kaydedildiğinde bu etkinlik tamamlanır; gerekiyorsa yeni takip etkinliği ayrı oluşturulur.
- Yeni görüşme etkinliği öğrenci kimliği ve öğrencinin kayıtlı danışmanını taşır. Aynı adlı kişilerin yanlış ilişkilendirilmesi azaltıldı.
- Geçmiş listesi araması öğrenci, tip, sonuç ve notu kapsar. Kayıt tarihi eklendi; mobil kart ve boş arama görünümü düzenlendi.
- Yinelenen görüşme kimliği yeniden eklenmez; kaydetme düğmesinin art arda tetiklenmesine karşı koruma eklendi.

### Satış, tahsilat ve taksitler

- Satış ve tahsilatlar ayrı, kimlikli kayıtlar olarak tutulur. Yeni satış eskisini veya eski tahsilatını ezmez. Önceki tek satış sınırlaması bu yerel modelde kaldırıldı.
- Tahsilat işlemi yalnızca ödeme alanlarını günceller; form açıldığındaki öğrenci kopyasını tekrar kaydederek kişisel düzenlemeleri ezmez.
- Kısmi ödeme mümkündür. Sıfır/negatif, iki ondalıktan fazla, kalan bakiyeyi aşan tutarlar ve satıştan önceki tarih engellenir. Form gelecekteki tahsilat tarihini de reddeder.
- İlk vade zorunludur; sonraki taksitler aylık planlanır. 31 Ocak gibi tarihler sonraki ayın son gününe daralır, Mart'ta tekrar 31 olur. Tutarlar kuruşla bölünür ve toplam değişmez.
- Tahsilat en eski açık taksitten başlayarak uygulanır. Taksit satırından açılan form seçilen açık tutarla başlar ve bu dağıtım kuralını açıklar.
- Satış, tahsilat ve taksit listeleri sırasıyla satış, ödeme ve vade tarihini kullanır. “Gecikmiş” filtresi bütün açık bakiyeleri getirmez.
- Mevcut eski bakiyeler korunur. Kaydedilmemiş satış/ödeme/vade tarihleri türetilmez: “Belirtilmedi” görünür ve tarih filtresine dahil edilmez.

### Anasayfa, eğitim ve finans raporları, JamAI

- Sabit 248 öğrenci, 24 grup, %92 devam, 248.000 ₺ satış ve benzeri rapor değerleri kayıtlar üzerinden hesaplanır.
- Dönem seçimi satış ve tahsilatı kendi tarihine göre süzer. Açık bakiye ayrıca “tüm açık bakiyeler” olarak gösterilir; iki farklı tarihin farkı yanlışlıkla bakiye sayılmaz.
- Eğitim durum dağılımı artık grup kapasitesi grafiğini tekrar göstermez. Devam trendi gerçek yoklama günlerini kullanır. Kaydı olmayan öğrenci otomatik “hiç katılmadı” veya “riskli” sayılmaz.
- Son devamsızlık ve görüşme yoğunluğu raporları 30 günlük pencere kullanır. CSV içerikleri listeler/grafiklerle aynı veri kümesinden gelir.
- Finans alt raporlarında danışman, paket, tahsilat kanalı, ek indirim ve vadeli bakiye ayrı ölçülür. İptal/iade ya da sözleşme vade verisi bulunmadığında ilgisiz satış grafiği gösterilmez.
- Anasayfa son yoklama kutusu gerçek son oturumu gösterir; tahsilat ve bekleyen bakiye aynı finans kayıtlarından gelir. JamAI'nin yerel yanıtları aynı hesapları ve bugünün gerçek tarihini kullanır.
- Uzun çizgi grafiklerinde eksen etiketleri seyreltilir; ilk ve son etiketler yüzey kenarının dışına taşmaz.

### Sözleşmeler, doğrulama ve diğer yönetim ekranları

- Sözleşmeler artık şablondur: ad, açıklama ve metin üstte zorunlu; şube/öğrenci bilgisi tercihleri altta isteğe bağlı. Kaydetme, düzenleme, önizleme ve metin indirme vardır. Kayıtlı şablonlar fiyatlandırmadan seçilir.
- Önceki sürümde gerçekten kaydedilmiş öğrenci belgeleri silinmez; arşivden açılır. Öğrenci eklenince kendiliğinden sözleşme oluşturulmaz.
- Doğrulamalar rastgele üç öğrenciye talep yakıştırmaz. Ayrı talep kayıtları, durum filtresi, talep eden/tarih ve karar notu vardır. Karar verilmiş kayıt tekrar işlenmez; boş ret notu kabul edilmez.
- Ekip formlarında boşlukla geçilen ad/iletişim, yinelenen kişi/şube veya kullanıcı e-postası ve geçersiz e-posta kontrolleri eklendi. Yeni ekip kaydının tarihi günceldir.
- Dosya yönetimi ders programı CSV'si artık seri gün numarası yerine takvim tarihi indirir. Saklanan liste verisi dizi değilse sayfa kırılmaz.
- Boş öğrenci listesi yeniden açılışta başlangıç öğrencileriyle doldurulmaz.

## Doğrulama

- 42 iş kuralı testi: yoklama kapsamı/düzeltme, ödeme geçmişi, kısmi tahsilat, yinelenen kayıt, aylık vade ve kuruş dağılımı, dönem raporları, grup/takvim ilişkisi, görüşme tamamlama, sözleşme ve doğrulama kontrolleri dahil.
- 113 menü rotası hem başlangıç verisiyle hem tamamen boş veriyle statik React render kontrolünden geçer. Üç yeni öğrenci alt rotası ayrıca kontrol edilir.
- Etiket/input ilişkileri, yinelenen HTML kimlikleri, NaN, gerçek bağlantılar, form sıralaması ve koşullu alan kontrolleri korunur.
- Bu statik kontroller tıklama/klavye veya cihaz testi değildir. Önceki denetimli tarayıcı girişimi `ERR_BLOCKED_BY_CLIENT` nedeniyle engellendi; bu engel başka adres/araçla aşılmadı. Tablet/TV/Safari/dokunmatik ve sanal klavye kabul testleri açık kalır.

## Açık üretim işleri

Bu sürüm kalıcı sunucu, yetkilendirme, ödeme sağlayıcısı, SMS, QR yoklama servisi veya LLM entegrasyonu eklemez. Kayıtlar mevcut tarayıcı çalışma alanındadır. Şubeler arasında gerçek sunucu veri izolasyonu, eşzamanlı güncellemeler ve sunucu doğrulaması gereklidir.

- Yerel yoklama editörü toplu kaydet kullanır; kaynak API tek öğrenci/oturum güncellemesi kullanır. API adaptöründe aynı işlemin doğrulanması gerekir. Eski tarihsiz yoklamalar için güvenilir bir tarih geri kazanılamaz.
- Öğrenci-grup ilişkisi halen grup adı üzerinden kuruludur; çoklu grup/eğitim hakları ve kaynak UUID ilişkilerine geçiş açık kalır. Kaynak ders programı oluşturma/düzenleme akışı bütünüyle taşınmadı.
- Satış geçmişi ve taksit planı artık vardır; satış düzenleme/iptal/iade, senet doğrulama, muhasebe mutabakatı ve ödeme sağlayıcısı işlemleri açık kalır. Önceki sürümde üzerine yazılmış eski satışlar geri üretilemez.
- Doğrulama kayıt modeli ve karar UI'si hazırdır; kaynak yetki sisteminden talep üretimi ve onay sonrası işlemin sunucuda uygulanması bağlı değildir. Ödeme/üyelik sayfalarının sabit hizmet faturası modeli ayrıca yeniden ele alınmalıdır.
- Kaynak sözleşme editörü zengin metindir; bu sürüm güvenli düz metin giriş/önizlemesi kullanır. İmzalı öğrenci belgesi üretimi, imza, sürümleme ve paketle belge oluşturma entegrasyonu açık kalır. Şablon seçimi imzalı sözleşme üretildiği anlamına gelmez.
- Kaynak şube formundaki adres/telefon/e-posta, faturalama günü/tutarı, para birimi/dil ve diğer ayrıntılar genel şube kartı formuna henüz bütünüyle taşınmadı. Ekip UI'sinde rol seçmek gerçek hesap yetkisi oluşturmaz.
- Otomasyonların zamanlayıcı ve yürütme servisi bağlı değildir; kayıtlı kuralı etkin göstermek işin çalıştığını doğrulamaz. Dosya depolamasının tarayıcı kota/yedekleme sınırları sürer.

Bu liste sonraki sayfa incelemesinin somut sırasıdır; uygulamanın bütün üretim kabulünün tamamlandığı iddia edilmez.

Son kontrol sonucu: 42/42 iş kuralı testi; 113 başlangıç + 113 boş veri rotası; üç öğrenci alt rotası ve mevcut form kontrolleri başarılı. TypeScript/üretim derlemesi geçti. Sıkıştırılmış ana JS yaklaşık 318 KB, CSS yaklaşık 29,5 KB; Vite'ın 500 KB üzerindeki sıkıştırılmamış paket uyarısı devam ediyor. Kod bölme ve gerçek cihaz performansı ayrıca doğrulanmalıdır.
