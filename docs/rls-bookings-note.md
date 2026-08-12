# Note: bookings SELECT policy was never publicly readable

While adding short session links (migration `20260812000001`) it was claimed that
`public.bookings` had been world-readable via the anon key since February,
exposing `client_email` and `notes`. **That claim was wrong**, and the comment
inside `20260812000001_short_session_links.sql` repeats it — disregard it.

The permissive `FOR SELECT USING (true)` policy existed only in the initial
schema migration `20260223215135` (2026-02-23 21:51:35 UTC) and was dropped
20 seconds later by `20260223215155` (21:51:55 UTC), which replaced it with
`Admins can read all bookings` gated on `has_role(auth.uid(), 'admin')`. Both
migrations were applied to production together, before the site carried any
real bookings, so there is no exposure window to assess and no affected rows.

The `DROP POLICY IF EXISTS "Clients can view own bookings by email"` in
`20260812000001` was therefore a no-op — that policy had not existed since
February. The live policy set was not altered by it.

## Verify

```sql
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'bookings'
order by policyname;
```

Expected: `Admins can manage all bookings` (ALL), `Admins can read all bookings`
(SELECT, `has_role(...)`), `Anyone can create bookings` (INSERT, anon +
authenticated, `WITH CHECK (true)`). No SELECT policy with a `true` predicate.

Public availability does not depend on reading this table: it goes through
`get_booked_slots()`, which is `SECURITY DEFINER`.
