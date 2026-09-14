import { isLocalProfileImage } from './profile-image.ts';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { z } from 'zod';

export const phoneHint = 'Türkiye için 05xx xxx xx xx; diğer ülkeler için + ülke kodu kullanın.';
export function parsePhone(value: string) {
  const text = value.trim().replace(/^00/, '+');
  if (!/^[+\d\s().-]+$/.test(text)) return undefined;
  const phone = parsePhoneNumberFromString(text, { defaultCountry: 'TR', extract: false });
  return phone?.isValid() && !phone.ext ? phone : undefined;
}
export const normalizePhone = (value: string) => parsePhone(value)?.number || value.trim();
export const displayPhone = (value: string) => parsePhone(value)?.formatInternational() || value;
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => !!parsePhone(v), 'Geçerli bir telefon numarası girin. ' + phoneHint)
  .transform(normalizePhone);
export const optionalPhoneSchema = z
  .string()
  .trim()
  .pipe(z.union([z.literal(''), phoneSchema]));
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Geçerli bir e-posta adresi girin.'));
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00');
  return Number.isFinite(date.getTime()) && localDate(date) === value;
}
export function isDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value) && isDate(value.slice(0, 10));
}
export const birthDateSchema = z
  .string()
  .refine(
    (v) => !v || (isDate(v) && v <= localDate() && v >= '1900-01-01'),
    '1900 ile bugün arasında geçerli bir doğum tarihi girin.',
  );
export const imageUrlSchema = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    try {
      const url = new URL(v);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'http veya https ile başlayan bir görsel adresi girin.');

export function contactConflict<T extends { id: number | string; email: string; phone: string }>(
  records: T[],
  contact: { email: string; phone: string },
  excludeId?: number | string,
) {
  const email = contact.email.trim().toLowerCase(),
    phone = parsePhone(contact.phone)?.number;
  return records.find(
    (r) =>
      r.id !== excludeId &&
      ((email && r.email.trim().toLowerCase() === email) ||
        (phone && parsePhone(r.phone)?.number === phone)),
  );
}

export type ContactField = 'email' | 'phone' | 'secondPhone';
export type ContactMatch<T> = {
  student: T;
  draftField: ContactField;
  studentField: ContactField;
};
export function contactMatches<
  T extends {
    id: number | string;
    name: string;
    email: string;
    phone: string;
    profile?: Record<string, string | number | boolean>;
  },
>(
  records: T[],
  contact: { email: string; phone: string; secondPhone?: string },
  excludeId?: number | string,
): ContactMatch<T>[] {
  const email = contact.email.trim().toLowerCase();
  const entered = (['phone', 'secondPhone'] as const)
    .map((field) => ({ field, value: parsePhone(contact[field] || '')?.number }))
    .filter((entry): entry is { field: 'phone' | 'secondPhone'; value: string } => !!entry.value);
  const matches: ContactMatch<T>[] = [];
  for (const student of records) {
    if (student.id === excludeId) continue;
    if (email && student.email.trim().toLowerCase() === email)
      matches.push({ student, draftField: 'email', studentField: 'email' });
    const saved = [
      { field: 'phone' as const, value: parsePhone(student.phone)?.number },
      {
        field: 'secondPhone' as const,
        value: parsePhone(String(student.profile?.secondPhone || ''))?.number,
      },
    ];
    for (const candidate of entered)
      for (const existing of saved)
        if (candidate.value === existing.value)
          matches.push({
            student,
            draftField: candidate.field,
            studentField: existing.field,
          });
  }
  return matches.filter(
    (match, index, all) =>
      all.findIndex(
        (other) => other.student.id === match.student.id && other.draftField === match.draftField,
      ) === index,
  );
}

/** Shared by shadcn Input and submit schemas; ownership still requires server verification. */
export function inputValueError(type: string, value: string, required = false) {
  if (!value.trim()) return required ? 'Bu alan zorunludur.' : '';
  if (type === 'tel' && !parsePhone(value))
    return 'Telefon numarasını ülke kodu ve hane sayısıyla kontrol edin.';
  if (type === 'email' && !emailSchema.safeParse(value).success)
    return 'Geçerli bir e-posta adresi girin.';
  if (type === 'url' && !imageUrlSchema.safeParse(value).success)
    return 'Geçerli bir http veya https adresi girin.';
  if (type === 'date' && !isDate(value)) return 'Geçerli bir tarih girin.';
  if (type === 'datetime-local' && !isDateTime(value)) return 'Geçerli bir tarih ve saat girin.';
  return '';
}

export const profileImageSchema = z
  .string()
  .trim()
  .refine(
    (v) => isLocalProfileImage(v) || imageUrlSchema.safeParse(v).success,
    'Geçerli bir profil fotoğrafı seçin.',
  );
