# Announcements

The modal every signed-in user sees over the app, and the admin console page where the
platform admin writes and manages those announcements. The data and rules live in the backend
(`stafy-backend/docs/modules/announcements.md`).

## Scope

**In scope:** `AnnouncementModal` in the company shell and the personal shell, per-user dismissal of
non-critical announcements, and the admin page `/admin/announcements`
with a create/edit form and a table of every announcement with its state and dismissal count.

**Out of scope (this release):** markdown rendering, a call-to-action button, a banner on the login page,
previewing before publishing, bulk actions.

---

## Actors

| Actor | Interface | Role |
|---|---|---|
| Any signed-in non-admin user | Modal in `AppLayout` | Reads live announcements aimed at their company role and hides the dismissible ones |
| Platform admin | Admin console, Announcements | Creates, edits, publishes, withdraws and deletes announcements |

---

## Data Objects

### Referenced (not owned)

- `ActiveAnnouncementOut`, `AdminAnnouncementOut`, `AnnouncementIn` (`src/api/generated/endpoints/index.schemas.ts`),
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
2. **Write an announcement** - in Announcements the admin picks a severity, status, optional start and
   end, the audience roles, a title and a description, then creates it.
3. **Edit** - the row's edit action loads it into the same form; saving keeps the table in place.
4. **Publish or withdraw** - one button on the row flips draft and published without opening the form.
5. **Delete** - a first click turns the button into a confirmation; the second deletes the announcement and
   its dismissals.

---

## Information Architecture

| Where | Component |
|---|---|
| Company shell and personal shell, over the whole page | `AnnouncementModal` (`src/components/layout/`) |
| `/admin/announcements` (console nav item) | `AdminAnnouncementsPage` -> `AdminAnnouncementsSection` |

The admin page has no modals; the delete confirmation is inline.

---

## UI / Layout

- A narrow centered DaisyUI modal with a neutral card. Severity is only an accent: a tinted icon circle
  and a dot beside the severity label. Several announcements queue, most severe first, with a position
  counter.
- The admin page is the form panel above a dense table (state badge, severity badge, truncated message,
  audience, window, how many users hid it, row actions).
- Title and description are plain text, line breaks preserved in the description; the form shows character
  counters for the 100 and 1000 limits and blocks an end earlier than the start.

---

## Data Access

| Endpoint | Method | Hook |
|---|---|---|
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
| Markdown description and a call-to-action link | A feature announcement needs more than text |
| Banner on the login page | A planned outage needs to reach signed-out users |
