import type { NavigationGroup } from '@/types';
import raw from './navigation.json';
import { localDate } from '@/lib/validation';
export const navigation = raw as NavigationGroup[];
export function navRoute(path: string) {
  const today = localDate();
  return path
    .replace('YYYY-MM-DD', today)
    .replace('YYYY-MM-01', `${today.slice(0, 7)}-01`)
    .replace(/^\//, '');
}
export function navIcon(name: string) {
  return (
    (
      {
        FaWhatsapp: 'message-circle',
        Group: 'group',
        CalendarRange: 'calendar-range',
        HelpCircle: 'circle-help',
      } as Record<string, string>
    )[name] || name.replace(/[A-Z]/g, (letter, index) => (index ? '-' : '') + letter.toLowerCase())
  );
}
export const primaryPages = [
  { id: 'admin/dashboard', title: 'Panel', icon: 'layout-dashboard' },
  { id: 'admin/calendar', title: 'Takvim', icon: 'calendar-days' },
  { id: 'admin/students', title: 'Öğrenciler', icon: 'users' },
  { id: 'admin/education-reports', title: 'Raporlar', icon: 'chart-no-axes-combined' },
];
export const allPages = navigation
  .flatMap((group) =>
    group.items.flatMap((item) => [
      { id: navRoute(item.path), title: item.label, icon: navIcon(item.icon), parent: item },
      ...(item.children || []).map((child) => ({
        id: navRoute(child.path),
        title: child.label,
        icon: navIcon(item.icon),
        parent: item,
      })),
    ]),
  )
  .filter((page, index, array) => array.findIndex((item) => item.id === page.id) === index);
function detailPage(route: string) {
  const path = route.replace(/^\//, '').split('?')[0],
    parts = path.split('/');
  const [scope, kind, , section] = parts;
  const exact: Record<string, [string, string]> = {
    'admin/meetings': ['Görüşmeler', 'handshake'],
    'admin/reports/meetings': ['Görüşmeler', 'handshake'],
    'admin/programs': ['Programlar', 'book-open'],
    'admin/activities': ['Aktiviteler', 'clipboard-list'],
    'admin/teachers/salary': ['Öğretmen maaşları', 'wallet'],
    'admin/staff/salary': ['Personel maaşları', 'wallet'],
    'user/notifications': ['Bildirimler', 'bell'],
    login: ['Giriş', 'log-in'],
    'forgot-password': ['Şifremi unuttum', 'key-round'],
    'reset-password': ['Şifre yenile', 'key-round'],
    'branch-selection': ['Şube seçimi', 'building'],
    polling: ['Derse katılım', 'calendar-check'],
    payment: ['Ödemeler', 'wallet'],
    unsubscribe: ['Abonelik tercihi', 'mail'],
  };
  if (exact[path]) return { title: exact[path][0], icon: exact[path][1] };
  if (scope === 'student' || scope === 'teacher') {
    const label: Record<string, string> = {
      dashboard: 'Genel bakış',
      courses: parts[2] ? 'Ders detayı' : 'Derslerim',
      activities: parts[2] ? 'Aktivite detayı' : 'Aktiviteler',
      grades: 'Notlarım',
      announcements: 'Duyurular',
      'grade-overview': 'Not özeti',
    };
    return {
      title: label[kind] || 'Hesabım',
      icon: scope === 'student' ? 'graduation-cap' : 'book-open',
    };
  }
  if (scope === 'payment') return { title: 'Ödeme bağlantısı', icon: 'wallet' };
  const labels: Record<string, Record<string, string>> = {
    students: {
      '': 'Öğrenci profili',
      payments: 'Öğrenci ödemeleri',
      history: 'Öğrenci geçmişi',
      groups: 'Öğrenci grupları',
      activities: 'Öğrenci aktiviteleri',
      documents: 'Öğrenci belgeleri',
    },
    teachers: {
      '': 'Öğretmen profili',
      students: 'Öğretmenin öğrencileri',
      groups: 'Öğretmenin grupları',
      activities: 'Öğretmen aktiviteleri',
      payments: 'Öğretmen ödemeleri',
      history: 'Öğretmen geçmişi',
    },
    groups: {
      '': 'Grup detayları',
      teacher: 'Grup öğretmenleri',
      notes: 'Grup notları',
      schedule: 'Grup programı',
      polling: 'Grup yoklamaları',
    },
  };
  if (labels[kind] && parts[2])
    return {
      title: labels[kind][section || ''] || labels[kind][''],
      icon: kind === 'groups' ? 'group' : kind === 'teachers' ? 'user' : 'users',
    };
  if (kind === 'activities')
    return {
      title: section === 'submissions' ? 'Aktivite teslimleri' : 'Aktivite detayı',
      icon: 'clipboard-list',
    };
  if (kind === 'sales') return { title: 'Yeni satış', icon: 'wallet' };
  if (['staff', 'users'].includes(kind)) return { title: 'Personel profili', icon: 'user' };
  if (kind === 'branches') return { title: 'Şube detayı', icon: 'building' };
  if (kind === 'automations') return { title: 'Otomasyon detayı', icon: 'workflow' };
  if (['sms', 'email', 'whatsapp'].includes(kind))
    return {
      title:
        kind === 'email' ? 'E-posta detayı' : kind === 'sms' ? 'SMS detayı' : 'WhatsApp detayı',
      icon: 'message-circle',
    };
  return { title: 'Çalışma alanı', icon: 'layout-dashboard' };
}
export const pageFor = (route: string) =>
  allPages.find((page) => page.id === route) ||
  allPages.find((page) => page.id.split('?')[0] === route.split('?')[0]) || {
    id: route,
    ...detailPage(route),
    parent: undefined,
  };
export function operationKey(route: string) {
  const parts = route.split('/');
  if (parts[1] === 'education' && parts[2] === 'period') return 'period';
  if (parts[1] === 'billing') return 'payments';
  return parts[1] || 'groups';
}
