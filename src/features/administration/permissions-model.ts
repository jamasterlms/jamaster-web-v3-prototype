export const permissionResources = {
  'audit-logs': 'İşlem geçmişi',
  'branch-payments': 'Şube ödemeleri',
  'branch-settings': 'Şube ayarları',
  courses: 'Eğitimler',
  contracts: 'Sözleşmeler',
  email: 'E-posta',
  'email-templates': 'E-posta şablonları',
  expense: 'Giderler',
  groups: 'Gruplar',
  payments: 'Tahsilatlar',
  polling: 'Yoklamalar',
  pricing: 'Fiyatlandırma',
  reports: 'Raporlar',
  'bill-report': 'Senet raporu',
  'collection-report': 'Tahsilat raporu',
  'meeting-report': 'Görüşme raporu',
  note: 'Notlar',
  'overdue-report': 'Gecikmiş alacak raporu',
  'sales-report': 'Satış raporu',
  sales: 'Satışlar',
  schedule: 'Ders programı',
  settings: 'Ayarlar',
  sms: 'SMS',
  'sms-templates': 'SMS şablonları',
  students: 'Öğrenciler',
  'student-advanced-sale': 'İleri satış işlemleri',
  'student-advanced-education': 'İleri eğitim işlemleri',
  teachers: 'Öğretmenler',
  transfer: 'Transfer',
  verification: 'Doğrulamalar',
};
export const permissionActions = {
  view: 'Görüntüle',
  create: 'Oluştur',
  edit: 'Düzenle',
  delete: 'Sil',
};
export type BranchPermissions = { branchId: string; permissions: string[]; isManager: boolean };
const all = Object.keys(permissionResources).flatMap((r) =>
  Object.keys(permissionActions).map((a) => `${r}.${a}`),
);
export function normalizePermissions(values: string[]) {
  const result = new Set(values.filter((p) => all.includes(p)));
  for (const value of result) {
    const [resource, action] = value.split('.');
    if (action !== 'view') result.add(`${resource}.view`);
  }
  return [...result].sort();
}
export function changePermission(
  values: string[],
  resource: string,
  action: string,
  checked: boolean,
) {
  const key = `${resource}.${action}`;
  const next = values.filter((v) => v !== key);
  if (checked) next.push(key);
  return normalizePermissions(next);
}
const expand = (groups: Record<string, string>) =>
  Object.entries(groups).flatMap(([r, actions]) =>
    [...actions].map(
      (a) =>
        `${r}.${{ v: 'view', c: 'create', e: 'edit', d: 'delete' }[a as 'v' | 'c' | 'e' | 'd']}`,
    ),
  );
export const permissionPresets = {
  SALES_CONSULTANT: {
    label: 'Satış danışmanı',
    values: expand({
      sales: 'vce',
      students: 'vce',
      contracts: 'vce',
      payments: 'vc',
      'meeting-report': 'vc',
    }),
  },
  STUDENT_CONSULTANT: {
    label: 'Öğrenci danışmanı',
    values: expand({
      students: 'vced',
      contracts: 'vce',
      groups: 'v',
      schedule: 'v',
      payments: 'vce',
      email: 'vc',
      sms: 'vc',
    }),
  },
  ACCOUNTING: {
    label: 'Muhasebe',
    values: expand({
      payments: 'vced',
      expense: 'vced',
      reports: 'v',
      'bill-report': 'v',
      'collection-report': 'v',
      'sales-report': 'v',
      'overdue-report': 'v',
      'branch-payments': 'vce',
    }),
  },
  EDUCATION_COORDINATOR: {
    label: 'Eğitim koordinatörü',
    values: expand({
      courses: 'vced',
      groups: 'vced',
      schedule: 'vced',
      teachers: 'vce',
      students: 'vce',
    }),
  },
  STANDARD_USER: {
    label: 'Standart kullanıcı',
    values: all.filter(
      (p) =>
        !p.startsWith('audit-logs.') &&
        !p.startsWith('verification.') &&
        !p.endsWith('.delete') &&
        (p.startsWith('branch-payments.')
          ? !p.endsWith('.edit')
          : p.startsWith('student-advanced-')
            ? p.endsWith('.view')
            : true),
    ),
  },
};
export function setManager(value: BranchPermissions, isManager: boolean): BranchPermissions {
  return { ...value, isManager, permissions: isManager ? [...all] : [] };
}
