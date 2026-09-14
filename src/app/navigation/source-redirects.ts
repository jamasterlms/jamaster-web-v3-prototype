import { legacyPaymentPath } from '../../features/payment/payment-routes.ts';
/** Canonical detail routes from jamaster-web, retaining repeated and unrelated filters. */
export function sourceRedirect(pathname: string, search = ''): string | null {
  const path = pathname.replace(/^\/(tr|en)(?=\/|$)/, '') || '/';
  if (path !== pathname) return path + search;
  const payment = legacyPaymentPath(path, search);
  if (payment) return payment;
  const params = new URLSearchParams(search);
  const simple: Record<string, string> = {
    '/': '/admin/dashboard',
    '/admin': '/admin/dashboard',
    '/admin/settings': '/admin/settings/general',
    '/student': '/student/dashboard',
    '/teacher': '/teacher/dashboard',
  };
  if (simple[path]) return simple[path] + search;
  const match = path.match(/^\/admin\/(students|teachers)\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  const [, kind, id, section] = match;
  const base = `/admin/${kind}/${id}`;
  const students: Record<string, string> = {
    personal: '',
    notes: '/activities',
    group: '/groups',
    sales: '/payments?tab=saleHistory',
    installments: '/payments?tab=installments',
    meetings: '/history?tab=meetings',
    schedule: '/history?tab=schedule',
    'email-history': '/history?tab=email',
    'sms-history': '/history?tab=sms',
    'whatsapp-history': '/history?tab=whatsapp',
    'whatsapp-conversation': '/history?tab=whatsappConversation',
    'polling-history': '/history?tab=polling',
  };
  const teachers: Record<string, string> = {
    personal: '',
    notes: '/activities',
    salary: '/payments',
    schedule: '/history?tab=schedule',
    ogrenciler: '/students',
    gruplar: '/groups',
    aktiviteler: '/activities',
    odeme: '/payments',
    gecmis: '/history',
  };
  const map = kind === 'students' ? students : teachers;
  if (!Object.hasOwn(map, section)) return null;
  const [suffix, forced] = map[section].split('?');
  for (const [key, value] of new URLSearchParams(forced)) params.set(key, value);
  if (kind === 'students' && section === 'installments' && params.has('secondTab')) {
    const value = params.get('secondTab');
    params.delete('secondTab');
    if (value) params.set('installmentsTab', value);
  }
  return base + suffix + (params.size ? `?${params}` : '');
}
