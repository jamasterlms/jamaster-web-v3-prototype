# Education report gaps and source contracts

Pinned source: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Local inspected 2026-09-09: `src/features/insights/education-detail-page.tsx`, Student/Workspace/Operations types, finance and attendance models. No Site edits or browser testing.

**Nine local report routes always produce an empty list**, regardless of stored data. They have neither a `definitions[slug]` predicate nor a later override; initialization is `definition ? students.filter(...) : []`. This is an implementation gap, not evidence that their datasets contain zero matching students. The source has working client definitions for all 24 education leaf routes and obtains rows/cohort membership from API endpoints. Its numerical cohort thresholds are not present in the inspected frontend.

## The nine empty cases

All source column orders below end with an additional detail action linking to `/admin/students/<studentId>`. `studentId` must therefore be retained even where it is not a visible column. “Date filter” means the common startDate/endDate control and month-to-date default described below.

| Route slug | Exact source visible data columns, in order | Date filter | Dataset needed / source-described cohort |
|---|---|---|---|
| `ending-soon-students` | studentName, educationStatus, endDate, daysToEnd, lastFreezeStart, lastFreezeEnd, paidAmount | Yes | Education enrollment/contract end dates plus freeze adjustments and collections; students approaching their education end. The “soon” day threshold is server-owned and unknown here. |
| `bonus-used-students` | studentName, usedBonusCount, remainingBonusCount, educationStatus, paidAmount, advisorName | Yes | Per-student bonus entitlement and consumption ledger; students who have used bonus entitlement. |
| `bonus-remaining-risk` | studentName, usedBonusCount, remainingBonusCount, educationStatus, paidAmount, advisorName | Yes | Same bonus data; students with critically low remaining entitlement. Risk threshold is not defined in frontend. |
| `group-switch-history` | studentName, activeGroupCount, groupSwitchCount, advisorName, educationStatus | No | Historical group membership/assignment events with active intervals, not just current group name. Source describes group-change frequency. |
| `transfer-out-students` | studentName, transferredAt, meetingCount, advisorName, saleStatus | Yes | Student transfer-out event date plus meeting aggregates and sale lifecycle status. A past/inactive label alone is insufficient. |
| `low-attendance-high-remaining` | studentName, attendanceRate, lastAttendanceAt, lastMeetingAt, activeGroupCount, remainingAmount | Yes | Attendance events plus unpaid sale balances, membership and meeting aggregates. Low-attendance and high-balance cutoffs are unknown; remainingAmount is money, not remaining lessons/bonus. |
| `zero-bonus-remaining` | studentName, usedBonusCount, remainingBonusCount, educationStatus, paidAmount, advisorName | Yes | Bonus entitlement/consumption ledger; source describes fully exhausted bonus entitlement. Missing bonus data must not become a factual zero. |
| `long-freeze-students` | studentName, educationStatus, endDate, daysToEnd, lastFreezeStart, lastFreezeEnd, paidAmount | Yes | Freeze records with start/end, active status and education end dates, plus collections. Long-freeze duration cutoff is unknown. |
| `no-advisor-students` | studentName, advisorName, educationStatus, activeGroupCount, paidAmount, lastAttendanceAt | No | Advisor assignment absence plus normal education aggregates. Local `Student.advisor?: string` already supports identifying missing advisor; do not substitute teacher or a default employee. |

## Exact shared filters and API contract

Source route wrapper validates slugs against `educationLeafSlugs`, then renders `EducationLeafPage`. It fetches:

- Table: `GET /admin/education-reports/<slug>` with query parameters; paginated response fields used by UI are `data`, `page`, `limit`, `totalPages`, `totalItems`.
- Chart/summary: `GET /admin/education-reports/<slug>-chart` with the same parameters except page/limit omitted. Response is `{summary: Record<string,number>, distribution: {label,value}[], trend: {period,value}[]}`.
- Default pagination/sort: `page=1`, `limit=10`, `sort=createdAt`, `order=desc`.

| Filter | Source contract |
|---|---|
| Search | `search`, default empty string; URL/search-parameter mode, reset shown. Server search-field semantics are not in the client. |
| Education status | `status`, multiple select; empty/All plus `active`, `frozen`, `expired`, `pending`, `completed`. Repeated status query keys represent multiple values; selecting every real option omits the filter. |
| Sort | UI key `sortOrder`: `createdAt:desc`, `createdAt:asc`, `daysToEnd:asc`, `attendanceRate:desc`, `paidAmount:desc`. Query helper supplies sort/order defaults as above. |
| Date range | `startDate` + `endDate`; default `dateRangeHelpers.getMonthToDate()`, serialized by `toISOString().split('T')[0]`. Applies to 16 of 24 slugs. Which record timestamp the server tests is not defined by this client. |

The eight slugs **without** date filters/default dates are: active-students, active-unassigned-students, frozen-students, education-status-distribution, group-assignment-load, group-switch-history, never-group-assigned, no-advisor-students. The other 16 have date filters, including education `meetings`.

Every source leaf displays a table, summary cards, distribution bar chart and trend line chart. Even distribution/load/trend leaves retain a per-student table. All source education presentation configurations set `chartLabelType='count'`; chart values/buckets are supplied by the API and should not be reverse-engineered from labels alone. Export options are CSV, JSON and Excel; sticky headers and pagination are enabled.

Default summary keys are `totalStudents`, `activeStudents`, `frozenStudents`, `noGroupStudents`. Attendance-family leaves substitute `avgAttendanceRate` for frozenStudents: attendance-risk-students, attendance-trend, no-attendance-recently, low-attendance-high-remaining, never-attended-students, high-attendance-students. Missing summary keys are omitted rather than invented; avgAttendanceRate renders one decimal plus percent. Local summary of list length / average / meeting count does not match this contract.

## Exact source row shape and local dataset availability

`EducationLeafRow` has required object keys; nullable values below are intentional. It is a report projection, not proof of how the backend joins or selects individual sale/enrollment records.

| Source fields / types | Local availability and necessary work |
|---|---|
| studentId:string, studentName:string, studentEmail:string | Available from Student.id/name/email, with local numeric IDs requiring an explicit adapter. |
| advisorName:string\|null | Student.advisor optional is available. Empty/absent assignment must remain absence. |
| saleStatus:string\|null, educationStatus:string\|null | Local Student.status is a coarse Turkish label; Student.payment is payment progress. Local Sale has no lifecycle status. Separate education/sale states are needed; payment status is not saleStatus. |
| listAmount:number, paidAmount:number, remainingAmount:number | Local Sale/Receipt and `financeRecords`, `saleBalance` can supply finance aggregates. Student.amount is the sum of sales, not paid/remaining. Legacy materialization sometimes lacks dates; do not invent dated collections for date-filtered reports. |
| startDate:string\|null, endDate:string\|null, daysToEnd:number\|null | No typed education enrollment dates in inspected Student/Workspace model. Student.date is not an established education start/end contract. Need enrollment/contract timeline, including how freeze affects end dates. |
| usedBonusCount:number, remainingBonusCount:number | No typed local bonus entitlement/usage ledger. Add genuine data capture or source-backed report responses; missing data must remain unknown until recorded. |
| activeGroupCount:number, groupSwitchCount:number | Student.group is one current string; Operations groups define current metadata. No assignment-history collection exists, so prior changes/never-assigned cannot be established from current group alone. Need student-group membership events and active intervals. |
| lastAttendanceAt:string\|null, attendanceRate:number | AttendanceSession contains branch/date/student marks. Derivable from recorded sessions after agreeing on denominator/window; source report client does not define these calculations. Local `attendanceStats` rounds to an integer and returns null when no marked records. |
| lastMeetingAt:string\|null, meetingCount:number | Meeting records with studentId and createdAt exist. Source date selection/window is server-owned; local hardcoded last 30 days and createdAt cannot be called source-equivalent. |
| transferredAt:string\|null | No typed local transfer event/history. Need explicit transfer-out data. |
| hasActiveFreeze:boolean, lastFreezeStart:string\|null, lastFreezeEnd:string\|null | No typed local freeze records. Need freeze intervals and current active flag, tied to education/student identity. |

Source rendering supports education states active/frozen/expired/pending/completed/inactive/transferred/unknown and sale states pending/completed/cancelled/refunded/unknown, although the shared education status filter only offers the five statuses listed above.

## Existing local cases that also need correction

- `/admin/education-reports/meetings` currently routes to shared MeetingsPage before EducationDetailPage. Source education meetings is a per-student report with studentName/advisorName/saleStatus/meetingCount/lastMeetingAt, summary, chart and filters; it is not the main meeting agenda.
- `no-attendance-recently` currently includes students with **any absence** during 30 days. Source description is students without recent participation signals; a student who attended yesterday and missed one earlier session must not automatically be treated as having no recent attendance.
- `never-attended-students` currently requires an observed zero attendance rate and excludes students with no records. Source description says no participation records. The source client does not resolve whether “never” means no present marks versus no rows at all; this must come from backend semantics or an explicit local rule.
- `reactivation-candidates` currently selects only `status==='Geçmiş'`. Source description includes frozen or expired students. `frozen-students` source description includes a frozen state **or an active freeze record**.
- `never-group-assigned` currently checks missing current group, which also admits previously assigned students. Source requires historical absence of assignment. `active-unassigned-students` uses active-group membership, not a nonempty display string.
- `group-assignment-load` local view charts students/capacity per group and has no table. Source is student rows with activeGroupCount/groupSwitchCount/advisor/status plus API distribution/trend. `education-status-distribution` and `attendance-trend` also omit the source student tables locally.
- The local attendance thresholds 90% and 94%, recency 30 days and meeting-intensive cutoff 3 have no supporting numeric definitions in the inspected source client or Turkish descriptions. Keep them labeled as local decisions unless backend evidence establishes them.
- Local search checks name+course only, has no status/date/sort URL filter controls, and aggregate cases bypass search. All source leaves use the shared filter contract. Source action opens student detail; local action starts a meeting.

## Bounded implementation guidance

Use the table/API projection when a real report service is available. For local-only behavior, introduce explicit education enrollments, bonus movements, membership history, freezes and transfers before calculating their cohorts; finance, attendance, meeting and advisor data can reuse the existing records. Keep unavailable fields distinct from zero, and distinguish “no matching rows” from “required history is not recorded.” Do not fill blank reports with unrelated students or invented events. Numerical risk/recency thresholds need an explicit local product decision or server implementation evidence; the pinned frontend cannot provide them.

Inspected pinned source files, saved under `research/source/`: `app/[locale]/(main)/admin/education-reports/_leaf/{config.tsx,education-leaf-page.tsx,report-definitions.tsx}`, the dynamic `[reportKey]/page.tsx`, `hooks/main/report/{leaf-report.ts,report-catalog.ts,report-labels.ts}`, `components/common/{filters.tsx,filters.utils.ts}`, `messages/tr/admin/reports.json`. Exact endpoint predicate logic, joins, chart bucket definitions and numeric thresholds remain uninspected because this web client delegates them to the API.
