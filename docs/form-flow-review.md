# Form ve iş akışı incelemesi — 8 Eylül 2026

Bu tur, uzun formlarda zorunlu alanların üstte ve isteğe bağlı alanların altta ayrılması isteğine odaklanır. Mevcut soft renkler, shadcn bileşenleri, gerçek rotalar ve çalışma sekmeleri korunur. Alanları saklayan yeni bir accordion eklenmedi; ek bilgiler ayrı, hafif bir yüzeyde görünür kalır.

## Kaynak karşılaştırması

`jamasterlms/jamaster-web` deposunun erişilen son commit'i `7810bd1720c57749f6d5249536ba015f2a53694f` olarak doğrulandı. Kaynak uygulamaya yazılmadı. Aşağıdaki dosyalar bu turda GitHub üzerinden yeniden okundu:

- `app/[locale]/(main)/admin/students/register/page.tsx` ve ilk üç adım bileşeni.
- `components/forms/admin/group-form.tsx`, `teacher-form.tsx`, `expense-form.tsx`, `pricing-form.tsx`.
- `app/[locale]/(main)/admin/_components/meeting-dialog.tsx`.
- `admin/sms/create/page.tsx`, `single-sms-form.tsx` ve `admin/email/create/_components/single-email-form.tsx`.

| Form                      | Üstteki temel bilgiler                                                                  | Alttaki isteğe bağlı bilgiler / koşullar                                          |
| ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Öğrenci kişisel bilgileri | Ad soyad, öğrenci tipi, telefon, e-posta                                                | İkinci telefon, kimlik/pasaport, doğum tarihi/yeri, görsel, adres, telefon teyidi |
| Öğrenci eğitim bilgileri  | Ders tipi, eğitim, gün/saat tercihi, danışman                                           | Seviye/alt seviye, kaynak, meslek, mesleğe bağlı okul veya şirket, hesap durumu   |
| Kayıtta görüşme           | Görüşme tipi, sonuç, skor; seçilen sonuca bağlı tarih/neden                             | Görüşme notu                                                                      |
| Grup                      | Ad, eğitim, grup/eğitim tipi, seviye/alt seviye, öğretmen, kapasite, gün/zaman dilimi   | Program dönemi, derslik, ders programı, varsayılan durum, açıklama                |
| Öğretmen                  | Ad soyad, e-posta, telefon, durum                                                       | Uzmanlık, haftalık ders yükü; maaş ekleme seçilirse tutar/tip/ödeme günü          |
| Gelir/gider               | Ad, tip, tutar, kategori, sıklık, açıklama; tek işlemde tarih, tekrarda başlangıç/dönem | Varsayılan ödeme/tahsilat durumu; tekrarda bitiş ve aktiflik                      |
| Fiyatlandırma             | Paket, eğitim, ders/taksit sayısı, fiyat, dönem, sözleşme                               | Kampanya ve ödeme yöntemi indirimi; kampanya açılırsa adı/fiyatı/tarih aralığı    |
| Satış                     | Paket, ödeme yöntemi, taksit, satış tarihi                                              | Ek indirim; boş değer sıfır olarak değerlendirilir                                |
| SMS / WhatsApp taslağı    | Alıcı, mesaj                                                                            | Taslak adı; boşsa mesaj başlangıcından üretilir ve alıcı önizlemesinde yer almaz  |
| E-posta / şablon          | Konu veya şablon adı, alıcı, içerik                                                     | Kanalına göre gerekmeyen alıcı alanları gösterilmez                               |

## Düzeltilen mantık hataları

1. Şirket, kaynak kayıt şemasında isteğe bağlı olmasına rağmen kurumsal kayıtta zorunlu tutuluyordu. Bu ek kısıt kaldırıldı. Meslek de boş bırakılabilir; yeni kayıtta otomatik olarak “Öğrenci” seçilmez.
2. Okul/kurum ve şirket meslekten bağımsız birlikte gösteriliyordu. Kaynaktaki gibi okul yalnızca öğrenci, şirket yalnızca çalışan seçiminde görünür. Meslek değiştiğinde bu iki bağımlı değer temizlenir.
3. İlk görüşme tipi kişisel bilgilerin arasındaydı ve öğrenci düzenleme formunda da görünüyordu. Kayıtta görüşme adımına taşındı; profil düzenleme artık geçmiş görüşme tipini değiştirmez.
4. Grup seçimlerindeki görsel fallback değerler kayıt modelinde bulunmuyordu. Editörün varsayılanları tek yerde hazırlanır. Bilinmeyen alt seviye tahmin edilmez; kullanıcı seçer. Yeni grupta öğretmen/derslik/dönem rastgele atanmaz.
5. Grup seviye/alt seviye uyumu Zod ile doğrulanır. Mevcut üyelerden düşük kapasite ve başka bir grupla aynı ad engellenir. Grup eğitim değişikliği öğrencinin profilindeki eğitim bilgisini de günceller.
6. Öğretmen formunda kaynakta olmayan uzmanlık ve ders yükü kaydı engelliyordu. Ek bilgilere taşındı. Maaş verilmeden ödeme günü değiştirilerek farkında olmadan sıfır tutarlı maaş oluşturulması önlendi; maaş artık açık bir seçimle eklenir/kaldırılır.
7. Tekrarlayan gider başlangıcı eski işlem tarihinden ayrı kaydediliyordu. Kaydedilen tarih artık seçilen başlangıçtır; tek seferliğe dönünce gizli tekrar ayarları kayda taşınmaz.
8. “Bu ayki gider” geliri, diğer ayları ve gerçekleşmemiş tekrar planlarını da topluyordu. Özet yalnızca o ayın tek seferlik gider kayıtlarını toplar; tekrar planları ödeme sayılmaz. İşlem türü CSV'ye eklendi.
9. Ek indirim zorunlu input olduğu için sıfır yazılması gerekiyordu. Artık boş bırakılabilir.
10. Tek/toplu mesaj geçişinde alıcı modu ile alıcı değeri ayrı güncelleniyor, tek alıcı değeri geçersiz bir grup gibi kalabiliyordu. Geçiş atomik; geçerli grup seçilir ve geri dönüşte yazılan telefon/e-posta korunur. Toplu kayıtta tek alıcı adresi gönderilmez.
11. Hızlı SMS taslağında alıcı telefon adresi saklanmıyordu; sonradan düzenleme akışı bozuluyordu. Telefon ve tek alıcı modu artık kaydedilir. Telefon gerektiğinde formdan düzeltilebilir.
12. SMS için kaynaktaki 10–300 karakter sınırı uygulandı. Kaynakta zorunlu olan `title`, kullanıcı taslak adı vermediğinde mesajdan üretilir; kaydedilen başlık boş kalmaz. E-posta konusu ve şablon adı zorunlu kalır.
13. Görüşme bilgi panelindeki danışman sabit yazılıyordu, seviye ise grup adından çıkarılıyordu. Artık öğrenci alanları kullanılır. Hızlı gün seçimi girilmiş görüşme saatini sıfırlamaz.
14. Zorunlu textarea alanları yalnızca boşlukla geçilebiliyordu. shadcn Textarea, Türkçe ve erişilebilir alan hatası ile trim/minimum/maksimum kontrolü yapar.

## Korunan sınırlar ve kaynak farkları

Kaynak API bağlantısı yoktur; bu değişiklikler mevcut yerel çalışma alanı modeline uygulanmıştır. Eğitim, danışman, kapasite, ders/taksit sayısı gibi mevcut prototip alanları korunmuştur; birebir API payload'ı oldukları iddia edilmez. Kampanya ayrıntıları ve ek indirim mevcut prototipin davranışıdır. Yerel şirket/kaynak metinleri sunucudaki kayıt kimliklerinin yerini almaz.

Grup üye ilişkileri hâlâ mevcut modeldeki grup adı üzerinden kuruludur. Aynı ad kontrolü bunun oluşturduğu karışıklığı azaltır; gerçek entegrasyonda UUID ilişkisi gerekir. Finans özeti tekrar planlarını otomatik tahsil etmez. Mevcut tek satış modeli ve önceki üretim kabul sınırları değişmemiştir.

## Doğrulama

33 iş kuralı senaryosu; 113 yönlendirmede statik React render kontrolü; zorunlu/isteğe bağlı sıralaması; boş isteğe bağlı alanlar; meslek, maaş, kampanya ve tekrar koşulları; etiket–input bağlantıları ve önizleme kontrolü. 33 testin tamamı, render kontrolleri ve TypeScript/üretim derlemesi geçti. Çevrimdışı HTML JavaScript sözdizimi ve 147 dosyalı kaynak paketinin bütünlüğü de doğrulandı.

Bu kontroller gerçek tarayıcı etkileşimi değildir. Önceki denetimli tarayıcı erişimi `ERR_BLOCKED_BY_CLIENT` ile engellendiği için görsel cihaz kabulü açık kalır. Tablet, TV, Safari, sanal klavye ve gerçek API testleri için `production-ui-review.md` kabul matrisi geçerlidir.
