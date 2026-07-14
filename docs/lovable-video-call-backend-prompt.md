# Lovable AI prompt — manual reciter availability backend

Copy and send the following prompt to Lovable AI while the `main` branch is selected:

---

Apply only the Supabase backend changes for the manual reciter-availability feature in the current `main` branch, including commit `4ab4491`.

The previous durable video-call signaling backend changes have already been applied successfully. Do not reapply or modify the durable signaling migrations, `public.video_call_sessions` schema, signaling trigger, or Realtime publication.

Important constraints:

- Continue using only the existing Lovable-linked Supabase project. Do not add another server, calling provider, TURN provider, scheduled job, or paid service.
- Do not drop or recreate any table and do not delete or rewrite existing records.
- Do not change unrelated tables, Edge Functions, authentication, subscriptions, credits, or payment logic.
- Do not weaken RLS or grant anonymous access.
- The frontend implementation and generated TypeScript types are already complete.

Apply this existing additive migration exactly as committed:

`supabase/migrations/20260714090000_manual_reciter_availability.sql`

The migration must:

1. Add `public.reciter_profiles.is_available boolean NOT NULL DEFAULT false` if it does not exist.
2. Keep all existing reciter profile rows and fields intact. Existing rows must receive `is_available = false`.
3. Create the partial index `idx_reciter_profiles_available_recent` contained in the migration.
4. Preserve the existing `reciter_profiles` RLS policies. Reciters must still be able to update their own profile, authenticated users may read approved reciter profiles under the existing policies, and no anonymous access may be added.

Deploy the updated existing Edge Function and its shared helper:

- `supabase/functions/request-call/index.ts`
- `supabase/functions/_shared/reciter-availability.ts`

Immediately before creating a student-initiated call session, `request-call` must require the target reciter to:

- have an approved `reciter_profiles` record,
- have `is_available = true`, and
- have `last_seen_at` no older than 60 seconds.

If any availability check fails, return HTTP 200 with exactly this response shape and create no call session:

```json
{ "error": "reciter_unavailable", "message": "المقرئ غير متاح حالياً" }
```

Do not apply this availability restriction to reciter-initiated calls or existing/ongoing calls. Do not change the existing subscription and credit checks.

After applying and deploying, verify and report:

- `reciter_profiles.is_available` exists, is boolean, non-null, and defaults to `false`.
- Existing reciter profile rows remain intact and have `is_available = false` initially.
- The existing `reciter_profiles` RLS policies were not removed or broadened.
- An approved reciter can update their own `is_available` and `last_seen_at` fields through the authenticated client.
- A profile with `is_available = false` is rejected by `request-call` and no session is created.
- A profile with a heartbeat older than 60 seconds is rejected and no session is created.
- An unapproved or missing reciter profile is rejected and no session is created.
- An approved profile with `is_available = true` and a fresh heartbeat proceeds through the existing subscription and credit checks.
- The updated `request-call` Edge Function, including the shared helper, is deployed successfully.
- No durable signaling objects or unrelated backend resources were changed.

Do not deploy the frontend until this migration succeeds and the updated `request-call` Edge Function is deployed.

---
