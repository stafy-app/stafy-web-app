# src/api

Generated API client — consumed here, never hand-written.

## Structure

- `generated/endpoints/{tag}/*.ts` — one file per OpenAPI tag (`dashboard`, `settings`, `time-entries`, `users`, `auth`, `general`), each exporting typed functions that call `api<T>(config)` from `../../../../services/api.ts`.
- `generated/endpoints/index.schemas.ts` — every request/response type and enum, in one file.

## How to use it

1. Import the endpoint function from its tag file, e.g. `import { getDashboard } from '@/api/generated/endpoints/dashboard/dashboard'`.
2. Never call it directly from a component. Wrap it in a `useQuery`/`useMutation` hook under `src/hooks/` (one file per resource, e.g. `useDashboard.ts`) — see `../CLAUDE.md` Cross-Cutting Conventions.
3. Auth (Firebase ID token) and error typing are already wired through the `api` mutator in `src/services/api.ts` — don't create a second axios instance or attach headers manually.
4. Error responses are typed per-status (`ErrorOut` / `ValidationErrorOut`) straight from the backend's OpenAPI schema — check `endpoints/index.schemas.ts` for the shape instead of guessing.

## Regenerating

Source of truth is `stafy-backend`. Run `just gen-api` from the workspace root (dumps `openapi.json`, then runs Orval). Do not hand-edit anything under `generated/` — it's overwritten on the next run.

## Before adding a new call

Check whether an endpoint function for it already exists under `generated/endpoints/{tag}/` — if the backend route exists but the function doesn't, regenerate (`just gen-api`) rather than hand-writing a fetch call.
