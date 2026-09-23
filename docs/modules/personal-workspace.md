# Personal Workspace

Employee self time-tracking shell (`/me`, `/me/attendance`, `/me/history`, `/me/rates`), plus manager self-tracking under the same routes via the sidebar's company/personal switcher. Sources: `src/pages/me/*`, `src/layouts/AppLayout.tsx`, `src/components/layout/Sidebar.tsx`, `src/pages/onboarding/EmployeeOnboardingPage.tsx`.

## Scope

**In scope:** the four personal pages (home dashboard, attendance entry, history with delete, own-rates view); employee access to those routes (same shell managers use for self-tracking); manager/employee role variations per page (rates read-only for employees, bonus editor hidden in the personal shell); employee profile onboarding (name + job title, no company write); incoming-invitation accept/reject cards; responsive layouts (desktop table + mobile card variants, touch-size targets).

**Out of scope (this release):** an employee view of company data (team roster, reports, settings stay manager-only — employees redirect to `/me`); offline support (all reads/writes are online-only, same standing debt as the rest of the app); push/email notifications for invitations; a distinct employee mobile-web experience beyond responsive breakpoints (the native app remains the phone-first surface).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Employee | `stafy-web-app` (browser) | Tracks own hours, views own history/pay, views own rates read-only, accepts/rejects team invitations, completes profile onboarding once |
| Manager | `stafy-web-app` (browser, personal workspace mode) | Same four pages for self-tracking (rates editable for own rows where a self-service counterpart exists); company administration lives in the separate company shell |
| Backend | FastAPI (`stafy-backend`) | Serves self-scoped reads plus role-gated writes; rejects cross-employee reads with 404 |

---

## Data Objects

### Referenced (not owned)

- `UserOut` — via `GET /api/v1/profile` (`useProfile()`): source of `role`, `onboarding_completed`, `is_own_company`, and identity for every gate below.
- `HourlyRateOut`, `TimeEntryOut`, `EmployeeMonthlyHistoryEntryOut`, `PayrollBonusOut`, `InvitationIncomingOut` — read through existing endpoints, same shapes the manager shell uses.
- `CompanyTopEmployeeOut` — never fetched by these pages (no roster here by design).

### Owned

None. Read/write aggregation views over backend-owned rows; no ORM/DB entity belongs to these pages. The employee onboarding write goes through a dedicated backend endpoint (`PATCH /users/me/employee-onboarding`, employee-only) rather than reusing the manager's company onboarding.

---

## Lifecycle

N/A — no stateful entity behind these pages. Client-side UI state: form drafts (attendance inputs, rate edit, bonus draft inside `BonusCard`), confirm-delete flags, invitation respond-in-flight flags, table/chart toggles — none persisted or synced to the URL. Invitation accept flips server-side membership (company assignment) and invalidates `profile`/`my-dashboard`/`my-hourly-rates` queries; reject only removes the card.

---

## Derived / Aggregated Data

- Home dashboard KPIs and activity distribution derive from `GET /dashboard/me` (backend-computed; empty states when no hours/rates yet).
- History charts derive from the monthly-history endpoint (bonus folded into pay, same convention as the manager shell).
- Invitation cards derive from `GET /invitations/me` (pending, addressed to the caller's email).

---

## User Flows

1. Employee logs in → `AppLayout` sees `role === 'employee'`: company routes redirect to `/me`; incomplete onboarding redirects to `/employee-onboarding`. Sidebar shows the personal nav only, no workspace switcher, role label reads as the employee term.
2. Employee completes profile onboarding once (first name, last name, job title from the shared picklist + custom option) → `PATCH /users/me/employee-onboarding` → explicit navigate to `/me`.
3. Employee opens home → sees monthly KPIs, activity distribution, and any pending team invitations as accept/reject cards (accept refreshes profile + dashboard + rates so the new company shows immediately).
4. Employee records hours on the attendance page (activity from own configured rates, start/stop inputs, live duration + pay estimate) → save posts a time entry; validation/duplicate errors surface as localized toasts.
5. Employee reviews history (charts + table toggle, month picker, per-entry delete with confirm) → bonus row shows the granted amount read-only; the bonus editor never renders in the personal shell.
6. Employee opens rates → sees only already-configured own rates, read-only, with a note that rates are manager-set; no company-wide unconfigured list, no new-activity form (both removed — those belong to the manager's settings surface, and the backend 403s joined employees there anyway).
7. Manager switches the sidebar to personal mode → same four pages with manager variations (rates editable on own rows via the self-service upsert; bonus editor visible in company-shell contexts only).

---

## Information Architecture

Routes: `/me`, `/me/attendance`, `/me/history`, `/me/rates` (`myDashboardRoute`, `myAttendanceRoute`, `myHistoryRoute`, `myRatesRoute` in `src/routes/index.tsx`, under the authenticated app layout); `/employee-onboarding` (same parent, guarded by the `AppLayout` employee branch rather than a dedicated layout). Sidebar: employees always see the personal item list; managers see the company/personal switcher and choose. No modals owned by these pages (deletes use inline confirm states, not dialogs).

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
GET  /api/v1/users/me/settings/hourly-rates                 → own configured rates only
GET  /api/v1/users/{id}/summary?year=&month=                → manager + employee(self-only*)
GET  /api/v1/users/{id}/time-entries?year=&month=           → manager + employee(self-only*)
GET  /api/v1/users/{id}/hourly-rates?year=&month=           → manager + employee(self-only*)
GET  /api/v1/users/{id}/monthly-history?months=             → manager + employee(self-only*)
GET  /api/v1/reports/{id}?year=&month=                      → manager + employee(self-only*)
GET  /api/v1/invitations/me                                 → own pending invitations (any authenticated role)
POST /api/v1/invitations/{id}/accept                        → employee only (backend rejects other roles)
POST /api/v1/invitations/{id}/reject                        → any authenticated role
POST /api/v1/time-entries/                                  → any authenticated role (own entries)
DELETE /api/v1/time-entries/{id}                            → own entries (ownership-checked server-side)
PATCH /api/v1/users/me/employee-onboarding                  → employee only (profile fields + job title, no company write)
PATCH /api/v1/users/me/settings/account                     → manager, admin, employee (own names)
```

(`*`) The five `/{employee_id}` read routes accept `require_role("manager", "employee")` with an explicit self-only check for employee callers (`employee_id != current_user.id` → 404 `not_found`): the shared service guard alone would let employee X read employee Y in the same company, so the route adds the check before the service call. Managers keep whole-company reads. All write routes under `/{employee_id}` stay manager-only with the strict employee-only guard (never self).

---

## Special Aspects

**Employees share the manager's personal pages rather than getting a parallel set.** The `/me/*` routes, hooks, and tab components are role-agnostic reads; role variations are small conditionals at the call site (rates table hides its actions column for employees, `AttendanceTab` takes `allowBonusEdit={false}` in the personal shell, intro copy switches to the manager-set note). This keeps one implementation with no fork to drift — the price is that every new affordance on these pages needs an explicit role decision, not a default-allow.

**Bonus visibility vs. editability is deliberately split.** The bonus amount is real pay and always renders (personal shell, employee viewers, manager self-view alike); only the editor is gated (`canEditBonus = role === 'manager'` plus shell/self rules where they apply). Hiding the amount would hide money the viewer is owed or owes visibility into.

**Manager self-service is the exception that proves the company-shell rule.** Rates and bonus writes reject everyone except through narrow self paths that exist only because a manager has no superior to act for them (`POST /me/settings/hourly-rates` upsert; company-shell bonus editor on the own row). Employees have no equivalent need — their manager acts for them — so the same endpoints stay closed to them, and the UI never offers what the backend would 403.

**Employee onboarding is profile-only by construction.** The manager's onboarding writes the company row (name/city/address) plus job title; the employee's writes names + job title only. Reusing the manager endpoint would let an employee rename their manager's company, so the split endpoint exists regardless of how similar the two forms look.

**No offline support on these pages.** Same standing debt as the rest of the app: reads don't cache, writes don't queue. Invitation accept/reject and attendance submit need connectivity; failures surface as toasts, not queued retries.

---

## Deferred

| Item | Trigger |
|---|---|
| Push/email notification for new invitations | A notification subsystem exists in the product |
| Offline queue for attendance submit | `OfflineManager`-equivalent (or backend idempotency) lands for non-POST verbs |
| Employee avatar/photo upload | A storage story exists for user media |
| Paginated history (beyond 5-month window + month picker) | History grows large enough to need it |
