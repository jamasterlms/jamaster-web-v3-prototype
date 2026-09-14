# Takvim, yoklama ve detay yönlendirmeleri — üçüncü uygulama paketi

9 Eylül 2026. Kaynak: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Bu kayıt UI/yerel model değişikliklerini açıklar; gerçek polling hizmetinin veya şube yetkilerinin tamamlandığı anlamına gelmez.

## Uygulananlar

- `/admin/calendar/pollings` artık rastgele ilk grubun öğrenci formu değildir. Yoklama merkezi; devam eden, bugünkü ve yaklaşan dersleri ayrı soft kartlarla gösterir. Gece başlayan aktif ders ertesi gün kaybolmaz. Yaklaşan bölüm bugünü tekrar etmez; en yakın on gelecekteki dersi sıralar. Grup filtresi URL'de tutulur.
- `/admin/groups/:id/polling` güncel/geçmiş görünümlerine ayrıldı. Tarih, oturum, tarih aralığı, çoklu ders durumu/tipi ve sıralama query ile saklanır. Yanlış açık oturum kimliği ilk derse düşmez; geçersiz tarih sessizce başka tarihe dönmez. Geçmişte tablo/mobil kartlar, kayıtlı öğrenci listesi, CSV ve JSON vardır.
- Roster kaydedilmiş oturumun kimliklerini kullanır. Başka gruba geçen veya öğrenci kaydı kaldırılan kişiler geçmişten düşmez. Bekleyenler otomatik devamsız yapılmaz. Kayıtlı katılımın paydası snapshot'taki bütün öğrencilerdir; kayıtsız derse sıfır katılım uydurulmaz. Mevcut `attendanceStats` ve öğrenci tarihçesi oranı değişmedi; bunlar ayrı metriklerdir.
- Yeni PRIVATE derste opsiyonel öğrenci seçimi vardır; öğrenci atanmadıysa bu eksik açıkça görünür. Kayıtlı özel dersin öğrenci listesi bütün gruba genişletilmez. Ders bilgileri öğrenciyi ID ile çözer; eski `person` adı yeni seçimde gösterilmez.
- Manuel işaretleme yalnız devam eden ve iptal edilmemiş derste yapılabilir; 30 saniyelik saat güncellemesi, sekmeye dönüş ve submit anında sınır kontrolü vardır. Gerçek check-in zamanı üretilmez. Tarihçe salt okunurdur. Masaüstünde kayıt aksiyonları görünür kalır; mobilde mevcut sayfa kaydırması kullanılır.
- Silinen dersin yoklaması saklanır. Önceden yeniden planlanmış oturum tarih/saatini snapshot'tan gösterir; yeni ders tarihine eski katılım yapıştırılmaz. Merkez ve ders dialog'u aynı adres üreticisiyle arşive gider. Bundan sonraki yerel düzenlemelerde yoklaması olan dersin zamanı, grubu, tipi veya öğrencisi değiştirilemez; açıklama yeni ders oluşturmayı ister. Başlık gibi kimliği değiştirmeyen düzeltmeler açık kalır. Bu koruma, mevcut tek-event/snapshot modelinin veri bütünlüğü tercihidir; kaynak frontend'in aynı kuralı uyguladığı iddia edilmez.
- Başka şubede aynı global event için kayıt varsa ikinci şubede yoklama değişikliği engellenir. Bu yalnız somut çakışmayı önler; kayıt sahipliği veya tam şube izolasyonu oluşturmaz.
- `/admin/groups/:id/schedule` gerçek grup takvimidir. `/admin/teachers/:id/history?tab=schedule` gerçek öğretmen takvimidir. Ay/hafta/gün/liste, kaynak görünümleri ve mevcut editor tekrar kullanılır. Yeni derse grup/öğretmen bağlamı aktarılır. Öğretmen kimliği varsa ad eşlemesi onu geçersiz kılamaz; eski ad sadece tek eşleşmede kabul edilir. Geçersiz grup/öğretmen boş koleksiyon sayfasına düşmez.
- Öğretmen `/schedule` eski adresi diğer query değerlerini koruyup `tab=schedule` ile kanonik history adresine geçer. History/audit ayrı içeriktir; audit kaynağı bağlı olmadığından açık unavailable durumu gösterir, takvim veya uydurma olay geçmişi göstermez.
- Grup ve öğretmen detay bağlantıları ilgili takvime gider. Grup bilgi/takvim/yoklama gezinmesi ortak bileşeni kullanır. Öğretmen history bağlantısı saklanan alt görünümle tutarlı olarak “Geçmiş” adını taşır.
- `/admin/groups/form?id=…` ve `/admin/teachers/form?teacherId=…` mevcut kaydı açar. Yanlış/boş kimlik yeni form oluşturmaz; hata gösterir. Öğretmen oluşturma `phoneNumber` parametresini alır. Query değiştiğinde doğru kayıt yeniden seçilir; kapatma düzenlenen kayda döner.

## Açık sınırlar ve sonraki işler

- Kaynak gerçek `Polling.id`, schedule kimliğinden ayrı polling başlangıç/bitişleri, QR/public receiver, SMS doğrulama ve print akışı kullanılmıyor. Gösterilen durum **ders zamanı** üzerinden hesaplanır; gerçek polling durumu diye sunulmaz.
- Workspace ve Operations koleksiyonları mevcut prototipte globaldir. Şube seçimi veri yüklemesi veya yetki kontrolü yapmaz. Branch conflict koruması bunu çözmez. Kimlik tabanlı dataset yükleme ve auth/tenant/branch hizmeti üretim öncesi zorunludur; geçmiş kayıtlar tahmini şubelere taşınmadı.
- Kaynak grup current/past koşulları, gerçek kayıtlı roster ve check-in mevcut yerel oturumlardan daha ayrıntılıdır. Yoklama penceresi, sunucu geçmişi ve öğrenci istatistik paydaları API bağlanınca ayrıca eşlenmelidir.
- Group teacher assignments, notes, batch schedule, multiple student memberships/transfer, teacher personal/certificate/student/activity/payroll sayfaları ve diğer legacy adresler henüz bu paketle tamamlanmadı. Kaynak karşılaştırması `source-detail-actions.md` dosyasında; oradaki “Site gap” sütunları araştırma anını anlatır. Mevcut uygulama durumu için bu kayıt ve `execution-status.md` esastır.
- Kaynaktaki grup atama birden fazla üyeliği korur. Mevcut prototipte tek `student.group` alanını değiştiren akış hâlâ farklıdır. Bunu yalnız bir dialog ekleyerek doğru saymak mümkün değildir: memberships/transfer history ve 50 civarı grup tüketicisi birlikte geçirilmelidir.
- Bu pakette kullanıcıya mesaj gönderimi, gerçek ödeme, şifre/izin değişikliği veya yeni deployment yapılmadı.

## Doğrulama

Saf kurallar için kırmızı/yeşil regresyon döngüsü: gece yarısı, iptal/saat sınırları, özel öğrenci kimliği, snapshot/şube ayrımı, tarih/tip/durum filtreleri, yanlış oturum, scoped calendar, source form kimliği, arşiv yönlendirmesi ve kaydedilmiş ders değişiklik koruması. `check:pages` mevcut 113 hedefe ek olarak yeni query/alt adreslerin gerçek bileşenlerini ve yanlış ID/tarih hata durumlarını render eder. Kesin son sayılar `execution-status.md` kapanış kaydındadır.

Tarayıcıdaki `ERR_BLOCKED_BY_CLIENT` nedeniyle görsel/cihaz kabulü hâlâ yapılmadı. SSR, CSS incelemesi ve derleme gerçek hover, iOS klavye, tablo taşması veya tablet/TV ölçüm kanıtı değildir. Yayındaki v11 değişmedi.
