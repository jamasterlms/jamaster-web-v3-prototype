import { createElement, type ComponentType, type ComponentProps } from 'react';
import { createPageResource } from './navigation/page-resource';

export const pageLoaders = {
  AccessStatePage: () =>
    import('@/features/access/access-state-page').then((m) => ({ default: m.AccessStatePage })),
  PrimaryReportPage: () =>
    import('@/features/finance/primary-report-page').then((m) => ({
      default: m.PrimaryReportPage,
    })),
  LeafReportPage: () =>
    import('@/features/insights/leaf-report-page').then((m) => ({ default: m.LeafReportPage })),
  BranchDetailPage: () =>
    import('@/features/administration/branch-detail-page').then((m) => ({
      default: m.BranchDetailPage,
    })),
  NotificationsPage: () =>
    import('@/features/settings/notifications-page').then((m) => ({
      default: m.NotificationsPage,
    })),
  AccountPage: () =>
    import('@/features/settings/account-page').then((m) => ({ default: m.AccountPage })),
  PortalPage: () =>
    import('@/features/portals/portal-page').then((m) => ({ default: m.PortalPage })),
  AccessPage: () =>
    import('@/features/access/access-pages').then((m) => ({ default: m.AccessPage })),
  BillingPage: () =>
    import('@/features/finance/billing-page').then((m) => ({ default: m.BillingPage })),
  PayrollPage: () =>
    import('@/features/payroll/payroll-page').then((module) => ({ default: module.PayrollPage })),
  TeacherRelatedPage: () =>
    import('@/features/education/teacher-related-page').then((module) => ({
      default: module.TeacherRelatedPage,
    })),
  ProgramsPage: () =>
    import('@/features/education/programs-page').then((module) => ({
      default: module.ProgramsPage,
    })),
  ActivitiesPage: () =>
    import('@/features/activities/activities-page').then((module) => ({
      default: module.ActivitiesPage,
    })),
  GroupNotesPage: () =>
    import('@/features/education/group-notes-page').then((module) => ({
      default: module.GroupNotesPage,
    })),
  BatchSchedulePage: () =>
    import('@/features/calendar/batch-schedule-page').then((module) => ({
      default: module.BatchSchedulePage,
    })),
  GroupTeachersPage: () =>
    import('@/features/education/group-teachers-page').then((module) => ({
      default: module.GroupTeachersPage,
    })),
  AutomationsPage: () =>
    import('@/features/administration/automations-page').then((module) => ({
      default: module.AutomationsPage,
    })),
  AnnouncementsPage: () =>
    import('@/features/administration/content-pages').then((module) => ({
      default: module.AnnouncementsPage,
    })),
  FilesPage: () =>
    import('@/features/administration/content-pages').then((module) => ({
      default: module.FilesPage,
    })),
  SupportPage: () =>
    import('@/features/help/help-page').then((module) => ({
      default: module.HelpPage,
    })),
  ContractsPage: () =>
    import('@/features/administration/contracts-page').then((module) => ({
      default: module.ContractsPage,
    })),
  TeamPage: () =>
    import('@/features/administration/team-page').then((module) => ({ default: module.TeamPage })),
  VerificationPage: () =>
    import('@/features/administration/verification-page').then((module) => ({
      default: module.VerificationPage,
    })),
  AttendancePage: () =>
    import('@/features/calendar/attendance-page').then((module) => ({
      default: module.AttendancePage,
    })),
  CalendarPage: () =>
    import('@/features/calendar/calendar-page').then((module) => ({
      default: module.CalendarPage,
    })),
  CommunicationsPage: () =>
    import('@/features/communications/communications-page').then((module) => ({
      default: module.CommunicationsPage,
    })),
  DashboardPage: () =>
    import('@/features/dashboard/dashboard-page').then((module) => ({
      default: module.DashboardPage,
    })),
  GroupsPage: () =>
    import('@/features/education/groups-page').then((module) => ({ default: module.GroupsPage })),
  LearningPage: () =>
    import('@/features/education/learning-page').then((module) => ({
      default: module.LearningPage,
    })),
  TeachersPage: () =>
    import('@/features/education/teachers-page').then((module) => ({
      default: module.TeachersPage,
    })),
  ExpensesPage: () =>
    import('@/features/finance/expenses-page').then((module) => ({ default: module.ExpensesPage })),
  FinanceAnalysisPage: () =>
    import('@/features/finance/finance-analysis-page').then((module) => ({
      default: module.FinanceAnalysisPage,
    })),
  LedgerPage: () =>
    import('@/features/finance/financial-ledger').then((module) => ({
      default: module.LedgerPage,
    })),
  PaymentsPage: () =>
    import('@/features/finance/ledger-page').then((module) => ({ default: module.PaymentsPage })),
  PricingPage: () =>
    import('@/features/finance/pricing-page').then((module) => ({ default: module.PricingPage })),
  SalePage: () =>
    import('@/features/finance/sale-page').then((module) => ({ default: module.SalePage })),
  EducationDetailPage: () =>
    import('@/features/insights/education-detail-page').then((module) => ({
      default: module.EducationDetailPage,
    })),
  ReportsPage: () =>
    import('@/features/insights/reports-page').then((module) => ({ default: module.ReportsPage })),
  MeetingsPage: () =>
    import('@/features/meetings/meetings-page').then((module) => ({
      default: module.MeetingsPage,
    })),
  SettingsPage: () =>
    import('@/features/settings/settings-page').then((module) => ({
      default: module.SettingsPage,
    })),
  RegistrationPage: () =>
    import('@/features/students/registration-page').then((module) => ({
      default: module.RegistrationPage,
    })),
  StudentPage: () =>
    import('@/features/students/student-page').then((module) => ({ default: module.StudentPage })),
  StudentsPage: () =>
    import('@/features/students/students-page').then((module) => ({
      default: module.StudentsPage,
    })),
};
export type PageComponents = {
  [K in keyof typeof pageLoaders]: ComponentType<
    ComponentProps<Awaited<ReturnType<(typeof pageLoaders)[K]>>['default']> & object
  >;
};
function preparePage<Props extends object>(load: () => Promise<{ default: ComponentType<Props> }>) {
  const resource = createPageResource(load);
  function PreparedPage(props: Props) {
    return createElement(resource.read().default, props);
  }
  return Object.assign(PreparedPage, {
    preload: resource.preload,
    resetFailure: resource.resetFailure,
  });
}

export const lazyPages = {
  PrimaryReportPage: preparePage(pageLoaders.PrimaryReportPage),
  LeafReportPage: preparePage(pageLoaders.LeafReportPage),
  BranchDetailPage: preparePage(pageLoaders.BranchDetailPage),
  NotificationsPage: preparePage(pageLoaders.NotificationsPage),
  AccountPage: preparePage(pageLoaders.AccountPage),
  PortalPage: preparePage(pageLoaders.PortalPage),
  AccessPage: preparePage(pageLoaders.AccessPage),
  BillingPage: preparePage(pageLoaders.BillingPage),
  PayrollPage: preparePage(pageLoaders.PayrollPage),
  TeacherRelatedPage: preparePage(pageLoaders.TeacherRelatedPage),
  ProgramsPage: preparePage(pageLoaders.ProgramsPage),
  ActivitiesPage: preparePage(pageLoaders.ActivitiesPage),
  GroupNotesPage: preparePage(pageLoaders.GroupNotesPage),
  BatchSchedulePage: preparePage(pageLoaders.BatchSchedulePage),
  GroupTeachersPage: preparePage(pageLoaders.GroupTeachersPage),
  AutomationsPage: preparePage(pageLoaders.AutomationsPage),
  AnnouncementsPage: preparePage(pageLoaders.AnnouncementsPage),
  FilesPage: preparePage(pageLoaders.FilesPage),
  AccessStatePage: preparePage(pageLoaders.AccessStatePage),
  SupportPage: preparePage(pageLoaders.SupportPage),
  ContractsPage: preparePage(pageLoaders.ContractsPage),
  TeamPage: preparePage(pageLoaders.TeamPage),
  VerificationPage: preparePage(pageLoaders.VerificationPage),
  AttendancePage: preparePage(pageLoaders.AttendancePage),
  CalendarPage: preparePage(pageLoaders.CalendarPage),
  CommunicationsPage: preparePage(pageLoaders.CommunicationsPage),
  DashboardPage: preparePage(pageLoaders.DashboardPage),
  GroupsPage: preparePage(pageLoaders.GroupsPage),
  LearningPage: preparePage(pageLoaders.LearningPage),
  TeachersPage: preparePage(pageLoaders.TeachersPage),
  ExpensesPage: preparePage(pageLoaders.ExpensesPage),
  FinanceAnalysisPage: preparePage(pageLoaders.FinanceAnalysisPage),
  LedgerPage: preparePage(pageLoaders.LedgerPage),
  PaymentsPage: preparePage(pageLoaders.PaymentsPage),
  PricingPage: preparePage(pageLoaders.PricingPage),
  SalePage: preparePage(pageLoaders.SalePage),
  EducationDetailPage: preparePage(pageLoaders.EducationDetailPage),
  ReportsPage: preparePage(pageLoaders.ReportsPage),
  MeetingsPage: preparePage(pageLoaders.MeetingsPage),
  SettingsPage: preparePage(pageLoaders.SettingsPage),
  RegistrationPage: preparePage(pageLoaders.RegistrationPage),
  StudentPage: preparePage(pageLoaders.StudentPage),
  StudentsPage: preparePage(pageLoaders.StudentsPage),
} satisfies PageComponents;

export function resetFailedPages() {
  Object.values(lazyPages).forEach((page) => page.resetFailure());
}
