# Changelog

All notable changes to the **Stafy Web App** are documented here, newest first.
Format loosely follows [Keep a Changelog](https://keepachangelog.com); this
project uses `Added` / `Changed` / `Fixed` / `Removed` from v0.2.0 onward.

## [0.1.0] - 2026-08-27

First release. Manager and internal-admin web dashboard for Stafy —
React + Vite + TypeScript, Tailwind v4 + DaisyUI v5, TanStack Router + Query.
Consumes the Stafy backend under `/api/v1`.

### Added

- **Authentication** — email/password sign-in and registration, with a
  mandatory once-per-manager onboarding step (organization name / city / address
  + job title) and a recovery flow for interrupted sign-ups. `admin` accounts
  are confined to the Settings page; every other route redirects them there.
- **Dashboard** — company-wide monthly overview: period navigation, KPI strip,
  activity-breakdown donut, and a top-5 employees table.
- **Team** — searchable grid of employee cards showing this month's hours,
  delta, estimated pay, and activities. CSV export of the full roster. Invite
  action.
- **Employee profile** — per-employee page with a header card and three tabs:
  Attendance (time entries), Rates (per-activity hourly rates, editable on the
  employee's behalf), and History (5-month hours and pay chart).
- **Invitations** — send-invitation form, pending / accepted / expired summary
  tiles, and a table of every non-cancelled invitation with resend and cancel
  actions.
- **Reports** — two-column payroll report generator: period / employee /
  options / bonus editor on the left, live A4 PDF preview on the right. The PDF
  is rendered and downloaded client-side; the same document tree drives both the
  preview and the file. Body text uses an embedded font with Romanian
  diacritics.
- **Settings** — six sections:
  - **Account** — personal name.
  - **Company** — own company's name, city, address (blocked if the manager
    joined the company by invitation rather than owning it).
  - **Activities** — company activity list with inline rename and add.
  - **Audit** — filterable feed of sensitive company actions (action type, date
    range; admins also get a company filter and column), with pagination.
  - **Security** — password-reset email trigger and a danger zone.
  - **Admin** (admin accounts only) — cross-company KPI cards, a signups-over-
    time chart, an invitation-status funnel, and a time-entries-over-time chart.
    Hidden entirely from the nav for non-admins.
- **API client** — generated from the backend's OpenAPI schema via Orval,
  routed through a custom mutator that attaches the auth token. Regenerate with
  `pnpm run gen` (or `just gen-api` from the workspace root).
- **Error tracking** — Sentry with an error boundary; source maps upload at
  build time on the deploy platform. Disabled locally when no DSN is set.
- **Styling** — a single custom DaisyUI `"stafy"` theme (CSS-first, no JS
  config); no per-component CSS files.
- **Localization** — Romanian throughout.

### Known limitations

- No test suite yet.
- Requires `VITE_API_URL` set on the deploy platform (local falls back to
  `http://127.0.0.1:8000`).
