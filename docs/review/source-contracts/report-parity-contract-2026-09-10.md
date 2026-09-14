> Kaynak araştırma kaydıdır. Başlangıçtaki eksik listesi sonraki implementasyonla değişmiştir; güncel durum `../completion-2026-09-10.md` içindedir.

# Report parity contract — 2026-09-10

Pinned source: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Read-only comparison of source education/finance report definitions with local `src/features/insights/{education-detail-page.tsx,report-model.ts}`, `src/features/finance/{ledger-page.tsx,financial-ledger.tsx,finance-analysis-page.tsx,finance-model.ts}`, models and routing. `ledger-page.tsx` re-exports `LedgerPage` from `financial-ledger.tsx`; its other content is subscription payments, not finance reports.

## Immediate implementation priorities

1. Use one typed definition for each source slug: exact columns, summary keys, filters, default sort, chart unit. All **24 education leaves** have per-student tables and all **18 sales leaves** have aggregate tables, plus distribution and trend. Current 3 education aggregate routes omit student tables; FinanceAnalysisPage has charts only, while other sales leaf routes use transaction-ledger columns.
2. Add source URL filters (below), applying one filtered cohort to rows, summaries, charts and export before pagination. Local education currently has only session-persisted search; finance analysis only an all/month selector; ledger only reads URL status, using Turkish settlement labels rather than source lifecycle enum.
3. Populate locally known report columns (student/email/advisor, membership count, recorded attendance/meetings, receipts/balances); show unknown fields as unavailable/null. Add aggregate sale count/revenue/balance per advisor/package/payment type without pretending server risk or cohort definitions are known.
4. Preserve honest unavailable states for source-derived cohorts lacking history. Do not undo fixes described next.

## Corrections to older review documents

`docs/review/{education-reports,finance-reports}.md` contains valid source mappings but stale implementation findings. Current local code already:

- Handles no-advisor-students.
- Uses memberships for active-unassigned and hasHistory for never-group-assigned.
- Routes education-reports/meetings to EducationDetailPage, not MeetingsPage.
- Marks missing finance lifecycle/risk/expiry reports unavailable instead of silently showing all sales.
- Filters no-discount-sales by local discount===0.
- Uses `!data.length` rather than `!max` for finance empty-state detection.
  Remaining code still incorrectly selects “no attendance recently” using **any absence** in 30 days, and reactivation-candidates only from Geçmiş; source describes no participation signal, and frozen-or-expired respectively.

## Exact shared query contracts

| Family                   | Filters                                                                                    | Sort choices/default                                                                         | Date default                              |
| ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Education leaves         | search:string; status:string[]; optionally startDate/endDate                               | createdAt:desc (default), createdAt:asc, daysToEnd:asc, attendanceRate:desc, paidAmount:desc | Month-to-date only where marked Yes below |
| Sales leaves             | search:string; startDate/endDate; status:string[]; paymentType:string[]                    | totalRevenue:desc, totalSales:desc, totalRemaining:desc, riskCount:desc                      | Month-to-date for all 18                  |
| Sales risk sort override | installment-risk, unpaid-balance-heavy, advisor-revenue-risk, contract-expiry-revenue-risk | totalRemaining:desc default                                                                  | Same                                      |

Source UI `sortOrder` is only a control key; actual URL/API keys are **sort + order**. Multiselect uses repeated keys: `?status=active&status=frozen`, not JSON/comma lists. Empty/all options omit the filter; selecting all real options also collapses to all. page=1,limit=10 defaults. Start/end serialize local day start/day end to ISO in `lib/query.ts`. Source date-field/cohort semantics live on the server and cannot be recovered from the filter controls.

Education status options: active, frozen, expired, pending, completed. Sales status options: pending, completed, cancelled, refunded. These are separate domains. Payment type options: CASH, BANK_TRANSFER, CREDIT_CARD_SINGLE, IYZICO, PROMISSORY_NOTE. Local adapter can map Nakit→CASH, Havale / EFT→BANK_TRANSFER, Kredi kartı→CREDIT_CARD_SINGLE only where the underlying record actually has that value. Keep missing method unknown; no IYZICO/PROMISSORY_NOTE records currently exist.

API table `/admin/{education-reports|reports}/{slug}`, chart `/admin/{namespace}/{slug}-chart`; chart params omit page/limit. Table response `{data,page,limit,totalPages,totalItems}`; chart `{summary:Record<string,number>,distribution:{label,value}[],trend:{period,value}[]}`. Charts/summary cover filtered dataset, never only visible page. All support CSV, JSON, Excel export.

## Education column families (exact ordered fields)

All append student-detail action `/admin/students/:studentId`. Student cell displays studentName + studentEmail. Labels follow source `messages/tr/admin/reports.json`.

| Family            | Ordered data fields                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Ops               | studentName, advisorName, educationStatus, activeGroupCount, paidAmount, lastAttendanceAt       |
| Frozen            | studentName, advisorName, educationStatus, lastFreezeStart, lastFreezeEnd, remainingAmount      |
| End               | studentName, educationStatus, endDate, daysToEnd, lastFreezeStart, lastFreezeEnd, paidAmount    |
| Bonus             | studentName, usedBonusCount, remainingBonusCount, educationStatus, paidAmount, advisorName      |
| Status            | studentName, educationStatus, advisorName, activeGroupCount, paidAmount                         |
| Attendance        | studentName, attendanceRate, lastAttendanceAt, lastMeetingAt, activeGroupCount, paidAmount      |
| AttendanceBalance | studentName, attendanceRate, lastAttendanceAt, lastMeetingAt, activeGroupCount, remainingAmount |
| Group             | studentName, activeGroupCount, groupSwitchCount, advisorName, educationStatus                   |
| Transfer          | studentName, transferredAt, meetingCount, advisorName, saleStatus                               |
| Meeting           | studentName, lastMeetingAt, meetingCount, advisorName, saleStatus                               |
| Meetings          | studentName, advisorName, saleStatus, meetingCount, lastMeetingAt                               |

Summary A = totalStudents,activeStudents,frozenStudents,noGroupStudents.
Summary B = totalStudents,activeStudents,avgAttendanceRate,noGroupStudents.
All education chartLabelType=count, including attendance-trend; source chart series/buckets are supplied by API, so the current local attendance-rate line is useful local analysis but not source-equivalent count data.

| Slug                          | Family            | Date | Summary | Current computable/unknown distinction                                            |
| ----------------------------- | ----------------- | ---- | ------- | --------------------------------------------------------------------------------- |
| meetings                      | Meetings          | Yes  | A       | Meetings/advisor available; sale lifecycle unavailable                            |
| active-students               | Ops               | No   | A       | Local active status, memberships, receipts, attendance available                  |
| active-unassigned-students    | Ops               | No   | A       | Membership test implemented; use active IDs, preserve unresolved imports          |
| frozen-students               | Frozen            | No   | A       | Status known; active freeze intervals unavailable                                 |
| ending-soon-students          | End               | Yes  | A       | Enrollment end/freeze/soon threshold unavailable                                  |
| bonus-used-students           | Bonus             | Yes  | A       | Bonus entitlement/usage ledger unavailable                                        |
| bonus-remaining-risk          | Bonus             | Yes  | A       | Bonus ledger and risk cutoff unavailable                                          |
| education-status-distribution | Status            | No   | A       | Add student table; current bars must obey filters                                 |
| attendance-risk-students      | Attendance        | Yes  | B       | Recorded measures known; current <90 threshold is local                           |
| attendance-trend              | Attendance        | Yes  | B       | Add student table; current chart uses % vs source count                           |
| no-attendance-recently        | Attendance        | Yes  | B       | Fix any-absence predicate; recency window is local                                |
| group-assignment-load         | Group             | No   | A       | Active membership counts known; add student table                                 |
| group-switch-history          | Group             | No   | A       | Local membership events now exist; true switch counting still undefined           |
| transfer-out-students         | Transfer          | Yes  | A       | Group removals are not branch/student transfer-out events                         |
| reactivation-candidates       | End               | Yes  | A       | Frozen local students computable; expired/end dates unproven                      |
| no-meeting-recently           | Meeting           | Yes  | A       | Recorded meetings known; current 30-day cutoff is local                           |
| low-attendance-high-remaining | AttendanceBalance | Yes  | B       | Attendance and monetary balance known; two cutoffs unknown                        |
| never-attended-students       | Attendance        | Yes  | B       | Current zero observed rate excludes no-record students; source ambiguity          |
| zero-bonus-remaining          | Bonus             | Yes  | A       | Missing bonus data must not become zero                                           |
| long-freeze-students          | End               | Yes  | A       | Freeze duration/start/end and threshold unavailable                               |
| never-group-assigned          | Group             | No   | A       | hasHistory implemented; “no known history” differs from complete lifetime history |
| high-attendance-students      | Attendance        | Yes  | B       | Current >=94 threshold is local                                                   |
| meeting-intensive-students    | Meeting           | Yes  | A       | Current >=3 meetings/30 days is local                                             |
| no-advisor-students           | Ops               | No   | A       | Missing advisor directly available; now implemented                               |

### Minimal local projection

Source `EducationLeafRow` has numeric fields non-null, but local data is incomplete: use nullable measures in the local projection instead of manufacturing zero. Retain studentId and the raw student object separately for detail presentation.

- Identity: studentId=String(Student.id), studentName=name, studentEmail=email, advisorName=advisor-or-null.
- educationStatus: explicit mapping only for unambiguous stored states (Aktif→active, Dondurulmuş→frozen). Geçmiş does not uniquely mean expired/completed. Student.payment is never saleStatus.
- activeGroupCount: unique active groupId memberships. `useMemberships.records.memberships` is now available. Unknown legacy names in records.unresolved must not falsely count as unassigned; report coverage separately.
- groupSwitchCount: cannot use `history.length` blindly: local GroupTransfer records are separate additions/removals and legacy memberships lack initial dates. Define recorded add/remove events or await exact backend metric.
- paidAmount: sum recorded linked Receipt.amount for student; remainingAmount: sum saleBalance for linked sales; listAmount cannot safely be reconstructed from net Sale.amount and one “extra discount” percent.
- attendanceRate: 100×present/(present+absent), null when no marks. Existing attendanceStats rounds integer; compute one decimal for source formatting if desired. lastAttendanceAt = latest **present** session date, not updatedAt/absence date. Local data gives date, not precise attendance instant.
- meetingCount and lastMeetingAt: count/latest linked Meeting.createdAt (source backend time basis unknown). Apply explicit local reporting window consistently.
- startDate/endDate/daysToEnd/hasActiveFreeze/lastFreezeStart/lastFreezeEnd/usedBonusCount/remainingBonusCount/transferredAt: unavailable unless genuine records are added.
- createdAt sort: Student.date is local record date, not proven enrollment start. Name the adapter's time basis explicitly and exclude undated legacy rows from date-filtered calculations.

Summary keys should be omitted when unknown. avgAttendanceRate should average known rates only. Source noGroupStudents means active membership absence, not Student.group string. Local charts may group known cohort by state/advisor/active membership count, but title those as local recorded measures until source series definitions exist.

## Finance leaf matrix (exact ordered fields)

Row shape: `SalesLeafRow={label,totalSales,totalRevenue,totalRemaining,riskCount,conversionRate}`.
Abbreviations S=totalSales,R=totalRevenue,B=totalRemaining,K=riskCount,C=conversionRate.
Summary X=totalRows,totalSales,totalRevenue,totalRemaining; Y=X,totalRisk; Z=totalRows,totalSales,totalRemaining,totalRisk; W=totalRows,totalSales,totalRevenue,totalRisk.
Every row begins `label` (header in second column below). No student-detail action belongs in these aggregate tables.

| Slug                         | Label header    | Remaining ordered fields           | Summary | Chart unit |
| ---------------------------- | --------------- | ---------------------------------- | ------- | ---------- |
| sales-by-advisor             | Danışman        | S,R,B,K                            | Y       | money      |
| conversion-funnel            | Aşama           | S (Adet),C                         | W       | count      |
| payment-method-performance   | Ödeme Tipi      | S,R,B                              | X       | money      |
| installment-risk             | Danışman        | S (Riskli Satış),K (Toplam Risk),B | Z       | money      |
| discount-impact              | Danışman        | S,R,B                              | X       | money      |
| high-discount-sales          | Danışman        | S,R,B                              | X       | money      |
| unpaid-balance-heavy         | Paket           | S,R,B,K                            | X       | money      |
| pending-sales                | Grup            | S,R,B                              | X       | money      |
| completed-sales              | Grup            | S,R,B                              | X       | money      |
| cancelled-sales              | Grup            | S,R,B                              | X       | money      |
| refunded-sales               | Grup            | S,R,B                              | X       | money      |
| no-discount-sales            | Grup            | S,R,B                              | X       | money      |
| expiring-soon-sales          | Grup            | S,R,B,K                            | Y       | money      |
| advisor-revenue-risk         | Danışman        | S,R,B,K                            | Y       | money      |
| cancellation-refund-analysis | Durum           | S,R (Ciro Etkisi)                  | W       | money      |
| pricing-package-performance  | Paket           | S,R,B,K                            | X       | money      |
| revenue-forecast-trend       | Grup            | S,R,B                              | X       | money      |
| contract-expiry-revenue-risk | Bitiş Penceresi | S,B (Risk Altındaki Kalan Tutar)   | Z       | money      |

Rows totalRows means aggregate row count, not raw sales count; source K and summary totalRisk are distinct aliases. Missing K/C must remain unknown, not fabricated.

### Computable finance improvements vs unknown metrics

- Advisor/package sales: current data supports sale count, recorded Sale.amount sum and saleBalance sum. Advisor is current Student.advisor, not sale-time advisor snapshot; warn about attribution coverage rather than rewriting history.
- Payment-method-performance: current chart groups **receipts** by method; source report shows **sales** by payment type with sale count/revenue/remaining. Use sales grouped by sale.method for a consistent local aggregate; mixed later receipt methods do not redefine original sale payment type.
- Discount-impact: current chart groups percent buckets; source table label is advisor. Aggregate locally recorded discounted sales by advisor with count/net sale value/balance. “High” cutoff and actual discount monetary impact are unknown.
- no-discount-sales: local extra discount===0 is available but does not prove no campaign/base discount. Current imported financeRecords defaults absent discount metadata to 0; retain provenance to avoid asserting full-price sale for unknown legacy data.
- installment-risk: dated overdue unpaid installment existence is computable. Source requires advisor aggregate and separate riskCount, not installment rows. A defensible local count is unique sales with dated overdue balance; don't equate riskCount with installment count without defining it.
- unpaid-balance-heavy: package aggregation available, “heavy” threshold unknown; do not repurpose all nonzero balances as high balance.
- advisor-revenue-risk: current bars use remaining, trend still uses sale amount for all advisor reports. Source chart value meanings come from endpoint; local charts must label their actual chosen measure.
- conversion-funnel: current series are unique met students, SALE-result meetings, unique purchasers. Source supported labels are meetings/appointments/sales, and row conversionRate. Denominator and appointment classification unavailable; do not call existing three unrelated measures a funnel conversion.
- revenue-forecast-trend: current open dated installments by due month are a valid local schedule. Source describes existing sale timeline/balance, grouping label “Grup”; show table as known local measures but don't claim source model/forecast algorithm.
- Cancellation/refund/expiry/lifecycle cohorts remain unavailable. Sale lacks status,startDate,endDate,cancelledAt/refund linkage. Financial settlement never implies pending/completed sale lifecycle.
- financeSummary.balance currently ignores selected period while sales/receipts are filtered; that all-time balance must not be labeled as filtered balance.
- General finance trend always sums sale amounts, even for receipt-channel or risk-oriented views. It must use the report's selected measure/cohort. Retain valid zero charts; do not convert zero to missing. Future negative adjustments require diverging chart scale.

## Exact field and route aliases

| Concept                     | Canonical source key / alias rule                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Education source status     | educationStatus; filter parameter status                                                                                                              |
| Sale source lifecycle       | saleStatus in education projection; status in sale DTO/filter                                                                                         |
| Settlement progress         | Local payment/Tamamlandı/Bekliyor/Kısmi ödeme/Gecikmiş; never lifecycle                                                                               |
| Education paid vs remaining | paidAmount versus remainingAmount; low-attendance-high-remaining is money, not lessons                                                                |
| Finance counts              | Row totalSales; aggregate row count summary totalRows; row riskCount vs summary totalRisk                                                             |
| Sort UI → query             | sortOrder='field:direction' → sort=field&order=direction                                                                                              |
| Leaf title localization     | kebab-case slug → snake_case title key                                                                                                                |
| Main routes                 | /admin/reports/sales,meetings,collections,bills,overdue-receivables,accounting are primary report pages                                               |
| Education meetings          | /admin/education-reports/meetings is a per-student leaf, distinct from finance meetings                                                               |
| monthly-meetings            | Local-only startup route; absent source primary/leaf catalog. Keep as local convenience alias for reports/meetings + month dates, not an API endpoint |
| Unknown slugs               | Source 404s; current broad reports→Ledger fallback should not silently render a different report                                                      |

Source label normalizer lowercases, converts '+' to '_plus_', then punctuation to underscores. Known chart token labels: meetings→Görüşmeler; appointments→Randevular; sales→Satışlar; unassigned→Atanmamış; unknown→Bilinmiyor; no_end_date→Bitiş Tarihi Yok; expired→Süresi Dolmuş; 0_30_days→0-30 Gün;31_60_days→31-60 Gün;60_plus_days→60+ Gün. Label support alone is not proof of backend bucket boundaries.

## Primary ledger/report differences to preserve

These are not sales leaves and need their own typed configs:

| Route               | Exact source filters                                                                                                                                                                  | Source data columns / directly available improvements                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sales               | search,startDate,endDate,education(single),pricing(single),status(multi),sort/order createdAt asc/desc; month default                                                                 | student; education+pricing; paidAmount; discountedAmount; startDate+endDate;paymentType;status;createdAt;detail. Local course/plan/method/receipt totals available; lifecycle/enrollment dates/discount money unknown.                   |
| collections         | search,startDate,endDate,paymentType(multi),advisorId(single),sort date/amount asc/desc; month default                                                                                | customer,type,amount,date,paymentType,detail. Derive SALE vs INSTALLMENT from Receipt.installmentId, preserving data provenance. No settlement-status filter belongs here.                                                               |
| overdue-receivables | search,paymentType(multi),sort createdAt/amount/daysOverdue asc/desc; source injects last-year dates but has no visible dateRange control                                             | student,advisor.name,amount,dueDate+createdAt,daysOverdue,sale.paymentType,notes,detail. Compute overdue days from real installment dates; distinguish original installment amount from unpaid balance.                                  |
| accounting          | search,startDate,endDate,type(multi:INCOME/EXPENSE/COLLECTION),categoryId(single),transactionMode(single:ONE_TIME/RECURRING),sort date/amount/title asc/desc; month default,date:desc | title/description,amount,categoryName,date or recurrence interval,type,sourceType,transactionMode,createdBy,action. Existing receipts and operational expenses support partial table. Current two bars omit income and all table detail. |

Accounting sourceType enum EXPENSE,SALE,INSTALLMENT,TEACHER_SALARY,STAFF_SALARY; only EXPENSE rows editable in source. Do not invent salary ledger/creator fields. Existing Expense has category string rather than categoryId; string matching is not a server ID alias. Collection advisorId requires actual staff ID relation; Student.advisor display string alone does not supply it.

Detail destinations: sale `/admin/students/:studentId/payments?tab=saleHistory&saleId=:saleId`; collection SALE→saleHistory, INSTALLMENT→installments; overdue→`?tab=installments&installmentsTab=overdue`. Local ledger always sends collection rows to saleHistory, so installment-linked receipt drillthrough needs correction. Bills currently falls through to sales Ledger despite source being a separate primary report; keep unavailable until bill records exist.

## Minimal typed configuration / pipeline recommendation

```ts
type ReportFamily =
  | 'education-leaf'
  | 'sales-leaf'
  | 'sales'
  | 'collections'
  | 'overdue'
  | 'accounting';
type ReportConfig<Field extends string, Summary extends string> = {
  family: ReportFamily;
  columns: readonly Field[];
  summary: readonly Summary[];
  filterKeys: readonly string[]; // canonical source URL names
  dateDefault: 'none' | 'month-to-date' | 'last-year';
  sort: { field: string; order: 'asc' | 'desc' };
  sortOptions: readonly string[];
  chartUnit: 'count' | 'money';
  requiredData: readonly string[];
};
type ReportResult<Row> = {
  rows: Row[];
  summary: Partial<Record<string, number>>;
  distribution: { label: string; value: number }[];
  trend: { period: string; value: number }[];
  unavailable: string[];
  coverage: { included: number; unknown: number };
};
```

Use exact source slug unions from report-catalog; `satisfies Record<EducationLeafSlug,...>` / `Record<SalesLeafSlug,...>` prevents routes silently missing definitions. Columns can reuse the families above. Add explicit local nullable projection types instead of casting Student into EducationLeafRow or LedgerRow into SalesLeafRow.

Pipeline: normalize URL filters → project genuine local data with unknowns → apply known cohort predicate → apply search/status/date/payment-type consistently → aggregate measures → sort → summarize/chart/export → paginate table. Preserve URL query state on back/forward, retain page state per branch, reset page when filters change. Do not silently choose date bases, risk thresholds, lifecycle mappings, or conversion denominators.

## Source provenance

Cached original source: `research/source/app/[locale]/(main)/admin/education-reports/_leaf/{config,report-definitions,education-leaf-page}.tsx`; dynamic education/reports pages; `hooks/main/report/{leaf-report,report-catalog,report-labels}.ts`; `messages/tr/admin/reports.json`.
New exact-commit read-only snapshots: `research/report-source-2026-09-10/app/[locale]/(main)/admin/reports/_leaf/{config,report-definitions,sales-leaf-page}.tsx` and `reports/{sales,collections,overdue-receivables,accounting}/config.tsx`.
No source/Site checkout edits or server calls occurred.
