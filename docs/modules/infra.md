# Infra

The admin console's infrastructure page: one card per platform service (the backend itself, Render,
Vercel, Neon, UptimeRobot, Sentry), read-only, at `/admin/infra`. The data and the rules behind it
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

- A title row with the last-read time and a refresh button (spinning icon while a read is in
  flight).
- A two-column grid of `ProviderCard`s from `xl` up, one column below.
- `ProviderCard`: header with the provider name, a health badge (`HealthBadge`) and the data age; a
  one-line summary; a short secret-free error line when the provider could not be read; a metrics
  grid; rows grouped by environment or section, each with a health dot, a linked title, a summary
  line and a muted detail line; footer links with an outbound arrow.
- A provider that is not configured renders dimmed with a hint that its credentials belong in the
  backend; it never shows an error.
- Health colours come from the theme's semantic tokens (success, warning, error, info, muted);
  everything uses the monospace face of the rest of the console.

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
