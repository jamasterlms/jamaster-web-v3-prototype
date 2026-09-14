# UI detail review — 9 September 2026

The approved soft palette, rounded white surfaces, yellow metric accent and glass navigation are preserved. This pass addresses the 19 screenshot-driven requests. The project remains the existing React/Vite/Tailwind application with Radix-backed shadcn components and its original Site identity.

| Request | Implementation |
| --- | --- |
| 1, 8: narrow metric cards / overflow | Card-scoped fluid numerals, wrapping long values, a separate bounded sparkline, earlier dashboard reflow, min-width constraints. Meeting date badges grow to contain the year. |
| 2: jumping sidebar | All primary navigation items remain in the rail. Group headings retain space; icon geometry and content padding are shared in both states. Scrolling replaces the old reduced list. Expansion overlays the content. |
| 3, 16: working tabs | Compact width, close control in the flex row immediately after the title, soft background and focus/touch visibility. Tab-spacing preference removed. |
| 4: row hover | Dashboard tracker hover includes inline padding around the complete row and action. |
| 5: detail routes | Student routes retained; group, teacher and staff detail routes added. Existing group assignment, editor and teacher lesson actions remain connected. Legacy staff row IDs materialize before insertion/editing. |
| 6: long dialogs | Form fields moved into a dedicated scrolling body; shadcn DialogFooter remains outside it. Dialog header remains fixed. Existing Radix focus trapping and exit animation retained. |
| 7: calendar | Hour geometry allows legible lines. Tiny/short/medium event presentations remove lower-priority lines instead of squeezing all lines. Full details remain accessible on activation; overlap columns retained. |
| 9: active subpages | Active styling uses actual aria-current instead of assuming Radix data-active="true". |
| 10: placeholders | Shared input, textarea and select defaults plus contextual registration/group/settings placeholders. Native date/time controls retain the browser's date/time affordance. |
| 11: phone / image | Reusable phone control accepts national or international input, shows country/calling code and validated international format. Photo input supports JPG/PNG/WebP, size checks, preview, replacement and removal. Images are reduced before local persistence and rendered as photos rather than data URL text. Student, teacher and account/brand use it. |
| 12: mobile keyboard | Visual viewport-aware Previous / Next / Hide Keyboard toolbar, hidden/disabled fields skipped. Dialog dismissal ignores accessory clicks. Dialog sizing reserves toolbar space. |
| 13: quick preview | Student/group/teacher/staff single click previews if tools are visible; closed tools navigate. Double click always navigates. Main tabs and subpage navigation always navigate. Tablet/mobile use a drawer; full-page actions close it. |
| 14: filters/charts | Student group/course/advisor/payment/date filters; group teacher/level/doluluk; teacher specialty/current-week workload; meeting date/type/result distribution; calendar room/type. Table pagination/sorting/column choices retained. |
| 15: search focus | Search wrapper retains its soft background and its inner input stays transparent. |
| 17: settings | Bank account number/currency/status and IBAN checksum; required vs optional sections; profile phone/photo; company tax field and logos. Payment defaults feed new sales and allowed methods. Profile/brand changes are rendered. |
| 18: suggestions | Actual overdue installments, today's open meetings, recorded attendance risk and unassigned groups drive actionable suggestions. Shortcuts link to existing routes. |
| 19: meeting creation | Student picker includes new-student creation; saving the student opens their meeting form without losing their new ID. |

## Comparison evidence

Compared against `jamasterlms/jamaster-web` at `7810bd1720c57749f6d5249536ba015f2a53694f`, including:

- `admin/settings/bank/_components/bank-form.tsx`: bank name, account holder, account number, IBAN, currency, default/active flags.
- `admin/settings/general/_components/company-form.tsx`: company/contact/address, optional tax number, two logos/currency.
- `components/forms/user/profile-form.tsx`: name/email/phone/image.
- `components/settings/email-settings-form.tsx`, `mutlucell-settings-form.tsx`, `whatsapp-settings-form.tsx`, `iyzico-settings-form.tsx`: actual SMTP, SMS, Meta and payment credential field names.
- `admin/staff/form/page.tsx`: staff identity/contact/status and server-managed permission/salary workflows. The local staff editor now has contact fields and a real detail route; server permission and payroll integration is still open.

## Verification and limits

- Logic tests cover preview/navigation policy, stable staff identifiers, profile-file restrictions, IBAN/number validation, plus existing registration, financial, calendar and attendance regressions.
- Static React rendering checks all 113 navigation targets, again with empty collections, registration/editor composition, details and subroutes. This verifies composition and field wiring, not browser layout.
- Prior supervised browser navigation was blocked with `ERR_BLOCKED_BY_CLIENT`. No alternate host or browser was used to bypass it. Mobile keyboard, actual touch/double-click delivery, computed geometry and Safari/Windows/TV visual checks remain unverified on real devices.
- API/auth/tenant isolation, actual messaging, payment provider connection tests, file-object storage and payroll are not connected in this local-state application. Provider fields are now modeled correctly; secret values stay only in component memory and save/test actions remain unavailable until a secure server connection exists. No false connection-success message is emitted.
- Local storage write failures now report that only the current session retains the data. This is not a substitute for a production persistence service.
