import { z } from 'zod';
import type { TeacherPersonal } from '../education/teacher-personal-model';
import {
  groupTeacherIssue,
  type GroupTeacherAssignment,
} from '../education/group-teacher-model.ts';
import { emailSchema, isDate, parsePhone } from '../../lib/validation.ts';
import { levelSelectionErrors, type SelectableLevel } from '../education/level-selection.ts';
export type LearningGroup = {
  id: string;
  name: string;
  course: string;
  level: string;
  teacher: string;
  headTeacherId?: string;
  capacity: number;
  schedule: string;
  room: string;
  status: 'Aktif' | 'Planlandı' | 'Tamamlandı' | 'Pasif';
  groupType?: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  educationType?: 'GROUPS' | 'PRIVATE' | 'BUSINESS' | 'KIDS' | 'OTHER';
  subLevel?: string;
  dayPeriod?: string;
  timePeriod?: string;
  programTermId?: string;
  description?: string;
  createdAt?: string;
};
export type Teacher = {
  personal?: TeacherPersonal;
  updatedAt?: string;
  id: string;
  image?: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  weeklyHours: number;
  status: 'Aktif' | 'İzinli' | 'Pasif';
  salary?: { amount: number; salaryType: 'HOURLY' | 'WEEKLY' | 'MONTHLY'; paymentDay: number };
  createdAt?: string;
};
export type Expense = {
  id: string;
  title: string;
  category: string;
  /** Canonical category relation when supplied; never derived from its label. */
  categoryId?: string;
  amount: number;
  date: string;
  status: 'Ödendi' | 'Bekliyor';
  note: string;
  type?: 'INCOME' | 'EXPENSE';
  transactionMode?: 'ONE_TIME' | 'RECURRING';
  recurringPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurringStartDate?: string;
  recurringEndDate?: string;
  isRecurringActive?: boolean;
};
export type PricePlan = {
  id: string;
  name: string;
  course: string;
  lessons: number;
  price: number;
  installments: number;
  active: boolean;
  periodId?: string;
  contract?: string;
  paymentDiscounts?: {
    paymentTypeId: number;
    paymentType: string;
    discount: { type: 'percentage' | 'amount'; value: number };
  }[];
  hasCampaign?: boolean;
  campaignTitle?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignPrice?: number;
};
export type MessageDraft = {
  id: string;
  channel: 'sms' | 'email' | 'whatsapp';
  title: string;
  body: string;
  recipient: string;
  recipientAddress?: string;
  recipientMode?: 'single' | 'bulk';
  recipientGroups?: string[];
  date: string;
  status: 'Taslak' | 'Planlandı' | 'Denendi';
  template: boolean;
};
export type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
};
export type OperationsState = {
  groupTeacherAssignments: GroupTeacherAssignment[];
  groups: LearningGroup[];
  teachers: Teacher[];
  expenses: Expense[];
  plans: PricePlan[];
  messages: MessageDraft[];
  automations: Automation[];
};
export type Collection = keyof OperationsState;
export type SaveAction = {
  [K in Collection]: { type: 'save'; collection: K; record: OperationsState[K][number] };
}[Collection];
export function operationsReducer(state: OperationsState, action: SaveAction): OperationsState {
  if (action.collection === 'groupTeacherAssignments' && groupTeacherIssue(state, action.record))
    return state;
  const records = state[action.collection] as { id: string }[];
  const promoted =
    action.collection === 'groups' &&
    action.record.headTeacherId &&
    state.groups.find((g) => g.id === action.record.id)?.headTeacherId !==
      action.record.headTeacherId
      ? action.record
      : null;
  return {
    ...state,
    ...(promoted
      ? {
          groupTeacherAssignments: state.groupTeacherAssignments.map((a) =>
            a.groupId === promoted.id && a.teacherId === promoted.headTeacherId
              ? { ...a, isActive: false }
              : a,
          ),
        }
      : {}),
    [action.collection]: records.some((r) => r.id === action.record.id)
      ? records.map((r) => (r.id === action.record.id ? action.record : r))
      : [action.record, ...records],
  };
}
const groupSchema = z.object({
  name: z.string().trim().min(2, 'Grup adı en az iki karakter olmalıdır.'),
  course: z.string().trim().min(1, 'Eğitim seçin.'),
  teacher: z.string().trim().min(1, 'Öğretmen seçin.'),
  level: z.string().trim().min(1, 'Seviye seçin.'),
  subLevel: z.string().min(1, 'Alt seviye seçin.'),
  groupType: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']),
  educationType: z.enum(['GROUPS', 'PRIVATE', 'BUSINESS', 'KIDS', 'OTHER']),
  dayPeriod: z.enum(['WEEKDAY', 'WEEKEND', 'ALL_WEEK', 'CUSTOM']),
  timePeriod: z.enum(['MORNING', 'NOON', 'EVENING', 'LATE_EVENING', 'NIGHT', 'CUSTOM']),
  capacity: z.number().int().min(1).max(100),
});
export function validateGroup(
  group: LearningGroup,
  memberCount = 0,
  levels?: SelectableLevel[],
  previous?: LearningGroup,
): string | null {
  const parsed = groupSchema.safeParse(group);
  if (!parsed.success) return parsed.error.issues[0]?.message || 'Grup bilgilerini kontrol edin.';
  if (group.capacity < memberCount) return 'Kapasite, atanmış öğrenci sayısından az olamaz.';
  if (levels) {
    const errors = levelSelectionErrors(group, levels, previous);
    if (errors.level || errors.subLevel) return errors.level || errors.subLevel!;
  }
  return null;
}
export function validAmount(value: number) {
  return Number.isFinite(value) && value > 0;
}
export const initialOperations: OperationsState = {
  groupTeacherAssignments: [],
  groups: [
    {
      id: 'g1',
      name: 'B1 · Hafta içi',
      course: 'Genel İngilizce',
      level: 'B1',
      teacher: 'Selin Demir',
      capacity: 16,
      schedule: 'Pazartesi · Çarşamba · Cuma, 09:00',
      room: 'Derslik 02',
      status: 'Aktif',
    },
    {
      id: 'g2',
      name: 'C1 · Akşam',
      course: 'IELTS Hazırlık',
      level: 'C1',
      teacher: 'Deniz Aydın',
      capacity: 12,
      schedule: 'Pazartesi · Perşembe, 18:30',
      room: 'Derslik 01',
      status: 'Aktif',
    },
    {
      id: 'g3',
      name: 'A2 · Hafta sonu',
      course: 'Genel İngilizce',
      level: 'A2',
      teacher: 'Ece Yıldız',
      capacity: 16,
      schedule: 'Cumartesi · Pazar, 10:00',
      room: 'Derslik 03',
      status: 'Aktif',
    },
    {
      id: 'g4',
      name: 'B2 · Akşam',
      course: 'İş İngilizcesi',
      level: 'B2',
      teacher: 'Ece Yıldız',
      capacity: 14,
      schedule: 'Salı · Perşembe, 19:00',
      room: 'Derslik 02',
      status: 'Aktif',
    },
  ],
  teachers: [
    {
      id: 't1',
      name: 'Selin Demir',
      specialty: 'Genel İngilizce',
      email: 'selin.demir@jamaster.com.tr',
      phone: '0532 555 10 20',
      weeklyHours: 24,
      status: 'Aktif',
    },
    {
      id: 't2',
      name: 'Deniz Aydın',
      specialty: 'IELTS / Konuşma',
      email: 'deniz.aydin@jamaster.com.tr',
      phone: '0532 555 10 21',
      weeklyHours: 18,
      status: 'Aktif',
    },
    {
      id: 't3',
      name: 'Ece Yıldız',
      specialty: 'İş İngilizcesi',
      email: 'ece.yildiz@jamaster.com.tr',
      phone: '0532 555 10 22',
      weeklyHours: 22,
      status: 'Aktif',
    },
    {
      id: 't4',
      name: 'Baran Aydın',
      specialty: 'Genel İngilizce',
      email: 'baran.aydin@jamaster.com.tr',
      phone: '0532 555 10 23',
      weeklyHours: 12,
      status: 'İzinli',
    },
  ],
  expenses: [
    {
      id: 'e1',
      title: 'Eylül kira ödemesi',
      category: 'Kira',
      date: '2026-09-01',
      amount: 48000,
      status: 'Ödendi',
      note: 'Eylül dönemi şube kirası',
    },
    {
      id: 'e2',
      title: 'Eğitim materyalleri',
      category: 'Malzeme',
      date: '2026-09-03',
      amount: 6750,
      status: 'Ödendi',
      note: 'Güz dönemi çalışma kitapları',
    },
    {
      id: 'e3',
      title: 'İnternet aboneliği',
      category: 'Fatura',
      date: '2026-09-08',
      amount: 1250,
      status: 'Bekliyor',
      note: '',
    },
    {
      id: 'e4',
      title: 'Temizlik hizmeti',
      category: 'Hizmet',
      date: '2026-09-10',
      amount: 4500,
      status: 'Bekliyor',
      note: '',
    },
  ],
  plans: [
    {
      id: 'p1',
      name: 'Standart 120',
      course: 'Genel İngilizce',
      lessons: 120,
      price: 18500,
      installments: 6,
      active: true,
    },
    {
      id: 'p2',
      name: 'IELTS Yoğun',
      course: 'IELTS Hazırlık',
      lessons: 80,
      price: 24000,
      installments: 4,
      active: true,
    },
    {
      id: 'p3',
      name: 'Kurumsal 60',
      course: 'İş İngilizcesi',
      lessons: 60,
      price: 21500,
      installments: 3,
      active: true,
    },
  ],
  messages: [
    {
      id: 'm1',
      channel: 'sms',
      title: 'Ders hatırlatma',
      body: 'Merhaba, bir sonraki dersiniz için programınızı öğrenci panelinden kontrol edebilirsiniz. İyi dersler!',
      recipient: 'Tüm aktif öğrenciler',
      date: '2026-09-07',
      status: 'Taslak',
      template: true,
    },
    {
      id: 'm2',
      channel: 'email',
      title: 'Güz dönemine hoş geldiniz',
      body: 'Sevgili öğrencimiz,\n\nYeni eğitim dönemimize hoş geldiniz. Eğitim hedeflerinize birlikte ulaşmak için buradayız. Ders programınıza öğrenci panelinden ulaşabilirsiniz.\n\nJamaster Eğitim Ekibi',
      recipient: 'Tüm aktif öğrenciler',
      date: '2026-09-07',
      status: 'Taslak',
      template: true,
    },
    {
      id: 'm3',
      channel: 'sms',
      title: 'Taksit bilgilendirmesi',
      body: 'Merhaba, yaklaşan taksit ödemeniz hakkında danışmanınızdan bilgi alabilirsiniz. İyi günler dileriz.',
      recipient: 'Ödemesi bekleyen öğrenciler',
      date: '2026-09-08',
      status: 'Planlandı',
      template: false,
    },
  ],
  automations: [
    {
      id: 'a1',
      name: 'Ders hatırlatması',
      trigger: 'Dersten 2 saat önce',
      action: 'SMS taslağı oluştur',
      enabled: true,
    },
    {
      id: 'a2',
      name: 'Taksit hatırlatması',
      trigger: 'Vadeden 3 gün önce',
      action: 'Danışmana görev oluştur',
      enabled: true,
    },
    {
      id: 'a3',
      name: 'Devamsızlık takibi',
      trigger: '3 ardışık devamsızlık',
      action: 'Görüşme planı oluştur',
      enabled: true,
    },
    {
      id: 'a4',
      name: 'Doğum günü mesajı',
      trigger: 'Öğrencinin doğum günü',
      action: 'E-posta taslağı oluştur',
      enabled: false,
    },
  ],
};

export function validateExpense(expense: Expense): string | null {
  if (expense.title.trim().length < 2 || !expense.category || !expense.note.trim())
    return 'Başlık, kategori ve açıklama zorunludur.';
  if (!validAmount(expense.amount)) return 'Tutar sıfırdan büyük olmalıdır.';
  if (expense.transactionMode === 'RECURRING') {
    if (
      !expense.recurringStartDate ||
      !isDate(expense.recurringStartDate) ||
      !expense.recurringPeriod
    )
      return 'Tekrarlayan işlem için başlangıç tarihi ve dönem seçin.';
    if (
      expense.recurringEndDate &&
      (!isDate(expense.recurringEndDate) || expense.recurringEndDate < expense.recurringStartDate)
    )
      return 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
  } else if (!isDate(expense.date)) return 'İşlem tarihi zorunludur.';
  return null;
}
export function validateTeacher(teacher: Teacher): string | null {
  if (
    teacher.name.trim().length < 2 ||
    !emailSchema.safeParse(teacher.email).success ||
    !parsePhone(teacher.phone)
  )
    return 'Ad, geçerli e-posta ve telefon zorunludur.';
  if (!Number.isFinite(teacher.weeklyHours) || teacher.weeklyHours < 0 || teacher.weeklyHours > 168)
    return 'Haftalık ders saati 0–168 arasında olmalıdır.';
  if (!['Aktif', 'Pasif', 'İzinli'].includes(teacher.status))
    return 'Geçerli bir öğretmen durumu seçin.';
  if (
    teacher.salary &&
    (!['HOURLY', 'WEEKLY', 'MONTHLY'].includes(teacher.salary.salaryType) ||
      !Number.isFinite(teacher.salary.amount) ||
      teacher.salary.amount < 0 ||
      !Number.isInteger(teacher.salary.paymentDay) ||
      teacher.salary.paymentDay < 1 ||
      teacher.salary.paymentDay > 31)
  )
    return 'Maaş tutarı ve 1–31 arasında bir ödeme günü girin.';
  return null;
}

export function validatePricePlan(plan: PricePlan): string | null {
  if (!plan.name.trim() || !plan.course || !plan.periodId || !plan.contract)
    return 'Paket adı, eğitim, dönem ve sözleşme seçin.';
  if (!Number.isFinite(plan.price) || plan.price < 0) return 'Geçerli bir paket fiyatı girin.';
  if (
    !Number.isInteger(plan.lessons) ||
    plan.lessons < 1 ||
    !Number.isInteger(plan.installments) ||
    plan.installments < 1 ||
    plan.installments > 24
  )
    return 'Ders sayısı ve 1–24 arasında taksit sayısı girin.';
  if (
    plan.paymentDiscounts?.some(
      (d) =>
        !Number.isFinite(d.discount.value) ||
        d.discount.value < 0 ||
        d.discount.value > (d.discount.type === 'percentage' ? 100 : plan.price),
    )
  )
    return 'İndirimler paket tutarını veya %100 değerini aşamaz.';
  if (
    plan.hasCampaign &&
    (!plan.campaignTitle?.trim() ||
      !isDate(plan.campaignStartDate || '') ||
      !isDate(plan.campaignEndDate || '') ||
      plan.campaignEndDate! < plan.campaignStartDate! ||
      !Number.isFinite(plan.campaignPrice) ||
      plan.campaignPrice! < 0 ||
      plan.campaignPrice! > plan.price)
  )
    return 'Kampanya adı, tarih aralığı ve paket fiyatını aşmayan kampanya tutarı girin.';
  return null;
}
