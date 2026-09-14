# Soft erişim ekranları ve kalan UI düzeltmeleri — 14 Eylül

## Menü ve tasarım
- Sidebar'ın kaydırılabilir menüsünün sonunda **Uygulama ekranları**: öğrenci, öğretmen, giriş/şifre, hata/yetki alt sayfaları. Footer yardımı korunur; sabit footer içine uzun liste konmadığından kısa ekranlarda menü kaybolmaz.
- Girişte iki sütunlu soft beyaz form ve sarı rol kartı; rolün gerçek portal bölümlerine yönlendirmeler. Mobilde tek sütun.
- Erişim galerisinde rol seçimi, arama/kategori, hata kodları; tekil hata ekranlarında sembol, açıklama ve uygun kurtarma adımları. Sahte tekrar dene bağlantısı kaldırıldı.
- Yardımda posterli kartlar, öne çıkan sayfa rehberi; role göre seçim temizliği. Kapalı oynatıcı yüklenmez, görseller lazy, videolar otomatik oynamaz.

## Davranış düzeltmeleri
- Şifre yenileme ve hesap durumu geçişleri doğrulanmış returnTo değerini korur. Query ile hesap değişiminde gizli alanlar temizlenir; sonuç ekranına odak taşınır.
- Yardım dialog'ları açan düğmeye odak döndürür; support Radix trigger kullanır. Destek formu başarılı indirmede temizlenir; okunamayan eski taslakların üstüne yazılmaz.
- Menü aktifliği query'yi de dikkate alır: öğrenci ve öğretmen girişleri, ödeme alt filtreleri birbirine karışmaz.
- Takvim tüm belgeyi fullscreen yapar; body portalları erişilebilir alt ağaçta kalır. Ders taslağı X/Escape/Vazgeç ile doğrudan kaybolmaz, değişiklikleri silme onayı gerekir.
- Takvim görünümü/derslik/etkinlik/ders tipi/öğretmen birleşik URL filtre modeliyle paylaşılır; sıfırlama tek güncellemede uygulanır, diğer query anahtarları korunur.
- Gece yarısını geçen ders günlük akışta devam segmenti olarak görünür; orijinal detay kimliği korunur.
- Klavye araçlarına dokunma popover'ı dış tıklama diye kapatmaz; alan gezinmesi açık popover kapsamında kalır.

## Doğrulama ve gerçek sınırlar
183 test başarılı; 134 menü hedefi, 154 kaynak adres kalıbı ve 42 rapor alt sayfası SSR kontrolünde. Ek SSR: giriş iki sütun kompozisyonu, kurtarma adresi, posterler, URL takvim görünümü/filtre.

Bunlar kaynak ve statik React kontrolleridir. Önceki ERR_BLOCKED_BY_CLIENT engeli nedeniyle gerçek cihaz görsel/klavye/focus ve 320–3840 px tarayıcı kabulü yapılamadı. Auth/API/ödeme/mesaj/gerçek JamAI servis entegrasyonu bu yerel prototipte yoktur. Eski inceleme kayıtlarındaki tamamlanan maddeler tarihçedir; production-ready iddiası değildir.
