# Ödeme servisi bağlantı sınırı

`src/features/payment/payment-transport.ts`, mevcut `createPaymentService()` için credentialed HTTP adaptörüdür. Yayınlanan prototip yerel ödeme sağlayıcısını kullanır. Adaptör kendiliğinden gerçek API çağrısı yapmaz.

Entegrasyonda doğrulanmış API adresi (`VITE_API_URL`), kurum kimliği (`VITE_TENANT_ID`), gerektiğinde şube kimliği (`VITE_BRANCH_ID`) verilir. `readPaymentTransportConfig()` çıktısı `createCredentialedPaymentTransport()` üzerinden `createPaymentService()` ve `PaymentProvider`a bağlanır. Better Auth oturumu, ALTCHA, CORS ve sunucu rol izinleri ayrı sağlanmalıdır. Tarayıcı değişkenlerine sır yazılmaz.

İstekler cookie ve kurum/şube başlıkları kullanır. Uygulama rol seçicisinden yetki türetilmez. Ağ/timeout ve başarılı HTTP yanıtı okunamayan mutasyonlar belirsiz sonuç sayılır; yeniden ödeme başlatmadan mevcut işlem doğrulanır. Bilinen HTTP retleri reddedildi olarak işlenir.

Canlı bağlantı öncesi erişim/borç/aktif bağlantı/geçmiş/kurum kapısı/şube tahsilatı invalidasyonları ve banka sandbox senaryoları ortak oturumla doğrulanmalıdır. Bu paket canlı auth veya para transferi doğrulaması içermez.
