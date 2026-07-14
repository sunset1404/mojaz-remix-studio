# Lovable AI prompt — video-call signaling and reciter availability backend

Copy and send the following prompt to Lovable AI while this branch is selected:

---

Apply the Supabase backend changes required by the `fix/reliable-video-calls` branch.

Important constraints:

- Continue using only the existing Lovable-linked Supabase project. Do not add another server, calling provider, TURN provider, or paid service.
- Do not drop or recreate `public.video_call_sessions` and do not delete or rewrite existing call records.
- Do not change unrelated tables, Edge Functions, authentication, subscriptions, or payment logic.
- Do not weaken RLS or grant anonymous access to authenticated call sessions.
- The frontend implementation and generated TypeScript types are already complete. Do not replace the durable SDP flow with ephemeral Broadcast messages.

Use and apply the existing additive migration:

`supabase/migrations/20260713090000_durable_video_call_signaling.sql`

Also apply the new additive reciter-availability migration:

`supabase/migrations/20260714090000_manual_reciter_availability.sql`

The migration must:

1. Add these columns to `public.video_call_sessions` if they do not exist:
   - `signaling_generation integer NOT NULL DEFAULT 1`
   - `caller_ready_at timestamptz`
   - `callee_ready_at timestamptz`
   - `offer_sdp jsonb`
   - `answer_sdp jsonb`
   - `offer_generation integer`
   - `answer_generation integer`
   - `caller_connection_state text`
   - `callee_connection_state text`
   - `failure_code text`
2. Add the generation and peer-connection-state check constraints contained in the migration.
3. Create `public.sync_video_call_connected_status()` and its trigger so a session changes to `active` and receives `started_at` only when both caller and callee connection states equal `connected`.
4. Preserve `ended` and `failed` sessions—the trigger must never reactivate them.
5. Confirm `public.video_call_sessions` remains enabled for Supabase Realtime. It is already expected to be in the `supabase_realtime` publication; do not add it twice if it is already present.
6. Preserve the existing participant RLS behavior: the session's student and reciter can select/update their own session, while unrelated authenticated users cannot access it.

The reciter-availability migration must:

1. Add `public.reciter_profiles.is_available boolean NOT NULL DEFAULT false` without recreating the table or modifying any existing profile fields.
2. Add the partial recent-availability index contained in the migration.
3. Preserve the existing `reciter_profiles` RLS policies. Do not broaden public or anonymous access.

Deploy the updated existing Edge Function:

`supabase/functions/request-call/index.ts`

Immediately before creating a student-initiated call session, it must require the target reciter to:

- have an approved `reciter_profiles` record,
- have `is_available = true`, and
- have `last_seen_at` within the previous 60 seconds.

If any check fails, it must return HTTP 200 with exactly this response shape and create no session:

```json
{ "error": "reciter_unavailable", "message": "المقرئ غير متاح حالياً" }
```

Do not apply this restriction to reciter-initiated calls or existing/ongoing calls. Do not change the existing subscription and credit checks.

After applying the migration, verify and report:

- All new columns exist with the expected types/defaults.
- Existing rows are intact and have `signaling_generation = 1`.
- Updating only one peer state to `connected` does not activate a waiting test session.
- Updating both peer states to `connected` sets `status = 'active'` and populates `started_at`.
- An `ended` or `failed` session remains unchanged when connection-state columns are updated.
- Realtime UPDATE events for `video_call_sessions` are enabled.
- No RLS policy was removed or broadened.
- `reciter_profiles.is_available` exists, is non-null, defaults to `false`, and all existing rows remain intact.
- A profile with `is_available = false` is rejected by `request-call` and creates no session.
- A profile with a heartbeat older than 60 seconds is rejected and creates no session.
- An approved profile with `is_available = true` and a fresh heartbeat can proceed through the existing call checks.
- An unapproved or missing reciter profile is rejected and creates no session.
- The updated `request-call` Edge Function is deployed successfully.

Do not deploy the frontend before both migrations and the updated Edge Function succeed, because the branch reads and writes these columns during call setup.

---
