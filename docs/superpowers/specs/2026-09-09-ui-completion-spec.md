# Jamaster UI tamamlama kapsamı

Tarih: 9 Eylül 2026. İncelenen prototip: v11, `cde2997f871166ae9c09a13915ffd7077ab5c316`.

Bu belge kullanıcının 7–9 Eylül taleplerini, 19 maddelik eksik listesini ve 9 Eylül 11.49/12.05 görselleriyle gelen ek düzeltmeleri toplar. Önceki inceleme belgelerindeki “uygulandı” ifadeleri kabul testi yerine geçmez. Bu tur yalnızca inceleme ve planlamadır; ürün kodunu ve yayımlanmış sürümü değiştirmez.

## Kapsam ve kaynak önceliği

Bu çalışma mevcut Jamaster ürününün tasarım yenilemesidir. **İşlevlerin kaynağı jamaster-web; görsel dilin kaynağı onaylanan ilk HTML; bunların üzerindeki değişikliklerin kaynağı kullanıcının açık talepleridir.** Mevcut prototipin farklı yaptığı bir iş, sırf kodlanmış olduğu için doğru kabul edilmez.

Sayfaların amacı, alt sayfalar, form alanları, veri türleri, zorunluluklar, koşullar, varsayılanlar, seçim kaynakları, filtrelerin anlamı, tablo aksiyonları ve yetkiye bağlı davranışlar korunur. Zorunlu alanları yukarı taşımak yerleşim değişikliğidir; isteğe bağlı alanı zorunlu yapmak iş kuralı değişikliğidir ve tasarım yenileme talebi bunu kendiliğinden yetkilendirmez. Kaynakta doğrulanmayan alan, enum, filtre veya işlev varsayımla eklenmez. Kaynakta bulunan işlev genel bir form veya farklı bir ekranla ikame edilmez.

İzin verilen ekler mevcut taleplerle sınırlıdır: durumu koruyan çalışma sekmeleri, sağ panel/önizleme ve tek/çift tıklama davranışı, akıllı öneriler/kısayollar, mobil drawer ve klavye araçları, uygulama ölçeği, talep edilen detay/kayıt girişleri, dashboard düzenlemeleri ve Orbs breathing ana yükleyicisi. Bunlar mevcut akışlara eklenir; kaynak akışların yerini almaz. Kaynak uygulama da hatalı görünüyorsa iki tarafı aynı hataya zorlamak yerine somut sapma ve düzeltme gerekçesi kaydedilir.

## Korunacak kararlar

- React, Vite, TypeScript, Tailwind ve tasarıma uyarlanmış shadcn/Radix bileşenleri kullanılacak. İş alanı bileşenleri bunları birleştirebilir; paralel bir temel UI kütüphanesi kurulmayacak.
- Görsel kaynak kullanıcının `Jamaster-Prototip.html` dosyası ve ilk soft tasarımıdır. Son renk kararı önceki yeşil denemelerini geçersiz kılar: ana yazı `#48424e`, erik tonu `#5b5062`, çizgi `#eeeaf0`, vurgu sarısı `#ffdb39`. Anlam taşıyan küçük metinler okunabilirliği sağlayan aynı ton ailesinden seçilir.
- Beyaz yuvarlatılmış yüzeyler; kontrollü cam etkisi; gereksiz iç içe border yok. Dialog arka katmanında blur yok, opacity ve hızlı açılış/kapanış var.
- Sidebar kapalıyken de birleşik. Hover ile genişler ve içeriği ezmeden üstüne gelir; touch ile düğmeden açılır. Tüm mevcut menü öğeleri erişilebilir kalır.
- Sidebar'da Hızlı arama ve profil adı/rolü menü metinleriyle aynı sol başlangıca oturur. İkonlar/avatar ortak ikon sütununda; metinler sola hizalı, kısayol/menü aksiyonu sağda olur. Logo/isim, arama, menü ve footer ortak yatay hizalama sistemini kullanır; açık/kapalı geçişinde merkezden sola sıçrama olmaz.
- Üst çalışma sekmeleri gerçek route tutar; Genel bölümü başlangıçtır. Aynı sayfa tekrar açılmaz; filtre, sıralama ve sayfa durumu korunur. Küçük sayfa gezintileri linktir; aynı sayfa içi görünüm değişimleri tab olabilir.
- Üst çalışma sekmelerinin silueti için en güncel kaynak 9 Eylül 12.26.55 görselidir: beyaz aktif sekme ana içerikle kesintisiz birleşir; sağ kenar yumuşak eğim ve iç kıvrımla içerik yüzeyine iner. Pasif sekmeler arkada, birbirini örten düşük kontrastlı yarı saydam yüzeylerdir. Yeni kaynak sekme şekline yön verir; başlığın hemen sağındaki hover/focus ile görünen, arka planlı X ve mevcut route/state davranışı korunur.
- Küçük aktif sayfa bağlantısında alt çizgi/iç alt gölge olmayacak. Aktiflik soft dolgu, metin ağırlığı ve `aria-current` ile belirgin kalacak; erişilebilir klavye odağı kaldırılmayacak.
- Uygulama ölçeği %70'e inebilecek. Seçenekler %70/75/80/85/90/100/110/125/150; mevcut tercih korunur, varsayılan %100. Portal ve tıklama koordinatları bütün ölçeklerde uyumlu kalacak.
- Input'a yaklaşmak yalnız uygun hover görünümünü değiştirebilir; odağı, açık/kapalı durumu veya değeri değiştiremez. Sidebar'ın özellikle istenen hover genişlemesi ile input davranışı ayrı ele alınır.
- Ana uygulama yükleyicisi kullanıcının seçtiği [Libraries.dev Orbs](https://libraries.dev/orbs) **breathing** animasyonudur: `thinking-orbs` paketinin `ThinkingOrb` bileşeni, `state="breathing"`, `size={64}`, açık tema ayarı. Animasyon yeniden çizilmeyecek; soft uygulama yüzeyinin ortasında gösterilecek. İlk uygulama açılışı ve tam sayfa yükleme bunu kullanır; mevcut sayfa içindeki tablo yenilemesi/satır işlemi tüm uygulamayı kapatmaz.
- Sağ Günlük akış/JamAI geçişi panel içinde. Büyük dış sekme görünümü geri getirilmeyecek. Panel kapanabilir; tablette/telefonda alt düğmeler drawer açar.
- Kayıt formlarında zorunlu bilgiler üstte, isteğe bağlılar altta. Koşula bağlı zorunlu alanlar ilgili zorunlu bölümde kalır. Sabit footer ve mobil klavye erişimi gerekir.
- Uzun listeler data table; dar alanda aynı işlevleri koruyan liste/kart gösterimi. Arama, filtre, sıralama, seçim ve işlemler mobilde kaybolmayacak.
- “Örnek veri” etiketi geri gelmeyecek. Gerçekte çalışmayan bağlantıya başarı gösterilmeyecek; geliştirme eksikleri ürün tamamlanmış gibi değerlendirilmeyecek.
- jamaster-web sayfa/alan/işlev eşliğinde esas alınır ve yalnız okunur. Bu plan Jamaster API'yi yeniden yazmayı veya ona commit atmayı içermez. Masaüstü ürünle paylaşılabilecek UI korunur; bu plan ayrı bir Tauri/Electron uygulaması inşa etmez.

## Durum sözlüğü

**Eksik:** İstenen iş alanı/etkileşim yok. **Kısmi:** Bir kısmı var; bilinen mantık ya da kapsam farkı var. **Kod var, kabul açık:** Uygulama mevcut ama ilgili kullanıcı senaryosu/cihaz doğrulanmadı. **Kaynakta tamam:** Kaldırma gibi doğrudan kodda doğrulanabilen sınırlı talep tamam.

## Son 19 isteğin durumu

| No | İstek | Mevcut durum | Kapanması için gereken |
| --- | --- | --- | --- |
| 1 | Dar kartlarda ikon/tutar taşması | Kod var, kabul açık | Gerçek dar içerik genişliği, büyük tutar ve ölçekli ekran ölçümleri; küçücük yazıyla gizleme yok. |
| 2 | Sidebar yer değiştirmesin, kesilmesin | Kısmi | Gizli alt menülerin boşluk bırakması ve sabit label/row ölçülerinin denetlenmesi; aynı scroll ve ikon koordinatları. |
| 3 | X yazının yanında, arka planlı | Kod var, kabul açık | Çok sekme, uzun başlık, hover/focus/touch ve çakışmayan tıklama alanı. |
| 4 | Tablo hover'ı genişlesin, yatay padding | Kısmi | Dashboard düzeltmesini tüm tablolarda ortak hale getirmek; ilk/son hücre, checkbox ve aksiyon hizası. |
| 5 | Öğrenci/grup/öğretmen/personel detayları | Kısmi | Öğretmen ve grup sınırlı özetler; personel yalnızca temel alanlar. Kaynakla eşlenmiş ilişkili alt sayfalar gerekli. |
| 6 | Dialog sabit header/footer, mobil erişim | Kısmi | Tüm uzun dialogları kapsama; iç içe dialog, hata odağı, kirli formdan çıkış ve gerçek klavye kontrolü. |
| 7 | Takvim hataları | Kısmi | Query route hatası, gece yarısı, kısa/çakışan olayların okunması ve dokunmatik kullanım. |
| 8 | Diğer taşmalar | Kabul açık | Sayfa aileleri ve portal bileşenlerinin genişlik/yükseklik matrisi. |
| 9 | Aktif alt sayfa belirgin olsun | Kod var, kabul açık | Query'li/alt detay route'ları da doğru aktif kalmalı; uzun etiket mobilde erişilebilir. |
| 10 | Tüm inputlarda placeholder | Kısmi | Genel “Bilgi girin” yerine alanın beklediği biçim; özel seçim/tarih/para alanları; label korunur. |
| 11 | Özel telefon ve fotoğraf inputu | Kısmi | Ülke seçimi yok; fotoğraf personelde yok. Değiştirme/silme/hatalı dosya ve tüm kullanım noktaları. |
| 12 | Klavye üstünde geri/ileri/kapat | Kod var, kabul açık | Radix focus trap, select, textarea, yatay yön, harici klavye, iOS ve Android'de erişim. |
| 13 | Sağ panel yüksekliği, tek/çift tık önizleme | Kısmi | Query'li düzenleme adresleri bozuk; tüm link ve satırlarda eş davranış, isim yerine ID ilişkisi ve tam yükseklik kontrolü. |
| 14 | Eksik filtre ve chartlar | Kısmi | Bazı eğitim raporlarının hesabı yok; filtre/list/chart/CSV aynı sonucu kullanmalı. |
| 15 | Search focus beyazlaşmasın | Kod var, kabul açık | Normal/focus/autofill/disabled durumları; komut araması dahil. |
| 16 | Sekme aralığı ayarı kalksın, kompakt olsun | Kaynakta kaldırılmış | Ayarı yeniden eklememek; kompakt sekme davranışı görsel kontrolden geçmeli. |
| 17 | Ayarlar tamamen doğru olsun | Kısmi | Banka koleksiyonu, kapsam ayrımı, şube kaynağı, iyzico modu, kaynak alan zorunlulukları ve kayıt durumları. |
| 18 | Akıllı öneriler ve kısa yollar | Kısmi | Risk eşikleri çelişkili; bugün bağlantısı gün filtresi taşımıyor; bazı kısa yollar drawer'ı kapatmıyor. |
| 19 | Yeni görüşmeden yeni öğrenci kaydı | Kod var, kabul açık | İptal/geri dönüş, başarılı kayıt sonrası aynı öğrenciyle tek görüşme, taslak ve odağın korunması. |

## 9 Eylül ek istekleri

| Kimlik | İstek | Doğrulanan durum | Kabul ölçütü |
| --- | --- | --- | --- |
| A01 | Takvim gibi küçük aktif bağlantıların alt border'ı kalksın | G17: çizgi `inset` gölgeden geliyor | Normal temada alt çizgi yok; aktif/hover/focus birbirinden ayırt edilebilir. |
| A02 | Ölçek %70'e kadar düşsün | G18: seçenekler %85'ten başlıyor | %70/75/80 seçilebilir, saklanır; reload sonrası korunur; portal ve input hedefleri doğru konumda. |
| A03 | Mouse input'a yaklaşınca etkinleşme hatası çözülsün | Kullanıcı bildirimi açık; G19 bir yerleşim farkı, tetiklenmenin kanıtlanmış nedeni değil | Yaklaşma/hover odağı, menüyü, değeri veya kaydı değiştirmez; click/tap/klavye ve menü içi gezinme çalışır. |
| A04 | Sidebar yeniden incelensin | G10 sürüyor; menü kaynağı ve alt bağlantılar yeniden okundu | Birleşik soft yüzey, sabit ana ikon izleri, doğal alt menü, sıçramayan scroll; açık/kapalı/touch kabulü. |
| A05 | Mevcut ürünün sayfa/input/işlev eşliği korunsun | G20/G21 somut takvim/yoklama sapmaları; tam envanter henüz açık | Her hedef kaynak → prototip → hedef karşılaştırmasına bağlı; izinsiz iş kuralı değişikliği ve kayıp kaynak aksiyonu yok. |
| A06 | Orbs breathing ana loading olsun | Resmî dokümanda React `ThinkingOrb` ve `breathing` durumu doğrulandı; paket henüz prototipte yok | Başlangıç/tam sayfa bekleme gerçek yükleme durumuyla açılır/kapanır; reduced motion, hata, %70–150 ölçek ve mobil ekran kabulü geçer. |
| A07 | Üst tab tasarımı 12.26.55 görseli gibi olsun | Görsel incelendi; mevcut PageTabs/mask/katman CSS'i okundu, görsel eşlik henüz doğrulanmadı | Aktif sekme gövdeyle birleşir; pasif katmanlar/eğim referansa uyar; hover/çok sekme/uzun başlık/%70–150/touch ile yazı ve tıklama alanları çakışmaz. |
| A08 | Sidebar hızlı arama ve kullanıcı adı ortalanmasın | 12.29.22 görselinde arama ve profil metni menü etiketlerinden farklı hizada | Arama, isim ve rol sola yaslı; ortak ikon/metin sütunları; uzun isim ve %70–150 ölçek dahil aç/kapa sırasında yatay sıçrama yok. |

Görsel kanıtlar: `upload/Ekran Resmi 2026-09-09 11.49.57.png` ve `upload/Ekran Resmi 2026-09-09 12.05.28.png`. Statik görsel tek başına hover tetikleyicisini kanıtlamaz.

Üst çalışma sekmesi referansı proje içinde korunur: [working-tabs-2026-09-09.png](../../references/working-tabs-2026-09-09.png). Görseldeki İngilizce örnek başlıklar uygulama içeriğine taşınmaz; mevcut Türkçe sayfa adları kullanılır. Bu üst çalışma sekmesi biçimi, sayfa içi küçük navigasyonlara veya sağ araç paneline yayılmaz.

Sidebar hizalama hata kanıtı: [sidebar-alignment-2026-09-09.png](../../references/sidebar-alignment-2026-09-09.png). Bu görsel mevcut sorunu belgeler; hedef, ortalı hızlı arama ve profil metnini menü satırlarının sol metin sütununa taşımaktır.

## Kodla doğrulanan başlıca bulgular

| Kimlik | Bulgu ve etkisi | Kanıt |
| --- | --- | --- |
| G01 | Query sayfa yoluna eklenip route çözümlemesine giriyor. `?edit=1` kayıt kimliği sanılabiliyor; filtreli bazı adresler yanlış sayfaya düşüyor. | `src/hooks/use-route.ts`, `src/app/app.tsx`, `src/app/page-router.tsx`. 9 Eylül statik App render'ında `/admin/groups?teacher=unassigned` ve `/admin/calendar?teacher=t1` → “Sayfa bulunamadı”; `/admin/groups/g1?edit=1` ve `/admin/teachers/t1?edit=1` → “Kayıt bulunamadı”; `/admin/payments/installments?status=Gecikmiş` → “Ödemeler”. |
| G02 | 113 hedef kontrolü query varyantlarını kapsamadığı için G01 yakalanmamış. Sayfanın render olması alt işlemleri doğrulamıyor. | `scripts/check-pages.tsx`, `src/data/navigation.ts`. |
| G03 | Bazı eğitim raporları için filtre/hesap yok, varsayılan boş liste üretiliyor. Bu “hiç kayıt yok” gibi görünüyor. | `src/features/insights/education-detail-page.tsx`: `ending-soon-students`, `bonus-used-students`, `bonus-remaining-risk`, `group-switch-history`, `transfer-out-students`, `low-attendance-high-remaining`, `zero-bonus-remaining`, `long-freeze-students`, `no-advisor-students`. Görüşmeler route'u ayrı MeetingsPage'e gider; bu eksik listesine dahil değildir. |
| G04 | İptal/iade defteri ve bazı analizler veri olmamasından bağımsız boş diziye indirgeniyor. | `financial-ledger.tsx` içindeki cancelled/refunded; `finance-analysis-page.tsx` içindeki cancellation/contracts. |
| G05 | Akıllı öneri %80, risk raporu %90 kullanıyor. “Bugünkü görüşmeler” bağlantısı gün filtresi aktarmıyor. | `smart-suggestions.tsx`, `education-detail-page.tsx`, `meetings-page.tsx`. |
| G06 | Öğretmen önizleme/detayında dersler ada göre ilişkilendiriliyor; detay ilk 6 kayıtta kesiliyor. Grup üyeliği grup adına bağlı. | `entity-preview.tsx`, `teachers-page.tsx`, `groups-page.tsx`. |
| G07 | Personel/kullanıcı/şube aynı `string[][]` modeli ve genel form ile yönetiliyor; personel telefonu/e-postası isteğe bağlı, şifre/izin/maaş alanları yok. | `team-page.tsx`; kaynak UserForm telefonu/e-postayı zorunlu tutuyor, oluşturma şifresi ve branchPermissions/staffSalary içeriyor. |
| G08 | iyzico kaynak formundaki sandbox/canlı `mode` alanı yok. Entegrasyonlarda tüm alanlar aynı biçimde zorunlu işaretlenmiş. | `integration-settings.tsx`; kaynak `iyzico-settings-form.tsx`. Alan başına eşleme gerekli. |
| G09 | Şube seçimi sabit üç isim; yeni/yeniden adlandırılmış şubeyle birleşmiyor. Kurum ve şube ayarları aynı anahtarları kullanıyor. | `topbar.tsx`, `settings-model.ts`, `settings-page.tsx`. |
| G10 | Sidebar kapandığında genişletilmiş `.nav-children` görünmez ama alan kaplar; label 12.75rem ve satır 2.75rem sabit. | `styles/sidebar.css`; gerçek taşma miktarı tarayıcıda ölçülmedi. |
| G11 | PhoneInput ülke etiketini gösteriyor, ülke seçtirmiyor. Staff fotoğraf alanı yok. | `ui/phone-input.tsx`, `team-page.tsx`. |
| G12 | Ortak DataTable loading/error/manual pagination sözleşmesi sunmuyor. Bütün kayıtlar istemcide; mobil Card kökünde onOpen yok. | `ui/data-table.tsx`; mobil işlem bazı çağıranların düğmesine bırakılmış. |
| G13 | Takvim son saati 24 ile sınırlandırıyor; olaylar sadece başlangıç gününde filtreleniyor. Gece yarısını aşan olay ikinci güne bölünmüyor. | `calendar-page.tsx`, `lib/calendar.ts`. 2026 tarihi eski seri günlerin epoch'u; tek başına sabit gün hatası sayılmaz. |
| G14 | Görüşmede öğrenci değiştirme/detaya geçme taslağı bırakabiliyor. Uzun sayfa formları ve karar dialogları ortak sabit footer düzenini bütünüyle kullanmıyor. | `meeting-dialog.tsx`, `verification-page.tsx`, `settings-page.tsx`. |
| G15 | Profil güncellense de bazı selamlama/kilit/görüşme yazılarında sabit kullanıcı adı var. | `topbar.tsx`, `jamai-panel.tsx`, `meeting-dialog.tsx`. |
| G16 | CSS 6.443 satıra ulaşmış, aynı davranış birden fazla dosyada override ediliyor; bu bir bakım bulgusu, tek başına görsel hata kanıtı değil. | `styles/*.css`; özellikle `pages.css`, `refinements.css`, `dialogs.css`. |
| G17 | Küçük aktif bağlantının altındaki çizgi border değil, `box-shadow: inset 0 -2px #b3a8bd`. | `src/styles/pages.css`, `.page-navigation [aria-current='page']`. Yalnız bu dekoratif durum değişecek; genel focus gölgeleri ve forced-colors erişimi korunur. |
| G18 | Uygulama ölçek kümesi `[85, 90, 100, 110, 125, 150]`; saklanan tercih de bu kümeye göre doğrulanıyor. | `src/app/display-provider.tsx`, `src/components/layout/utility-menus.tsx`; `src/styles/layout.css` kök font büyüklüğünü `--ui-scale` ile değiştiriyor. Yalnız menüye %70 yazmak yeterli değil. |
| G19 | Prototip Select varsayılanı `item-aligned`; kaynak `popper`, alt yerleşim, collision kontrolü ve 8 px collision padding kullanıyor. Görseldeki yoklama grup/oturum Select'leri prototip varsayılanını kullanıyor. | Her iki deponun `components/ui/select.tsx` dosyaları ve yerel `src/features/calendar/attendance-page.tsx`. Yerel inputlarda özel hover-focus handler bulunmadı; genel hover/focus CSS'i ile sidebar pointer/focus olayları ayrıca incelenecek. Bu fark mouse yaklaşma hatasının kesin nedeni olarak işaretlenmez. |
| G20 | Kaynak takvim `view/edit`, `ALL/GROUP/PRIVATE`, ders oluşturma/güncelleme/silme ve mobil `listWeek` içeriyor. Prototip mobilde Gün görünümü açıyor; kaynak ders türü ve düzenleme modu eşliği tamamlanmamış. | Kaynak `app/[locale]/(main)/admin/calendar/page.tsx`; yerel `src/features/calendar/calendar-page.tsx`. Ders/görüşme filtresi GROUP/PRIVATE ayrımının eşdeğeri değildir. |
| G21 | Kaynak `/admin/calendar/pollings` aktif/bugünkü/yaklaşan yoklamalar, QR ve seçili yoklamaları yazdırma akışıdır. Aynı prototip route'u grup/tarih/oturum seçilen manuel yoklama formuna gider. | Kaynak pollings `page.tsx`, `_components/polling-header.tsx`; yerel `page-router.tsx`, `attendance-page.tsx`. Manuel kayıt akışını bu ekranın yerine koymak sayfa eşliği sağlamaz. Grup/öğrenci yoklama alt sayfaları ayrıca eşlenecek. |

## Kaynak karşılaştırması

Temel alınan jamaster-web commit'i: `7810bd1720c57749f6d5249536ba015f2a53694f`. Bu tur yeniden okunanlar:

- [Personel oluşturma/düzenleme akışı](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/%5Blocale%5D/(main)/admin/staff/form/page.tsx)
- [Personel/kullanıcı formu ve Zod şemaları](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/components/forms/super/user-form.tsx)
- [iyzico ayar formu](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/components/settings/iyzico-settings-form.tsx)
- [Select davranışı](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/components/ui/select.tsx): `popper`, collision ve portal konumu.
- [Telefon alanı](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/components/ui/phone-input.tsx): `react-phone-number-input`, aranabilir ülke seçimi, kanonik değer, `smartCaret=false`; sıfırdan farklı telefon mantığı icat edilmeyecek.
- [Menü ağacı ve aktif route kuralları](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/%5Blocale%5D/(main)/_components/sidebar/sidebar-data.ts) ve [menü öğesi](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/%5Blocale%5D/(main)/_components/sidebar/sidebar-nav-item.tsx): Genel/Eğitim/Finans/İletişim/Yönetim, süper alanı, ayar kapsamları; ana link ile alt menü açıcı ayrı. Hover prefetch, navigasyon değildir.
- [Takvim sayfası](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/%5Blocale%5D/(main)/admin/calendar/page.tsx): görünüm/düzenleme, grup/özel ders, mobil haftalık liste.
- [Yoklamalar sayfası](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/%5Blocale%5D/(main)/admin/calendar/pollings/page.tsx) ve [yoklama araçları](https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/%5Blocale%5D/(main)/admin/calendar/pollings/_components/polling-header.tsx): QR, seçim, yazdırma ve ilgili yüklenme durumları.

Kaynak aylık görüşme kısayolu yerel takvimle ay başı–bugün aralığı, `dateField=meetingDate` ve `meetingDateResultStatus=pending` kullanır. Prototip `navRoute()` bu URL'yi `admin/reports/monthly-meetings` yoluna dönüştürüyor; eşdeğer filtre anlamı korunmadan salt başlık/route eşlemesi yeterli sayılmayacak. Kaynak menünün koyu görünümü taşınmayacak; menü kapsamı ve route anlamı ilk soft görünümle birleştirilecek.

Önceki kaynak incelemeleri: `docs/source-comparison.md`, `docs/form-flow-review.md`, `docs/page-flow-review.md`, `docs/ui-detail-review.md`. Bunların tarihsel bulguları güncel doğrulama gibi sunulmayacak. Tüm kaynak sayfalarının eşliği henüz tamamlanmış değildir; planın ikinci görevi alan/filtre/aksiyon envanterini tamamlar.

## Doğrulama sınırı

Son sürümdeki 47 test ve 113 statik sayfa kontrolü geçmiş doğrulama kaydıdır. Planın ilk hazırlanışında yukarıdaki beş query'li adres için ek statik App render kontrolü yapıldı. Ek taleplerle yapılan bu revizyonda kaynak dosyalar ve iki yeni görsel incelendi; uygulama testi yeniden çalıştırılmadı. Gerçek tarayıcı görüntüsü veya cihaz etkileşimi doğrulanmadı. Önceki `ERR_BLOCKED_BY_CLIENT` engeli için yalnızca izinli Sites önizleme tanılama yolu kullanılabilir; farklı host/port/tarayıcıyla engel aşılmayacak.

Backend bağlantısının olmaması UI alanlarını, doğru filtreyi, gerekli alt sayfayı veya tutarlı yerel hesabı eksik bırakmak için gerekçe değildir. Gerçek auth, şube yetkisi, kalıcı kayıt, gönderim, ödeme ve JamAI servisleri ise ayrı üretim kabul kalemidir.

## Ana yükleyici kabulü

Orbs seçimi bir uygulama davranışı kararıdır; kaynaktaki Jamaster iş kurallarını değiştirmez. Ortak yükleyici, erişilebilir “Jamaster yükleniyor…” / “Sayfa yükleniyor…” durum metniyle sunulur. Döngü yalnız gerçek bekleme boyunca çalışır; animasyonu göstermek için yapay bekleme veya sahte yüzde eklenmez. Yükleme hatası aynı yüzeyde hata/yeniden deneme akışına geçer. Sayfa yüklerken sidebar, açık sekmeler ve sağ panel hazırsa kullanılabilir kalır; kayıt taslağı sıfırlanmaz.

[Libraries.dev erişilebilirlik dokümanı](https://libraries.dev/accessibility) reduced motion desteğini açıklıyor. Entegrasyonda bu davranış ayrıca doğrulanacak; gerekiyorsa paketin `paused` seçeneğiyle hareketsiz gösterim kullanılacak. Gizli sekmede/unmount sonrasında gereksiz animasyon döngüsü kalmayacak. Bu tur yalnız plan güncellendi; bağımlılık kurulmadı ve yükleyici uygulamaya eklenmedi.
