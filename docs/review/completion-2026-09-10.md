# 10 Eylül 2026 — kaynak sayfa eşleme ve çalışma alanı güncellemesi

Sonraki devam paketi: [Öğrenci bilgileri, geçmiş ve tablo işlemleri](student-workflows-2026-09-10.md). Aşağıdaki kayıt v14 durumunu korur; öğrenci alan düzenleme, belge satış seçimi ve bazı dışa aktarma eksikleri sonraki pakette ilerletildi.

Bu paket ilk soft renk/yüzey dilini ve React/Vite/shadcn yapısını korur. Tam üretim veya bütün kaynak aksiyonlarının tamamlandığı beyanı değildir. Kaynak: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Geri dönüş için önceki yayın kaynağı: `9f99af9a8525aedf88b1c2b0ca0c19a492962a25` (v13).

## Son isteklerin karşılığı

| İstek                                             | Uygulama                                                                                                                                                                                                                                                  | Kanıt / sınır                                                                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sağ panel sticky ve uzun sayfalarda sınırlı olsun | `tools.css`, `use-sticky-panel.ts`: viewport ve panelin ölçülen üst konumuna göre yükseklik, iç scroll, grid stretch kaldırıldı. Mobil drawer ayrı kalır.                                                                                                 | CSS/hook incelemesi; gerçek tarayıcı ölçümü bloke.                                                                                                         |
| Önizleme ileri/geri/kapat ve verimli içerik       | Önizleme, Günlük akış/JamAI Tabs ağacının dışında; sabit header/alt tam sayfa aksiyonu, ayrı scroll. Grup/öğretmende yaklaşan dersler; filtrelenmiş/sıralanmış liste boyunca gezinme. İç bağlantılardan oluşan geçmiş 100 kayıtla sınırlı.                | Sıra, tekrar kayıt, sınırlar, geri sonrası yeni dal testleri geçti. Portal/klik cihaz kabulü açık.                                                         |
| Çok sekmede ikon→padding→font                     | Yoğunluk 0–3; sayıya ve kullanılabilir genişliğe göre ikonlar kalkar, padding daralır, en son metin 13px eşdeğerine iner. Okunabilir minimum genişlikten sonra yatay scroll + tam başlıklı açık sayfalar dropdown'ı. Aktif sekme görünür alana getirilir. | Yoğunluk geçiş testi geçti; 3/8/16 sekme ekran görüntüleri bloke.                                                                                          |
| jamaster-web'deki her adres burada olsun          | 154 kaynak route kalıbı, 27 uyumluluk yönlendirmesi dahil, ayrıca 24 eğitim + 18 satış rapor yaprağı envantere alındı. Yanlış listeye düşen detaylar ayrıldı.                                                                                             | `source-routes.json` ve `check:pages`: gerçek route dispatcher bileşen ailesi ve SSR kontrolü. Servis bağlı olmayan ekranlar işlevsel eşlik diye sayılmaz. |

## Eklenen / düzeltilen dikey akışlar

- Öğrenci: altı ana detay bağlantısı; sekiz geçmiş görünümü (görüşme, ders programı, SMS, WhatsApp, WhatsApp konuşması, e-posta, yoklama, işlem geçmişi). Kişisel takip notları aktiviteden ayrı. Aktiviteler ve imzalı belge metadatası ayrı tablolar. Öğrenci takvimi yalnız ilişkili dersleri gösterir; görüşmeler program listesine karışmaz. Kaynak eski adresleri query'leri korur. Yeni program/aktivite ve maaş sayfaları menüden, bildirimler üst popover'dan erişilebilir.
- Öğretmen: genel/kendi öğrencileri/grupları/aktiviteleri/ödemeleri/geçmişi. Kişisel/iletişim alanları, sertifika ekleme-düzenleme-silme, ayrı notlar. Aktivite tablosu bu bağlamda salt okunur. Öğretmen ve grup bağlantıları kimlik temellidir; bilinmeyen ilişkiler kendiliğinden atanmaz.
- Personel: maaş hareketleri ve işlem geçmişi alt görünümleri; 30 kaynak kaynak-türü × 4 aksiyon, beş rol şablonu, şube yöneticisi ve özel izin matrisi. `create/edit/delete` görünüm iznini içerir. Şube kimliği ile görünen şube uyuşmadan kayıt yapılamaz. Bu matris sunucu yetkilendirmesi değildir.
- Maaş: ücret tanımı ile hesaplanmış borç kayıtları ayrıdır. Veri yokken maaş borcu üretilmez. Var olan kayıt için kısmi/tam ödeme formu, önizleme, tarih ve bakiye doğrulaması, çift kayıt koruması vardır. Yerel kayıt banka ödemesi değildir; kaynağın `paidAmount` ekleme/değiştirme semantiği API bağlantısında doğrulanmalıdır.
- Aktiviteler: katalog, detay, teslimler; taslak oluşturma/düzenleme/silme, 12 tür, 6 durum, değerlendirme alanları, grup seçimi, son tarih ve isteğe bağlı açıklama. Yayımlama/teslim/not servisi bağlı değilken başarı üretilmez.
- Programlar: eğitimle ilişkili gerçek ayrı katalog; arama/durum/sıralama, ekle-düzenle, bağlı program dönemini koruyan silme kontrolü. Katalog değişiklikleri program dönemi seçimlerine yansır.
- Şube, otomasyon ve iletişim detay adresleri kendi seçilen kaydını açar. Öğrenciden yeni mesaj bağlantısı telefon/e-posta alanını tek alıcı modunda doldurur. Hizmet aboneliğinde eski sabit 3.500 TL/ödenmiş aylar kaldırıldı.
- Hesap: profil, tercihler, kartlar, bildirim ayarları ayrıldı. Ölçek %70–150, sağ panel tercihi ve kişisel kısayollar; kısayol düzenleme/sıralama ve panel bağlantıları. Güvenlik ve bildirim sağlayıcıları doğrulanmadan kaydedildi denmez.
- Ayrı öğrenci/öğretmen alanı ve giriş/parola/şube seçimi/yoklama/ödeme/abonelikten çıkış adresleri yönetici sayfasına düşmez. Kimlik doğrulanmadığı için bu alanlarda yönetici öğrencileri gösterilmez; hesap bağlantısı bekleyen durum açıkça görünür.

## Raporlar

42 yaprak başlık değiştiren tek yanlış tablo yerine kaynak sütun ailelerine bağlandı. Aynı filtrelenmiş koleksiyon özet, grafik, CSV ve tabloyu besler. Tarihler, tekrarlı durum/ödeme tipi parametreleri ve sıralama saklanır. Veri bilinmiyorsa `—` veya veri alınamadı durumu gösterilir.

| Ana rapor         | Değişiklik                                                                     | Tam eşlik için kalan                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Satış             | Eğitim/paket, dönem, lifecycle filtresi, tutar/ödenen, satış detayı            | Satış lifecycle, eğitim başlangıç/bitiş ve indirim tutarı DTO'da yok; bakiye ile türetilmez.                                                         |
| Tahsilat          | Ödeme tipi çoklu, dönem/sıra; SALE/INSTALLMENT ayrımı ve doğru detay           | Danışman ID ilişkisi gelmeden seçici pasif.                                                                                                          |
| Gecikmiş alacak   | Gerçek vade, gecikme günü, ilk taksit tutarı ve açık bakiye ayrı               | Kaynak rapor metadata/not alanları ve varsayılan rapor dönemi kabulü.                                                                                |
| Muhasebe          | Gelir/gider/tahsilat tablosu, tür/işlem/dönem/sıra, edit ikonları              | Kategori ID'leri, oluşturan, maaş hareketleri ve servis datasetleri. Tekrarlayan planlar gerçek nakit toplamına katılmaz.                            |
| Senet             | Satış listesinden ayrılan senet tablosu, durum/dönem/sıra, doğru taksit detayı | Senet dataset'i, danışmanlar ve kaynak aylık dağılım/ortalama taksit grafikleri. Taksit olması tek başına senet demek değildir.                      |
| Eğitim yaprakları | 24 adres, kaynak sütun aileleri, kaynak filtre adları                          | Dondurma/bonus/kalan hak/süre/transfer ve sunucunun risk/koşul tanımları. Yerel kayıt tarihi grafiği kaynak servis trendi yerine tam eşlik sayılmaz. |
| Satış yaprakları  | 18 adres; satış yöntemi tahsilat yönteminden ayrı; danışman/paket toplamları   | İptal/iade/lifecycle, sözleşme vadesi, kampanya, satış anındaki grup/danışman ilişkisi ve sunucu risk eşikleri.                                      |

## Kontroller

- `npm test`: **125 geçti, 0 hata**. Önceki 113 regresyona önizleme sırası, tab yoğunluğu, kaynak alias query'leri, izinler, maaş, aktivite validasyonu, rapor hesapları ve not çakışma koruması eklendi. Rapor ödeme tipi filtreleri hem geçmiş Türkçe etiketleri hem kaynak enum kodlarını kabul eder.
- `npm run check:pages`: 117 navigasyon hedefi dolu/boş koleksiyonlarla; grup/öğretmen/öğrenci alt sayfaları ve form kontrolleri. Buna ek 154 kaynak kalıbının **doğru bileşen ailesine** yönlendirmesi ve 42 rapor yaprağı. Gerçek sayfa bileşenleri SSR edilir; lazy fallback başarı sayılmaz.
- `build-site.mjs` (`tsc -b` + Vite) başarılı. Yeni statik/dinamik access-page çakışması giderildi. Ana bootstrap 645,60 kB (gzip 193,52), app 115,94 kB (gzip 33,69); >500 kB uyarısı sürüyor. Bunlar toplam ağ/cihaz performansı ölçümü değildir.
- İzinli Sites tarayıcı önizlemesi `ERR_BLOCKED_BY_CLIENT` döndürdü. Bu oturumda gerçek görsel, hover, mobil klavye, portal koordinatı veya TV kabulü yapılamadı; başka erişim yolu denenmedi.

## Üretim öncesi açık kalan kapılar

1. **Auth/rol/şube/API:** Yerel Workspace/Operations koleksiyonları hâlâ tenant izolasyonu sağlamaz. Şube seçimi güvenlik sınırı değildir. Gerçek iki hesap/iki şube, 401/403/404/409, sunucu validasyonu ve sorgu invalidation doğrulanmalı.
2. **Kaynak işlemlerinin tamamı:** Aktivite yayımlama/teslim/değerlendirme; öğrenci/öğretmen portal işlemleri; personel hesap parolası oluşturma; gerçek imzalı dosya okuma; SMS/e-posta/WhatsApp; ödeme/kart; otomasyon; JamAI; güvenlik ve bildirim tercihleri hâlâ servis sözleşmesi/bağlantısı bekler. Bazı kaynak özel rapor hesapları bilinemediği için bilinmiyor durumundadır. Her route'un varlığı bu eksikleri kapatmaz.
3. **Eksiksiz alan/aksiyon eşliği:** Öğrenci imzalı belge satış seçimi, kaynak iletişim konuşması cevaplama, bazı toplu aksiyonlar/dışa aktarma biçimleri ve role özgü formlar için birebir kabul açık. Kaynakta bulunmayan varsayım ile doldurulmadı.
4. **Cihaz/görsel/etkileşim:** 320–3840 px; tablet split view; macOS/Safari; Windows OS ölçek × uygulama %70–150; gerçek iOS/Android klavye; %200 zoom ve ekran okuyucu. Mouse input'a yaklaşınca etkinleşme sorunu erişim engeli nedeniyle tekrar üretilemedi; düzeldi iddiası yok.
5. **Performans:** 10.000 satır, 16 sekme, yoğun takvim ve fotoğraflarla yük/scroll/bellek ölçümü açık. Ana chunk boyutu uyarısı gizlenmedi.

Yayın, mevcut inceleme prototipinin güncellenmesidir. Kullanıcı yetkisiyle repoya ve aynı erişim kitlesindeki Site'a gönderilir; üretim kabul kapıları bu yayınla kendiliğinden kapanmaz.
