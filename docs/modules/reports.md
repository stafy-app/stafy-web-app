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
functional); a live A4 preview of the exact document that gets downloaded, rendered via
`@react-pdf/renderer`'s `<PDFViewer>` — not a separate DOM mockup kept visually in sync by hand.

**Out of scope (this release):** sending the report by email — no button, no backend call wired
(see Deferred; a prior disabled placeholder button was removed rather than left non-functional —
see Special Aspects); the *employer's own* logo or phone number in the document header (identity
block is name + address text only — see Special Aspects for why no logo of any kind is shown there;
per-company branding is a separate, still-deferred feature — see
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
- **Final actions card** — one full-width PDF-download button (`btn-primary`).

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
  masthead: `report.company.name` (left, large/bold — no logo of any kind, see Special Aspects) and
  the static document title (right); row 2 is an optional Address field (left, only when
  `company.address` is set) and a Period field (always the full calendar month's first–last day
  range, independent of when the report is actually generated); row 3 is an Employee field (+ email
  subtext) and a Generated-by field (manager name + email subtext, right-aligned via
  `headerFieldGroupRight`); row 4 is a Job-title field (`employee.job_title`, em-dash when unset)
  and a Generated-on field (generation date **and** time, not date-only). Rows 2–4 align their
  fields to the top (`flex-start`), not centered, since several pair a two-line field against a
  single-line one.
  A large summary block follows (total hours,
  total pay side by side, bold, with the bonus note when applicable); the activity-breakdown table
  (activity, rate, hours, subtotal — one row per `(activity_id, rate_applied)` group, a bulleted
  bonus row when active, a bold larger grand-total row); the optional time-entries table (same
  columns as the Employee Profile Attendance tab, plus its own total row) when the checkbox is
  checked; a one-time (not repeated per page) manager signature block — blank line + a
  manager-signature label, no name — right-aligned after the last content block; a thin fixed footer
  rule noting the document was generated automatically by Stafy.ro, and the page number. Table
  header rows repeat on every page (`fixed`) and no table/summary/signature row is allowed to split
  across a page break (`wrap={false}`) — relevant once the optional time-entries table pushes the
  document past one page.
- Density is generous (large padding, relaxed line-height) — reads as a printed document, not an
  app screen.

### Download pulse

- On clicking the PDF-download button: the document preview's container gets a brief shadow/scale
  pulse (150–250ms out and back) for as long as blob generation actually takes — this is
  real-latency feedback, not decoration (`toBlob()` is not instant). The button shows an inline
  spinner and is disabled for the same duration. A toast confirms once the browser download
  actually starts.
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

**The document deliberately does not use the `"stafy"` theme, and carries no app/vendor logo of any
kind.** Every other surface in this app uses the brand-orange DaisyUI theme; this one page's
exported artifact is a monochrome, typographically hierarchical document on purpose — it's meant to
read as an official printed document, not as an extension of the app UI or a screenshot of it. The
masthead's left slot shows `report.company.name` (the *client's* company, large/bold) rather than a
Stafy brand mark — that slot belongs to whichever company issued the report, and Stafy's own
attribution is confined to the footer's "generat automat de Stafy.ro" line and the PDF's
`creator`/`producer` metadata, not the masthead. Don't reintroduce brand color or an app logo into
the report styles; per-company branding (the employer's own logo) is a separate, still-deferred
feature — see Deferred.

**Body text uses two registered Inter font families, not react-pdf's built-in `Helvetica`.** The
base-14 PDF fonts (`Helvetica`, `Courier`, ...) use WinAnsi encoding, which has no Romanian
diacritics at all (ă, â, î, ș, ț silently vanish from the rendered PDF). `@fontsource/inter` ships
Romanian coverage as two *disjoint* subsets — `latin` (digits, base punctuation, plain letters) and
`latin-ext` (only ă/â/î/ș/ț, nothing else) — so both are registered as separate families
(`InterLatin`, `InterLatinExt`) and the page's `fontFamily` is set to the array
`['InterLatin', 'InterLatinExt']`. react-pdf/textkit's `fontSubstitution` pass resolves each
character against that stack in order (`pickFontFromFontStack`, per-codepoint `hasGlyphForCodePoint`
checks) before falling further back to `Helvetica` — registering only one of the two subsets under
a single family (an earlier version of this file did) leaves every codepoint the registered subset
doesn't cover silently falling all the way to `Helvetica`, which is most of the alphabet for a
`latin-ext`-only registration. Each family registers 400/700 normal/italic (the four weights/styles
this document actually uses) as `.woff`, not `.woff2` — react-pdf/fontkit's WOFF2 embedding is
unreliable and throws `RangeError: Offset is outside the bounds of the DataView`. `Courier`/
`Courier-Bold` stay on numeric/currency cells only (a `mono` style, applied to value cells, never to
`th` column-label cells — those need the Inter stack for labels like "Durată"/"Sumă") — Courier has
no diacritics either, but every numeric value it's applied to is diacritic-free by construction.

**The `latin-ext` font files are byte-patched copies, committed under `src/assets/fonts/`, not
imported from `@fontsource/inter` directly.** `@fontsource/inter`'s `latin` and `latin-ext` subset
files for the same weight self-report the *identical* internal font name (both "Inter-Bold", etc.)
— they're the same font, only split by Unicode range for web `@font-face` performance.
`@react-pdf/pdfkit` caches embedded fonts by that internal name (`FontsMixin.font()`'s
`this._fontFamilies[this._font.name]` check, confirmed by reading the installed package source),
so once `latin` is embedded as "Inter-Bold", `latin-ext` silently reuses that same embedded
(diacritic-free) font object instead of being embedded at all — react-pdf/textkit still resolves
diacritic glyphs against `latin-ext`'s own glyph indices, but pdfkit draws them from `latin`'s glyph
table, which produces a garbage character (not a blank one) for every diacritic. `scripts/patch-
report-fonts.cjs` (`pnpm run patch-report-fonts`) regenerates `src/assets/fonts/inter-latin-ext-*
.woff` from the installed package by rewriting only the `latin-ext` copies' `name` table
("Inter" → "IntrX"), verified against the original with fontkit (`numGlyphs`/`characterSet`/
`hasGlyphForCodePoint` all unchanged, only `postscriptName`/`familyName` differ) — nothing else in
the font is touched. Re-run it after bumping `@fontsource/inter`.

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

**Footer carries a confidentiality note and a per-generation reference code, since this document
leaves the app.** The report is explicitly an internal working document a manager forwards to
accounting to replace manual hour/salary tallying — not an official payslip (no CNP/CUI, no
gross/net breakdown; deliberately out of scope, see Scope). Once a PDF leaves the app as an email
attachment or download, there's no in-app trail of which version was sent, so the footer adds a
`RA-{employeeId}-{yyyyMMdd-HHmm}` reference derived from `generated_at` using UTC getters, not
local ones — the same instant must produce the same ref regardless of which timezone the manager's
browser is in — alongside a one-line data-protection note. The footer also prints a
`TEMPLATE_VERSION` constant (currently `v1.0`, defined in `ReportDocument.tsx`) so a template
layout/field change later stays identifiable on documents already sent to accounting — bump it
whenever the template's structure changes. `<Document>` also now sets PDF metadata
(`title`/`author`/`subject`/`creator`) so the file has a readable name/author in any PDF viewer
instead of appearing blank.

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
| Send-by-email (manager → a configured accounting address, not the employee directly, to avoid this document being treated as an official payslip) | A backend endpoint exists to accept the client's generated PDF blob and relay it via `app/email`/Resend |
| Company logo / phone in the document header | `Company` gains those fields for an unrelated reason |
| Batch export (whole roster, one month, one action) | A concrete need surfaces for exporting more than one employee at a time |
| Mobile/tablet responsive layout (panel collapses above preview) | A concrete need to use this page from a narrow viewport |
