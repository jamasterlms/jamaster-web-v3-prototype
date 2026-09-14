# Student finance and settings implementation checkpoint

Source comparison: `jamasterlms/jamaster-web@7810bd1720c57749f6d5249536ba015f2a53694f`, 9 September 2026. This describes local UI/model behavior, not a payment or authorization service deployment.

## Student records and receipts

- Student payment routes use the source `tab=courses`, `tab=saleHistory` and `tab=installments`, with an additional receipt list. `saleId` links from reports and sale actions are applied. Search, dates, sale and installment status filters are stored per tab and synchronized with explicit URL values. The effect includes the page-state identity so identical URL filters are saved when switching tabs.
- Receipt records can carry a specific installment ID. Existing pooled receipts keep their chronological allocation; targeted payments affect only the selected installment. Integer-cent allocation conserves amounts. A targeted receipt is rejected for a foreign installment, overpayment or stale paid balance.
- Bank transfers select an active TRY account. Account ID and the selected account's display name are retained with the receipt. Disabled payment methods and inactive or different-currency accounts are rejected at the reducer boundary. Account configuration is read from the same bank settings as the editor.
- Receipt form order is payment/sale information first, optional note below, followed by preview and final confirmation. The dialog uses the shared adapted shadcn header, scrollable body and footer. A stable receipt ID and submit guard prevent duplicate local saves. Payment date cannot be in the future.
- Student attendance history has explicit date filters, CSV export and separate level, sublevel, room and check-in fields. Manual attendance snapshots store known lesson metadata but never invent check-in timestamps. Cancelled and future lessons cannot be marked or saved.
- Legacy `polling-history` addresses render attendance while replacing the URL with `/history?tab=polling`; existing query values are preserved. The static composition check verifies actual content rather than treating an empty redirect as a rendered page.

### Remaining finance limits

- This is browser-local persistence. No payment capture, bank settlement, backend balance transaction, refund, cancellation, verification workflow or authorization was added. iyzico remains unavailable until connected.
- Source enrollment freeze, transfer, end-date and bonus actions, installment upcoming/future/past cohorts, server summaries and historical source datasets remain open. The local course list must not be called full enrollment lifecycle parity.
- Existing pooled historical payments cannot acquire an unknown target installment retroactively. Unknown bank/check-in details remain unspecified.

## Settings scope and fields

| Route | Behavior |
| --- | --- |
| `/user/account` | Profile settings only; no branch settings links in its menu. |
| `/admin/settings/*` | Existing branch/company form and bank/settings editors. Integration forms remount between providers to discard secret input values. |
| `/super/settings?tab=general` | Separate tenant name/status, unpaid-invoice access preference, AI preference, service-resolution policy and per-operation verification choices. No local access-rule enforcement or fake save. |
| `/super/settings?tab=level` | Global level/sublevel catalog, documented in `learning-implementation.md`. |
| `/super/settings?tab=iyzico\|mutlucell\|whatsapp\|email` | Correct provider form in the super scope, without linking back to branch settings. |

Compared source settings files: `components/settings/general-settings-form.tsx`, `level-setting.tsx`, `iyzico-settings-form.tsx`, `mutlucell-settings-form.tsx`, `whatsapp-settings-form.tsx`, `email-settings-form.tsx`; source route `app/[locale]/(main)/super/settings/page.tsx` and hooks `hooks/main/super/super-setting.ts`.

Source SMTP security is `ssl`, `tls` or `none`, not boolean. The field is a required Select with an explicit initial choice. Source WhatsApp requires phone-number ID, business-account ID, access token, API version, webhook token and app secret; all six remain required, with source default API version `v23.0`. Optional Meta application ID is separated below. Mutlucell has username/password/originator; iyzico has live/sandbox mode, client key and secret key.

Tenant settings and provider secrets cannot currently be fetched or securely saved. Their UI states this and disables service actions. Secrets stay in component memory; no external messages, OAuth exchange or payments are sent. Source tenant/branch inheritance and authorization need the real server contract before acceptance.

## Verification boundary

- Receipt model tests cover targeted/pooled allocation, exact cents, target ownership/balance, method availability and bank eligibility.
- The route rendering check covers all six super settings query sections, account scope and real student record content.
- The code reviewer confirmed the finance filter identity fix. Browser/keyboard/pointer and visual validation remain blocked by the Sites preview environment; a successful build does not satisfy that gate.
- Final checkpoint: all 80 model/regression tests passed, production build passed and 113-target populated/empty rendering checks passed. Five scoped catalog findings were corrected and independently re-reviewed, including legacy lesson identity through renames. Source lifecycle and service limits above remain open.
