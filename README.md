# SquadTrust Web Dashboard

**Owner:** Fiopefoluwa  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Framer Motion · recharts

---

## Your 7-Day Build Plan

### Day 1 — Prompt 1.2: Next.js Dashboard Scaffold

**Depends on:** Nothing — start this immediately

Paste this into Claude Code:

```
Scaffold the merchant dashboard for SquadTrust. Repo: squadtrust-web.

Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, lucide-react,
TanStack Query for data fetching, Zod for validation.

Pages to scaffold (use placeholder data for now — the API isn't ready yet):
  /                       — Landing page with "Login as Merchant" CTA
  /login                  — Phone + OTP placeholder (no real auth yet, just
                            store merchant_id in localStorage on submit)
  /dashboard              — Trust Score gauge, recent transactions, quick stats
  /dashboard/escrow       — Create escrow link form + list of escrow transactions
  /dashboard/softpos      — List of recent Soft POS transactions
  /dashboard/loans        — "Apply for working capital" CTA, shows current
                            eligibility based on trust score
  /pay/[transaction_ref]  — Buyer-facing escrow payment page (this is the page
                            buyers land on when they click a merchant's payment
                            link)

Brand:
- Primary: deep emerald green (#0B6E4F) — represents trust
- Accent: warm gold (#E8A317) — represents value
- Background: clean white with subtle texture
- Font: Inter (free, professional)
- Logo: just the wordmark "SquadTrust" with a small shield icon for now

Components to build (in /components):
  TrustScoreGauge.tsx     — Circular gauge 0-1000, with color zones
                            (red < 400, yellow 400-700, green > 700)
  TransactionRow.tsx      — Shows ref, amount in Naira (format from Kobo),
                            status badge, timestamp
  StatusBadge.tsx         — Color-coded badge for transaction statuses
  AmountInput.tsx         — Naira input that converts to Kobo on submit
  CreateEscrowForm.tsx    — Customer phone, product description, amount,
                            delivery method dropdown

Data layer:
- Create /lib/api.ts with a typed fetch wrapper pointing to
  NEXT_PUBLIC_API_BASE_URL (default http://localhost:8000)
- All endpoint calls go through TanStack Query hooks in /lib/hooks/

Done when:
- `npm run dev` boots cleanly
- All pages render with placeholder data
- TrustScoreGauge renders correctly for scores 0, 350, 600, 850
- Mobile-responsive (test at 375px width — this is critical, judges will
  view from their phones)
```

**Done when:** All pages render with placeholder data. `TrustScoreGauge` works at all four score values. Layout holds at 375px.

---

### Day 2 — Prompt 2.2: Escrow Dashboard UI

**Depends on:** Abideen finishes 2.1 (escrow API endpoints are live)

Paste this into Claude Code:

```
Build the merchant-facing and buyer-facing Escrow UI in squadtrust-web.

/dashboard/escrow (merchant view):
  - "Create Escrow Link" button opens a modal with CreateEscrowForm
  - On submit: POST /escrow/create, then show a success modal with:
    - The payment_url (with copy button)
    - A QR code of the payment_url (use qrcode.react)
    - A "Share on WhatsApp" button (whatsapp://send?text=...)
    - A "Share on X/Twitter" button
  - Below: a live table of all escrow transactions for this merchant with:
    - Customer phone
    - Amount
    - Status (color-coded badge: gray=pending, blue=funded, yellow=ai_verifying,
      green=released, red=refunded/expired)
    - Created time
    - Actions: "View" → opens a side drawer with full details + chat log
    - "Confirm Delivery" button (only visible when status=funded, for the
      manual fallback)
  - Use TanStack Query with 5-second polling on the list so status updates
    appear live during the demo

/pay/[transaction_ref] (buyer view):
  - Fetch GET /escrow/{transaction_ref}
  - Big hero: "Pay [merchant_name] safely with SquadTrust Escrow"
  - Show product description + amount in Naira
  - Show the virtual account number with copy button + bank name
  - "Your money is held safely until you confirm delivery" trust message
  - Auto-refresh every 3 seconds; when status becomes "funded", show a
    success state: "Payment received! Funds held in escrow until delivery."
  - When status becomes "released", show: "Delivery confirmed. Transaction
    complete."
  - When status becomes "refunded", show: "Refunded — funds returned to you."

UX must look polished — this is one of the demo screens. Use Framer Motion
for the status transitions and a confetti animation when status hits
"released" on the buyer page.

Done when:
- Merchant can create escrow → share link → see it in their dashboard
- Buyer can open the payment link, see the VA number, and watch the status
  update live when the payment is simulated from the backend
- All flows work on a 375px mobile viewport
```

**Done when:** Full escrow flow visible end-to-end: merchant creates → buyer page shows VA → status polls live. Confetti fires on release. 375px tested.

---

### Day 4 — Prompt 4.2: Soft POS Dashboard Surface

**Depends on:** Abimbola finishes 4.1 (Soft POS mobile flow working)

Paste this into Claude Code:

```
Add Soft POS surfaces to squadtrust-web:

/dashboard/softpos:
- Today's total: big stat card with sum of today's successful Soft POS sales
- Last 7 days bar chart (use recharts) — Naira processed per day
- Live transaction feed with 5-second polling — newest first
- Each row: card_last4 (masked: "•••• 4242"), amount, status, time

/dashboard (main):
- Add a "Tap to Pay" tile that says "Use your phone app to accept card
  payments — no POS terminal needed" with a QR code linking to the mobile
  app install (placeholder for now)
- Add a "Today's Sales" combined stat: escrow + softpos

Done when:
- A live Soft POS transaction from the mobile app appears in the web
  dashboard within 5 seconds (via polling)
- Chart renders correctly with 0 days, 1 day, and 7 days of data
- Layout doesn't break on mobile viewport
```

**Done when:** Live Soft POS transaction from Abimbola's phone appears in the dashboard within 5 seconds. Chart handles all data ranges.

---

### Day 5 — Prompt 5.1: Trust Score & Loan UI (The Money Shot)

**Depends on:** Abideen + Iseoluwa finish 3.2 and 3.3 (trust score engine + seed data)

This is the 60-second climax of the demo. Make it exceptional.

Paste this into Claude Code:

```
Build the Trust Score and Loan Unlock UI — this is the climactic 60 seconds
of our demo. It must look exceptional.

/dashboard/loans:
- Hero section:
  - Animated TrustScoreGauge that counts up from 0 to current score over
    1.5 seconds when the page loads (Framer Motion)
  - Below the gauge: the rank ("Trusted+") and the current loan ceiling
    in big numbers (₦100,000)
- "What's powering your score" panel:
  - Horizontal bars for each component (fulfillment, velocity, refund rate,
    softpos volume, sentiment, account age) showing the contribution
  - Each bar has a tooltip explaining what would improve it
- "Get working capital" section:
  - Slider from ₦5,000 to max_amount_naira in ₦5,000 increments
  - Tenor selector: 30/60/90 days
  - "Apply for ₦{amount}" CTA button
  - On click: confirmation modal showing:
    - Loan amount
    - Monthly rate (2.5%)
    - Total repayable
    - "Approve" button
  - On approve: full-screen success animation (confetti + checkmark) and
    "Funds disbursed to your GTBank account" message
- "How to grow your score" panel:
  - Pulls from the LLM-generated explanation
  - Lists 2-3 concrete actions

This page must have wow factor. Use:
- Smooth Framer Motion transitions
- A subtle gradient background tied to the score (red→amber→emerald as score
  climbs)
- High-quality lucide icons
- Generous whitespace

Done when:
- Loading the page with Aisha (score ~720) renders a confident "Trusted+"
  experience with ₦100k available
- Loading with Tunde (score 0) shows an empathetic "Build your trust"
  state with locked loan section and clear next actions
- Loading with Chioma (score ~880) shows the wow case — ₦500k available,
  glowing emerald background
- The loan application flow completes end-to-end with a clear success state
```

**Done when:** All three merchant profiles produce distinct, correct experiences. Loan application completes with confetti. Background gradient shifts by score.

#### Also Day 5 — Demo Control Panel UI

**Coordinate with:** Abideen (he owns the backend endpoints for this)

The `/admin/demo-control` page needs a frontend. Abideen will tell you which endpoints it calls. Build the UI in shadcn/ui with:

- Merchant switcher (Aisha / Tunde / Chioma)
- "Fund Escrow" button
- Chat scenario loader (buttons for 1, 2, 3)
- "Force AI Verify" button
- "Reset Demo" button

Every button needs a loading state and success toast. Auth-gate the page with `DEMO_OPERATOR_PASSWORD` from env (check it client-side via a simple cookie).

---

### Day 7 — Prompt 7.1: Repo Cleanup

Polish the README, then **make this repo public**. The README must tell a judge how to run the dashboard in three commands. Test it yourself on a clean machine.

---

## Kobo / Naira Rule

**Every API response contains amounts in Kobo (integer).** Convert to Naira for display only:

```ts
// display
const naira = (amount_kobo / 100).toLocaleString("en-NG", {
  style: "currency",
  currency: "NGN",
});

// submit (AmountInput handles this — use that component everywhere)
const kobo = Math.round(nairaInput * 100);
```

Never pass Naira to any API endpoint. `AmountInput.tsx` is the only place conversion happens on input.

## Status Badge Colours

| Status                 | Colour |
| ---------------------- | ------ |
| `pending`              | gray   |
| `funded`               | blue   |
| `ai_verifying`         | yellow |
| `needs_review`         | orange |
| `released`             | green  |
| `refunded` / `expired` | red    |

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

| Variable                   | Description                                   |
| -------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL — default `http://localhost:8000` |
| `DEMO_OPERATOR_PASSWORD`   | Password for `/admin/demo-control`            |
