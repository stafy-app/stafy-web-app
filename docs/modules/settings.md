# Settings

Manager-only page for editing the manager's own account name, the company profile, and the
company's shared activity list, plus a password-reset trigger. Route `/settings`,
`src/pages/settings/SettingsPage.tsx`.

## Scope

**In scope:** four sections behind a page-internal vertical nav — Account (edit first/last name),
Company (edit name/city/address), Activities (list + create + rename the company's shared
activities), Security (trigger a Firebase password-reset email).

**Out of scope (this release):** email address editing; phone number field; profile photo upload;
manual per-activity color; account deletion (a destructive, clearly separated "danger zone"); an
"unsaved changes" leave-section warning.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` (Portal) | Edits their own name, their company's profile, and their company's activity list; can request a password-reset email |

---

## Data Objects

### Referenced (not owned)

- `UserOut` (`stafy-backend/app/users/schemas.py`) — `first_name`/`last_name`/`email` prefill the
  Account section; already fetched via the existing `useProfile()` (`GET /profile`).
- `Company` (`stafy-backend/app/models/models.py`) — `name`/`city`/`address` prefill the Company
  section. No `CompanyOut` schema or read/write endpoint exists yet — see Data Access.
- `Activity` (`stafy-backend/app/models/models.py`) — `company_id`-scoped, `activity_name` only (no
  `color` column). The Activities section lists and edits these rows directly, not through
  `HourlyRate`.

### Owned

None. Every field this page edits already exists on `User`, `Company`, or `Activity`; no new
client-side or backend entity is introduced.

---

## Lifecycle

N/A — no stateful entity behind this page. Each section is a plain edit-and-save form or a flat
list; nothing here has states/transitions.

---

## Derived / Aggregated Data

None. The Activities list renders `activity_name` as returned by the backend, in whatever order
the list endpoint returns it — no client-side sort, count, or color computation. This deliberately
does not reuse the rank-based color assignment `ActivityDonut`/`EmployeeCard` use for chips
elsewhere (see Special Aspects).

---

## User Flows

1. Manager opens `/settings` → Account section loads by default, name fields pre-filled from
   `useProfile()`; email renders as a disabled input, not fetched into editable state. Manager
   edits first/last name and submits → `PATCH /users/me` (new) → success toast → `useProfile()`
   cache invalidated/refetched.
2. Manager clicks Company in the section nav → fields pre-filled from `GET /companies/me` (new).
   Edits name/city/address and submits → `PATCH /companies/me` (new, manager-only, scoped to
   `current_user.company_id`) → success toast.
3. Manager clicks Activities → `GET` company activities (new) renders as chips. Clicks the pencil
   on a chip → inline rename → `PATCH` that activity (new) → toast, list refetches.
4. Manager fills the add-activity form (name only) and submits → `POST` a new company activity
   (new) → toast, chip list refetches with the new entry appended. If the name collides
   case-insensitively with an existing company activity (`uq_activities_company_name_lower`), the
   new endpoint returns 409 and the form shows an inline duplicate-name error — it does not
   silently reuse the existing row (see Special Aspects).
5. Manager clicks the pencil on a chip, edits the name, and confirms → `PATCH` that activity (new)
   → toast, list refetches. The same collision as flow 4 applies: renaming onto an existing name
   returns 409, shown inline on the edit field, not applied silently.
6. Manager clicks Security → triggers the password-reset action → client-side
   `sendPasswordResetEmail(auth, profile.email)` (Firebase JS SDK) fires directly, no backend call
   → toast confirms the email was sent, or surfaces the Firebase error. Only reachable for
   `auth_provider: 'email_password'` accounts — see Special Aspects.

---

## Information Architecture

Route: `/settings` (`settingsRoute` in `src/routes/index.tsx`, already registered under
`appLayoutRoute`; top-level Settings item in the main Sidebar nav). Within the page: a new
page-scoped vertical section nav (Account / Company / Activities / Security) holding the selected
section in local component state, not sub-routed — no per-section URL, same non-routed approach the
Employee Profile page's tabs already use. No modals.

---

## UI / Layout

### Section nav (left column)

New component, page-scoped (not a `Sidebar` extension). Four items, each an icon + label on one
row. Active item: `--color-primary-soft` background, `--color-primary-active` text, same tokens
`Sidebar.tsx`'s active pill already uses. Inactive: muted ink, `bg-surface-2` on hover. Fixed
column — does not scroll independently of the page. New `ICONS` entries needed: `user`,
`building2`, `tags`, `shield` (`pencil` and `plus` already exist and are reused for Activities).

### Account card

`fieldset`/`fieldset-legend` + `input` pairs, same pattern as `OnboardingPage.tsx`: first name,
last name (editable), email (rendered as a disabled `input`, no legend note beyond the disabled
state itself). Single `btn btn-primary` save action, bottom-right of the card.

### Company card

Same `fieldset`/`input` pattern: name, city, address. Same save-button position/style as Account.
No founding-year field — no backing column, and not applicable to a generic employer.

### Activities card

Existing chips reuse `EmployeeCard`'s chip classes (`rounded-full bg-[var(--color-surface-2)]
px-2 py-0.5 text-[11px] text-[var(--color-ink-soft)]`), each with a small `ICONS.pencil` button.
Below the chip row, a short inline form: name input + `btn btn-primary` add action. No color
input, no delete affordance on existing chips.

### Security card

Short explanatory text + a single `btn btn-primary` password-reset action. No danger zone, no red
styling anywhere on this page.

No new design tokens beyond the four `ICONS` entries above — colors/spacing/radius all come from
the existing theme; see `docs/ui-guidelines.md`.

---

## Data Access

This page needs several endpoints that do not exist yet on `stafy-backend` — listed as gaps, not
final paths (naming is the backend's call at implementation time):

- `GET /profile` — existing (`get_profile`), already wrapped by `useProfile()`. Backs the Account
  section's prefill.
- `PATCH /users/me` — **new.** `first_name`/`last_name` only; email is immutable through this
  route.
- `GET /companies/me` — **new.** No endpoint currently reads `Company` outside the one-time
  onboarding write.
- `PATCH /companies/me` — **new.** Manager-only, scoped to `current_user.company_id`.
- A manager-facing read of the company's `Activity` list — **new.** The existing
  `GET /users/me/settings/hourly-rates` (`settings_router`) is `require_role("employee", "admin")`
  and returns per-user rates, not a bare company activity list — wrong shape and wrong role for
  this page.
- A manager-facing create — **new.** The existing `POST /users/me/settings/activities` always
  attaches an `hourly_rate_gross` for the calling user; this page needs to create an `Activity` row
  with no rate attached, as a manager. Must return 409 on a case-insensitive name collision within
  the company (`uq_activities_company_name_lower`) rather than silently reusing the existing row —
  see Special Aspects.
- A manager-facing rename — **new.** No endpoint edits `Activity.activity_name` today. Same 409
  collision rule as create applies when the new name matches another activity in the company.
- Password reset — **no backend call.** Client-side `sendPasswordResetEmail` via the existing
  Firebase `auth` singleton (`src/services/firebase.ts`).

The generated `getSettings()` client (`src/api/generated/endpoints/settings/settings.ts`) is **not
reused** by this page — see Special Aspects.

These six new endpoints will get their own `stafy-backend/docs/modules/settings.md` when built,
same split as `invitations.md`'s frontend/backend pair — not written yet since none of them exist.

---

## Special Aspects

**Password change has no backend leg at all.** Auth is Firebase ID-token only —
`stafy-backend/app/auth/CLAUDE.md` states plainly that no password-based auth is active. This page
never calls the backend for the Security action; it's a direct Firebase JS SDK call, same as
login/register already are.

**Activities here is the company-wide list, not the per-user hourly-rate settings the generated
client already exposes.** `settings_router`'s hourly-rate/activity endpoints
(`require_role("employee", "admin")`) exist for employees managing their own rate — a different
actor and a different role than this manager-only page. Reusing them would be reusing the wrong
resource, not a shortcut; new manager-facing endpoints are required instead of adapting these.

**Create and rename both reject duplicate names outright — no get-or-create.** This deliberately
diverges from `create_activity_with_rate_for_user`'s existing get-or-create-on-Activity behavior
(its 409 today comes from the duplicate `HourlyRate`, not the `Activity` row). A manager-created
activity has no rate to collide on, so without an explicit rule the same call would silently reuse
an existing row. This page treats that as an error instead, surfaced inline on the form/chip being
edited, not a toast — the manager is actively naming a thing, not submitting a background sync.

**Password reset only applies to `auth_provider: 'email_password'` accounts.** The DB enum also
allows `'google'`, but `stafy-web-app` has no Google sign-in anywhere (`RegisterPage` only calls
`createUserWithEmailAndPassword`) — so every manager account reaching this page is
`email_password`, and the `'google'` case is unreachable here. No conditional UI is needed unless
Google sign-in is added to this app later.

**No stored activity color.** `Activity` has no `color` column. Chip colors elsewhere in the app
(`ActivityDonut`, `EmployeeCard`) are computed by display rank at render time, not persisted — this
page manages `activity_name` only, consistent with that.

**Email is read-only this iteration**, not because the backend can't store a new value, but
because changing it would drift from Firebase's own auth identity (`updateEmail` + re-verification)
without a matching flow — deferred as a pair, not just a missing input.

**No delete-account section.** This is a product decision (what happens to the company/employees
when the, likely sole, manager for that company deletes their account) rather than a UI omission —
it needs to be thought through before any spec work, not merely implemented later.

---

## Deferred

| Item | Trigger |
|---|---|
| Delete account (a separated, destructive "danger zone") | A cascade-behavior decision for company/employees when the manager account is the only manager |
| Email address editing | A matching Firebase `updateEmail` + re-verification flow is designed |
| Phone number field | Added to the `User` model if the product actually needs it |
| Profile photo upload | A photo storage/CDN decision is made elsewhere in the app |
| Manual per-activity color picker | Chip coloring across the app moves off rank-based auto-assignment |
| "Unsaved changes" indicator on leaving a section | Real signal of users losing edits, not hypothetical |
