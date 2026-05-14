# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Squad API — Three Universal Gotchas

1. **Sandbox key prefix:** The backend validates `sandbox_sk_` — if you're calling the API directly from the frontend (you shouldn't be), the same rule applies.
2. **Kobo everywhere:** API responses contain `amount_kobo`. Display to users in Naira: `(amount_kobo / 100).toLocaleString('en-NG', {style:'currency', currency:'NGN'})`. The `AmountInput` component converts Naira input → Kobo on submit. Never pass Naira to any API endpoint.
3. **Unique `transaction_reference`:** Generated server-side. The frontend never generates refs; it only reads them from API responses.

---

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · lucide-react · TanStack Query · Zod · Framer Motion · recharts

## Project Layout

```
app/
  (public)/
    page.tsx                  — Landing page
    login/page.tsx            — Phone + OTP (stores merchant_id in localStorage)
    pay/[transaction_ref]/    — Buyer-facing escrow payment page
  dashboard/
    page.tsx                  — Trust Score gauge + recent txns + quick stats
    escrow/page.tsx           — Create escrow link + transaction list
    softpos/page.tsx          — Soft POS transaction feed + bar chart
    loans/page.tsx            — Trust Score detail + loan application flow
  admin/
    demo-control/page.tsx     — Demo operator panel (password-gated)
components/
  TrustScoreGauge.tsx         — Circular gauge 0-1000, color zones: red<400 / yellow<700 / green≥700
  TransactionRow.tsx          — Ref, Naira amount, status badge, timestamp
  StatusBadge.tsx             — Color-coded per status enum
  AmountInput.tsx             — Naira input → Kobo on submit
  CreateEscrowForm.tsx        — Customer phone, description, amount, delivery method
lib/
  api.ts                      — Typed fetch wrapper (base: NEXT_PUBLIC_API_BASE_URL)
  hooks/                      — TanStack Query hooks (one file per resource)
```

## Key Patterns

**All API calls go through `lib/api.ts`.** Never use raw `fetch` in components. All hooks live in `lib/hooks/`.

**TanStack Query polling:** Escrow transaction list polls every 5 seconds. Buyer payment page (`/pay/[ref]`) polls every 3 seconds. Soft POS feed polls every 5 seconds. Use `refetchInterval` on the query options — not `useEffect` + `setTimeout`.

**Kobo/Naira boundary:** `AmountInput` is the only place Naira → Kobo conversion happens. Everything else in the frontend treats amounts as Kobo integers from the API and formats them for display only.

**Mobile-first layout:** Every page must render correctly at 375px width. Judges will view from phones. Test at 375px before marking any UI task done.

**Framer Motion:** Status transitions on the buyer page (`/pay/[ref]`) are animated. The trust score gauge counts up from 0 on page load (1.5s animation). Loan approval shows a full-screen confetti + checkmark. Keep animations purposeful — one per key moment.

## Brand

- Primary: `#0B6E4F` (deep emerald)
- Accent: `#E8A317` (warm gold)
- Background: white with subtle texture
- Font: Inter
- The trust score background gradient shifts red → amber → emerald as score climbs (used on `/dashboard/loans`)

## Running Locally

```bash
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Type check: `npm run type-check`  
Lint: `npm run lint`

## Environment Variables

| Variable                   | Description                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL, default `http://localhost:8000`                        |
| `DEMO_OPERATOR_PASSWORD`   | Password for `/admin/demo-control` (checked client-side via cookie) |

## Status Badge Colors

| Status                 | Color  |
| ---------------------- | ------ |
| `pending`              | gray   |
| `funded`               | blue   |
| `ai_verifying`         | yellow |
| `released`             | green  |
| `refunded` / `expired` | red    |
| `needs_review`         | orange |
