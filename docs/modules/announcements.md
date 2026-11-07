# Announcements

The modal every signed-in user sees over the app, and the admin console page where the
platform admin writes and manages those announcements. The data and rules live in the backend
(`stafy-backend/docs/modules/announcements.md`).

## Scope

**In scope:** `AnnouncementModal` in the company shell and the personal shell (markdown body, optional
call-to-action button, a distinct look for what's-new announcements), per-user dismissal of non-critical
announcements, `LoginAnnouncements` above the login form for announcements flagged for the login page, and the
admin page `/admin/announcements` with a create/edit form and a table of every announcement with its kind,
state and dismissal count.

**Out of scope (this release):** previewing before publishing, bulk actions, images in the modal, remembering
a closed login-page announcement across reloads.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Any signed-in non-admin user | Modal in `AppLayout` | Reads live announcements aimed at their company role and hides the dismissible ones |
| Signed-out visitor | Login page | Reads the announcements flagged for the login page and closes them until the next reload |
| Platform admin | Admin console, Announcements | Creates, edits, publishes, withdraws and deletes announcements |

---

## Data Objects

### Referenced (not owned)

- `ActiveAnnouncementOut`, `PublicAnnouncementOut`, `AdminAnnouncementOut`, `AnnouncementIn` (`src/api/generated/endpoints/index.schemas.ts`),
  generated from the backend's `stafy/announcements` module.

### Owned

None - the page is a form and a table over backend data.

---

## Lifecycle

N/A in the client. The backend derives `state` (draft, scheduled, live, ended); the table shows it as a
badge and the publish / withdraw button flips the stored status.

---

## Derived / Aggregated Data

N/A - `state`, `dismissible` and `dismissed_count` arrive computed from the backend.

---

## User Flows

1. **Read and dismiss** - a modal opens with the most severe announcement; the confirm button hides it
   for good and the next one opens. The close icon, the backdrop and Escape only close it until the page
   is reloaded. A critical announcement has no permanent dismissal, only the close action.
2. **Write an announcement** - in Announcements the admin picks a kind (announcement or what's new), severity,
   status, optional start and end, the audience roles, a title and a markdown description, optionally a button
   (label and link, both or neither) and whether it also shows on the login page, then creates it.
3. **Edit** - the row's edit action loads it into the same form; saving keeps the table in place.
4. **Publish or withdraw** - one button on the row flips draft and published without opening the form.
5. **Delete** - a first click turns the button into a confirmation; the second deletes the announcement and
   its dismissals.

---

## Information Architecture

| Where | Component |
|---|---|
| Company shell and personal shell, over the whole page | `AnnouncementModal` (`src/components/layout/`) |
| Login page, above the form | `LoginAnnouncements` (`src/components/auth/`) |
| `/admin/announcements` (console nav item) | `AdminAnnouncementsPage` -> `AdminAnnouncementsSection` |

The create/edit form opens in `AdminModal` (the standard sheet: one surface with the sections Conținut, Afișare, Buton and Programare, and the actions pinned in its footer). A row opens the editor on click; Publică or Retrage stays on the row, Editează and Șterge (with an inline confirmation) sit in the row's overflow menu from the new-announcement button or a row's edit action; the delete
confirmation is inline.

---

## UI / Layout

- A wide (`max-w-xl`) DaisyUI modal on a white surface: a header in a flat severity tint (no gradient; white icon tile, severity label with dot, left-aligned title, close button), a body that scrolls (thin scrollbar) only when the text
  exceeds 85vh, and a pinned row with the actions. Severity is only an accent. Several announcements
  queue, most severe first, with a position counter.
- The admin page is a dense table (state badge, severity badge, truncated message,
  audience, window, how many users hid it, row actions).
- A what's-new announcement uses a sparkle icon and the brand accent instead of the severity colors. The
  optional call-to-action is a primary button before the dismiss button (which turns ghost); an app-relative
  link opens in the same tab, an https link in a new one.
- The description is rendered by `AnnouncementMarkdown` (`src/components/shared/`): paragraphs, bold, italic,
  lists and links only, never raw HTML, other elements reduced to their text. The title is plain text. The form
  shows character counters for the 100 and 1000 limits, blocks an end earlier than the start, and blocks a button
  with only a label or only a link, or a link not starting with https:// or /.
- On the login page each announcement is a soft alert in its severity tone with a close button.

---

## Data Access

| Endpoint | Method | Hook |
|---|---|---|
| `/api/v1/announcements/public` | GET | `usePublicAnnouncements` (no authentication) |
| `/api/v1/announcements/active` | GET | `useActiveAnnouncements` (disabled for `role === 'admin'`) |
| `/api/v1/announcements/{id}/dismiss` | POST | `useDismissAnnouncement` |
| `/api/v1/admin/announcements` | GET / POST | `useAdminAnnouncements`, `useAdminSaveAnnouncement` |
| `/api/v1/admin/announcements/{id}` | PATCH / DELETE | `useAdminSaveAnnouncement`, `useAdminSetAnnouncementStatus`, `useAdminDeleteAnnouncement` |

Saving, withdrawing and deleting also invalidate the active-announcements query.

---

## Special Aspects

**Dismissal is saved on the server**, so a hidden announcement stays hidden on another device or after
signing out. **Datetime inputs are local time**; they are converted to an ISO instant on save and back
to local time when editing.

---

## Deferred

| Item | Trigger |
|---|---|
| Images or richer layout in the modal | A release needs a screenshot to be understood |
| Persisting a closed login-page announcement | Visitors complain about seeing it on every reload |
