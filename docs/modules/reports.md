# Reports

Manager-only monthly payroll report generator. Route `/reports` (`src/pages/reports/ReportsPage.tsx`).
Two-column "editor + live preview" layout: a narrow control panel on the left, an A4 document
preview on the right that updates instantly as the manager changes period, employee, options, or
bonus. Reached from the sidebar's Reports item.

## Scope

**In scope:** period picker (month/year jump, via `PeriodBar`'s `onJumpToMonth` — prev/next arrows
and the current-month pill are hidden here since the jump picker alone covers navigation, see UI /
Layout); a compact
employee picker (avatar + name, one selected at a time); a checkbox to include the detailed
time-entry list; a bonus field (amount + optional reason, three quick-amount buttons, a clear-bonus
link when a bonus is already set for the selected employee/month); a PDF-download action (fully
functional); a send-by-email action (visible, disabled — see Deferred); a live A4 preview of the exact
document that gets downloaded, rendered via `@react-pdf/renderer`'s `<PDFViewer>` — not a separate
DOM mockup kept visually in sync by hand.

**Out of scope (this release):** actually sending the report by email (button ships disabled, no
backend call wired); the *employer's own* logo or phone number in the document header (identity
block is name + address text only — the header does show a static Stafy brand mark, see Special
Aspects; per-company branding is a separate, still-deferred feature — see
`stafy-backend/docs/modules/reports.md`); a mobile/tablet layout
(the two-column layout is desktop-only for now, no collapse breakpoint); editing a past month's
bonus retroactively from anywhere other than this page (History, Dashboard, Team only ever *display*
the bonus-inclusive total — see Special Aspects).

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Manager | `stafy-web-app` (Portal) | Picks a month + employee, optionally sets a bonus, previews, and downloads a payroll report PDF |

---

## Data Objects

### Referenced (not owned)

- `UserOut` — employee identity (name, email, join date) and the generated-by manager's identity,
  both embedded in the report response.
- `EmployeeReportOut`, `ReportActivityGroupOut`, `PayrollBonusOut` (new, `app/reports/schemas.py`) —
  the report payload and its activity-breakdown rows and bonus, respectively. See
  `stafy-backend/docs/modules/reports.md`.
- Team roster (`GET /teams/members`, via the existing `useTeamMembers` hook) — reused as-is to
  populate the employee picker; no new "list of employees" endpoint.
- `TimeEntryOut` (existing employee-detail endpoint) — the optional detailed time-entries table,
  reused from the same endpoint the Employee Profile Attendance tab already calls.

### Owned

None on the frontend. The bonus row itself is backend-owned (`PayrollBonus`); this page only reads
and writes it through `PUT`/`DELETE .../reports/{employeeId}/bonus`.

---

## Lifecycle

N/A — no client-owned entity. Local component state only: selected period, selected employee,
"include time entries" checkbox, in-progress bonus-form input, and whether a PDF download is
currently generating (drives the pulse/spinner, see UI / Layout).

---

## Derived / Aggregated Data

- **Report data** is fetched once per `(employeeId, year, month)` combination — toggling the
  time-entries checkbox re-renders the `<PDFViewer>` from already-fetched data, no refetch, no
  loading state. Changing period, employee, or actually saving/deleting a bonus triggers a new
  request; an in-progress (unsaved) bonus edit never touches the preview — see the Special Aspects
  note on never trusting local input for the displayed total.
- **Activity breakdown table** rows come pre-grouped from the backend by `(activity_id,
  rate_applied)` — the client renders whatever rows it receives without re-aggregating; it never
  averages a rate across rows itself (see the backend doc's Special Aspects for why).
- **Total pay note** — when a bonus is active, the summary block shows the bonus-inclusive total
  plus a small "hours-pay + bonus" note underneath, both values taken directly from
  `EmployeeReportOut.pay_from_hours`/`.bonus`/`.total_pay` — never recomputed client-side from the
  activity rows plus a locally-held bonus value, so a stale unsaved bonus input never leaks into the
  displayed total before it's actually saved.

---

## User Flows

1. Manager opens Reports → defaults to the current month and the first employee in the roster;
   preview renders immediately.
2. Manager steps the period (arrows) or opens the jump-to-month picker → the report re-fetches for
   the new month, same employee.
3. Manager picks a different employee from the left-panel list → the report re-fetches for the new
   employee, same period.
4. Manager toggles the "include time entries" checkbox → the time-entries table appears/disappears
   in the preview instantly; if this is the first time it's been checked for this employee/month,
   the underlying time-entries request fires lazily (not fetched up front, since most report
   generations won't need it — see Special Aspects).
5. Manager types a bonus amount (or clicks +100/+250/+500 RON) and an optional reason, then clicks
   the explicit save-bonus button → `PUT .../bonus` fires; the report refetches so the summary
   and bonus row reflect the saved value (not an optimistic local guess). An explicit button, not a
   blur-commit, so clicking a quick-amount button never accidentally saves before the manager reviews
   the amount.
6. Manager clicks the clear-bonus action (only rendered when a bonus is active for this
   employee/month) → `DELETE .../bonus` fires; the report refetches without it.
7. Manager clicks the PDF-download button → button disables and shows a spinner, the preview
   document pulses (a brief shadow/scale animation) for the duration of `pdf(document).toBlob()`,
   then the file downloads and a toast confirms.
8. The send-by-email button is visible but disabled — no flow yet.

---

## Information Architecture

Route: `/reports` under `appLayoutRoute` (`src/routes/index.tsx`), already wired to
`ReportsPage.tsx` before this page had real content. Breadcrumb/title via `useTopBar()`, same
pattern as every other page under `AppLayout`. No modals — bonus editing is inline in its own card,
not a dialog.

---

## UI / Layout

### Left panel (sticky, fixed-width, doesn't scroll with the page)

- **Period card** — extends the existing `PeriodBar` (already shared by Dashboard and Employee
  Profile) with a second interaction: a jump-to-month link that opens a month/year picker,
  alongside the existing prev/next arrows. `PeriodBar`'s other two consumers are unaffected.
- **Employee card** — new, page-scoped `ReportEmployeePicker` component: a compact vertical list
  (avatar via `getInitials`, name), one row selected at a time with a pale-orange background + check
  mark. Sourced from `useTeamMembers`, not a new endpoint.
- **Options card** — a single checkbox (include the time-entries list) with a short muted line
  under it.
- **Bonus card** (`BonusCard` component) — a right-aligned numeric input styled like a money amount,
  an optional single-line reason field, three quick-amount buttons (+100/+250/+500 RON) that set the
  amount field, a save-bonus button, and a clear-bonus link rendered only when
  `EmployeeReportOut.bonus` is non-null for the current selection. Keyed by
  `${employeeId}-${year}-${month}` from the parent so React remounts it (fresh local draft state)
  whenever employee or period changes, instead of an effect that writes state — see Special Aspects.
- **Final actions card** — two full-width stacked buttons: a PDF-download button (`btn-primary`) and
  a send-by-email button (`btn-outline`, `disabled`, no click handler wired).

All left-panel text stays small/muted/uppercase-label, so the document preview stays the visual
focus.

### Right column — document preview

- Small label above the page, identifying it as the A4 PDF preview.
- The document itself is `@react-pdf/renderer`'s `<PDFViewer>` wrapping `ReportDocument` (the
  component tree) — an actual rendered PDF (via `pdf.js`), not a DOM approximation, floating on the
  page with a card shadow.
- **This document is intentionally monochrome** — no orange, no `"stafy"` theme tokens at all.
  Black/white/gray only; hierarchy comes from font weight/size/italic (sans for names/labels,
  monospace for every number — hours, RON, rates), not color. This is a deliberate departure from
  the rest of the app's visual language — see Special Aspects.
- Sections, top to bottom: a header block, four rows separated by a heavy rule below — row 1 is the
  static Stafy brand mark (left, hand-drawn `Svg` primitives, not an imported raster/SVG asset — see
  Special Aspects) and the static document title (right); row 2 is a Company field (+ optional
  address subtext) and a Period field (always the full calendar month's first–last day range,
  independent of when the report is actually generated); row 3 is an Employee field (+ email
  subtext) and a Generated-by field (manager name + email subtext, right-aligned via
  `headerFieldGroupRight`); row 4 is a Job-title field (`employee.job_title`, em-dash when unset)
  and a Generated-on field (generation date **and** time, not date-only).
  A large summary block follows (total hours,
  total pay side by side, bold, with the bonus note when applicable); the activity-breakdown table
  (activity, rate, hours, subtotal — one row per `(activity_id, rate_applied)` group, a starred bonus
  row when active, a bold larger grand-total row); the optional time-entries table (same columns as
  the Employee Profile Attendance tab) when the checkbox is checked; a one-time (not repeated per
  page) manager signature block — blank line + a manager-signature label, no name — right-aligned
  after the last content block; a thin fixed footer rule noting the document was generated
  automatically by Stafy.ro, and the page number.
- Density is generous (large padding, relaxed line-height) — reads as a printed document, not an
  app screen.

### Download pulse

- On clicking the PDF-download button: the document preview's container gets a brief shadow/scale
  pulse (150–250ms out and back) for as long as blob generation actually takes — this is
  real-latency feedback, not decoration (`toBlob()` is not instant). The button shows an inline
  spinner and is disabled for the same duration. A toast confirms once the browser download
  actually starts.
- The same pulse (and disabled/spinner state) is defined for the send-by-email button for when that
  button is enabled in a future release, even though it currently never fires.

Design tokens for everything **outside** the document (cards, buttons, labels) come from
`src/App.css`'s `"stafy"` theme, same as every other page.

---

## Data Access

New hooks under `src/hooks/`, one file per resource, calling generated Orval functions once
`pnpm run gen` picks up the new backend `reports` tag:

```typescript
GET    /api/v1/reports/{employeeId}?year=&month=        → EmployeeReportOut   (useEmployeeReport)
PUT    /api/v1/reports/{employeeId}/bonus?year=&month=   → PayrollBonusOut     (useSetReportBonus)
DELETE /api/v1/reports/{employeeId}/bonus?year=&month=   → 204                 (useClearReportBonus)
```

Reused, not duplicated:

```typescript
GET /api/v1/teams/members                                            → useTeamMembers   (employee picker)
GET /api/v1/users/{employeeId}/time-entries?year=&month=&activity_id= → useEmployeeTimeEntries (time-entries table, lazy)
```

---

## Special Aspects

**The preview frame is locked to A4's exact aspect ratio (210:297), not just "big and full-width."**
`<PDFViewer>` is an `<iframe>` into the browser's own PDF viewer — if the box it fills isn't
A4-shaped, that viewer letterboxes the page and paints its own (dark) background in the leftover
space, which reads as a stray black frame around a too-small page. The wrapping div is sized via
CSS `aspect-ratio: 210 / 297` (capped at a max width, centered, scrollable if the column is short)
so the page fills the iframe with nothing left for the browser to paint around. `PDFViewer`'s
`style` prop is typed to react-pdf's own document `Style` (not DOM `CSSProperties`), even though
it's spread directly onto the iframe at runtime — sizing/border removal go through `className`
(Tailwind), not `style`, to sidestep that type mismatch.

**`@react-pdf/renderer` is a second rendering-adjacent dependency, and it's the single source of
truth for both preview and export.** The document is written once, as a `@react-pdf/renderer`
component tree; `<PDFViewer>` displays the real generated PDF as the "live preview," and
`pdf(document).toBlob()` produces the exact same bytes for the download. There is no second,
hand-maintained DOM/Tailwind mockup to keep visually in sync — the alternative (a backend HTML+CSS
template rendered to PDF via something like WeasyPrint, previewed via a separate React component)
was considered and rejected specifically to avoid two templates drifting apart over time.

**The document deliberately does not use the `"stafy"` theme.** Every other surface in this app uses
the brand-orange DaisyUI theme; this one page's exported artifact is a monochrome, typographically
hierarchical document on purpose — it's meant to read as an official printed payslip, not as an
extension of the app UI. Don't "fix" this by reintroducing brand color into the report styles.
**One deliberate exception:** the header's Stafy brand mark keeps its real orange (`#FF6B00`) fill —
it's a small fixed logo mark, not a theming choice, and the surrounding document stays monochrome.
The mark is drawn with react-pdf's native `Svg`/`Path`/`Circle`/`Line`/`G`/`Rect` primitives (copied
from `src/assets/stafy_logo.svg`'s paths) rather than rendered as an `Image` — react-pdf's `Image`
component doesn't rasterize arbitrary SVG, so importing the asset file directly wouldn't render.

**Body text uses a registered `Inter` font, not react-pdf's built-in `Helvetica`.** The base-14 PDF
fonts (`Helvetica`, `Courier`, ...) use WinAnsi encoding, which has no Romanian diacritics at all
(ă, â, î, ș, ț silently vanish from the rendered PDF). `@fontsource/inter`'s `latin-ext` WOFF (not WOFF2 — react-pdf/fontkit's WOFF2 embedding is
unreliable and throws `RangeError: Offset is outside the bounds of the DataView`) subset
(400/700, normal/italic — the four weights/styles this document actually uses) is registered via
`Font.register` at module load and set as the page's base `fontFamily`; bold/italic are expressed as
`fontWeight`/`fontStyle` on top of that one family, not as separate `Helvetica-Bold`-style family
names. `Courier`/`Courier-Bold` are untouched — they're only ever applied to numbers/currency/RON,
which have no diacritics, so the base-14 encoding gap doesn't apply there.

**The employee picker is a new page-scoped component, not a reuse of `EmployeeCard`.** `EmployeeCard`
(Team page) is a richer card (status pill, hours/delta/pay stats, activity chips) built for a grid;
this page needs a compact single-line row for a vertical list with one active selection, a different
enough shape that adapting `EmployeeCard` would mean stripping most of it down. Consistent with how
`EmployeeTabs`/`EmployeeActionsMenu` are already page-scoped rather than generic.

**Bonus editing never trusts local input for the displayed total.** The amount field is local state
until saved; the report's summary numbers always come from the last successful fetch, not from
whatever is currently typed in the bonus field. This avoids showing a total that implies a bonus was
saved when it wasn't yet (or wasn't accepted).

**`BonusCard`'s draft state resets via a `key`, not an effect.** The natural-seeming approach —
initialize local `amount`/`reason` state from `report?.bonus`, then a `useEffect` that re-syncs them
whenever the employee, period, or bonus changes — is exactly the "adjusting state when a prop
changes" anti-pattern the project's lint config (`react-hooks/set-state-in-effect`) flags: it causes
an extra render on every sync and fights React's own data flow. `ReportsPage` instead gives
`BonusCard` a `key={`${employeeId}-${year}-${month}`}` — changing the key remounts the component
from scratch, so its `useState` initializers just read the *new* `report?.bonus` on first render,
with no effect and no synchronizing setState at all. The employee auto-select default
(`pickedEmployeeId ?? members[0]?.user.id ?? null`) follows the same "derive at render time, don't
effect it" rule for the same reason.

**This feature also changes already-shipped pages.** Employee Profile's History tab renders
`EmployeeMonthlyHistoryEntryOut.bonus_amount` (new field) as its own line/marker per month, rather
than only the pre-existing hours/pay chart — see `stafy-backend/docs/modules/reports.md`'s Derived /
Aggregated Data section for why the bonus is broken out there instead of folded silently into one
number. Employee Profile's Attendance tab (`AttendanceTab.tsx`, the time-entries table) additionally
fetches `useEmployeeReport` for the browsed period and, when a bonus is active, appends one styled
row after the time-entry rows — a monthly-bonus pill (+ optional reason) spanning the date/time-range/
activity columns, em-dashes in the duration/rate columns, the amount in the amount column, on a
faint success-tinted background. This row is independent of the activity filter (it isn't a time
entry) and renders even when the month has zero time entries but an active bonus — the empty-state
message only shows when both are absent.

---

## Deferred

| Item | Trigger |
|---|---|
| Send-by-email actually sending | A backend endpoint exists to accept the client's generated PDF blob and relay it via `app/email`/Resend |
| Company logo / phone in the document header | `Company` gains those fields for an unrelated reason |
| Mobile/tablet responsive layout (panel collapses above preview) | A concrete need to use this page from a narrow viewport |
