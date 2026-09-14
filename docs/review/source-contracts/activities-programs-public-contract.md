> Kaynak araştırma kaydıdır. Başlangıçtaki eksik listesi sonraki implementasyonla değişmiştir; güncel durum `../completion-2026-09-10.md` içindedir.

# Activities, programs and public service contracts

Source commit: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`. Every file named below is cached beneath `/workspace/scratch/17d87b61bfc5/research/source/`. No Site files were edited for this research.

## Admin activities

Real page patterns are `/admin/activities`, `/admin/activities/[id]`, and `/admin/activities/[id]/submissions`. There is **no** separate source activity create/edit page. The list opens a create sheet. Its row action is labeled edit but navigates to the detail page; the inspected detail card itself is read-only apart from publish. Do not invent a source edit dialog as a parity requirement.

### List and detail controls

- List URL filters: `search` (default empty), `type` (multiple; default `all`), `status` (multiple; default `all`), `groupId` (single; `all` plus groups). Reset available. Groups loaded with limit 100.
- Table: title, type, status, resolved group name, due date, actions. Each row links to its detail and supports confirmed deletion. Server pagination uses page/limit/totalPages/totalItems. The inspected list does not pass exportOptions.
- Row selection enables bulk publish, archive (confirmation), and duplicate. Duplicate opens `BulkDuplicateTargetDialog` with an **optional** target group. Omitted target preserves backend default behavior; do not require it. Bulk API result distinguishes `succeeded[]` from `failed[{id,message,i18nTranslationKey}]`; represent partial failure rather than claiming all selected items succeeded.
- Detail layout has links/tabs `detail` and `submissions`. Detail shows title/status, description if supplied, type, grading method, maxPoints if non-null, dueDate if supplied. Publish control exists only for `DRAFT` or `SCHEDULED`, requires confirmation, and disables while pending.

### Create sheet

| Field               | Source schema and UI                                                        | Default |
| ------------------- | --------------------------------------------------------------------------- | ------- |
| title               | String min length 1, required                                               | empty   |
| type                | String min length 1; select using types below                               | empty   |
| groupId             | String min length 1; group select                                           | empty   |
| gradingMethod       | String min length 1; select using methods below                             | empty   |
| maxPoints           | Optional string; number input; submitted as Number(value), omitted if empty | empty   |
| dueDate             | Optional string; datetime-local; nonempty converted to ISO date             | empty   |
| description         | Optional string textarea; empty omitted                                     | empty   |
| allowLateSubmission | Boolean switch                                                              | false   |

Activity types: `EXAM`, `QUIZ`, `ASSIGNMENT`, `PROJECT`, `PRESENTATION`, `DISCUSSION`, `PRACTICE`, `HOMEWORK`, `LAB`, `READING`, `VIDEO`, `RESOURCE`.

Grading methods: `POINTS`, `PERCENTAGE`, `LETTER`, `PASS_FAIL`, `RUBRIC`, `CUSTOM`.

Activity statuses: `DRAFT`, `PUBLISHED`, `SCHEDULED`, `ACTIVE`, `CLOSED`, `ARCHIVED`.

Create payload additionally fixes `status:DRAFT`, `maxSubmissions:1`, `requireFile:false`, `requireText:false`, `visibility:ALL_STUDENTS`, `showGradesToStudents:true`, `peerReviewEnabled:false`, `anonymousGrading:false`. Save success resets the form and closes the sheet. Broader Activity type has instructions, passingPoints, weight, rubric, publish/start/close dates, late penalty, files, external links and specific students, but these are **not exposed in this inspected create sheet**.

### Submissions and grading

- List scoped by `activityId`. Columns: student **name**, submittedAt, status, grade with optional maxGrade, actions. Source uses joined `studentName`/`studentNumber`; never substitute raw student IDs for names.
- Submission status options: `NOT_SUBMITTED`, `SUBMITTED`, `LATE`, `GRADED`, `RETURNED`, `RESUBMITTED`.
- Every row can open `GradeSubmissionSheet`; only `GRADED` rows show Return. Return action disables during mutation. This inspected table does not expose a search/filter/pagination control, although its hook can take query params.
- Grade sheet displays submitted text, required numeric grade, optional feedback and optional privateFeedback. Defaults are empty strings. Schema requires nonempty grade and `!isNaN(Number(value))`; input has min=0, but schema itself does not enforce grade range/maxGrade. Submit converts grade to number, omits empty feedback, resets/closes after success. Preserve private feedback as separate data; do not expose it in student views.

Exact implementation sources: `app/[locale]/(main)/admin/activities/config.tsx`; `_components/activity-list.tsx`, `create-activity-sheet.tsx`, `bulk-duplicate-target-dialog.tsx`; `[id]/layout.tsx`; `[id]/_components/activity-detail-card.tsx`, `submission-table.tsx`, `grade-submission-sheet.tsx`; `hooks/main/activities.ts`; `hooks/main/activity-submissions.ts`.

## Admin programs

`/admin/programs` is a distinct program catalog, separate from education and program terms. Create/edit/delete are dialogs on the list; no source `/programs/create`, `/programs/form`, or `/programs/[id]` page exists.

| Control                 | Exact source contract                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Filters                 | search empty; isActive=`all`/`true`/`false`; sortOrder=`createdAt:desc` (default), `createdAt:asc`, `name:asc`, `name:desc`; reset |
| Table                   | name, educationName badge, description preview, isActive badge, edit/delete actions                                                |
| Data/export             | URL pagination; CSV/JSON/Excel exports                                                                                             |
| Create/edit name        | Required string min length 1                                                                                                       |
| Create/edit educationId | Required string min length 1; EducationSelector                                                                                    |
| Description             | Optional textarea                                                                                                                  |
| isActive                | Required boolean switch in form                                                                                                    |
| Create defaults         | name='', educationId='', description='', isActive=true                                                                             |
| Edit defaults           | Existing record; description falls back '', isActive falls back true                                                               |
| Delete                  | AlertDialog confirmation; pending disables action                                                                                  |

Create/edit forms require branch context through `BranchRequiredAlert`. Save closes the dialog. Deactivating a program with dependent active program terms is allowed by the source API and returns additive warnings; show success **and** each returned warning, not a fabricated blocking validation error. Response `Program` has id/name/educationId/description/isActive/createdAt/updatedAt plus joined educationName and optional warnings. Forms require isActive although response schema allows it absent.

Exact sources: `app/[locale]/(main)/admin/programs/page.tsx`, `config.tsx`, `_components/create-program-dialog.tsx`, `create-program-form.tsx`, `program-dialog.tsx`, `program-form.tsx`; `hooks/main/programs.ts`.

## Public payment, polling and unsubscribe

These paths must resolve to intentional page UI. With no connected API, a service-unavailable state is truthful route representation; it is **not** full backend parity. Service absence cannot imply invalid token, no debts, successful verification, completed payment, or unsubscribed status.

| Path                              | Source modes/states and actions                                                                                                                                                                                                                                                                                                                                                                                | Required behavior without API                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/payment`                        | Scope-aware dashboard for TENANT_INVOICE, BRANCH_PAYMENT, STUDENT_INSTALLMENT; active/cards/history tabs; outstanding obligations selection and totals; existing link OPEN/PROCESSING; create/add-to-link then navigate to token checkout. Scope loading/error with retry. Access `blocked=true` adds unpaid-account explanation and suppresses panel return. PROCESSING disables selections and new checkout. | Show payment service unavailable with the relevant modes visible if useful. No fabricated invoice/card/history records, no active payment link, no pay-success action. Do not state access is blocked unless known.  |
| `/payment/[token]`                | Token lookup loading/error; canonical replacement if returned token differs. TENANT_INVOICE/BRANCH_PAYMENT use summary→address→payment→review wizard; saved/new address and card, optional saving, required consent. STUDENT_INSTALLMENT explicitly unsupported in this source checkout.                                                                                                                       | Show unable-to-verify/service unavailable, preserve supplied token route. No card/CVC capture or payment execution while service unavailable; no fake token validity.                                                |
| `/admin/payments/checkout?id=...` | Compatibility redirect: no id→`/payment`; otherwise find active link containing sourceId before creating a new one, then replace with `/payment/[token]`; mutation error→toast and `/payment`.                                                                                                                                                                                                                 | No invented token. Route to honest unavailable payment entry or show blocked compatibility state with return link.                                                                                                   |
| `/polling?q=...`                  | `q` is required poll ID. Loading/checking; missing q→invalid-link state; check error/inactive poll→unavailable. Active poll: phone→verify→success. Already-attended response goes to success. Phone min10; code exactly six decimal digits. Resend timer60s; Back clears code/timer. Same verification mutation sends code when code omitted, verifies when included.                                          | Missing q may be identified locally. With q present show service unavailable/unverified; do not say code sent, verified, or attendance recorded. Disable send/resend/verify actions until real service is available. |
| `/unsubscribe/[token]`            | On mount source requests unsubscribe(token). Loading/checking; API success sets unsubscribed=true; response false/error sets error. Resubscribe button only after confirmed unsubscribe; success changes state back. Missing token warning.                                                                                                                                                                    | Do not automatically claim unsubscribe. Show preference service unavailable/status unverified; preserve token for later retry; no fake successful resubscribe.                                                       |

Token checkout source statuses are **OPEN, PROCESSING, COMPLETED, CANCELLED, SUPERSEDED**. There is no inspected EXPIRED status. OPEN may display explicit failure with retry, or **pending_verification** after indeterminate transport error. PROCESSING refetches every 5 seconds and remains waiting. Indeterminate results must not invite another payment; refresh authoritative status first. HTTP 409 indicates already started and triggers refetch. Completed returns to source `panelPath`. 3-D Secure HTML/action is supplied by real checkout response.

Polling source contains fixed test phone/code shortcuts that can display success without server confirmation. Those are demo shortcuts, **not required verification behavior**; do not transplant them into the no-API product flow or represent them as attendance recorded.

Exact sources: `app/[locale]/payment/_components/payment-page-client.tsx`; `app/[locale]/payment/[token]/_components/payment-checkout.tsx`; `app/[locale]/(main)/admin/payments/checkout/page.tsx`; `app/[locale]/(public)/(other)/polling/page.tsx`; `app/[locale]/(public)/(other)/unsubscribe/[token]/page.tsx`.

## Local representation boundary

Activities/program catalog drafts may use the application's existing clearly local persistence, provided create/update/delete/reload operate on actual local records and the UI does not imply server synchronization. Activity submissions, published delivery, sent messages, authentication, tokens and real payment outcomes require explicit service or a separately labeled demo context. Empty activity/submission data should be presented as local/no data, not proof the production institution has none.
