import type { ComponentProps } from 'react';
import type { PageComponents } from '../page-loaders';
import { salesLeafDefinitions } from '../../features/insights/leaf-definitions';
import { sourceRedirect } from './source-redirects';

export type PageName = keyof PageComponents;
export type PageMatch = {
  [K in PageName]: { name: K; props: ComponentProps<PageComponents[K]> };
}[PageName];
function page<K extends PageName>(name: K, props: ComponentProps<PageComponents[K]>): PageMatch {
  return { name, props } as PageMatch;
}

const analyses = new Set([
  'accounting',
  'sales-by-advisor',
  'conversion-funnel',
  'payment-method-performance',
  'discount-impact',
  'cancellation-refund-analysis',
  'pricing-package-performance',
  'revenue-forecast-trend',
  'advisor-revenue-risk',
  'contract-expiry-revenue-risk',
]);
function decodeId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
export function resolvePage(
  inputRoute: string,
  search = '',
): PageMatch | { redirect: string } | null {
  const route = inputRoute.split(/[?#]/)[0].replace(/^\//, '');
  const redirect = sourceRedirect(
    '/' + route,
    inputRoute.includes('?') ? '?' + inputRoute.split('?').slice(1).join('?') : search,
  );
  if (redirect) return { redirect };
  const key = route.split('/')[1],
    create = /\/(form|create)$/.test(route),
    slug = route.split('/').at(-1) || '';
  if (/^(access|unauthorized|forbidden|offline|maintenance|error)(\/|$)/.test(route))
    return page('AccessStatePage', { route });
  if (/^(student|teacher)\/(login|forbidden|unauthorized)$/.test(route))
    return { redirect: '/' + route.split('/')[1] + '?role=' + route.split('/')[0] };
  if (route === 'help') return page('SupportPage', {});
  if (
    /^(student|teacher)\//.test(route) &&
    !/^(student|teacher)\/(dashboard|courses|activities|grades|grade-overview|announcements)(\/|$)/.test(
      route,
    )
  )
    return { redirect: '/access/not-found?role=' + route.split('/')[0] };
  if (/^(student|teacher)\//.test(route)) return page('PortalPage', { route: route });
  if (
    /^(login|forgot-password|reset-password|redirect|branch-selection|polling|payment|unsubscribe)(\/|$)/.test(
      route,
    )
  )
    return page('AccessPage', { route: route });
  if (route === 'admin/payments/checkout') return page('BillingPage', { route: 'admin/payments' });
  if (route.startsWith('super/billing') || route === 'admin/payments')
    return page('BillingPage', { route: route });
  if (route === 'user/account') return page('AccountPage', {});
  if (route === 'user/notifications') return page('NotificationsPage', {});
  const branchDetail = route.match(/^super\/branches\/([^/]+)$/);
  if (branchDetail && !['form', 'payments'].includes(branchDetail[1]))
    return page('BranchDetailPage', { id: decodeId(branchDetail[1]) });
  if (route === 'admin/programs') return page('ProgramsPage', {});
  const activityRoute = route.match(/^admin\/activities(?:\/([^/]+)(?:\/(submissions))?)?$/);
  if (activityRoute)
    return page('ActivitiesPage', {
      id: activityRoute[1] && decodeId(activityRoute[1]),
      submissions: !!activityRoute[2],
    });
  if (route === 'admin/teachers/salary' || route === 'admin/staff/salary')
    return page('PayrollPage', { kind: key === 'teachers' ? 'teacher' : 'staff' });
  const teacherRelated = route.match(
    /^admin\/teachers\/([^/]+)\/(students|groups|activities|payments)$/,
  );
  if (teacherRelated)
    return page('TeacherRelatedPage', {
      id: decodeId(teacherRelated[1]),
      section: teacherRelated[2] as 'students' | 'groups' | 'activities' | 'payments',
    });
  if (route === 'admin/dashboard') return page('DashboardPage', {});
  if (route === 'admin/calendar' || route === 'admin/calendar/pollings')
    return page('CalendarPage', { attendance: route.includes('pollings') });
  if (['admin/students', 'admin/students/potential', 'admin/students/past'].includes(route))
    return page('StudentsPage', {});
  if (route === 'admin/students/register') return page('RegistrationPage', {});
  const studentRoute = route.match(
    /^admin\/students\/([^/]+)(?:\/(payments|polling-history|history|groups|activities|documents))?$/,
  );
  if (studentRoute)
    return page('StudentPage', { id: decodeId(studentRoute[1]), section: studentRoute[2] });
  if (route === 'admin/education-reports' || route === 'admin/reports')
    return page('ReportsPage', { finance: route === 'admin/reports' });
  if (route.includes('settings') || route.includes('user/account'))
    return page('SettingsPage', { route: route });
  if (/^admin\/sales\/\d+$/.test(route)) return page('SalePage', { id: Number(slug) });
  const groupAttendance = route.match(/^admin\/groups\/([^/]+)\/polling$/);
  const groupNotes = route.match(/^admin\/groups\/([^/]+)\/notes$/);
  if (groupNotes) return page('GroupNotesPage', { groupId: decodeId(groupNotes[1]) });
  const batchSchedule = route.match(/^admin\/groups\/([^/]+)\/schedule\/create$/);
  if (batchSchedule) return page('BatchSchedulePage', { groupId: decodeId(batchSchedule[1]) });
  const groupTeachers = route.match(/^admin\/groups\/([^/]+)\/teacher$/);
  if (groupTeachers) return page('GroupTeachersPage', { groupId: decodeId(groupTeachers[1]) });
  if (groupAttendance)
    return page('AttendancePage', { initialGroupId: decodeId(groupAttendance[1]) });
  const groupSchedule = route.match(/^admin\/groups\/([^/]+)\/schedule$/);
  if (groupSchedule)
    return page('CalendarPage', { scope: { groupId: decodeId(groupSchedule[1]) } });
  const oldTeacherSchedule = route.match(/^admin\/teachers\/([^/]+)\/schedule$/);
  if (oldTeacherSchedule) {
    const params = new URLSearchParams(search);
    params.set('tab', 'schedule');
    return {
      redirect: `/admin/teachers/${encodeURIComponent(decodeId(oldTeacherSchedule[1]))}/history?${params}`,
    };
  }
  const teacherHistory = route.match(/^admin\/teachers\/([^/]+)\/history$/);
  if (teacherHistory)
    return page('CalendarPage', { scope: { teacherId: decodeId(teacherHistory[1]) } });
  if (key === 'groups')
    return page('GroupsPage', {
      create: create,
      detailId: !create && route.split('/').length === 3 ? decodeId(slug) : undefined,
    });
  if (key === 'teachers')
    return page('TeachersPage', {
      create: create,
      detailId: !create && route.split('/').length === 3 ? decodeId(slug) : undefined,
    });
  if (['education', 'program-terms', 'curriculum-units'].includes(key))
    return page('LearningPage', { route: route });
  if (['meetings', 'monthly-meetings'].includes(slug) && key !== 'education-reports')
    return key === 'verification-requests'
      ? page('VerificationPage', { route: route })
      : page('MeetingsPage', {});
  if (key === 'education-reports') return page('EducationDetailPage', { route: route });
  if (key === 'expenses')
    return page('ExpensesPage', { create: create, superAdmin: route.startsWith('super/') });
  if (key === 'pricing') return page('PricingPage', { create: create });
  if (key === 'reports' && salesLeafDefinitions[slug])
    return page('LeafReportPage', { kind: 'sales', route: route });
  if (
    key === 'reports' &&
    ['sales', 'collections', 'overdue-receivables', 'accounting', 'bills'].includes(slug)
  )
    return page('PrimaryReportPage', {
      kind: slug as 'sales' | 'collections' | 'overdue-receivables' | 'accounting' | 'bills',
    });
  if (key === 'reports' && analyses.has(slug))
    return analyses.has(slug)
      ? page('FinanceAnalysisPage', { route: route })
      : page('LedgerPage', { route: route });
  if (route === 'super/branches/payments') return page('BillingPage', { route });
  if (key === 'payments' && slug === 'installments') return page('LedgerPage', { route: route });
  if (key?.startsWith('payments') || key === 'billing')
    return page('PaymentsPage', { route: route });
  if (['sms', 'email', 'whatsapp'].includes(key))
    return page('CommunicationsPage', { route: route });
  if (['staff', 'users', 'branches'].includes(key)) return page('TeamPage', { route: route });
  if (key === 'automations')
    return page('AutomationsPage', {
      create: create,
      id: !create && route.split('/').length === 3 ? decodeId(slug) : undefined,
    });
  if (key === 'verification-requests') return page('VerificationPage', { route: route });
  if (key === 'announcements') return page('AnnouncementsPage', {});
  if (key === 'contracts') return page('ContractsPage', { create: create });
  if (key === 'files') return page('FilesPage', {});
  if (key === 'support') return page('SupportPage', {});
  return null;
}
