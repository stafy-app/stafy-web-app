# Toast Notifications

Ephemeral, corner-of-screen confirmation messages (save succeeded, submit failed, non-blocking alert). Implemented in `src/lib/toast.ts` (store + `showToast` API), `src/lib/icons.ts` (icon registry), `src/components/toast/` (`Toast.tsx`, `ToastHost.tsx`).

## Scope

**In scope:** ephemeral, non-blocking confirmation of an action (success, info, warning, error), an imperative `showToast(message, options)` API callable from any component or non-component code, a single host mounted once at the app root, stacked multi-toast display with independent per-toast timers.

**Out of scope (this release):** destructive-action confirmation (that's a modal/dialog's job — no modal component exists yet), persistent/non-dismissing content, messages that require a mandatory user response, a max-stack-count limit (unbounded for now — see Deferred).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Any authenticated or unauthenticated user | Any screen (dashboard, auth, onboarding, `/tests`) | Sees toasts; can dismiss manually via the close button |
| Any component or service module | `showToast()` import | Triggers a toast |

---

## Data Objects

### Referenced (not owned)

None — toast state never reads from the backend or from other modules' state.

### Owned

- `ToastItem` (`src/lib/toast.ts`) — `id`, `message`, `tone`, `icon`, `duration`, `leaving`. Client-only, in-memory, never persisted, never sent to the backend.

---

## Lifecycle

```
created (visible, auto-dismiss timer running)
  → dismissed (manual click OR timer fires) → leaving (220ms exit animation)
  → removed (dropped from the store)
```

Manual dismiss and auto-dismiss both funnel through the same `dismissToast(id)` — the two triggers only differ in what starts the transition, not in the transition itself. `dismissToast` is idempotent (a toast already `leaving` is a no-op), so a manual click after the timer has already fired can't double-schedule removal.

---

## Derived / Aggregated Data

N/A — no aggregation. Each `ToastItem` is exactly what `showToast` was called with plus resolved defaults (tone, icon, duration); nothing is computed from other modules' data.

---

## User Flows

1. **Action succeeds** — calling code calls `showToast('Salvat cu succes.')` → toast enters top-right with the default `success` tone/icon → auto-dismisses after 1800ms.
2. **Action fails** — calling code calls `showToast(message, { tone: 'danger' })` → red-accented toast, same lifecycle.
3. **Manual dismiss** — user clicks the toast's close (X) button → toast starts its exit animation immediately, regardless of remaining auto-dismiss time.
4. **Multiple concurrent toasts** — several actions fire in quick succession → toasts stack vertically (10px gap, newest at the bottom), each with its own independent timer and time-bar animation.
5. **Manual QA** — a developer opens `/tests` (dev-only, see Special Aspects) and clicks one of its buttons to trigger a sample toast of each tone, including one with a custom `duration` and `icon` override.

---

## Information Architecture

Not a route or nav entry — a cross-cutting UI primitive. `<ToastHost />` is mounted once in `src/App.tsx`, as a sibling of `<RouterProvider />` inside `<AuthProvider>`, so it renders above every route (dashboard, auth, onboarding, and the dev-only `/tests` page) rather than being scoped to `AppLayout`/`TopBarContext`.

`/tests` (`src/pages/tests/TestsPage.tsx`) is the dev-only page used to manually exercise every tone/icon/duration combination — see Special Aspects for why it isn't a separate module doc.

---

## UI / Layout

All values below come from `src/App.css`'s `"stafy"` DaisyUI theme tokens — no new color/shadow/radius values were introduced.

**Host positioning** (`ToastHost.tsx`): `position: fixed; top: 88px; right: 24px; z-index: 9999`, `flex flex-col gap-[10px]`, `pointer-events: none` on the host wrapper (`pointer-events: auto` per toast so the host doesn't block clicks on the rest of the UI). `aria-live="polite"` for screen readers. Portaled to `document.body` (see Special Aspects).

**Toast anatomy** (`Toast.tsx`): container `min-width: 280px; max-width: 380px`, `bg: var(--color-surface)`, `text: var(--color-ink)`, `border-left: 4px solid <tone accent>`, `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-pop)`, padding `12px 16px`, flex row, `align-items: center`, `gap: 12px`.
- Icon badge: 22px circle, solid background = tone accent, white 14px glyph (`src/lib/icons.ts` registry).
- Text: 13px / font-weight 500, `flex: 1`.
- Close button: DaisyUI `btn btn-ghost btn-square btn-xs`, 13px icon in `var(--color-ink-muted)`, hover background `var(--color-surface-2)` / icon `var(--color-ink)`.
- Time bar: absolute bottom, 3px height, background = tone accent, `transform-origin: left`, animates `scaleX(1 → 0)` linear over the toast's exact `duration`.

**Tone → accent color** (border-left, time bar, icon badge background):

| tone | CSS var |
|---|---|
| `success` | `var(--color-success)` |
| `info` | `var(--color-info)` |
| `warning` | `var(--color-warning)` |
| `danger` | `var(--color-error)` (see Special Aspects) |

**Animations**: enter `240ms var(--ease-out)` (fade + `translateY(12px → 0)` + `scale(0.98 → 1)`); exit `200ms ease-out` (fade + `translateY(0 → -6px)`), triggered by the `leaving` state; time bar `linear`, duration = the toast's own `duration`, `forwards`. Defined as `toast-in`/`toast-out`/`toast-timebar` keyframes in `src/App.css`'s `@layer components`, next to the existing `fade-slide-in`.

---

## Data Access

N/A — no backend endpoints. `src/services/apiErrors.ts`'s `getErrorMessage` is the intended message source for error toasts (e.g. `showToast(getErrorMessage(error), { tone: 'danger' })` in a mutation's `onError`), but wiring individual call sites is not part of this module — each feature wires its own error toasts as needed.

---

## Special Aspects

**`danger` → `--color-error` naming.** The public tone API keeps `danger` (standard toast UX vocabulary — "success/info/warning/danger"), but the `"stafy"` DaisyUI theme's own semantic name for this color is `error`, not `danger`. `Toast.tsx`'s `TONE_COLOR` map is the one place that translates between the two; callers of `showToast` never see `error`.

**Toast entrance reuses the project's one easing curve.** `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` is the only easing curve defined in this project (also used by `fade-slide-in`, the only other animation in the codebase), under a stated project convention of no spring/bounce motion. Toast entrance reuses `--ease-out` rather than introducing a second, nearly-identical curve for one component. Exit uses a literal `ease-out` (no reusable precedent existed for an exit transition).

**Portal to `document.body`.** `ToastHost` renders via `createPortal(..., document.body)` rather than in-place. At the time of writing, nothing in the render tree above it sets a `transform`/`filter`/`contain` that would break `position: fixed` containment, so the portal isn't strictly load-bearing yet — but `AppLayout`'s scrollable `<main>` or a future modal/animation wrapper could introduce one, silently breaking the host's fixed positioning. Portaling removes that coupling entirely.

**`ICONS` registry (`src/lib/icons.ts`).** Project-wide icon registry (`ICONS` map + `IconName` type) built as part of this feature, wrapping `lucide-react`. Toast is the first consumer; it currently only lists the icons toast needs (`check`, `info`, `warning`, `danger`, `close`, `loading`). Existing direct `lucide-react` imports elsewhere (`Sidebar.tsx`, `Topbar.tsx`, `KpiCard.tsx`, etc.) are **not** migrated to it in this change — that's a separate, explicitly deferred refactor (see Deferred).

**`/tests` dev-only route.** Registered in `src/routes/index.tsx` as a direct child of the ungated `rootRoute`, spliced into `routeTree.addChildren([...])` only when `import.meta.env.DEV` is true — it does not exist in production builds at all, not merely unlinked from the sidebar. It renders bare (no `AppLayout`/Sidebar/Topbar chrome, no `useTopBar()` call) with buttons that call `showToast` with different tone/icon/duration combinations, for manual visual QA. It is dev tooling, not a product module, so it isn't documented as a separate `docs/modules/*.md` — this section is its only design record.

---

## Deferred

| Item | Trigger |
|---|---|
| Destructive-action confirmation UI (modal/dialog) | First feature that needs to confirm a destructive action — not toast's responsibility |
| Toast stack max-count / overflow handling | Real usage shows unbounded stacking becomes a problem |
| Migrate existing direct `lucide-react` imports (Sidebar, Topbar, dashboard components) to the `ICONS` registry | Decided as a follow-up, not bundled into this change — dedicated refactor task |
| `showToast` wiring into existing mutation `onError` handlers | Per-feature, as each mutation needs user-facing error feedback |
