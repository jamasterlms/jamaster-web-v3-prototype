import { inputValueError } from '../../lib/validation.ts';
export function validIBAN(value: string) {
  const text = value.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(text) || (text.startsWith('TR') && text.length !== 26))
    return false;
  const numeric = (text.slice(4) + text.slice(0, 4)).replace(/[A-Z]/g, (c) =>
    String(c.charCodeAt(0) - 55),
  );
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
export type SettingField = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
};
export const settingSections: Record<
  string,
  { title: string; description: string; fields: SettingField[]; toggles: string[] }
> = {
  general: {
    title: 'Kurum bilgileri',
    description: 'Kurum kimliği, iletişim ve görseller.',
    fields: [
      {
        key: 'companyName',
        label: 'Kurum adı',
        required: true,
        placeholder: 'Kurumun ticari unvanı',
      },
      { key: 'phone', label: 'Telefon', type: 'tel', required: true },
      { key: 'email', label: 'E-posta', type: 'email', required: true },
      {
        key: 'address',
        label: 'Adres',
        type: 'textarea',
        required: true,
        placeholder: 'Mahalle, cadde, bina ve ilçe',
      },
      { key: 'taxNumber', label: 'Vergi numarası', placeholder: 'Vergi numarasını girin' },
    ],
    toggles: ['Bildirimleri etkinleştir'],
  },
  bank: {
    title: 'Banka bilgileri',
    description: 'Tahsilat hesabının bilgilerini ve varsayılanlarını düzenleyin.',
    fields: [
      { key: 'bank', label: 'Banka adı', required: true, placeholder: 'Banka adını girin' },
      {
        key: 'accountHolder',
        label: 'Hesap sahibi',
        required: true,
        placeholder: 'Kurumun ticari unvanı',
      },
      {
        key: 'accountNumber',
        label: 'Hesap numarası',
        required: true,
        placeholder: 'Hesap numarasını girin',
      },
      { key: 'iban', label: 'IBAN', placeholder: 'TR00 0000 0000 0000 0000 0000 00' },
    ],
    toggles: ['Varsayılan hesap', 'Hesap aktif'],
  },
  payment: {
    title: 'Ödeme tercihleri',
    description: 'Yeni satışlarda kullanılacak varsayılan taksit ve hatırlatma bilgileri.',
    fields: [
      {
        key: 'defaultInstallments',
        label: 'Varsayılan taksit sayısı',
        type: 'number',
        required: true,
        min: 1,
        max: 120,
        placeholder: '6',
      },
      {
        key: 'reminderDays',
        label: 'Vade hatırlatma süresi (gün)',
        type: 'number',
        required: true,
        min: 0,
        max: 365,
        placeholder: '3',
      },
    ],
    toggles: ['Nakit ödeme', 'Havale / EFT', 'Kredi kartı'],
  },
  account: {
    title: 'Profil bilgileri',
    description: 'Çalışma alanında görünen kimliğiniz ve iletişim bilgileriniz.',
    fields: [
      {
        key: 'profileName',
        label: 'Ad soyad',
        required: true,
        placeholder: 'Adınızı ve soyadınızı girin',
      },
      {
        key: 'profileEmail',
        label: 'E-posta',
        type: 'email',
        required: true,
        placeholder: 'ad@kurum.com',
      },
      { key: 'profilePhone', label: 'Telefon', type: 'tel', required: true },
    ],
    toggles: [],
  },
};
export function settingFieldError(field: SettingField, value: string, previous = '') {
  const error = inputValueError(
    field.type === 'textarea' ? 'text' : field.type || 'text',
    value,
    !!field.required,
  );
  if (error) return error;
  if (field.key === 'iban' && value && value !== previous && !validIBAN(value))
    return 'Geçerli bir IBAN girin; ülke kodu ve kontrol basamaklarını kontrol edin.';
  if (
    ['companyName', 'profileName', 'accountHolder', 'bank'].includes(field.key) &&
    value.length < 2
  )
    return 'En az iki karakter girin.';
  if (field.key === 'accountNumber' && value.length < 5)
    return 'Hesap numarası en az 5 karakter olmalıdır.';
  if (field.key === 'address' && value.length < 5) return 'Adresi en az 5 karakterle girin.';
  if (
    field.type === 'number' &&
    (!Number.isInteger(Number(value)) ||
      Number(value) < (field.min ?? 0) ||
      Number(value) > (field.max ?? Infinity))
  )
    return `${field.min}–${field.max} arasında tam sayı girin.`;
  return '';
}
