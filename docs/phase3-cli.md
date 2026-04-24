# Phase 3 — Steps 3.4–3.7: CLI Install, Link, Secrets, Deploy, Smoke Test

Replace `<NEW_REF>` throughout with the project ref you captured in Step 3.1.

---

## Step 3.4 — Install and link Supabase CLI

```bash
brew install supabase/tap/supabase
supabase --version   # should print 2.x.x
```

Log in (opens browser for GitHub OAuth):

```bash
supabase login
```

Link to the new project:

```bash
cd /Users/yauhask/projects/humanheart-life
supabase link --project-ref <NEW_REF>
supabase status      # shows linked project details
supabase functions list   # expected: empty list
```

---

## Step 3.5 — Set secrets

Paste values from your password manager. Run one line at a time so you can
confirm each succeeds before continuing.

```bash
supabase secrets set BREVO_API_KEY=<paste>
supabase secrets set JAAS_API_KEY_ID=<paste>
supabase secrets set JAAS_APP_ID=<paste>
supabase secrets set JAAS_PRIVATE_KEY=<paste>
```

> **JAAS_PRIVATE_KEY note:** This is a multi-line PEM string. If the CLI rejects
> it inline, write it to a temp file and use:
> ```bash
> supabase secrets set JAAS_PRIVATE_KEY="$(cat /tmp/jaas_key.pem)"
> rm /tmp/jaas_key.pem
> ```

Verify all four are set:

```bash
supabase secrets list
```

Expected output lists: `BREVO_API_KEY`, `JAAS_API_KEY_ID`, `JAAS_APP_ID`,
`JAAS_PRIVATE_KEY`. Values are redacted — only names are shown.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
Supabase into every edge function — do not set them manually.

---

## Step 3.6 — Deploy the edge function

```bash
supabase functions deploy process-booking
supabase functions list   # process-booking should now appear
```

---

## Step 3.7 — Smoke test the function

This confirms the function is alive and reachable. Replace `<NEW_REF>` and
`<ANON_KEY>` with the values from Step 3.1.

```bash
curl -X POST \
  https://<NEW_REF>.supabase.co/functions/v1/process-booking \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  --data '{"test": true}' \
  --silent | jq .
```

**Expected response** — the function handles missing fields with a structured error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "...",
    "requestId": "..."
  }
}
```

What this confirms:
- The function deployed and is reachable (`VALIDATION_FAILED`, not a 404 or 503)
- The structured error response format works (proving the function's own code ran)
- Infrastructure is healthy

If you get `{"error": "Function not found"}` → deployment didn't complete, re-run Step 3.6.
If you get a network error → check the project ref and anon key.
If you get `{"error": {"code": "INTERNAL"}}` → check edge function logs in Supabase
Dashboard → Edge Functions → `process-booking` → Logs for details.
