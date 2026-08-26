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
```

Don't start `pnpm run dev` to verify a change, not even a brief non-interactive "does it start cleanly" check — the user runs the dev server themselves and tests in their own browser. Rely on `build`/`lint` passing instead.

No test suite is configured yet, and no tests are being written right now regardless — see root `CLAUDE.md`'s Current Constraints.

## Module Status

| Module | Status | Description |
|---|---|---|
| `src/App.css` | Live | Custom DaisyUI `"stafy"` theme — brand orange primary, slate neutrals, semantic colors, extra design tokens (`--color-ink`, `--color-surface-2`, etc.) passed through the theme block |
| `src/lib/queryClient.ts` | Live | TanStack Query client — `staleTime: 60s`, `retry: 1`, no refetch on window focus |
| `src/services/firebase.ts` | Live | Firebase app + `auth` singleton, config via `VITE_FIREBASE_*` env vars |
| `src/services/api.ts` | Live | Axios instance (`AXIOS_INSTANCE`) with Firebase ID-token request interceptor, plus the Orval custom-instance mutator (`api`) every generated endpoint function calls |
| `orval.config.ts`, `src/api/generated/` | Live, generated | Typed client generated from the backend's OpenAPI schema via `pnpm run gen` (or `just gen-api` from the workspace root, which also refreshes `openapi.json`). Endpoint functions are split by tag under `src/api/generated/endpoints/{tag}/`; **all** models live in one file, `src/api/generated/endpoints/index.schemas.ts` (the `.schemas.ts` suffix is auto-derived by Orval from `output.target`'s filename in `orval.config.ts` — without an explicit filename there, it falls back to the backend's OpenAPI `info.title`, which produced an unwieldy `stafyTimeTrackingAPI.schemas.ts`; omitting `output.schemas` is what collapses all models into one file instead of one-file-per-model). Don't hand-edit anything under `src/api/generated/` — regenerate instead |
| `src/routes/index.tsx` | Live | Code-based TanStack Router route tree — `_app` (dashboard/team/invitations/reports/settings), `_auth` (login/register), `_onboarding` (onboarding) |
| `src/layouts/AppLayout.tsx`, `AuthLayout.tsx`, `OnboardingLayout.tsx`, `CompleteRegistrationLayout.tsx` | Live | Layout shells + route gates — see `docs/modules/auth.md`. `AppLayout` = Sidebar + Topbar (wrapped in `TopBarProvider`), gated on signed-in + onboarded + non-employee; `AuthLayout` = centered, gated on signed-out; `OnboardingLayout` = centered, gated on signed-in + not-yet-onboarded; `CompleteRegistrationLayout` = centered, gated on signed-in only (no `useProfile()` check — orphan-registration recovery, see Flow 6) |
| `src/context/TopBarContext.ts`, `TopBarProvider.tsx` | Live | Shared shell state — title/subtitle/breadcrumb/action-slot. Every page under `AppLayout` calls `useTopBar()` (see `src/hooks/useTopBar.ts`) instead of rendering its own `<h1>` |
| `src/context/AuthContext.ts`, `AuthProvider.tsx` | Live | Firebase session state (`firebaseUser`, `authResolved`) + `login`/`register`/`completeRegistration`/`logout`. No manual storage cache — `useProfile()` (TanStack Query) is the profile cache. See `docs/modules/auth.md` |
| `src/pages/auth/LoginPage.tsx`, `RegisterPage.tsx`, `CompleteRegistrationPage.tsx` | Live | Real forms wired to `useAuth()`. Register hardcodes `role: 'manager'`, no selector — same for `CompleteRegistrationPage` (first/last name only). See `docs/modules/auth.md` Flow 6 |
| `src/pages/onboarding/OnboardingPage.tsx` | Live | Mandatory once-per-manager form — organization name/city/address + job title (picklist from `GET /api/v1/job-titles` + "Altceva" custom text) |
| `src/pages/dashboard/DashboardPage.tsx` | Live | Company-wide monthly overview — period bar, KPI strip, activity donut, top-5 table. See `docs/modules/dashboard.md` |
| `src/pages/team/TeamPage.tsx` | Live | Searchable grid of `EmployeeCard`s for the full company roster (via `useTeamMembers`) — client-side filter on name/email, no debounce, no pagination. Header: search box + CSV export + invite action (navigates to `/invitations`). See `docs/modules/team.md` |
| `src/pages/team/EmployeeProfilePage.tsx` | Live | `/team/$employeeId` — header card + 3-tab body (Attendance/Rates/History) for one employee. See `docs/modules/employee-profile.md` |
| `src/pages/invitations/InvitationsPage.tsx` | Live | Send-invitation form + pending/accepted/expired summary tiles + table of every non-cancelled invitation with resend/cancel actions. See `docs/modules/invitations.md` |
| `src/pages/reports/ReportsPage.tsx` | Live | Two-column editor+live-preview payroll report generator (period/employee/options/bonus panel + `@react-pdf/renderer` `<PDFViewer>` preview). See `docs/modules/reports.md` |
| `src/pages/settings/SettingsPage.tsx` | Live | 5-section page (Account/Company/Activities/Audit/Security) — fixed left nav (local `useState`, no nested routes) + single-card content. Audit is a filterable (action, date range, admin-only company ID) feed table of sensitive actions across the company, via `useAuditLogs` — first section in this app with any `role === 'admin'`-specific UI (a `company_name` column + company filter) and the first with real pagination (grows `limit` via a "load more" button rather than accumulating pages); no route of its own, same as every other section. See `docs/modules/settings.md` |
| `src/hooks/` | Live | `useProfile`, `useTeam` (bare roster, backs Dashboard's `teamCount`), `useTeamMembers` (rich per-employee monthly stats, backs the Team page + Reports employee picker), `useCompanyDashboard`, `useTopBar`, `useAuth`, `useCompleteOnboarding`, `useJobTitles`, `useEmployeeSummary`/`useEmployeeTimeEntries`/`useEmployeeRates`/`useEmployeeMonthlyHistory`/`useEmployeeActions` (Employee Profile page), `useInvitations` (`useInvitations`/`useSendInvitation`/`useResendInvitation`/`useCancelInvitation`, Invitations page), `useAuditLogs` (Audit Log page), `useReports` (`useEmployeeReport`/`useSetReportBonus`/`useClearReportBonus`, Reports page), `useAccountSettings`/`useCompanySettings`/`useActivities`/`useSendPasswordResetEmail` (Settings page) — one file per resource |
| `src/components/dashboard/` | Live | `PeriodBar` (also takes an optional `onJumpToMonth` prop — only Reports passes it, Dashboard/Employee Profile unaffected), `KpiCard`, `ActivityDonut`, `TopEmployeesTable` — Dashboard-only, not shared shell components (`PeriodBar` and `KpiCard` are also reused by the Employee Profile page) |
| `src/components/reports/` | Live | `ReportEmployeePicker` (compact vertical list, page-scoped — not an `EmployeeCard` reuse), `BonusCard` (own local draft state, remounted via a `key` on employee/period change instead of an effect-based sync), `ReportDocument` (the `@react-pdf/renderer` document tree — monochrome, no `"stafy"` theme tokens). See `docs/modules/reports.md` |
| `src/components/team/EmployeeCard.tsx` | Live | Team-page-only card (avatar, status pill, hours/delta/pay stats, activity chips) — no generic `Card`/`Badge` primitive exists in this codebase; deliberately scoped, not extracted |
| `src/components/invitations/` | Live | `InvitationForm` (always-visible send form), `InvitationStatusBadge` (status → DaisyUI badge color), `InvitationsTable` (first DaisyUI `table` in this codebase — flat tabular data, not a card grid). See `docs/modules/invitations.md` |
| `src/components/employee/` | Live | `EmployeeHeaderCard`, `EmployeeActionsMenu` (first DaisyUI dropdown in this codebase), `EmployeeTabs` (first tab component, hand-built sliding indicator), `tabs/AttendanceTab`, `tabs/RatesTab`, `tabs/HistoryTab` (first Recharts usage — see below). See `docs/modules/employee-profile.md` |
| `src/components/settings/` | Live | `SettingsNav` (fixed vertical section nav, local-state active item — no sliding pill), `AccountSection`, `CompanySection` (own local draft state, remounted via a `key` on profile/company id instead of an effect-based sync, same pattern as `BonusCard`), `ActivitiesSection` (chip list with inline rename + add-form), `AuditSection` (filterable feed table of sensitive company actions, via `useAuditLogs`), `SecuritySection` (password-reset-email trigger, gated on `auth_provider`; Danger Zone block). See `docs/modules/settings.md` |
| `src/components/shared/Delta.tsx` | Live | Hours-delta presentational component (moved out of `dashboard/` once the Team page became a second consumer) — used by `TopEmployeesTable`, `EmployeeCard`, `EmployeeHeaderCard` |
| `src/components/layout/FullscreenSpinner.tsx` | Live | Shared loading state for all three layout gates |
| `src/utils/initials.ts` | Live | `getInitials(firstName, lastName)` — shared between `Sidebar`, `TopEmployeesTable`, `EmployeeCard`, `EmployeeHeaderCard` |
| `src/utils/period.ts` | Live | `getCurrentPeriod()` — shared between `DashboardPage`, `TeamPage`, and the Employee Profile page's header/Attendance tab |
| `src/utils/exportTeamCsv.ts` | Live | Client-side CSV export (Blob + temp `<a>`, no library) for the Team page — UTF-8 BOM + per-field quoting |
| `src/utils/exportEmployeeTimeEntriesCsv.ts` | Live | Same pattern as `exportTeamCsv.ts`, for one employee's current-month time entries (Employee Profile page's "⋯" menu) |
| `src/utils/authBlockedMessage.ts` | Live | sessionStorage flash-message helper — `AppLayout` sets it when blocking an `employee` login, `LoginPage` reads + clears it once |
| `src/utils/activityColor.ts` | Live | `CATEGORICAL_COLORS` (the 4-slot dataviz palette, also used rank-based by `ActivityDonut`) + `getActivityColor(activityId)`, a stable id-keyed color used by the Settings page's activity chips |
| `src/utils/auditLogFormat.ts` | Live | `ACTION_LABELS` (action string → Romanian label) + `formatAuditDetail(entry)` (one readable before→after line per action) for the Audit Log page |
| `src/utils/authError.ts` | Live | `mapAuthError(error)` — Firebase error-code → Romanian message map, shared by `AuthProvider` (login/register) and `useChangePassword` (Settings page). Also `OrphanRegistrationError` — thrown by `AuthProvider`'s `login()` on a 404 (Firebase account exists, backend row doesn't), caught by `LoginPage` to route to `/complete-registration`. Lives here rather than in `AuthProvider.tsx` so that file keeps exporting only the `AuthProvider` component (`react-refresh/only-export-components`) |
| `src/lib/toast.ts`, `src/components/toast/` | Live | `showToast(message, options)` imperative toast API — module-level store (no React import), `<ToastHost />` mounted once in `src/App.tsx`. See `docs/modules/toast.md` |
| `src/lib/icons.ts` | Live | Project-wide `ICONS` registry wrapping `lucide-react` — `check/info/warning/danger/close/loading` (toast), `search/download/plus/chevronRight` (Team page), `moreVertical/pencil/userX/userCheck` (Employee Profile actions menu), `mail/refresh/trash/clock` (Invitations page), `user/building/tags/shield` (Settings nav); existing direct `lucide-react` imports elsewhere are not yet migrated (see `docs/modules/toast.md` Deferred) |
| `recharts` (package) | Live | First charting library dependency in this repo, used only by `HistoryTab`. Every other chart (`ActivityDonut`) stays hand-rolled SVG; see `docs/modules/employee-profile.md` Special Aspects |
| `@react-pdf/renderer` (package) | Live | Client-side PDF generation/preview for the Reports page — `ReportDocument` is the single source of truth for both the `<PDFViewer>` preview and the downloaded file (`pdf(...).toBlob()`), deliberately avoiding a second backend-rendered template. Body text uses a registered `Inter` font (`@fontsource/inter`, `latin-ext` WOFF subset — not WOFF2, which crashes react-pdf/fontkit's embedder), not the built-in `Helvetica` — base-14 PDF fonts have no Romanian diacritics. See `docs/modules/reports.md` Special Aspects |
| `src/pages/tests/TestsPage.tsx` | Live, dev-only | `/tests` — bare shadow route to manually trigger sample toasts and a thrown error (verifies Sentry capture), registered only when `import.meta.env.DEV` (see `src/routes/index.tsx`) |
| `src/types/` | Not created yet | Add when a cross-component type doesn't belong in `api/generated` |

## CLI Quick Reference

```bash
pnpm dev                # start Vite dev server
pnpm build               # tsc -b && vite build
pnpm lint                # eslint .
pnpm preview             # preview production build
pnpm run gen             # regenerate src/api/generated/ from ./openapi.json (run `just gen-api` from workspace root to also refresh openapi.json)
pnpm run patch-report-fonts  # regenerate src/assets/fonts/inter-latin-ext-*.woff after bumping @fontsource/inter — see Traps
pnpm add <pkg>           # install dependency
pnpm add -D <pkg>        # install dev dependency
```

## Cross-Cutting Conventions

- **Styling**: Tailwind v4 utility classes + DaisyUI v5 component classes (`btn`, `card`, `menu`, `badge`, etc.), themed by the single `"stafy"` DaisyUI theme in `src/App.css`. Don't use raw hex colors in `className` or inline styles — use DaisyUI semantic classes (`btn-primary`, `bg-base-200`, ...) or the custom `var(--color-*)` tokens defined in the theme block. Don't create a per-component CSS file (e.g. `Sidebar.css`), even for a component with many precise px/timing values from a design spec — use Tailwind arbitrary values (`w-[240px]`, `transition-[top,height] duration-[220ms] ease-[var(--ease-out)]`) referencing existing tokens; if a spec value has no token yet, add it to the theme block in `src/App.css` first.
- **Naming**: new CSS classes, keyframes, and registry keys (e.g. `ICONS` entries) stay unprefixed, matching the existing style (`btn-primary` not `stafy-btn-primary`, `fade-slide-in` not `stafy-fade-slide-in`). Don't add a `stafy-` prefix to new code alone — that would only make sense as a project-wide, retroactive convention across everything existing, not something bolted onto one feature.
- **Routing**: TanStack Router, code-based. New pages: add the component under `src/pages/{feature}/`, then wire a `createRoute(...)` in `src/routes/index.tsx` under the correct parent (`appLayoutRoute` for authenticated pages, `authLayoutRoute` for login/register).
- **Imports**: `@stafy/*` resolves to `src/*` (configured in `tsconfig.app.json`'s `paths` and `vite.config.ts`'s `resolve.alias` — kept in sync manually, no `vite-tsconfig-paths` dependency). Use `@stafy/...` for any import that climbs out of the current folder (`../`); keep same-folder imports relative (`./Component`). `src/api/generated/` is excluded — it's Orval output and keeps its own relative imports.
- **Data fetching**: TanStack Query. New hooks go in `src/hooks/`, one file per backend resource (e.g. `useTeam.ts`, `useReports.ts`), calling the generated functions in `src/api/generated/endpoints/{tag}/` (client: axios, not react-query hooks yet — each call still needs to be wrapped in `useQuery`/`useMutation` by hand). Those generated functions already route through `src/services/api.ts`'s `api` mutator, which attaches the Firebase ID token — don't call `AXIOS_INSTANCE` or a new axios instance directly from a hook.
- **API client generation**: backend is the source of truth. `just gen-api` (workspace root) dumps the FastAPI OpenAPI schema to `openapi.json` and runs Orval (`orval.config.ts`) to regenerate `src/api/generated/`. `openapi.json` is gitignored (transient snapshot); the generated client under `src/api/generated/` is committed. Error responses (401/403/404/409/422) are typed as `ErrorOut` / `ValidationErrorOut` in the generated models — see `../stafy-backend/app/core/errors.py`.
- **Auth**: Firebase ID token, fetched live via `auth.currentUser.getIdToken()` — never cached as a string, same pattern as `stafy-mobile`.
- **Route prefix**: every backend endpoint is under `/api/v1`, including `/api/v1/auth/*` — see `../CLAUDE.md`'s Integration Contract and `../stafy-backend/CLAUDE.md`.
- **UI guidelines**: [`docs/ui-guidelines.md`](docs/ui-guidelines.md) — filled in incrementally as design decisions are made, not authored upfront. Check it before inventing new visual patterns.
- **Error tracking**: `Sentry.init()` in `src/main.tsx`, gated on `VITE_SENTRY_DSN` being set (unset locally → no-op). `Sentry.ErrorBoundary` wraps `<App />` for uncaught render errors; anything else uncaught (promise rejections, event handlers) is caught by `@sentry/react`'s default instrumentation. `environment` reads `VITE_SENTRY_ENVIRONMENT`, falling back to `import.meta.env.MODE` — set it explicitly per Vercel deployment target (production vs demo/staging) since both build in Vite `production` mode. Source maps upload via `sentryVitePlugin` in `vite.config.ts`, active only when `SENTRY_AUTH_TOKEN` is present in the build env (Vercel) — local `pnpm build` skips upload and still works. Maps are deleted from `dist/` after upload so the deployed site never serves original source.
- **Full feature scope**: [`../MANAGER-WEBAPP-IDEAS.md`](../MANAGER-WEBAPP-IDEAS.md) — original brainstorming doc, being implemented feature by feature.

## Traps

❌ **`src/api/generated/**` is regenerated by `pnpm run gen`.** Any manual edit there is silently overwritten on the next run. Need custom behavior on top of a generated function? Wrap it in a hook under `src/hooks/`, don't edit the generated file.

❌ **`src/assets/fonts/inter-latin-ext-*.woff` are byte-patched, not the stock `@fontsource/inter` files** — `ReportDocument.tsx` imports them from there instead of `@fontsource/inter/files/`. Don't "clean up" that import to point back at the package: `@fontsource/inter`'s `latin` and `latin-ext` subset files share the same internal font name, which makes `@react-pdf/pdfkit` silently drop the `latin-ext` embed and draw diacritics from the wrong (diacritic-free) glyph table — see `ReportDocument.tsx`'s top-of-file comment. After bumping `@fontsource/inter`, run `pnpm run patch-report-fonts` to regenerate these from the new version.

❌ **`VITE_API_URL` has no `.env` fallback baked into Vite** — only the default in `src/services/api.ts` (`?? 'http://127.0.0.1:8000'`). `.env.example` ships the line pre-filled with the local default, so a fresh `.env.local` copy already has it — but production builds still need it set explicitly via the deploy platform's env vars once this app is deployed, since `.env.local` itself is gitignored and never reaches a deploy target.

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
| Reports page design spec | [`docs/modules/reports.md`](docs/modules/reports.md) |
| Settings page design spec | [`docs/modules/settings.md`](docs/modules/settings.md) |
| Toast notifications, icon registry, `/tests` dev route | [`docs/modules/toast.md`](docs/modules/toast.md) |
