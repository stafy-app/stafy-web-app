# Dashboard

Manager-only landing page — company-wide overview for a selected month. Route `/`,
`src/pages/dashboard/DashboardPage.tsx`. First screen a manager sees after login. Sidebar label
and in-app copy are Romanian, per the product's UI-language convention (see
`stafy-mobile/CLAUDE.md`); this doc describes labels/copy in English for readability and doesn't
reproduce the shipped Romanian strings verbatim.

## Scope

**In scope:** rebuild of the shared shell TopBar (title/subtitle/breadcrumb slot/action slot —
see Special Aspects for why this is cross-cutting, not page-local); period bar for month
navigation; 4-card KPI strip (active employees, total hours, total payout, invitations);
company-wide activity-distribution donut chart; "top 5 employees" table sorted by hours
descending, linking to `/team/$employeeId`; staggered entrance animation on section load;
count-up animation on KPI values.

**Out of scope (this release):** any write/edit action from this page (fully read-only); a
date-range picker beyond whole-month granularity; export/print of the dashboard view (belongs to
`app/reports` once live); real-time/polled updates (data refetches on period change only, not on
an interval); drill-down beyond the existing `/team/$employeeId` profile route.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` (Portal) | Views the company-wide monthly overview; navigates to an employee's profile from the top-5 table or to the full roster from the team card |

This doc doesn't re-litigate whether `admin` also gets a manager-web session — see
`stafy-backend/CLAUDE.md`'s noted gap that `admin` self-assignment isn't guarded at the API layer.

---

## Data Objects

### Referenced (not owned)

- `UserOut` (`stafy-backend/app/users`) — employee roster; already consumed via `useTeam()` →
  `getUsers().listUsers()`.
- `TimeEntryOut` / `TimeEntryActivityOut` (`app/time_entries`) — per-entry activity + `rate_applied`
  snapshot; today only readable for the calling user via `/api/v1/dashboard/me`, not manager-scoped
  across the company.
- `HourlyRateOut` (`app/users` settings) — per-user, per-activity rate; same manager-scope gap.

### Owned

None. This page owns no ORM/DB entity — it's a read-only aggregation view. If a manager-dashboard
backend endpoint is added (see Data Access), the aggregation logic belongs to whichever backend
module implements it (`app/reports` is the natural home — currently an empty stub, see
`stafy-backend/CLAUDE.md` Module Status), not to this page.

---

## Lifecycle

N/A — no stateful entity behind this page. The only "state" is client-side UI state,
`period: { year, month }`, which changes what's displayed/fetched and nothing persisted.

---

## Derived / Aggregated Data

Everything on this page is a read-time aggregation over company-wide time entries for the selected
month:

- **KPI strip** — active employee count, total hours, total payout, invitation count.
- **Activity distribution donut** — total hours grouped by activity name, across the whole team.
- **Top 5 table** — per-employee total hours, delta vs. the previous month, activities worked,
  estimated payout; sorted descending by total hours.

None of this is stored — it's recomputed by the backend on each request for the selected period.
"Active employee" is `UserOut.is_active`, not "logged at least one entry this month" — chosen
because it's a single pass over the already-fetched roster, no extra time-entry query; an
active-but-idle employee still counts.

---

## User Flows

1. Manager opens `stafy-web-app` → lands on `/` → sees the current month by default.
2. Manager clicks the previous/next controls on the period bar → `period` state changes → KPI
   strip, donut, and top-5 table refetch/recompute for the new month.
3. Manager clicks "jump to current month" (shown only when viewing a non-current month) → period
   resets to today's month.
4. Manager clicks "view all" on the team card → navigates to `/team` (full roster).
5. Manager clicks a row in the top-5 table → navigates to `/team/$employeeId` (existing
   `EmployeeProfilePage`).

---

## Information Architecture

Route: `/` (`dashboardRoute` in `src/routes/index.tsx`, already wired to `DashboardPage.tsx`). No
breadcrumb — Dashboard is the root, not a nested page. Nav entry: Sidebar's first item (the `Home`
icon from `lucide-react`), already present in `Sidebar.tsx`'s `NAV_ITEMS`. No modals owned by this
page.

---

## UI / Layout

### Top bar (shared shell — see Special Aspects)

- `min-height: 72px`; sticky at the top of the content column (right of the sidebar);
  `flex-shrink: 0`.
- Background `rgba(255,255,255,0.85)` + `backdrop-filter: saturate(180%) blur(12px)` — glass effect
  over content scrolling underneath.
- `border-bottom: 1px solid var(--color-line)`.
- Padding `14px 32px`; `display: flex; align-items: center; gap: 16px`.
- **Breadcrumb** (optional, above the title): label list separated by `ChevronRight` (12px,
  `--color-ink-muted`); last item is plain text, the rest are clickable buttons, all 12px
  `--color-ink-muted`.
- **Title** (`h1`): 22px / 700, `letter-spacing: -0.015em`.
- **Subtitle**: 13px, `--color-ink-muted`, `margin-top: 2px`.
- **Action slot**: right side, any button/CTA the page passes in (Dashboard doesn't use one).
- On Dashboard: no breadcrumb; title "Dashboard"; subtitle summarizing the team overview.

### General layout

- Container: `max-width: 1280px`, centered, `display: flex; flex-direction: column; gap: 20px`.
- Page padding (from `AppLayout`'s `<main>`): `28px 32px 48px`, internal vertical scroll.
- All sections animate in with fade+slide on load, increasing delay: 0, 60, 120, 180, 240, 320,
  400ms — top-to-bottom stagger.

### 1. Period bar

- Card, padding `16px 20px`, `display: flex; align-items: center; gap: 16px`.
- Icon box 40×40, `--radius-md`, background `--color-primary-soft`, `Calendar` icon 20px
  `--color-primary`.
- Label "PERIOD" (11px, uppercase, `letter-spacing: 0.1em`, `--color-ink-muted`) + value
  "month year" (20px / 700, capitalized).
- Right-side controls: `ChevronLeft` / `ChevronRight` buttons (32×32, border `--color-line`,
  `--radius-md`) to step month by month.
- If the selected month is the current one: pill "current month" (background
  `--color-primary-soft`, text `--color-primary-active`, 12px / 600).
- Otherwise: outline button "jump to current month" (border + text `--color-primary`, pill radius
  `999px`).

### 2. KPI strip

- Grid `repeat(4, 1fr)`, gap `16px`.
- 4 stat cards: **Active employees**, **Total hours**, **Total payout**, **Invitations**.
- Each card: uppercase 12px label top + 36×36 icon box (background `--color-primary-soft`)
  top-right; large value 28px / 700 below; 12px `--color-ink-muted` sub-text.
- Numeric values animate with a count-up (duration 700–1100ms, increasing per card) on every
  mount/period change.
- "Total payout" formatted with a thousands separator (locale `ro-RO`, matching the mobile app's
  number formatting), suffix "RON".

### 3. Activity distribution

- Full-width card, header with title "Activity distribution" (16px / 600) + current month on the
  right (12px muted).
- Internal grid: `minmax(280px, 320px) 1fr`, gap `32px`, center-aligned.
- Left: donut chart, 260px, thickness 34, center value = total hours + label "total".
- Right: grid of small legend cards (`auto-fill, minmax(220px, 1fr)`, gap `10px`) — each: activity
  chip + hours (mono font, 13 / 600) + percentage (mono font, 12, muted, fixed `width: 36px` for
  alignment).

### 4. Your team · top 5

- Card with no default padding; header with title + subtitle + ghost button "view all (N)" with a
  `ChevronRight` icon → navigates to `/team`.
- Table: uppercase 11px header on `--color-surface-2` background; columns: **Employee**, **Hours
  this month**, **Δ vs previous month**, **Activities**, **Estimated**.
- Row: 32px avatar (initials badge, same pattern as `Sidebar.tsx`'s `initials` logic — no photo
  field, see Special Aspects) + name (14 / 600) + email (12 muted); hours in mono font 14 / 600;
  delta via a `Delta` component (red/green by sign); activity chips (max 3); estimated total, mono
  font 13, `--color-ink-soft`.
- Row is clickable → navigates to `/team/$employeeId`.
- Border between rows: `1px solid var(--color-line-soft)`.

Design tokens for all of the above (color / radius / shadow / font) come from `src/App.css`'s
`"stafy"` DaisyUI theme — don't invent new ones; check `docs/ui-guidelines.md` first.

---

## Data Access

- `GET /api/v1/users` (tag `users`, `getUsers().listUsers()`) → `UsersListOut` — full company
  roster. Wrapped in `useTeam()`; used for the sidebar/top-5-table's employee count, not for the
  dashboard aggregation itself.
- `GET /api/v1/dashboard/company?year=&month=` (tag `dashboard`) → `CompanyDashboardOut`. Lives in
  the existing `dashboard_router` in `app/users/router.py`, guarded by `require_role("manager")`,
  backed by `UserDashboardService.get_company_dashboard()` in `app/users/service.py` (alongside
  `get_dashboard()` for `/me`) and `UserRepository.get_company_time_entries()` for the raw rows —
  not `app/reports`, which is a separate page (Rapoarte) in the sidebar. Wrapped in
  `useCompanyDashboard(year, month)`.

```typescript
CompanyDashboardOut {
    active_employee_count: number
    total_hours: number
    total_gross_salary: string          // Decimal-as-string, same convention as UserDashboardOut
    invitation_count: number            // hardcoded 0 — see below
    activity_distribution: { activity_name: string; hours: number }[]
    top_employees: {
      user: UserOut
      total_hours: number
      delta_vs_previous_month: number
      activities: string[]
      estimated_gross: string
    }[]
  }
```

`invitation_count` is hardcoded to `0` in the service — `app/invitations` is still an empty stub
(no model, no repository). Swap this in once that module is live; nothing else in the shape
changes.

---

## Special Aspects

**TopBar is a shared shell, not page-local.** `src/components/layout/Topbar.tsx` reads from
`TopBarContext` (`src/context/TopBarContext.ts` + `TopBarProvider.tsx`, wrapping `AppLayout`'s
content column); any page under `AppLayout` calls the `useTopBar({ title, subtitle, breadcrumb,
action })` hook (`src/hooks/useTopBar.ts`) to set its own title/subtitle/breadcrumb/action-slot.
Every existing placeholder page (`team`, `team/$employeeId`, `invitations`, `reports`, `settings`)
was migrated to this pattern when Dashboard introduced it — none of them render their own `<h1>`
anymore.

**Categorical color for the activity donut.** Stafy's DaisyUI theme has no defined categorical
ramp — its semantic tokens (`success`/`warning`/`error`) fail the dataviz skill's CVD/lightness
checks when repurposed for series identity (validated via `validate_palette.js`). The donut uses
the dataviz skill's validated default categorical palette (`#2a78d6`, `#008300`, `#e87ba4`,
`#eda100`) as-is, capped at 4 named slices + a 5th "Altele" (Other) bucket in
`--color-ink-muted`. Slot is assigned by display rank (highest-hours first), not by a stable
per-activity hash — acceptable here because each donut is an independent per-month snapshot, not
a live-filterable single chart instance where an activity's color must stay fixed while filtering.

**Source spec used demo data.** The spec this doc was adapted from used fixed demo constants
(`TEACHERS`, `HOURS_THIS_MONTH`, `computeMonthly()`) pinned to a fixed month, from a
differently-themed source project. The real implementation has no such fixture — every number in
this spec is illustrative only, not a data source. The source project also used domain-specific
terminology tied to that other project instead of `employee`; this doc uses `employee`/
`onOpenEmployee` terminology throughout, per `stafy-web-app/CLAUDE.md`'s terminology rule.

**No avatar/photo field on `UserOut`.** The top-5 table's avatar is an initials badge, not an
uploaded image — there's no `avatar_url` in the schema today.

**Money fields must stay Decimal-as-string.** Per the existing convention
(`UserDashboardOut.total_gross_salary`, `HourlyRateOut.hourly_rate_gross`,
`TimeEntryOut.rate_applied`), any new aggregated money field the backend returns must follow the
same string-encoded Decimal convention, never a JS `number`, to avoid float rounding.

---

## Deferred

| Item | Trigger |
|---|---|
| Real invitation count | `app/invitations` becomes live |
| Employee drill-down beyond the existing `/team/$employeeId` profile | Product decision once `EmployeeProfilePage` itself is built out |
| Date range beyond single-month granularity | Explicit ask — out of scope per current spec |
| Export/print of the dashboard view | `app/reports` becomes live |
