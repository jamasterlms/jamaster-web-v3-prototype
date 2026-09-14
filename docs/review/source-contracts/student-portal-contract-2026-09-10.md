> Kaynak araştırma kaydıdır. Başlangıçtaki eksik listesi sonraki implementasyonla değişmiştir; güncel durum `../completion-2026-09-10.md` içindedir.

# Student detail and student/teacher portal contracts

Source: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`.
Inspected 2026-09-10. Read-only research; no Site files were modified.
Source root in this workspace: `research/source/`. Paths below are relative to that root.
Target inspected: `/workspace/sites/jamaster-workspace-ui/src/app/page-router.tsx` and `src/features/students/student-page.tsx`.

## Immediate implementation findings

1. The canonical student detail has six full pages: root/general, groups, payments, activities, documents, history. It also has twelve legacy redirect pages. Do not count redirect files as missing full screens.
2. Actual student note CRUD lives on the general/root page. The legacy `/notes` URL nevertheless redirects to `/activities`; this is explicit source behavior.
3. Source activities are academic activities assigned through student groups, with submission and grade data. They are not a student note feed.
4. Target router currently recognizes numeric student IDs and only root, payments, groups, history, polling-history. Activities, documents and eleven other legacy redirects are absent. Target history handles polling specially and otherwise renders meeting cards regardless of other `tab` values. General currently renders student summary/profile and meetings, without the source's inline information editors and embedded note CRUD.
5. Source IDs in page params/hooks are strings, not inherently numeric. Preserve the distinction between student UUID/entity ID and studentNumber.
6. Both portals are separate authenticated audience layouts. Student has six full pages plus root redirect; teacher has seven full pages plus root redirect. Target router contains no explicit student/teacher portal branches.
7. Do not infer backend permissions from the frontend. Teacher hooks explicitly document session-scoped self-service endpoints; no admin branch header or teacherId selector. Student activity types deliberately omit internal staff/other-student fields, but the source itself says this does not prove server serialization is safe.

## Exact route inventory

All admin routes below use prefix `/admin/students/:studentId`.

| Suffix                 | Classification | Exact destination or content                                                                  |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| (root)                 | Full page      | General information, contact, education, Notes, DeleteStudent                                 |
| /groups                | Full page      | Current groups, add/remove, group history                                                     |
| /payments              | Full page      | Tabs courses (default), saleHistory, installments                                             |
| /activities            | Full page      | Student academic activities table                                                             |
| /documents             | Full page      | Signed sale documents, preview, create-senet navigation                                       |
| /history               | Full page      | Tabs meetings (default), schedule, sms, whatsapp, whatsappConversation, email, polling, audit |
| /personal              | Redirect       | Root, preserving query                                                                        |
| /notes                 | Redirect       | /activities, preserving query                                                                 |
| /group                 | Redirect       | /groups, preserving query                                                                     |
| /sales                 | Redirect       | /payments?tab=saleHistory                                                                     |
| /installments          | Redirect       | /payments?tab=installments; rename secondTab to installmentsTab                               |
| /meetings              | Redirect       | /history?tab=meetings                                                                         |
| /schedule              | Redirect       | /history?tab=schedule                                                                         |
| /email-history         | Redirect       | /history?tab=email                                                                            |
| /sms-history           | Redirect       | /history?tab=sms                                                                              |
| /whatsapp-history      | Redirect       | /history?tab=whatsapp                                                                         |
| /whatsapp-conversation | Redirect       | /history?tab=whatsappConversation                                                             |
| /polling-history       | Redirect       | /history?tab=polling                                                                          |

Redirect rules: preserve repeated and unrelated query parameters. A destination tab overrides legacy `tab`. For installments, `secondTab` is removed; its first value becomes `installmentsTab` when truthy. Root/personal, notes, and group redirects preserve even `tab` unchanged. Source wrapper uses `redirect` from `next/navigation` with the generated unprefixed path, not a new full page. Proof: `lib/detail-route-redirects.ts` and every `app/[locale]/(main)/admin/students/[studentId]/**/page.tsx`.

| Portal URL                                  | Classification | Content                                                              |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| /student                                    | Redirect       | /student/dashboard                                                   |
| /student/dashboard                          | Full page      | Active term, enrolled groups, upcoming activities, recent grades     |
| /student/courses                            | Full page      | Enrolled course/group cards                                          |
| /student/courses/:groupId                   | Full page      | Overview and Activities tabs                                         |
| /student/activities                         | Full page      | Filtered activity list                                               |
| /student/activities/:activityId             | Full page      | Instructions, latest submission, submission form                     |
| /student/grades                             | Full page      | Term selector, averages, chart, group grade accordions               |
| /teacher                                    | Redirect       | /teacher/dashboard                                                   |
| /teacher/dashboard                          | Full page      | Pending grading, assigned groups, upcoming activities, announcements |
| /teacher/courses                            | Full page      | Assigned group cards                                                 |
| /teacher/courses/:groupId/students          | Full page      | Assigned group's students and average grades                         |
| /teacher/activities                         | Full page      | Activity list, create/edit dialog, publish                           |
| /teacher/activities/:activityId/submissions | Full page      | Submission grading and CSV export                                    |
| /teacher/grade-overview/:groupId            | Full page      | Group grade metrics table and CSV                                    |
| /teacher/announcements                      | Full page      | Announcement cards and create dialog                                 |

No standalone `/student/announcements`, `/student/schedule`, `/teacher/courses/:groupId`, `/teacher/grades`, or `/teacher/activities/:activityId` page exists in this source tree. Do not invent these aliases as source routes.

## Admin student common shell and general page

Source: `app/[locale]/(main)/admin/students/[studentId]/layout.tsx`, `_components/student-detail.tsx`, `page.tsx`, `_components/general/*`.

The persistent header shows avatar, name, active/inactive status, individual/corporate student type, studentNumber, education level/sublevel, primary branch, email, phone, advisor, birth date, and optional feedback cards. Empty optional values are omitted.

Header actions:

- Grant access opens `_components/access-dialog.tsx`: required branchId, searchable branch list excluding the student's existing branch IDs; POST `/admin/students/:id/access` with {branchId}. This is access, not student transfer. A note exists in schema/defaults but is not rendered or submitted.
- Add course links `/admin/sales/:studentId`.
- Update links `/admin/students/register?studentId=:id`.
- Meeting opens shared MeetingDialog prefilled with student identity.
- Email links `/admin/email/create?email=...`; phone opens QuickSMSForm with recipientType student and hidden phone field.

Canonical navigation order: general, groups, payments, activities, documents, history.

Each information section uses one-field-at-a-time click-to-edit, check/save, X/cancel; displays '-' for empty values; shows loading and error states. BranchRequiredAlert wraps the editable sections. Do not assign unproven role gates.

| Section   | Exact fields                                                                                     | Options and behavior                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Personal  | identityNumber, birthDate, birthPlace, gender, bloodType, maritalStatus, occupation              | birthDate date input; gender MALE/FEMALE; bloodType A/B/AB/O positive/negative enum; maritalStatus SINGLE/MARRIED/DIVORCED/WIDOWED                                                                                           |
| Contact   | phone, secondPhone, email, address                                                               | PhoneInput/PhoneDisplay; email input; address textarea                                                                                                                                                                       |
| Education | courseType, level, subLevel, dayPreference, timePreference, source, status, institution, company | courseType GROUP/INDIVIDUAL; day WEEKDAY/WEEKEND/ALL_WEEK/CUSTOM; time MORNING/NOON/EVENING/LATE_EVENING/NIGHT/CUSTOM; source creatable; status STUDENT/EMPLOYEE/UNEMPLOYED; institution only STUDENT, company only EMPLOYEE |

Education level and subLevel edit together. Status change sends new status plus institution:'' and company:'' to clear previous affiliation. Only changed values are sent. Source/institution/company choices store names, sourced from their own lists.

GET and PUT endpoints use `/admin/student-informations/:id/{personal-information|contact-information|education-information}`; choices use `/admin/student-informations/{sources|institutions|companies}`. Exact data types: `hooks/main/student/branch-student-personel.ts`.

Deletion: ACTIVE student shows a warning instead of delete action. Otherwise confirmed deletion; pending/loading disables action; success navigates to /admin/students. No additional role check in this component.

### Embedded Notes contract

Source: `components/notes/{index,note-card,note-dialog-form,note-config}.tsx`, `hooks/main/notes.ts`.

- Note identity: id, targetId, targetType, title, content, createdBy, createdAt, updatedAt.
- Student usage fixes targetId to student entity ID and targetType to 'student'.
- New/edit modal fields: title required length 1–255; content required length 1–10000; hidden targetId/targetType. Pending disables submit/cancel/fields. Success closes/reset dialog and refreshes notes.
- Note cards show title, content preview, created date; modified date when updatedAt differs. Edit and confirmed destructive delete actions.
- Search query plus sort by title, createdAt, updatedAt ascending/descending; default createdAt descending. Pagination and first-note empty-state action.
- GET list `/admin/notes/:targetId`, POST `/admin/notes`, PUT/DELETE `/admin/notes/:noteId`.
- Source getNoteById and list happen to share URL shape; don't invent a second backend path.

## Admin student Activities

Source: `.../activities/page.tsx`, `.../activities/config.tsx`, `hooks/main/activities.ts`.

Table columns: title, type, group name resolved from groupId, dueDate, activity status, submission status, grade, detail action to `/admin/activities/:activityId`.

Types: EXAM, QUIZ, ASSIGNMENT, PROJECT, PRESENTATION, DISCUSSION, PRACTICE, HOMEWORK, LAB, READING, VIDEO, RESOURCE.
Activity status: DRAFT, PUBLISHED, SCHEDULED, ACTIVE, CLOSED, ARCHIVED.
Both filters are multi-select URL filters with all and reset. Paginated response supplies page/limit/totalPages/totalItems.
No add-activity or add-note form is mounted here.

Grade rendering: letterGrade first; else if numeric grade absent, percentage as %value when present; else dash; numeric grade with maxGrade shows grade / maxGrade. Null submission renders NOT_SUBMITTED, not a fabricated submission record or grade zero.
Unfiltered empty list explains no group activities; filtered empty list remains ordinary filtered table empty state. Backend query GET `/admin/activities/by-student/:studentId` is student-scoped via useActivitiesByStudentQuery; group names fetched once (limit 100).

## Admin student Documents

Source: `.../documents/{page,config}.tsx`, `.../documents/_components/signed-document-view-dialog.tsx`, `hooks/main/signed-document.ts`.

Data fields: id, saleId, installmentId nullable, documentType, version, encryptionStatus, signedByStudent, signedByAuthority, signerName, authorityName nullable, signedAt, createdAt; sale enrichment courseName, paidAmount, paymentType.
Table shows documentType, courseName, paidAmount as currency, signerName, signedAt, encryptionStatus, View action.
documentType values BONO (Bono), TAHHUTNAME (Taahhütname), SALE_CONTRACT (Sözleşme); encryption PENDING/ENCRYPTED/FAILED.

Filters: search; document_type selector; sortOrder signedAt desc/asc or createdAt desc/asc (default signedAt:desc). Pagination; CSV/JSON/Excel export.
View opens large responsive dialog mounting SenetExistingDocumentPreview(documentId,isActive=open), which delegates to the existing-document hook/viewer. Do not replace signed documents with arbitrary uploaded attachments.
Create Senet button disabled while no eligible sales; dropdown only sales without documents, each labeled course + amount/paymentType; selecting links to this student's /payments?tab=saleHistory. It does not immediately generate/sign anything.

GET `/admin/students/:id/signed-documents` with filters; GET `/admin/students/:id/sales-without-documents`; downloaded document URL `/admin/signed-documents/:documentId/download`.

## Admin student History / communication contracts

Source: `.../history/page.tsx` and all `.../history/_components/*`.
Tab query determines active child; default meetings. Switching tab clears page, limit, search, sort, order, startDate, endDate to prevent cross-tab filter contamination. This exact list does not include arbitrary other keys.

| tab                  | Fields/content                                                                                                                                   | Actions/filters                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| meetings             | advisor.name, branch.name, meetingType, meetingResult, meetingDate, meetingDateResultStatus, createdAt, meetingNote                              | New MeetingDialog; search; createdAt or meetingDate asc/desc; exports; pagination. CALLBACK/APPOINTMENT/SMS_NOTIFICATION/EMAIL_NOTIFICATION rows have confirmed COMPLETED/null toggle                     |
| schedule             | Student-scoped GROUP/PRIVATE lessons; title, start/end, status, group, teacher, student, education, location                                     | Calendar navigation/view/fullscreen; default view mode; edit mode enables create/update/delete, range select and quick drag/resize using shared lesson dialog/CRUD. Desktop timeGridWeek, mobile listWeek |
| sms                  | createdAt, phoneNumber, sms.title, sms.content, status, sms.sender.name                                                                          | Search; createdAt/status asc/desc; compose /admin/sms/create?phone=...; detail /admin/sms/:id; exports, pagination                                                                                        |
| whatsapp             | createdAt, phoneNumber, whatsapp.title, whatsapp.content, status, whatsapp.sender.name                                                           | Same sort/search/export/pagination pattern; compose /admin/whatsapp/create?phone=...; detail /admin/whatsapp/:id; requires whatsapp setting                                                               |
| whatsappConversation | conversation.phoneNumber, providerHealthy, messages by inbound/outbound direction; textBody or templateName, status                              | Scrollable conversation; reply textarea trims nonempty message; send disabled empty/pending; success clears message and reports queued. Requires whatsapp setting                                         |
| email                | createdAt, emailAddress, email.title, email.content (view dialog), status, email.senderName                                                      | Search; createdAt/status asc/desc; compose /admin/email/create?email=...; detail /admin/email/:id; exports, pagination                                                                                    |
| polling              | Total polls and overall/monthly/weekly present/absent/rate metrics; schedule dates/time, group name/level/sublevel/room, attendance, checkInTime | startDate/endDate range, exports, pagination. Display present if checkInTime; waiting until lesson ends; absent afterward with no check-in                                                                |
| audit                | actorName (deleted-user fallback), action, succeeded/failed result counts, createdAt                                                             | Paginated student resource audit log, explicit empty/error/loading. No mutation action                                                                                                                    |

SMS, WhatsApp and email histories are different data models, not a single fabricated generic message event. WhatsApp provider health is informational in the source; send is only gated by pending/nonempty message, plus setting wrapper. Do not silently add a provider-health block and label it source behavior.

Groups/payments already have substantial target implementation, but preserve source canonical routing: groups has active membership cards plus add/remove and historical table; payments default tab courses and sibling saleHistory/installments, with the same generic filter reset keys as History. Existing broader research documents cover deeper finance/group actions.

## Student portal

Source: every `app/[locale]/student/**/page.tsx`, related components, `hooks/main/student-portal.ts`, `student-activities.ts`, `student-activity-submissions.ts`.

Layout: TenantProvider audience='student', useSession('student') auth guard. Missing user after load replaces to /login; loading/no-user displays skeleton. Header has Jamaster home, dashboard/courses/activities/grades, user name, useAuth('student').logout. Mobile student nav is hidden below md in source. Main max width 5xl, pale background.

| Page            | Data and UI                                                                                                                                                                | Interactions and limits                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard       | activeTerm name/start/end or no-active-term text; enrolledGroups id/name/teacherName; upcomingActivities id/title/dueDate/groupName; recentGrades activityTitle/percentage | Group links course detail; upcoming links activity detail; each collection has own empty state; null grade percentage is dash     |
| Courses         | Group cards name, teacherName, room, programTermName                                                                                                                       | Whole card links course detail; no enrollment action                                                                              |
| Course detail   | group name + term badge; overview teacherName/room; Activities tab                                                                                                         | Tabs default overview, local state; groupId-filtered activities query limit 50; rows title/dueDate/type and activity detail links |
| Activities      | title/dueDate/type/status rows                                                                                                                                             | Local type/status selectors; limit 50 sorted dueDate ascending; no pagination control rendered; detail links                      |
| Activity detail | title/type badge, instructions preformatted, maxPoints; latest submission = submissions[0], submittedAt, grade/max                                                         | SubmissionForm always included unless status CLOSED or ARCHIVED; no administrative editor                                         |
| Grades          | active/selected term, average+letter, group-average bar chart (0–100), group accordions                                                                                    | Term selector; groups show activity title/type/grade/maxGrade/percentage/letterGrade; no term and no grades distinct empty states |

Activity filter offers all plus the same 12 academic types listed above. Status filter offers all/PUBLISHED/ACTIVE/CLOSED only (not admin's draft/scheduled/archived choices). These sets are defined in local activity-type-filter/status-filter components. Submission form:

- Textarea only when activity.requireText.
- Multi-file UploadSection only when requireFile; source accepts '\*'.
- Payload {activityId,textSubmission?,files?}; each file carries URL, basename, size:0, type:'application/octet-stream'. Do not claim these placeholder metadata values are measured.
- CLOSED/ARCHIVED shows closed message. Otherwise button disables only while pending; source form does not locally enforce text/file required, due-date lateness, or max-submission count. These are backend responsibilities/unknowns here.
- Success clears input/files and refreshes student submissions. Existing submissions do not hide the form.
- API supports submissionLinks, but current form exposes no links input.

GET endpoints: /student/dashboard, /student/program-term-groups, /student/program-term-groups/:groupId, /student/grade-report?programTermId=..., /student/terms, /student/activities, /student/activities/:id, /student/activity-submissions/by-activity/:activityId.
POST submission: /student/activity-submissions.

StudentActivity type omits specificStudents, createdById, updatedById, anonymousGrading, peerReviewEnabled, rubric from Activity. Source explicitly calls this a TypeScript defense only, not evidence that backend response omits these fields.

## Teacher portal

Source: every `app/[locale]/teacher/**/page.tsx`, related components, `hooks/main/teacher-portal.ts`.

Layout/session behavior parallels student but audience/useSession/useAuth='teacher'. Nav: dashboard, courses, activities, announcements. These routes use self-service endpoints with teacher scope taken from session. Source comments say assigned-group/activity access not found and unauthorized both return 404; this repository's frontend is not a backend access audit.

| Page            | Data and UI                                                                                                                                                                                             | Actions                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard       | pendingGradings submissionId/activityId/title/studentName/submittedAt, pendingGradingCount; assignedGroups name/studentCount; upcoming activity title/group/date; recent announcement title/publishedAt | Pending/upcoming link submissions; groups link course students. Badge uses pendingGradingCount, not truncated list length (list first 5). Dashboard refetches on window focus and after all teacher mutations |
| Courses         | name, programTermName or no-term fallback, studentCount                                                                                                                                                 | View students; grade overview                                                                                                                                                                                 |
| Course students | group name; rows student name/averageGrade                                                                                                                                                              | Back to courses. Empty/not-found/skeleton. No add/remove student, contact data, or admin student link rendered                                                                                                |
| Activities      | title, assigned group name, type, status, dueDate                                                                                                                                                       | Status filter all/DRAFT/PUBLISHED/CLOSED/ARCHIVED; page1/limit10; new/edit; submissions link; Publish only DRAFT/SCHEDULED                                                                                    |
| Submissions     | Activity title/status/maxPoints; student name+number, submission status/date, grade, feedback                                                                                                           | Filter pending/late/graded/all, grading per row, CSV export, pagination, back                                                                                                                                 |
| Grade overview  | group name/activityCount; studentName, submittedCount, gradedCount, pendingCount, missingCount, averageGrade, averagePercentage                                                                         | Pending positive secondary badge, missing positive destructive badge; null averages as ungraded; CSV all displayed rows, disabled if empty; back                                                              |
| Announcements   | title, group name or branch-wide label, createdAt, body                                                                                                                                                 | New announcement; pagination page1/limit10, createdAt descending. No edit/delete controls                                                                                                                     |

### Teacher activity create/edit dialog

Required title, assigned groupId, activity type, grading method. Types: HOMEWORK, ASSIGNMENT, QUIZ, EXAM, PROJECT, PRESENTATION, PRACTICE, READING, DISCUSSION, LAB, RESOURCE, VIDEO.
Grading methods offered: POINTS, PERCENTAGE, LETTER, PASS_FAIL. RUBRIC/CUSTOM not offered because the form cannot author their required structures; editing existing unsupported method displays locked original method (never silently switches to POINTS).

Other fields: maxPoints positive integer, required except PASS_FAIL; dueDate datetime-local; description; instructions; allowLateSubmission switch.
Defaults: HOMEWORK, POINTS, maxPoints 100, allowLateSubmission false.
Create results DRAFT according to source comment; publish is separate.
Payload converts local dueDate to ISO; skips empty dueDate/description/instructions and omitted maxPoints. Thus source edit cannot necessarily clear those optional values; do not claim it does.
No form for requireText/requireFile/rubric/visibility/maxSubmissions/status shown here.

API GET/POST /teacher/activities; GET/PUT /teacher/activities/:id; POST /teacher/activities/:id/publish. Activities never use admin CRUD URLs.

### Teacher submissions/grading

Default filters page1, limit20, sort studentName ascending, pending=['SUBMITTED','LATE','RESUBMITTED']; late=['LATE']; graded=['GRADED']; all omits status. Changing filter resets page.
Fetch activity directly, not by searching one activity-list page.
404/missing assignment shows not-found; transient activity load errors show retry. Activity PUBLISHED/CLOSED only allows grade inputs; other statuses show explanation and lock inputs.

Per row grade: nonempty nonnegative integer and <= activity.maxPoints when max exists. Feedback optional trimmed string, always submitted even blank so prior feedback can be cleared. Save disabled when unchanged, row pending, or ungradable. Row key includes server grade/feedback to refresh changed fields without clobbering unaffected edits. Payload {grade,feedback}.
Optimistic row save sets status GRADED, temporarily nulls server-derived percentage/letterGrade; error restores only that row. Invalidate submissions for that activity, grade overview and dashboard on settlement. Do not derive percentage/letter grade locally as source-proven behavior.

CSV uses a separate request with current status filter, page1, limit1000, studentName ascending, columns student/name, studentNumber, status, grade. Source comment calls this all matching rows but code actually caps at 1000: preserve this caveat, do not promise unlimited export.
The rendered grading row does not show submitted text/files or rubric-specific inputs even though types can contain them. No invented submission-inspection UI.

API GET /teacher/activities/:activityId/submissions; PUT /teacher/activity-submissions/:id/grade; GET /teacher/grade-overview/:groupId.

### Teacher announcement creation

Required groupId from assigned groups, title, body (all minimum 1 char). Modal resets on open; pending disables submit/cancel; success closes and refreshes announcements+dashboard.
Payload {groupId,title,body}; source documents audience default STUDENTS, although type allows optional audience. No audience selector or isActive control. Creation cannot be branch-wide. List can display branch-wide items with null groupId.
API GET/POST /teacher/announcements. Group choices GET /teacher/program-term-groups; students GET /teacher/program-term-groups/:groupId/students; dashboard GET /teacher/dashboard.

## Explicit limitations and implementation priorities

- This is a pinned frontend contract audit, not proof of live API data, actual signed files, or backend permission enforcement. No fabricated student records, communication delivery, documents, grades, signatures, or memberships should be created as evidence.
- Several portal list pages lack explicit error branches and can render empty/skeleton on absent data. Better error handling is a reasonable improvement, but label it implementation judgment rather than source parity.
- First repair canonical/legacy route handling with full query preservation. Then add student general embedded notes and inline info, activities, documents, and all History tabs. Portals require separate audience layout and state scope, not the admin workspace menu with a different heading.
- Match source route IDs as opaque strings where possible; do not expand existing target numeric sample IDs into an assertion that all source IDs are numeric.
- Preserve source null/empty distinctions: no submission is not grade zero; missing grade is not failed grade; no term differs from no graded activities; provider status differs from send completion.
