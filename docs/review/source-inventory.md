# Jamaster source parity inventory

Source: `jamasterlms/jamaster-web` at `7810bd1720c57749f6d5249536ba015f2a53694f`. Local: `/workspace/sites/jamaster-workspace-ui`. Inspected 2026-09-09. This is a read-only inventory; no Site files were changed. Local findings describe the files as inspected during this task; the owner may concurrently change them and should re-check before using a gap as a final-state assertion.

The local navigation contains **117 entries and 113 unique targets**. All 113 match source sidebar/catalog/settings-menu targets, with the monthly-meetings URL represented symbolically. All map to source page files: 71 exact page mappings and 42 catalog-validated dynamic report mappings. This confirms route coverage only; **no page is marked complete**. Source menu membership is derived from the pinned sidebar, report catalog and settings sidebar. The recursive Git tree was not truncated (1,654 entries).

`MAPPED_NOT_INSPECTED` means source page contents and local behavior were not compared. `PARTIAL_INSPECTION` means a wrapper/route or subset of content was inspected. `KNOWN_FORM_GAP` and `KNOWN_GAP` identify concrete differences in inspected files. List pages with a form gap do not imply their list/table contents were audited.

Status counts: MAPPED_NOT_INSPECTED: 100, KNOWN_GAP: 5, PARTIAL_INSPECTION: 2, KNOWN_FORM_GAP: 6.

## 113 target mapping

Source paths below are repository-relative and pinned to the source commit above. Local page filenames are in `src/features/`; the JSON contains each full local relative path. The same route is repeated in both columns intentionally to make differences explicit. Date placeholders mean the source computes local-calendar month start/current date at runtime.

| # | Source route | Local route → page | Source page path | Known parity status |
|---|---|---|---|---|
| 1 | `/admin/dashboard` | `/admin/dashboard` → `DashboardPage` | `app/[locale]/(main)/admin/dashboard/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 2 | `/admin/calendar` | `/admin/calendar` → `CalendarPage` | `app/[locale]/(main)/admin/calendar/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 3 | `/admin/calendar/pollings` | `/admin/calendar/pollings` → `CalendarPage` | `app/[locale]/(main)/admin/calendar/pollings/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 4 | `/admin/reports/meetings?startDate=YYYY-MM-01&endDate=YYYY-MM-DD&dateField=meetingDate&meetingDateResultStatus=pending` | `/admin/reports/monthly-meetings` → `MeetingsPage` | `app/[locale]/(main)/admin/reports/meetings/page.tsx` | KNOWN_GAP: Source uses local month-to-date dates, meetingDate and pending filters; local navRoute aliases to monthly-meetings and MeetingsPage initializes an empty date range, dropping those filters. |
| 5 | `/admin/students` | `/admin/students` → `StudentsPage` | `app/[locale]/(main)/admin/students/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 6 | `/admin/students/register` | `/admin/students/register` → `RegistrationPage` | `app/[locale]/(main)/admin/students/register/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 7 | `/admin/students/potential` | `/admin/students/potential` → `StudentsPage` | `app/[locale]/(main)/admin/students/potential/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 8 | `/admin/groups` | `/admin/groups` → `GroupsPage` | `app/[locale]/(main)/admin/groups/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 9 | `/admin/groups/form` | `/admin/groups/form` → `GroupsPage` | `app/[locale]/(main)/admin/groups/form/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 10 | `/admin/teachers` | `/admin/teachers` → `TeachersPage` | `app/[locale]/(main)/admin/teachers/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 11 | `/admin/teachers/form` | `/admin/teachers/form` → `TeachersPage` | `app/[locale]/(main)/admin/teachers/form/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 12 | `/admin/education` | `/admin/education` → `LearningPage` | `app/[locale]/(main)/admin/education/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 13 | `/admin/education/period` | `/admin/education/period` → `LearningPage` | `app/[locale]/(main)/admin/education/period/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 14 | `/admin/program-terms` | `/admin/program-terms` → `LearningPage` | `app/[locale]/(main)/admin/program-terms/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 15 | `/admin/curriculum-units` | `/admin/curriculum-units` → `LearningPage` | `app/[locale]/(main)/admin/curriculum-units/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 16 | `/admin/education-reports` | `/admin/education-reports` → `ReportsPage` | `app/[locale]/(main)/admin/education-reports/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 17 | `/admin/education-reports/meetings` | `/admin/education-reports/meetings` → `MeetingsPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | PARTIAL_INSPECTION: Source dynamic route renders EducationLeafPage for meetings; local routes to shared MeetingsPage. Leaf internals not inspected; semantic parity unverified. |
| 18 | `/admin/education-reports/active-students` | `/admin/education-reports/active-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 19 | `/admin/education-reports/active-unassigned-students` | `/admin/education-reports/active-unassigned-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 20 | `/admin/education-reports/frozen-students` | `/admin/education-reports/frozen-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 21 | `/admin/education-reports/ending-soon-students` | `/admin/education-reports/ending-soon-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 22 | `/admin/education-reports/bonus-used-students` | `/admin/education-reports/bonus-used-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 23 | `/admin/education-reports/bonus-remaining-risk` | `/admin/education-reports/bonus-remaining-risk` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 24 | `/admin/education-reports/education-status-distribution` | `/admin/education-reports/education-status-distribution` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 25 | `/admin/education-reports/attendance-risk-students` | `/admin/education-reports/attendance-risk-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 26 | `/admin/education-reports/attendance-trend` | `/admin/education-reports/attendance-trend` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 27 | `/admin/education-reports/no-attendance-recently` | `/admin/education-reports/no-attendance-recently` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 28 | `/admin/education-reports/group-assignment-load` | `/admin/education-reports/group-assignment-load` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 29 | `/admin/education-reports/group-switch-history` | `/admin/education-reports/group-switch-history` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 30 | `/admin/education-reports/transfer-out-students` | `/admin/education-reports/transfer-out-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 31 | `/admin/education-reports/reactivation-candidates` | `/admin/education-reports/reactivation-candidates` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 32 | `/admin/education-reports/no-meeting-recently` | `/admin/education-reports/no-meeting-recently` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 33 | `/admin/education-reports/low-attendance-high-remaining` | `/admin/education-reports/low-attendance-high-remaining` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 34 | `/admin/education-reports/never-attended-students` | `/admin/education-reports/never-attended-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 35 | `/admin/education-reports/zero-bonus-remaining` | `/admin/education-reports/zero-bonus-remaining` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 36 | `/admin/education-reports/long-freeze-students` | `/admin/education-reports/long-freeze-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 37 | `/admin/education-reports/never-group-assigned` | `/admin/education-reports/never-group-assigned` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 38 | `/admin/education-reports/high-attendance-students` | `/admin/education-reports/high-attendance-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 39 | `/admin/education-reports/meeting-intensive-students` | `/admin/education-reports/meeting-intensive-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 40 | `/admin/education-reports/no-advisor-students` | `/admin/education-reports/no-advisor-students` → `EducationDetailPage` | `app/[locale]/(main)/admin/education-reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 41 | `/admin/expenses` | `/admin/expenses` → `ExpensesPage` | `app/[locale]/(main)/admin/expenses/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 42 | `/admin/expenses/form` | `/admin/expenses/form` → `ExpensesPage` | `app/[locale]/(main)/admin/expenses/form/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 43 | `/admin/pricing` | `/admin/pricing` → `PricingPage` | `app/[locale]/(main)/admin/pricing/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 44 | `/admin/pricing/create` | `/admin/pricing/create` → `PricingPage` | `app/[locale]/(main)/admin/pricing/create/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 45 | `/admin/reports` | `/admin/reports` → `ReportsPage` | `app/[locale]/(main)/admin/reports/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 46 | `/admin/reports/sales` | `/admin/reports/sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/sales/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 47 | `/admin/reports/meetings` | `/admin/reports/meetings` → `MeetingsPage` | `app/[locale]/(main)/admin/reports/meetings/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 48 | `/admin/reports/collections` | `/admin/reports/collections` → `LedgerPage` | `app/[locale]/(main)/admin/reports/collections/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 49 | `/admin/reports/bills` | `/admin/reports/bills` → `LedgerPage` | `app/[locale]/(main)/admin/reports/bills/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 50 | `/admin/reports/overdue-receivables` | `/admin/reports/overdue-receivables` → `LedgerPage` | `app/[locale]/(main)/admin/reports/overdue-receivables/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 51 | `/admin/reports/accounting` | `/admin/reports/accounting` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/accounting/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 52 | `/admin/reports/sales-by-advisor` | `/admin/reports/sales-by-advisor` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 53 | `/admin/reports/conversion-funnel` | `/admin/reports/conversion-funnel` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 54 | `/admin/reports/payment-method-performance` | `/admin/reports/payment-method-performance` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 55 | `/admin/reports/installment-risk` | `/admin/reports/installment-risk` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 56 | `/admin/reports/discount-impact` | `/admin/reports/discount-impact` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 57 | `/admin/reports/high-discount-sales` | `/admin/reports/high-discount-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 58 | `/admin/reports/unpaid-balance-heavy` | `/admin/reports/unpaid-balance-heavy` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 59 | `/admin/reports/pending-sales` | `/admin/reports/pending-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 60 | `/admin/reports/completed-sales` | `/admin/reports/completed-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 61 | `/admin/reports/cancelled-sales` | `/admin/reports/cancelled-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 62 | `/admin/reports/refunded-sales` | `/admin/reports/refunded-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 63 | `/admin/reports/no-discount-sales` | `/admin/reports/no-discount-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 64 | `/admin/reports/expiring-soon-sales` | `/admin/reports/expiring-soon-sales` → `LedgerPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 65 | `/admin/reports/advisor-revenue-risk` | `/admin/reports/advisor-revenue-risk` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 66 | `/admin/reports/cancellation-refund-analysis` | `/admin/reports/cancellation-refund-analysis` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 67 | `/admin/reports/pricing-package-performance` | `/admin/reports/pricing-package-performance` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 68 | `/admin/reports/revenue-forecast-trend` | `/admin/reports/revenue-forecast-trend` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 69 | `/admin/reports/contract-expiry-revenue-risk` | `/admin/reports/contract-expiry-revenue-risk` → `FinanceAnalysisPage` | `app/[locale]/(main)/admin/reports/[reportKey]/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 70 | `/admin/sms` | `/admin/sms` → `CommunicationsPage` | `app/[locale]/(main)/admin/sms/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 71 | `/admin/sms/create` | `/admin/sms/create` → `CommunicationsPage` | `app/[locale]/(main)/admin/sms/create/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 72 | `/admin/sms/templates` | `/admin/sms/templates` → `CommunicationsPage` | `app/[locale]/(main)/admin/sms/templates/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 73 | `/admin/email` | `/admin/email` → `CommunicationsPage` | `app/[locale]/(main)/admin/email/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 74 | `/admin/email/create` | `/admin/email/create` → `CommunicationsPage` | `app/[locale]/(main)/admin/email/create/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 75 | `/admin/email/templates` | `/admin/email/templates` → `CommunicationsPage` | `app/[locale]/(main)/admin/email/templates/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 76 | `/admin/email/templates/create` | `/admin/email/templates/create` → `CommunicationsPage` | `app/[locale]/(main)/admin/email/templates/create/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 77 | `/admin/whatsapp` | `/admin/whatsapp` → `CommunicationsPage` | `app/[locale]/(main)/admin/whatsapp/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 78 | `/admin/whatsapp/create` | `/admin/whatsapp/create` → `CommunicationsPage` | `app/[locale]/(main)/admin/whatsapp/create/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 79 | `/admin/whatsapp/templates` | `/admin/whatsapp/templates` → `CommunicationsPage` | `app/[locale]/(main)/admin/whatsapp/templates/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 80 | `/admin/announcements` | `/admin/announcements` → `AnnouncementsPage` | `app/[locale]/(main)/admin/announcements/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 81 | `/admin/payments` | `/admin/payments` → `PaymentsPage` | `app/[locale]/(main)/admin/payments/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 82 | `/admin/payments?tab=history` | `/admin/payments?tab=history` → `PaymentsPage` | `app/[locale]/(main)/admin/payments/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 83 | `/admin/payments/installments` | `/admin/payments/installments` → `LedgerPage` | `app/[locale]/(main)/admin/payments/installments/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 84 | `/admin/verification-requests` | `/admin/verification-requests` → `VerificationPage` | `app/[locale]/(main)/admin/verification-requests/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 85 | `/admin/verification-requests/installments` | `/admin/verification-requests/installments` → `VerificationPage` | `app/[locale]/(main)/admin/verification-requests/installments/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 86 | `/admin/verification-requests/meetings` | `/admin/verification-requests/meetings` → `VerificationPage` | `app/[locale]/(main)/admin/verification-requests/meetings/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 87 | `/admin/staff` | `/admin/staff` → `TeamPage` | `app/[locale]/(main)/admin/staff/page.tsx` | KNOWN_FORM_GAP: List/table parity uninspected. Inspected shared create/edit dialog lacks required email/phone/password, branch permissions and salary fields; wrong status options. |
| 88 | `/admin/staff/form` | `/admin/staff/form` → `TeamPage` | `app/[locale]/(main)/admin/staff/form/page.tsx` | KNOWN_FORM_GAP: Local generic TeamPage dialog lacks required email/phone/password, branch permissions and salary contract; ignores source staffId edit query. |
| 89 | `/admin/contracts` | `/admin/contracts` → `ContractsPage` | `app/[locale]/(main)/admin/contracts/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 90 | `/admin/contracts/form` | `/admin/contracts/form` → `ContractsPage` | `app/[locale]/(main)/admin/contracts/form/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 91 | `/admin/automations` | `/admin/automations` → `AutomationsPage` | `app/[locale]/(main)/admin/automations/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 92 | `/admin/automations/create` | `/admin/automations/create` → `AutomationsPage` | `app/[locale]/(main)/admin/automations/create/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 93 | `/admin/settings` | `/admin/settings` → `SettingsPage` | `app/[locale]/(main)/admin/settings/page.tsx` | PARTIAL_INSPECTION: Source redirects to /admin/settings/general; local displays general in place. See general-settings contract; no end-to-end parity claim. |
| 94 | `/admin/settings/general` | `/admin/settings/general` → `SettingsPage` | `app/[locale]/(main)/admin/settings/general/page.tsx` | KNOWN_GAP: Core visible fields overlap; local currency marked required though source optional, source data is branch-scoped, local model keys/defaults differ. Save/data parity unverified. |
| 95 | `/admin/settings/bank` | `/admin/settings/bank` → `SettingsPage` | `app/[locale]/(main)/admin/settings/bank/page.tsx` | KNOWN_GAP: Singleton local settings omit source multiple-account tabs/new/delete; currency default/options and isActive default differ; local adds IBAN checksum validation. |
| 96 | `/admin/settings/sms` | `/admin/settings/sms` → `SettingsPage` | `app/[locale]/(main)/admin/settings/sms/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 97 | `/admin/settings/email` | `/admin/settings/email` → `SettingsPage` | `app/[locale]/(main)/admin/settings/email/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 98 | `/admin/settings/whatsapp` | `/admin/settings/whatsapp` → `SettingsPage` | `app/[locale]/(main)/admin/settings/whatsapp/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 99 | `/admin/settings/payment` | `/admin/settings/payment` → `SettingsPage` | `app/[locale]/(main)/admin/settings/payment/page.tsx` | KNOWN_GAP: Source iyzico form requires sandbox/live mode and keys; local omits mode, adds unrelated payment preferences, disables provider persistence/test. |
| 100 | `/admin/settings/integrations` | `/admin/settings/integrations` → `SettingsPage` | `app/[locale]/(main)/admin/settings/integrations/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 101 | `/admin/support` | `/admin/support` → `SupportPage` | `app/[locale]/(main)/admin/support/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 102 | `/super/billing` | `/super/billing` → `PaymentsPage` | `app/[locale]/(main)/super/billing/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 103 | `/super/billing/history` | `/super/billing/history` → `PaymentsPage` | `app/[locale]/(main)/super/billing/history/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 104 | `/super/billing/cards` | `/super/billing/cards` → `PaymentsPage` | `app/[locale]/(main)/super/billing/cards/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 105 | `/super/branches` | `/super/branches` → `TeamPage` | `app/[locale]/(main)/super/branches/page.tsx` | KNOWN_FORM_GAP: List/table parity uninspected. Inspected generic branch dialog substitutes city/authority for source address/billing/settings contract and makes email/phone optional. |
| 106 | `/super/branches/form` | `/super/branches/form` → `TeamPage` | `app/[locale]/(main)/super/branches/form/page.tsx` | KNOWN_FORM_GAP: Missing source address, monthlyPayment, paymentDay, paymentCurrency, description, website, settings, paymentDetails; wrong statuses; source id edit query unsupported. |
| 107 | `/super/branches/payments` | `/super/branches/payments` → `LedgerPage` | `app/[locale]/(main)/super/branches/payments/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 108 | `/super/users` | `/super/users` → `TeamPage` | `app/[locale]/(main)/super/users/page.tsx` | KNOWN_FORM_GAP: List/table parity uninspected. Inspected create/edit dialog lacks required phone/password, accessible branches and branch permissions; wrong status options. |
| 109 | `/super/users/form` | `/super/users/form` → `TeamPage` | `app/[locale]/(main)/super/users/form/page.tsx` | KNOWN_FORM_GAP: Local TeamPage dialog lacks phone/password/access/permissions contract and source id edit query; source super-user page hides salary controls. |
| 110 | `/super/expenses` | `/super/expenses` → `ExpensesPage` | `app/[locale]/(main)/super/expenses/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 111 | `/super/expenses/form` | `/super/expenses/form` → `ExpensesPage` | `app/[locale]/(main)/super/expenses/form/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 112 | `/super/files` | `/super/files` → `FilesPage` | `app/[locale]/(main)/super/files/page.tsx` | MAPPED_NOT_INSPECTED: Menu target and source route existence confirmed; page contents, controls, data and behavior not compared. |
| 113 | `/super/settings` | `/super/settings` → `SettingsPage` | `app/[locale]/(main)/super/settings/page.tsx` | KNOWN_GAP: Source tenant-scoped general/level/iyzico/mutlucell/whatsapp/email tabs; local SettingsPage resolves to branch general and does not select those source tabs. |

## Navigation differences beyond the 113-target count

The source puts the seven branch-setting destinations in a settings-only sidebar; local navigation.json nests them under the main Ayarlar item. Source settings mode is scoped separately to account, branch and super admin. Source account links and five additional super tabs are absent from the 113-target navigation.json inventory (this does not imply that a basic account link is absent elsewhere in local UI):

- `/user/account`
- `/user/account?tab=preferences`
- `/user/account?tab=notifications`
- `/user/account?tab=cards`
- `/user/notifications`
- `/super/settings?tab=level`
- `/super/settings?tab=iyzico`
- `/super/settings?tab=mutlucell`
- `/super/settings?tab=whatsapp`
- `/super/settings?tab=email`

Source references: `app/[locale]/(main)/_components/sidebar/sidebar-data.ts`, `app/[locale]/(main)/_components/sidebar/sidebar-settings-nav.tsx`, `hooks/main/report/report-catalog.ts`. Local references: `src/data/navigation.json`, `src/data/navigation.ts`, `src/components/layout/app-sidebar.tsx`, `src/app/page-router.tsx`.

Source monthly-meetings filter contract: `startDate` local first day of month, `endDate` local current day, `dateField=meetingDate`, `meetingDateResultStatus=pending`. Local `navRoute` returns `admin/reports/monthly-meetings` whenever the URL contains `startDate=`. Inspected `MeetingsPage` has empty initial date range, no query parameter reads, and filters historical meeting records by `createdAt` date. This is a demonstrated filter gap.

## Staff and user form contracts

Pinned source: `components/forms/super/user-form.tsx`; wrappers `app/[locale]/(main)/admin/staff/form/page.tsx` and `app/[locale]/(main)/super/users/form/page.tsx`. Local comparison: `src/features/administration/team-page.tsx`.

Required below means the inspected Zod schema rejects omission/invalid value. Defaults describe create-mode initialization and do not make a field schema-optional. String `min` rules do not trim the value in the source schema.

| Field | Source requirement / validation | Source default and condition | Observed local gap |
|---|---|---|---|
| `name` | Required string, minimum 1 character | `''` | Local trims and requires at least 2; visible field exists. |
| `email` | Required valid email | `''` | Local staff email optional; user email is required but overloaded into `contact`. |
| `phone` | Required string, minimum 1 character; rendered PhoneInput | `''` | Local phone optional for both. Source schema does not itself demand a particular digit count. |
| `password` create | Required string, minimum 6 characters | Shared UserForm generates a password when `initialData` absent. Super users create uses that default. Staff wrapper passes explicit initialData with blank password, so staff create starts blank. Generate button available. | Field and generation absent. |
| `password` edit | Optional; blank allowed; otherwise minimum 6 | `''`; shared handler removes falsy password; super wrapper additionally removes whitespace-only password | No password edit field. |
| `status` | Optional enum `ACTIVE`, `INACTIVE`, `BLOCKED` | Create `ACTIVE`; wrappers fall back to ACTIVE during create submission | Local uses Aktif/Pasif/İzinli and marks field required; BLOCKED unavailable, İzinli not source enum. |
| `accessibleBranches` | Required string array, minimum 1 item | Shared/super create `[]`; staff create `[branch.id]`; edit from existing permissions or salary branch | Local has a text branch for staff and no accessible-branch selection for users. |
| `branchPermissions` | Optional array of `{branchId: string, permissions: string[], isManager?: boolean}`; no minimum permission count | `[]` | Entire permission model absent; a required local job-title selector is not an equivalent source field. |
| `staffSalary` | Optional object; each child optional | Shared default populated; staff visible; super user wrapper sets `canEditSalary={false}` | Staff salary section absent. Do not add salary controls to the super-user page merely because the shared component supports them. |
| `staffSalary.salaryType` | Optional enum `WEEKLY`, `MONTHLY` | `MONTHLY` | Missing. |
| `staffSalary.baseAmount` | Optional number, minimum 0 | `0`; blank numeric input becomes undefined | Missing. |
| `staffSalary.commissionRate` | Optional number, 0–100 | UI `0`; step 0.01; blank becomes undefined; staff wrapper divides by 100 on write and multiplies persisted rate by 100 on edit | Missing. |
| `staffSalary.paymentDay` | Optional integer, 1–31 | `1`; blank becomes undefined | Missing. |
| `staffSalary.commissionBasis` | Optional enum `COLLECTION`, `TURNOVER` | `COLLECTION`; control displays COLLECTION for missing value | Missing. |

Permission conditions:

- Each accessible branch has its own tab. Unchecking an accessible branch also removes its branchPermissions entry.
- `isManager=true` grants every listed resource/action permission. Turning manager off clears that branch's permission list.
- Non-manager controls support permission sets, category selection and individual resource/actions. Adding any non-VIEW permission automatically adds that resource's VIEW permission. The normalizer re-adds VIEW while related actions remain selected.
- Permission-request context can auto-select a requested permission and add its target branch to accessibleBranches; requested permission is highlighted. The source handles PENDING request alerts. Permission-set definitions are referenced in `lib/constant` but their full contents were not inspected in this bounded task.
- `canEditSalary` defaults true in UserForm. Super users explicitly pass false. The shared schema/defaults still contain the optional staffSalary object; the wrapper hiding salary is not itself a schema transformation.

Staff wrapper behavior:

- Edit route is `/admin/staff/form?staffId=<id>`; source loads that staff record. Local create detection opens a blank dialog and does not consume this query.
- The wrapper requires branch context and uses `staff.salaryBranchId || branch.id`. `ensureSalaryBranch` must return ok, must not have switched, and a target branch ID must exist before submit.
- Submission forces `accessibleBranches` to the target salary branch and maps each branchPermissions entry to that branch ID. Create includes status fallback ACTIVE. Update sends name/email/phone/status/staffSalary/password/branchPermissions; it does not send accessibleBranches in the final update payload.
- Successful create/update returns to `/admin/staff`.

Super-user wrapper behavior:

- Edit route is `/super/users/form?id=<id>` plus optional branchId/permissionTitle/permissionLabel context. Source loads user, permission request and all branches. Local generic form ignores source id/permission query contract.
- Form unavailable when there are no branches; deleted users are not editable.
- Edit may enforce salary-branch context for the requested user/permission, though salary controls are hidden.
- A server payment-card guard error opens PaymentCardGuardDialog and allows retrying the preserved submission after cards are cleared.
- Successful create/update opens `/super/users/<returned-id>`.

## Super branch form contract

Pinned source: `components/forms/super/branch-form.tsx`, `app/[locale]/(main)/super/branches/form/page.tsx`. Local comparison: branch mode of `src/features/administration/team-page.tsx`.

| Field | Source requirement / validation | Source default / UI condition | Observed local gap |
|---|---|---|---|
| `name` | Required string min 1 | `''` | Present; local min 2 differs. |
| `description` | Optional string | `''`, text input | Missing. |
| `address` | Required string min 1 | `''`, textarea | Missing; required city field is not equivalent. |
| `monthlyPayment` | Required number, minimum 0 | `0`; numeric input parseFloat; wrapper submits decimal string | Missing. |
| `paymentDay` | Required number 1–31; schema does not specify `.int()` | `1`; UI parseInt; wrapper fallback 1 | Missing. |
| `paymentCurrency` | Optional string | `TRY`; choices TRY/USD/EUR; wrapper fallback TRY | Missing. |
| `email` | Required valid email | `''` | Optional locally. |
| `phone` | Required string min 1 | `''`; PhoneInput defaultCountry TR | Optional locally. |
| `website` | Optional string that must be a valid URL when supplied | Default `''`, URL input | Missing. Source inconsistency: `z.string().url().optional()` rejects the default empty string; report as a source validation quirk, not as an intentionally required website field. |
| `status` | Required enum `ACTIVE`, `INACTIVE`, `SUSPENDED`, `CLOSED` | `ACTIVE` | Local Aktif/Pasif/İzinli omits suspended/closed and adds non-source option. |
| `paymentDetails` | Optional string | `''`; rich text Editor | Missing. |
| `settings` | Optional object; when present currency and language are strings | `{currency:'TRY',language:'tr'}` | Missing. |
| `settings.currency` | String in provided settings object; schema no enum/min | UI TRY/USD/EUR/GBP | Missing. |
| `settings.language` | String in provided settings object; schema no enum/min | UI tr/en, default tr | Missing. |
| `isActive` | Required boolean | `true`; preserved from existing `isActive ?? true`; no visible source form control | Local status is not this flag. |

The source groups fields as general information, contact information, payment information, settings, and payment details. Local branch dialog has name/city/branch authority/status plus optional phone/email. `city` and branch authority are not present in this source BranchForm schema.

Source edit route is `/super/branches/form?id=<id>`. Create/update selects the API operation by id, serializes monthlyPayment to string, defaults paymentDay/paymentCurrency/settings as above, and returns to `/super/branches`. Cancel also returns to the list. Local branch create/edit dialog ignores this source query route and does not retain the source contract fields.

Do not confuse this form with `components/settings/branch-form.tsx`, a separate setup component. That setup form requires name/address/monthlyPayment as nonempty strings, valid email and nonempty phone; it supplies paymentDay=1, status=ACTIVE, isActive=true. The `/super/branches/form` route imports the richer super form, not the setup component.

## Bank settings contract

Pinned source: `app/[locale]/(main)/admin/settings/bank/_components/bank-form.tsx` and `bank-settings.tsx`. Local comparison: `src/features/settings/settings-model.ts` and `settings-page.tsx`.

| Field | Source requirement / validation | Source default / UI condition | Observed local gap |
|---|---|---|---|
| `id` | Optional string | Present for saved accounts | Local has no account records/IDs. |
| `bankName` | Required string min 2 | `''` | Local key `bank`, min 2; UI overlaps. |
| `accountHolder` | Required string min 2 | `''` | Present, min 2. |
| `accountNumber` | Required string min 5 | `''` | Present, min 5. |
| `iban` | String key required by schema, but empty string valid; no pattern/checksum validation | `''` | Local optional field but rejects newly changed nonempty invalid checksum; this is stronger validation than source. |
| `currency` | Required string min 1 | New account `''`; user must choose TRY/USD/EUR/GBP | Local `bankCurrency` auto-defaults TRY and offers JPY/CNY additionally. |
| `isDefault` | Required boolean | false; existing missing value also false; visible checkbox | Local equivalent false default. |
| `isActive` | Required boolean | true; existing missing value also true; no visible BankForm control | Local visible active switch defaults false unless stored. |

BankSettings is a branch-scoped multiple-account editor, not one global bank record. It reads explicit branchId before branch-context ID; `all` becomes empty and cannot submit. Existing account tabs are ordered by source array index. Initial active account is the first marked default, otherwise index 0; no accounts selects the new tab. A plus tab creates another account. Changing bank prop resets the form. Saved accounts show a delete action and confirmation dialog; delete requires both branch ID and account ID. Create/update similarly blocks when branch ID is missing. Local singleton `state.settings` cannot represent these account tabs, record identity, creation or deletion.

## iyzico provider contract

Pinned source: `components/settings/iyzico-settings-form.tsx`, `hooks/main/super/super-setting.ts`, `app/[locale]/(main)/admin/settings/payment/page.tsx`, `app/[locale]/(main)/super/settings/page.tsx`. Local comparison: `src/features/settings/integration-settings.tsx` and `settings-page.tsx`.

| Field | Source requirement / validation | Default / condition | Observed local gap |
|---|---|---|---|
| `mode` | Required boolean | false = sandbox, true = live; initial true only for stored URL exactly `https://api.iyzipay.com` | Missing toggle/state. |
| `clientKey` | Required string min 1 | `''`; plain input; disabled while pending; autoComplete off | Present as masked input; no submission or schema enforcement. |
| `secretKey` | Required string min 1 | `''`; password with visibility toggle; disabled while pending | Present, but no submission/schema enforcement. |
| `url` | Derived outbound setting, not user-editable | false → `https://sandbox-api.iyzipay.com`, true → `https://api.iyzipay.com` | Missing mode-to-URL contract. |

The exact form submit payload is `{...values, url}`, so it includes the form `mode` plus derived URL and keys even though the hook's IyzicoSettings type lists url/clientKey/secretKey. No key-length rule beyond min 1 or trimming is present in the inspected schema.

The provider defaults to tenant scope. `/admin/settings/payment` supplies `scope="branch"` and the settings branch ID; `/super/settings?tab=iyzico` uses default tenant scope. Branch query reads the response's `.settings` only (not `.effectiveSettings`) for initial fields, preventing inherited tenant settings being silently edited as branch values. Query cache key includes scope and branchId. Read/write endpoints are `/admin/system-settings/iyzico` for branch scope and `/super/system-settings/iyzico` for tenant scope. Update uses POST. The branch ID is not an explicit request-body field in this hook; active API branch context is outside the inspected hook.

`hidePaymentForBranch=true` with branch scope returns null, but the inspected branch payment page does not set it. Setup mode changes layout/button text and invokes onComplete only after success. Source displays loading skeleton, read errors, a configuration guide, and an active save button disabled only while pending. No source connection-test button is present. Local keys are transient component state and both save/test buttons are disabled; therefore local provider UI is incomplete and must not be reported as connected. Local payment preferences (installment count, reminder days, method switches) are not controls from this source payment route.

## General branch settings subset

Pinned source: `app/[locale]/(main)/admin/settings/general/_components/company-form.tsx` and `company-setting.tsx`.

| Field | Source requirement | Default |
|---|---|---|
| `companyName` | Required string min 2 | `''` |
| `address` | Required string min 5 | `''` |
| `phone` | Required string min 10 | `''` |
| `email` | Required valid email | `''` |
| `taxNumber` | Optional string | `''` |
| `logoWhite`, `logoBlack` | Optional nullable strings | `''`; component image state null when absent; submit uses empty strings |
| `currency` | Optional string | TRY; submit fallback TRY |

CompanySettings reads/upserts company information by branchId and blocks submit if absent. `/admin/settings` redirects to `/admin/settings/general`; the local page displays its general form directly. Local fields broadly overlap but rename companyName to branchName, use different field/storage contracts, label currency required, and add a notification toggle not in this source CompanyForm. No claim is made that its backend save, logos, contact normalization, or branch changes have been functionally tested.

## Review limits and artifacts

- Source content inspected: sidebar data/settings menu, report catalog and two dynamic route wrappers; staff/user/branch form components and route wrappers; bank forms/container; iyzico component/hook/payment route/super settings route; branch company form/container; separate branch setup form.
- Other source page paths in the table are verified by the complete pinned Git tree. Their form controls, table columns, charts, data queries and workflows were not inspected and are explicitly not complete.
- Local files inspected: navigation JSON/helpers, page router/app routing call, sidebar, TeamPage, SettingsPage/settings-model/IntegrationSettings, MeetingsPage. There was no browser testing or test execution in this read-only research task.
- Source snapshots live under this research directory, preserving full content for the owner. `source-tree.json` holds source paths/SHAs; `route-inventory.json` holds the 113 records and statuses. `build_inventory.py` regenerates the report and asserts source/local target set equality. It reads the changing local navigation, so rerunning it after navigation edits requires reviewing assertions and conclusions.
- No Site changes, Sites tools, commits, push, or subagents were used.
