# Test report — PR #12 (API layer + webhooks automation)

**PR:** https://github.com/andres1006/One-million-PT/pull/12
**Branch:** `devin/1776454711-api-webhooks`
**Commit under test:** `b5074b6` (both Devin Review fixes applied)
**Env:** local `pnpm dev`, `NEXT_PUBLIC_MOCKS=off` (client hits real `/api/**` route handlers — MSW is not in the path of this PR)
**Session:** https://app.devin.ai/sessions/9d1f82bf66094a13a05b1252579ad789

## TL;DR

Summary: **ran one screen recording covering the three adversarial flows I planned. All three passed.** The PR’s API layer and outbound/inbound webhooks work end-to-end against the real Next.js route handlers.

> ⚠️ **Escalación / not part of this testing pass**: Devin Review flagged a **3rd bug** in `src/app/api/leads/route.ts` (`parseFilters` passes `NaN`/negative values to `applyLeadFilters` when the client sends `page=abc` or `pageSize=-1`). I did **not** fix it because you approved “ambos” = the two bugs already patched. It is independent of this PR’s happy path and tests still pass, but you’ll want to fix it before merge.

## Results

- ✅ **Test A** — creating a lead via `/leads` → `Nuevo lead` triggers one outbound delivery, logged as `Saliente` / `Lead creado` in Bitácora. Status is `error / fetch failed` because the seed webhook URL (`https://example-crm.test/...`) doesn’t resolve — this is expected and the point is that the dispatcher **attempted** delivery, which only happens if the new fan-out is wired.
- ✅ **Test B** — clicking `Simular evento entrante` on channel `facebook` creates a `Lead simulado` with source `Facebook` in `/leads`, and Bitácora shows **three** new rows tied to it: `Entrante lead.inbound 201`, `Saliente lead.inbound error`, `Saliente lead.created error`. This proves (a) the inbound route creates+persists a lead and (b) the dispatcher double-emits `lead.inbound` + `lead.created` as the spec says.
- ✅ **Test C (regression)** — renaming the paused `Campañas — Mailchimp journey` webhook via the edit dialog **without touching** the `Activo` switch leaves Estado = `Pausado`. Curl confirms `enabled=false` before and after:
  ```
  BEFORE edit:
    CRM — Pipedrive sandbox -> enabled=True
    Campañas — Mailchimp journey -> enabled=False
  AFTER edit:
    CRM — Pipedrive sandbox -> enabled=True
    Campañas — Mailchimp journey (renamed) -> enabled=False
  ```
  This is the exact scenario that the Zod `.partial()` default-leak would have broken — pre-fix, the PATCH would have silently re-enabled the webhook.

## Evidence (screenshots)

### Test A — lead creation triggers outbound fan-out

| Before (empty Bitácora) | After (1 Saliente `lead.created` row) |
| --- | --- |
| ![empty bitacora](https://app.devin.ai/attachments/8f493a94-98db-4fb9-a970-72a8b6240951/screenshot_b9fe96eedf574b128df3e18fd59b6484.png) | ![saliente row](https://app.devin.ai/attachments/70930427-9e06-4c6b-8cf4-044febf85d44/screenshot_e86341148add4882a7d5e38622bb0d72.png) |

Creation of the lead itself (toast “Lead creado”, count 16 → 17):

![lead creado](https://app.devin.ai/attachments/d63c930e-12ce-42e1-a076-73eed542649d/screenshot_45b31983badf425a887bc6da481b7b5c.png)

### Test B — inbound simulation creates lead AND logs both directions

| `/leads` — `Lead simulado` (Facebook) at the top | Bitácora — Entrante 201 + Saliente rows |
| --- | --- |
| ![lead simulado](https://app.devin.ai/attachments/1249bd82-fd8b-4645-b832-58b4a02d9e45/screenshot_428ef5edbfe947f395de7fc60a8d68e5.png) | ![bitacora with inbound](https://app.devin.ai/attachments/e49433b4-8931-4469-826a-89ba39cfab5b/screenshot_c379cf0331a44efb9db7ad2d2900818b.png) |

Toast on `Simular evento entrante`:

![toast inbound facebook](https://app.devin.ai/attachments/d1e00ee6-fd39-4c25-8187-df59faf82051/screenshot_d08fe5d20c9d4f2199db2d368e6e9622.png)

### Test C — paused webhook stays paused after rename

| Before (Pausado) | Edit dialog — rename only, Activo left untouched (unchecked) |
| --- | --- |
| ![salida before](https://app.devin.ai/attachments/20f277a9-3d72-4d22-8f47-fa4d9470d60d/screenshot_925fed4dd1a94da297a03eb939cd19d9.png) | ![edit dialog](https://app.devin.ai/attachments/d011245c-f509-44fd-9254-56e39abb73dd/screenshot_87664001a3a9410f96f58f63c1df42f0.png) |

After save — new name, Estado still **Pausado**:

![salida after](https://app.devin.ai/attachments/753257f6-ef5e-439e-a61e-6ffc4bef342f/screenshot_51052763408048758565211ec265074c.png)

## Recording

One continuous screen recording covering all three tests, with annotations at each `test_start` and `assertion`:

https://app.devin.ai/attachments/96ebca3a-48b5-4733-9fd2-cdca08e58525/rec-f03f3337-5161-4ce7-b2e7-2be9c72d9f4c-edited.mp4

## Out of scope / explicitly not tested

- Update/delete lead flows (same fan-out code path as create — one flow proves the wiring).
- Real 2xx against a live CRM — seed webhooks point at `*.test` hostnames that don’t resolve on purpose; we only assert that a delivery was attempted and logged.
- Auth / rate-limiting / signature verification — not in this PR’s scope.
- The new `parseFilters` NaN/negative bug flagged by Devin Review — not requested for this round.
