# Auth & Onboarding

Firebase-based sign-in for `stafy-web-app` (managers and employees — employees use the `/me`
personal shell only, see `docs/modules/personal-workspace.md`), plus the mandatory onboarding step
managers/admins complete once, right after their first login. Every account registered through this
app is a `manager`; employees register only via `stafy-mobile` and sign in here with that account,
with no onboarding step. Route protection, session state, and the
onboarding gate all live together here because they're one continuous gate chain in `AppLayout`.

## Scope

**In scope:** Firebase email/password registration (always `role: 'manager'`, no role choice) and
sign-in from `stafy-web-app`, session state via `onAuthStateChanged`, route
protection (layout gates), confining the `employee` role to `/me*` (with redirect back to `/me` for
company routes), and the mandatory manager/admin onboarding form (organization name/city/address +
job title) that gates every other page until completed.

**Out of scope (this release):** password reset / forgot-password, email-verification UX,
social/OAuth providers, an admin panel to manage the `job_titles` picklist (the table exists and is
seeded, but nothing edits it yet — see Deferred).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` | Registers/logs in, completes company onboarding once, then uses company + personal shells |
| Employee | `stafy-web-app` | Logs in only (registers via `stafy-mobile` — this app has no employee registration path), no onboarding step, straight to the `/me` personal shell |
| Backend | FastAPI (`stafy-backend`) | Verifies Firebase ID tokens, provisions/syncs `users` rows, stores onboarding data |
| Firebase Auth | Google-managed service | Owns credential storage, issues and verifies ID tokens |

This app confines the `employee` role to the personal shell rather than blocking it outright — the
inverse of `stafy-mobile`, which blocks `manager` entirely. `admin` is allowed through both
onboarding and the app; this wasn't separately litigated, just defaulted to "allow" since nothing
here has an admin-specific concern.

---

## Data Objects

### Referenced (not owned)

Same as `stafy-mobile/docs/modules/auth.md` — Firebase owns `uid`, `email`, `email_verified`, and
the password credential. The backend never sees a password, only a verified ID token.

### Owned

Existing `users`/`companies` table fields, plus a new `job_titles` table:

| Field | Table | Type | Notes |
|---|---|---|---|
| `job_title` | `users` | `str \| null` | Free text — NOT the `role` enum, manager-only. Client offers a picklist (from `job_titles`) + "Altceva" custom option; backend stores whatever string arrives. Always `null` for employees — no employee-facing field writes it |
| `onboarding_completed` | `users` | `bool`, default `false` | Gates `AppLayout`/`OnboardingLayout` for manager/admin. Set `true` unconditionally at register time for `role: 'employee'` (`UserRepository.create_firebase_user`) — employees have no onboarding step to gate on |
| `city`, `address` | `companies` | `str \| null` | Set once, at manager onboarding only |

**`job_titles`** — global reference list for the onboarding picklist, not a foreign key on
`users.job_title` (that stays free text so "Altceva" can save anything). `id`, `label` (unique),
`is_active`, `created_at`. Seeded directly in its migration
(`alembic/versions/0ba02102c0ce_add_job_titles_table.py`) with: Owner, Director, Administrator,
Coordonator, Manager HR, Manager Operațional. No write endpoint exists yet — see Deferred.

---

## Lifecycle

```
                createUserWithEmailAndPassword        POST /api/v1/auth/register (role: 'manager')
(no account) ─────────────────────────────────► (Firebase only) ───────────────────────────► provisioned,
                                                                                             onboarding_completed = false

(employee rows are provisioned by stafy-mobile's register, with onboarding_completed = true)

provisioned ──── signInWithEmailAndPassword ────► POST /api/v1/auth/login ────► synced

manager/admin, onboarding_completed=false ── PATCH /users/me/onboarding ──► onboarding_completed=true

synced, onboarded ──── logout() ────► (no account)
```

`onboarding_completed` never resets to `false` — there's no "re-onboard" flow. Once set (at
register for employees, via the manager form otherwise), the `OnboardingLayout` gate sends the caller to `/`
or `/me` instead of showing the form again.

---

## Derived / Aggregated Data

None owned here — `useProfile()` (existing, TanStack Query, `staleTime: 60s`) is both the profile
cache and the source `AppLayout`/`OnboardingLayout` read `role`/`onboarding_completed` from. No
separate auth-state cache exists (see Special Aspects for why that's a deliberate simplification
vs. `stafy-mobile`).

---

## User Flows

### Flow 1: Register
1. `/register` → `RegisterPage.tsx`, a single-step form: first name, last name, email, password, then submit. No role choice is presented.
2. `createUserWithEmailAndPassword(auth, email, password)` (`AuthProvider.tsx`).
3. `getAuth().registerUser({ first_name, last_name, role })` — `role` is always `'manager'`, hardcoded in `RegisterPage`.
4. On success, `AuthProvider` sets `firebaseUser`. The new manager has `onboarding_completed=false`, so `OnboardingLayout`'s gate sends them to `/onboarding` — no navigation logic in `RegisterPage` itself.
5. On backend failure after step 2 succeeded: Firebase account is left in place (no rollback, same as mobile) — distinct error message, no auto-retry.

### Flow 2: Login
1. `/login` → `LoginPage.tsx`: email, password.
2. `signInWithEmailAndPassword` → `getAuth().loginUser()`.
3. On 404 (orphaned Firebase account, no backend row): `login()` sets `firebaseUser` to the real
   Firebase session (the happy-path `setFirebaseUser` below never runs on this branch) and throws
   `OrphanRegistrationError`; `LoginPage` catches it and navigates to `/complete-registration`
   (Flow 6) instead of showing an error.
4. On success, gate redirects to `/` (if onboarded) or `/onboarding` (if not).

### Flow 3: Onboarding (mandatory, once)
1. Manager lands on `/onboarding` (redirected there by `AppLayout` or `OnboardingLayout`, or navigates to `/` and bounces back) → `OnboardingPage.tsx`.
2. Form: organization name, city, address, job title (`useJobTitles()` populates the picklist from `GET /api/v1/job-titles`; "Altceva" reveals a free-text input, pre-selected by default here since the seeded titles are company-leadership roles a manager is likely to hold).
3. Submit → `useCompleteOnboarding()` → `PATCH /api/v1/users/me/onboarding` → invalidates the `['profile']` query.
4. `useProfile()` refetches with `onboarding_completed: true` → `AppLayout`'s gate re-evaluates and renders the real app — no manual `navigate()` call anywhere in this flow, the gate reacting to the refetched profile is what moves the manager forward.

Employees have no onboarding flow — `onboarding_completed` is set `true` directly in
`UserRepository.create_firebase_user` for `role: 'employee'`, at register time (via `stafy-mobile` —
this app never registers employees, see Flow 1). There's nothing left to collect: name comes from register, and employees have no company/job-title data to
gather (`job_title` stays `null` for every employee row — see Special Aspects for why a job-title
step doesn't fit employees).

### Flow 4: Session hydration (cold start / page refresh)
1. `AuthProvider` subscribes to `onAuthStateChanged` once, sets `authResolved: true` on the first callback (with `firebaseUser` or `null`).
2. Every gate (`AppLayout`, `AuthLayout`, `OnboardingLayout`) renders a `FullscreenSpinner` until `authResolved` — this is the only thing preventing a flash of the wrong screen.

### Flow 5: Logout
1. `logout()` (from `useAuth()`) → `signOut(auth)` → `firebaseUser` becomes `null` → `AppLayout`'s gate redirects to `/login`.
2. Also triggered automatically if an `employee` role is detected (see Special Aspects).

### Flow 6: Orphan-registration recovery
1. Reached only via Flow 2 step 3 (`OrphanRegistrationError`) — `firebaseUser` is guaranteed set at
   this point.
2. `/complete-registration` → `CompleteRegistrationPage.tsx`: a single form with first name and
   last name only. No role choice is presented — `role` is always `'manager'`, hardcoded, same as
   `RegisterPage`.
3. `completeRegistration()` calls `getAuth().registerUser({ first_name, last_name, role })`
   directly against the already-signed-in session — no `signInWithEmailAndPassword` call, unlike
   Flow 1/2.
4. On success: `setFirebaseUser(auth.currentUser)`, then the page calls `navigate({ to: '/' })`
   explicitly — `CompleteRegistrationLayout`'s gate only checks "signed in", not "onboarded" (it
   can't; no profile exists until this call succeeds), so it can't declaratively catch this
   transition the way `AuthLayout` catches a successful login/register. `AppLayout`'s own gate takes
   over from `/` and redirects to `/onboarding` (same destination a fresh `register()` reaches).
5. On repeated backend failure: same generic distinct-error message as Flow 1 step 5, retryable from
   the same screen — no dead end.
6. A "Deconectează-te" action calls `logout()` with no manual navigate — `CompleteRegistrationLayout`'s
   own gate (`!firebaseUser` → `/login`) handles the redirect, same pattern as everywhere else `logout()`
   is called in this app (e.g. `Sidebar.tsx`).

---

## Information Architecture

```
_auth  (AuthLayout — signed-out only, redirects to / if already signed in)
├── /login
└── /register

_onboarding  (OnboardingLayout — signed-in only, redirects to / or /me once completed)
└── /onboarding    (manager/admin only — organization + job title; employees never land here,
                     onboarding_completed is already true for them, see Flow 3/Lifecycle)

_complete-registration  (CompleteRegistrationLayout — signed-in only, no profile/onboarding check)
└── /complete-registration   (see Flow 6)

_app  (AppLayout — signed-in + onboarded; employees confined to /me*)
├── /            (Dashboard, manager/admin only — employees redirect to /me)
├── /team, /team/$employeeId, /invitations, /reports, /settings (manager/admin only — employees redirect to /me)
└── /me, /me/attendance, /me/history, /me/rates (both roles — the personal shell, see personal-workspace.md)

Four sibling root-level layouts (`_auth`, `_onboarding`, `_complete-registration`, `_app`), each
gating independently rather than one shared guard — see Special Aspects for why.
`_complete-registration` can't reuse `_onboarding`'s gate: `OnboardingLayout` requires `useProfile()`
to succeed, but an orphaned account has no profile at all yet — that's the whole reason it's stuck.

---

## UI / Layout

`LoginPage`, `RegisterPage`, `OnboardingPage`, `CompleteRegistrationPage` share one visual pattern: a
`card` (DaisyUI, `w-full max-w-sm`/`max-w-md`, `shadow-xl`) centered on `bg-base-200`, logo
(`stafy_logo.svg`) + "Stafy" wordmark, DaisyUI `fieldset`/`fieldset-legend`/`input`/`select` form
controls (not `form-control`/`label-text`/`input-bordered` — those are DaisyUI v4 classes and don't
exist in the v5 installed here), errors in an `alert alert-error`. No new design tokens — same
`--color-*` variables as the rest of the app (`src/App.css`).

`OnboardingPage` and `RegisterPage` stagger their entrance with the shared `animate-fade-slide-in`
keyframe (`src/App.css`, same one `DashboardPage`/`EmployeeCard`/`EmployeeHeaderCard` use) — header
block, each fieldset/row, and the submit button each carry the class with an increasing inline
`animationDelay`, so the form cascades in top-to-bottom instead of popping in as one block
(`OnboardingPage`'s error alert also carries the class; `RegisterPage`'s does not). Conditional
fields (`OnboardingPage`'s "Altceva" custom-job-title fieldset) get the class
with no explicit delay, since they mount fresh on user interaction rather than on page load.
`CompleteRegistrationPage` has no stagger — a rare recovery-path form doesn't need the entrance
polish. `LoginPage` doesn't have it yet — nothing rules
it out, just not asked for.

`FullscreenSpinner` (`src/components/layout/FullscreenSpinner.tsx`) is the one shared loading
state across all three gates — `bg-[var(--color-page)]` + a DaisyUI `loading loading-spinner`.

**Mobile gutter.** `AuthLayout`, `OnboardingLayout`, and `CompleteRegistrationLayout` all carry `px-4`
on their centering `flex` container — without it, the `w-full max-w-sm`/`max-w-md` card touches the
viewport edge with zero gutter on any screen narrower than the card's max width (every phone).

---

## Data Access

- `POST /api/v1/auth/register` — `{first_name, last_name, role}`, Bearer Firebase ID token → `UserOut`. This app always sends `role: 'manager'`, hardcoded in both `RegisterPage` and `CompleteRegistrationPage` — see Flow 1/Flow 6. Also the endpoint Flow 6 (`completeRegistration()`) calls, reusing the token from the already-signed-in session instead of one just minted by `createUserWithEmailAndPassword` — same request shape either way, the backend can't tell the two calls apart.
- `POST /api/v1/auth/login` — Bearer token only → `UserOut`.
- `GET /api/v1/profile` — `UserOut` (now includes `job_title`, `onboarding_completed`).
- `PATCH /api/v1/users/me/onboarding` — `require_role("manager", "admin")`. Body: `OnboardingIn {organization_name, city, address, job_title}` (all required strings). → `UserOut`. Backed by `UserRepository.complete_onboarding()` — one atomic commit across `companies` + `users`, following the same exception as `create_firebase_user`/`create_activity_with_rate_for_user` (see `stafy-backend/CLAUDE.md`).
- `GET /api/v1/job-titles` — any authenticated user. → `JobTitlesListOut {data: [{id, label}]}`, active rows only, ordered by `id`.

All four routes' error responses carry `ErrorOut`/`ValidationErrorOut` per the standing convention.

---

## Special Aspects

**No manual storage cache, unlike `stafy-mobile`.** Mobile hand-rolls a `stafy_userData` cache in
SecureStore/localStorage because it has no query library on the profile fetch. Web already has
`useProfile()` backed by TanStack Query — that's the cache. `AuthContext`/`AuthProvider` only ever
track Firebase's own `firebaseUser`/`authResolved`, nothing persisted by this module directly.

**`isAuthenticating` ref guard — carried over from mobile, still necessary.**
`onAuthStateChanged` fires the instant `signInWithEmailAndPassword`/`createUserWithEmailAndPassword`
resolve internally, before `login()`/`register()` in `AuthProvider.tsx` finish talking to the
backend. Without the guard, the listener's hydration path would race ahead of the backend call.
`login()`/`register()` set `firebaseUser` themselves on success; the listener only handles
cold-start hydration and out-of-band sign-outs while the ref is `false`.

**Layout gates, not `beforeLoad` + router context.** Considered and rejected: TanStack Router's
`beforeLoad` needs auth resolved before the first route load (a promise cached on the first
`onAuthStateChanged` fire) plus `router.invalidate()` calls after every login/register/onboarding
submit. Three per-layout gates (`AppLayout`, `AuthLayout`, `OnboardingLayout`), each reading
`useAuth()` + `useProfile()` directly and rendering `<Navigate>`/`<FullscreenSpinner>`/`<Outlet>`,
do the same job with less machinery — and the onboarding gate slotted in as a fourth branch in
`AppLayout` with no new pattern needed.

**`employee` confined to the personal shell, not blocked — inverse of `stafy-mobile` in shape but
not in mechanism.** Mobile blocks `manager` outright (dedicated blocked screen); `AppLayout` instead
keeps employees signed in and redirects company routes to `/me` with the same sessionStorage flash
message `LoginPage` already
consumed (the helper is message-agnostic). The `/me*` routes themselves need no gate — they were
already role-agnostic reads, and the role variations (rates read-only, bonus editor hidden) live at
the call sites, not the router. Do not confuse this with mobile's manager-block memory; they're
opposite gates on opposite apps.

**Employees have no onboarding step — `onboarding_completed` is set `true` at register time.**
`UserRepository.create_firebase_user` sets `onboarding_completed=(role == "employee")` directly on
the new row. There's nothing an employee-specific onboarding form could usefully collect: name comes
from `UserRegisterIn` at register (every role), and employees have no company row to configure and
no job-title field to fill — the seeded `job_titles` picklist is company-leadership roles (Owner,
Director, ...), not general job functions, so it has no sensible default for a general employee.
`users.job_title` stays `null` for every employee row.

**`job_title` is free text, not a DB enum, despite looking like a fixed list, manager-only.** The
picklist (`job_titles` table) is a suggestion source for the manager onboarding UI, not a constraint
— `users.job_title` has no foreign key to it. This was a deliberate choice: the "Altceva" (other)
option must be able to save an arbitrary string, which a Postgres `ENUM` column would reject.

**Onboarding fields chosen were deliberately minimal.** Only organization name, city, address, and
job title — not industry, company size, phone, or website. Nothing here blocks adding more later;
the endpoint and form both take a flat, easily-extended shape.

**Orphan registration.** If `createUserWithEmailAndPassword` succeeds but the backend call fails
(Flow 1 step 5), the Firebase account is deliberately left in place — no rollback, deletion can
itself fail offline and a half-rolled-back state is worse than a recoverable one. The user can't
re-register (`auth/email-already-in-use`) and a normal login 404s. Self-service recovery is Flow 6
(`/complete-registration`), reached automatically when `login()` throws `OrphanRegistrationError`.
`OrphanRegistrationError` lives in `src/utils/authError.ts`, not `AuthProvider.tsx` — co-locating it
there would make that file export a non-component alongside `AuthProvider`, tripping
`react-refresh/only-export-components`. Same underlying gap and fix shape as
`stafy-mobile/docs/modules/auth.md`'s Special Aspects, adapted to this app's gate-per-layout routing
instead of `router.replace()` calls.

---

## Deferred

| Item | Trigger |
|---|---|
| Admin CRUD for `job_titles` | An admin panel exists to host it |
| Password reset / forgot-password | User-facing request for self-service recovery |
| More onboarding fields (industry, size, phone, website) | Explicit product ask |
