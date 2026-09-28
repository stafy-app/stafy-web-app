# Personal Workspace

Employee self time-tracking shell (`/me`, `/me/attendance`, `/me/history`, `/me/rates`), plus manager self-tracking under the same routes via the sidebar's company/personal switcher. Sources: `src/pages/me/*`, `src/layouts/AppLayout.tsx`, `src/components/layout/Sidebar.tsx`.

## Scope

**In scope:** the four personal pages (home dashboard, attendance entry, history with delete, own-rates view — add/edit/delete); employee access to those routes (same shell managers use for self-tracking); rates self-service/read-only split per `is_own_company` (own-company employees and the company's owner alike can add/edit/delete their own rates; employees and non-owner managers who joined a company via invitation see them read-only), bonus editor hidden in the personal shell; incoming-invitation accept/reject cards; responsive layouts (desktop table + mobile card variants, touch-size targets).

**Out of scope (this release):** an employee view of company data (team roster, reports, settings stay manager-only — employees redirect to `/me`); offline support (all reads/writes are online-only, same standing debt as the rest of the app); push/email notifications for invitations; a distinct employee mobile-web experience beyond responsive breakpoints (the native app remains the phone-first surface).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Employee | `stafy-web-app` (browser) | Tracks own hours, views own history/pay, self-services own rates (add/edit/delete) while in their own company, read-only once joined to a manager's company, accepts/rejects team invitations |
| Owner | `stafy-web-app` (browser, personal workspace mode) | Same four pages for self-tracking, same self-service rates (the owner's active company is their own, so `is_own_company` is `true`); company administration lives in the separate company shell |
| Manager (non-owner) | `stafy-web-app` (browser, personal workspace mode) | A second manager who joined the owner's company via invitation. Same four pages for self-tracking, but rates are read-only (`is_own_company` is `false` — the owner sets them); company administration lives in the separate company shell |
| Backend | FastAPI (`stafy-backend`) | Serves self-scoped reads plus role-gated writes; rejects cross-employee reads with 404 |

---

## Data Objects

### Referenced (not owned)

- `UserOut` — via `GET /api/v1/profile` (`useProfile()`): source of `role`, `onboarding_completed`, `is_own_company`, and identity for every gate below.
- `HourlyRateOut`, `TimeEntryOut`, `EmployeeMonthlyHistoryEntryOut`, `PayrollBonusOut`, `InvitationIncomingOut` — read through existing endpoints, same shapes the manager shell uses.
- `CompanyTopEmployeeOut` — never fetched by these pages (no roster here by design).

### Owned

None. Read/write aggregation views over backend-owned rows; no ORM/DB entity belongs to these pages.

---

## Lifecycle

N/A — no stateful entity behind these pages. Client-side UI state: form drafts (attendance inputs, rate edit), confirm-delete flags, invitation respond-in-flight flags, the history page's own month picker (`AttendanceTab`'s `period` state) — none persisted or synced to the URL. Invitation accept flips server-side membership (company assignment) and invalidates `profile`/`my-dashboard`/`my-hourly-rates` queries; reject only removes the card.

---

## Derived / Aggregated Data

- Home dashboard KPIs and activity distribution derive from `GET /dashboard/me` (backend-computed; empty states when no hours/rates yet).
- History charts derive from the monthly-history endpoint (bonus folded into pay, same convention as the manager shell).
- Invitation cards derive from `GET /invitations/me` (pending, addressed to the caller's email).

---

## User Flows

1. Employee logs in → `AppLayout` sees `role === 'employee'`: company routes redirect to `/me`. No onboarding step — `onboarding_completed` is already `true` from register (see `docs/modules/auth.md`). Sidebar shows the personal nav only, no workspace switcher, role label reads as the employee term.
2. Employee opens home → sees monthly KPIs, activity distribution, and any pending team invitations as accept/reject cards (accept refreshes profile + dashboard + rates so the new company shows immediately — this is also the moment `is_own_company` flips to `false` and rates self-service turns off).
3. Employee records hours on the attendance page (activity from own configured rates, start/stop inputs, live duration + pay estimate) → save posts a time entry; validation/duplicate errors surface as localized toasts. If there are no rates yet, this page and the home dashboard show an empty state instead — its CTA ("Configurează tarife" → `/me/rates`) only renders when `is_own_company` is true; a joined employee sees a "your manager hasn't set a rate yet" message with no CTA, since there's nothing to configure.
4. Employee opens history → the page leads with period selection (`AttendancePeriodHeader` — month picker only, no `BonusCard`: `showBonusCard={false}`, since the granted bonus, if any, already renders as its own row inside the Pontaje table below, so a second card here would just repeat it), then `HistoryTab`'s 5-month summary (3 KPI cards — total hours, total pay, average hours/month — above the two trend charts, no table-view toggle), then the Pontaje table (`AttendanceEntriesTable`, for the month `AttendancePeriodHeader` has selected) with its own "Acțiuni" column — per-entry delete + inline confirm, `allowDelete` prop. Both the period header and the table read/write the same `useAttendanceMonth(employeeId)` hook instance, so navigating the month picker updates the table without a second, independently-scrolled fetch.
5. Employee opens rates: while `is_own_company` (no manager yet, or never joined one), sees an "Adaugă activitate" form (activity name + RON/h rate, get-or-create) above the list, plus Editează/Șterge on each row. Once joined to a manager's company, `is_own_company` flips `false` and the page becomes read-only — no add form, no actions column, just a note that the manager sets rates.
6. Owner or manager switches the sidebar to personal mode (the switcher renders for `isCompanyManager(role)`, i.e. `owner` or `manager`) → same four pages. Rates follow the same `is_own_company` split as step 5: the owner (`company_id` equals `personal_company_id`) gets self-service; a non-owner manager who joined via invitation gets the read-only view. Bonus editor visible in company-shell contexts only.

---

## Information Architecture

Routes: `/me`, `/me/attendance`, `/me/history`, `/me/rates` (`myDashboardRoute`, `myAttendanceRoute`, `myHistoryRoute`, `myRatesRoute` in `src/routes/index.tsx`, under the authenticated app layout). Sidebar: employees always see the personal item list; owners and managers see the company/personal switcher and choose. The sidebar's role label reads as the employee term for `employee`, "Admin" for `admin`, and "Manager" for both `manager` and `owner` — there is no distinct owner label. No modals owned by these pages (deletes use inline confirm states, not dialogs).

---

## UI / Layout

Responsive-first: desktop keeps the existing table layouts (`hidden ... sm:table`); small screens get stacked card variants (`sm:hidden`) with larger touch targets (action buttons meet a minimum touch height, icon-only delete becomes a larger tap area). Page padding and section gaps step down one notch below the small breakpoint. Charts stack vertically on narrow screens instead of side-by-side. Invitation cards render above all other home content so a pending team decision is never missed below the fold.

Design tokens come from the app's shared theme file — see `docs/ui-guidelines.md`; no new tokens were introduced.

---

## Data Access

All reads are caller-scoped or self-or-employee guarded; all writes are role-gated:

```typescript
GET  /api/v1/dashboard/me                                   → own monthly dashboard
GET  /api/v1/profile                                        → role, onboarding_completed, is_own_company
GET  /api/v1/users/me/settings/hourly-rates                 → own configured rates
POST /api/v1/users/me/settings/activities                   → any company role (+ admin), own company only (get-or-create activity + rate)
PATCH /api/v1/users/me/settings/hourly-rates                → any company role (+ admin), own company only (update-only, 404 if missing)
DELETE /api/v1/users/me/settings/activities/{id}            → any company role (+ admin), own company only
GET  /api/v1/users/{id}/summary?year=&month=                → owner/manager + employee(self-only*)
GET  /api/v1/users/{id}/time-entries?year=&month=           → owner/manager + employee(self-only*)
GET  /api/v1/users/{id}/hourly-rates?year=&month=           → owner/manager + employee(self-only*)
GET  /api/v1/users/{id}/monthly-history?months=             → owner/manager + employee(self-only*)
GET  /api/v1/reports/{id}?year=&month=                      → owner/manager + employee(self-only*)
GET  /api/v1/invitations/me                                 → own pending invitations (any authenticated role)
POST /api/v1/invitations/{id}/accept                        → any non-admin caller; 409 `owner_has_team` if the caller owns a company with other active members
POST /api/v1/invitations/{id}/reject                        → any authenticated role
POST /api/v1/time-entries/                                  → any authenticated role (own entries)
PATCH /api/v1/time-entries/{id}                             → owner/manager only (any entry in their active company, start/stop only — see AttendanceEntriesTable's allowEdit)
DELETE /api/v1/time-entries/{id}                            → own entries (ownership-checked server-side)
PATCH /api/v1/users/me/settings/account                     → any company role (+ admin) (own names)
```

(`*`) The five `/{employee_id}` read routes accept `require_company_role(min="employee")` (so owner, manager, and employee alike) with an explicit self-only check for employee callers (`employee_id != current_user.id` → 404 `not_found`): the shared service guard alone would let employee X read employee Y in the same company, so the route adds the check before the service call. Managers keep whole-company reads. All write routes under `/{employee_id}` stay manager-only with the strict employee-only guard (never self).

The three self-service rates writes (`POST .../activities`, `PATCH .../hourly-rates`, `DELETE .../activities/{id}`) all 403 with `not_own_company` when `company_id != personal_company_id` — the same condition `is_own_company` on `UserOut` exposes to the client, so `MyRatesPage.tsx` hides the add/edit/delete affordances instead of letting the user hit a 403.

---

## Special Aspects

**Employees share the manager's personal pages rather than getting a parallel set.** The `/me/*` routes, hooks, and tab components are role-agnostic reads; role variations are small conditionals at the call site (rates table hides its actions column and add form once `is_own_company` is `false`; the personal shell passes `allowBonusEdit={false}`/`showBonusCard={false}` and `allowDelete` to the `AttendancePeriodHeader`/`AttendanceEntriesTable` pair, where the company shell's `AttendanceTab` wrapper leaves those at their defaults; intro copy switches to the manager-set note). This keeps one implementation with no fork to drift — the price is that every new affordance on these pages needs an explicit role decision, not a default-allow.

**`AttendanceTab` is a thin composition, not the only consumer of its pieces.** `useAttendanceMonth` (period/entries/bonus/activity-filter state), `AttendancePeriodHeader` (`PeriodBar` + optional `BonusCard`), and `AttendanceEntriesTable` (the Pontaje table + optional delete column) live as three separate exports under `src/components/employee/tabs/`. `AttendanceTab` (`EmployeeProfilePage`'s Attendance tab) just renders the header then the table, adjacent, using one hook instance. `MyHistoryPage` calls `useAttendanceMonth` itself and renders the header and the table with `HistoryTab`'s chart sandwiched between them — the split exists specifically so that reorder doesn't require a second, desynced fetch of the same month's entries.

**Bonus visibility vs. editability is deliberately split, but the visible surface differs by shell.** The bonus amount is real pay and always renders somewhere — in the company shell (`EmployeeProfilePage`, Reports) that's the standalone `BonusCard` next to the month picker; in the personal shell (`MyHistoryPage`) `BonusCard` is hidden entirely (`showBonusCard={false}`) because the same amount already renders as a row inside the Pontaje table (`AttendanceEntriesTable`'s `bonus &&` row), and showing it twice added nothing. Only the editor is gated (`canEditBonus = isCompanyManager(role)`, i.e. `owner` or `manager`, plus `allowBonusEdit={false}` in the personal shell) — no one edits a bonus from the personal shell. On the backend, setting or clearing one's *own* bonus is accepted only from the owner; a non-owner manager targeting their own row gets a 404 `not_found`.

**Rates self-service is gated on `is_own_company`, not role.** `POST/PATCH/DELETE /users/me/settings/hourly-rates|activities` all accept any company role (`require_company_role(min="employee")`, which also admits a platform admin) and 403 only on `company_id != personal_company_id` — the backend's own condition for "nobody else (the company's owner) is managing this account's rates for them." The owner's active company is their own, so they always get self-service; a non-owner manager who joined the owner's company via invitation does not (same as a joined employee), even though they do get the workspace switcher and the personal shell for tracking their own hours — the switcher gates on role, rates self-service on `is_own_company`, two separate gates. An employee who hasn't been invited anywhere gets the same self-service capability as the owner. `MyRatesPage.tsx` mirrors this exactly (`isOwnCompany = profile.is_own_company`), not a `role === 'employee'` check — using role there would wrongly hide the add/edit/delete UI from a not-yet-invited employee even though the backend allows it.

**No offline support on these pages.** Same standing debt as the rest of the app: reads don't cache, writes don't queue. Invitation accept/reject and attendance submit need connectivity; failures surface as toasts, not queued retries.

---

## Deferred

| Item | Trigger |
|---|---|
| Push/email notification for new invitations | A notification subsystem exists in the product |
| Offline queue for attendance submit | `OfflineManager`-equivalent (or backend idempotency) lands for non-POST verbs |
| Employee avatar/photo upload | A storage story exists for user media |
| Paginated history (beyond 5-month window + month picker) | History grows large enough to need it |
| Distinct sidebar role label for the owner (currently shares "Manager" with non-owner managers) | Product decides an owner-specific label is wanted |
