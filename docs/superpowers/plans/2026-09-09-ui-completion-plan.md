# Jamaster UI Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Bu plan aynı oturumda sıralı uygulanır; ayrı agent kullanımı varsayılmaz.

**Goal:** jamaster-web'in mevcut sayfa, alan ve iş kurallarını koruyarak onaylanan ilk soft tasarımı uygulamak; kalan route, form, detay, tablo, takvim eksiklerini ve yalnız kullanıcının istediği ek özellikleri kanıtlanabilir akışlarla tamamlamak.

**Revision:** 9 Eylül ek talepleri işlendi: küçük aktif bağlantının alt çizgisi, minimum %70 ölçek, input'a yaklaşınca etkinleşme hatası, sidebar'ın yeniden incelenmesi, işlev eşliğinin bağlayıcı hale gelmesi, Orbs breathing ana yükleyicisi, 12.26.55 görseline göre üst sekmeler ve 12.29.22 görselindeki sidebar arama/profil hizası. G17–G21 kaynak/kod bulguları eklendi. Kullanıcının “ok go” onayıyla uygulama başladı; görev bazlı güncel durum ve açık kabul kapıları [uygulama kaydında](../../review/execution-status.md).

**Architecture:** Mevcut React/Vite uygulaması korunur. Route eşleme ile query durumu ayrılır; şube/kayıt kimlikleri ve filtrelenmiş sonuçlar ortak veri sözleşmelerinden beslenir. shadcn temel bileşenleri korunarak iş alanı formları ve detayları ayrıştırılır; tüm uygulamayı yeniden yazan bir framework kurulmaz.

**Tech Stack:** Mevcut kilitli React 19, TypeScript, React Router 7, Vite 8, Tailwind 4, shadcn/Radix, TanStack Table, Zod, libphonenumber-js. Bir paket değişikliği gerekiyorsa ilgili görevin somut ihtiyacıyla gerekçelendirilir.

**Spec:** `../specs/2026-09-09-ui-completion-spec.md`

## Global Constraints

- Uygulama kaynağı `/workspace/sites/jamaster-workspace`; başlangıç commit'i `cde2997f871166ae9c09a13915ffd7077ab5c316`, yayımlanan sürüm v11.
- Kullanıcının son HTML paleti ve soft yapı kararları geçerli; yeşil tema veya dış sağ panel sekmeleri geri getirilmeyecek.
- İşlevin kaynağı jamaster-web, görünümün kaynağı ilk HTML, ek özelliklerin kaynağı açık kullanıcı talebidir. Prototipteki mevcut sapma hedef davranış sayılmaz. Kaynak sayfa/alan/koşul/varsayılan/filtre/aksiyon yeni tasarıma taşınır; başka bir iş akışıyla ikame edilmez.
- Zorunlu/isteğe bağlı alanları ayırmak alanların mevcut zorunluluğunu değiştirmez. Kaynakta veya kullanıcı talebinde dayanağı olmayan iş kuralı, enum, alan ve aksiyon eklenmez. Aşağıdaki sayfa aileleri inceleme kapsamıdır; kaynaksız yeni özellik üretme listesi değildir.
- Sidebar birleşik ve overlay; default kapalı. Tüm linkler hem mouse hem touch ile erişilebilir.
- Sidebar hızlı arama, kullanıcı adı ve rolü sola yaslıdır; menü etiketleriyle ortak metin sütununda başlar. İkon/avatar ve sağ kısayol/aksiyon sütunları ayrıdır; açık/kapalı geçişinde yatay sıçrama olmaz.
- Üst sekmeler gerçek URL tutar; sekme aralığı ayarı yok. Alt sayfalar link, aynı sayfa içi durumlar uygun shadcn Tabs ile değişir.
- Üst çalışma sekmesi şeklinin en güncel referansı `docs/references/working-tabs-2026-09-09.png`: aktif beyaz yüzey gövdeyle birleşir; pasifler arkada katmanlıdır, sağ kenarlar yumuşak eğimlidir. Üst sekme biçimi küçük sayfa navigasyonu ve sağ panel geçişine uygulanmaz.
- Küçük aktif bağlantılarda dekoratif alt çizgi yok; aktiflik soft dolgu/metinle korunur. Focus-visible ve yüksek kontrast erişilebilirliği kaldırılmaz.
- Ölçek seçenekleri %70/75/80/85/90/100/110/125/150; varsayılan %100, mevcut geçerli tercih korunur. Scale portal konumlarını veya tıklama hedeflerini bozamaz.
- Ana loading, [Libraries.dev Orbs](https://libraries.dev/orbs) içindeki `ThinkingOrb state="breathing"` olacak. Orijinal animasyon açık tema/soft yüzey üzerinde kullanılır; diğer orb durumlarına veya farklı bir efekt tasarımına geçilmez.
- Uzun formlarda zorunlular üstte; isteğe bağlılar altta; koşullu zorunlular doğru bölümde. Form footer'ı görünür viewport içinde erişilebilir kalır.
- Table, Dialog, Sheet/Drawer, Popover, DropdownMenu, Select ve diğer mevcut shadcn parçaları genişletilir; paralel temel bileşenler üretilmez.
- Ürün kodu bu planlama turunda değişmez; deployment yapılmaz. Planın uygulanması ayrı adımdır.
- jamaster-web yalnızca okunur. Jamaster API'ye commit veya değişiklik yapılmaz.
- Her tamamlanma kaydı “kod / iş kuralı / tarayıcı / gerçek cihaz” kanıtlarını ayrı gösterir. Render testi görsel kabul yerine geçmez.

---

## Uygulama sırası ve teslim paketleri

| Paket | Görevler | Çıkış koşulu |
| --- | --- | --- |
| A — Çalışma akışını bozanlar | 1–2 | Query'li route ve edit adresleri doğru; tüm talepler kaynak/sayfa haritasına bağlı. |
| B — Ortak UI ve formlar | 3–7 | Alt çizgi kaldırılmış; %70 ölçek, breathing yükleyici, input pointer davranışı, sidebar/sekme/sağ panel ve mobil form kontrolleri doğrulanmış. |
| C — Ana iş sayfaları | 8–11 | Dört entity detayı, kayıt/görüşme, takvim/yoklama ve liste filtreleri tutarlı. |
| D — Sayfa eşliği ve veri doğruluğu | 12–15 | Dashboard/raporlar, ayarlar, eğitim ve yönetim sayfaları kaynakla eşlenmiş. |
| E — Ürün kabulü | 16–17 | UI durumları, performans ve cihaz matrisi kanıtları mevcut; üretim bağımlılıkları açıkça ayrılmış. |

Görev başına bağımsız inceleme yapılır. Başarılı iş akışı ve ilgili hata senaryosu doğrulanmadan sırf build geçti diye görev kapatılmaz. Sadece CSS düzeltmeleri için uygulamayı taklit eden unit test yazılmaz; görsel ve ölçülebilir yerleşim kontrolü kullanılır.

## Görev 1 — Query'li route ve düzenleme hatalarını kapat · P0

**Files:** Modify `src/hooks/use-route.ts`, `src/app/app.tsx`, `src/app/page-router.tsx`, `src/data/navigation.ts`; ilgili query tüketicileri `groups-page.tsx`, `teachers-page.tsx`, `team-page.tsx`, `financial-ledger.tsx`, `meetings-page.tsx`; Test `tests/navigation.test.ts`, `scripts/check-pages.tsx`.

**Interfaces:** React Router `location.pathname` route seçer; `location.search` yalnızca `useSearchParams()` ile filtre/edit tüketimine gider. PageRouter'a query'siz, baştaki slash'i kaldırılmış pathname verilir. URL state, açıkça verilmiş filtreler için saklanan sayfa state'inden önceliklidir; verilmemiş filtreler korunur.

- [ ] Mevcut check-pages wrapper'ında aşağıdaki başarısız kontrolleri ekle; mevcut kodda hatayı göster.

```tsx
for (const path of [
  '/admin/groups?teacher=unassigned',
  '/admin/groups/g1?edit=1',
  '/admin/teachers/t1?edit=1',
  '/admin/calendar?teacher=t1',
]) {
  const html = renderToString(wrap(<App />, path));
  assert.ok(!html.includes('Sayfa bulunamadı'), path);
  assert.ok(!html.includes('Kayıt bulunamadı'), path);
}
```

- [ ] `useRoute` tüketicilerinde query gereksinimini listele; route seçicileri pathname ile çalıştır. Mevcut route isimlerini topluca değiştirme.
- [ ] `?edit=1` kimliği değiştirmeden edit durumunu açsın; kapatılınca query temizlensin. Aynı detay açıkken query değişimi de edit açabilsin; yalnız `useState` initializer'ına dayanmasın.
- [ ] Gecikmiş taksit, atanmamış öğretmen/grup, gün ve tarih aralığı URL'lerini ilgili filtreye bağla. Bugünkü görüşmeler doğru tarih ile açılır. Kaynak Bu Ayki Görüşmeler kısayolunun yerel ay başı–bugün, `dateField=meetingDate`, `meetingDateResultStatus=pending` anlamını koru; `navRoute()` dönüşümü bu parametreleri düşürmesin.
- [ ] Bilinmeyen ID için entity boş durumu; bozuk URI için kontrollü sayfa; öğretmen oluşturma ve diğer ayrılmış route isimleri için açık eşleme kullan.
- [ ] Ek kontrol: parametre sırası, back/forward, reload, aynı filtreli adrese tekrar dönüş, doğrudan yapıştırılmış detay URL'si. `npm run check:pages` ile query varyantlarının doğru sayfa başlığını da doğrula.
- [ ] Görev değişikliklerini ayrı commit'e al.

**Kabul:** Spesifikasyondaki beş bozuk adres doğru sayfaya gider. Filtre adı URL'de görünüp listede etkisiz kalmaz. Edit bağlantısı doğru kaydın formunu açar.

## Görev 2 — Sayfa ve alan eşliği envanteri · P0

**Files:** Create `docs/reviews/page-parity.md`, `docs/reviews/form-field-parity.md`; inspect `src/data/navigation.json`, `src/app/page-router.tsx` ve kaynak jamaster-web.

**Interfaces:** Her satır `kaynak route/commit/dosya → mevcut prototip → hedef davranış → alan/filtre/aksiyon → fark gerekçesi → doğrulama → durum` bilgisi taşır. Fark gerekçesi kaynak eşliğini sağlamak, onaylı görsel değişiklik veya belirli kullanıcı talebi olur. Kaynak hatası saptanırsa bulgu ayrıca kaydedilir. Durumlar spec sözlüğüyle aynı olur.

- [ ] Menüdeki tüm hedefleri çıkar; detay ve create/edit URL'lerini ayrıca ekle. Aynı genel bileşene giden farklı sayfaları tek “tamam” satırında birleştirme.
- [ ] Her kaynak sayfasında tablo config'i, form şeması, query parametreleri ve mutasyon girdilerini birlikte oku. İncelenen commit ve path'i satıra yaz.
- [ ] Kaynakla prototipi aynı rol/şube, aynı kayıt ve aynı filtre koşulunda karşılaştır. Kaynakta görünmeyen yetkili bir işlemle prototipte eksik bir işlemi karıştırma. Yetki, loading/error ve create/edit farklarını da envantere ekle.
- [ ] Form alanlarını `alan`, `tür`, `zorunluluk`, `koşul`, `varsayılan`, `kaynak seçenek`, `normalizasyon`, `hata mesajı`, `create/edit farkı`, `önizleme yeri` sütunlarıyla eşle.
- [ ] 19 maddeyi, A01–A08 eklerini ve eski kalıcı tasarım kararlarını görev numarasına bağla. API ihtiyacını UI eksikliğinden ayrı sütuna koy.
- [ ] G20/G21'i ilk örnek eşlik kayıtları olarak işle: takvimde view/edit ve ALL/GROUP/PRIVATE; yoklamalarda QR/listeler/yazdırma. Manuel yoklama formunun kaynak grup yoklama akışıyla ilişkisini kur; farklı amaçlı iki ekranı tek route altında eşdeğer sayma.
- [ ] Onaylı ekler listesi tut: çalışma sekmeleri/durum saklama, sağ önizleme/tek-çift tık, öneri/kısayol, mobil drawer/klavye araçları, ölçek, istenen detay/kayıt girişleri, dashboard düzenlemeleri ve Orbs breathing ana yükleyicisi. Bu listenin dışındaki fikirler uygulama görevine dönüşmesin.
- [ ] G03/G04 raporlarının “boş sonuç” ile “hesap eksik” ayrımını yaz. Mevcut veriden hesaplanabilen danışmansız öğrenci gibi işleri API bekliyor diye bırakma.
- [ ] Bu envanteri sonraki sayfa görevlerinde güncelle; yalnız dokümantasyon için ikinci bir uygulama modeli kurma.

**Kabul:** Menüde olup haritada olmayan hedef sıfır. Her alanın/filtrenin/aksiyonun kaynak dayanağı ve UI konumu belli; sadece zorunlu alanları saymak yetmez. Kaynakta mevcut işlevin kaybolduğu veya kapsam dışı iş kuralının eklendiği satır kapatılamaz. İşlevi bulunmayan route görünür şekilde açık iş sayılır.

## Görev 3 — Soft tasarım ve responsive yerleşim kuralları · P1

**Files:** Modify `src/styles/theme.css`, `base.css`, `layout.css`, `dashboard.css`, `pages.css`, `refinements.css`, `src/app/display-provider.tsx`, `src/components/layout/utility-menus.tsx`, `src/main.tsx`, `src/app/app.tsx`, `src/app/error-boundary.tsx`, `package.json`, `package-lock.json`; Create `src/components/shared/app-loading.tsx`, `docs/reviews/visual-acceptance.md`.

**Interfaces:** Mevcut renk/radius token'ları tek kaynak. Container genişliği içerik yerleşimini; pointer/hover yeteneği etkileşim biçimini belirler. İki karar birbirinin yerine kullanılmaz.

- [ ] İlk HTML'den panel, kart, metin, sekme ve araç barı örneklerinin ölçülerini kaydet. Görsel referansla karşılaştırmayı aynı viewport ve içerik uzunluğunda yap.
- [ ] Aynı seçicinin çelişen override'larını o bileşenin sahibi olan CSS dosyasında birleştir. 6.443 satırı sırf azaltmak için yeniden yazma; düzeltilecek bileşenlerle sınırlı sadeleştir.
- [ ] Kartta ikon sabit, metin alanı `min-width:0`; para miktarı ve birimi kontrollü ayrı hizalansın. `₺9.999.999.999,99`, negatif tutar, boş değer ve 60 karakter etiketle dene.
- [ ] Çok dar kartta grafik önce alt satıra geçsin veya bilgi taşımayan sparkline gizlensin; ana tutar okunamayacak kadar küçülmesin. Kısaltılmış tutarın tam değeri klavye/touch ile de erişilebilir olsun.
- [ ] Border'ı gruplandırmanın zorunlu olduğu yerde kullan; nested Card içinde tekrar Card çizgisi, çift ring ve ağır gölgeyi kaldır. Hata/focus sınırlarını kaldırma.
- [ ] Camı sidebar ve uygun navigasyon yüzeyleriyle sınırla; metnin üzerinde parıltı/hareket oluşturma. Desteklemeyen tarayıcıda okunur opak yüzey; reduced motion durumunda hareket azaltma.
- [ ] Search normal/focus/autofill, menü açık, seçili satır ve validation hallerini aynı paletle kontrol et. Kullanıcı adı/fotoğrafı tüm başlık ve kilit ekranlarında kayıt kaynağından gelsin.
- [ ] `displayScales` tek kaynağını `[70, 75, 80, 85, 90, 100, 110, 125, 150]` yap; menü, state doğrulama, `--ui-scale` ve kalıcı tercih aynı kümeyi kullansın. Eski tercihler korunur; %70/75/80 reload sonrası %100'e sıfırlanmaz. Geçersiz değer kontrollü varsayılana döner.
- [ ] Ölçeği sadece dış kapsayıcıya `transform:scale` uygulayarak çözme. Kök rem ölçüleri, px sınırları, portal koordinatları ve hitbox'ları birlikte kontrol et; ölçek değiştirmek açık formun değerini veya route filtresini sıfırlamasın.
- [ ] %70'te dokunmatik hedeflerin asgari fiziksel boyutunu koru; mobil input metni iOS'un istemsiz odak zoom'unu tetiklemesin. Kullanıcının seçtiği genel ölçeği sessizce iptal etmek yerine ilgili kontrollerde okunurluk/touch alt sınırı uygula.

**Kabul:** 320 px sayfada yatay belge taşması yok; tablo/takvim gibi bilerek kaydırılan bölge dışında içerik kesilmez. Sarı vurgu ve ilk soft görünüm korunur. Büyük tutar/uzun ad gerçek ölçümle kart sınırı içinde kalır. %70 seçilir/saklanır ve açık dropdown/dialog ile tıklama hedefleri ölçekle hizasını kaybetmez.

**A06 — Orbs breathing ana yükleyicisi:**

- [ ] Uygulama aşamasında `npm install thinking-orbs` ile resmî React paketini ekle; çözülen sürümü lockfile'a kaydet. Bu açık kullanıcı seçimi mevcut shadcn kullanımına ek bir görsel bileşendir. Efekti canvas/SVG/CSS ile yeniden üretme. Dokümandaki doğrulanmış temel kullanım:

```tsx
import { ThinkingOrb } from 'thinking-orbs';

<ThinkingOrb state="breathing" size={64} speed={1} dark={false} />
```

- [ ] `AppLoading({ scope }: { scope: 'app' | 'page' })` bileşenini yalnız yerleşim ve erişilebilirlik için ince bir kompozisyon olarak oluştur. Orb dekoratif katmanda `aria-hidden`; dış durum metni `role="status"`, `aria-live="polite"` ile bir kez anons edilir. App metni “Jamaster yükleniyor…”, page metni “Sayfa yükleniyor…” olur; yüklenen bölge `aria-busy` taşır.
- [ ] App kapsamı mevcut soft arka plan üzerinde görünür viewport merkezine; page kapsamı ana içerik yüzeyinin merkezine yerleşir. Ayrı sert çerçeve, büyük kutu, ekran blur'u veya yeni koyu tema ekleme. %70–150 ölçek, 320 px ve yatay/kısa ekranda metin ve orb kesilmesin.
- [ ] `main.tsx` başlangıç/Suspense sınırı ve Görev 16 route yükleme sınırına aynı bileşeni bağla. Yükleyici kendi beklediği lazy chunk'a bağımlı olmasın. Gerçek async hazırlık olmadığı yerde yapay timer ile yükleme yaratma; JS indirilmeden önce React orb'un çalıştığını varsayma.
- [ ] Sonraki sayfa yüklemelerinde uygulama kabuğu, sekme durumu, sidebar ve sağ panel korunur; yalnız ilgili ana içerik bekler. Tablo arkaplan yenilemesinde kayıtları kaldırma; yerel skeleton/pending durumu kullanılabilir. Form kaydetme ve tek satır işlemi tüm uygulamayı örten loader açmaz.
- [ ] Paket reduced motion davranışını doğrula; gerekirse `paused` ile sabit orb ve durum metni göster. Gizli sekme/unmount/StrictMode yeniden bağlanmasında animasyon döngüsü sızmasın; düşük güçlü cihazda gereksiz çoklu orb oluşturma.
- [ ] Hızlı tamamlanma, yavaş bağlantı, chunk hatası, tekrar deneme ve sayfa değiştirerek iptal senaryolarını doğrula. Animasyonun görünmesi için asgari sahte bekleme ekleme; gerçek işlem bitince kalksın, hata olduğunda sonsuza dek dönmesin. Kaynak: [Orbs kullanım dokümanı](https://libraries.dev/orbs), [erişilebilirlik davranışı](https://libraries.dev/accessibility).

**A06 kabul:** Seçilen `breathing` ana bekleme göstergesidir; diğer spinner temalarıyla rastgele değişmez. Başlangıç ve route beklemesi ortak sunumu kullanır; hızlı sayfa geçişi yapay gecikmez, hata yeniden denemeye geçer, reduced motion çalışır ve hazır UI'nın durumu korunur.

## Görev 4 — Sidebar ve çalışma sekmeleri · P1

**Files:** Modify `src/components/layout/app-sidebar.tsx`, `page-tabs.tsx`, `utility-menus.tsx`, `src/styles/sidebar.css`, `working-tabs.css`, `theme.css`, `layout.css`, `src/app/navigation/tab-model.ts`, `navigation-provider.tsx`, `src/components/navigation/page-navigation.tsx`. Visual source: `docs/references/working-tabs-2026-09-09.png`; sidebar issue: `docs/references/sidebar-alignment-2026-09-09.png`; evidence: `docs/reviews/visual-acceptance.md`.

**Interfaces:** Menü ağacı tek kaynak; açık/kapalı durum aynı ana link düğümlerini kullanır. Alt menü yalnız geniş panelde açılır; kapanışta boş görünmez blok üretmez. Gizli çocukların ana ikonları kaydırmaması için açılır alt menü alanı ile ana link izleri ayrı düzenlenir; CSS visibility yaması tek başına çözüm sayılmaz.

- [ ] Kaynak `sidebar-data.ts` ile Genel/Eğitim/Finans/İletişim/Yönetim, süper menü ve account/branch/super ayar kapsamını eşle. Sıra, alt link, rozet ve uygun yetki korunur; kaynak koyu tema taşınmaz. İlk HTML'nin birleşik soft yüzeyi korunur, kapalı rail arasında yapay boşluklar bırakılmaz.
- [ ] Menü kapalı/açık ekranında ilk, orta ve son ana linklerin koordinatlarını ve scroll değerini karşılaştır. Çocuk menü açıkken daraltma/yeniden açma senaryosunu ayrıca kaydet.
- [ ] Label genişliği ve sabit satır yüksekliği yerine kontrollü grid kolonları kullan; uzun metin 2 satıra çıkarsa ikon izini koruyan açık/kapalı eş yükseklik politikasını uygula. Sadece metni keserek tüm menüyü erişilemez bırakma.
- [ ] A08 için `.rail-search`, `.rail-profile` ve içlerindeki `.nav-label` metinlerini sola hizala; `ProfileMenu` Button'ının merkezleyen varsayılanını yalnız sidebar kullanımında düzelt. Ortak Button bileşeninin tüm uygulamadaki hizasını değiştirme. Arama ikonu/avatar menü ikon sütununda, “Hızlı arama” ve isim/rol menü etiketi sütununda başlasın; `kbd` sağ aksiyon sütununda kalsın.
- [ ] Header/footer'ın farklı padding ve avatar ölçülerini ortak sidebar sütunlarıyla uzlaştır; marka metni de aynı metin hizasına uyum sağlasın. Uzun isim ve iki satırlı rol ikinci bir merkezleme üretmesin. Kapalı rail'de metin gizlenirken ikon/avatar koordinatı korunur; açık ve touch drawer görünümünde ayrı hizalama oluşmaz.
- [ ] Hover giriş/çıkış, klavye odağı, touch toggle ve açılmış dropdown arasında geçerken sidebar erken kapanmasın. İçeriğin genişliği ve x konumu değişmesin.
- [ ] Kaynaktaki ana navigasyon linki ile alt menü açıcı ayrımını koru; oku açmak route'a gitmesin. Sidebar içinden açılan portalda odak DOM ağacının dışına geçti diye menü kapanmasın. Kapalı rail'in görünmez geniş alanı komşu input üstünde pointer yakalamasın; bu A03 için ölçülecek bir olasılıktır, doğrulanmış neden değildir.
- [ ] A07 için referanstaki üç sekmeli kompozisyonu aynı görünür genişlikte karşılaştır. Aktif sekmenin beyaz gövdeye bağlanan alt kenarını kesintisiz tut; eğimli sağ omuz ve alt iç kıvrım maskesini buna göre düzenle. İki yüzey arasında hairline, basamak veya boşluk oluşmasın. İlk/orta/son sekme aktifken aynı bağlantı çalışsın.
- [ ] Pasif sekmeleri arkaya doğru katmanlandır; hafif saydamlık çevredeki mevcut soft renkleri taşısın, yeni doygun pembe/yeşil tab dolgusu ekleme. Aktif yüzey en önde kalır. Hover'da komşu sekmenin başlığı/X'i örtülmez; kıvrım için çizilen dekoratif alan komşu linkin tıklamasını yakalamaz.
- [ ] Sekme X'i başlığın hemen sağında yumuşak arka planlı kalsın; görünmeyen buton gereksiz büyük boşluk bırakmasın. Dokunma hedefi komşu tabı kapatmasın.
- [ ] Referanstaki dengeli başlık hizasını mevcut Türkçe sayfa adları ve ikonlarla koru. X hover/focus'ta görünürken metin sıçramasın; touch'ta kapatma görünür ve erişilebilir kalsın. Bileşeni görsel için tek parça bitmap'e çevirme; shadcn NavigationMenu/Link/Button semantiği ve gerçek route davranışı devam eder.
- [ ] 3/8/16 sekme ve uzun entity adlarıyla küçülme, taşanlar menüsü, aktif sekmeyi görünür kılma ve kapatma sonrası odağı kontrol et. Sekme aralığı ayarını geri ekleme.
- [ ] Entity sekmelerinde genel “Öğretmen profili” yerine kayıt adını ve doğru ikonunu göster. Genel varsayılan sekmeler, tek route tek sekme, filtre/sayfa/sıralama dönüşü korunur.
- [ ] PageNavigation aktif eşlemesini ilgili pathname ve anlamlı query alanlarından üret; ilgisiz filtre query'si seçili alt sayfayı söndürmesin.
- [ ] `pages.css` içindeki `.page-navigation [aria-current='page']` seçicisinden `box-shadow: inset 0 -2px #b3a8bd` dekoratif alt çizgisini kaldır. Aktif pill soft dolgu/metin ağırlığıyla seçilir; hover aynı aktif görünümü taklit etmez. Tüm tab/input gölgelerini global sıfırlama; klavye focus-visible ve forced-colors anlamını koru.

**Kabul:** Sidebar hover'ında ana içerik oynamaz; linkler veya gizli çocuk alanları anlamsız boşluk üretmez. Üst sekmeler A07'nin aktif/gövde bağlantısı, eğim ve pasif katman referansıyla karşılaştırılmıştır. Sekme kapanışı doğru hedefte, klavye ve touch ile çalışır. Aktif alt sayfa her route varyantında nettir.

## Görev 5 — Sağ panel ve entity açma davranışı · P1

**Files:** Modify `src/features/entities/entity-model.ts`, `use-entity-navigation.ts`, `entity-preview.tsx`, `src/components/layout/daily-panel.tsx`, `tools-panel.tsx`, `src/styles/tools.css`, `src/app/display-provider.tsx`, `src/app/app.tsx`, `src/components/ui/data-table.tsx`.

**Interfaces:** Mevcut `EntityRef`, `entityPath` ve `useEntityNavigation` tek giriş noktasıdır. `fullPage=true` doğrudan route; panel görünürken normal açma preview; panel kapalıyken route. Çalışma/alt sayfa navigasyonu daima route'tur.

- [ ] Dört entity için liste hücresi, boş satır alanı, isim linki, aksiyon düğmesi ve mobil karttan açma davranışını eşle.
- [ ] Ctrl/Cmd-click ve orta tuş standart yeni browser sekmesini korusun. Checkbox, metin seçimi, link içi aksiyon ve çift tıklama ayrı işlevini kaybetmesin. Çift tık iki navigasyon/iki kayıt üretmesin.
- [ ] Önizleme bileşenlerini entity'ye göre ayır: Create `student-preview.tsx`, `group-preview.tsx`, `teacher-preview.tsx`, `staff-preview.tsx` aynı klasörde. Uzun detay sayfasını sağ panele olduğu gibi gömme.
- [ ] Önizlemede başlık/iletişim/durum, ilgili kısa özet, düzenle ve tam detay aksiyonu bulunsun. Tam detay ve edit Görev 1'in doğru URL sözleşmesini kullansın.
- [ ] Panel ana sayfa yüksekliğini izlesin; görünür viewport'ta başlığı ve kendi scroll alanı erişilebilir kalsın. Çok uzun ana sayfa sağ panele devasa boş alan veya ulaşılamaz composer üretmesin.
- [ ] Daily/JamAI geçişi panel içindeki mevcut yumuşak kontrolde kalsın. Preview kapanınca önceki araç, tarih ve sohbet korunur.
- [ ] Drawer içinden rota açan bütün kısa yollar drawer'ı kapatsın; yeniden açılış ve focus dönüşünü kontrol et. Drawer üzerinde dialog açılması scroll/focus kilidini bozmamalı.

**Kabul:** 4 entity × panel açık/kapalı × tek/çift tık davranış matrisi geçer. Kayıt silinmesi/yetkisiz erişim halinde kontrollü durum görünür. Preview ve detay düzenleme sonrası aynı veriyi gösterir.

## Görev 6 — Ortak form alanları ve doğrulama · P1

**Files:** Modify `src/components/ui/input.tsx`, `base-input.tsx`, `phone-input.tsx`, `profile-image-input.tsx`, `select.tsx`, `textarea.tsx`, `src/lib/validation.ts`, `profile-image.ts`; entity ve settings form alan dosyaları.

**Interfaces:** Telefon alanının kullanıcıya düzenlenebilir değeri ile form/API'ye giden kanonik değeri açıkça ayrılır; kaynak `react-phone-number-input` davranışı ve ülke seçimi esas alınır. Mevcut çağıranlar adaptörle korunabilir; farklı telefon kuralları icat edilmez. `defaultCountry` ülke kodunu sessizce değiştirmez. Fotoğraf kontrolü mevcut `value/onChange` sözleşmesini korur; işlenme/hata durumu form submit'ine bildirilir. Select/Popover yalnız açık bir aktivasyonla açılır; hover ile değer veya odak değişmez.

- [ ] Kaynak field-parity tablosundaki her alanın placeholder, label, yardım ve hata metnini eşle. “Bilgi girin” ve belirsiz “Seçin” kritik alanlarda kalmasın; tarih/saat tarayıcı affordance'ı label ve biçim yardımıyla desteklensin.
- [ ] Kaynak PhoneInput'ın Popover/Command ülke araması, bayrak/arama kodu, boş değer ve `smartCaret=false` davranışını mevcut alanla eşle; kaynak bileşenin uyarlanması veya eşdeğer adaptör arasında mevcut bağımlılıkları gözeterek seçim yap. Klavye ile ülke ara/seç; +90, 0090, 05… ve yurt dışı yapıştırma; eksik, fazla uzun, boş ve değişmeyen eski maskeli numara davranışını doğrula.
- [ ] `05321234567` ve `+905321234567` aynı kayıt kontrolünden geçsin; numara ortasında düzenleme caret'i sıçratmasın. Sahiplik doğrulaması yapısal doğrulamadan ayrı kalsın.
- [ ] Fotoğraf alanını personel dahil tüm istenen kişi formlarına bağla. Kabul edilen türleri ve mevcut 5 MB prototip sınırını kaynak yükleme sözleşmesiyle eşle; bu sınırı kaynağın doğrulanmış kuralı sayma. JPEG/PNG/WebP, bozuk dosya, doğrulanan boyut sınırı, aynı dosyayı yeniden seçme, değiştirme ve kaldırma senaryolarını dene. Desteklenmeyen decode durumunda kullanıcı fotoğrafını sessizce kaybetmesin.
- [ ] Logo ile kişi fotoğrafının sunumunu ayır: logo kırpılmadan `contain`; profil için uygun avatar. Yükleme bitmeden Kaydet geçerli eski fotoğrafı yanlışlıkla yazmasın.
- [ ] Zod alan şeması ile native validity'nin çifte/çelişkili hata üretmesini gider. İlk hata görünür ve odaklanabilir; bütün hatalar doğru `aria-describedby` ile bağlı.
- [ ] Para alanında virgül/nokta, negatif/sıfır sınırları ve kuruş; tarih aralığında ters aralık; koşullu seçimde bağlı eski değerin temizlenmesi; create/edit zorunluluklarını iş alanı bazında kontrol et.

**A03 — Mouse yaklaşmasıyla input etkinleşmesi için ayrı hata akışı:**

- [ ] İzinli önizlemede görseldeki Grup, Ders tarihi ve Ders oturumu kontrolleriyle tekrar üret. Mouse yaklaşma/üstüne gelme/click/menü kapandıktan sonra tekrar yaklaşma adımlarında `document.activeElement`, Select `open`, seçili değer ve hedef bounding rect kaydı al. Yalnız hover boyası ile gerçek focus/açılma/değer değişimini ayır; screenshot'tan neden ilan etme.
- [ ] `base.css` hover/focus kuralları, Select varsayılan `item-aligned`, wrapper/portal hitbox, pointer-events, z-index, focus restoration ve sidebar pointer/focus zamanlayıcılarını tek tek ele. Ölçüm gerçek sebebi gösterdiğinde o katmanı düzelt; tüm hover veya erişilebilir odağı kapatan yama uygulama.
- [ ] Kaynak Select'in `position='popper'`, alt yerleşim ve collision kurallarını prototiple uzlaştır. Grup/oturum filtreleri dahil varsayılana güvenen çağıranları tara; seçenek paneli tetikleyiciyi veya komşu inputu yanlışlıkla kaplamasın. Yerleşim farkını düzeltmek A03'ün tetiklenmesini doğrulamadan hatayı kapatmaz.
- [ ] Click/tap ve uygun Enter/Space ile açılma, Escape/dış click ile kapanma, yeniden yaklaşınca kapalı kalma, açık menü içinde normal pointer highlight ve ok tuşlarıyla seçimi kontrol et. Yalnız mouse yaklaşınca odak, değer, submit veya route değişmemeli.
- [ ] Aynı senaryoyu arama/text input, tarih, ülke seçici, dialog içi Select ve sayfa filtresinde; sidebar açık/kapalı, sayfa scroll'u ve %70/%100/%150 ölçekle çalıştır. Doğrulanan tetikleyiciye yönelik tek anlamlı regresyon ekle; düz CSS hover için uygulamayı taklit eden unit test yazma.

**Kabul:** Kayıt, edit ve önizleme aynı normalleştirilmiş veriyi kullanır. Telefon ve fotoğraf kontrolleri tüm kullanım noktalarında tutarlıdır. Sunucu alan hatası geldiğinde aynı alan içi UI kullanılabilir. A03, yeniden üretim → kök neden → düzeltme → aynı akışın başarılı tekrarı kanıtı olmadan kapanmaz.

## Görev 7 — Sabit footer, taslak koruma ve mobil klavye · P1

**Files:** Modify `src/components/ui/dialog.tsx`, `src/components/forms/keyboard-toolbar.tsx`, `src/hooks/use-visual-viewport.ts`, `src/styles/dialogs.css`, `refinements.css`; uzun form/dialog kullanan feature dosyaları; source-parity envanterine form kapsamı ekle.

**Interfaces:** Dialog `header → scrollable body → footer` düzeni; aynı formun tek submit hedefi. Mobil accessory yalnız aktif formun görünür, enabled ve düzenlenebilir alanlarını sıraya alır. Radix focus trap ile uyumlu scope korunur.

- [ ] Kayıt, öğrenci edit, öğretmen, grup, personel, görüşme, tahsilat, gider, fiyat, sözleşme, otomasyon, karar ve ayar formlarının footer konumunu tek tek denetle. Genel CSS seçicisine güvenmek yerine gerçek DOM hiyerarşisini kontrol et.
- [ ] Dialog ortalama ve opacity animasyonunu koru. Viewport kısa olduğunda header gereksiz metni azaltabilir; Kaydet/Vazgeç ve görünür hata alanı erişilemez kalamaz.
- [ ] VisualViewport, safe area ve accessory yüksekliği tek hesapta kullanılsın. Klavye üstü araç ile sabit footer üst üste binmesin.
- [ ] Previous/Next textarea, input ve combobox sırasını doğru izlesin. Hidden/readOnly/disabled atlanır; ilk/son alan sınırı ve açılan Select'ten dönüş yönetilir. Native klavye toolbar'ı olan cihazda yinelenen kontroller kullanılabilirliği bozmasın.
- [ ] Kapat/Escape/back/sekme değişimi veri kaybı üretiyorsa shadcn AlertDialog ile kaydedilmemiş değişiklik uyarısı kullan. Değişmemiş forma uyarı gösterme; çoklu modal katmanında yalnız en üst katman kapansın.
- [ ] Network veya validation hatasında taslak, scroll ve odak korunsun. Submit pending iken ikinci submit engellensin; başarılı kayıt tek kez işlensin.
- [ ] iOS Safari ve Android Chrome'da fiziksel klavye açık/kapalı, yatay yön, uzun formun son inputu ve nested SMS akışını uygula. Erişim yoksa bu satırlar açık kalır.

**Kabul:** Klavye açıkken son alan düzenlenip kaydedilebilir; footer'a ulaşmak için klavyenin kapanması zorunlu değildir. Geri/ileri/kapat toolbar'ı Radix odağına takılmaz. Kapanışta taslak yanlışlıkla silinmez.

## Görev 8 — Dört gerçek detay alanını tamamla · P1

**Files:** Modify `src/features/students/student-page.tsx`, `student-records.tsx`; split `groups-page.tsx`, `teachers-page.tsx`, `administration/team-page.tsx`; Create `src/features/education/group-detail-page.tsx`, `teacher-detail-page.tsx`, `src/features/administration/staff-detail-page.tsx`, `staff-model.ts`, `branch-model.ts`; update `src/app/page-router.tsx` ve preview tüketicileri.

**Interfaces:** Entity ID route ve ilişkilerin anahtarıdır. Eski isim/string-array kayıtları bir kez migration ile tipli modele taşınır; migration tekrar çalışınca ID değişmez. Tarihçe verisi oluşturulduğu andaki gerekli özeti korur; güncel isimle ilişki aranmaz.

- [ ] Öğrenci: genel bilgiler, kayıt/eğitim tercihleri, aktif/geçmiş grup ilişkileri, görüşmeler, satış/tahsilatlar ve yoklama geçmişinin kaynak eşliğini tamamla. Tek bilgiyi hem StudentDetail hem RegistrationReview içinde gereksiz tekrarlama.
- [ ] Grup: eğitim/seviye/öğretmen/program/kapasite/durum özeti; öğrenciler data table; ders programı; yoklama özeti; atama/çıkarma ve kaynakta varsa transfer. Kapasite ve aktiflik kontrolleri hem UI hem submit sınırında.
- [ ] Öğretmen: fotoğraf, iletişim, uzmanlık, durum; ilişkili gruplar; tarih filtreli tam ders programı; kaynak maaş bilgileri ve erişim şartları. İlk altı kayıtla sessizce kesme; sayfalama veya tümünü açma.
- [ ] Personel: kaynakta zorunlu ad/e-posta/telefon, ACTIVE/INACTIVE/BLOCKED karşılıkları; oluşturma ve değiştirme şifre farkı; şube izinleri; görev ve fotoğraf; maaş/prim bölümü.
- [ ] Kaynak maaş alanlarını doğru türle taşı: WEEKLY/MONTHLY, baseAmount ≥ 0, commissionRate 0–100 UI yüzdesi, paymentDay 1–31, COLLECTION/TURNOVER. API yüzde dönüştürmesi tek sınırda yapılır; formda %15 → 0.15 → %15 round trip korunur.
- [ ] Personel, süper kullanıcı ve şube için farklı form/model kullan; satır indekslerini iş kuralı gibi kullanma. Şube maaş guard'ının kullanıcıya hangi şubede işlem yaptığını göstermesini koru.
- [ ] Ayrı URL'li alt sayfalar PageNavigation kullanır; back/filter restoration ve preview edit doğru kayda döner. Kaydın bulunamaması ve izin olmaması ayrı durumdur.

**Kabul:** Her entity'nin liste → preview → detay → alt sayfa → edit → kaydet → liste akışı tamam. Öğretmen/grup adı değişince ilişkiler kopmaz. Personel alanları kaynak formdan eksik kalmaz.

## Görev 9 — Yeni kayıt ve görüşme akışını bağlam kaybı olmadan tamamla · P1

**Files:** Modify `src/components/shared/student-picker.tsx`, `app-dialogs.tsx`, `src/features/students/student-dialogs.tsx`, `registration-page.tsx`, `registration-fields.tsx`, `registration-review.tsx`, `src/features/meetings/meeting-dialog.tsx`, `meeting-model.ts`; test `tests/forms.test.ts`, `tests/page-flows.test.ts`.

**Interfaces:** `StudentPicker` yeni kayıt niyetini ve dönüş hedefini taşır. Öğrenci başarılı kayıtta oluşan ID, `afterCreate:'meeting'` akışının tek kaynağıdır. Görüşme taslağı öğrenci ID'sine bağlıdır; farklı öğrenciye sessizce taşınmaz.

- [ ] Yeni görüşme → mevcut öğrenci ara / yeni öğrenci oluştur → zorunlu bilgiler → isteğe bağlı bilgiler → önizleme → kaydet → aynı öğrenciyle görüşme adımlarını doğrula.
- [ ] Yeni kayıt iptalinde başlangıç picker/ekranına, kullanıcı araması korunarak dön. Başarısız kayıt veya tekrar telefon/e-posta halinde form açık ve alan hatalı kalsın.
- [ ] Görüşme içinden öğrenci detayına bakma veya önceki/sonraki öğrenciye geçme sırasında yazılmış not/sonuç kaybolmasın; açık uyarı veya taslak dönüşü uygula.
- [ ] Planlanan/görüşüldü/satış/olumsuz sonucundaki koşullu tarih, saat, neden ve skor aynı şemadan doğrulansın. “Kaydet ve ilerle” filtrelenmiş çalışma listesindeki sonraki öğrenciye geçsin; tüm öğrenciler dizisine kaçmasın.
- [ ] SMS alt dialogu kapandığında görüşme taslağı ve odak korunur. Fotoğraf ve kullanıcı adı mevcut profilden gelsin. Görüşme hazırlığında legacy attendance/payment alanları yerine güncel hesap kullanılsın.
- [ ] Başarılı kayıt sonrası liste, dashboard, daily panel, geçmiş ve sayaçlar aynı kaydı yansıtsın; çift kayıt ve fazladan görüşme oluşmasın.

**Kabul:** Yeni öğrenci + görüşme akışı tek ID ile tamamlanır; iptal ve hata yolları da kullanılabilir. Önizlemedeki her alan düzenlenebilir bölüme geri götürür.

## Görev 10 — Takvim ve yoklama · P1

**Files:** Modify `src/features/calendar/calendar-page.tsx`, `attendance-page.tsx`, `attendance-model.ts`, `src/lib/calendar.ts`, `src/components/shared/app-dialogs.tsx`, `src/styles/pages.css`, `src/app/page-router.tsx`; Create `src/features/calendar/pollings-page.tsx`, `polling-qr-dialog.tsx`; Test `tests/calendar.test.ts`, `tests/page-flows.test.ts`.

**Interfaces:** Görünür zaman parçası ile asıl etkinlik ID'si ayrılır. Gerekirse `CalendarSegment { eventId: number; day: number; startMinute: number; endMinute: number }` tipi `src/lib/calendar.ts` içinde tanımlanır; iki güne bölünen görsel parçalar aynı etkinliği açar.

- [ ] 15/30/45/60/90/180 dakika olaylar, aynı saate üç olay, 23:30–00:30, ay/yıl sonu ve boş hafta için senaryolar hazırla.
- [ ] Kaynak takvimdeki Görüntüle/Düzenle modunu ve `ALL/GROUP/PRIVATE` ders türünü eşle. Ders/görüşme ayrımını bu filtrenin yerine kullanma. View modunda ekleme/düzenleme yapılmasın; kaynak yetkisi ve CRUD girdi alanları korunarak edit modunda çalışsın.
- [ ] Gece yarısını aşan olayları her günün grid'inde ayrı segment olarak göster; süre veya kayıt çoğalmasın. Eski epoch günlerini koruyan migration/adapter dışında tarih modelini keyfi değiştirme.
- [ ] Kısa olayda başlangıç saati ve başlık görünür; ikincil metin ancak yer varsa gösterilir. Tam bilgi touch/klavye ile de açılır; tooltip'e bağımlı değildir.
- [ ] Görev 2'de doğrulanan öğretmen, grup, derslik, eğitim, ders türü ve diğer kaynak filtrelerini aynı visible event sonucu üzerinden uygula; kaynakta olmayan filtreyi yeni iş kuralı olarak ekleme. URL parametresi, gün/hafta ve Bugün geçişini kontrol et.
- [ ] Kaynakta bulunan ders oluşturma/güncelleme/silme girişlerini doğru alanlarla tamamla; yalnız “Görüşme ekle” yeterli değil. İptal ile silme aynı iş kuralı sayılmaz. Sürükleme zorunlu tek etkileşim olmasın; form üzerinden düzenleme alternatifi korunsun.
- [ ] Kaynak mobil başlangıcı `listWeek` (haftalık liste) işlevini koru; prototipin Gün varsayılanını doğru kabul etme. Orientation, date range ve görünüm değişimi tarihi/filtreyi kaybetmesin. Klavye/touch ile olay açıldığında doğru kayıt ve tarihe dönülsün.
- [ ] `/admin/calendar/pollings` için kaynaktaki aktif/bugünkü/yaklaşan yoklamalar, QR gösterimi, bugünün yoklamalarını seçme ve seçilen QR'ları yazdırma akışını yeni UI'a taşı. QR hazırlanıyor/ilerleme/hata, seçili sayı ve yazdırma devre dışı koşulları korunur; manuel notlama formu bu ekranın yerini almaz.
- [ ] Kaynak grup yoklama ve öğrenci yoklama geçmişi alt sayfalarını da oku; manuel işaretleme doğru kaynak bağlamında erişilebilir olsun. Durum enum'u, ders öncesi işleme kuralı, geçmiş düzenleme yetkisi ve QR geçerliliği kaynaktan eşlensin. `geç/mazeretli` gibi yeni durumlar varsayımla eklenmesin.
- [ ] Yoklamayı ders ve öğrenci ID'leriyle bağla; kaydı değiştirmek oranları, risk listesini ve detay geçmişini güncellesin. QR servis bağımlılığı varsa Görev 17'de kaydet; uydurma QR/token veya çalışmayan yazdırmayı tamamlanmış sayma.

**Kabul:** Kesilen/üst üste okunamayan olay metni yok. Gece yarısı her iki günde doğru, toplam süre tek. Takvim modları/ders türü/mobil haftalık liste kaynakla eşdeğer. Yoklamalar sayfasının QR/seçim/yazdırma akışı mevcut; manuel işaretleme ve geçmiş doğru alt sayfalarda. Yoklama değişimi ilgili tüm ekranlarda aynı sonucu verir.

## Görev 11 — Data table ve tüm filtrelerin ortak mantığı · P1

**Files:** Modify `src/components/ui/data-table.tsx`, `table.tsx`, `src/hooks/use-page-state.ts`, `src/app/navigation/page-state-store.ts`, `src/components/forms/date-range-filter.tsx`; liste kullanan feature dosyaları; `src/styles/pages.css`.

**Interfaces:** Filtre, sıralama, sayfalama ve görünür sütun state'i `branchId + canonical pathname + table name` kapsamındadır. DataTable mevcut API'sine isteğe bağlı loading/error, rowCount, manualPagination ve pagination change sözleşmesi eklenebilir; istemci modunun mevcut kullanımı bozulmaz.

- [ ] Her sayfanın kaynak filtrelerini task 2 tablosundan bağla; sadece filtre inputu eklemek tamamlanma değildir. Aktif filtreler görülebilir ve tek tek temizlenebilir olsun.
- [ ] Filtre değişiminde sayfa indeksi geçerli başlangıca döner. Tarih/çoklu seçim/arama/sıralama birlikte uygulanır; URL'den gelen açık filtre saklanan eski filtre tarafından yutulmaz.
- [ ] Sütun görünürlüğü, kayıt seçimi, bulk action ve row action mobilde eş işlevli olsun. Mobil kartın ana açma hedefi belirgin; nested düğmeye dokunmak kartı açmasın.
- [ ] Bütün satırda hover/selection yatay padding'i ve aksiyon hücresi hizasını düzelt. İlk/son satır köşeleri, checkbox ve sticky hücre varsa yüzey sürekliliğini kontrol et.
- [ ] API moduna hazır loading, retryable error, gerçekten boş liste ve filtre sonucu boş durumlarını farklı göster. “Henüz veri yok” ile “filtreye uyan yok” aynı metinle verilmesin.
- [ ] Grafik, sayaç, CSV ve tablo aynı filtre modelini tüketir. Export kapsamı “tüm filtreli kayıtlar” veya “seçilenler” olarak nettir; ekranda görünmeyen kaydı yanlışlıkla dışa aktarma.
- [ ] 10.000 kayıt fixture'ında veri hacmini ve etkileşimi ölç; gerçek ihtiyaca göre sunucu sayfalaması/virtualization uygula. Bütün sayfalara ölçmeden sanallaştırma ekleme.

**Kabul:** Aynı filtre ve sıralama ile mobil/masaüstü kayıt ID'leri eşleşir. Filtre değişince anlamsız boş sayfa oluşmaz. Bütün önemli aksiyonlar dar ekranda kullanılabilir.

## Görev 12 — Dashboard, raporlar ve akıllı öneri tutarlılığı · P1

**Files:** Modify `src/features/dashboard/dashboard-page.tsx`, `performance-model.ts`, `src/features/insights/education-detail-page.tsx`, `report-model.ts`, `reports-page.tsx`, `src/features/finance/finance-analysis-page.tsx`, `financial-ledger.tsx`, `src/components/layout/smart-suggestions.tsx`, `src/features/jamai/jamai-panel.tsx`; Create `src/features/insights/risk-model.ts`; Test `tests/page-flows.test.ts`.

**Interfaces:** Ortak risk tanımı hem sayı hem hedef listeyi üretir. Örneğin `attendanceRiskIds(students, sessions, { threshold, activeOnly })` aynı sonucu dashboard, öneri ve rapora verir. Eşik kaynakla doğrulanır; %80 veya %90 keyfi seçilmez. UI her yerde aynı açıklamayı kullanır.

- [ ] Görev 2'nin eksik rapor listesindeki dokuz eğitim raporunun veri ihtiyacını eşle. Danışmansız/aktif-grupsuz gibi mevcut veriden hesaplanabilenleri tamamla; eğitim bitişi, bonus hareketi, grup transferi ve donma geçmişi için kaynak modele gerekli alanları ekle.
- [ ] İptal/iade ve sözleşme bitişi raporlarında koşulsuz `[]` üretimini kaldır; kayıt modeli ve hesap gerçek mevcut akışı temsil etsin. Veri servisi eksikliği varsa geliştirme kabulünde açık bağımlılık olarak kaydet.
- [ ] Kaynakta rapora özgü tarih türü, danışman, durum, eğitim, grup, şube ve ödeme filtresi varsa bağla; tek genel tabloyu tüm raporlara yeterli sayma.
- [ ] Dashboard'da satış, tahsilat, bakiye, vadesi geçen, aktif öğrenci, devam, bugünkü ders/görüşme ve yeni kayıt göstergelerini tutarlı yerleştir. Veri yokken 0 ile hesaplanamayan değer ayrımı yap.
- [ ] Grafik dönem/değişim etiketi, seri, legend ve tooltip aynı metriği anlatsın. Mobil ve dar panelde grafik başlıkları sıkışmasın.
- [ ] Akıllı öneride sayı/tutar/hedef liste aynı filtreyle hesaplanır; “Bugün” bugün açar. Sıfır riskte sahte aciliyet görünmez. Kısayollar yeni görüşme, tahsilat ekleme, rapor ve duyuru niyetini doğru akışa taşır.
- [ ] JamAI kurallı mevcut cevapları aynı kayıt hesaplarını kullansın; genel ilk-ad eşleşmesi birden fazla kişiyi yanlış seçmesin. Gerçek AI servis bağlantısı Görev 17'de ayrı kabul edilir.

**Kabul:** Karttaki sayı, tıklanınca açılan filtreli listenin sonucuyla eşleşir. Rapor adı var ama veri kuralı yok durumu kalmaz. Aynı öğrenciye farklı ekranlar farklı devam/bakiye söylemez.

## Görev 13 — Ayarlar ve şube yönetimi eşliği · P1

**Files:** Modify `src/features/settings/settings-page.tsx`, `settings-model.ts`, `integration-settings.tsx`, `src/components/layout/topbar.tsx`, `utility-menus.tsx`, `src/app/workspace-reducer.ts`; Create `src/features/settings/bank-accounts-page.tsx`, `src/features/administration/branches-page.tsx`; use Görev 8 `branch-model.ts`.

**Interfaces:** Kurum, şube ve kullanıcı ayarları ayrı kapsamdır. Şube seçici, şube listesi ve form aynı ID'li koleksiyonu kullanır. Banka hesapları tek string alanlar grubu değil, ID'li hesap listesi olarak ele alınır.

- [ ] Banka liste/ekle/edit/aktif-pasif/default akışını tamamla. Kaynak kurallarına göre en fazla bir varsayılan; para birimi, hesap sahibi/numarası/IBAN ve ilgili tahsilat seçimleri eşlenir.
- [ ] Sabit üç şube ismini kaldır; yetkili şube listesinden seçtir. Yeni şube ve isim değişikliği listede görünür; seçili şube adı güncellenir, ID değişmez.
- [ ] Personel şube alanı serbest metin yerine gerçek seçim olsun. Kurum adı düzenlemek şube adı ve sayfa state kapsamını yanlışlıkla değiştirmesin.
- [ ] Genel/hesap/banka/ödeme/SMS/e-posta/WhatsApp/süper admin kapsamlarını ayrı kaynaklarla karşılaştır. Profil fotoğrafı/ismi tüm UI'da güncellenir; kayıtlı ayarı eski form state'i ezmez.
- [ ] iyzico `mode` alanını sandbox/canlı açıklamasıyla ekle; secret alanı değiştirilmediyse kayıtlı anahtarı silme. Bütün provider alanlarında kaynak zorunlu/isteğe bağlı ayrımını koru.
- [ ] Kaydet/Geri al/pending/hata/kaydedildi durumlarını uygula. API bağımlı test için sahte başarı üretme; bağlantı tamamlandığında aynı form güvenli sunucu isteğini kullanır. Secret'ları local/session storage'a yazma.
- [ ] Ödeme varsayılanının yeni satışa etkisi, kapatılmış yöntemin yeni seçimden kalkması ve eski kaydın kaybolmaması; hatırlatma ayarının gerçekten kullanıldığı yerleri doğrula.

**Kabul:** Ayardaki her kontrolün tanımlı etkisi var. Süper/kurum/şube/kullanıcı kapsamları birbirini ezmez. Kaynakta bulunan önemli alan eksik değildir.

## Görev 14 — Eğitim, dönem ve müfredat sayfaları · P2

**Files:** Split `src/features/education/learning-page.tsx` into `education-page.tsx`, `education-periods-page.tsx`, `program-terms-page.tsx`, `curriculum-page.tsx`; Create `learning-model.ts`; update `page-router.tsx` ve eğitim seçimlerini tüketen form dosyaları.

**Interfaces:** Eğitim → seviye/alt seviye → dönem/program → müfredat ilişkileri ID ile tanımlanır. `string[]` indeksleri ve “Eğitim / seviye” tek metni veri sözleşmesi sayılmaz.

- [ ] Kaynak alan/filtre/aksiyon envanterini her sayfa için uygula; listeyi data table, mobilde eş işlevli kart/liste yap.
- [ ] Eğitim/seviye değişince bağlı seçimlerin geçerliliğini denetle. Başlangıç/bitiş tarihleri ve program çakışması kaynak kurallarını izlesin.
- [ ] Müfredat sıra, ders sayısı ve eğitim ilişkisini tipli modelle sakla; kullanıcıdan hesaplanması gereken “aktif öğrenci” gibi türetilmiş sayıyı elle isteme.
- [ ] Oluştur/düzenle/aktiflik aksiyonları sonrası grup/kayıt/fiyat seçimleri aynı değişikliği görsün. Silinemez ilişkili kayıt için nedeni ve uygun alternatif aksiyonu göster.
- [ ] Zorunlu/isteğe bağlı bölüm, footer, validation ve önizleme kurallarını ortak form düzeniyle uygula.

**Kabul:** Her sayfanın kendine özgü alanları ve iş kuralları var; sırf başlık değiştiren genel form kullanılmıyor. İlişkili seçimler tutarlı.

## Görev 15 — Finans, iletişim ve yönetim sayfalarını tek tek kapat · P2

**Files:** Modify `src/features/finance/*`, `src/features/communications/*`, `src/features/administration/{verification-page,verification-model,automations-page,contracts-page,content-pages}.tsx/ts`; split büyüyen dosyaları aynı feature içinde sorumluluğa göre; update `docs/reviews/page-parity.md`.

**Interfaces:** Görev 2'deki her kaynak aksiyonun yerel karşılığı, sonucu ve kalıcı kayıt ihtiyacı bellidir. UI'da etkin sunulan işlem ya tanımlı akışa gider ya anlamlı unavailable durumu gösterir; yalnız toast üretip başarı sayılmaz.

| Sayfa ailesi | Tamamlanacak inceleme ve kabul |
| --- | --- |
| Giderler | Tek/tekrarlı gelir-gider, kategori, tarih/dönem, ödeme durumu, miktar; filtrelenmiş toplam ve edit geri dönüşü. |
| Fiyatlandırma/satış | Eğitim-dönem-sözleşme bağı, yöntem/kampanya indirimi, geçerlilik tarihleri, taksitlerin kuruş toplamı, oluşturma önizlemesi. |
| Tahsilat/ödeme | Satış/taksit/öğrenci ilişkisi, kısmi ödeme, kalan/vade hesabı, iptal/iade akışı ve makbuz; onaylı işlemi iki kez işleme koruması. |
| Doğrulamalar | Talebin önce/sonra farkı, uygun karar yetkisi UI'ı, ret nedeni, karar sonrası ilişkili kaydın durumu. Sadece talep rozetini değiştirmek yeterli değil. |
| SMS/e-posta/WhatsApp | Tek/toplu alıcı, ülke/kanal doğrulaması, şablon, önizleme, filtre, gönderim durumları ve başarısız alıcılar; taslak gerçek gönderim diye gösterilmez. |
| Duyurular | Hedef kitle, zaman, durum, önizleme/düzenleme ve kaynakta varsa yayın/geri alma. |
| Sözleşmeler | Şablon alanları, zorunlu bilgiler, değişken önizlemesi ve satışla ilişki; uzun içerik mobilde kullanılabilir. |
| Otomasyonlar | Tetikleyici/koşul/aksiyon alanları kaynakla eşlenir; yapılandırma ile çalıştırma/sonuç ayrılır. |
| Şubeler/süper kullanıcılar/faturalandırma | Uygun kaynak formu, kapsam ve işlem filtresi; admin sayfasını farklı başlıkla açma yapılmaz. |
| Dosyalar/destek | Seçme/yükleme/iptal/hata/ilerleme, dosya önizleme/indirme; destek kaydı/detayı/durum akışı. |

- [ ] Tablodaki ailelerin her biri için envanterden kaynak input/filter/aksiyonlarını uygula; her aile ayrı inceleme ve commit sınırıdır.
- [ ] Oluşturma, edit ve ayrıntı ekranlarında aynı veri alanlarının isim, tür ve değerlerini doğrula.
- [ ] Uzun form ve mobil listeleri Görev 6/7/11 sözleşmelerine geçir; özel iş kuralını ortak UI bileşenine gömme.
- [ ] Veri yok/filtre yok/erişim yok/hata/yükleniyor durumlarını kaynak akışa göre ayır.
- [ ] Gerçek servis gerektiren aksiyonu Görev 17 bağımlılığıyla eşle; UI tarafındaki eksikleri bu bağımlılığın arkasına saklama.

**Kabul:** Envanterde kalan her sayfa ailesi için bir başarılı ve bir hata/iptal akışı kanıtlı. Koşulsuz boş liste ya da işlevsiz buton “tamam” sayılmaz.

## Görev 16 — Tarayıcı, cihaz, erişilebilirlik ve performans kabulü · P0 yayın kapısı

**Files:** Modify `scripts/check-pages.tsx`, mevcut regresyon testleri; Create `docs/reviews/device-acceptance.md`; route bazlı bölme gerektiğinde `src/app/page-router.tsx`, `src/app/error-boundary.tsx`, `scripts/package-deliverables.mjs`.

**Interfaces:** Kontrol kaydı `senaryo / viewport / browser-cihaz / giriş yöntemi / scale / beklenen / ölçülen / ekran görüntüsü / sonuç` içerir. Test sürümleri kayda girer; yalnız viewport emülasyonu gerçek cihaz diye işaretlenmez.

- [ ] İzinli Sites preview troubleshooting akışıyla mevcut erişim hatasını tanıla. Engel devam ederse UI kabulü açık bırak; alternatif host/port/tarayıcıyla aşma. İnceleme için gereken gerçek cihaz adımlarını ayrı teslim et.
- [ ] Aşağıdaki matrisin temel akışlarını çalıştır. Her ölçüde bütün 113 sayfanın rastgele screenshot'ı yerine ortak layout matrisi + bütün sayfa ailelerinde kritik akışlar + hata çıkan özel sayfanın ek kontrolü kullan.
- [ ] Query route, tek/çift tık, alan hatası, filtre durumu ve ilişkili veri testlerini koru. İlgisiz tekrarlı test ekleme.
- [ ] Klavye Tab/Shift+Tab, Escape, enter submit, focus görünürlüğü, dropdown/combobox, drawer/dialog katmanı; VoiceOver/NVDA ve %200 büyütme kontrolü yap.
- [ ] Uygulama %70/75/80/85/100/125/150 ölçeğinde ortak layout, Select/Popover/Dialog ve sidebar hedeflerinin görsel konumu ile tıklama koordinatlarını kontrol et. OS ölçeği ve tarayıcı zoom'unu ayrı kaydet; sadece CSS piksel genişliğini cihaz kanıtı sayma.
- [ ] A01 alt çizginin yokluğu/aktif pill görünürlüğü, A02 ölçek tercihinin reload'da korunması, A03 input pointer senaryosu ve A04 sidebar aç/kapa kabulünü aynı referans viewport'larda kaydet. G20/G21 için yeni UI ile kaynak uygulamanın aynı iş sonuçlarını karşılaştır.
- [ ] Ana route'a gereksiz tüm feature'ları yükleyen tek paketi ölç. Büyük route'ları React lazy/Suspense ile böl; ana fallback olarak Görev 3'ün `AppLoading scope="page"` breathing gösterimini kullan. Yerel liste skeleton'ları ilgili bölgede kalır; chunk yükleme hatasında yeniden dene sun.
- [ ] A06 için soğuk açılış, yavaş route chunk, hızlı dönüş, yükleme hatası/retry, arka plan sekmesi ve reduced motion kabulünü kaydet. Orb'un başlangıç paketine eklediği boyutu ölç; loader'ı bütün uygulama paketini indirmeye bağımlı kılma.
- [ ] A07 üst sekmeler için 3/8/16 sekme, ilk/orta/son aktif, uzun başlık, X hover/focus/touch, mask/backdrop destek farkı ve %70/%100/%150 ölçek görsel/etkileşim kabulünü kaydet. Çok dar alanda eğriyi bozarak metni sıkıştırmak yerine mevcut overflow gezinmesini erişilebilir tut.
- [ ] A08 için menü satırı, Hızlı arama ve profil metninin sol başlangıç koordinatlarını karşılaştır; açık/kapalı/touch, uzun isim ve %70/%100/%150 örneklerini kaydet. Kısayol ve profil menüsü hedefi metnin üzerine binmesin.
- [ ] Tek dosya HTML teslimi gerekli kalıyorsa ayrı export pipeline kullan; online ürün performansını offline teslim formatı nedeniyle tek bundle'a mahkûm etme. İki çıktının temel route/kayıt akışını ayrı doğrula.
- [ ] 10.000 kayıt, 16 sekme, çok sayıda takvim olayı ve fotoğraflı profillerle ilk yük, filtre, scroll ve bellek davranışını ölç; hedef bütçesini ilk ölçüm sonrası kabul kaydında açıkça belirt.

| Ortam | Test genişlik/ölçekleri | Zorunlu akış |
| --- | --- | --- |
| Telefon | 320, 360, 390, 430 px; portre/yatay | Kayıt/edit, uzun form son alan, klavye accessory/footer, mobil tablo ve sağ drawer. |
| Tablet | 600, 768, 820, 1024, 1180 px; split view | Touch sidebar, yön değişimi, takvim ve select; araçların içerik üstünü istemsiz kapatmaması. |
| Windows | 1280, 1366, 1440, 1920 px; OS %100/%125/%150 | Kart/tutar, çok sekme, data table, dialog ve uygulama ölçeğiyle birleşim. |
| macOS | 1280, 1440, 1728 px; Chrome ve Safari | Font, kart genişliği, cam fallback, trackpad scroll, Cmd-click ve input. |
| Büyük ekran/TV | 2560 ve 3840 px; erişilebilir gerçek TV browser | Maksimum içerik genişliği, okunurluk, klavye/kumanda odağı. Test edilmemiş engine “destekli” sayılmaz. |
| Uygulama ölçeği | %70/75/80/85/100/125/150; mevcut %90/%110 seçenek kontrolü | Kaydet/reload, açık portal, sidebar, input pointer hedefi; Windows OS ölçeği ve browser zoom ile temsilî birleşimler. |
| Erişilebilirlik | %200 zoom/metin; reduced motion; yüksek kontrast | Kritik içerik ve aksiyon kaybı, fokus sırası, hata anonsu, modal odak dönüşü. |

**Kabul:** Açık P0/P1 görsel/etkileşim hatası yok. Cihaz kanıtı olmayan satır bekliyor durumunda kalır. Build/test sayısı cihaz kabulünün yerine yazılmaz.

## Görev 17 — Üretim bağımlılıkları ve son tamamlama kaydı · P0 üretim kapısı

**Files:** Update `docs/reviews/page-parity.md`, `form-field-parity.md`, `device-acceptance.md`; bağlanacak mevcut servis çağrıları ilgili feature içinde yer alır. Jamaster API kaynağında değişiklik yapılmaz.

**Interfaces:** Üretim UI'sı gerçek auth/kapsam/kalıcı kayıt sözleşmelerini tüketir. API'de olmayan yetenek için burada yeni bir backend inşa edilmez; gereken endpoint/alan/durum sözleşmesi somut bağımlılık olarak yazılır.

- [ ] Kimlik, rol ve şube kapsamı; API loading/error/field errors; kayıt sonrası ilgili sorguların güncellenmesi; expired session ve 403/404/409 davranışlarını mevcut Jamaster servisleriyle eşle.
- [ ] Fotoğraf/dosya servisi, güvenli provider ayarları, SMS/e-posta/WhatsApp, ödeme, JamAI ve otomasyon iş sonuçları için gerçek bağlantı kabulünü kaydet. Yerel state demosunun bunu sağlamadığını açık tut.
- [ ] Gerçek iki şube ve iki farklı yetkili kullanıcıyla veri/aksiyon erişimini doğrula. UI gizleme güvenlik kontrolü sayılmaz.
- [ ] 19 madde ve A01–A08 için kod kanıtı, tarayıcı kanıtı ve gerekiyorsa cihaz kanıtını iliştir. Kaynakta tamamlanmış kaldırma işlerini yeniden açıkmış gibi sayma. Her sayfada kaynak alan/filtre/aksiyon eşliği ve onaylı fark gerekçesi kapanmış olsun.
- [ ] Yayından önce build, ilgili regresyonlar, query'li route kontrolleri ve değişen sayfaların UI kabulü geçsin. Önceki sürümü koruyan geri dönüş referansını kaydet.

**Kabul:** “UI tamam” ve “production hazır” ayrı kayıtlar. İkincisi gerçek veri/izin/servis ve cihaz kapıları geçmeden kullanılmaz.

## Son talep → görev eşleştirmesi

| Kullanıcı maddesi | Görevler |
| --- | --- |
| 1 kart taşmaları | 3, 16 |
| 2 sidebar hizası | 4, 16 |
| 3 sekme X | 4 |
| 4 tablo hover | 3, 11 |
| 5 detay sayfaları | 5, 8 |
| 6 dialog header/footer | 7, 9, 15, 16 |
| 7 takvim | 1, 10 |
| 8 genel taşmalar | 3, 7, 11, 16 |
| 9 aktif alt sayfa | 1, 4 |
| 10 placeholder | 2, 6 |
| 11 telefon/fotoğraf | 6, 8, 13 |
| 12 klavye araçları | 7, 16 |
| 13 sağ panel/önizleme | 1, 5, 8 |
| 14 filtre/chart | 2, 10, 11, 12, 14, 15 |
| 15 search focus | 3, 6 |
| 16 kompakt sekme/ayar kaldırma | 4 |
| 17 ayarlar | 2, 13, 17 |
| 18 öneriler/kısayollar | 5, 12 |
| 19 yeni görüşme/öğrenci | 7, 9 |
| A01 küçük aktif bağlantının alt çizgisi | 3, 4, 16 |
| A02 minimum %70 ölçek | 3, 6, 16 |
| A03 mouse yaklaşınca input etkinleşmesi | 4, 6, 10, 16 |
| A04 sidebar'ın tekrar gözden geçirilmesi | 2, 4, 16 |
| A05 kaynak sayfa/input/işlev eşliği | 1, 2, 6, 8–15, 17 |
| A06 Orbs breathing ana yükleyicisi | 3, 16, 17 |
| A07 görseldeki üst çalışma sekmesi biçimi | 3, 4, 16 |
| A08 sidebar arama/profil sol hizası | 4, 16 |

Eski kalıcı talepler: ilk soft HTML ve renk/cam/border → 3; gerçek route ve kalıcı sekmeler → 1/4/11; tüm sidebar → 2/4; zorunlu/isteğe bağlı → 2/6/7/9/13/14/15; dropdown/dialog ayrımı → 4/5/6/7; şube seçimi → 13; data table/mobil → 11/14/15; tam sayfa eşliği → 2/8/12–15; Windows ölçek/TV/gelecek masaüstü UI uyumu → 3/16.

## İlk uygulama dilimi

İlk dilim Görev 1 ve Görev 2'dir. Paket B'de önce A01 alt çizgi, A02 ölçek ve A03 input hatası teşhisi; ardından sidebar/sekme/sağ panel ile form altyapısı ele alınır. Sonraki paketler kaynak eşliğiyle sayfa sayfa ilerler. Böylece bozuk query ve ortak bileşen davranışları üzerine yeni sayfalar eklenmez. Her paket sonunda kullanıcıya hangi maddelerin hangi kanıtla kapandığı ve hangilerinin açık kaldığı bildirilir; yeni bir tema denemesine veya talep edilmemiş işlev tasarımına girilmez.


## Üçüncü paket ilerleme kaydı — 9 Eylül 2026

Görev 8/10 kapsamında yoklama merkezi, grup güncel/geçmiş görünümü, snapshot koruması, private öğrenci seçimi, source form query adresleri ve scoped takvim alt sayfaları uygulandı. 94 test, 113 hedefin dolu/boş render kontrolü ve ek query/alt adres kontrolleri geçti; üretim derlemesi başarılı. Kapsam: `docs/review/calendar-detail-implementation.md`.

Görevlerin tamamı kapatılmadı. Öncelikli sonraki dikey dilim: çoklu grup üyeliği/transfer modelini bütün tüketicilere yaymak; grup öğretmen ataması; öğretmen kişisel/sertifika/maaş detayları. Global branch koleksiyonları ve gerçek QR/auth/API hâlâ üretim engeli. Tarayıcı görsel/cihaz kabulü bloke olduğu için mevcut canlı sürüm değiştirilmedi.
