# Admin Dashboard

The platform-admin console: a separate authenticated shell under `/admin/*` with its own layout, for
the single internal admin account. It shows cross-company statistics, the company and subscription
table, the cross-company audit feed, and the admin's own account. It is not part of the
manager-facing app shell.

## Scope

**In scope:** a dedicated route group (`/admin`, `/admin/companies`, `/admin/audit`,
`/admin/account`) with a dense, monospace-leaning layout; total manager/employee/user counts; count
of employees who never joined a real manager's company (`company_id` still equal to
`personal_company_id`); new manager/employee signups over time (weekly or monthly); invitation
counts by status across every company; time entries logged over time (daily or weekly) across every
company; the company table with plan grant and plan history (see `subscription.md`); the
cross-company audit feed with its company filter (see `settings.md`); the admin's own account and
security sections.

**Out of scope (this release):** infrastructure data (deploy status, error counts, database
metrics); global announcements; per-company drill-down, member tree and admin actions on companies
or users; admin user management (granting/revoking the `admin` role) — the single admin account is
provisioned directly in the database, the same way every `admin` row is created (see backend
`stafy-backend/CLAUDE.md`); date-range filtering beyond the fixed period toggles; export of any
admin statistic.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Platform admin | Admin console (`/admin/*`) | Reads platform-wide statistics, manages company plans, reads the cross-company audit feed, manages their own account |

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
- Company/subscription and audit-log models — see `subscription.md` and `settings.md`.

### Owned

None — the console is a read-and-route shell over existing aggregates; it introduces no new
persisted data.

---

## Lifecycle

N/A — every number shown is a live aggregate computed at read time, not a stateful entity.

---

## Derived / Aggregated Data

All four stats are computed server-side, not client-side:

- **Overview counts** — `total_managers`/`total_employees` grouped by live membership role;
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

1. **Review platform stats** — the admin signs in and lands on `/admin`; four independent panels
   (overview cards, growth chart, invitation funnel, activity chart). Growth and activity panels
   each have their own period toggle (week/month; day/week) that re-fetches only that panel.
2. **Manage company plans** — the admin opens Companies from the console nav; see `subscription.md`.
3. **Read the audit feed** — the admin opens Audit from the console nav; the feed spans every
   company and offers a company filter; see `settings.md`.
4. **Manage own account** — the admin opens Account from the console nav; the account and security
   sections are the same components managers use in Settings.

---

## Information Architecture

`_admin` is a layout route that is a sibling of `_app`, not a child of it. Its children:

| Route | Page | Body |
|---|---|---|
| `/admin` | `AdminOverviewPage` | `AdminSection` (the four stat panels) |
| `/admin/companies` | `AdminCompaniesPage` | `AdminCompaniesSection` + `AdminCompanyPlanPanel` |
| `/admin/audit` | `AdminAuditPage` | `AuditSection` (shared with Settings) |
| `/admin/account` | `AdminAccountPage` | `AccountSection` + `SecuritySection` (shared with Settings) |

Navigation is the console sidebar (`AdminSidebar`); there are no modals. The admin components live
in `src/components/admin/`; the shared account/audit sections stay in `src/components/settings/`.

---

## UI / Layout

- `AdminLayout` renders `AdminSidebar` plus the routed page; there is no top bar, no workspace
  switcher and no bottom navigation. Below the `md` breakpoint the sidebar collapses into a
  horizontal scroll strip above the page.
- `AdminSidebar`: fixed-width rail, monospace labels and console title, icons from the `ICONS`
  registry, the signed-in email and app version at the bottom, plus a sign-out button.
- Each page body renders inside `AdminPanel`, the same surface card Settings gives its sections.
- Overview: a 4-column KPI row (`KpiCard`, reused from the Dashboard page) — managers, employees,
  total users, employees without a manager (with a one-line subtext explaining the count).
- Growth: a bordered panel with a title, a two-option period toggle (DaisyUI `join`/`btn` group)
  top-right, and a Recharts `LineChart` — two lines (managers, employees), theme-token colors.
- Invitation funnel: a bordered panel with one horizontal bar per status — label, a track filled
  proportionally to the largest bucket, and the raw count right-aligned.
- Activity: same bordered-panel treatment as Growth, with a period toggle and a Recharts
  `BarChart`.
- Chart tooltips: a small shared component matching the token styling of `HistoryTab.tsx`'s
  tooltips.

---

## Data Access

| Endpoint | Method | Notes |
|---|---|---|
| `/api/v1/admin/overview` | GET | Admin only. Returns manager/employee/total counts plus `employees_without_manager`. |
| `/api/v1/admin/growth?period=week\|month` | GET | Admin only. One point per bucket: `period_start`, `new_managers`, `new_employees`. |
| `/api/v1/admin/invitations-funnel` | GET | Admin only. Flat count per `TeamInvitation.status`. |
| `/api/v1/admin/activity?period=day\|week` | GET | Admin only. One point per bucket: `period_start`, `time_entries_count`. |
| `/api/v1/profile` | GET | Existing endpoint (not owned here) — supplies `role` for the layout gate. |

All four `admin` routes require `require_role("admin")` — stricter than `/api/v1/audit-logs`, which
also admits `manager` scoped to their own company. See `stafy-backend/CLAUDE.md`'s `stafy/admin` row.

---

## Special Aspects

**The console is its own shell, gated by `AdminLayout`, and `AppLayout` bounces admins out.** Every
company-scoped route in the manager shell is gated by company role on the backend, and a platform
admin has no special access to any company's operational data — an admin there would only see 403s.
`AppLayout` therefore redirects any `role === 'admin'` caller to `/admin`, and `AdminLayout`
redirects any non-admin to `/`, where `AppLayout` routes them to their own shell. `_admin` is a
sibling of `_app` in the route tree: nesting it under `_app` would make the bounce loop.

**Both shells share one session gate.** `SessionGate` (`src/components/layout/SessionGate.tsx`)
holds the checks every authenticated shell needs — auth resolved, signed in, backend row exists,
profile loaded — and hands the profile to a render function. Role-specific and onboarding routing
stays in each layout. `AdminLayout` has no onboarding check: the admin account is provisioned by the
seed script with its personal company already onboarded.

**Account and security reuse the Settings sections.** The admin's own account lives under the
console rather than under Settings, but renders the same `AccountSection` and `SecuritySection`
components, so a change to either applies to both shells.

**No admin-management UI.** The product currently has exactly one admin account, created directly
in the database like every other `admin` row (see backend `stafy-backend/CLAUDE.md` — `admin` is
never self-assignable through any endpoint). Building a UI to grant/revoke the role is deferred
until there is more than one admin to manage.

**Activity buckets by `time_start`, not `created_at`.** `TimeEntry.created_at` records when the row
was inserted, which can lag behind (or precede, for backfilled entries) the actual work window.
`time_start` is what the rest of this app already treats as the authoritative date for a time entry,
so Activity stays consistent with that rather than introducing a second notion of when a time entry
counts.

---

## Deferred

| Item | Trigger |
|---|---|
| Infra panels (Render, Vercel, Neon, UptimeRobot, Sentry) and an internal health check | Read-only API tokens for each service exist and a backend proxy module holding them is built |
| Global announcements and a what's-new modal | Infra panels are done |
| Company member tree and admin actions on companies and users, including admin-initiated ownership transfer | Announcements are done |
| Product and business statistics (activation funnel, at-risk companies, MRR) | Company member tree is done |
| Admin role management UI | More than one admin account needs to exist |
| Date-range filtering beyond the week/month and day/week toggles | Real need surfaces past the fixed periods |
