# UI ayrıntıları, grup notları ve toplu program

9 Eylül 2026. Beşinci uygulama paketi; önceki yayın v12 / `df0a522`. Mevcut React/Vite + özelleştirilmiş shadcn yapısı korunur. Kaynak uygulamaya değişiklik yapılmadı.

## Kullanıcının beş düzeltmesi

1. Akıllı öneriler ve kısa yollar günlük akıştan JamAI içine taşındı. Öneriler sohbetin canlı duyuru bölgesinin dışındadır; liste kayarken mesaj yazma alanı sabit kalır. İptal edilmiş görüşmeler sayılmaz; devam uyarısı rapordaki aktif öğrenci / %90 eşiğiyle eşleşir. Boş görüşme ikonu düzeltildi.
2. Üst çalışma sekmelerinin şekli, genişliği, bindirme mesafesi ve rengi önceki `bf41a70` stiline döndü. Gerçek adresler, filtre hafızası ve yazının yanındaki kapatma düğmesi korunur.
3. Eğitim katalogları, öğretmen/grup/öğrenci detay listeleri, sözleşme, personel/şube, finans, görüşme ve iletişim tablo aksiyonları ikon düğmelere çevrildi. Erişilebilir adlar ve hover açıklamaları vardır. Silme onayları, pasiflik ve düzenleme mantığı değişmez. Yoklama seçimleri basılı durumunu koruyan ikonlardır. Mobil kartlardaki gerekli açıklamalar korunur.
4. Breathing orb yalnız uygulama başlarken, ilk sayfa kodu hazır olana kadar görünür. Sonraki route geçişlerinde orb yok; yapay bekleme eklenmedi. Azaltılmış hareket tercihi korunur.
5. Ortak isteğe bağlı alan bölümüne üst boşluk eklendi. Zorunlu alanlar üstte, isteğe bağlı alanlar altta kalır. Klavye araç çubuğunun eksik iki SVG sembolü eklendi.

## Kaynak eşliği

Kaynak: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`.

| Kaynak                                                      | Taşınan davranış                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/(main)/admin/groups/[groupId]/notes/page.tsx` | `/admin/groups/:id/notes` gerçek alt sayfası ve grup bağlamı                                                      |
| `components/notes/note-dialog-form.tsx`                     | Zorunlu başlık (1–255) ve içerik (1–10.000); hedef türü/kimliği; create/edit                                      |
| `components/notes/note-config.tsx`                          | `search` ve altı `sortOrder` seçimi: başlık/oluşturulma/düzenlenme × artan/azalan                                 |
| `components/notes/index.tsx`, `note-card.tsx`               | Önizleme, düzenleme, onaylı silme; oluşturulma/son değişiklik zamanı                                              |
| `hooks/main/notes.ts`                                       | Not kimliği/hedefi/tarih modeli; bu Site servis çağrısı yerine mevcut yerel çalışma alanını kullanır              |
| `.../schedule/create/components/types.ts`                   | Başlangıç haftası, 1–52 hafta, GROUP/PRIVATE; isteğe bağlı öğretmen/eğitim/hariç tarihler; yedi gün ve çoklu saat |
| `.../schedule/create/components/schedule-form.tsx`          | Pazartesi normalizasyonu, tekrar eden tarihler, hariç tutma, önizleme/onay/kayıt ve takvime dönüş                 |
| `.../schedule/create/page.tsx`                              | `saleId` varken PRIVATE başlangıcı; bilinmeyen satış bağlamında yanlış kayıt oluşturulmaz                         |

## Ek tutarlılık kontrolleri

- Notta boşluklardan oluşan başlık/içerik kabul edilmez. Düzenleme hedefi ve oluşturulma zamanı değiştirmez. Eski sürümden yapılan düzenleme/silme, daha yeni notu ezmez. Kirli dialog kapatılırken kullanıcıya taslağı koruma seçeneği verilir.
- Notlar çalışma alanındaki ayrı koleksiyonda saklanır; eski öğrenci/finans/grup kayıtları yeniden oluşturulmaz. Masaüstünde tablo, mobilde okunabilir kart ve ikon işlemler bulunur.
- Program taslağı route/şube bağlamındaki sayfa hafızasında korunur; zorunlu saatler isteğe bağlı atamalardan önce gelir. Form ve önizleme eylemleri sabit footer kullanır.
- Bitiş başlangıçtan sonra olmalıdır. Aynı haftalık taslakta çakışan saatler reddedilir. Bu, kaynak formun üstüne eklenen bir tutarlılık kontrolüdür.
- Mevcut takvimde aynı grup/öğretmen/öğrenciyle çakışan dersler önizlemede gösterilir. Kullanıcı açıkça kontrol etmeden kaydedemez. Yeni çakışma geldiğinde bu onay sıfırlanır. İptal edilmiş dersler uyarı üretmez.
- Dersler tek reducer eylemiyle eklenir; geçersiz bir öğe varsa hiçbir ders eklenmez. Mevcut kimlikler ve aynı dersin yinelenen kaydı korunur. Hızlı çift gönderim engellenir.
- Takvim dönüş URL'si ilk dersin tarihini taşır; takvim `date` parametresini okur ve gün/hafta/ay ilerlemesinde korur. Program alt sayfasında ders programı navigasyonu aktif görünür.

## Doğrulama ve sınırlar

- Son otomatik kontrol: `npm test` **113 / 113**; `npm run check:pages` **başarılı**; Sites build helper (TypeScript + Vite) **başarılı**; `git diff --check` **temiz**. Mevcut 500 kB chunk uyarısı sürer; bundle/performance kabulü kapanmadı.

- Not alan sınırları, eski sürümden düzenleme, hedef izolasyonu; hafta normalizasyonu, tekrar/hariç tarihler, geçersiz saatler, çakışmalar, ay/yıl/DST sınırları, yinelenen/atomik kayıt için testler eklendi.
- Gerçek sayfa implementasyonları SSR kontrolüne dahil edildi: notlar/arama/sıralama, toplu program, takvime tarih aktarımı ve yanlış grup/satış kimlikleri. JamAI önerilerinin günlük akıştan ayrıldığı kontrol edildi.
- Statik render, gerçek mouse/touch/klavye veya görsel kabul değildir. Önceki Sites tarayıcı önizlemesi `ERR_BLOCKED_BY_CLIENT` ile bloke olduğundan bu kapı hâlâ açık; engellenen yol başka host/port/tarayıcıyla aşılmadı.
- İlk dört paketteki API/auth/şube yetkileri, gerçek JamAI hizmeti ve dosya/ödeme/iletişim entegrasyonları bu paketle tamamlanmış değildir. Notlar ve dersler mevcut tarayıcı çalışma alanında kalır.
- Kaynak özel ders tercih servisi bağlı değildir: satıştan süre/hafta/gün tercihleri uydurulmaz. Tanımlı satışın gerçek yerel öğrenci kimliği varsa özel ders bağlamına taşınır. Öğretmen/öğrenci gerçek kaynak veri kümeleri, personel izinleri, raporların kalan filtre/kolon/özet eşliği ve cihaz/performance kabulü sonraki işlerdir.
