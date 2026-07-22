# Invitations

Manager-only page for inviting prospective employees by email and managing invitations already
sent. Route `/invitations`, `src/pages/invitations/InvitationsPage.tsx`. Backend design:
`stafy-backend/docs/modules/invitations.md`.

## Scope

**In scope:** a form to send a new invitation by email; three summary tiles (pending / accepted /
expired counts, derived client-side); a table of every non-cancelled invitation the manager has
sent, with status badge and dates; resend and cancel actions on `pending`/`expired` rows.

**Out of scope (this release):** search/filter on the list (see backend doc's Deferred); a
confirmation dialog before cancel (matches the rest of this app — mutating actions elsewhere,
e.g. suspend employee, also fire directly with a toast, no confirm step); pagination.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` (Portal) | Sends, resends, and cancels invitations; sees status of every invitation they've sent |

---

## Data Objects

### Referenced (not owned)

- `InvitationOut` (`stafy-backend/app/invitations/schemas.py`) — reused directly as the row shape;
  no parallel schema defined for this page.

### Owned

None. This page reads/writes entirely through `stafy-backend`'s `app/invitations` resource; no
client-side entity of its own.

---

## Lifecycle

N/A — no stateful entity behind this page. Row state (`pending`/`accepted`/`rejected`/`expired`)
is the backend's `TeamInvitation.status`, displayed read-only via a badge; this page never derives
or caches lifecycle state itself.

---

## Derived / Aggregated Data

The three summary tiles (pending / accepted / expired counts) are computed client-side by
filtering the array returned by `GET /invitations` — no `summary` field exists on the response
(per the backend doc, list envelopes never carry counts). Cancelled invitations are never returned
by the backend at all, so there is no "cancelled" tile.

---

## User Flows

1. Manager types an email into the invite form and submits → `POST /invitations`; on success, the
   input clears and a success toast fires; on a 409 (duplicate pending invitation to that email),
   a toast shows the specific reason instead of a generic error.
2. Manager opens the page → `GET /invitations` loads the full list; tiles and table render from
   the same response.
3. Manager clicks resend on a `pending`/`expired` row → `POST /invitations/{id}/resend`, list
   refetches, success toast.
4. Manager clicks cancel on a `pending`/`expired` row → `DELETE /invitations/{id}`, list refetches
   (the row disappears — cancelled invitations are excluded from `GET /invitations`), success
   toast.
5. `accepted`/`rejected` rows render with no action buttons (terminal states, per the backend's
   lifecycle table).

---

## Information Architecture

Route: `/invitations` (`invitationsRoute` in `src/routes/index.tsx`, under the authenticated app
layout). No breadcrumb — top-level nav item, also reachable from the Team page's "Invită angajat"
button. No modals — the send form is an always-visible inline card, not a dialog (this app
introduces no modal/dialog component yet).

---

## UI / Layout

### Invite form

Always-visible card at the top of the page (not behind a disclosure/expand) — a single email input
plus a submit button, same `fieldset`/`input` pattern as the auth forms. Submit button shows a
DaisyUI spinner while pending, same convention as `LoginPage`/`RegisterPage`/`OnboardingPage`.

### Summary tiles

Three `KpiCard`s (the same component `DashboardPage` and the Employee Profile page use), in a
`grid-cols-3` row — first reuse of `KpiCard` outside `dashboard/` and the employee profile.

### Table

A DaisyUI `table`, not a card grid (unlike the Team page) — invitations are flat tabular data with
no avatar/stat-heavy per-row content, so a table fits better than `EmployeeCard`-style cards.
Columns: email, status badge, sent date, expiry-or-response date, actions (icon buttons, shown
only for actionable rows). Empty state: centered message, same pattern as the Team page's "no
employees" state.

### Status badge

`InvitationStatusBadge` maps status → DaisyUI badge color: `pending` → `badge-warning`, `accepted`
→ `badge-success`, `rejected`/`expired` → `badge-neutral` (both terminal-with-no-action, styled
identically, distinguished only by label text).

Design tokens (color/radius/shadow) come from the shared theme file — see `docs/ui-guidelines.md`;
no new tokens introduced.

---

## Data Access

All via `getInvitations()` (`src/api/generated/endpoints/invitations/invitations.ts`), wrapped in
`src/hooks/useInvitations.ts`:

- `useInvitations()` — `GET /invitations` → `InvitationsListOut`.
- `useSendInvitation()` — `POST /invitations`, invalidates the list query on success.
- `useResendInvitation()` — `POST /invitations/{id}/resend`, invalidates on success.
- `useCancelInvitation()` — `DELETE /invitations/{id}`, invalidates on success.

Mutation errors are mapped from the backend's `code` field (via `getApiError` in
`src/services/apiErrors.ts`) to a Romanian message for the three invitation-specific error codes
(`invitation_already_pending`, `invitation_not_actionable`, `invitation_not_found`); any other
error falls back to a generic message.

```typescript
InvitationOut {
  id: string
  invited_email: string
  status: "pending" | "accepted" | "rejected" | "expired"
  created_at: string
  expires_at: string
  responded_at: string | null
}
```

---

## Special Aspects

**No confirmation dialog before cancel.** Consistent with every other mutating action in this app
today (e.g. suspend employee on the Employee Profile page) — actions fire immediately with a
toast, not a confirm step. This is the first page with two independent per-row mutations
(resend/cancel) instead of one, but the no-confirm convention still applies.

**First reuse of `KpiCard` outside its original two pages.** No changes were needed to the
component itself — it already took a bare `label`/`icon`/`value` shape with no dashboard-specific
coupling.

**First DaisyUI `table` in this codebase.** Every other list view (Team page) uses a card grid.
Chosen here because invitation rows are flat, low-density tabular data (no avatar, no chip list,
no click-through to a detail page) — a table communicates that better than repurposing
`EmployeeCard`'s heavier layout.

**Error messages are code-mapped, not raw backend `detail` text.** `getApiError`
(`src/services/apiErrors.ts`) existed as an unused scaffold before this page; this page is its
first real consumer. `useInvitations.ts` maps `ErrorOut.code` to hand-written Romanian copy rather
than displaying the backend's English `detail` string directly, since UI copy in this app is
Romanian-only (see workspace-level module-doc conventions).

---

## Deferred

| Item | Trigger |
|---|---|
| Search/filter on the invitations list | The list grows large enough in practice to need it (mirrors the backend doc's own Deferred entry) |
| Confirmation dialog before cancel | A future incident/complaint about accidental cancellations — no such signal exists yet |
