# Audit Log

Read-only page showing a chronological feed of sensitive actions taken across the company —
rate changes, bonuses, deleted time entries, invitation lifecycle, employee suspend/reactivate,
company settings edits, and activity create/rename. Visible to managers (their own company) and
admins (cross-company, or one company via a filter).

## Scope

**In scope:** listing entries with filters (action type, date range, and — admin only — a company
ID filter), a "load more" affordance, and a per-row human-readable summary of what changed.

**Out of scope (this release):** an actor picker (filtering by a specific person) — the backend
endpoint accepts an `actor_user_id` filter, but no user-search component exists in this app to
drive it, and building one for this alone would be premature; the actor's name is still shown per
row. A company switcher/picker component for admins — the admin view instead shows a plain
`company_name` column per row plus a numeric `company_id` text filter, not a dropdown (see backend
`docs/modules/audit-logs.md` — this is the first UI in the app with any admin-specific behavior at
all, kept intentionally minimal).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `/audit-log` page | Reads their own company's audit log |
| Admin | `/audit-log` page | Reads across all companies, or one via the company ID filter |

---

## Data Objects

### Referenced (not owned)

- `AuditLogOut` / `AuditLogsListOut` (`src/api/generated/endpoints/index.schemas.ts`) — generated
  from the backend's `stafy/audit_logs` module. This page owns no client-side entity of its own.

### Owned

None.

---

## Lifecycle

N/A — read-only page over an append-only backend feed; no client-side state machine.

---

## Derived / Aggregated Data

Each row's "Detalii" column is computed client-side from the entry's raw `before`/`after` JSON via
`formatAuditDetail` (`src/utils/auditLogFormat.ts`) — one case per `action` string, since the JSON
shape varies by action. `ACTION_LABELS` (same file) maps each `action` string to a Romanian label,
used both for the filter dropdown and the row's action column.

---

## User Flows

1. Manager or admin opens `/audit-log` → the first 50 entries for their scope load, newest first.
2. User filters by action type or a date range → the same query re-fetches with the new params
   (`offset` stays 0 — filtering doesn't accumulate on top of a prior page).
3. User clicks "Încarcă mai multe" → the requested page size grows by 50 and re-fetches from
   `offset=0` with the larger `limit`, so the visible list is always the full set fetched so far
   rather than a separately-merged page.
4. Admin additionally enters a company ID → the same endpoint scopes to that one company; clearing
   the field returns to the cross-company view.

---

## Information Architecture

Sidebar item "Audit" (`History` icon from `src/lib/icons.ts`), positioned between Reports and
Settings — visible unconditionally, same as every other sidebar item, since the two roles that can
reach the sidebar at all (`manager`, `admin`) both have read access to this page; only `employee`
is blocked, and that block already happens at the layout level (`AppLayout`), before the sidebar
renders. Route: `/audit-log`, registered under `appLayoutRoute` in `src/routes/index.tsx`, same
pattern as `reportsRoute`/`settingsRoute`.

---

## UI / Layout

- Filter bar: a single row of labeled controls (action `<select>`, two `<input type="date">`, and
  — admin only — a numeric company-ID `<input>`), in a card matching the existing filter-adjacent
  chrome (e.g. `TeamPage`'s search pill), not a new pattern.
- Table: DaisyUI `table` class, modeled directly on `InvitationsTable` (the only other real table
  in this codebase) — same header styling, same empty-state card, same row text-size tokens.
  Columns: Dată, Acțiune, Cine, Pentru cine, (Companie — admin only), Detalii.
- "Load more": a centered outline button, shown only when the response's `has_more` is true.

---

## Data Access

Calls `GET /api/v1/audit-logs` via the generated `getAuditLogs().listAuditLogs(params)`
(`src/api/generated/endpoints/audit-logs/audit-logs.ts`), wrapped in `useAuditLogs`
(`src/hooks/useAuditLogs.ts`) — a plain `useQuery` keyed on the full params object, no mutation.
No gap: the endpoint already existed by the time this page was built (see backend
`docs/modules/audit-logs.md`).

---

## Special Aspects

**Pagination grows `limit`, not `offset`.** Rather than tracking an accumulated array across pages
(which would need a `useEffect`-driven merge — a pattern this app avoids elsewhere in favor of
plain derived state, e.g. `CompanySection`/`BonusCard`'s remount-by-`key` approach), "load more"
simply increases the requested `limit` by 50 and re-fetches from `offset=0` each time. The response
at any point already contains the full visible set, so there's nothing to merge — a `useState`
counter is the entire pagination mechanism.

**No actor picker, deliberately.** The backend supports filtering by `actor_user_id`, but this app
has no existing "search for any user across the company" component — the closest is
`ReportEmployeePicker`, which only lists employees, not managers/admins who can also act as an
actor here. Building a general user-picker for this one filter would be scope creep; the actor's
name is still visible per row, just not filterable, until a real need for that filter surfaces.

---

## Deferred

| Item | Trigger |
|---|---|
| Actor filter/picker | A general user-search component exists elsewhere in the app to reuse, or this specific filter is requested |
| Company picker (dropdown instead of a numeric ID field) for the admin view | Admin usage grows beyond occasional cross-company spot-checks |
