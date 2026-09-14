# Öğrenci bilgileri, geçmiş ve tablo işlemleri — 10 Eylül devamı

Önceki yayın kaynağı: `f61d87799cba1b6ba49d426087cad166112db01e` (v14). Kaynak karşılaştırması aynı `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f` üzerinden yapıldı. Tasarımın soft yüzeyleri, ilk HTML renkleri ve React/Vite/shadcn yapısı korundu.

## Tamamlanan arayüz akışları

| Alan | Bu pakette değişen davranış |
| --- | --- |
| Öğrenci bilgileri | Kişisel, iletişim ve eğitim bilgileri ayrı bölümlerde tek alanla düzenlenir. Kaydet/vazgeç yerindedir. Düzenleme yalnız buton etkinleştirildiğinde açılır; hover ile alanı odaklayan bir davranış eklenmedi. |
| Doğrulama | Değişen telefon/e-posta doğrulanır ve mükerrer kayıt kontrol edilir. Değiştirilmeyen eski telefon başka alanın düzeltilmesini engellemez. Gelecekteki doğum tarihi reddedilir. Açık editörün başlangıç değeri güncel kayıtla uyuşmazsa eski değerle üzerine yazılmaz. |
| Eğitim bilgileri | Seviye ve alt seviye beraber, aktif katalogdan seçilir. Meslek/öğrencilik değişimi okul ve şirketi açıkça temizler; değişiklikten vazgeçilirse eski değerler korunur. Kaynak, okul, şirket seçilebilir ve yeni isim girilebilir. |
| Bilgi kaydı | Yalnız değişen alanlar güncellenir. Satış, bakiye, öğrenci lifecycle durumu, diğer profil bilgileri değiştirilmez. Bu kayıtlar mevcut yerel çalışma alanı modelini kullanır. |
| İletişim geçmişi | Öğrenci + kanal kapsamı, Türkçe içerik/gönderen araması, tarih aralığı ve kaynak `sort/order` URL parametreleri. Saat dahil tarih, gönderim durumu ve içerik gösterilir. İkon aksiyonu mevcut logun içerik önizlemesini açar; artık başka koleksiyonda bulunmayan mesaj adresine düşmez. |
| WhatsApp konuşması | Gelen/giden mesajlar kronolojik, sınırlı yükseklikte ve ayrı kaydırmalı. Yanıt textarea, karakter sınırı ve gerçek alıcı doğrulaması; mesaj taslağı saklanabilir. Gönderim servisi bağlı olmadığından gönder düğmesi pasiftir ve hiçbir mesaj sıraya alındı diye gösterilmez. |
| Görüşme geçmişi | Oluşturma/görüşme tarihi sıralaması, arama, tarih filtresi, CSV/JSON; planlanmamış görüşmeler iki sıralama yönünde de sonda kalır. |
| Belgeler | Kaynaktaki belgesiz satış dropdown'ı, eğitim/tutar/ödeme tipi etiketi ve satış geçmişine geçiş. Uygun satışlar ayrı kaynak koleksiyonundan alınır; eksik belge listesinden uydurulmaz. Önizlemede öğrenci/yetkili imza durumu, tarih, tutar, ödeme tipi ve sürüm görünür. İmzalı asıl dosya bağlantısı açık iş olarak kalır. |
| Not gösterimi | Harf notu, yüzde, sıfır puan ve bilinmeyen not ayrılır; null not `0` veya `null / 100` olarak gösterilmez. |
| Tablo seçimi | Öğrenci, belge, iletişim ve görüşme tablolarında sayfa seçimi ve filtrelenmiş tüm kayıtları seçme. Filtre dışına çıkan/silinen kayıtlar seçimden çıkar. Tabloya geri dönülünce mevcut filtre/sayfa korunur; filtre değişince ilk sayfaya dönülür. |
| Dışa aktarma | Filtrelenmiş tüm satırlar veya yalnız seçilenler, tablodaki sırayla CSV/JSON. Sadece ilan edilen sütunlar dışa aktarılır; dahili alanlar sızmaz. CSV kontrol karakteri/boşluk ön ekli formülleri etkisizleştirir, negatif sayısal tutarı sayı olarak tutar. |

## Kabul ve açık sınırlar

- 134 birim/model testi geçti, 0 hata; yeni dokuz senaryo seçim, dışa aktarma, öğrenci/kanal filtreleri, görüşme sıralaması, not gösterimi ve alan düzeltmesini kapsar.
- Sayfa denetimi: 117 navigasyon hedefi dolu/boş koleksiyonlarla, 154 kaynak adres kalıbı, 42 rapor yaprağı. Sunucu render kontrolü tarayıcı etkileşiminin yerine sayılmaz.
- TypeScript ve Vite production derlemesi geçti. Ana bootstrap 653,19 kB (gzip 196,21 kB); ana chunk boyutu uyarısı hâlâ açık; bu paket performans kabulü beyanı değildir.
- Önceki izinli tarayıcı girişiminin `ERR_BLOCKED_BY_CLIENT` engeli sürmekte olan kabul sınırıdır. Alternatif host/port ile aşılmadı. Mobil klavye, gerçek mouse/hover, tablet ve TV görünümü doğrulanmış sayılmıyor.
- Kaynaktaki Excel/XLSX çıktısı henüz eklenmedi; bu paketin dışa aktarma seçenekleri açıkça CSV ve JSON'dur.
- Öğrenci genel görünümü alan düzenleme eşliği ilerledi; kaynak silme/erişim tanıma, görüşme tamamlanma aksiyonu, bazı rol formları ve bütün rapor hesapları tam eşlik diye işaretlenmedi.
- Auth, tenant/şube izolasyonu, sunucu mutasyonları, imzalı dosya indirme, WhatsApp yanıt gönderimi ve diğer dış servis işleri [önceki kabul kaydında](completion-2026-09-10.md) açık kalır. Prototip verileri gerçek servis/teslimat kanıtı değildir.
