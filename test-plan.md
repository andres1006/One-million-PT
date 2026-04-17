# Test plan — PR #12 (API layer + webhooks automation)

Target: https://github.com/andres1006/One-million-PT/pull/12
Tested against local dev server (`pnpm dev`, `NEXT_PUBLIC_MOCKS=off`) so the
new route handlers under `src/app/api/**` are actually exercised. MSW path
is NOT what this PR changed.

## What the PR actually changed (user-visible)

1. Client no longer talks to MSW by default — it fetches real Next.js route
   handlers (`/api/leads/*`, `/api/webhooks/*`, `/api/webhooks/events`,
   `/api/webhooks/inbound/[source]`).
2. New `/automations` page with three tabs: Entrada (inbound endpoints +
   "Simular evento entrante" button), Salida (outbound webhooks CRUD),
   Bitácora (polling 5s).
3. Every mutation on a lead fans out to enabled outbound webhooks. Each
   attempt (success or failure) is logged and shown in Bitácora.
4. Two bugs found by Devin Review were fixed in `b5074b6`:
   - `webhookUpdateSchema` no longer re-enables a paused webhook when PATCH
     omits `enabled` (Zod v4 `.partial()` default leak).
   - `/api/webhooks/events?limit=-5` now clamps to `[1, 200]` instead of
     running `slice(0, -5)`.

## Primary flow (one recording)

### Test A — Lead creation triggers outbound delivery (proves end-to-end loop)
Steps
1. Open `/automations`, select tab **Bitácora** — assertion: table shows the
   seed state (may already have entries from Pipedrive demo; record the
   current count N).
2. Open `/leads`, click **Nuevo lead**, fill name "QA E2E", email
   `qa-e2e@example.com`, source = `instagram`, stage = `nuevo`, submit.
3. Return to `/automations` → **Bitácora** and wait ≤ 6s (poll interval 5s).

Pass criteria (all must hold)
- A new row appears at the top with direction **Saliente** (sky arrow icon).
- Event badge reads `lead.created` (humanized label exists but the mono
  badge uses the raw event name from `WEBHOOK_EVENT_LABEL`).
- Status column shows either ✓ HTTP 2xx or ✗ with a real HTTP error
  (Pipedrive demo URL resolves to `webhook.site`, so 200 is expected; if
  DNS is blocked in the sandbox we accept ✗ with a network error — what
  matters is that an outbound attempt was logged, which only happens if
  the new dispatcher ran).
- Detail column contains `Lead QA E2E` (from the dispatcher summary).

Why this would fail if broken: if the API layer weren't wired up, the POST
to `/api/leads` would 404 and the lead wouldn't appear. If the fan-out
weren't wired, the new Saliente row would not appear at all within 6s.

### Test B — Inbound simulation creates a lead AND logs both events
Steps
1. On `/automations` → **Entrada**, select channel = `facebook`.
2. Click **Simular evento entrante**.
3. Go to `/leads` — assertion: a lead named exactly "Lead simulado" with
   email matching `sim-*****@example.com` appears at the top. Source column
   shows "Facebook".
4. Go back to `/automations` → **Bitácora**.

Pass criteria
- Toast shows "Lead entrante registrado desde facebook".
- `/leads` table contains "Lead simulado" with source "facebook".
- Bitácora has TWO new rows from this action:
  - One **Entrante** (green down-arrow) with event `lead.inbound` and
    status "ignorado" (no outbound subscriber for inbound events in the
    seed → status="skipped").
  - One **Saliente** with event `lead.created` (from fan-out triggered by
    the freshly-created lead).

Why this would fail if broken: if the inbound route's Zod validation or
normalization were wrong, step 3 would show no lead. If the dispatcher
didn't double-emit, Bitácora would only show one of the two events.

### Test C — Regression: paused webhook stays paused after PATCH without `enabled`
This targets the Zod `.partial()` default-leak bug fix.

Steps
1. On `/automations` → **Salida**, observe the row "Campañas — Mailchimp
   journey" has badge **Pausado**.
2. Click the pencil (edit) icon on that row.
3. In the dialog, do NOT touch the **Activo / Pausado** switch. Change the
   **Nombre** field to `Campañas — Mailchimp journey (renamed)` and save.
4. After the dialog closes, observe the Estado column for that row.

Pass criteria
- The Estado badge is still **Pausado** (outline, muted color).
- The Nombre column shows the new name.
- A manual `curl http://localhost:3000/api/webhooks | jq` confirms the row's
  `enabled` is still `false` (evidence captured as text, not on camera).

Why this would fail if broken: before the fix, saving the rename would
silently flip `enabled` to `true` because `webhookCreateSchema.partial()`
still produced `enabled: true` as the default, and the PATCH body would
re-enable the webhook. The badge would flip to **Activo**.

## Out of scope / explicitly NOT tested
- Update/delete lead flows (same fan-out code path as create — one test is
  enough to prove the wiring).
- Actual outbound delivery success against a real CRM — the seeds point
  at demo URLs and the dispatcher has a 4s timeout; we only assert that a
  delivery was *attempted* and logged, not that it returned 2xx.
- Auth, rate-limiting, signature verification — not part of this PR.

## Evidence collection
- One continuous screen recording with `computer` annotations per test
  start + assertions.
- Side-channel: `curl /api/webhooks` before/after Test C, captured to
  text output.
