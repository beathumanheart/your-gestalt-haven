# Booking Observability Setup

Manual steps to configure PostHog dashboards, alerts, and Supabase log access after deploying `feat/booking-observability`.

---

## Section 1: Create the PostHog "Booking Failures" Dashboard

### 1.1 Create the dashboard

1. Open PostHog → **Dashboards** (left sidebar)
2. Click **New dashboard**
3. Name it **"Booking Failures"** → Save

### 1.2 Tile: Total failures last 7 days

1. Click **Add insight** inside the dashboard
2. Choose **Trends**
3. Event: `booking_failed`
4. Date range: **Last 7 days**
5. Visualization: **Number** (big number tile)
6. Title: "Failures – last 7 days"
7. Save insight → Add to dashboard

### 1.3 Tile: Total failures last 24 hours

Repeat 1.2 with Date range: **Last 24 hours**, title "Failures – last 24 hours".

### 1.4 Tile: Failures by error code

1. Add insight → **Trends**
2. Event: `booking_failed`
3. Click **+ Breakdown** → Property: `error_code`
4. Visualization: **Bar chart**
5. Date range: Last 7 days
6. Title: "Failures by error\_code"
7. Save → Add to dashboard

### 1.5 Tile: Failures by funnel step

Repeat 1.4 with Breakdown property: `funnel_step`, title "Failures by funnel\_step".

### 1.6 Tile: Booking funnel (30 days)

1. Add insight → **Funnels**
2. Add steps in order:
   - Step 1: `booking_funnel_book_now_clicked`
   - Step 2: `booking_funnel_confirmation_viewed`
   - Step 3: `booking_funnel_booking_completed`
3. Date range: **Last 30 days**
4. Title: "Booking funnel – 30 days"
5. Save → Add to dashboard

### 1.7 Tile: Recent failures table

1. Add insight → **Events & Actions** (or use **Query** → HogQL)
2. If using Events explorer: filter by Event = `booking_failed`, last 7 days
3. Columns to show: `timestamp`, `error_code`, `funnel_step`, `error_id`, `$user_agent`
4. Limit: 20 rows
5. Title: "Recent failures"
6. Save → Add to dashboard

---

## Section 2: Create the booking_failed Alert

### 2.1 Create the alert insight

1. Go to **Insights** → create a new **Trends** insight
2. Event: `booking_failed`
3. Aggregation: **Total count**
4. Date range: **Last 1 hour** (or the shortest interval available — see note below)
5. Save this insight as **"booking\_failed alert insight"**

### 2.2 Configure the alert

1. Go to **Alerts** (Activity → Alerts, or via the insight's "..." menu → "Set alert")
2. Insight: select **"booking\_failed alert insight"**
3. Condition: **value is ≥ 1** (any failure triggers)
4. Check frequency: select the **most frequent option** available (typically "every hour")
5. Destination: **Email** → enter your email address (placeholder: `YOUR_EMAIL@example.com`)
6. Save

### Important note on alert delay

PostHog alerts check on a minimum interval of **1 hour** as of early 2026. This means you may receive the alert up to ~60 minutes after the first failure occurs.

If you need sub-minute alerting later (e.g. for a production incident where every failed booking is a missed client), the right approach is to add a **Telegram webhook directly from the edge function** — a 30-line addition to `supabase/functions/process-booking/index.ts` that posts to a Telegram bot when `emailSent === false` or when the top-level catch fires. That remains a future improvement.

---

## Section 3: Viewing Supabase Logs by Request ID

Every booking failure, success, and email event now emits a structured JSON log line containing `requestId`. Use this to correlate a PostHog `error_id` → Supabase `requestId` → full log context.

### 3.1 Supabase Dashboard UI

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Left sidebar → **Edge Functions**
3. Click **process-booking**
4. Click the **Logs** tab
5. In the search/filter box, enter the `requestId` value (e.g. `550e8400-e29b-41d4-a716-446655440000`)
6. The log lines for that invocation appear — look for the `step`, `errorCode`, and `errorMessage` fields

### 3.2 Supabase CLI

```bash
# Stream live logs (useful during testing)
supabase functions logs process-booking --tail

# Filter by requestId (pipe through grep)
supabase functions logs process-booking | grep "550e8400-e29b-41d4-a716-446655440000"

# Or with jq for structured output
supabase functions logs process-booking | grep "550e8400" | jq .
```

> **Note:** `supabase functions logs` currently does not support server-side filtering by field value. Use `grep` or `jq` locally.

---

## Section 4: Incident Response Runbook

When a `booking_failed` alert email arrives:

### Step 1 — Read the alert email

Note:
- `error_code` (what failed)
- `error_id` (client-generated UUID — the user may have seen this as "ref: ABC-123")

### Step 2 — Look up the request in Supabase logs

1. Open PostHog → find the recent `booking_failed` event
2. Copy the `request_id` property (the edge function's UUID)
3. Search Supabase logs for that `requestId` (see Section 3)
4. Read the structured log entries — `step`, `errorCode`, `durationMs`

### Step 3 — Diagnose by error code

| error\_code | Likely cause | First action |
|---|---|---|
| `VALIDATION_FAILED` | Frontend sent incomplete data (rare after deploy) | Check recent frontend commits; usually safe to ignore |
| `SLOT_TAKEN` | Race condition — two users booked same slot | No action needed; user saw a clear message to pick another time |
| `BREVO_UNREACHABLE` | Network failure between Supabase edge and Brevo | Check [Brevo status page](https://status.brevo.com) and [Supabase status](https://status.supabase.com) |
| `BREVO_REJECTED` | Brevo API rejected the request (quota, bounce, auth) | Open Brevo dashboard → check logs; may need to rotate the API key |
| `INTERNAL` | Unexpected error inside the edge function | Read Supabase logs filtered by `requestId`; likely a code bug or DB issue |
| `NETWORK` | User's browser lost connection before the request completed | Usually transient; the user saw a helpful message; no action needed |

### Step 4 — Proactive outreach

You cannot identify the specific user from logs alone (privacy by design — no PII is logged). However:

- If the failure was `BREVO_REJECTED` or `INTERNAL`, **all bookings in that window may have failed** — check the Supabase `bookings` table for recent rows with `email_sent = false`
- If you can identify the affected user from a recent booking (e.g. they mentioned it via Telegram), reach out to confirm their booking was received and their confirmation email is being re-sent manually if needed

### Step 5 — Document and fix

1. Create a file at `docs/incidents/YYYY-MM-DD-<short-description>.md`
2. Record: what failed, when, what the `error_code` was, what the root cause was, and what the fix was
3. If it was a code bug, add a regression test before deploying the fix

---

## Post-Deploy Verification Checklist

After deploying this branch to production:

- [ ] Follow Section 1 to create the PostHog "Booking Failures" dashboard
- [ ] Follow Section 2 to create the alert with your email address
- [ ] Manually submit a test booking (use a real email to confirm the confirmation email arrives)
- [ ] Check PostHog → Events — verify `booking_funnel_booking_completed` appears (success path)
- [ ] To test the failure path: temporarily set `BREVO_API_KEY` to an invalid value via `supabase secrets set BREVO_API_KEY=invalid`, submit a booking, verify:
  - The user sees the "Our booking system is having trouble" message
  - A `booking_failed` event appears in PostHog with `error_code: BREVO_REJECTED`
  - A `ref: <uuid>` is visible below the error message
  - Supabase logs show the structured error JSON with `requestId`
- [ ] Reset the API key: `supabase secrets set BREVO_API_KEY=<real-key>`
- [ ] Confirm the PostHog alert email arrives (within ~1 hour of the test failure)
