# Admin Dashboard

Admin-only statistics view: cross-company user counts, signup growth, invitation funnel, and time
entry activity volume. Lives inside the Settings page as its own section, visible only to accounts
with the `admin` role.

## Scope

**In scope:** total manager/employee/user counts; count of employees who never joined a real
manager's company (`company_id` still equal to `personal_company_id`); new manager/employee signups
over time (weekly or monthly); invitation counts by status, across every company; time entries
logged over time (daily or weekly), across every company.

**Out of scope (this release):** infrastructure data (deploy status, error counts, database
metrics) — planned as a later phase once the external API tokens it depends on exist; admin user
management (granting/revoking the `admin` role) — a single admin account is provisioned directly in
the database, the same way every `admin` row is created (see backend `stafy-backend/CLAUDE.md`);
per-company drill-down from any stat; date-range filtering beyond the fixed period toggles; export
of any admin statistic.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Admin | Settings page, Admin section (`/settings`) | Read-only viewer of platform-wide statistics across every company |

---

## Data Objects

### Referenced (not owned)

- `User` (role, `company_id`/`personal_company_id`, `created_at`) — owned by the `stafy-backend`
  users domain.
- `TeamInvitation` (status) — owned by the `stafy-backend` invitations domain.
- `TimeEntry` (`time_start`) — owned by the `stafy-backend` time-entries domain.
- `AdminOverviewOut` / `AdminGrowthOut` / `AdminInvitationFunnelOut` / `AdminActivityOut`
  (`src/api/generated/endpoints/index.schemas.ts`) — generated from the backend's `stafy/admin`
  module.

### Owned

None — this section is a read-only aggregation view; it introduces no new persisted data.

---

## Lifecycle

N/A — every number shown is a live aggregate computed at read time, not a stateful entity.

---

## Derived / Aggregated Data

All four stats are computed server-side, not client-side:

- **Overview counts** — `total_managers`/`total_employees` grouped by `User.role`;
  `employees_without_manager` counts employees whose `company_id` still equals their
  `personal_company_id` (never accepted an invitation into a real company).
- **Growth** — new manager/employee signups bucketed by `User.created_at`, truncated to week or
  month (Postgres `date_trunc`). A bucket with zero signups of a given role reports `0`, not an
  absent point.
- **Invitation funnel** — `TeamInvitation` rows grouped by `status`
  (pending/accepted/rejected/expired/cancelled), across all companies, no date bound.
- **Activity** — `TimeEntry` rows bucketed by `time_start`, truncated to day or week — reflects when
  the logged work happened, not when the row was created.

---

## User Flows

1. **Review platform stats** — an admin opens Settings; the "Admin" nav item is visible only to
   them (hidden entirely for managers, not merely disabled); switching to it loads four independent
   panels (overview cards, growth chart, invitation funnel, activity chart). Growth and activity
   panels each have their own period toggle (week/month; day/week) that re-fetches only that panel.

---

## Information Architecture

Sidebar nav item "Settings" → `/settings` route → `SettingsPage` → `SettingsNav`'s sixth item,
"Admin" — filtered out of the nav entirely unless the caller's profile `role` is `admin` (checked
client-side via the same `useProfile()` query every other section already uses). No route or URL of
its own, same non-routed local-state section switching as every other Settings section. No modals.

---

## UI / Layout

- Renders inside the same single card `SettingsPage` already provides for every section — no
  separate page chrome.
- Overview: a 4-column KPI row (`KpiCard`, reused from the Dashboard page) — Managers, Employees,
  Total users, "Fără manager" (with a one-line subtext explaining what the count means).
- Growth: a bordered panel (`rounded-[var(--radius-lg)] border border-[var(--color-line)]`) with a
  title, a two-option period toggle (DaisyUI `join`/`btn` group) top-right, and a Recharts
  `LineChart` below — two lines (managers, employees), theme-token colors
  (`var(--color-primary)` and the same secondary blue `HistoryTab.tsx` uses for its pay line).
- Invitation funnel: a bordered panel with one horizontal bar per status — label, a track
  (`bg-[var(--color-surface-2)]`) filled proportionally to the largest bucket
  (`bg-[var(--color-primary)]`), and the raw count, right-aligned.
- Activity: same bordered-panel treatment as Growth, with a period toggle and a Recharts `BarChart`
  instead of a line.
- Chart tooltips: a small shared component matching the token styling of `HistoryTab.tsx`'s
  tooltips (bordered surface card, muted date line, bold value line).
- `ICONS` addition: `dashboard` (`LayoutDashboard`), used only by this section's nav item.

---

## Data Access

| Endpoint | Method | Notes |
|---|---|---|
| `/api/v1/admin/overview` | GET | Admin only. Returns manager/employee/total counts plus `employees_without_manager`. |
| `/api/v1/admin/growth?period=week\|month` | GET | Admin only. Returns one point per bucket: `period_start`, `new_managers`, `new_employees`. |
| `/api/v1/admin/invitations-funnel` | GET | Admin only. Returns a flat count per `TeamInvitation.status`. |
| `/api/v1/admin/activity?period=day\|week` | GET | Admin only. Returns one point per bucket: `period_start`, `time_entries_count`. |
| `/api/v1/profile` | GET | Existing endpoint (not owned by this section) — supplies `role` for the nav-item visibility gate. |

All four `admin` routes require `require_role("admin")` — stricter than the pre-existing
`/api/v1/audit-logs` (which also admits `manager`, scoped to their own company). See
`stafy-backend/CLAUDE.md`'s `stafy/admin` row.

---

## Special Aspects

**Admin accounts are confined to `/settings` by `AppLayout`, not by a dedicated route.** Every
manager-only route (Dashboard, Team, Invitations, Reports, and every Settings section except Audit
and Admin) calls a backend endpoint gated `require_role("manager")` only — `admin` gets a 403 there,
not a redirect. Rather than add per-page checks, `AppLayout` (the shared authenticated-route gate
every page already passes through) redirects any `role === 'admin'` request whose path isn't
`/settings` straight there, the same shape as its existing `employee` block just without the
logout. `SettingsPage` separately defaults its own active tab to `'admin'` (only until the caller
manually clicks another tab) so an admin lands directly on this section instead of Account. The
`SettingsNav` item itself is still hidden for non-admins on top of this, via the same `isAdmin`
conditional pattern the Audit section already used — belt and suspenders, not redundant, since the
nav filter is what keeps a manager from ever seeing the tab exists.

**No admin-management UI.** The product currently has exactly one admin account, created directly
in the database like every other `admin` row (see backend `stafy-backend/CLAUDE.md` — `admin` is
never self-assignable through any endpoint). Building a UI to grant/revoke the role is deferred
until there's more than one admin to manage.

**Activity buckets by `time_start`, not `created_at`.** `TimeEntry.created_at` records when the row
was inserted, which can lag behind (or precede, for backfilled entries) the actual work window.
`time_start` is what the Growth/Team pages elsewhere in this app already treat as the authoritative
date for a time entry, so Activity stays consistent with that rather than introducing a second
notion of "when" a time entry counts.

---

## Deferred

| Item | Trigger |
|---|---|
| Infra data (Render/Vercel deploy status, Sentry error counts, Neon DB metrics) | Once the external API tokens (Render, Vercel, Sentry, Neon) exist and a backend proxy module is built to hold them — see root `LAUNCH-READINESS.md` |
| Admin role management UI | More than one admin account needs to exist |
| Per-company drill-down from any stat | Requested once the platform has enough companies that the aggregate alone stops being enough signal |
| Date-range filtering beyond the week/month and day/week toggles | Real need surfaces past the fixed periods |
