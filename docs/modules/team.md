# Team

Manager-only full company roster. Route `/team`, `src/pages/team/TeamPage.tsx`.

## Scope

**In scope:** searchable grid of employee cards for the whole company roster; each card shows
this-month hours worked, delta vs. previous month, estimated pay, activities worked, and
active/inactive status; client-side name/email search; CSV export of the currently-loaded roster;
an entry point to the invite flow; card click navigates to the employee profile route.

**Out of scope (this release):** the invite flow itself (the invite button navigates to the
`/invitations` page — see `docs/modules/invitations.md`); a period switcher (always the current
calendar month); pagination; row-level mutating actions (deactivate, edit, remove) — read-only
page. See `docs/modules/employee-profile.md` for the employee detail page each card links to.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` (Portal) | Browses/searches the full employee roster, exports it to CSV, navigates to an employee's profile or to the invite flow |

---

## Data Objects

### Referenced (not owned)

- `UserOut` (`stafy-backend/app/users`) — embedded in each row via `CompanyTopEmployeeOut.user`.
- `CompanyTopEmployeeOut` (`stafy-backend/app/users/schemas.py`) — reused directly as the
  per-employee row shape (`user`, `total_hours`, `delta_vs_previous_month`, `activities`,
  `estimated_gross`); no parallel schema is defined for this page.

### Owned

None. Read-only aggregation view; no ORM/DB entity belongs to this page.

---

## Lifecycle

N/A — no stateful entity behind this page. Client-side UI state is limited to the search string.

---

## Derived / Aggregated Data

One row per employee (`role == "employee"` only), for the current calendar month:

- **Hours this month** — summed from time-entry rows.
- **Delta vs. previous month** — current month's hours minus previous month's hours.
- **Estimated pay** — summed rate × hours across this month's entries.
- **Activities** — distinct activity names worked this month.

Employees with zero time entries this month still get a row (hours 0, no activities, zero pay,
delta computed against last month's hours if any). No data is stored client-side; it's recomputed
by the backend on each request.

---

## User Flows

1. Manager opens the page → sees every employee in their company as a card with the current
   month's stats.
2. Manager types in the search input → grid filters client-side by name/email substring, case
   insensitive, no debounce.
3. Manager triggers the CSV export → browser downloads a file of the currently-loaded roster
   (unaffected by the active search filter), followed by a success toast.
4. Manager triggers the invite action → navigates to the invitations page (see
   `docs/modules/invitations.md`).
5. Manager clicks a card → navigates to the employee profile route (see
   `docs/modules/employee-profile.md`).

---

## Information Architecture

Route: `/team` (`teamRoute` in `src/routes/index.tsx`, under the authenticated app layout). No
breadcrumb — top-level nav item. No modals owned by this page.

---

## UI / Layout

### Header row

- Flex row, space-between, wraps on narrow widths.
- Search input: fixed width, bordered container matching the app's surface/line tokens, small
  leading search icon, borderless text input inside.
- Right side: an outline-style secondary action (export) and a filled primary action (invite),
  each with a leading icon.

### Grid

- Auto-filling column grid, fixed gap, minimum card width around 320px.
- Each card enters with the app's existing fade/slide-in animation, staggered by index (capped
  delay).
- Two distinct empty states: no employees at all in the company, vs. the active search matching
  nothing.

### Employee card (`EmployeeCard`)

- Bordered surface card, hover state raises elevation, shifts up slightly, and switches the border
  to the primary accent color; the whole card is clickable.
- Header: avatar (initials-based, no photo field on `UserOut`), truncated name and email, and a
  status pill (active/inactive) in the corner.
- Stats row: two-column layout with a top/bottom divider — hours this month (with the delta
  indicator) and estimated pay.
- Footer: capped list of activity chips with an overflow count, and a "view details" affordance
  that adopts the accent color on card hover.

Design tokens (color/radius/shadow/font) come from the app's shared theme file — see
`docs/ui-guidelines.md`; no new tokens were introduced.

---

## Data Access

- `GET /api/v1/teams/members?year=&month=` (tag `teams`, wrapped in `useTeamMembers(year, month)`)
  → `TeamMembersOut`. Manager-only, lives in `app/teams/router.py`, backed by `TeamService` in
  `app/teams/service.py`.

```typescript
TeamMembersOut {
  data: {
    user: UserOut
    total_hours: number
    delta_vs_previous_month: number
    activities: string[]
    estimated_gross: string          // Decimal-as-string, same convention used elsewhere
  }[]
}
```

- The existing `useTeam()` hook (bare roster endpoint) is not used by this page — it continues to
  back only its prior consumer. This page's need (per-employee monthly stats for every employee)
  is a strictly richer shape only `/teams/members` provides.

---

## Special Aspects

**Every employee gets a row, including zero-hour ones.** The aggregation this page's backend
endpoint performs starts from the full employee roster and merges in monthly time-entry
aggregation, defaulting an employee to zero stats if they have no entries that month, rather than
omitting them. This is the defining difference from any hours-ranked "top N" view elsewhere in the
product.

**Employee scoping is by company assignment, not a separate membership table.** A `TeamMembership`
row is written on invitation acceptance (both register-time auto-join and explicit accept), but
nothing reads it yet — this page's roster query, like the rest of the backend, scopes employees by
`User.company_id` instead.

**No shared `Card`/`Badge`/`Button` primitives were introduced for this page.** `EmployeeCard` is
built with page-scoped styling, consistent with how other feature-specific cards in this codebase
are already built — there is no generic UI-primitive layer in this project yet (see
`docs/ui-guidelines.md`).

**CSV export has no library dependency.** The export is generated by hand (no third-party CSV
library) and includes a UTF-8 byte-order mark plus per-field quoting so the file opens correctly in
common spreadsheet software regardless of special characters in names/emails.

**Money fields stay Decimal-as-string.** `estimated_gross` follows the same string-encoded Decimal
convention used elsewhere in this API — never a JS `number`.

---

## Deferred

| Item | Trigger |
|---|---|
| Membership-based employee scoping | This page's roster query migrates from `User.company_id` to `TeamMembership` |
| Pagination / virtualized grid | Company rosters grow large enough to need it |
