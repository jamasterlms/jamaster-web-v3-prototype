export const educationFamilies = {
  Ops: [
    'studentName',
    'advisorName',
    'educationStatus',
    'activeGroupCount',
    'paidAmount',
    'lastAttendanceAt',
  ],
  Frozen: [
    'studentName',
    'advisorName',
    'educationStatus',
    'lastFreezeStart',
    'lastFreezeEnd',
    'remainingAmount',
  ],
  End: [
    'studentName',
    'educationStatus',
    'endDate',
    'daysToEnd',
    'lastFreezeStart',
    'lastFreezeEnd',
    'paidAmount',
  ],
  Bonus: [
    'studentName',
    'usedBonusCount',
    'remainingBonusCount',
    'educationStatus',
    'paidAmount',
    'advisorName',
  ],
  Status: ['studentName', 'educationStatus', 'advisorName', 'activeGroupCount', 'paidAmount'],
  Attendance: [
    'studentName',
    'attendanceRate',
    'lastAttendanceAt',
    'lastMeetingAt',
    'activeGroupCount',
    'paidAmount',
  ],
  AttendanceBalance: [
    'studentName',
    'attendanceRate',
    'lastAttendanceAt',
    'lastMeetingAt',
    'activeGroupCount',
    'remainingAmount',
  ],
  Group: ['studentName', 'activeGroupCount', 'groupSwitchCount', 'advisorName', 'educationStatus'],
  Transfer: ['studentName', 'transferredAt', 'meetingCount', 'advisorName', 'saleStatus'],
  Meeting: ['studentName', 'lastMeetingAt', 'meetingCount', 'advisorName', 'saleStatus'],
  Meetings: ['studentName', 'advisorName', 'saleStatus', 'meetingCount', 'lastMeetingAt'],
} as const;
export const educationLeafDefinitions: Record<
  string,
  { family: keyof typeof educationFamilies; dates: boolean; unavailable?: string }
> = Object.fromEntries(
  (
    [
      ['meetings', 'Meetings', true],
      ['active-students', 'Ops', false],
      ['active-unassigned-students', 'Ops', false],
      ['frozen-students', 'Frozen', false],
      [
        'ending-soon-students',
        'End',
        true,
        'Eğitim bitiş tarihleri ve yaklaşan bitiş ölçütü henüz alınamadı.',
      ],
      ['bonus-used-students', 'Bonus', true, 'Bonus hakları ve kullanım geçmişi henüz alınamadı.'],
      ['bonus-remaining-risk', 'Bonus', true, 'Bonus hakları ve risk ölçütü henüz alınamadı.'],
      ['education-status-distribution', 'Status', false],
      [
        'attendance-risk-students',
        'Attendance',
        true,
        'Devam riski için kurumun rapor ölçütü henüz alınamadı.',
      ],
      ['attendance-trend', 'Attendance', true],
      ['no-attendance-recently', 'Attendance', true],
      ['group-assignment-load', 'Group', false],
      [
        'group-switch-history',
        'Group',
        false,
        'Grup değişimi sayısının rapor tanımı henüz alınamadı.',
      ],
      [
        'transfer-out-students',
        'Transfer',
        true,
        'Şubeler arası transfer geçmişi henüz alınamadı.',
      ],
      [
        'reactivation-candidates',
        'End',
        true,
        'Yeniden başlatma adaylarını belirlemek için eğitim bitiş ve dondurma geçmişi gerekiyor.',
      ],
      ['no-meeting-recently', 'Meeting', true],
      [
        'low-attendance-high-remaining',
        'AttendanceBalance',
        true,
        'Devam ve yüksek bakiye için kurumun risk ölçütleri henüz alınamadı.',
      ],
      ['never-attended-students', 'Attendance', true],
      ['zero-bonus-remaining', 'Bonus', true, 'Bonus hakları ve kullanım geçmişi henüz alınamadı.'],
      ['long-freeze-students', 'End', true, 'Dondurma aralıkları ve süre ölçütü henüz alınamadı.'],
      ['never-group-assigned', 'Group', false],
      [
        'high-attendance-students',
        'Attendance',
        true,
        'Yüksek devam için kurumun rapor ölçütü henüz alınamadı.',
      ],
      ['meeting-intensive-students', 'Meeting', true, 'Yoğun görüşme ölçütü henüz alınamadı.'],
      ['no-advisor-students', 'Ops', false],
    ] as [string, keyof typeof educationFamilies, boolean, string?][]
  ).map(([key, family, dates, unavailable]) => [key, { family, dates, unavailable }]),
);
export const salesLeafDefinitions: Record<
  string,
  {
    label: string;
    columns: string[];
    group: 'advisor' | 'package' | 'method' | 'group' | 'other';
    unavailable?: string;
  }
> = Object.fromEntries(
  (
    [
      [
        'sales-by-advisor',
        'Danışman',
        ['totalSales', 'totalRevenue', 'totalRemaining', 'riskCount'],
        'advisor',
      ],
      [
        'conversion-funnel',
        'Aşama',
        ['totalSales', 'conversionRate'],
        'other',
        'Dönüşüm oranının aşama ve payda tanımları henüz alınamadı.',
      ],
      [
        'payment-method-performance',
        'Ödeme tipi',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'method',
      ],
      [
        'installment-risk',
        'Danışman',
        ['totalSales', 'riskCount', 'totalRemaining'],
        'advisor',
        'Taksit riski ölçütü henüz alınamadı.',
      ],
      ['discount-impact', 'Danışman', ['totalSales', 'totalRevenue', 'totalRemaining'], 'advisor'],
      [
        'high-discount-sales',
        'Danışman',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'advisor',
        'Yüksek indirim ölçütü henüz alınamadı.',
      ],
      [
        'unpaid-balance-heavy',
        'Paket',
        ['totalSales', 'totalRevenue', 'totalRemaining', 'riskCount'],
        'package',
        'Yüksek bakiye ölçütü henüz alınamadı.',
      ],
      [
        'pending-sales',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'group',
        'Satış yaşam döngüsü bilgileri henüz alınamadı.',
      ],
      [
        'completed-sales',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'group',
        'Satış yaşam döngüsü bilgileri henüz alınamadı.',
      ],
      [
        'cancelled-sales',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'group',
        'İptal kayıtları henüz alınamadı.',
      ],
      [
        'refunded-sales',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'group',
        'İade kayıtları henüz alınamadı.',
      ],
      [
        'no-discount-sales',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'group',
        'Kampanya ve temel indirim dahil indirimsiz satış verileri henüz alınamadı.',
      ],
      [
        'expiring-soon-sales',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining', 'riskCount'],
        'group',
        'Sözleşme bitiş tarihleri henüz alınamadı.',
      ],
      [
        'advisor-revenue-risk',
        'Danışman',
        ['totalSales', 'totalRevenue', 'totalRemaining', 'riskCount'],
        'advisor',
        'Danışman risk ölçütü henüz alınamadı.',
      ],
      [
        'cancellation-refund-analysis',
        'Durum',
        ['totalSales', 'totalRevenue'],
        'other',
        'İptal ve iade tutarları henüz alınamadı.',
      ],
      [
        'pricing-package-performance',
        'Paket',
        ['totalSales', 'totalRevenue', 'totalRemaining', 'riskCount'],
        'package',
      ],
      [
        'revenue-forecast-trend',
        'Grup',
        ['totalSales', 'totalRevenue', 'totalRemaining'],
        'group',
        'Satış anındaki grup bağlantıları ve gelir tahmini henüz alınamadı.',
      ],
      [
        'contract-expiry-revenue-risk',
        'Bitiş penceresi',
        ['totalSales', 'totalRemaining'],
        'other',
        'Sözleşme bitiş ve risk verileri henüz alınamadı.',
      ],
    ] as [string, string, string[], 'advisor' | 'package' | 'method' | 'group' | 'other', string?][]
  ).map(([key, label, columns, group, unavailable]) => [
    key,
    { label, columns, group, unavailable },
  ]),
);
export const leafLabels: Record<string, string> = {
  studentName: 'Öğrenci',
  advisorName: 'Danışman',
  educationStatus: 'Eğitim durumu',
  activeGroupCount: 'Aktif grup',
  paidAmount: 'Ödenen tutar',
  lastAttendanceAt: 'Son katılım',
  lastFreezeStart: 'Dondurma başlangıcı',
  lastFreezeEnd: 'Dondurma bitişi',
  remainingAmount: 'Kalan tutar',
  endDate: 'Eğitim bitişi',
  daysToEnd: 'Kalan gün',
  usedBonusCount: 'Kullanılan bonus',
  remainingBonusCount: 'Kalan bonus',
  attendanceRate: 'Devam oranı',
  lastMeetingAt: 'Son görüşme',
  groupSwitchCount: 'Grup değişimi',
  transferredAt: 'Transfer tarihi',
  meetingCount: 'Görüşme sayısı',
  saleStatus: 'Satış durumu',
  totalSales: 'Satış sayısı',
  totalRevenue: 'Ciro',
  totalRemaining: 'Kalan tutar',
  riskCount: 'Risk sayısı',
  conversionRate: 'Dönüşüm oranı',
};
export const educationStatusOptions = {
  active: 'Aktif',
  frozen: 'Dondurulmuş',
  expired: 'Süresi dolmuş',
  pending: 'Bekliyor',
  completed: 'Tamamlandı',
};
export const saleStatusOptions = {
  pending: 'Bekliyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  refunded: 'İade',
};
export const paymentTypeOptions = {
  CASH: 'Nakit',
  BANK_TRANSFER: 'Havale / EFT',
  CREDIT_CARD_SINGLE: 'Kredi kartı',
  IYZICO: 'İyzico',
  PROMISSORY_NOTE: 'Senet',
};
