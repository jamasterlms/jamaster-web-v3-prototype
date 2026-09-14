# Calendar and attendance parity research

Source: `jamasterlms/jamaster-web` at immutable commit `7810bd1720c57749f6d5249536ba015f2a53694f`. Prototype inspected read-only at `/workspace/sites/jamaster-workspace-ui`. Findings describe frontend source contracts; backend validation and authorization are not established by this repository alone.

## Actionable parity table

| Area | Source behavior and evidence | Prototype behavior | Minimal corrective work |
|---|---|---|---|
| Calendar navigation | `/admin/calendar` and `/admin/calendar/pollings` are sibling tabs. [calendar/layout.tsx][S1] | Same two paths exist. `src/features/calendar/calendar-page.tsx` | Keep the tab paths; correct the contents of Pollings. |
| Calendar modes | Default interaction mode `view`; View/Edit toggle. View opens read-only detail. Edit enables add, select range, drag, resize, edit and delete. [calendar/page.tsx][S2], [calendar-view.tsx][S3] | No View/Edit switch; clicking an event opens an informational dialog. No lesson create/edit/delete/range selection/drag/resize. `src/features/calendar/calendar-page.tsx`, `src/components/shared/app-dialogs.tsx` | Add explicit interaction mode and lesson editor; keep read-only detail separate. Add should mean a lesson, while existing meeting creation can remain a distinct feature. |
| Calendar views | Month `dayGridMonth`, week `timeGridWeek`, day `timeGridDay`, list `listWeek`; Monday first; local timezone. Mobile forces `listWeek`. Fullscreen action. [calendar-header.tsx][S4], [calendar-view.tsx][S3], [calendar/page.tsx][S2] | Week/day only; mobile initializes day view; no month/list/fullscreen. `calendar-page.tsx` | Implement month/list and responsive list default; fullscreen can follow core parity. |
| Calendar filters | Lesson type `ALL / GROUP / PRIVATE`; query limits 100, ascending `startTime`, visible date range plus 14 days each side, `dateField=startTime`. [calendar/page.tsx][S2], [use-schedule.ts][S5] | Teacher/room/event-kind filters, where event kind is meeting/lesson. No group/private distinction. | Preserve useful extra filters but add a separate lesson type. Do not overload event kind with lesson type. |
| Lesson data/editor | Group, GROUP/PRIVATE, title, date, start/end times, optional education/teacher; edit has active/cancelled. [lesson-event-dialog.tsx][S6], [group-schedule.ts][S7] | `CalendarEvent` has numeric ID, serial day, time/duration, labels, room, optional group/student ID, generic type/color. No schedule status, lesson type, teacher/education IDs. | Add an adapter or canonical schedule model with ISO dates and entity IDs; preserve existing event IDs through a migration/map. |
| Lesson detail | Group/type, date/time/duration, status, optional teacher/student/location; QR link; links to group/teacher/student and branch pollings. QR is generated from `event.id`. [event-detail-modal.tsx][S8] | Title/date/time/teacher/room/person, then generic “Yoklama al” link with no selected lesson context. `src/components/shared/app-dialogs.tsx` | Link to the actual group attendance session and expose contextual entity links and QR. |
| Branch Pollings | Active today cards with QR, all today selectable cards, upcoming cards (first 10), print selected today. Active cards offer preview/copy link/group attendance. No group/date/manual roster picker here. [pollings/page.tsx][S9], [polling-card.tsx][S10] | `AttendancePage` is a manual group/date/lesson roster; saved sessions list. `src/features/calendar/attendance-page.tsx` | Restore branch QR dashboard at `/admin/calendar/pollings`; relocate manual workflow to group attendance. |
| QR actions | `origin/polling?q=encodeURIComponent(poll.id)`; real QR data URL, preview, copy link/image, open public URL, selected print. [polling-qr.ts][S11], [polling-qr-dialog.tsx][S12] | No QR generation, preview, print or public receiver. | A frontend demo needs both a scannable QR and a working receiver route; show demo state honestly if public verification API is not connected. |
| Group attendance route | `/admin/groups/:groupId/polling` contains Current/Past tabs. Current selects today's sessions, prefers active, offers QR and immediate row marking. [group polling page][S13], [current-polling.tsx][S14] | Router sends deeper group routes to GroupsPage with no detail ID, hence group list. Manual editor exists only in branch Pollings. `src/app/page-router.tsx` | Implement this route explicitly and derive groupId from route. Preserve lesson/session context when arriving from a calendar detail. |
| Attendance marks | Storage contract `present / absent / null`; current row UI derives present from checkInTime, pending until end, absent after end. Mark buttons only if raw poll.status === active, mutations immediate. [group-polling.ts][S15], [current-polling.tsx][S14] | Same mark union, but no checkInTime; pending null forever; any started session can be edited; batch Save/Revert. `attendance-model.ts`, `attendance-page.tsx` | Add check-in timestamps and distinguish stored mark from displayed/time-derived status. Keep saved draft UX only as an intentional departure; do not claim exact mutation behavior parity. |
| Group past attendance | Date range, multi-status, multi-lesson-type, newest/oldest filters; pagination, CSV/JSON export, detail dialog; rows include date/poll window/lesson window/type/participation/status. [past-polling-config.tsx][S16], [past-polling.tsx][S17] | Only saved-session date buttons in branch editor; no group past table/detail. | Add Past tab with these filters and roster detail. |
| Student attendance history route | Canonical `/admin/students/:studentId/history?tab=polling`; old `/polling-history` redirects, preserving other query params. [history/page.tsx][S18], [detail-route-redirects.ts][S19] | Separate `/polling-history` route; student history branch does not select a polling subtab. `src/app/page-router.tsx`, `src/features/students/student-page.tsx` | Add canonical history tab and legacy redirect, retaining date/page/sort query state; reset shared list query keys when switching tabs. |
| Student history data | Overall/monthly/weekly statistics; history date range, pagination, CSV/JSON/Excel export, group level/sublevel/room, lesson time range, displayed mark and check-in time. [polling-tab.tsx][S20], [polling-config.tsx][S21], [branch-student-polling.ts][S22] | Overall present/absent/rate based solely on saved local sessions; no date filter, check-in time, period stats; rows date/title/group/mark. `src/features/students/student-records.tsx` | Expand history contract and period statistics; use real persisted session roster rather than current student-group name membership. |

## Exact lesson form behavior

Source `app/[locale]/(main)/admin/_components/schedules/lesson-event-dialog.tsx`:

- Form state: `title, type: GROUP|PRIVATE, date: YYYY-MM-DD, startTime: HH:mm, endTime: HH:mm, status: active|cancelled, groupId, groupLabel, teacherId?, educationId?`.
- Create defaults: GROUP, active, selected range or now plus one hour, optional context.defaultTeacherId; no education. Title auto-generates from localized lesson type plus `HH:mm - HH:mm` until manually edited.
- Edit seeds values from selected event. The group is fixed if the event has groupId. A group selector appears when create context has no fixed group, or an edit event lacks groupId.
- Date and both time inputs are required. Custom validation requires both times, end strictly after start on the same date, and a resolved group if selection is enabled. Delete additionally requires group and reruns time validation.
- Teacher, education and title have no custom required/minimum validation in this component. No room, student or location input exists in this editor. Those may be display data but are not LessonFormData.
- Submit converts the local date and time to ISO timestamps and sends type/title/startTime/endTime/status plus optional teacherId/educationId. GroupId is an endpoint argument, not the body.
- Edit can set active/cancelled and delete with a confirmation dialog.
- Note an observed source quirk: the branch page catches CRUD errors without rethrowing while the dialog closes after awaiting callbacks; do not reproduce error-close behavior as a requirement. Calendar event titles are also synthesized by the branch page rather than copied from schedule.title. Preserve canonical title separately in any adapter. [S2], [S6]

## Minimal data contracts

These are the smallest useful frontend contracts preserving source semantics. Source has additional audit metadata. `Id` should be a string; do not assume prototype numeric event IDs are API IDs.

```ts
type Id = string;
type LessonType = 'GROUP' | 'PRIVATE';
type ScheduleStatus = 'active' | 'cancelled';
type AttendanceMark = 'present' | 'absent' | null;
type PollStatus = 'active' | 'completed' | 'pending' | 'cancelled';
type Ref = { id: Id; name: string };
type GeoFence = { latitude: number; longitude: number; radius: number };

interface LessonFormData {
  type: LessonType;
  startTime: string; // ISO timestamp
  endTime: string;   // ISO timestamp
  teacherId?: Id;
  educationId?: Id;
  status?: ScheduleStatus;
  title?: string;
}
interface Schedule extends LessonFormData {
  id: Id;
  groupId: Id;
  title: string;
  status: ScheduleStatus;
  group?: Ref;
  teacher?: Ref;
  education?: Ref;
  studentId?: Id;
  student?: Ref;
  location?: GeoFence | null;
}
interface PollStudent {
  id: Id;
  scheduleId: Id;
  studentId: Id;
  attendanceStatus: AttendanceMark;
  checkInTime: string | null;
  student: Ref & { studentNumber: number; status?: string };
}
interface Polling {
  id: Id;              // branch QR builder uses this
  scheduleId: Id;      // maintain separately; do not discard
  groupId: Id;
  type: LessonType;
  status: PollStatus;
  startTime: string;   // polling window, keep separate from lesson window
  endTime: string;
  group?: Ref;
  location?: GeoFence | null;
  schedule?: Pick<Schedule, 'id' | 'type' | 'status' | 'title' | 'startTime' | 'endTime'>;
  scheduleStudents?: PollStudent[];
}
interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  dateField?: string;
  status?: string | string[];
  type?: string | string[];
}
interface StudentPollingHistory {
  id: Id;
  checkInTime: string | null;
  attendanceStatus: AttendanceMark;
  schedule: Pick<Schedule, 'id' | 'title' | 'type' | 'startTime' | 'endTime'> & {
    educationId: Id | null;
  };
  group: Ref & { level: string | null; subLevel: string | null; room: string | null };
}
interface StudentPollingStats {
  totalPolls: number;
  overall: { present: number; absent: number; attendanceRate: number };
  monthly: { present: number; absent: number; attendanceRate: number };
  weekly: { present: number; absent: number; attendanceRate: number };
  usage: number;
}
```

StudentPollingHistory above permits null to reconcile the broader attendance contract; the source's history hook type narrows attendanceStatus to present/absent even though its rendering helper accepts null. The hook also returns a poll object with `type: MANUAL|QR_CODE|LOCATION_BASED` and uppercase status. This poll transport enum is different from lesson type and from the lowercase branch Polling.status. Do not collapse them into one enum. [S15], [S21], [S22]

## API mapping and list filters

| Operation | Method/path and payload |
|---|---|
| Branch calendar | GET `/admin/group-schedules/branch` + ListQuery; page passes limit=100, sort=startTime, order=asc, start/end with 14-day buffer, dateField=startTime and optional type. |
| Group schedules | GET `/admin/group-schedules/:groupId` + ListQuery. |
| Create lesson | POST `/admin/group-schedules/:groupId`, LessonFormData. |
| Update lesson | PUT `/admin/group-schedules/:groupId/:scheduleId`, Partial<LessonFormData>. |
| Delete lesson | DELETE `/admin/group-schedules/:groupId/:scheduleId`. |
| Branch pollings | GET `/admin/group-schedules/attendances/branch`, default limit=100, sort=startTime, order=desc. No page filters in branch Pollings. |
| Group current | GET `/admin/group-schedules/attendances/:groupId/current`; response is today's Polling[] according to component/backend contract. Selector sorts startTime ascending and defaults to first raw active item, otherwise first. |
| Group past | GET `/admin/group-schedules/attendances/:groupId/past` + filters/pagination. |
| Manual mark | PUT `/admin/group-schedules/group/:groupId/schedule/:scheduleId/students/:studentId/attendance`, `{ attendanceStatus }`. |
| Student statistics | GET `/admin/student-attedances/:studentId/polling-statistics`; preserve source spelling `attedances`. |
| Student history | GET `/admin/student-attedances/:studentId/polling-history` + ListQuery. |
| Student detailed summary | GET `/admin/student-attedances/:studentId/attendance-summary` + ListQuery; richer weekly/monthly groups and education matching, not needed for the basic history table. |

Sources: [group-schedule.ts][S7], [group-polling.ts][S15], [branch-student-polling.ts][S22].

Group Past filters: startDate/endDate; status multiple `all, active, completed, pending, cancelled`; type multiple `all, GROUP, PRIVATE`; sortOrder options `startTime:desc` default or `startTime:asc`. Filter settings include `useDateSixMonth: true` (exact dates generated by shared filter code not researched here). Student Polling History only defines startDate/endDate with empty default. History tab switching clears page/limit/search/sort/order/startDate/endDate. [S16], [S18], [S21]

Shared `lib/query.ts` removes empty values and literal all, serializes array values as repeated keys, converts startDate to local 00:00:00.000 and endDate to local 23:59:59.999 then ISO. API credentials are included; request interceptor resolves tenant and branch headers. An integration must retain the selected branch context, rather than relying on a prototype label field. [query.ts][S23], [api.ts][S24]

## Status and participation rules

Branch poll status recalculates every 30 seconds: cancelled always wins; before start pending; start <= now <= end active; after end completed. Today sections are selected by local calendar day of startTime. Upcoming means future start and not today, including cancelled items because that filter does not exclude them. Upcoming order inherits branch query descending startTime, with first 10 rendered; the code does not re-sort nearest-first. QR codes are generated for all today's polls, including completed/cancelled, although only active-today cards display QR inline. [use-poll-status.ts][S25], [pollings/page.tsx][S9]

Participation on branch cards and group past rows is present marks / all scheduleStudents, including pending rows in the denominator. Prototype attendanceStats instead uses present / (present + absent), excluding null. These rates differ until every student is marked. [S10], [S16], prototype `src/features/calendar/attendance-model.ts`.

Current group and student history status display gives checkInTime priority: timestamp => present, otherwise before/during window => pending/waiting, otherwise absent. It does not simply display attendanceStatus. Group past detail uses explicit marks once session starts and forces all pending before start. This inconsistency exists in source; use it to identify a product/data decision, not to silently synthesize matching timestamps. [S14], [S17], [S21]

The manual hook names the endpoint key scheduleId, while CurrentPolling supplies selectedPolling (a poll.id) to it. Calendar details likewise build the public QR from schedule/event.id. Source appears to rely on shared IDs or backend resolution; this is an inference, not proof of backend identity equivalence. Keep pollId and scheduleId separately and confirm the backend before wiring writes. [S8], [S14], [S15]

## QR link and verification semantics

- QR payload is a public URL `<origin>/polling?q=<encoded id>`, not a JWT, image service URL, secret or rotating code. Branch dashboard passes poll.id; no client QR token exchange occurs. Generator uses qrcode.toDataURL, default width 256, margin 1, black/white, error correction M. Group current renders width 400. [S11], [S14]
- Public receiver is `app/[locale]/(public)/(other)/polling/page.tsx`. It reads q; checks via GET `/public/attendances/check?q=...`; response `{ isActive, isAttended, poll: {id,status,startTime,endTime} | null }`, with uppercase NOT_STARTED/ACTIVE/COMPLETED/CANCELLED. [polling public page][S26], [hooks/polling.ts][S27]
- POST `/public/attendances/verify` body `{phone, pollId, code?}`: omit code to request SMS, include code to verify. Phone validation is string minimum 10; code exactly six numeric digits. Resend timer 60s. Response has success/message plus alreadyAttended or studentId. There are phone, verify and success steps. [S26], [S27]
- Separate `polling_verification` cookie stores a JWT-like verification credential. Helpers set lifetime 120 days, path /, SameSite strict, Secure in production, httpOnly false. Hook comments say backend sets cookie after successful verification; app uses Axios withCredentials. Frontend “verified” detection only tests token has three dot-separated parts; it is not cryptographic verification. [S27], [S24]
- Check query includes query+cookie value in its query key; staleTime 30s, refetch interval 60s. If isAttended it advances to success; if verified and active but not attended, it invalidates/rechecks. The exact server-side attendance side effects, cookie signing and validation cannot be proved from this frontend. [S26], [S27]
- Location flags and radius can be displayed, but verify request type has no location field in this source. Do not invent a geolocation permission flow based only on the optional location model. [S15], [S27]

## Implementation boundary

For a faithful frontend prototype, prioritize: (1) distinct lesson type/status and IDs, (2) branch Pollings QR dashboard, (3) group Current/Past attendance routes, (4) lesson editor and read-only detail, (5) month/list/calendar mode parity, (6) student canonical history and timestamps/statistics. Preserve a local adapter if backend connectivity is outside scope. A scannable demo QR can target a public demo receiver, but production SMS/JWT verification must remain an explicit integration requirement.

No source or Site files were modified during this research.

[S1]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/calendar/layout.tsx
[S2]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/calendar/page.tsx
[S3]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/_components/schedules/calendar-view.tsx
[S4]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/_components/schedules/calendar-header.tsx
[S5]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/_components/schedules/hooks/use-schedule.ts
[S6]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/_components/schedules/lesson-event-dialog.tsx
[S7]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/hooks/main/group/group-schedule.ts
[S8]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/_components/schedules/event-detail-modal.tsx
[S9]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/calendar/pollings/page.tsx
[S10]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/calendar/pollings/_components/polling-card.tsx
[S11]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/lib/polling-qr.ts
[S12]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/calendar/pollings/_components/polling-qr-dialog.tsx
[S13]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/groups/[groupId]/polling/page.tsx
[S14]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/groups/[groupId]/polling/_components/current-polling.tsx
[S15]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/hooks/main/group/group-polling.ts
[S16]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/groups/[groupId]/polling/_components/past-polling-config.tsx
[S17]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/groups/[groupId]/polling/_components/past-polling.tsx
[S18]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/students/[studentId]/history/page.tsx
[S19]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/lib/detail-route-redirects.ts
[S20]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/students/[studentId]/history/_components/polling-tab.tsx
[S21]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/students/[studentId]/history/_components/polling-config.tsx
[S22]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/hooks/main/student/branch-student-polling.ts
[S23]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/lib/query.ts
[S24]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/lib/api.ts
[S25]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(main)/admin/calendar/pollings/_hooks/use-poll-status.ts
[S26]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/app/[locale]/(public)/(other)/polling/page.tsx
[S27]: https://github.com/jamasterlms/jamaster-web/blob/7810bd1720c57749f6d5249536ba015f2a53694f/hooks/polling.ts

