# Jamaster-web kaynak eşleştirmesi

Karşılaştırma: `jamasterlms/jamaster-web`, `7810bd1720c57749f6d5249536ba015f2a53694f`.
Bu çalışma ön yüz ve sunum akışını günceller; kaynak uygulamanın API’lerine yazmaz.

| Kaynak                                                     | Uygulanan alanlar ve davranışlar                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin/students/config.tsx`                                | Arama, bireysel/kurumsal/kurum çalışanı çoklu filtresi, tarih/ad/öğrenci numarası sıralaması, danışman sütunu, görüşme ve profil işlemleri                                                                                                                    |
| `admin/students/register/page.tsx`                         | Dört kayıt adımı; kişisel bilgiler, kimlik/doğum/ikinci telefon/adres/görsel; ders tipi, seviye ve alt seviye, gün ve saat tercihleri, meslek, kaynak, kurum/şirket; altı görüşme tipi ve sekiz sonuç; 1–5 skor; koşullu tarih; satış sonucunda satış sayfası |
| `components/forms/admin/group-form.tsx`                    | Grup tipi, eğitim tipi, seviye/alt seviye bağımlılığı, öğretmen, program dönemi, sınıf, durum, gün/zaman dilimi, açıklama                                                                                                                                     |
| `admin/groups/config.tsx`                                  | Arama, grup/eğitim tipi çoklu seçimi, durum, özel ders grubu, tarih aralığı; tablo sütunları ve detay/atama akışı                                                                                                                                             |
| `components/forms/admin/teacher-form.tsx`                  | Ad, e-posta, telefon, durum; isteğe bağlı maaş tutarı, saatlik/haftalık/aylık türü, 1–31 ödeme günü                                                                                                                                                           |
| `components/forms/admin/expense-form.tsx`                  | Başlık, tutar, kategori, zorunlu açıklama; gelir/gider, tek seferlik/tekrarlayan; tarih, dönem, başlangıç/bitiş, aktif tekrar                                                                                                                                 |
| `admin/expenses/config.tsx`                                | Arama, işlem tipi, tarih aralığı, başlık/tarih sıralaması                                                                                                                                                                                                     |
| `components/forms/admin/pricing-form.tsx`                  | Eğitim, dönem, sözleşme, fiyat, kampanya işareti; nakit/havale/kart/online/senet için yüzde veya tutar indirimi ve sınırları                                                                                                                                  |
| `admin/sms/create/page.tsx`, `admin/email/create/page.tsx` | Tek alıcı/toplu hazırlama, kanalına uygun telefon veya e-posta alanı, grup alıcıları, başlık, mesaj ve şablon                                                                                                                                                 |

Tarih ve sayı alanları uygun HTML input türlerini kullanır. Yerel modellerin kimlikleri sunucudaki UUID kayıtlarının yerini almaz; entegrasyon sırasında gerçek eğitim/dönem/sözleşme seçenekleri API’den beslenmelidir. Mesajlar taslak olarak tutulur. Raporda bulunmayan sunucu verisi uydurulmaz.

Bileşen kaynakları: [shadcn Data Table](https://ui.shadcn.com/docs/components/radix/data-table), [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog#scrollable-overlay), [React Router](https://reactrouter.com/start/declarative/routing). Proje, jamaster-web’deki tablo API’siyle uyumlu TanStack Table 8.21.3 sürümünü kullanır.

8 Eylül devam incelemesinde kaynak dosyalar yeniden okundu. Zorunluluk ve koşullu alan farkları, gider toplamları ve alıcı geçişleri için [Form incelemesi](form-flow-review.md).

## Sonraki inceleme: sayfalar ve ilişkili kayıtlar

8 Eylül 2026 tarihli [sayfa/veri akışı incelemesi](./page-flow-review.md), yoklama, tahsilat, sözleşme ve doğrulama kaynak karşılaştırmasını günceller. Önceki tek satış sınırlamasının yerine kimlikli satış/tahsilat geçmişi ve aylık taksit planı eklendi. Sözleşme ekranı kaynakta olduğu gibi şablon yönetimine dönüştürüldü. Kaynak eşliğinin henüz tamamlanmadığı şube formu, onay yürütme ve sunucu bağlantıları aynı notta açıkça listelenir.
