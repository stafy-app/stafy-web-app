# Settings

Manager-only settings page: personal account details, the manager's company profile, the
company's shared activity list, and account security (password reset, account deletion).

## Scope

**In scope:** viewing/editing the caller's own account name (email and job title render read-only);
viewing/editing the caller's own company (name, city, address); listing, creating, and renaming
company-wide activities; triggering a Firebase password-reset email; a Danger Zone entry point for
account deletion.

**Out of scope (this release):** email address editing; phone number field; profile photo upload;
manual per-activity color picker; account deletion itself (the Danger Zone button exists, the
action shows a "not available yet" notice — no backend endpoint, no cascade-delete design); an
"unsaved changes" leave-section warning; activity deletion (matches the backend invariant that a
company's activity row is never deleted, only per-employee rate assignments are).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager / admin | Settings page (`/settings`) | Views and edits their own account, their own company (if they own it), and the company's activity list; can trigger a password-reset email |

---

## Data Objects

### Referenced (not owned)

- `User` (account fields: first/last name (editable), email and job title (read-only display),
  auth provider) — owned by the `stafy-backend` users domain.
- `Company` (name, city, address) — owned by the `stafy-backend` users domain.
- `Activity` (id, name) — owned by the `stafy-backend` activities domain; also referenced by the
  Employee Profile page's Rates tab and the Dashboard's activity breakdown.

### Owned

None — this page reads and writes existing entities through backend endpoints; it introduces no
new persisted data.

---

## Lifecycle

N/A — this page edits already-final entities (account, company, activities) with no state machine
of its own.

---

## Derived / Aggregated Data

Each activity chip's color is computed client-side from the activity's id (`getActivityColor`,
`src/utils/activityColor.ts`) against a fixed 4-slot categorical palette, not stored or fetched —
the same palette the Dashboard's activity donut uses, but keyed by id instead of by display rank so
a given activity's color stays stable across the app rather than shifting with its rank each month.

---

## User Flows

1. **Edit account** — manager opens Settings (defaults to the Account section), edits first/last
   name, saves; a toast confirms; the sidebar's displayed name updates on the next profile read.
   Email and job title render as disabled inputs for context, not sent in the update.
2. **Edit company** — manager switches to the Company section, edits name/city/address, saves. If
   the manager joined their company via an accepted invitation rather than owning it, the section
   renders read-only with an explanatory line and no save button.
3. **Manage activities** — manager switches to the Activities section, sees existing activities as
   chips; clicking a chip's edit affordance turns it into an inline rename field; a short form
   below adds a new activity by name. Duplicate names (case-insensitive, scoped to the company)
   are rejected with a toast, both on create and on rename.
4. **Reset password** — manager switches to the Security section and triggers the reset action;
   `sendPasswordResetEmail(auth, profile.email)` (Firebase JS SDK) fires directly, no backend call;
   a toast confirms the email was sent, or surfaces the Firebase error. Hidden (with an explanatory
   line) if the account's auth provider isn't email/password.
5. **Delete account (Danger Zone)** — manager clicks the outlined red button in the visually
   distinct Danger Zone block; a toast states the action isn't available yet. No network call, no
   state change.

---

## Information Architecture

Sidebar nav item "Settings" → `/settings` route → `SettingsPage`, which renders a fixed vertical
left nav (`SettingsNav`, four items: Account/Company/Activities/Security) and the active section's
component inside a single card. Section switching is local component state
(`useState<SettingsSectionKey>`), not nested router routes — no section has its own URL, same
non-routed approach the Employee Profile page's tabs already use. No modals.

---

## UI / Layout

- Two-column layout inside `AppLayout`'s content area: a fixed-width (`w-[220px]`) vertical nav on
  the left, a single card (`bg-[var(--color-surface)]`, `rounded-[var(--radius-lg)]`,
  `shadow-[var(--shadow-sm)]`) on the right holding the active section.
- Nav items: icon + label, active state `bg-[var(--color-primary-soft)]` /
  `text-[var(--color-primary-active)]` / `font-semibold`, inactive
  `text-[var(--color-ink-soft)]` with `hover:bg-[var(--color-surface-2)]` — same token pattern as
  `Sidebar.tsx`, without its sliding-pill animation (this nav switches on local state, not route
  navigation). `ICONS` entries: `user`, `building`, `tags`, `shield`.
- Forms: `fieldset`/`legend`/`input` DaisyUI pattern (uppercase small legend, bordered input),
  matching `OnboardingPage.tsx`. One primary (`btn btn-primary`) save action per section,
  right-aligned.
- Activity chips: `rounded-full bg-[var(--color-surface-2)]` pill with a small color dot
  (`getActivityColor`) + name + inline pencil-icon edit affordance — no delete affordance anywhere
  in this section.
- Security section: a single explanatory line + one `btn btn-primary` reset-email action — no
  password fields anywhere on this page (see Special Aspects).
- Danger Zone: the only red surface on the page —
  `border-[var(--color-error)] bg-[var(--color-error-soft)]/40`, outlined red button
  (`btn btn-outline btn-error`), visually separated from the reset-password block above it.
- Save confirmations are toasts (`showToast`), never inline page text.

---

## Data Access

| Endpoint | Method | Notes |
|---|---|---|
| `/api/v1/users/me/settings/account` | PATCH | Manager/admin only. Body: first name, last name only — `job_title` isn't accepted (read-only, set at onboarding). Returns the updated user. |
| `/api/v1/users/me/settings/company` | GET | Manager/admin only. Returns the caller's company (name, city, address). |
| `/api/v1/users/me/settings/company` | PATCH | Manager/admin only. 403 if the caller joined this company via invitation rather than owning it. |
| `/api/v1/activities` | GET | Manager/admin only. Lists the company's activities. |
| `/api/v1/activities` | POST | Manager/admin only. Creates an activity; 409 on a case-insensitive duplicate name within the company. |
| `/api/v1/activities/{id}` | PATCH | Manager/admin only. Renames an activity; 404 if outside the caller's company, 409 on duplicate name. |
| `/api/v1/profile` | GET | Existing endpoint (not owned by this page) — hydrates the Account section and supplies `is_own_company`/`auth_provider` for the Company/Security sections' gating. |

Password reset and account deletion have no backend endpoint — password reset is a direct Firebase
Auth client SDK call (`sendPasswordResetEmail`); account deletion has none yet (see Special
Aspects). See [`stafy-backend/docs/modules/settings.md`](../../../stafy-backend/docs/modules/settings.md)
for the backend side of the account/company/activities endpoints.

---

## Special Aspects

**Password reset never touches the backend, and never asks for a current password.** Auth is
Firebase ID-token only — `stafy-backend/stafy/auth/CLAUDE.md` states plainly that no password-based
auth is active there. This page's Security section is a single `sendPasswordResetEmail` trigger,
not an in-page current/new/confirm form — that would require reauthenticating the Firebase session
client-side for no real benefit over the standard reset-email flow, which every other auth surface
in this app (login/register error mapping) already has plumbing for via `mapAuthError`
(`src/utils/authError.ts`).

**Password reset only applies to `auth_provider: 'email_password'` accounts.** The DB enum also
allows `'google'`, but `stafy-web-app` has no Google sign-in anywhere (`RegisterPage` only calls
`createUserWithEmailAndPassword`) — so every manager account reaching this page today is
`email_password`; the conditional UI exists for when Google sign-in is added, not because it's
reachable now.

**Account deletion is UI-only.** The Danger Zone button shows a "not available yet" toast instead
of calling an endpoint. A manager's account deletion has an unresolved data-model question (what
happens to the company, its employees, their time entries, and payroll history) that wasn't worth
deciding under this page's scope — the UI exists so the entry point and visual warning pattern are
in place ahead of that decision.

**Job title is read-only, same treatment as email.** It's set once at onboarding
(`OnboardingPage.tsx`) with no edit path afterward — the Account section displays it as a disabled
input alongside email rather than omitting it, so the manager still sees what's on file. Unlike
email (deferred pending an `updateEmail` + re-verification flow), there's no plan to make it
editable here at all; it's authoritative context, not a deferred feature.

**Activity colors are assigned, not chosen.** Colors come from a fixed, id-keyed categorical
palette shared with the Dashboard's activity donut, not a stored `color` column or a manual picker
— no schema change was needed and colors stay visually consistent across both surfaces.

**Company section can render fully read-only.** A manager whose `company_id` no longer equals
their `personal_company_id` (they joined another manager's company via an accepted invitation) sees
the Company form with every field disabled and no save button — matches the backend's 403 guard on
the PATCH endpoint, checked client-side first so no request is ever sent that would fail.

**Activities here is the company-wide list, not the per-user hourly-rate settings the generated
client already exposed before this page existed.** `settings_router`'s pre-existing hourly-rate/
activity endpoints (`require_role("employee", "admin")`) exist for employees managing their own
rate — a different actor and role than this manager-only page; this page's Activities section calls
the newer `/api/v1/activities` endpoints instead.

---

## Deferred

| Item | Trigger |
|---|---|
| Account deletion endpoint + cascade design | Once the company/employee/time-entry/payroll deletion semantics for a manager account are decided |
| Confirmation modal before account deletion | Same trigger as above — no modal component exists in this codebase yet; building one only makes sense once the action is real |
| Email address editing | A matching Firebase `updateEmail` + re-verification flow is designed |
| Phone number field | Added to the `User` model if the product actually needs it |
| Profile photo upload | A photo storage/CDN decision is made elsewhere in the app |
| Manual activity color picker | Only if product feedback specifically asks for user-chosen colors over the auto-assigned palette |
| "Unsaved changes" indicator on leaving a section | Real signal of users losing edits, not hypothetical |
