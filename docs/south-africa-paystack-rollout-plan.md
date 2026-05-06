# South Africa Paystack Rollout Plan

## Current Architecture Summary
- The app is a shared Next.js + Prisma codebase with session-cookie auth in `middleware.ts`.
- Credits live on `User.credits`, usage is tracked in `Ledger`, and purchases are stored in `Purchase`.
- Tailored resumes and cover letters are stored in `Document`, but documents currently have no market or per-download entitlement state.
- Zimbabwe payments are wired through PesePay routes and credit fulfillment is handled in `lib/billing.ts`.
- Tailoring is currently credit-gated up front in `app/api/parse-resume/route.ts` and `app/api/tailor/route.ts`.
- Downloads currently export client-provided markdown through `/api/export/pdf` and `/api/export/docx`.

## Risky Areas
- Tailored markdown reaches the browser before any payment enforcement, so UI-only locking would be insufficient.
- Payment fulfillment is currently credit-specific and assumes every paid purchase grants credits.
- Billing history, admin purchase views, and receipt logic assume credit purchases only.
- Existing UI copy is USD- and credit-centric, which would be confusing on South Africa domains.

## Data Model Changes Needed
- Add `MarketCode` and `PurchaseType` enums.
- Extend `Document` with:
  - `market`
  - `downloadPriceMinor`
  - `downloadCurrency`
  - `unlockedAt`
  - `unlockPurchaseId`
- Extend `Purchase` with:
  - `type`
  - `market`
  - `documentId`
  - `fulfilledAt`
- Backfill existing purchases and documents to Zimbabwe defaults.

## Route and Service Changes Needed
- Add central market resolution utilities:
  - `resolveMarket()`
  - `getMarketFromRequest()`
  - `getMarketConfig()`
- Refactor payments behind provider abstractions:
  - `lib/payments/types.ts`
  - `lib/payments/providers/pesepay.ts`
  - `lib/payments/providers/paystack.ts`
  - `lib/payments/service.ts`
- Add protected document payment/download routes:
  - `POST /api/documents/[id]/unlock`
  - `POST /api/documents/[id]/download`
- Add generic purchase status flow and Paystack webhook handling.

## Env Vars Needed
- `APP_BASE_URL`
- `PESEPAY_INTEGRATION_KEY`
- `PESEPAY_ENCRYPTION_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `DEFAULT_MARKET`
- `NEXT_PUBLIC_DEFAULT_MARKET`

## Migration Strategy
- Apply additive Prisma migration only.
- Backfill all existing documents and purchases to `ZW`.
- Preserve existing PesePay records and legacy `meta.credited` flags so old paid purchases do not re-apply credits.
- Regenerate Prisma client after the migration lands.

## Rollback Safety Notes
- Zimbabwe remains the default fallback market.
- PesePay routes and Zimbabwe credit behavior stay in place.
- New schema fields are additive, so rollback can be handled by disabling South Africa hostnames and env vars without deleting data.
