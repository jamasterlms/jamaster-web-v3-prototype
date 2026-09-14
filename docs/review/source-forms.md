# Verified source form parity — 9 September 2026

Read-only comparison of `jamasterlms/jamaster-web` at commit `7810bd1720c57749f6d5249536ba015f2a53694f` with `/workspace/sites/jamaster-workspace-ui`. Exact source files were fetched through GitHub; the recursive repository tree confirmed all paths. No Site checkout was edited.

## Highest value corrections

1. Add the four missing **student profile** fields: gender, blood type, marital status, and free-text personal occupation. These do not appear in source registration; they belong in profile editing. Preserve the existing education employment category separately.
2. Replace plain source/institution/company fields with searchable creatable choices backed by existing local values. Source stores their names, not IDs: the earlier comparison document's broad “texts are not source IDs” claim is incorrect for these three fields.
3. Source registration has explicit unselected student type, course type, meeting type, and meeting result defaults; prototype silently chooses all four. Make these choices intentional if exact defaults are in scope.
4. Remove the added requirement for a negative reason and the score lock/forced score on save. Source sets the score to 1 when switching to NEGATIVE, then still allows the user to choose any score 1–5.
5. Add a yesterday-at-midnight lower bound to meeting datetime fields (including registration). Source uses that bound in input/calendar UI.
6. Save group/teacher forms to their detail routes, preserving the generated ID. Source create and update both navigate to detail; prototype create returns to the list.

## Exact source references

Base URL: `https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/`

- `app/[locale]/(main)/admin/students/register/page.tsx`: registration schema, defaults, four steps, duplicate gate, submit destination.
- `app/[locale]/(main)/admin/students/register/_components/one-register-step.tsx`: input types, optional photo, contact lookup, email generation.
- `app/[locale]/(main)/admin/students/register/_components/two-register-step.tsx`: education selectors and conditional organization choices.
- `app/[locale]/(main)/admin/students/register/_components/three-register-step.tsx`: results, scores, date lower bound, negative reason enum.
- `app/[locale]/(main)/admin/students/[studentId]/_components/general/personal-information.tsx`: missing personal profile fields and inline edit actions.
- Same directory: `contact-information.tsx`, `education-information.tsx`.
- `hooks/main/student/branch-student-personel.ts`: independent PersonalInfo and EducationInfo types.
- `app/[locale]/(main)/admin/_components/meeting-dialog.tsx`: standalone meeting schema (lines 76–106), defaults (270–279), score/result reset (303–310), create action (312–354), date lower bound (299–301, 801–807).
- `hooks/main/student/register.ts`: standalone meeting result choices (304–312) and negative reasons (315–322).
- `components/forms/admin/group-form.tsx`, `components/forms/admin/teacher-form.tsx`: schemas, defaults, save actions.
- `components/entity-selector/{level,sub-level,teacher,program-term}-selector.tsx`: actual choice sources and filters.

## Student registration

All source registration fields already have a prototype representation. Missing behavior is more substantial than missing fields.

| Source field | Type, requirement, options/default | Prototype difference / minimal correction |
| --- | --- | --- |
| studentType | Required enum INDIVIDUAL / CORPORATE / CORPORATE_EMPLOYEE; initially unselected | Prototype defaults INDIVIDUAL. Use empty draft choice + required validation if exact defaults desired. |
| meetingType | Required enum PHONE / EMAIL / WHATSAPP / SOCIAL_MEDIA / FACE_TO_FACE / SMS; initially unselected; source puts it in step 1 | Prototype defaults PHONE and puts it in meeting step. Keep the approved improved step grouping, but require an explicit selection. |
| name | Required text, min 2 | Prototype trims and limits rendered input to 160. No missing field. |
| email | Required valid email | Prototype has field but lacks source generate-email action. Source shows the action only for new registration and nonempty name. It produces lowercase ASCII name slug plus four random digits at jamaster.com.tr. Implement only as an explicit user action, never a hidden fallback. |
| phone | Required string, min 6; PhoneInput default TR | Prototype uses strict libphonenumber validity. This is a stronger local rule; distinguish from source parity. |
| secondPhone | Optional string; PhoneInput default TR | Prototype validates if present, but does not include second phone in duplicate search. |
| identityNumber, birthPlace | Optional text | Present; prototype adds max lengths. |
| birthDate | Optional date; source UI max today, no minimum | Prototype additionally rejects dates before 1900. |
| address | Optional textarea | Present; prototype adds 1000-character maximum. |
| image | Optional URL/empty string in schema; ProfilePhotoDialog UI | Prototype has image input/upload. No missing field. |
| checkPhone | Optional boolean, default false in source schema; no rendered checkbox found in source step 1 | Prototype adds visible local confirmation checkbox. |
| courseType | Required GROUP / INDIVIDUAL; initially unselected | Prototype defaults GROUP. |
| level / subLevel | Optional strings from configured level names and sublevel titles; changing level clears sublevel | Prototype hardcodes A1–C2 and `.1`/`.2`. Use shared configured local options and preserve unknown existing values; do not assume all source levels use this format. |
| dayPreference | Required WEEKDAY / WEEKEND / ALL_WEEK / CUSTOM; default WEEKDAY | Present. Prototype adds required customDays text when CUSTOM, absent from source schema/UI. |
| timePreference | Required MORNING / NOON / EVENING / LATE_EVENING / NIGHT / CUSTOM; default EVENING | Present. Prototype adds required customTime text when CUSTOM, absent from source. |
| source | Optional searchable creatable name | Prototype plain text. Add suggestions from existing values while allowing new names. |
| occupation | Optional STUDENT / EMPLOYEE / UNEMPLOYED; initially unselected | Present. In registration this is the education/employment category. |
| institution | Optional searchable creatable name, shown only occupation=STUDENT | Prototype correct condition, wrong control type. |
| company | Optional searchable creatable name, shown only occupation=EMPLOYEE | Prototype correct condition, wrong control type. Source occupation changes clear both organization fields; prototype already does this. |
| status | Optional ACTIVE / INACTIVE in schema, initially undefined; not rendered in source step 2 | Prototype visible account status default ACTIVE. Treat as prototype extension. |
| meetingScore | Required integer 1–5; default 3 | Prototype has all scores, but locks to 1 after NEGATIVE. See meeting section. |
| meetingResult | Required enum with 8 accepted values; initially unselected | Prototype defaults PENDING. Source step 3 selector displays 7 values, omitting COMPLETED even though schema accepts it; standalone meeting displays all 8. |
| meetingDate | Optional string, conditionally required for APPOINTMENT/CALLBACK/SMS_NOTIFICATION/EMAIL_NOTIFICATION | Present. Add source UI min yesterday midnight. Source registration mini-calendar shows 7 days with navigation and counts; prototype registration only has datetime input. |
| negativeReason | Optional string; shown only NEGATIVE; six coded choices | Prototype makes it required and stores translated labels. Correct optionality; migrate labels if adopting source codes. |
| meetingNote | Optional textarea; no source max | Present, prototype caps 1500. |
| course / advisor | Not registration schema fields | Prototype adds required course and required advisor, including hardcoded default advisor. Keep as explicit local extensions or make optional; they must not be described as source-required. |

Source duplicate flow watches main phone, second phone, email (in that priority); searches after debounce; displays matching students and lets the user select an existing registration through `?studentId=...`. The source blocks a duplicate new registration rather than editing/overwriting silently. It supports `?phone=...` prefill. Prototype has exact duplicate email/main-phone errors only and always creates a new student; no equivalent existing-student registration/prefill path. Minimum useful addition: show the matched student with a clear open-existing/profile action, include second phone in matching, and support explicit existing-ID prefills without creating another student.

Source successful registration routes to `/admin/sales/{studentId}` for SALE, otherwise `/admin/students/{studentId}`. Prototype already does this correctly.

## Student profile editing: fields actually missing

Source PersonalInfo is separate from EducationInfo. The prototype's `RegistrationDraft.occupation` stores the education category, so using it for the source personal occupation would overwrite distinct information.

| Missing source field | Requirement and exact options | Minimal prototype correction |
| --- | --- | --- |
| gender | Optional select: MALE, FEMALE | Add optional profile/edit select; persist and display label. |
| bloodType | Optional select: A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE | Add optional profile/edit select; labels A Rh+, A Rh−, B Rh+, B Rh−, AB Rh+, AB Rh−, O Rh+, O Rh−. |
| maritalStatus | Optional select: SINGLE, MARRIED, DIVORCED, WIDOWED | Add optional profile/edit select. |
| occupation (personal) | Optional free text | Add a separate `personalOccupation` or nested `personalInfo.occupation`; retain existing education occupation/category. |

Source personal fields also include identity number, birth date, birth place; contact fields include phone, second phone, email, address. All are optional in source profile API types. Source profile UI edits individual fields with confirm/cancel; it does not force every registration requirement to be satisfied to save one profile correction. Prototype reuses the entire registration schema and a personal/education/review wizard. This can block an unrelated correction because of missing legacy education/course/advisor/phone fields. Minimum correction: use a dedicated edit schema or validate only changed profile sections/fields, while retaining strict validation on newly entered phone/email.

Source education profile uses `status`=STUDENT/EMPLOYEE/UNEMPLOYED, not ACTIVE/INACTIVE. Its company/institution conditional logic and clearing behavior match registration employment selection. Do not confuse this with account status.

Prototype files to touch: `src/features/students/registration-model.ts`, `registration-fields.tsx`, `registration-review.tsx`, `student-model.ts`, `student-dialogs.tsx`, and relevant profile display in `student-page.tsx` / `student-records.tsx`. Adding personal fields only to `Student.profile` is insufficient: `studentDraft()` currently copies only keys in `emptyRegistration`, so edit hydration would silently drop unlisted fields.

## Standalone meeting

Required fields: type, result, integer score 1–5. Defaults PHONE, result unselected, score 3, date/reason/note empty. All exist in prototype. Conditional date requirements cover APPOINTMENT, CALLBACK, SMS_NOTIFICATION, EMAIL_NOTIFICATION. No past-date schema refinement exists in source; the UI min is yesterday midnight. Note and negative reason are optional.

| Difference | Exact minimal correction |
| --- | --- |
| Prototype disables scores 2–5 after NEGATIVE and `createMeeting()` always saves score 1 | Remove disabled state and forced save override. Keep initial reset to 1 when result changes to NEGATIVE. For registration, also stop resetting score to 3 on every other result change; source preserves current score. |
| Prototype requires negative reason | Remove required star, required validation, and allow an unset choice. Keep known-option validation if a value is entered. |
| Prototype reason values are translated strings | If adopting source values, provide label/code mapping and a compatibility migration for saved labels. Registration source uses REGISTERED_ELSEWHERE; standalone meeting source uses OTHER_INSTITUTION for the same label, so use context-specific payload mapping and document the source inconsistency. Other codes: PRICE_HIGH, TIME_NOT_SUITABLE, LOCATION_FAR, NOT_INTERESTED, OTHER. |
| Prototype datetime has no min | Add yesterday midnight bound consistently and validate only when a scheduled result is selected. Preserve existing custom time when clicking another day (an already approved improvement over source reset-to-09:00). |
| Source meeting history fetches seven descending records; prototype shows first five without explicit sorting | Sort newest first and show seven if source parity is intended. |
| Source navigation checks hasNext/hasPrev and auto-next saves only when hasNext | Prototype reportMode always advances circularly through all students. Limit navigation to the relevant current list and stop at boundaries. |
| Source JamAI open preference persists | Prototype resets `ai=false` per mount. Use persisted local preference if this behavior is in scope. |

Source SALE save navigates to sales; non-sale closes or optionally advances. Prototype already implements sale navigation. Prototype QuickReply and SMS preparation exist; no additional form fields missing.

Prototype files: `src/features/meetings/meeting-options.ts`, `meeting-model.ts`, `meeting-dialog.tsx`, plus registration model/fields.

## Group create/edit

No basic source group field is missing. Required fields: name text min 2; groupType ONLINE/IN_PERSON/HYBRID; educationType GROUPS/PRIVATE/BUSINESS/KIDS/OTHER; level and subLevel nonempty strings; teacherId UUID; dayPeriod WEEKDAY/WEEKEND/ALL_WEEK/CUSTOM; timePeriod MORNING/NOON/EVENING/LATE_EVENING/NIGHT/CUSTOM. Optional: status ACTIVE/INACTIVE/PENDING (default ACTIVE), description textarea, room text, programTermId UUID.

Defaults: IN_PERSON, GROUPS, WEEKDAY, MORNING, ACTIVE, empty teacher/room/description, no term. Source selects first configured level + first configured sublevel on create. Prototype defaults status Planlandı and leaves levels empty (intentional previous choice to avoid guessing); report this as a default difference, not a missing field.

Source teacher selector searches ACTIVE teachers and stores ID, with name/email/phone context. Source term selector searches active terms, stores ID and displays dates. Prototype teacher stores name; terms are hardcoded 2026-fall/2026-winter; levels are A1–C2 + `.1`/`.2`. Minimum correction: use shared configurable local option records, preserve existing values, show active teacher choices and term names/date context. ID conversion requires consistent relationship migration; do not just insert UUID validation over local names.

Prototype course, capacity, and free-text schedule are extras. Source does not require course/capacity and has no capacity/member-count or duplicate-name rule in form schema. Preserve useful local invariants but do not call them source-required. Prototype status choices include Tamamlandı, absent from source. Minimum exact statuses: Aktif/ACTIVE, Pasif/INACTIVE, Beklemede/PENDING; retain legacy values when editing existing records rather than silently rewriting them.

Source create adds headTeacherId from teacherId, students=[], programTermId null when unset, default status ACTIVE, then navigates to detail. Update also returns to detail. Prototype save creates UUID but calls closeEditor and create mode navigates to list. Capture saved ID and navigate to `/admin/groups/{id}` after successful save; cancel can keep existing behavior.

Prototype files: `src/features/education/group-fields.tsx`, `group-model.ts`, `groups-page.tsx`, `src/features/operations/model.ts`.

## Teacher create/edit

No source teacher field is missing. Required schema: name min 2, valid email, phoneNumber min 10, status ACTIVE/PASSIVE. Optional salary object, whose entered fields are amount number >=0, salaryType HOURLY/WEEKLY/MONTHLY, paymentDay number 1–31. UI salary amount uses number step 0.01; payment day parses integer. Default status ACTIVE and salary {amount:0,salaryType:MONTHLY,paymentDay:1}. Edit hydrates currentSalary if present.

Prototype has same core fields and correct optional salary toggle, plus photo/specialty/weekly hours. Those extras need not block empty optional values. Source status is schema-only: source does not actually render a status selector, despite importing Select for salary type. Prototype visible status selector adds İzinli; this is an extension, not missing parity. Strict phone validity, duplicate checking and salary toggle are local improvements.

Source supports lookup/prefill by phoneNumber and teacherId, and create/update both navigate to `/admin/teachers/{id}`. Prototype create saves then returns to list; route to saved detail as above. Preserve local salary toggle rather than reintroducing accidental zero salary creation just to match source defaults.

Prototype files: `src/features/education/teacher-fields.tsx`, `teachers-page.tsx`, `src/features/operations/model.ts`.

## Suggested targeted validation after implementation

- New optional personal fields survive save/reopen and do not overwrite education category.
- A profile-only change is not blocked by unchanged incomplete legacy registration fields.
- Negative meeting saves with no reason; changing score after selecting NEGATIVE persists selected score.
- Existing Turkish reason labels remain readable after any enum migration.
- Student/source/company/institution choices support both existing names and a new typed name.
- New group/teacher save opens exactly the saved record; cancel creates nothing.
- Existing unknown level/sublevel/status survives opening an editor; dependent choices clear only after an explicit parent change.
