# Employee Profile

Manager-only detail page for a single employee. Route `/team/$employeeId`,
`src/pages/team/EmployeeProfilePage.tsx`. Reached only by clicking an employee elsewhere in the
app (Team grid, Dashboard's top-5 table) — never linked from the sidebar directly. Sidebar label
and in-app copy are Romanian, per the product's UI-language convention (see
`stafy-mobile/CLAUDE.md`); this doc describes labels/copy in English for readability and doesn't
reproduce the shipped Romanian strings verbatim.

## Scope

**In scope:** profile header (avatar, name, active/suspended status, email, join date,
inline-editable job title, this-month hours + delta, this-month estimated pay); a three-tab body
— Attendance (this employee's time entries, own month picker, activity filter, bonus editor for
the picked month), Rates (every company activity with this employee's rate or an "activate"
affordance, inline edit), History (last 5 months of hours/pay, chart + table-view toggle + summary
stats); a "⋯" actions menu (edit job title, export this employee's time entries to CSV,
suspend/reactivate).

**Out of scope (this release):** editing name/email (Firebase-owned identity); any
messaging/notification action (no messaging subsystem exists anywhere in the product); a "remove
from team" action distinct from suspend (see `team.md`'s note on `TeamMembership` having no
writers); URL-persisted tab state (tabs are local component state, not a route param or search
param); a page-wide period selector (the header's stats are always the current month, Attendance
has its own independent month picker, History is a fixed last-5-months window — there's no single
period that would meaningfully apply to all three).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` (Portal) | Views one employee's stats, attendance, and rates; edits that employee's job title and rates; suspends/reactivates the employee |

---

## Data Objects

### Referenced (not owned)

- `CompanyTopEmployeeOut` (`stafy-backend/app/users/schemas.py`) — reused as-is for the header's
  stats, same shape `team.md`'s roster rows use.
- `TimeEntryOut` / `TimeEntryActivityOut` (`app/time_entries/schemas.py`) — Attendance tab rows.
- `EmployeeActivityRateOut`, `EmployeeMonthlyHistoryEntryOut` (`app/users/schemas.py`) — Rates and
  History tab rows, new schemas added alongside this page.
- `UserOut` — embedded in the summary response; source of job title, join date (`created_at`),
  and active status shown in the header.

### Owned

None. Read/write aggregation view over backend-owned rows; no ORM/DB entity belongs to this page.

---

## Lifecycle

N/A — no stateful entity behind this page. Client-side UI state: active tab, per-tab period/filter
selections, and transient inline-edit state (job title, a rate row) — none of it persisted or
synced to the URL.

---

## Derived / Aggregated Data

- **Header stats** — this employee's current-month hours, delta vs. previous month, and estimated
  pay, identical computation to a `team.md` roster row but scoped to one employee. Zero-hours
  employees still render a full header (zeroed stats), never an error state.
- **Rates tab** — every company activity is shown even if this employee has no rate for it yet
  (rendered dimmed, with an "Activate" affordance in place of an amount); rows with a rate show
  this month's hours and an amount summed from actual logged entries, not `hours × current rate`.
- **History tab** — 5 calendar months (current inclusive), each independently zeroed if the
  employee logged nothing that month; a 3-up summary strip (total hours, total pay, average
  hours/month) is computed client-side from the same 5 rows, not a separate request.

---

## User Flows

1. Manager clicks an employee card (Team page) or a top-5 row (Dashboard) → navigates to
   `/team/$employeeId` → header loads with this-month stats; Attendance tab is the default view.
2. Manager switches tabs (Attendance / Rates / History) → the tab's own query fires; other tabs'
   data stays cached, no full-page reload.
3. Manager steps the Attendance tab's month picker or picks an activity filter → the entries table
   re-renders for that scope.
4. Manager sets or clears a bonus in the Attendance tab's `BonusCard`, for whatever month
   `PeriodBar` currently shows → same `setEmployeeBonus`/`clearEmployeeBonus` endpoints the Reports
   page uses (see `reports.md`); the tab's own report query invalidates and the table's bonus row
   updates immediately.
5. Manager clicks "activate" or an existing rate in the Rates tab → the cell becomes an inline
   input with Save/Cancel; Save calls the upsert endpoint and refetches the row.
6. Manager opens the "⋯" menu → edits the job title inline in the header, exports the
   current month's time entries as a CSV download, or suspends/reactivates the employee (each with
   a toast confirming the result).
7. Manager views the History tab → the last 5 months render as two small charts (hours, pay) with
   a synced hover crosshair; a "view as table" toggle swaps to a plain data table of the same rows.

---

## Information Architecture

Route: `/team/$employeeId` (`employeeProfileRoute` in `src/routes/index.tsx`, already wired to
`EmployeeProfilePage.tsx` before this page had real content — see `team.md`'s former Deferred
entry). Breadcrumb: "Team → Employee profile" (`Echipă → Profil angajat`), set via `useTopBar()`.
No modals — job-title edit and rate edit are both inline, not dialogs.

---

## UI / Layout

### Header card

- Single card, `flex`, `gap: 20px`, `align-items: center`, wraps on narrow widths.
- Avatar: 64×64, initials badge (`getInitials`, same pattern as `EmployeeCard`/`Sidebar`).
- Name (22px / 700) + active/suspended status pill, inline.
- Secondary line: email + "member since" (join date, `UserOut.created_at`), 12px muted.
- Job title: a small pill when set; replaced by an inline text input + Save/Cancel while editing
  (triggered from the "⋯" menu, not a pencil icon on the pill itself).
- Two stat blocks (hours this month + `Delta`, estimated pay), separated from the identity block
  by a left border, mono font for both values.
- "⋯" menu: `btn-square btn-ghost`, DaisyUI `dropdown`/`menu` classes — first dropdown in this
  codebase, no shared abstraction introduced (see Special Aspects).

### Tab strip

- Three tabs (Attendance / Rates / History), 14px medium, muted when inactive, ink when active.
- A 2px indicator slides between tab positions (`left`/`width` measured off the active button's
  `offsetLeft`/`offsetWidth`, CSS `transition`) — first tab component in this codebase, hand-built
  since no `tabs` primitive exists yet.

### Attendance tab

- Own `PeriodBar` instance (reused component, independent state from any other tab), paired with a
  `BonusCard` (reused from `components/reports/`) in a wrapping flex row — same component and
  `useSetReportBonus`/`useClearReportBonus` hooks the Reports page uses, both keyed off this tab's
  own `period` state so the bonus editor always targets the exact month `PeriodBar` shows, with no
  separate period concept to fall out of sync. `BonusCard` remounts via a `key` on
  employeeId/period change, same reset-by-remount pattern as its Reports page usage.
- Card: title + count/total-hours summary + a plain `<select>` activity filter (only shown when
  the loaded month has more than one distinct activity).
- Table: date, time range (mono), activity (neutral pill, same visual language as `EmployeeCard`'s
  activity chips — no per-activity color mapping exists in this design system), duration (mono),
  rate (mono, muted), amount (mono, bold). Duration/amount computed client-side from
  `time_start`/`time_end`/`rate_applied` — never sent pre-formatted by the backend. A bonus set for
  the picked month renders as a read-only summary row here, same `PayrollBonusOut` the `BonusCard`
  above edits.

### Rates tab

- A short explanatory line above the table (paraphrased, not shipped-spec copy): the employee sees
  the rate but can't change it, and edits only affect future entries.
- Table: activity, rate (inline-editable), hours this month (mono), estimated amount. A row with
  no rate yet is `opacity: 50%` with an "Activate" pill button in the amount column.

### History tab

- **Two single-axis charts, not one dual-axis chart** — see Special Aspects for why. Left: hours,
  `Area` (orange, ~10% fill opacity, 2px line). Right: estimated pay, `Line` (blue, 2px). Both
  share an `syncId` so hovering either shows a synced crosshair across both.
- Custom tooltip per chart (light surface, bordered, shadow — matching the app's card style, not a
  dark tooltip): month/year muted, value bold.
- Current month's X-axis tick is bold ink; other months are muted.
- The last (current-month) point on each chart is direct-labeled with its value — the only point
  labeled, per the dataviz skill's "never a number on every point" rule.
- A "view as table" toggle swaps both charts for a plain 3-column table (month, hours, pay) — the
  chart's accessible/lossless twin, not a separate data source.
- Below: 3 `KpiCard`s (total hours, total pay, average hours/month), same component the Dashboard
  KPI strip uses.

Design tokens (color/radius/shadow/font) come from `src/App.css`'s `"stafy"` theme; no new tokens
introduced. See `docs/ui-guidelines.md`.

---

## Data Access

All 8 endpoints are manager-only, under tag `users`, wrapped one-hook-per-resource in
`src/hooks/useEmployee*.ts`:

```typescript
GET  /api/v1/users/{id}/summary?year=&month=              → CompanyTopEmployeeOut
GET  /api/v1/users/{id}/time-entries?year=&month=&activity_id= → { data: TimeEntryOut[] }
GET  /api/v1/users/{id}/hourly-rates?year=&month=          → { data: EmployeeActivityRateOut[] }
PATCH /api/v1/users/{id}/hourly-rates/{activityId}          → HourlyRateOut
GET  /api/v1/users/{id}/monthly-history?months=             → { data: EmployeeMonthlyHistoryEntryOut[] }
PATCH /api/v1/users/{id}/job-title                           → UserOut
POST /api/v1/users/{id}/suspend                              → UserOut
POST /api/v1/users/{id}/reactivate                           → UserOut
```

```typescript
EmployeeActivityRateOut {
  activity_id: number
  activity_name: string
  hourly_rate_gross: string | null   // null = no rate set yet, "Activate" affordance
  hours_this_month: number
  estimated_amount: string           // Decimal-as-string, same convention used elsewhere
}
```

None of these existed before this page — see `stafy-backend/docs/modules/employee-profile.md` for
the backend-side design (scoping guard, why the rate-set endpoint diverges from self-service, why
suspend/reactivate are POST actions).

The Attendance tab's bonus editor calls the `reports`-tag endpoints instead — `GET
/api/v1/reports/{id}`, `PUT`/`DELETE /api/v1/reports/{id}/bonus` (all `year`/`month` query params)
via `useEmployeeReport`/`useSetReportBonus`/`useClearReportBonus` in `src/hooks/useReports.ts`, the
same hooks and `BonusCard` component the Reports page uses — see `reports.md` for the
endpoint/schema detail, not repeated here.

---

## Special Aspects

**Two single-axis charts instead of one dual-axis chart.** Hours and estimated pay are different
units/scales; a shared two-y-axis plot would let the reader read a spurious correlation into
wherever the two scales happen to align, which is arbitrary. The History tab renders them as two
small, single-axis charts (small multiples) with a synced hover crosshair (`syncId`) instead —
same "compare hours and pay for a given month" experience, without inventing a correlation.

**Recharts is a new dependency, precedent-setting.** Every other chart in this codebase
(`ActivityDonut`) is hand-rolled SVG with no charting library. History's chart needs synced
multi-chart tooltips and per-point animation that hand-rolling would make disproportionately
expensive, so this page introduces Recharts. Future charts should reach for it too rather than
hand-rolling a second one-off.

**No shared `Tabs`/`Dropdown`/`Modal` primitives were introduced.** `EmployeeTabs` (sliding
indicator) and `EmployeeActionsMenu` (DaisyUI dropdown) are both built page-scoped, consistent with
how `EmployeeCard` and other feature-specific components in this codebase are already built —
there is no generic UI-primitive layer in this project yet (see `docs/ui-guidelines.md`). Job-title
and rate editing are both inline (input + Save/Cancel), not a dialog, so no `Modal` was needed.

**CSV export always covers the current month, independent of the Attendance tab's own filter.**
The "⋯" menu's export is driven by its own current-month query (same `useEmployeeTimeEntries` hook,
same cache key when it matches what Attendance is already showing), not whatever month/activity
the Attendance tab happens to be scrolled to — exporting "this employee's current pontaje" is a
simpler, more predictable contract than exporting an arbitrary filtered view.

**Money fields stay Decimal-as-string; `rate_applied` stays a snapshot.** Same conventions as the
rest of this API — no field here recomputes a past entry's amount from a rate that's since changed.

---

## Deferred

| Item | Trigger |
|---|---|
| Editing name/email from this page | Would require writing through to Firebase Auth |
| A distinct "remove from team" action | A real team-membership concept starts being written |
| Messaging/notification action from the "⋯" menu | A messaging subsystem exists in the product |
| URL-persisted tab/period state (deep-linkable tabs) | A concrete need to link directly into a specific tab |
