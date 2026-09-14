# Giriş, erişim ve yardım revizyonu — 14 Eylül 2026

## Uygulanan kapsam
- Öğrenci/öğretmen/personel giriş formunda yanlış bilgi, ağ sorunu, deneme sınırı, doğrulama ve pasif hesap senaryoları.
- 17 erişim durumu: oturum, rol, yetki, onay, atama, kurum hesabı, bağlantı, bakım, sunucu hatası ve şifre bağlantısı. `/access/examples` inceleme ekranı; salt okunur işlem durumu.
- Güvenli, rolü koruyan dönüş adresleri; query değişiminde parola/sonuç temizliği; form hatalarında ilgili alana odak ve aria ilişkisi.
- Menüdeki Destek kaldırıldı; footer yardımı genişletildi. Eski adres korunur. Rol bazlı talep taslakları ve indirme; otomatik destek gönderilmez.
- Ortak sayfa başlığında kullanım ikonu; 36 rehber, 24 saniyelik sessiz MP4 + Türkçe altyazı + poster + yazılı adımlar. Kapalı dialog video yüklemez, otomatik oynatmaz. Kategori/arama, bölüm atlama, yükleme hatası ve yazılı alternatif.
- Soft renkler ve shadcn dialog/button/input/select korunur. Mobil yardım kartları tek sütuna, aksiyonlar alt satıra geçer; video dialog gövdesi kayar.

## Kanıt ve sınırlar
179 iş kuralı/regresyon testi geçti. 114 menü hedefi dolu/boş, 154 kaynak adres kalıbı ve 42 rapor alt sayfası statik React render kontrolünden geçti. Ek kontroller: role göre yardım, öğrenci/öğretmene finans kurtarma aksiyonu gösterilmemesi, kapalı video oynatıcısının mount edilmemesi. 36 MP4 ffprobe ile 24s/H264/yuv420p/1280x720 doğrulandı. Temsilî video kareleri görsel olarak incelendi.

Managed tarayıcı önizlemesi önceki oturumda ERR_BLOCKED_BY_CLIENT ile engellendi; gerçek tarayıcı, mobil klavye ve cihaz görsel kabulü tamamlandı sayılmaz. Gerçek kimlik/permission enforcement veya canlı servis entegrasyonu yapılmadı. Video içerikleri metinli anlatımlardır; gerçek uygulama ekran kayıtları değildir.
