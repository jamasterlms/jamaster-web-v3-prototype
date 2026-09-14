# Teacher and group detail continuation

Compared read-only against `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f` and the Site checkout on 2026-09-09. Exact fetched source files are cached under `research/source/` with repository-relative paths. No Site files edited.

## Main gaps and implementation order

1. Route nested detail pages explicitly. The Site's `src/app/page-router.tsx` recognizes group `/polling`, but its generic GroupsPage/TeachersPage only passes `detailId` for three path segments. `/groups/:id/teacher`, `/groups/:id/schedule`, `/teachers/:id/payments`, `/teachers/:id/history`, etc. currently become the collection page. `/teachers/salary` incorrectly becomes a teacher detail ID. Both detail pages lack their source tab navigation.
2. Replace bare group assignment with a dated membership dialog, including reason and active-sale context. Source supports multiple memberships; current Site assignment overwrites the student's only `group`, course and teacher.
3. Add group teacher assignments separate from the head teacher and group-scoped calendar. Add teacher-scoped calendar, personal details, students, and salary/payment history.
4. Wire source form query parameters and detail communication actions. Source editing links do not use the Site's `?edit=1` format.

## Canonical pages and query parameters

| Source route/action | Exact behavior | Site gap |
| --- | --- | --- |
| `/admin/groups/:groupId` | Students tab | Present as simplified detail with only names/attendance/profile links |
| `/admin/groups/:groupId/teacher` | Teacher assignments tab | Missing |
| `/admin/groups/:groupId/schedule` | Group calendar tab | Detail button opens unfiltered `/admin/calendar` |
| `/admin/groups/:groupId/polling` | Attendance tab | Root is implementing this |
| `/admin/groups/:groupId/notes` | Notes tab | Missing |
| `/admin/groups/form?id=:groupId` | Edit existing group | Current editor reads `?edit=1` on a detail route; no `id` query handling |
| `/admin/sms/create?tab=bulk&educationGroups=:groupId` | Group bulk SMS | Missing detail action; preserve selected group in recipient criteria |
| `/admin/email/create?tab=bulk&educationGroups=:groupId` | Group bulk email | Missing detail action |
| `/admin/teachers/:teacherId` | General tab: personal info, contact info, certificates, notes | Only email/phone and six lessons |
| `/admin/teachers/:teacherId/students` | Related student table | Missing |
| `/admin/teachers/:teacherId/groups` | Source explicitly renders an empty/coming-soon state | Do not infer assignment management from this page |
| `/admin/teachers/:teacherId/activities` | Filtered teacher activity table | Missing |
| `/admin/teachers/:teacherId/payments` | Current salary and individual payment history | Missing; optional salary inputs already exist in Site TeacherFields |
| `/admin/teachers/:teacherId/history?tab=schedule` | Teacher calendar | Current detail opens unfiltered calendar |
| `/admin/teachers/:teacherId/history?tab=audit` | Audit/history | Missing |
| `/admin/teachers/form?teacherId=:id` | Edit teacher | Site ignores `teacherId` |
| `/admin/teachers/form?phoneNumber=:phone` | Prefill new teacher phone | Site ignores `phoneNumber` |
| `/admin/email/create?email=:teacherEmail` | Teacher email action | Site uses OS `mailto:` instead |

Sources: `app/[locale]/(main)/admin/{groups/[groupId],teachers/[teacherId]}/layout.tsx`, each `_components/*-detail.tsx`, `admin/teachers/form/page.tsx`, and `src/app/page-router.tsx` in Site.

Legacy teacher routes are defined exactly by `lib/detail-route-redirects.ts`: `/personal` → teacher root; `/notes` → `/activities`; `/salary` → `/payments`; `/schedule` → `/history?tab=schedule`. Turkish `/ogrenciler`, `/gruplar`, `/aktiviteler`, `/odeme`, `/gecmis` → `/students`, `/groups`, `/activities`, `/payments`, `/history`. Preserve all query values, including repeated ones; forced schedule tab overrides old `tab`. Do not confuse per-teacher `/salary` with the separate `/admin/teachers/salary` payroll collection route.

## Group students: add, remove, membership semantics

Exact sources:

- `app/[locale]/(main)/admin/groups/[groupId]/page.tsx`
- `app/[locale]/(main)/admin/groups/[groupId]/_components/group-student-add-dialog.tsx`
- `app/[locale]/(main)/admin/students/[studentId]/groups/_components/group-add-dialog.tsx`
- `app/[locale]/(main)/admin/students/[studentId]/groups/_components/group-remove-dialog.tsx`
- `hooks/main/student/branch-student-group-transfer.ts`

Group student table columns: `student.studentNumber`, `student.name`, `student.email`, `student.areaCode` + `student.phone`, membership `createdAt`, student detail link. Current Site omits number/email/phone/enrollment date.

Add dialog fields: `studentId` required nonempty; `transferDate` optional date (blank defaults to backend time); `reason` optional textarea. StudentSelector excludes IDs already in the group. It fetches current memberships and `activeSaleInfo` for the selected student. Fields reset on every opening. Submit disables during transfer lookup or mutation. Branch selection is required. Source does **not** impose the Site's active-student, active-group or capacity restrictions in this dialog; any backend constraints are not established by this frontend.

Add payload: `{ studentId, toGroupId: groupId, transferDate?: ISO, reason?: string }`. Critically, it has no `fromGroupIds`: source `currentGroups` is an array, so adding is not synonymous with moving out of another group. A safe frontend data model should persist memberships/transfer history separately and derive table counts, rather than losing the previous group by overwriting one string.

If `activeSaleInfo.hasActiveSale`, display its `warning`, uppercase `status`, and paid amount. First submit opens an explicit warning state with “yes continue” and cancel; confirmation commits the same payload. This is a product flow found in source, not a request to seek implementation permission.

Remove dialog exists on **student** group detail, not group-student rows. It displays selected group name, education/level, day/time period and room. Fields: optional `transferDate`; required nonempty `reason` (Zod min 1). Same active-sale warning/confirmation. Payload: `{ studentId, fromGroupIds: [groupId], transferDate?: ISO, reason }`, with no `toGroupId`. It is only available when that group is among the student's current memberships.

Transport semantics for mapping local persistence: GET/POST `/admin/student-groups/:studentId/group-transfer`; mutation refreshes current groups, available groups, student group history, and group student lists. `ActiveSaleInfo` fields are `hasActiveSale`, optional `saleId`, `status`, `startDate`, `endDate`, `listAmount`, `paidAmount`, `warning`.

## Group teacher assignment

Exact sources: `app/[locale]/(main)/admin/groups/[groupId]/teacher/page.tsx`, `hooks/main/group/group-teacher.ts`.

This is a distinct assignment collection, not just `group.headTeacher`/the Site's `group.teacher` string. Record fields: `id`, `groupId`, `teacherId`, optional `title`, `isActive`, `startDate`, optional `endDate`, `createdAt`, `updatedAt`, nested teacher identity/contact/status.

- Add dialog: required `teacherId` (nonempty selector) and `startDate` (nonempty date, default today); optional free-text `title` and `endDate`. Selector excludes teachers already in the group's list. Requires a branch. No end-after-start refinement exists in the source form.
- Edit dialog: optional `title`, `isActive` boolean switch, optional `endDate`; does not edit teacher or start date.
- Table: teacher name, email, title/head teacher badge, start date, end date or dash, active/passive badge, teacher profile link and edit action.
- Head teacher is identified by `title === 'Sınıf Öğretmeni'` OR assignment ID starting `head_teacher_`; edit action is hidden for this row.
- Source declares remove mutation and handler, but its columns never render a remove button. Do not claim removal UI parity is missing here. Exposed behavior is add, edit, open profile.
- Read/create: `/admin/group-teachers/:groupId`; update/delete hooks: `/admin/group-teachers/:groupId/:teacherId`. These are useful record boundaries even for local state.

Group header source also displays branch, group type, education type, head teacher, room, level, sublevel, day period, time period, created date and description. Site detail currently displays only course, head teacher, capacity count plus list.

## Group and teacher calendars

Exact sources: group `.../groups/[groupId]/schedule/page.tsx`; teacher `.../teachers/[teacherId]/history/_components/schedule-tab.tsx`; common `.../admin/_components/schedules/calendar-header.tsx`.

Both calendars default to interaction mode `view`; edit mode enables add, range selection, dragging and resizing. Views are `dayGridMonth` (month), `timeGridWeek` (week), `timeGridDay` (day), `listWeek` (list). Desktop default week; mobile is forced to list. Header supports previous, next, today and fullscreen. Event click opens the shared lesson dialog; edit operations use group+schedule IDs.

Group calendar only fetches its group's events and passes dialog context `{scope:'group', fixedGroupId, fixedGroupName}`. Teacher calendar only fetches its teacher's events, uses `{scope:'teacher', defaultTeacherId:teacherId}` and on creation falls back to that teacher ID. Teacher drag/resize requires the event's `groupId` and reports an error if absent. Site detail links should at least preserve the group/teacher filter and lesson form context when sharing CalendarPage.

Source group date query is `startDate`, `endDate`, `dateField:'startTime'`; teacher query is `limit:100`, `sort:'startTime'`, `order:'asc'`, `startDate`, `endDate`.

Batch schedule route: `/admin/groups/:id/schedule/create`, optionally `?saleId=:id`. Exact source folder `.../groups/[groupId]/schedule/create/components/` (`types.ts`, `schedule-form.tsx`). Fields: required `weekStartDate`; integer `weekCount` 1–52; `type` GROUP/PRIVATE; optional UUID teacherId/educationId; optional exclude dates; seven weekday toggles (IDs 1 Monday to 7 Sunday), each with add/remove start/end time pairs. Time format HH:mm; each end strictly after start. Must generate at least one lesson to preview. Preview → confirmation → save batch → group schedule. Dates normalize to the Monday of the selected week. With saleId, PRIVATE default and stored preferences can prefill education, start date, weekday slots and week count. Week count derives from WEEK value, MONTH ×4, or HOUR ÷ weekly slot count. This route exists, although no batch-create link is shown in the fetched group calendar header.

## Teacher personal details and actions

Exact source folder: `app/[locale]/(main)/admin/teachers/[teacherId]/_components/general/`.

- `personal-information.tsx`: inline edit/save/cancel for `tcNo`, `birthDate` (date → ISO), `birthPlace`, `gender` enum MALE/FEMALE/OTHER, `educationStatus`, `graduatedSchool`, `department`. All optional. Empty fields become undefined, invalid gender becomes undefined. No TCKN length/checksum rule exists here.
- `contact-information.tsx`: inline edit/save/cancel `address` textarea, `alternativeEmail` email input, `socialMedia` text.
- `certificates.tsx`: add/edit/remove certificate rows; `name` min 2 characters, `institution` min 2, `year` min 4 characters (source does not require exactly four numeric digits). Records save with the full personal-information object and certificate array.
- General page also includes Notes for `targetType='teacher'`, `targetId=teacherId`.
- Header phone action opens `QuickSMSForm` with `recipientType='teacher'`, selected number and hidden phone input. Current Site `tel:` is useful but not the same action. Header also shows branch, created and updated dates, ACTIVE/PASSIVE status.
- Related students table: name, areaCode+phone, email, student/potential label, created date, profile link. Source teacher groups page remains a placeholder.

Teacher create/edit form (`components/forms/admin/teacher-form.tsx`): name min 2, valid email, phoneNumber min 10, status ACTIVE/PASSIVE. Optional salary: amount >=0, type HOURLY/WEEKLY/MONTHLY, paymentDay 1–31. Site TeacherFields already represents these salary fields; do not duplicate them as an unimplemented create-form gap. Separate payment-page edit salary has a stricter positive-amount rule below.

## Teacher salary and payment history

Exact source folder: `app/[locale]/(main)/admin/teachers/[teacherId]/payments/` (`page.tsx`, `config.tsx`, `_components/edit-salary-dialog.tsx`, `payment-dialog.tsx`, `salary-history-table.tsx`, `salary-summary-cards.tsx`); hook: `hooks/main/teacher/branch-teacher.ts`.

Current salary summary: amount and HOURLY/WEEKLY/MONTHLY type description; payment day. Undefined salary must show “Tanımlanmamış”. Salary-info edit button opens:

| Field | Exact source rule/default |
| --- | --- |
| `amount` | number >=0.01, step 0.01; current amount or 0 |
| `salaryType` | HOURLY/Saatlik, WEEKLY/Haftalık, MONTHLY/Aylık; current or MONTHLY |
| `paymentDay` | number 1–31; current or 1 |

Saves teacher update payload `{salary:{amount,salaryType,paymentDay}}`; this changes the current salary setup, not a past payment row.

History record: `id`, `teacherId`, `totalAmount`, `paidAmount`, `remainingAmount`, `status` PENDING/PARTIALLY_PAID/PAID/CANCELLED, optional `paymentDate`, `dueDate`, optional `description`, optional metadata (`salaryType`, `calculatedHours`, `periodStart`, `periodEnd`), created/updated dates. Money is string-valued in source transport. History table columns: due date, total amount, salary type, calculated hours, status, payment action. Has pagination and CSV/JSON/Excel exports.

URL filters: `search`; multi `status` options all/PENDING/PARTIALLY_PAID/PAID/CANCELLED (default all); single `salaryType` all/MONTHLY/WEEKLY/HOURLY (default all); `sortOrder` dueDate:desc (default), dueDate:asc, totalAmount:desc/asc, status:desc/asc. Reset enabled.

Payment dialog: `paidAmount` >=0.01, step 0.01 (incremental payment entry); optional `paymentDate`, default today, input max today; optional `description` textarea. “Tamamını Öde” fills round((totalAmount − paidAmount) ×100)/100. Show total, paid, remaining; source accidentally swaps the paid/remaining Turkish labels, so implement correct arithmetic/labels rather than copying that display defect. Source schema does not cap payment at remaining or disable its action for paid/cancelled rows; additional constraints would be a deliberate UI safeguard, not source-derived. Submit converts provided date to ISO and updates the selected salary record via `/admin/teacher-salaries/:teacherId/salary/:salaryId`.

## Current model dependencies

Site `Teacher` only has identity, image, specialty, weeklyHours, status, optional salary and createdAt. It lacks personal/contact/certificates, updatedAt, salary history. Site `LearningGroup` lacks dated teacher assignments; student membership is a single group string. Add explicit persisted collections/optional structured fields before wiring views, and migrate existing head teacher and student-group strings into stable IDs without losing seeded data. Identity matching by names is currently used in teachers-page events and groups-page students; follow the Site's existing rename synchronization until the migration is complete.
