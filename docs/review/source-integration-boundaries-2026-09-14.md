# Jamaster source and integration boundaries — 2026-09-14

## Scope and evidence

Read-only review of the current Site checkout at `/workspace/sites/jamaster-workspace-ui`, the cached source subset at `research/source`, and the private GitHub repository `jamasterlms/jamaster-web`. GitHub repository metadata, commit history, commit comparison, and selected file contents were read with the native GitHub connector. No login, API mutation, payment, browser bypass, or Site modification was attempted.

The GitHub default branch is `main`. Its latest revision at review time is [`c85bebcac6804fa9c7069b6594a5c615554d8854`](https://github.com/jamasterlms/jamaster-web/commit/c85bebcac6804fa9c7069b6594a5c615554d8854), committed 2026-09-11 18:32:44 UTC. The cached `research/source` directory is a selected file snapshot without `.git`; it cannot independently prove its revision. Where revision matters, this report relies on GitHub-native reads.

## Source changes since `7810bd1`

GitHub compare reports `main` **4 commits ahead, 0 behind**, with merge base exactly `7810bd1720c57749f6d5249536ba015f2a53694f`:

1. `09672d75` fixes pricing conversion by always sending `paymentType`, and stops inventing a fully paid row for promissory-note sales with unpaid installments.
2. `78f09912` adds/replaces payment architecture plans and removes completed older plans; this is documentation, not a shipped API/UI migration.
3. [`877c0758`](https://github.com/jamasterlms/jamaster-web/commit/877c07583e23d1fa8d5894e8e2602e12f50b358c) changes the shipped `/payment` UI and contract handling for partial payment and locked-panel outcomes.
4. `c85bebca` adds unauthenticated `GET /api/health` and points Railway health checking there. It does not touch session or application API behavior.

The executable diff is small and concentrated: pricing conversion; `/payment` and token checkout; two pure payment decision modules/tests; payment messages; and health-check deployment configuration. The large added payment plan/spec files describe future backend work and must not be treated as currently available contracts.

## `/payment` parity findings

The prototype already mirrors the principal endpoint family and much of the checkout behavior:

| Source contract | Prototype state |
|---|---|
| `GET /payment/scopes`, `/payment/access`, `/payment/obligations`, `/payment/active-link`, `/payment/history` | Paths represented in `payment-service.ts` |
| `GET /payment-links/:token`; `POST /payment-links`; checkout/cancel | Paths and request shapes represented |
| Checkout timeout 60 seconds | Represented |
| `OPEN / PROCESSING / COMPLETED / CANCELLED / SUPERSEDED`, uncertain-result verification | Represented |
| Tenant/branch cards and addresses | Adapter paths and normalizers represented; student checkout intentionally unsupported |

Two material parity gaps were introduced by `877c0758` and remain in the prototype:

- **Missing `completionSummary`.** Current source defines completed-link reads as `PaymentLinkReadResponse` with `completionSummary: { stillBlocked, remainingCount, remainingAmount, currency } | null`. The prototype `PaymentLink` omits this field. Its completed result always offers only payment-center/history actions and cannot distinguish `unlocked`, `remaining`, `awaiting_unlock`, or unknown summary. A connected implementation must add the field and must only promise panel access when `stillBlocked === false`.
- **Missing blocked-scope initial selection.** Current source preselects every open obligation once when `/payment/access.blocked` is true, except while an active link is `PROCESSING`; open access starts empty. The prototype always initializes from URL `id` parameters and otherwise starts empty. This recreates the partial-payment trap the source fixed.

The source checkout also invalidates tenant access, payment access, obligation/link/history, tenant invoice, and branch-payment queries after mutation. The prototype resource layer refreshes only its local resource. A real adapter needs coordinated cache invalidation or an equivalent refetch policy after create, checkout, cancel, and verification.

`09672d75` affects student sale/pricing conversion, not the standalone payment service. Any future real sale adapter must carry `paymentType` even when unchanged and must preserve “zero paid installments” instead of synthesizing a collection.

## Real auth/API adapter feasibility

The prototype contains a useful typed `createPaymentService(request)` seam, but **it is not wired**. `src/main.tsx` always mounts `PrototypePaymentProvider`, which uses session-local synthetic obligations/cards/addresses. No production `PaymentTransport`, general API client, auth client, tenant resolver, or runtime API-origin setting exists in this Vite app.

The source contract that can be implemented safely and configurably is:

- API origin: `NEXT_PUBLIC_API_URL`, defaulting in the source to `http://localhost:8000`. For Vite/Sites this needs a separate explicit runtime/build configuration; the Next variable is not automatically available.
- API requests: Axios base URL at that origin, `withCredentials: true`, 10-second default timeout; checkout overrides to 60 seconds.
- Tenant: `x-tenant-id`, derived from a valid tenant subdomain (`<tenant>.jamaster.com.tr` or `<tenant>.localhost`) or `tenant-id`/legacy `tenantId` cookie. Reserved names are `app`, `api`, `www`, `api-v2`. Valid tenant slugs match `[a-z0-9-]{2,64}`.
- Branch: `x-branch-id`. Source precedence is mutation-only `localStorage['form-branch-id']`, then `branch-id` cookie, then `localStorage['branch-id']`, then an in-memory store. A connected prototype should use an authenticated, server-validated branch selection and should not infer this header from a display-only branch label.
- Auth families: Better Auth clients at `${apiUrl}/api/auth/user`, `/student`, and `/teacher`, all using `credentials: 'include'` plus the tenant/branch headers. `user` covers admin/personnel and super-admin routes.
- Session: each auth client calls `getSession()`. The visible payload is `{ user, session }`, with a session token field, but the application relies on the Better Auth cookie and credentialed requests. The token should not be copied to local storage or invented as a bearer token.
- Cookie naming: middleware checks tenant-qualified prefixes `${authType}-${tenantSchema}` first and `better-auth` as fallback. Exact cookie names, cookie signing/encryption material, CORS allowlist, and SameSite/domain attributes are backend/deployment-owned and are not available from this web repository alone.
- Login also requires `x-captcha-response` from ALTCHA. A real login surface therefore needs a working backend challenge endpoint/configuration and cannot be completed from API origin alone.

### What is missing before connection

1. A reachable backend/API origin for the target environment and confirmation that the deployed Site origin is allowed by backend CORS with credentials.
2. A tenant identifier/domain assignment and a server-recognized branch selection. The prototype’s “New York” label is not a backend branch ID.
3. Valid existing accounts/sessions for the intended roles, or an approved authentication handoff. No credentials are present in either checkout and none should be added to source control.
4. Backend Better Auth cookie configuration compatible with the Site origin. Cross-site cookie deployment may require backend changes; the frontend cannot fix HttpOnly/session cookie scope.
5. ALTCHA challenge configuration for login and backend endpoints that match the inspected web revision.
6. For real payment, backend/provider configuration (for example iyzico) must already exist server-side. Provider API/secret keys belong in backend secret storage, never in this browser app or Sites public environment variables.

The safest incremental connection is to preserve the injected service boundary, add a credentialed transport behind explicit API/tenant/branch configuration, begin with read-only session/scope/access/obligation reads, and keep mutations disabled until response-envelope normalization, CORS/cookies, role/branch authorization, `completionSummary`, and indeterminate checkout handling are verified in a non-production payment environment.

## Settings inventory and remaining gaps

Prototype settings currently expose:

- General: institution name, phone, email, address, tax number, light/dark logos, notifications toggle.
- Bank: bank, account holder, account number, IBAN, default/active toggles.
- Payment preference: default installment count, reminder days, cash/transfer/card toggles; iyzico mode, client key, secret key draft validation.
- Integrations: Mutlucell username/password/originator; SMTP host/port/user/password/sender name/sender email/security; WhatsApp phone number ID, business account ID, API version, access token, verify token, app secret, optional Meta app ID.
- Account/security: name, email, phone, profile image, password-form validation, display/device settings.
- Tenant policy draft: tenant status; unpaid-invoice restriction; JamAI toggle; SMS/email/payment provider resolution; meeting/sale/installment approval modes and selected result/payment types.

These are explicitly local drafts. Secret fields remain in component state and are excluded from persisted drafts, which is appropriate. The missing production behavior is server-backed read/update, masked-secret semantics, branch-vs-tenant scope, permissions, concurrency/error handling, and provider connection tests. The source confirms tenant/branch iyzico endpoints and provider-resolution concepts, but the cached subset is not enough to certify every settings endpoint/payload; do not bind the remaining forms by guessing.

## Role-aware help route gaps

The help catalog has broad staff/super coverage and separate student/teacher portal tutorials. However:

- `helpRole('/payment')` resolves to `staff` because `payment` is not recognized as a role-bearing standalone route. A super-admin or student payer can therefore receive staff help even though `/payment` is scope-driven.
- The payment tutorial is assigned to staff and super, not student or teacher. Source currently exposes a `STUDENT_INSTALLMENT` payment scope in types while checkout support remains incomplete; help should say this explicitly rather than silently falling back.
- Standalone help links cannot derive role from a real session because the prototype has no auth/session adapter. A connected version should derive audience from verified session plus payment scope/access response, with query role used only as navigation context.

## Boundary conclusion

The UI is structurally ready for a payment-specific adapter, but it is not ready for real authentication or financial mutation merely by adding an API URL. The immediate source-parity work is `completionSummary` handling, blocked-scope obligation preselection, and coordinated post-mutation refresh. The deployment prerequisites are credentialed CORS/cookies, tenant and branch identity, ALTCHA, real accounts, and server-side provider secrets. Until those are supplied and validated, keeping the current prototype provider is the correct operational boundary.
