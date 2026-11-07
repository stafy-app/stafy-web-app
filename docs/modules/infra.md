# Infra

The admin console's infrastructure page: one card per platform service (the backend itself, Render,
Vercel, Neon, UptimeRobot, Sentry, GitHub, Resend, expiry dates), read-only, at `/admin/infra`. The data and the rules behind it
are in `stafy-backend/docs/modules/infra.md`.

## Scope

**In scope:** a generic card per provider rendered from one normalised shape (health, metrics,
grouped rows, links); automatic polling; a manual refresh; the "not configured" and "could not
read" states; links out to each service's own dashboard.

**Out of scope (this release):** any action on a service (redeploy, restart, branch or monitor
changes); history charts; alerts; per-provider custom panels.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Platform admin | Admin console, Infra (`/admin/infra`) | Reads the status of every platform service |

---

## Data Objects

### Referenced (not owned)

- `InfraStatusOut` / `ProviderStatus` / `ProviderMetric` / `ProviderItem` / `ProviderLink`
  (`src/api/generated/endpoints/index.schemas.ts`) — generated from the backend's `stafy/infra`
  module.

### Owned

None — the page is a read-only view over `GET /api/v1/admin/infra`.

---

## Lifecycle

N/A — every value is a live read of an external service, cached by the backend for a few seconds.

---

## Derived / Aggregated Data

Nothing is computed in the browser beyond display formatting: relative times (`timeAgo`) and the
grouping of a provider's rows by their `group` label. Health, counts and sizes all arrive
formatted from the backend.

---

## User Flows

1. **Open Infra** — the admin picks Infra in the console sidebar; the cards load, the backend's own
   health first.
2. **Watch** — the page re-reads every minute without any action.
3. **Refresh** — the refresh button asks the backend to bypass its cache (it still reuses data a
   few seconds old); the result replaces the page's data.
4. **Jump to a service** — a card's links and rows open the service's dashboard, deployment, branch
   or issue in a new tab.

---

## Information Architecture

Console sidebar item "Infra" → `/admin/infra` → `AdminInfraPage` (a child of the `_admin` layout
route). No modals.

---

## UI / Layout

- A page header with the last-read time and a refresh button (spinning icon while a read is in flight).
- **App-wide strip** above the list (`InfraKpiStrip`; six compact cells in one row from `xl`, three per row from `md`, two below): six figures about the whole app, each with an info icon (tooltip) saying what it means: code and tests (repositories in order, `github`), emails delivered of sent in 24 h (`resend`), days to the nearest certificate or domain expiry (`expiry`), uptime over 30 days (`uptimerobot`), errors in 24 h with the unresolved count (`sentry`), and the Neon compute share of the plan (or the storage used when no limits are set). Each cell is a figure, a hint and a state dot (a dash when not configured or not readable); picking one opens its provider's detail in the panel below. `github`, `resend` and `expiry` (`KPI_PROVIDER_KEYS` in `providerHealth.ts`) appear only in the strip and are left out of the list and its "N of M work" count; the other three are real services and stay in the list too. Which metric feeds a cell is a frontend lookup by the backend's metric label.
- Two columns from `lg`: a left panel (`ProviderNav`, sticky) and the detail of the selected service on
  the right (`ProviderDetail`); stacked below `lg`, where picking a service scrolls its detail into view.
  Nothing scrolls horizontally: long text is truncated with its full text in a tooltip.
- Left panel: a header line ("N of M work", the ones needing attention in red), then one row per service
  with its name and a state dot plus phrase. Order: services that need attention (degraded, down,
  unknown, or an error line set, even if the health says it works), then the healthy ones, then the
  unconfigured. The first is selected until another is picked.
- Detail, top to bottom: the name, state and data age with a link to the vendor; one sentence on what the
  service does for Stafy (`description`); "Ce nu merge" with the read error when there is one; the
  numeric metrics as a KPI strip (up to four cells per row); the other metrics (a version, an
  environment, a consumption period) as one small muted line under the description; then one section per group, titled with its name and row count.
- A row is two lines: a state dot and the title, and under it the state text and secondary detail (a
  commit, a URL). On the right, the row's own figures (an uptime shows a thin bar colored by its
  health) and when it last changed. Each group shows its first six rows and an "all (n)" toggle.
- An unconfigured service is selectable and says what to set; it never shows an error.
- Health colours come from the theme's semantic tokens (success, warning, error, neutral); text uses the
  console's Inter face. Labels, states, summaries and group names come from the backend in Romanian; the technical reason in a read error (an HTTP status, an access hint) stays as the provider wrote it.

---

## Data Access

| Endpoint | Method | Hook |
|---|---|---|
| `/api/v1/admin/infra` | GET | `useAdminInfra` (polls every 60 s) |
| `/api/v1/admin/infra?refresh=true` | GET | `useRefreshAdminInfra` (mutation, replaces the cached query data) |

`useAdminInfra.ts` is the one file for this resource. `GET /admin/infra/{provider_key}` exists but
no screen uses it yet.

---

## Special Aspects

**The cards are generic on purpose.** The backend normalises every service into the same shape, so
adding a provider needs a backend provider and registry line and no change here. A provider that
needs a bespoke view is the exception to plan for, not the default.

**`unknown` is not "down".** A card whose health is `unknown` means the service's API could not be
read (bad credentials, timeout); the page says so in the error line instead of painting the service
as failing.

**Polling matches the backend cache.** The 60 s poll is slightly longer than the backend's 45 s
cache, so a poll normally triggers one real read per provider and never hammers a rate-limited API.

---

## Deferred

| Item | Trigger |
|---|---|
| Per-provider detail view (`GET /admin/infra/{provider_key}`) | A provider needs more than the generic card shows |
| History charts | The backend stores provider history |
