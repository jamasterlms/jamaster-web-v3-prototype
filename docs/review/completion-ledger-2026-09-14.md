# Jamaster — 14 Eylül uygulama ve kabul kaydı

Başlangıç: `720227d`. Kapsam: kullanıcının kalan prototip işlerini paralel inceleme, uygulama ve yayınlama talebi. Görsel sözleşme ilk HTML paleti ve mevcut soft React/Vite/shadcn bileşenleri.

| İş | Uygulama | Kabul sınırı |
| --- | --- | --- |
| Sidebar/ölçek | %70 dahil rem sınırına göre hizalama; bilinçli hover gecikmesi; hibrit dokunma algılama | Gerçek cihaz kabulü açık |
| Kayıt ve görüşme | Telefon/öğrenci ön doldurma, iki telefon/e-posta mükerrer kontrolü, mevcut kayıt seçimi, bağımsız taslaklar, mini takvim, sıralı rapor gezinmesi | Yerel veri akışı |
| Eğitim geçmişi | Bitiş tarihi, dondurma/sonlandırma, tarihçe, üç transfer türü, eski veriyi ezme ve tekrar transfer koruması | Transfer bekleyen yerel kayıt; sunucu tutar dağıtımı taklit edilmez |
| Taksitler | `installmentsTab=overdue` adresi, tüm/gecikmiş alt görünüm, mevcut durum filtreleri | Gerçek banka tahsilatı değildir |
| Yoklama | Hafta/ay/tüm dönem istatistikleri, QR önizleme/indirme/yazdırma, iptal edilmiş seçimleri temizleme | QR açıkça önizleme; canlı yoklama servisi yok |
| Portallar | Dönem/grup notları, öğretmen not özeti, işlevsel ana sayfa bölümleri, dosyalı ve tekrarlı teslim | Aynı cihazda IndexedDB dosyaları; gerçek sunucu depolaması yok |
| Raporlar | 42 yaprak için hesaplama, ortak JamAI ölçütleri, tarih/durum/ödeme filtreleri; bilinmeyen alan sıfır sayılmaz | Servis formülleri bulunmayan eşikler kullanıcı tarafından belirlenir |
| Ödeme | Şube/kurum/engelli/eksik kapsam; başarılı/ret/3D/süresi dolmuş senaryolar; kalan borç ve erişim sonucu | Yerel senaryolar; gerçek ödeme yapılmaz |
| Rehber | Gerçek alt sayfa ve sorguya göre öncelikli rol eşleme; bağlamda özel URL değerleri taşınmaz | Mevcut anlatım videoları; gerçek ekran kaydı çekilemedi |
| API hazırlığı | Açık yapılandırılan cookie + kurum/şube taşıyıcısı, timeout/belirsiz sonuç ayrımı, testleri | Yayın bu adaptöre bağlanmaz; oturum/ALTCHA/API/CORS gerekir |
| Sayfa envanteri | 134 menü hedefi, 154 kaynak kalıbı, 42 rapor ailesi | Rota varlığı tam servis eşitliği kanıtı değildir |

## Kaynak güncelliği

İlk karşılaştırma `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Son main kontrolü `c85bebcac6804fa9c7069b6594a5c615554d8854`. Aradaki ödeme erişimi/tamamlanma sözleşmesi ve kaynak davranışları bu pakette dikkate alındı. Eski inceleme dosyaları tarihçedir.

## Açık kabul işleri

- İzinli `terminal.local:4173` önizlemesi `ERR_BLOCKED_BY_CLIENT` ile engellendi. Alternatif host, canlı site veya başka tarayıcıyla aşılmadı. Telefon/tablet/TV, sanal klavye, ekran okuyucu, 200% tarayıcı zoom ve görsel taşma kabulü tamamlanmış sayılmaz.
- Aynı engel nedeniyle gerçek uygulama ekran kaydı videoları çekilmedi. Mevcut MP4/poster/altyazı dosyaları korunur.
- Kaynakta bulunmayan canlı rapor formülleri, auth oturumu/ALTCHA, gerçek para, mesaj ve polling servisleri sunucu bağlantısı ve kontrollü hesaplar gerektirir.
- 10.000 satır/16 sekme gerçek cihaz performansı henüz ölçülmedi. Statik render ve iş kuralı testleri bunun yerine geçmez.

## Doğrulama

- Bütünleşik `npm test`: **220/220 başarılı**, 0 hata.
- `npm run check:pages`: **134 menü hedefi**, **154 kaynak rota kalıbı**, **42 rapor alt sayfası** dolu/boş ve hazır ilk/tekrar render kontrollerinden geçti. Ödeme ve erişim durumları da kontrol edildi.
- Sites üretim derlemesi: TypeScript ve Vite başarılı. Başlangıç paketi **706,97 kB / 212,16 kB gzip**; mevcut 500 kB paket uyarısı devam ediyor. Bu ölçüm gerçek cihaz performansı değildir.
- `git diff --check`: başarılı.
- Paralel öneriler ana çalışma alanında birleştirildi; çakışan reducer değişiklikleri düzeltilip tüm testler yeniden çalıştırıldı.
- Yayın aynı Site ve mevcut paylaşım kapsamına yapılır; yetkiler değiştirilmez.
