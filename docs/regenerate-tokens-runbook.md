# Runbook: Regenerate Booking Tokens

One-time procedure to re-generate JaaS JWT meeting links for existing confirmed
bookings after the JWT expiration bug was fixed.

**Background**: Before the fix, `process-booking` generated JWTs anchored to the
booking-creation time (`now + 3h`). Any session booked more than ~2.5 h in advance
had an expired link by the time the client joined. The fix scopes tokens to the
actual session window (`session_start − 30 min` → `session_end + 30 min`).

---

## 1. Set `REGEN_SECRET` in Supabase

The `regenerate-booking-tokens` function is auth-gated by a custom secret header.
You must set this secret before invoking the function.

**In Lovable Cloud → Supabase → Edge Functions → Secrets** (or via Supabase Dashboard
→ Settings → Edge Function Secrets):

```
REGEN_SECRET = <generate a strong random value, e.g. openssl rand -hex 32>
```

The function already has access to `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
and the JaaS credentials (`JAAS_APP_ID`, `JAAS_PRIVATE_KEY`, `JAAS_API_KEY_ID`)
from your existing secrets — no changes needed for those.

---

## 2. Invoke the Function

Replace `<PROJECT_REF>` with your Supabase project reference
(e.g. `syoddekztothkodfwvxn`) and `<REGEN_SECRET>` with the value you set above.

```bash
curl -X POST \
  https://<PROJECT_REF>.supabase.co/functions/v1/regenerate-booking-tokens \
  -H "Authorization: Bearer <REGEN_SECRET>" \
  -H "Content-Type: application/json" \
  --silent | jq .
```

**Expected response**:
```json
{
  "regenerated": 3,
  "skipped": 0,
  "errors": []
}
```

- `regenerated` — bookings whose `google_meet_link` was updated with a fresh JWT
- `skipped` — bookings using a public Jitsi fallback link (no JWT to regenerate)
- `errors` — array of `"<booking_id>: <reason>"` strings for anything that failed

If `errors` is non-empty, check Supabase Edge Function logs for
`"event": "regen_error"` entries (each includes `bookingId`, no PII).

---

## 3. Verify the Regeneration

### Check the response counts

The `regenerated` count should equal the number of future confirmed bookings
that have a JaaS link (containing `8x8.vc`). `skipped` are non-JaaS links.

### Inspect the Supabase logs

In the Supabase Dashboard → Edge Functions → `regenerate-booking-tokens` → Logs:

Each successfully regenerated booking produces a structured log entry:

```json
{
  "event": "token_regenerated",
  "bookingId": "...",
  "sessionStartIso": "2026-04-23T10:00:00.000Z",
  "sessionEndIso": "2026-04-23T10:50:00.000Z",
  "nbfIso": "2026-04-23T09:30:00.000Z",
  "expIso": "2026-04-23T11:20:00.000Z"
}
```

Verify that `nbfIso` is ~30 min before `sessionStartIso` and `expIso` is ~30 min
after `sessionEndIso` for each entry.

### Spot-check a booking in the database

```sql
SELECT id, start_time, end_time,
       substring(google_meet_link, 1, 80) AS link_preview
FROM bookings
WHERE status = 'confirmed'
  AND start_time > now()
ORDER BY start_time
LIMIT 5;
```

The `link_preview` should end with `?jwt=` followed by the token (not a full
visible URL — the token will be hundreds of characters). The important thing is
that the link structure is `https://8x8.vc/<appId>/<roomName>?jwt=<token>#config...`.

To decode the token's `nbf`/`exp` without a library:

```bash
# Extract and decode the JWT payload (second segment)
echo "<token_second_segment>=" | base64 -d | jq '{nbf, exp}'
# Then convert Unix timestamps: date -r <nbf_value> (macOS) or date -d @<nbf_value> (Linux)
```

---

## 4. Notify Affected Clients

The regeneration function does **not** send emails. You must manually notify any
client whose link has changed if they already received a booking confirmation.

**Identify affected clients**:

```sql
SELECT b.id, b.start_time, b.client_name, b.client_email, s.name_en AS session_type
FROM bookings b
JOIN session_types s ON b.session_type_id = s.id
WHERE b.status = 'confirmed'
  AND b.start_time > now()
ORDER BY b.start_time;
```

**What to tell them**:

> "Your session on [date] at [time] is confirmed. We've sent an updated meeting
> link — please use the link in this message (or log into your confirmation email
> for the refreshed link). The old link is no longer valid."

Include the fresh `google_meet_link` from the database for each client.

---

## 5. Safety Notes

- The function only processes `status = 'confirmed'` bookings with
  `start_time > now()`. Completed and cancelled bookings are unaffected.
- It preserves the existing `roomName`, so the video room itself does not change —
  only the JWT token changes.
- The function is idempotent: running it twice will regenerate links again
  (harmless, but unnecessary).
- After running, remove or rotate `REGEN_SECRET` from Supabase secrets.
  The function is no longer needed once all tokens are refreshed.
