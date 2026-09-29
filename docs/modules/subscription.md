# Subscription

The company's plan and seat usage in `stafy-web-app`: an owner/manager-facing Subscription section
in Settings, a persistent plan banner under the top bar, and — for the platform admin — a company
list with plan management and history. Backend rules live in
[`stafy-backend/docs/modules/subscriptions.md`](../../../stafy-backend/docs/modules/subscriptions.md).

## Scope

**In scope:** showing the active company's plan, status, seat usage and expiry; the owner picking
the free solo plan or switching between paid plans; a warning banner when the plan is about to
expire and an error banner when it is read-only; the admin company table, grant form (including
pilot with an expiry) and full plan history; Romanian messages for the plan-related error codes on
every write that can return them.

**Out of scope (this release):** any payment or checkout UI; an owner-facing plan history; email
notifications; a contact form (the "contact us" text is static); per-company trial length.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Owner | Settings → Subscription, banner | Sees plan, seats, expiry; can pick solo or, once on a paid plan, another paid plan |
| Manager | Settings → Subscription (read-only), banner | Sees the same information, no actions |
| Employee | none | The query is disabled for them; they never see a plan surface |
| Platform admin | Settings → Companies | Lists owned companies, sets any plan including pilot, reads history |

---

## Data Objects

### Referenced (not owned)

`SubscriptionOut`, `AdminCompanySubscriptionOut`, `SubscriptionEventOut` and the change payloads
come from the generated client (`src/api/generated/endpoints/index.schemas.ts`); this module owns
no data of its own. Display labels for plan values, statuses and event types live in
`src/utils/planLabels.ts`, so renaming a tier in the UI is a one-file change.

### Owned

None.

---

## Lifecycle

N/A — the front end renders whatever plan state the backend reports. It never derives a status
locally: the effective status (read-only once the expiry has passed) and `expiring_soon` come from
the API.

---

## Derived / Aggregated Data

`ownerPlanOptions(subscription)` in `src/utils/planLabels.ts` decides which choices the owner is
offered: solo from any state except an active pilot, and another paid plan only when already on a
paid plan that is active. It mirrors the backend's owner rule for display only; the backend
re-checks and answers a conflict error if the two ever disagree.

---

## User Flows

1. **Owner opens Settings → Subscription** — sees plan name, status badge, seats used against the
   limit (or "unlimited"), the expiry date if any, and the available changes.
2. **Owner picks a plan** — inline confirm/cancel on the chosen row, then `PATCH /subscriptions/me`;
   success updates the cached plan and toasts, failure toasts the mapped message (headcount above
   the new limit, change not allowed).
3. **Plan is about to expire** — a warning banner appears under the top bar for owners and
   managers, pointing to Settings → Subscription.
4. **Plan is read-only** — an error banner replaces the warning; the Subscription section explains
   that clocking in still works while other changes are blocked, and offers solo to the owner.
5. **Any write hits a read-only plan** — the mutation's own toast shows the read-only message, and a
   global mutation-cache handler refetches the cached plan so the banner appears without a reload.
6. **Admin opens Settings → Companies** — table of companies with owner, plan, status, seats,
   expiry; selecting a row opens the panel.
7. **Admin applies a plan** — plan select, expiry date (required for pilot only), optional note;
   the panel, the table and the history refresh.
8. **Admin reads history** — newest-first table of event, plan, seat snapshot, expiry, actor, note.

---

## Information Architecture

Two new keys in `SettingsNav` (`src/components/settings/SettingsNav.tsx`): Subscription, visible to
owner and manager (`isCompanyManager`), and Companies, visible to the platform admin only. Both are
local-state sections of `SettingsPage` like every other section — no routes. `PlanStatusBanner`
(`src/components/layout/PlanStatusBanner.tsx`) renders between the top bar and the page content in
`AppLayout` and only ever shows for owner/manager, because `useMySubscription` is disabled for any
other role.

---

## UI / Layout

- Subscription section: plan name and status badge on one row, a seat meter (DaisyUI `progress`,
  error tone at full), the expiry line with an "expiring soon" badge, then a bordered list of plan
  choices with inline confirm.
- Banner: DaisyUI `alert` (`alert-warning` when expiring, `alert-error` when read-only), full width,
  no rounding, directly under the top bar.
- Companies section: DaisyUI `table` with a selectable row; the plan panel is a bordered card below
  it with the grant form on top and the history table under it.
- Colors and spacing come from the theme tokens in `src/App.css`, like the rest of Settings.

---

## Data Access

| Endpoint | Method | Used by |
|---|---|---|
| `/api/v1/subscriptions/me` | GET | `useMySubscription` — Subscription section, banner |
| `/api/v1/subscriptions/me` | PATCH | `useChangeMyPlan` — owner's plan switch |
| `/api/v1/admin/companies` | GET | `useAdminCompanies` |
| `/api/v1/admin/companies/{id}/subscription` | GET / PATCH | `useAdminCompanySubscription`, `useAdminSetSubscription` |
| `/api/v1/admin/companies/{id}/subscription/events` | GET | `useAdminSubscriptionEvents` |

All hooks are in `src/hooks/useSubscription.ts` (company side) and `src/hooks/useAdmin.ts` (admin
side). Error codes `plan_read_only`, `seats_limit_reached`, `seats_over_new_limit` and
`plan_change_not_allowed` map to Romanian messages in `src/services/apiErrors.ts`
(`getCodedErrorMessage`, also consulted first by `getErrorMessage`).

---

## Special Aspects

**Plan errors must reach every write, not just this section.** A read-only company blocks most
writes across the app, so any mutation with a generic fallback message would hide the real cause.
Every mutation error path that could return one of the plan codes goes through
`getCodedErrorMessage`, which checks the shared code map before falling back. A new mutation with a
hard-coded failure message should do the same.

**The plan cache is refreshed by a global handler, not per hook.** `src/lib/queryClient.ts`
registers a mutation-cache error handler that invalidates the cached plan on a read-only response.
It deliberately shows no toast — each mutation already toasts its own error, and a second toast
would be noise.

**The banner only runs for owner and manager.** The plan endpoint requires at least manager, so the
query is disabled for employees and admins instead of firing and failing with a permission error.

**The seat limits shown in the picker are display text.** The picker's per-plan descriptions repeat
the backend's constants; enforcement is entirely server-side.

---

## Deferred

| Item | Trigger |
|---|---|
| Checkout / payment UI and owner self-upgrade into paid plans | Backend billing integration exists |
| Owner-facing plan history | Backend exposes a redacted history |
| Contact form for larger companies | A sales process exists |
| Pagination for the admin company list and history | Either list grows large |
