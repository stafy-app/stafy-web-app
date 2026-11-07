# Admin Dashboard

The platform-admin console: a separate authenticated shell under `/admin/*` with its own layout, for
the single internal admin account. It shows cross-company statistics, the company and subscription
table, the cross-company audit feed, and the admin's own account. It is not part of the
manager-facing app shell.

## Scope

**In scope:** a dedicated route group (`/admin`, `/admin/companies`, `/admin/infra`,
`/admin/audit`, `/admin/account`, plus `/admin/announcements`) with a calm, grouped layout (see UI / Layout); company-level KPIs
(total companies, active vs read-only, plans expiring within 7 days, companies at their seat limit,
count per plan); the company detail panel (owner contact as a `mailto:` link, profile, internal note and tags, paged live member list with role and standing but never hours or pay); the company table with search, plan/status filters, sortable columns, pagination
and the date of each company's last time entry (a date only - never hours or per-user activity);
total manager/employee/user counts; count
of employees who never joined a real manager's company (`company_id` still equal to
`personal_company_id`); new manager/employee signups over time (weekly or monthly); invitation
counts by status across every company; time entries logged over time (daily or weekly) across every
company; the company table with plan grant and plan history (see `subscription.md`); the
platform-services status page (see `infra.md`); the
cross-company audit feed with its company filter (see `settings.md`); the admin's own account and
security sections.

**Out of scope (this release):** markdown announcements (modal announcements are live, see `announcements.md`); admin actions on companies or users (block,
forced read-only, suspend, session revocation, ownership transfer); admin user management (granting/revoking the `admin` role) — the single admin account is
provisioned directly in the database, the same way every `admin` row is created (see backend
`stafy-backend/CLAUDE.md`); date-range filtering beyond the fixed period toggles; export of any
admin statistic.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Platform admin | Admin console (`/admin/*`) | Reads platform-wide statistics, manages company plans, reads the status of the platform's services, reads the cross-company audit feed, manages their own account |

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
3. **Check the platform's services** — the admin opens Infra; see `infra.md`.
4. **Read the audit feed** — the admin opens Audit from the console nav; the feed spans every
   company and offers a company filter; see `settings.md`.
5. **Manage own account** — the admin opens Account from the console nav; the account and security
   sections are the same components managers use in Settings.

---

## Information Architecture

`_admin` is a layout route that is a sibling of `_app`, not a child of it. Its children:

| Route | Page | Body |
|---|---|---|
| `/admin` | `AdminOverviewPage` | `AdminSection` (the four stat panels) |
| `/admin/companies` | `AdminCompaniesPage` | `AdminCompaniesSection`; a row opens `AdminCompanyModal` (tabs Prezentare, Membri, Plan, Acces) |
| `/admin/announcements` | `AdminAnnouncementsPage` | `AdminAnnouncementsSection` (see `announcements.md`) |
| `/admin/infra` | `AdminInfraPage` | `ProviderNav` + `ProviderDetail` (see `infra.md`) |
| `/admin/audit` | `AdminAuditPage` | `AdminAuditSection` |
| `/admin/account` | `AdminAccountPage` | `AdminAccountSection` |

Navigation is the console sidebar (`AdminSidebar`); the only modals are `AdminModal` (the company
detail and plan, and the announcement form), closed with the X, the backdrop or Escape. The admin components live
in `src/components/admin/`; the shared account/audit sections stay in `src/components/settings/`.

---

## UI / Layout

- **Shell.** `AdminLayout` renders `AdminSidebar` plus the routed page in a column capped at `max-w-6xl`;
  there is no top bar and no bottom navigation. Below the `md` breakpoint the sidebar collapses into a
  horizontal scroll strip. The layout root re-points `--color-ink-muted` to `--color-ink-soft` for
  everything inside the console (including the sections shared with Settings), because the muted slate
  is below AA contrast on white. Secondary text is therefore `ink-soft`; body and table text is at
  least 13px, 12px only for counters and hints.
- **Sidebar.** A translucent rail (`--color-glass` with a backdrop blur, hairline edge), Inter 14px,
  the brand and "Admin" at the top, a soft brand-tinted pill under the active item. Items are grouped:
  Privire generală; Operare (Companii, Anunțuri); Platformă (Infrastructură, Audit); Cont at the bottom,
  with the signed-in email, app version and sign-out under it.
- **Page header.** Every page starts with `AdminPageHeader`: a 28px title, one calm sentence, and the
  page's main action on the right. Sections do not repeat the title.
- **One surface level.** A page or modal has one white surface, `AdminSheet`, split into
  `AdminSheetSection`s by hairlines; there are no boxes inside boxes. A table with its toolbar is one
  flush, untitled section. Radius `--radius-xl`, shadow `--shadow-card`, no borders.
- **Tables.** `AdminTable` (+ `AdminEmptyRow`, `AdminLoading`, `AdminPager`) over the `.admin-table`
  class: 13px text, one line per row, 8px vertical padding, a plain header (no fill) with 12px
  semibold ink text over a darker rule (sticky only within its own scroll box, not the page), hairline row separators, tabular and right-aligned numbers. A
  clickable row (`row-link`) takes a brand-tinted background on hover; a company row ends in a chevron. Every admin table,
  including Audit (`AdminAuditSection`, the console's own table over the same `useAuditLogs` data),
  uses it.
- **Forms and facts.** `AdminField` (label, hint or error) with `ADMIN_CONTROL` (the soft filled control
  style) for inputs; `AdminDetailList` (fixed label column, aligned values) for read-only data in modals.
  The admin account page is the console's own form (`AdminAccountSection`), on the same hooks as Settings.
- **Status.** `StatusDot` (a colored dot plus plain text) for plan, member, announcement state and
  severity. The only filled box is the unreadable-service warning on the infrastructure page.
- **Overview.** `AdminStatStrip`: one strip of five equal cells (companies, users, expiring, at seat limit,
  employees without a manager), then one sheet with sections: plans as a stacked bar with a legend,
  signups line chart (`AdminSegmented` period, legend), and invitations and time entries side by side.
- **Company sheet.** `AdminModal` has one standard size (fixed height so switching tabs never jumps): a
  white header with title, subtitle and an `AdminSegmented` tab bar, a flat white body that scrolls on its
  own (the `AdminSheet` inside a modal draws no card, only hairlines between sections), and an optional
  pinned footer for form buttons. Prezentare: profile (`AdminDetailList`)
  and internal note; Membri: the roster (blocking opens a full-width reason row under the member); Plan:
  grant form and history; Acces: the risky restrictions, each with a one-line explanation and a
  mandatory reason.
- **Infrastructure.** A service list on the left (sticky) and the selected service in full on the right: what it
  is, its state, its figures as KPIs, its facts, and its rows as two-line entries grouped under titles. See
  `infra.md`.
- Charts use theme tokens, no vertical grid lines, no axis lines, 12px ticks. Chart tooltips are a small
  shared component matching the token styling of `HistoryTab.tsx`'s tooltips.

---

## Data Access

| Endpoint | Method | Notes |
|---|---|---|
| `/api/v1/admin/overview` | GET | Admin only. Returns manager/employee/total counts plus `employees_without_manager`. |
| `/api/v1/admin/companies/summary` | GET | Admin only. Company totals, expiring, at seat limit and per-plan counts (owned by the subscriptions domain). |
| `/api/v1/admin/companies/{id}`, `/members`, `/notes` | GET / GET / PUT | Admin only. Detail panel, its member list and the internal note and tags editor (see `subscription.md`). |
| `/api/v1/admin/companies/{id}/restriction` | PUT | Admin only. Sets or lifts a company's read-only / suspended restriction; reason mandatory (owned by `stafy-backend/docs/modules/admin-actions.md`). |
| `/api/v1/admin/users/{id}/block`, `/unblock` | POST | Admin only. Blocks or unblocks an account; reason mandatory. |
| `/api/v1/admin/companies` | GET | Admin only. Paged company table with `q`, `plan_type`, `plan_status`, `sort`, `order`, `page`, `page_size` (see `subscription.md`). |
| `/api/v1/admin/growth?period=week\|month` | GET | Admin only. One point per bucket: `period_start`, `new_managers`, `new_employees`. |
| `/api/v1/admin/invitations-funnel` | GET | Admin only. Flat count per `TeamInvitation.status`. |
| `/api/v1/admin/activity?period=day\|week` | GET | Admin only. One point per bucket: `period_start`, `time_entries_count`. |
| `/api/v1/profile` | GET | Existing endpoint (not owned here) — supplies `role` for the layout gate. |

All four `admin` routes require `require_role("admin")` — stricter than `/api/v1/audit-logs`, which
also admits `manager` scoped to their own company. See `stafy-backend/CLAUDE.md`'s `stafy/admin` row.

---

## Special Aspects

**The console is its own shell, gated by `AdminLayout`; the app shells are open to admins.** The
backend gives a platform admin no access to any company's data, but the admin is the `owner` of their
own personal company (`seed_admin` guarantees it is their active one), so the company shell and the
`/me` shell both work for them like for any owner, with the Companie/Personal switcher. `AdminLayout`
redirects any non-admin to `/`. `_admin` is a sibling of `_app` in the route tree.

**Moving between the shells.** An admin sees an "Admin" button in `Sidebar` (below the nav) and
`BottomNav` (an extra item on phones) that goes to `/admin`; `AdminSidebar` has an "Aplicația" link to
`/me`. Neither is rendered for any other role. After login an admin lands on `/` (the company shell).

**Both shells share one session gate.** `SessionGate` (`src/components/layout/SessionGate.tsx`)
holds the checks every authenticated shell needs — auth resolved, signed in, backend row exists,
profile loaded — and hands the profile to a render function. Role-specific and onboarding routing
stays in each layout. `AdminLayout` has no onboarding check: the admin account is provisioned by the
seed script with its personal company already onboarded.

**Account and audit are the console's own sections.** `AdminAccountSection` and `AdminAuditSection` use
the console's form and table style over the same hooks as Settings (`useUpdateAccount`,
`useSendPasswordResetEmail`, `useAuditLogs`) and the same `auditLogFormat` labels, so the managers'
Settings sections stay untouched.

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
| Revoking a user's Firebase tokens and admin-initiated ownership transfer | A block must also end the Firebase session itself, or a real transfer case appears |
| Product and business statistics (activation funnel, at-risk companies, MRR) | Company member tree is done |
| Admin role management UI | More than one admin account needs to exist |
| Date-range filtering beyond the week/month and day/week toggles | Real need surfaces past the fixed periods |
