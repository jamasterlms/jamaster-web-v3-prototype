# Grup üyelikleri ve öğretmen atamaları

9 Eylül 2026. Dördüncü uygulama paketi. Kaynak: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`; ayrıntılı karşılaştırma `source-detail-actions.md`. Bu paket yerel React/Vite uygulamasını ilerletir; canlı API veya cihaz kabulü değildir.

## Öğrenci üyelikleri

- Yeni üyelik koleksiyonu öğrenci/grup kimliklerini kullanır. Bir gruba ekleme mevcut diğer grupları korur. Öğrencinin satın aldığı eğitim, satış ve profil bilgileri üyelik işlemiyle değiştirilmez.
- Eski tek `student.group` kaydı yalnızca tek bir grup adıyla eşleşiyorsa bir kez kimliğe çevrilir. Katılma tarihi uydurulmaz. Belirsiz eşleşmeler ve eksik grup referansları görünür tutulur; açıkça boş bir koleksiyon yeniden eski kayıttan doldurulmaz.
- Bozuk/tekrarlı üyelikler ve anlamsız işlem geçmişleri recovery bölümünde saklanır, doğru listeye karıştırılmaz. Önceki üyelik sonlandırması yerel `ended` durumuyla temsil edilir; kaynakta kanıtlanmamış bir iptal/başarı sonucu atanmaz.
- `/admin/groups/:id`: numara, öğrenci, e-posta, telefon, katılma tarihi, profil; arama, sıralama, mobil kart ve CSV. Yeni dialog kaynak `studentId`, isteğe bağlı `transferDate` ve `reason` alanlarını kullanır.
- `/admin/students/:id/groups`: mevcut üyelikler, ekleme, neden zorunlu çıkarma, işlem geçmişi. Çıkarma yalnızca seçili grubu sonlandırır. Boş transfer tarihi işlem zamanını kullanır; seçili tarih kaynak inputu gibi ISO olarak taşınır.
- Kaynak ekleme dialogunda doğrulanmayan aktif öğrenci/grup ve kapasite blokları kaldırıldı. Grup formunda kapasitenin mevcut üye sayısı altına düşürülmesini engelleyen önceki kontrol korundu. Kaynakla eşlik, eski plandaki varsayımsal ekleme kısıtından önceliklidir.
- Grup sayıları, hızlı önizleme, öğrenci filtreleri, dashboard, dosya çıktıları, eğitim raporları ve JamAI özeti ortak üyelik seçicisini kullanır. Seçici kimlik indekslerini memoize eder; her satır için bütün üyelik listesi tekrar taranmaz. Eski ad tabanlı öğrenci filtreleri eşleşme kesinse kimliğe çevrilir.
- Yeni yoklama öğrenci listesini aktif üyelik kimlikleriyle oluşturur. Önceden kaydedilmiş yoklamanın öğrenci kimlikleri güncel üyeliklerle ezilmez.

## Öğretmen atamaları

- `/admin/groups/:id/teacher` gerçek alt sayfası, grup detay navigasyonu, arama/durum filtreleri, masaüstü tablo ve mobil kartlar eklendi.
- Ekleme: öğretmen ve başlangıç tarihi zorunlu; unvan ve bitiş isteğe bağlı. Düzenleme: unvan, aktiflik, bitiş; öğretmen ve başlangıç değiştirilemez.
- Sınıf öğretmeni grup formuna aittir. Form artık öğretmen kimliği seçer; eş adlar birbirine karışmaz. Eski ad ilişkisi yalnızca kesin eşleşmeyle geçirilir. Öğretmen yeniden adlandırıldığında grup etiketi aynı kimlik üzerinden güncellenir.
- Sınıf öğretmeni satırı düzenlenmez; kaynakta görünmeyen silme aksiyonu eklenmedi. Aynı gruba aynı öğretmen iki kez atanamaz. Kaynak `Sınıf Öğretmeni` unvanı/head ID kuralı korunur.
- Ek öğretmen sınıf öğretmeni seçildiğinde eski ek görev pasife alınır; form bunu açıklar. Sonraki sınıf öğretmeni değişikliği eski görevi sessizce aktif etmez. Önceki atama tarihleri korunur; bilinmeyen başlangıç/bitiş tarihleri üretilmez.
- Bitişin başlangıçtan önce olmaması ek bir tutarlılık kontrolüdür; kaynak formun mevcut doğrulamasıyla birebir aynı olduğu iddia edilmez.
- Grup düzenleme, takvimde kimlikle ayrıca atanmış öğretmeni değiştirmez. Eski kimliksiz takvim alanlarının mevcut uyumluluk güncellemesi korunur.

## İnceleme ve doğrulama

- Salt okunur kaynak/UI incelemesindeki eski üyelik kaybı, karışık transfer komutu, bozuk geçmiş, grup eğitimini ezme ve eski öğretmen görevinin yeniden etkinleşmesi bulguları kapatıldı.
- Ek testler: tek seferlik geçiş, belirsiz eşleşme, çoklu üyelik, tekrarlı gönderim, neden zorunluluğu, seçili üyelik çıkarma, tarih/kimlik hataları, bozuk kayıt recovery, yoklama roster korunumu, eski Operations verisinin kaybolmaması, öğretmen atama kimliği ve tarih değişmezliği, sınıf öğretmeni değişikliği.
- `npm test`: 104 geçti / 0 hata. `npm run check:pages`: 113 navigasyon hedefi dolu/boş koleksiyonlarla ve yeni iki alt sayfayla başarılı. `npm run build`: başarılı; `git diff --check`: temiz. Ayrıntılar `execution-status.md` içinde. SSR kontrolleri etkileşim, mobil klavye veya piksel kabulü olarak yorumlanamaz.

## Açık kalan sınırlar

- Aktif satış uyarısının kaynak alanları ve ikinci onay adımı hazırdır; mevcut yerel satış modelinde satış yaşam döngüsü olmadığı için `hasActiveSale` türetilmez. Servis verisi yokken dialog bunu belirtir. Canlı lookup ve bu adımın gerçek tarayıcı etkileşim kabulü açık; tam kaynak eşliği tamamlandı denmez.
- Üyelik, atama, öğrenci ve grup verisi mevcut yerel depolama yapısındadır. Sunucu mutasyonları, yetki/şube sahipliği ve gerçek çok kullanıcılı tutarlılık tamamlanmadı.
- Tarayıcı önizlemesinin önceki `ERR_BLOCKED_BY_CLIENT` engeli sürmektedir; aynı engeli başka erişim yöntemiyle aşma denenmedi. Bu paketin görsel/cihaz kabulü yapılmadı. Yayın daha sonra v12 / df0a522 olarak başarıyla güncellendi.
- Grup notları ve toplu program oluşturma, öğretmen kişisel/sertifika/maaş/öğrenci detay datasetleri ve kalan personel yetki dalları sonraki açık işlerdir.
