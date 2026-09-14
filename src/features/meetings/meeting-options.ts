export const meetingTypes = [
  ['PHONE', 'Telefon', 'phone'],
  ['FACE_TO_FACE', 'Yüz yüze', 'users'],
  ['SMS', 'SMS', 'message-circle'],
  ['WHATSAPP', 'WhatsApp', 'message-square'],
  ['SOCIAL_MEDIA', 'Sosyal medya', 'globe'],
  ['EMAIL', 'E-posta', 'mail'],
];
export const meetingResults = [
  ['APPOINTMENT', 'Randevu'],
  ['CALLBACK', 'Tekrar Aranacak'],
  ['NEGATIVE', 'Olumsuz'],
  ['SALE', 'Satış'],
  ['COMPLETED', 'Tamamlandı'],
  ['SMS_NOTIFICATION', 'SMS ile bilgilendirme'],
  ['EMAIL_NOTIFICATION', 'E-mail ile bilgilendirme'],
  ['PENDING', 'Beklemede'],
];
export const negativeReasons = [
  'Fiyat yüksek',
  'Zaman uygun değil',
  'Lokasyon uzak',
  'İlgilenmedi',
  'Başka kuruma kayıt oldu',
  'Diğer',
];
const negativeReasonCodes = [
  'PRICE_HIGH',
  'TIME_NOT_SUITABLE',
  'LOCATION_FAR',
  'NOT_INTERESTED',
  'OTHER_INSTITUTION',
  'OTHER',
];
export const negativeReasonOptions = negativeReasonCodes.map((code, index) => [
  code,
  negativeReasons[index],
]);
export const registrationNegativeReasons = negativeReasonOptions.map(([code, label]) => [
  code === 'OTHER_INSTITUTION' ? 'REGISTERED_ELSEWHERE' : code,
  label,
]);
export function normalizeNegativeReason(
  value: string,
  context: 'meeting' | 'registration' = 'meeting',
) {
  const labelIndex = negativeReasons.indexOf(value);
  const code = labelIndex >= 0 ? negativeReasonCodes[labelIndex] : value;
  if (context === 'registration' && code === 'OTHER_INSTITUTION') return 'REGISTERED_ELSEWHERE';
  if (context === 'meeting' && code === 'REGISTERED_ELSEWHERE') return 'OTHER_INSTITUTION';
  return code;
}
export const negativeReasonLabel = (value: string) =>
  labelFor(negativeReasonOptions, normalizeNegativeReason(value));
export const scheduledResults = new Set([
  'APPOINTMENT',
  'CALLBACK',
  'SMS_NOTIFICATION',
  'EMAIL_NOTIFICATION',
]);
export const quickReplies = [
  'Eğitim programı ve fiyat bilgisi paylaşıldı.',
  'Öğrenci uygun bir zamanda tekrar aranacak.',
  'Seviye tespit görüşmesi planlandı.',
  'Ödeme planı hakkında bilgilendirme yapıldı.',
];
export const labelFor = (options: string[][], value: string) =>
  options.find((item) => item[0] === value)?.[1] || value;
