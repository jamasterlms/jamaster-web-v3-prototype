import { z } from 'zod';
import {
  scheduledResults,
  normalizeNegativeReason,
  registrationNegativeReasons,
} from '../meetings/meeting-options.ts';
import {
  birthDateSchema,
  emailSchema,
  profileImageSchema,
  isDateTime,
  phoneSchema,
  optionalPhoneSchema,
} from '../../lib/validation.ts';
export const registrationSchema = z
  .object({
    studentType: z
      .enum(['', 'INDIVIDUAL', 'CORPORATE', 'CORPORATE_EMPLOYEE'])
      .refine((v): boolean => !!v, 'Öğrenci tipi seçin.'),
    meetingType: z
      .enum(['', 'PHONE', 'EMAIL', 'WHATSAPP', 'SOCIAL_MEDIA', 'FACE_TO_FACE', 'SMS'])
      .refine((v): boolean => !!v, 'Görüşme tipi seçin.'),
    meetingScore: z.number().int().min(1).max(5),
    name: z.string().trim().min(2, 'Ad soyad en az iki karakter olmalıdır.'),
    email: emailSchema,
    phone: phoneSchema,
    checkPhone: z.boolean(),
    identityNumber: z
      .string()
      .trim()
      .max(30, 'Kimlik / pasaport numarası en fazla 30 karakter olabilir.'),
    birthDate: birthDateSchema,
    birthPlace: z.string().trim().max(120),
    gender: z.enum(['', 'MALE', 'FEMALE']).default(''),
    bloodType: z
      .enum([
        '',
        'A_POSITIVE',
        'A_NEGATIVE',
        'B_POSITIVE',
        'B_NEGATIVE',
        'AB_POSITIVE',
        'AB_NEGATIVE',
        'O_POSITIVE',
        'O_NEGATIVE',
      ])
      .default(''),
    maritalStatus: z.enum(['', 'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).default(''),
    personalOccupation: z.string().trim().max(160).default(''),
    secondPhone: optionalPhoneSchema,
    address: z.string().trim().max(1000, 'Adres en fazla 1000 karakter olabilir.'),
    image: profileImageSchema,
    courseType: z.enum(['', 'GROUP', 'INDIVIDUAL']).refine((v): boolean => !!v, 'Kurs tipi seçin.'),
    course: z.string().trim(),
    level: z.string(),
    subLevel: z.string(),
    dayPreference: z.enum(['WEEKDAY', 'WEEKEND', 'ALL_WEEK', 'CUSTOM']),
    timePreference: z.enum(['MORNING', 'NOON', 'EVENING', 'LATE_EVENING', 'NIGHT', 'CUSTOM']),
    customDays: z.string().trim().max(160).default(''),
    customTime: z.string().trim().max(160).default(''),
    source: z.string(),
    occupation: z.union([z.enum(['STUDENT', 'EMPLOYEE', 'UNEMPLOYED']), z.literal('')]),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    institution: z.string(),
    company: z.string(),
    advisor: z.string().trim(),
    meetingResult: z
      .enum([
        '',
        'APPOINTMENT',
        'CALLBACK',
        'NEGATIVE',
        'SALE',
        'COMPLETED',
        'SMS_NOTIFICATION',
        'EMAIL_NOTIFICATION',
        'PENDING',
      ])
      .refine((v): boolean => !!v, 'Görüşme sonucu seçin.'),
    meetingDate: z.string(),
    negativeReason: z.string().transform((v) => normalizeNegativeReason(v, 'registration')),
    meetingNote: z.string().trim().max(1500, 'Görüşme notu en fazla 1500 karakter olabilir.'),
  })
  .superRefine((v, c) => {
    if (scheduledResults.has(v.meetingResult) && !isDateTime(v.meetingDate))
      c.addIssue({
        code: 'custom',
        path: ['meetingDate'],
        message: 'Bu görüşme sonucu için tarih ve saat seçin.',
      });
    if (
      v.meetingResult === 'NEGATIVE' &&
      v.negativeReason &&
      !registrationNegativeReasons.some(([code]) => code === v.negativeReason)
    )
      c.addIssue({
        code: 'custom',
        path: ['negativeReason'],
        message: 'Geçerli bir olumsuzluk nedeni seçin veya boş bırakın.',
      });
  });
export type RegistrationDraft = z.infer<typeof registrationSchema>;
export const emptyRegistration: RegistrationDraft = {
  studentType: '',
  meetingType: '',
  meetingScore: 3,
  name: '',
  email: '',
  phone: '',
  checkPhone: false,
  identityNumber: '',
  birthDate: '',
  birthPlace: '',
  gender: '',
  bloodType: '',
  maritalStatus: '',
  personalOccupation: '',
  secondPhone: '',
  address: '',
  image: '',
  courseType: '',
  course: '',
  level: '',
  subLevel: '',
  dayPreference: 'WEEKDAY',
  timePreference: 'EVENING',
  customDays: '',
  customTime: '',
  source: '',
  occupation: '',
  status: 'ACTIVE',
  institution: '',
  company: '',
  advisor: 'Furkan Çolak',
  meetingResult: '',
  meetingDate: '',
  negativeReason: '',
  meetingNote: '',
};
export const studentTypes = [
  ['INDIVIDUAL', 'Bireysel'],
  ['CORPORATE', 'Kurumsal'],
  ['CORPORATE_EMPLOYEE', 'Kurum çalışanı'],
];
export const dayPeriods = [
  ['WEEKDAY', 'Hafta içi'],
  ['WEEKEND', 'Hafta sonu'],
  ['ALL_WEEK', 'Tüm hafta'],
  ['CUSTOM', 'Özel'],
];
export const timePeriods = [
  ['MORNING', 'Sabah'],
  ['NOON', 'Öğle'],
  ['EVENING', 'Akşam'],
  ['LATE_EVENING', 'Geç akşam'],
  ['NIGHT', 'Gece'],
  ['CUSTOM', 'Özel'],
];
export const genders = [
  ['MALE', 'Erkek'],
  ['FEMALE', 'Kadın'],
];
export const maritalStatuses = [
  ['SINGLE', 'Bekâr'],
  ['MARRIED', 'Evli'],
  ['DIVORCED', 'Boşanmış'],
  ['WIDOWED', 'Dul'],
];
export const bloodTypes = [
  ['A_POSITIVE', 'A Rh+'],
  ['A_NEGATIVE', 'A Rh−'],
  ['B_POSITIVE', 'B Rh+'],
  ['B_NEGATIVE', 'B Rh−'],
  ['AB_POSITIVE', 'AB Rh+'],
  ['AB_NEGATIVE', 'AB Rh−'],
  ['O_POSITIVE', '0 Rh+'],
  ['O_NEGATIVE', '0 Rh−'],
];
