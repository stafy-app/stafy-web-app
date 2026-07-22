# Stafy Web App

Manager-only web dashboard for Stafy — the counterpart to `stafy-mobile`, which blocks the `manager` role entirely. React 19 + Vite + TypeScript; Tailwind v4 + DaisyUI v5; TanStack Router + TanStack Query; Firebase Auth. Consumes `stafy-backend` under `/api/v1`.

## Code Navigation — Serena MCP (MANDATORY)

Call `mcp__serena__initial_instructions` at session start before any coding task.

**NEVER** use `Read`, `Grep`, or directory listing to "explore" structure. Use Serena:
- `find_symbol` / `find_declaration` → jump to definitions
- `find_referencing_symbols` → find callers/usages
- `get_symbols_overview` → module structure
- `search_for_pattern` → pattern search across codebase

Read a file only when you must view the full implementation of a specific, already-located symbol.

## Output Rules (Zero Fluff)

- No preamble, pleasantries, or closing remarks.
- Output only the requested change or direct answer.
- Never rewrite an entire file for a partial change — use Serena editing tools for precise targeted edits.

## Continuous Memory & Index Updates (Mandatory)

- After every code change or resolved task, silently update the relevant Serena memory and/or auto-memory to reflect new architecture, new symbols, or changed invariants.
- Do not wait to be asked. Never skip this step.

## Engineering Posture

You are a senior engineer on this stack, not a stenographer. When a request conflicts with the conventions below, say so plainly, name the trade-off, and propose the smaller correct change before doing the work.

**Deliberate decisions already made — don't silently reverse them:**

- **DaisyUI v5 is CSS-first.** The custom `"stafy"` theme lives entirely in `src/App.css` via `@plugin "daisyui/theme" { ... }`, not a `tailwind.config.js`. Don't add a JS Tailwind/DaisyUI config file.
- **TanStack Router is code-based**, not file-based. Routes are assembled by hand in `src/routes/index.tsx` against components in `src/pages/`. Don't introduce the file-based routing convention/plugin without discussing — it would conflict with the existing `pages/` layout.
- **Same Firebase project as `stafy-mobile`** (`stafy-app`) — managers and employees share one Auth pool; the backend verifies both via the same Firebase Admin SDK. Never point this app at a different Firebase project.
- **Firebase config comes from Vite env vars** (`VITE_FIREBASE_*` in `.env.local`, gitignored; placeholders in `.env.example`, committed) — unlike `stafy-mobile`, which hardcodes them. Keep values in sync with `stafy-mobile/src/services/firebase.ts` if the Firebase project config ever changes.
- **Terminology: "employee" (angajat), never domain-specific nouns like "teacher".** This app manages any employer/employee relationship, not a school-specific one, despite the original brainstorming doc (`../MANAGER-WEBAPP-IDEAS.md`) using school vocabulary. Backend's `user_role_enum` is `employee`/`manager`/`admin` — mirror that.

## Model Selection

Default: `claude-sonnet-4-6`. Delegate to `claude-haiku-4-5` only for:
- Mechanical symbol renames with no judgment required
- Writing new page/component stubs that mirror an existing pattern exactly
- Generating typed TypeScript interface boilerplate for a new stub module

Do NOT delegate: auth flow changes, the DaisyUI theme file, TanStack Router route tree changes, anything that talks to `stafy-backend`.

## Before Finishing Work

```bash
pnpm run build   # tsc -b && vite build — must pass, no type errors
pnpm run lint    # eslint . — must pass clean
pnpm run dev     # confirm dev server starts clean
```

No test suite is configured yet.

## Module Status

| Module | Status | Description |
|---|---|---|
| `src/App.css` | Live | Custom DaisyUI `"stafy"` theme — brand orange primary, slate neutrals, semantic colors, extra design tokens (`--color-ink`, `--color-surface-2`, etc.) passed through the theme block |
| `src/lib/queryClient.ts` | Live | TanStack Query client — `staleTime: 60s`, `retry: 1`, no refetch on window focus |
| `src/services/firebase.ts` | Live | Firebase app + `auth` singleton, config via `VITE_FIREBASE_*` env vars |
| `src/services/api.ts` | Live | Axios instance (`AXIOS_INSTANCE`) with Firebase ID-token request interceptor, plus the Orval custom-instance mutator (`api`) every generated endpoint function calls |
| `orval.config.ts`, `src/api/generated/` | Live, generated | Typed client generated from the backend's OpenAPI schema via `pnpm run gen` (or `just gen-api` from the workspace root, which also refreshes `openapi.json`). Endpoint functions are split by tag under `src/api/generated/endpoints/{tag}/`; **all** models live in one file, `src/api/generated/endpoints/index.schemas.ts` (the `.schemas.ts` suffix is auto-derived by Orval from `output.target`'s filename in `orval.config.ts` — without an explicit filename there, it falls back to the backend's OpenAPI `info.title`, which produced an unwieldy `stafyTimeTrackingAPI.schemas.ts`; omitting `output.schemas` is what collapses all models into one file instead of one-file-per-model). Don't hand-edit anything under `src/api/generated/` — regenerate instead |
| `src/routes/index.tsx` | Live | Code-based TanStack Router route tree — `_app` (dashboard/team/invitations/reports/settings), `_auth` (login/register), `_onboarding` (onboarding) |
| `src/layouts/AppLayout.tsx`, `AuthLayout.tsx`, `OnboardingLayout.tsx` | Live | Layout shells + route gates — see `docs/modules/auth.md`. `AppLayout` = Sidebar + Topbar (wrapped in `TopBarProvider`), gated on signed-in + onboarded + non-employee; `AuthLayout` = centered, gated on signed-out; `OnboardingLayout` = centered, gated on signed-in + not-yet-onboarded |
| `src/context/TopBarContext.ts`, `TopBarProvider.tsx` | Live | Shared shell state — title/subtitle/breadcrumb/action-slot. Every page under `AppLayout` calls `useTopBar()` (see `src/hooks/useTopBar.ts`) instead of rendering its own `<h1>` |
| `src/context/AuthContext.ts`, `AuthProvider.tsx` | Live | Firebase session state (`firebaseUser`, `authResolved`) + `login`/`register`/`logout`. No manual storage cache — `useProfile()` (TanStack Query) is the profile cache. See `docs/modules/auth.md` |
| `src/pages/auth/LoginPage.tsx`, `RegisterPage.tsx` | Live | Real forms wired to `useAuth()`. Register hardcodes `role: 'manager'`, no selector |
| `src/pages/onboarding/OnboardingPage.tsx` | Live | Mandatory once-per-manager form — organization name/city/address + job title (picklist from `GET /api/v1/job-titles` + "Altceva" custom text) |
| `src/pages/dashboard/DashboardPage.tsx` | Live | Company-wide monthly overview — period bar, KPI strip, activity donut, top-5 table. See `docs/modules/dashboard.md` |
| `src/pages/team/TeamPage.tsx` | Live | Searchable grid of `EmployeeCard`s for the full company roster (via `useTeamMembers`) — client-side filter on name/email, no debounce, no pagination. Header: search box + CSV export + invite action (navigates to the still-scaffolded `/invitations`). See `docs/modules/team.md` |
| `src/pages/team/EmployeeProfilePage.tsx` | Live | `/team/$employeeId` — header card + 3-tab body (Attendance/Rates/History) for one employee. See `docs/modules/employee-profile.md` |
| `src/pages/invitations/InvitationsPage.tsx` | Live | Send-invitation form + pending/accepted/expired summary tiles + table of every non-cancelled invitation with resend/cancel actions. See `docs/modules/invitations.md` |
| `src/pages/reports/**`, `settings/**` | Scaffolded, no logic | Wired to `useTopBar()` for title/subtitle; no data fetching, no forms yet |
| `src/hooks/` | Live | `useProfile`, `useTeam` (bare roster, backs Dashboard's `teamCount`), `useTeamMembers` (rich per-employee monthly stats, backs the Team page), `useCompanyDashboard`, `useTopBar`, `useAuth`, `useCompleteOnboarding`, `useJobTitles`, `useEmployeeSummary`/`useEmployeeTimeEntries`/`useEmployeeRates`/`useEmployeeMonthlyHistory`/`useEmployeeActions` (Employee Profile page), `useInvitations` (`useInvitations`/`useSendInvitation`/`useResendInvitation`/`useCancelInvitation`, Invitations page) — one file per resource |
| `src/components/dashboard/` | Live | `PeriodBar`, `KpiCard`, `ActivityDonut`, `TopEmployeesTable` — Dashboard-only, not shared shell components (`PeriodBar` and `KpiCard` are also reused by the Employee Profile page) |
| `src/components/team/EmployeeCard.tsx` | Live | Team-page-only card (avatar, status pill, hours/delta/pay stats, activity chips) — no generic `Card`/`Badge` primitive exists in this codebase; deliberately scoped, not extracted |
| `src/components/invitations/` | Live | `InvitationForm` (always-visible send form), `InvitationStatusBadge` (status → DaisyUI badge color), `InvitationsTable` (first DaisyUI `table` in this codebase — flat tabular data, not a card grid). See `docs/modules/invitations.md` |
| `src/components/employee/` | Live | `EmployeeHeaderCard`, `EmployeeActionsMenu` (first DaisyUI dropdown in this codebase), `EmployeeTabs` (first tab component, hand-built sliding indicator), `tabs/AttendanceTab`, `tabs/RatesTab`, `tabs/HistoryTab` (first Recharts usage — see below). See `docs/modules/employee-profile.md` |
| `src/components/shared/Delta.tsx` | Live | Hours-delta presentational component (moved out of `dashboard/` once the Team page became a second consumer) — used by `TopEmployeesTable`, `EmployeeCard`, `EmployeeHeaderCard` |
| `src/components/layout/FullscreenSpinner.tsx` | Live | Shared loading state for all three layout gates |
| `src/utils/initials.ts` | Live | `getInitials(firstName, lastName)` — shared between `Sidebar`, `TopEmployeesTable`, `EmployeeCard`, `EmployeeHeaderCard` |
| `src/utils/period.ts` | Live | `getCurrentPeriod()` — shared between `DashboardPage`, `TeamPage`, and the Employee Profile page's header/Attendance tab |
| `src/utils/exportTeamCsv.ts` | Live | Client-side CSV export (Blob + temp `<a>`, no library) for the Team page — UTF-8 BOM + per-field quoting |
| `src/utils/exportEmployeeTimeEntriesCsv.ts` | Live | Same pattern as `exportTeamCsv.ts`, for one employee's current-month time entries (Employee Profile page's "⋯" menu) |
| `src/utils/authBlockedMessage.ts` | Live | sessionStorage flash-message helper — `AppLayout` sets it when blocking an `employee` login, `LoginPage` reads + clears it once |
| `src/lib/toast.ts`, `src/components/toast/` | Live | `showToast(message, options)` imperative toast API — module-level store (no React import), `<ToastHost />` mounted once in `src/App.tsx`. See `docs/modules/toast.md` |
| `src/lib/icons.ts` | Live | Project-wide `ICONS` registry wrapping `lucide-react` — `check/info/warning/danger/close/loading` (toast), `search/download/plus/chevronRight` (Team page), `moreVertical/pencil/userX/userCheck` (Employee Profile actions menu), `mail/refresh/trash/clock` (Invitations page); existing direct `lucide-react` imports elsewhere are not yet migrated (see `docs/modules/toast.md` Deferred) |
| `recharts` (package) | Live | First charting library dependency in this repo, used only by `HistoryTab`. Every other chart (`ActivityDonut`) stays hand-rolled SVG; see `docs/modules/employee-profile.md` Special Aspects |
| `src/pages/tests/TestsPage.tsx` | Live, dev-only | `/tests` — bare shadow route to manually trigger sample toasts, registered only when `import.meta.env.DEV` (see `src/routes/index.tsx`) |
| `src/types/` | Not created yet | Add when a cross-component type doesn't belong in `api/generated` |

## CLI Quick Reference

```bash
pnpm dev                # start Vite dev server
pnpm build               # tsc -b && vite build
pnpm lint                # eslint .
pnpm preview             # preview production build
pnpm run gen             # regenerate src/api/generated/ from ./openapi.json (run `just gen-api` from workspace root to also refresh openapi.json)
pnpm add <pkg>           # install dependency
pnpm add -D <pkg>        # install dev dependency
```

## Cross-Cutting Conventions

- **Styling**: Tailwind v4 utility classes + DaisyUI v5 component classes (`btn`, `card`, `menu`, `badge`, etc.), themed by the single `"stafy"` DaisyUI theme in `src/App.css`. Don't use raw hex colors in `className` or inline styles — use DaisyUI semantic classes (`btn-primary`, `bg-base-200`, ...) or the custom `var(--color-*)` tokens defined in the theme block.
- **Routing**: TanStack Router, code-based. New pages: add the component under `src/pages/{feature}/`, then wire a `createRoute(...)` in `src/routes/index.tsx` under the correct parent (`appLayoutRoute` for authenticated pages, `authLayoutRoute` for login/register).
- **Data fetching**: TanStack Query. New hooks go in `src/hooks/`, one file per backend resource (e.g. `useTeam.ts`, `useReports.ts`), calling the generated functions in `src/api/generated/endpoints/{tag}/` (client: axios, not react-query hooks yet — each call still needs to be wrapped in `useQuery`/`useMutation` by hand). Those generated functions already route through `src/services/api.ts`'s `api` mutator, which attaches the Firebase ID token — don't call `AXIOS_INSTANCE` or a new axios instance directly from a hook.
- **API client generation**: backend is the source of truth. `just gen-api` (workspace root) dumps the FastAPI OpenAPI schema to `openapi.json` and runs Orval (`orval.config.ts`) to regenerate `src/api/generated/`. `openapi.json` is gitignored (transient snapshot); the generated client under `src/api/generated/` is committed. Error responses (401/403/404/409/422) are typed as `ErrorOut` / `ValidationErrorOut` in the generated models — see `../stafy-backend/app/core/errors.py`.
- **Auth**: Firebase ID token, fetched live via `auth.currentUser.getIdToken()` — never cached as a string, same pattern as `stafy-mobile`.
- **Route prefix**: every backend endpoint is under `/api/v1`, including `/api/v1/auth/*` — see `../CLAUDE.md`'s Integration Contract and `../stafy-backend/CLAUDE.md`.
- **UI guidelines**: [`docs/ui-guidelines.md`](docs/ui-guidelines.md) — filled in incrementally as design decisions are made, not authored upfront. Check it before inventing new visual patterns.
- **Full feature scope**: [`../MANAGER-WEBAPP-IDEAS.md`](../MANAGER-WEBAPP-IDEAS.md) — original brainstorming doc, being implemented feature by feature.

## Traps

❌ **`src/api/generated/**` is regenerated by `pnpm run gen`.** Any manual edit there is silently overwritten on the next run. Need custom behavior on top of a generated function? Wrap it in a hook under `src/hooks/`, don't edit the generated file.

❌ **`VITE_API_URL` has no `.env` fallback baked into Vite** — only the default in `src/services/api.ts` (`?? 'http://127.0.0.1:8000'`). If a new `.env.local` is created from `.env.example` without the `VITE_API_URL` line, the app still works (falls back to localhost), but production builds need it set explicitly via the deploy platform's env vars once this app is deployed.

## Where to Look

| Task | Start here |
|---|---|
| Route tree / navigation | `src/routes/index.tsx` |
| Authenticated page layout (sidebar/topbar) + route gate | `src/layouts/AppLayout.tsx` |
| Auth screen shell + route gate | `src/layouts/AuthLayout.tsx` |
| Onboarding screen shell + route gate | `src/layouts/OnboardingLayout.tsx` |
| Login/register/session flow, onboarding flow | `src/context/AuthProvider.tsx`; module doc: [`docs/modules/auth.md`](docs/modules/auth.md) |
| Feature pages | `src/pages/{feature}/` |
| Theme / design tokens | `src/App.css` (DaisyUI `"stafy"` theme) |
| UI guidelines | `docs/ui-guidelines.md` |
| Firebase init | `src/services/firebase.ts` |
| Query client config | `src/lib/queryClient.ts` |
| Axios instance, Orval mutator, token attach | `src/services/api.ts` |
| Generated API client (types, endpoint functions) | `src/api/generated/` — regenerate via `pnpm run gen` / `just gen-api` |
| Orval codegen config | `orval.config.ts` |
| Backend contract (routes, shapes, auth) | [`../stafy-backend/CLAUDE.md`](../stafy-backend/CLAUDE.md) |
| Full feature scope / brainstorming | [`../MANAGER-WEBAPP-IDEAS.md`](../MANAGER-WEBAPP-IDEAS.md) |
| Dashboard design spec | [`docs/modules/dashboard.md`](docs/modules/dashboard.md) |
| Team page design spec | [`docs/modules/team.md`](docs/modules/team.md) |
| Toast notifications, icon registry, `/tests` dev route | [`docs/modules/toast.md`](docs/modules/toast.md) |
