> Kaynak araştırma kaydıdır. Başlangıçtaki eksik listesi sonraki implementasyonla değişmiştir; güncel durum `../completion-2026-09-10.md` içindedir.

# Teacher / staff implementation contract — 2026-09-10

Authoritative source: `jamasterlms/jamaster-web`, commit `7810bd1720c57749f6d5249536ba015f2a53694f` (confirmed in `research/source-tree.json`). Source checkout and Site checkout were read only. Missing source files were fetched through GitHub at that exact commit and cached separately in `research/teacher-staff-source-2026-09-10/`. All paths below are repository-relative unless explicitly local.

## Priority gaps against current React UI

1. **Teacher route coverage:** local `src/features/education/detail-navigation.tsx` only exposes general/history. In `src/app/page-router.tsx`, unhandled teacher child routes fall through to `TeachersPage` without detailId and therefore show the list. Add explicit students, groups, activities, payments, and history/audit dispatch plus redirects.
2. **Teacher general:** local `teachers-page.tsx` shows email/phone and six name-matched events. Source requires personal fields, supplementary contact fields, certificate CRUD, and teacher notes. Add ID-keyed personal data, preserving unrelated fields on edit.
3. **Staff permissions/password:** local `administration/team-page.tsx` has no permissions/password model or controls. Source staff form includes creation password, accessible branch IDs, per-branch manager/presets, and 30×4 permission matrix. Permission configuration must not masquerade as enforced server authorization.
4. **Teacher payments:** local Teacher.salary is merely current salary configuration. Source has a separate salary ledger with server-calculated rows and payment mutation; do not generate payable rows or pretend payouts occurred.
5. **History and relationship integrity:** source schedule and audit queries use teacherId. Avoid matching teacher names (current detail/workload code does so), and keep local edit history distinct from actual server audit records.

## Teacher routes and header

Source `app/[locale]/(main)/admin/teachers/[teacherId]/layout.tsx`: six tabs, in order:

| Route suffix | Turkish label | Content                                       |
| ------------ | ------------- | --------------------------------------------- |
| none         | Genel         | Personal/contact/certificates/notes           |
| students     | Öğrenciler    | Active students table                         |
| groups       | Gruplar       | Explicit “Gruplar yakında burada” placeholder |
| activities   | Aktiviteler   | Activities of groups the teacher runs         |
| payments     | Ödeme         | Current salary + salary ledger                |
| history      | Geçmiş        | `?tab=schedule` (default) or `?tab=audit`     |

Source `lib/detail-route-redirects.ts`: `personal→base`, `notes→activities`, `salary→payments`, `schedule→history?tab=schedule`; Turkish aliases `ogrenciler→students`, `gruplar→groups`, `aktiviteler→activities`, `odeme→payments`, `gecmis→history`. Preserve repeated query params. Schedule redirect forces schedule tab while retaining other params. Unknown history tab resolves to schedule.

Header (`_components/teacher-detail.tsx`): name, ACTIVE/PASSIVE badge, branch.name, email, phoneNumber, createdAt, updatedAt. Edit link `/admin/teachers/form?teacherId=ID`; email action `/admin/email/create?email=EMAIL`; phone opens QuickSMSForm recipientType teacher with phone hidden. No SMS/email transport may be claimed without integration.

Teacher record (`hooks/main/teacher/branch-teacher.ts`):
`{id,name,email,phoneNumber,status:'ACTIVE'|'PASSIVE',branchId?,createdAt?,updatedAt?,branch?:{id,name},currentSalary?:{amount:string,salaryType:'HOURLY'|'WEEKLY'|'MONTHLY',paymentDay:number}}`.
Local fields `image,specialty,weeklyHours` have no backing fields in this source DTO. Local `İzinli` is not a source teacher status. Keep display-to-wire mapping explicit: Aktif→ACTIVE, Pasif→PASSIVE; staff Pasif maps INACTIVE instead.

Teacher form query `teacherId` and optional `phoneNumber`; source looks up phone using GET `/admin/teachers/phone/:phoneNumber`. Name ≥2 chars, valid email, phoneNumber ≥10 chars, ACTIVE/PASSIVE. Optional salary: amount ≥0, salaryType enum, paymentDay 1..31. Create defaults include zero MONTHLY salary/day 1. POST `/admin/teachers`, PUT `/admin/teachers/:id`; both accept salary, then navigate returned id. Source form prioritizes found teacherByPhone over teacherById but mutation mode depends on teacherId; do not replicate accidental duplicate/update ambiguity. Local normalized phone/email and duplicate checks are stronger local behavior, not proven source server requirements.

## Personal record, certificates, notes

Sources: `hooks/main/teacher/teacher-personel.ts` and `.../[teacherId]/_components/general/{personal-information,contact-information,certificates}.tsx`.

GET/PUT `/admin/teacher-informations/:teacherId/personal`; query key `['teacherPersonal',teacherId]`; successful writes invalidate teacherPersonal prefix.
Record `{id,teacherId,tcNo,birthDate,birthPlace,gender,educationStatus,graduatedSchool,department,address,alternativeEmail,socialMedia,certificates,createdAt,updatedAt}`.
Update DTO is partial, excluding identity/timestamps in the TypeScript contract.

| Field            | Label / control              | Source validation/conversion            |
| ---------------- | ---------------------------- | --------------------------------------- |
| tcNo             | TC Kimlik No / text          | No format validation in source          |
| birthDate        | Doğum Tarihi / date          | ISO on save; ISO YYYY-MM-DD for editing |
| birthPlace       | Doğum Yeri / text            | Free text                               |
| gender           | Cinsiyet / select            | MALE=Erkek; FEMALE=Kadın; OTHER=Diğer   |
| educationStatus  | Eğitim Durumu / text         | Free text, no degree enum               |
| graduatedSchool  | Mezun Olduğu Okul / text     | Free text                               |
| department       | Bölüm / text                 | Free text                               |
| address          | Ev Adresi / textarea         | Free text                               |
| alternativeEmail | E-posta (Alternatif) / email | No explicit schema in source            |
| socialMedia      | Sosyal Medya / text          | Free text                               |

Click displayed field to edit; explicit save/cancel. Source spreads current data + changed field + existing certificates. Helper strips undefined/null/empty-string values and converts birthDate to ISO; consequently **clearing a field is not a confirmed server contract**. A new local form can clear its own draft, but do not imply backend deletion is supported without evidence.

Certificate: `{id?:string,name:string,institution:string,year:string}`. Name and institution length≥2; year length≥4 (translation says four digits, schema does NOT enforce numeric/exact four). Add/edit/delete all replace entire certificates array via personal PUT; preserve certificate IDs and unrelated personal data. Source component indexes edits/deletes, provides inline forms, empty text “Henüz sertifika eklenmemiş”. There is no file-upload/attachment contract. Source has a state-before-mutate timing hazard; use mutation arguments in new implementation instead of reading pending state set in the same event.

General `page.tsx` also renders `<Notes targetId={teacherId} targetType="teacher"/>`; independent teacher notes relationship, not certificates or activity records. Notes API was outside this bounded trace.

## Students, groups, activities

Students GET `/admin/teachers/:id/students`; query key `['teacher',id,'students',params]`; source page passes no filtering params and uses returned array, no add/remove enrollment controls. Type: `id,name,areaCode?,phone,email,studentNumber,status,createdAt,educationInfo?.level` plus optional branch data. Columns name, concatenated areaCode+phone, email, status, createdAt, detail link `/admin/students/:id`. Source type status is STUDENT|EMPLOYEE|UNEMPLOYED but UI displays STUDENT as Öğrenci and every other value as Potansiyel—do not infer true lead/enrollment classification from that mismatch. Endpoint's relationship internals are unproven; do not invent teacher↔student assignments from names.

Groups source `groups/page.tsx` has no query: “Öğretmenin dönem bazlı grup atamaları, program-dönem grubu planlaması tamamlandığında burada görünecek.” Existing local group-teacher assignment data may be shown only as actual local records with its known IDs.

Activities GET `/admin/activities/by-teacher/:teacherId` (`hooks/main/activities.ts`), paginated. Teacher activities read only, detail link `/admin/activities/:id`. Columns title,type,status,groupId→group name,dueDate,actions. Groups lookup limit 100. Filters both multiselect:

- type: EXAM, QUIZ, ASSIGNMENT, PROJECT, PRESENTATION, DISCUSSION, PRACTICE, HOMEWORK, LAB, READING, VIDEO, RESOURCE.
- status: DRAFT, PUBLISHED, SCHEDULED, ACTIVE, CLOSED, ARCHIVED.
  Empty unfiltered result says no activities; filtered empty result retains table/pagination. Source config under `.../activities/config.tsx`.

## Teacher salary/payment contract

Sources `hooks/main/teacher/branch-teacher.ts`, `.../[teacherId]/payments/{page,config}.tsx` and `_components/*`.

Current salary is teacher.currentSalary; show amount and salaryType description, paymentDay; missing salary “Tanımlanmamış”. Editing current configuration PUT `/admin/teachers/:id` with `{salary:{amount,salaryType,paymentDay}}`; this dialog amount≥0.01 (stricter than teacher create form ≥0), HOURLY/WEEKLY/MONTHLY, day 1..31.

GET `/admin/teacher-salaries/:teacherId/salaries`, paginated:
`{id,teacherId,totalAmount:string,paidAmount:string,remainingAmount:string,status,paymentDate?,dueDate,description?,metadata?:{salaryType?,calculatedHours?,periodStart?,periodEnd?},createdAt,updatedAt,teacher?:{id,name,email}}`.
Status: PENDING, PARTIALLY_PAID, PAID, CANCELLED.
Columns dueDate (source labels this Ödeme Tarihi), totalAmount, metadata.salaryType, calculatedHours, status, payment action. CSV/JSON/Excel exports. Filters search description, status multiselect, salaryType single, sort dueDate/totalAmount/status asc/desc. Filter default indicates dueDate desc; generic URL defaults start createdAt desc, so avoid accidental inconsistent default display/query.

Payment form amount≥0.01; optional date defaults today and input max today; optional description. “Tamamını Öde” fills round((total-paid)\*100)/100. PUT `/admin/teacher-salaries/:teacherId/salary/:salaryId` body `{paidAmount:number,paymentDate?:ISO,description?:string}` (API additionally allows status). Server success invalidates teacher query prefix. Source does not enforce max remaining or clarify backend additive-versus-replacement semantics: entered amount is passed directly; do not manufacture financial ledger logic.

Source bug: payment dialog captions for paid/remaining are reversed while values are paidAmount and total-paid. Correct captions. Source shows payment action even for PAID/CANCELLED; validate applicability with backend, do not imply successful server action locally.

Global salary APIs also exist: GET `/admin/teacher-salaries/salaries` and `/admin/teacher-salaries/salaries/summary`. Summary fields activeTeachersCount,thisMonthPaidSalaries,thisMonthPendingSalaries,lastThreeMonthsTotal,totalMonthlySalaryAmount,totalHourlySalaryAmount,totalWeeklySalaryAmount.

## History

Schedule GET `/admin/teachers/:teacherId/schedule` with limit100,sort=startTime,order=asc,startDate,endDate based on visible date range (+14-day range helper). Desktop timeGridWeek, mobile listWeek, default view interaction; explicit edit mode enables add/drag/resize. Events: `id,type:'GROUP'|'PRIVATE',teacherId,groupId?,studentId?,educationId?,title?,startTime,endTime,status:'active'|'cancelled',location?:{latitude,longitude,radius},group?,student?,createdAt,updatedAt`. Render relationship names from nested objects, preserve IDs in event props. Lesson create defaults teacherId; actual mutations use group schedule POST `/admin/group-schedules/:groupId`, PUT/DELETE `/admin/group-schedules/:groupId/:scheduleId`. Drag requires groupId. Existing local CalendarPage can supply local editing but not backend scheduling claims.

Audit GET `/admin/audit-logs/teachers/:teacherId`, paginated. `AuditLog={id,actorUserId,actorName:string|null,action,succeededCount,failedCount,createdAt}`. Columns actor (deleted-user fallback), raw action, success/partial result counts, timestamp. Source is read only; no pretend actor/action rows. Query key `['audit-logs','teacher',teacherId,params]`.

Generic queries (`lib/query.ts`, `components/common/filters.tsx`): page1,limit10,sort=createdAt,order=desc defaults; multiselect repeated keys (`status=A&status=B`), drop empty/all. UI sortOrder splits into sort and order. startDate at local day start, endDate at local day end, both serialized ISO.

## Staff form / permissions

Sources `app/[locale]/(main)/admin/staff/form/page.tsx`, `components/forms/super/user-form.tsx`, `hooks/main/staff.ts`, `lib/constant.ts`, `messages/tr/super/permissions.json`.

Route create `/admin/staff/form`; edit `/admin/staff/form?staffId=ID`; successful submit returns `/admin/staff`. GET/POST `/admin/users/staff`; GET/PUT `/admin/users/staff/:id`.
Staff record: `id,name,email,phone?,status:'ACTIVE'|'INACTIVE'|'BLOCKED',globalRole:'USER',createdAt?,updatedAt?,deletedAt?,staffSalary?,salaryBranchId?,salaryBranch?:{id,name},branchPermissions?:{branchId,role,resources:Record<resource,Record<action,boolean>>,branch?:{id?,name?,slug?}}[]`.

Form required name≥1,email valid,phone≥1,accessibleBranches nonempty string[]. Password create≥6; edit blank/omitted preserves existing, otherwise≥6. Password input/generate control exists; never persist plaintext password in local row metadata or simulate account creation.

Form branchPermissions: `{branchId,permissions:string[],isManager?:boolean}[]`, optional. Convert existing BRANCHADMIN to isManager true, otherwise flatten enabled resource/action booleans. Source staff page presents only current branch. On submit choose staff.salaryBranchId or current branch.id; salary guard auto-switches accessible branch and aborts that submission if wrong branch, refuses missing/inaccessible target. Then submit accessibleBranches=[targetId], normalize every permission entry branchId=targetId. Create sends full form/status default ACTIVE/salary; update body only name,email,phone,status,staffSalary,password-or-undefined,branchPermissions.

Local current tuple rows: [name,role,branch,createdDate,status,id,phone,email,JSONmetadata]. Extend metadata carefully, preserve staffSalary and unknown metadata. Existing free-text role is not server permission authorization.

Permission behavior:

- Branch checkbox removal also removes corresponding branchPermissions.
- Manager on selects all permissions and hides custom matrix; manager off clears all.
- Preset selection replaces branch list; “Özel yetkiler” (none) clears it.
- Category select toggles all four actions. Individual create/edit/delete automatically implies same resource.view; view cannot effectively be removed while other actions remain.
- Preset matching requires exact sorted equality; manager has no preset.
- These are configuration semantics, not proof that a local app enforces actual account permissions.

All **30** resources have actions in UI order `view,create,edit,delete`:
`audit-logs,branch-payments,branch-settings,courses,contracts,email,email-templates,expense,groups,payments,polling,pricing,reports,bill-report,collection-report,meeting-report,note,overdue-report,sales-report,sales,schedule,settings,sms,sms-templates,students,student-advanced-sale,student-advanced-education,teachers,transfer,verification`.
Translation file has whatsapp keys too, but they are NOT in source allPermissions. Do not add them to matrix.

Exact presets (v=view,c=create,e=edit,d=delete):
| Preset | Label | Resources/actions |
| --- | --- | --- |
| SALES_CONSULTANT | Satış Danışmanı | sales:vce; students:vce; contracts:vce; payments:vc; meeting-report:vc |
| STUDENT_CONSULTANT | Öğrenci Danışmanı | students:vced; contracts:vce; groups:v; schedule:v; payments:vce; email:vc; sms:vc |
| ACCOUNTING | Muhasebe | payments:vced; expense:vced; reports:v; bill-report:v; collection-report:v; sales-report:v; overdue-report:v; branch-payments:vce |
| EDUCATION_COORDINATOR | Eğitim Koordinatörü | courses:vced; groups:vced; schedule:vced; teachers:vce; students:vce |
| STANDARD_USER | Standart Kullanıcı | all resources vce EXCEPT audit-logs/verification omitted, branch-payments vc, student-advanced-sale v, student-advanced-education v |

Staff salary form optional fields: salaryType WEEKLY|MONTHLY only; baseAmount≥0; commissionRate 0..100 UI, divide100 API; paymentDay integer1..31; commissionBasis COLLECTION|TURNOVER. Defaults MONTHLY,0,0,1,COLLECTION. Read rate multiplies100. Staff response type permits HOURLY but form coerces unsupported type to MONTHLY.

## Integration boundary

This is frontend source evidence, not backend implementation evidence. Safe local work: exact forms, validation, route behavior, persisted local teacher personal/certificate records, ID-based relationships already present, and clearly local permission configuration. Do not fabricate server audit events, payroll accruals/payments, password/auth success, notifications, or unknown teacher-student relationship data. Preserve explicit unavailable/empty/error states until an authenticated backend is actually connected.
