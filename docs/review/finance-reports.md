# Finance report parity — verified 9 September 2026

Compared exact source commit `7810bd1720c57749f6d5249536ba015f2a53694f` in `jamasterlms/jamaster-web` with local `src/features/finance/finance-analysis-page.tsx`, `financial-ledger.tsx`, `finance-model.ts`, `src/features/insights/report-model.ts`, and `src/app/page-router.tsx`. Read-only; no Site files changed.

## Critical findings

- Cancellation, refund, and contract-expiry reports are **real reports in source**, not intentionally empty placeholders. The prototype hardcodes empty arrays because its Sale model lacks lifecycle status/endDate/refund records.
- `high-discount-sales`, `no-discount-sales`, and `expiring-soon-sales` route to `LedgerPage` with **no corresponding filtering**, so they show all sales. This is more misleading than an honest empty/unavailable state.
- `pending-sales` and `completed-sales` currently filter remaining balance. Source filters **sale lifecycle status** (`pending`, `completed`, `cancelled`, `refunded`), which is separate from payment settlement. Do not infer lifecycle from paid balance.
- `installment-risk` is an aggregate by advisor in source. Prototype shows individual overdue installment rows. `unpaid-balance-heavy` is an aggregate by package in source; prototype lists all nonzero sale balances without a high-balance threshold.
- Analysis empty-state detection uses `!max`, incorrectly treating valid zero-valued data as absent. Source charts check `data.length === 0`. Future negative refund impacts also need absolute/diverging scale handling rather than a positive-only maximum.

## Source files and boundaries

Source base: `https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/`

- `app/[locale]/(main)/admin/reports/_leaf/report-definitions.tsx`: exact columns, summary keys and chart measure types below.
- `_leaf/config.tsx`: shared filter definitions.
- `_leaf/sales-leaf-page.tsx`: report structure, defaults, table/export/pagination/chart queries.
- `hooks/main/report/leaf-report.ts`: `SalesLeafRow={label,totalSales,totalRevenue,totalRemaining,riskCount,conversionRate}` and chart `{summary,distribution,trend}` types; table endpoint `/admin/reports/{slug}`, chart `/admin/reports/{slug}-chart`.
- `hooks/main/report/report-labels.ts`, `messages/tr/admin/reports.json`: translated status/group labels and intended report descriptions.
- `app/[locale]/(main)/admin/reports/{sales,collections,overdue-receivables,accounting}/config.tsx`: detailed report fields/filter differences.
- `hooks/main/report/{sales,accounting}-report.ts`: source record and summary types.
- `app/[locale]/(main)/admin/reports/_components/charts/{bar,line}-chart.tsx`: loading states and actual empty-array states.

**Limit:** this frontend receives calculated aggregates from API endpoints. It does not contain backend definitions for high-discount/high-balance thresholds, conversion denominator rules, exact risk counts, expiry boundary inclusion, or whether `totalRevenue` represents gross/net/refund impacts. Do not invent those rules or describe a local approximation as exact source parity.

## Shared leaf-report filters and layout

| Source control | Exact behavior | Prototype difference |
| --- | --- | --- |
| Search | `search`, URL query state, default empty | FinanceAnalysis has none; Ledger searches student name/course only. Aggregate search target is backend-defined. |
| Date range | `startDate` / `endDate`, `useDateMonth:true` | Analysis has only all/month selector; Ledger has arbitrary range. Both default unrestricted locally. Source date basis is passed to backend, not derived client-side. |
| Sale status | Multi-select `pending`, `completed`, `cancelled`, `refunded`, empty=all | Analysis absent; Ledger single payment-status dropdown Tamamlandı/Bekliyor/Kısmi ödeme/Gecikmiş, different concept. |
| Payment type | Multi-select CASH, BANK_TRANSFER, CREDIT_CARD_SINGLE, IYZICO, PROMISSORY_NOTE, empty=all | Analysis absent; Ledger single-select only Nakit/Havale/Kredi kartı plus unspecified. |
| Sort | totalRevenue:desc, totalSales:desc, totalRemaining:desc, riskCount:desc | Analysis only implicit value-desc bars; Ledger defaults date-desc/table-column sort. |
| Default sort | totalRemaining:desc for installment-risk, unpaid-balance-heavy, advisor-revenue-risk, contract-expiry-revenue-risk; totalRevenue:desc otherwise | No per-report counterpart. |

Every leaf page retains filter controls, summary cards for supplied summary keys, aggregate table, pagination, CSV/JSON/Excel export, distribution and trend sections. Chart query removes page/limit so totals cover all filtered rows, not the displayed page. Empty chart arrays show a dedicated no-results view; errors and loading are distinct. Missing summary keys are omitted, not automatically fabricated as zero.

## Exact leaf columns and summary keys

Abbreviations: Rows=`totalRows`, Sales=`totalSales`, Revenue=`totalRevenue`, Remaining=`totalRemaining`, Risk=`totalRisk`. Row risk column is `riskCount`.

| Slug | Source table columns | Source summary keys |
| --- | --- | --- |
| sales-by-advisor | Advisor, sale count, revenue, remaining, risk count | Rows, Sales, Revenue, Remaining, Risk |
| conversion-funnel | Stage, count, conversionRate (%) | Rows, Sales, Revenue, Risk |
| payment-method-performance | Payment type, sale count, revenue, remaining | Rows, Sales, Revenue, Remaining |
| installment-risk | Advisor, risk sale count, risk count, remaining | Rows, Sales, Remaining, Risk |
| discount-impact | Advisor, sale count, revenue, remaining | Rows, Sales, Revenue, Remaining |
| high-discount-sales | Advisor, sale count, revenue, remaining | Rows, Sales, Revenue, Remaining |
| unpaid-balance-heavy | Package, sale count, revenue, remaining, risk count | Rows, Sales, Revenue, Remaining |
| pending-sales / completed-sales / cancelled-sales / refunded-sales / no-discount-sales | Group, sale count, revenue, remaining | Rows, Sales, Revenue, Remaining |
| expiring-soon-sales | Group, sale count, revenue, remaining, risk count | Rows, Sales, Revenue, Remaining, Risk |
| advisor-revenue-risk | Advisor, sale count, revenue, remaining, risk count | Rows, Sales, Revenue, Remaining, Risk |
| cancellation-refund-analysis | Status, sale count, revenue impact | Rows, Sales, Revenue, Risk |
| pricing-package-performance | Package, sale count, revenue, remaining, risk count | Rows, Sales, Revenue, Remaining |
| revenue-forecast-trend | Group, sale count, revenue, remaining | Rows, Sales, Revenue, Remaining |
| contract-expiry-revenue-risk | Expiry window, sale count, risk-exposed remaining balance | Rows, Sales, Remaining, Risk |

All use money distribution/trend except conversion-funnel, which uses counts. The source descriptions sometimes say paid amount where the actual column is totalRemaining; prefer the verified column/type definitions over loose prose.

## Cancellation/refund/expiry empty cases

| Report | Current code | Minimum honest correction |
| --- | --- | --- |
| cancelled-sales / refunded-sales | `if (/cancelled|refunded/.test(slug)) rows=[]` | Use explicit lifecycle records when available; otherwise retain report-specific columns, controls and an explanation that cancellation/refund data is not recorded. Do not infer cancellation from inactive student, unpaid amount or missing payment. |
| cancellation-refund-analysis | `cancellation || contracts ? []` | Show Status / Sale count / Revenue impact table and supplied/available metrics. Current lack of lifecycle data is different from an observed zero cancellation count. Avoid a positive “zero losses” conclusion. |
| contract-expiry-revenue-risk | Same hardcoded array | Show Expiry window / Sale count / Risk-exposed balance table and explain missing sale/contract end dates. Do not use installment dueDates or contract template metadata as contract expiry. |
| expiring-soon-sales | Falls through to all sales | Filter only actual dated active-sale lifecycle records; until endDate/status exist, show explicit unavailable-data state instead of all sales. |

Translation vocabulary for expiry windows is **no_end_date**, **expired**, **0_30_days**, **31_60_days**, **60_plus_days**. This verifies labels intended by source, not backend inclusion rules. Preserve “no end date” as unknown; do not classify it as expired or safe.

Minimum local model additions if implementation scope permits data entry/import: independent optional sale lifecycle `status`; sale start/end dates; explicit refund/cancellation records or fields with event date and amount. Keep payment status derived separately. Legacy records with no lifecycle value should display unknown, not be migrated to completed simply because balance=0.

## Additional mismatches in local analysis logic

- `payment-method-performance` uses receipt amounts only; source table reports sale count, totalRevenue and totalRemaining by payment type. A receipts-only chart can be valid if explicitly titled collections, but is not the source report.
- `discount-impact` groups by discount percentage; source groups by advisor with sale count/revenue/remaining. `high-discount-sales` needs a verified threshold before filtering.
- `advisor-revenue-risk` sums **all** remaining sale balances by the student's current advisor. Source additionally includes risk counts; no verified source rule says every outstanding balance is risky.
- `conversion-funnel` shows distinct contacted students, SALE-result meeting count, distinct purchasing students. Source labels stages meetings/appointments/sales and includes conversionRate. The local chart omits appointment stage and percentages; don't divide unmatched cohorts and call it conversion.
- `revenue-forecast-trend` currently sums remaining installments by due month, an explicit local schedule projection. Source description refers to sale timeline/balance and receives backend trend; exact forecast method is not available here.
- Analysis right-side total/trend always uses sales, even when left side is payment methods/accounting. This can mix receipt-period amounts with sale-period totals. Use the same measure/date basis per report or label each independently.

## Detailed financial ledger reports

| Report | Source fields/filter semantics missing from generic local ledger |
| --- | --- |
| sales | Student name/email; education **and pricing title**; paidAmount; discountedAmount; startDate/endDate; paymentType; **lifecycle status**; createdAt. Filters: search, date range, education, pricing dependent on selected education, multi lifecycle status, createdAt asc/desc. Detail link targets student's payments saleHistory with saleId. Prototype lacks pricing display/filter, discount amount, lifecycle dates/status and sale-specific destination; its generic “Tutar” is local sale amount, not verified source paidAmount. |
| collections | Customer, source type **SALE/INSTALLMENT**, amount, collection date, payment type. Filters: search, date range, multi five payment types, advisor ID, sort date/amount both directions. Source detail route opens saleHistory or installments according to type. Prototype omits source type and routes to generic student profile; advisor uses current name rather than transaction's advisor record. |
| overdue-receivables | Student/email, advisor, **overdue installment amount**, dueDate plus invoice/createdAt, daysOverdue, payment type, installment-or-sale notes, detail to payments installments overdue tab. Filters multi five payment types, date/amount/daysOverdue sorting; settings `useDateLastYear:true`. Prototype treats this route as sales, so a sale with one overdue installment shows its entire sale amount/balance and sale date; it omits delay days and notes. Use actual overdue installment rows for this report. |
| accounting | Title/description, amount, category/color, date or recurring start/end, INCOME/EXPENSE/COLLECTION, source EXPENSE/SALE/INSTALLMENT/TEACHER_SALARY/STAFF_SALARY, ONE_TIME/RECURRING, createdBy; edit only sourceType EXPENSE. Filters search/date range/multi type/category/transaction mode/sort date-amount-title. Summary totalIncome,totalExpense,totalCollection,netTotal, and corresponding trend series. Prototype shows only two aggregates (sale collections, paid one-time expenses) and no table; omits independent income, salaries, recurring records and source context. |

Source sale type has `listAmount`, `paidAmount`, `discountedAmount`, `startDate`, `endDate`, `status`, `createdAt`. Current local Sale has amount, discount percentage, sale date, dueDates and no endDate/status. Do not relabel these as identical quantities without an explicit conversion/model definition.

## Suggested implementation order / targeted checks

1. Stop unrelated-data fallthrough on high-discount/no-discount/expiring routes; route unsupported measures to informative typed report views. No-discount can be computed from local discount=0, but should say it measures recorded extra discount only if package/payment discounts are unmodeled.
2. Introduce route-specific report presentation definitions and shared filters/aggregate table. Render structured zero-row states without pretending unavailable facts are measured zeros.
3. Correct overdue report to installment grain; keep risk aggregates separate from transaction ledgers.
4. Add independent lifecycle/endDate support only where there is a real way to create/import these values; preserve unknown legacy fields.
5. Verify zero-amount records are visible, status filters do not equal balance filters, future/missing due dates are excluded from overdue, no-end-date is not expiry, and filters/table/chart/export share the same population.
