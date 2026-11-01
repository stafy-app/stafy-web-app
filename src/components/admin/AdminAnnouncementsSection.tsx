import { useState, type FormEvent } from 'react'
import {
  useAdminAnnouncements,
  useAdminDeleteAnnouncement,
  useAdminSaveAnnouncement,
  useAdminSetAnnouncementStatus,
} from '@stafy/hooks/useAdmin'
import {
  AnnouncementInAudienceRolesItem,
  AnnouncementInSeverity,
  AnnouncementInStatus,
  type AdminAnnouncementOut,
} from '@stafy/api/generated/endpoints/index.schemas'

const TITLE_MAX = 100
const BODY_MAX = 1000

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Informare',
  warning: 'Avertisment',
  critical: 'Critic',
}

const SEVERITY_BADGE: Record<string, string> = {
  info: 'badge-info',
  warning: 'badge-warning',
  critical: 'badge-error',
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Ciornă',
  scheduled: 'Programat',
  live: 'Activ',
  ended: 'Încheiat',
}

const STATE_BADGE: Record<string, string> = {
  draft: 'badge-ghost',
  scheduled: 'badge-info',
  live: 'badge-success',
  ended: 'badge-neutral',
}

const AUDIENCE_LABELS: Record<string, string> = {
  owner: 'Owneri',
  manager: 'Manageri',
  employee: 'Angajați',
}

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'short', timeStyle: 'short' })

/** ISO instant -> the `YYYY-MM-DDTHH:mm` value a datetime-local input expects, in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function windowLabel(announcement: AdminAnnouncementOut): string {
  const from = announcement.starts_at ? dateTimeFormatter.format(new Date(announcement.starts_at)) : 'de la publicare'
  const to = announcement.ends_at ? dateTimeFormatter.format(new Date(announcement.ends_at)) : 'până la retragere'
  return `${from} → ${to}`
}

interface AnnouncementFormProps {
  editing: AdminAnnouncementOut | null
  onDone: () => void
}

function AnnouncementForm({ editing, onDone }: AnnouncementFormProps) {
  const save = useAdminSaveAnnouncement()
  const [severity, setSeverity] = useState<AnnouncementInSeverity>(editing?.severity ?? AnnouncementInSeverity.info)
  const [title, setTitle] = useState(editing?.title ?? '')
  const [body, setBody] = useState(editing?.body ?? '')
  const [audience, setAudience] = useState<AnnouncementInAudienceRolesItem[]>(
    editing?.audience_roles ?? Object.values(AnnouncementInAudienceRolesItem),
  )
  const [startsAt, setStartsAt] = useState(toLocalInput(editing?.starts_at ?? null))
  const [endsAt, setEndsAt] = useState(toLocalInput(editing?.ends_at ?? null))
  const [status, setStatus] = useState<AnnouncementInStatus>(editing?.status ?? AnnouncementInStatus.draft)

  const windowInvalid = !!startsAt && !!endsAt && new Date(endsAt) <= new Date(startsAt)
  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && audience.length > 0 && !windowInvalid

  function toggleAudience(role: AnnouncementInAudienceRolesItem) {
    setAudience((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate(
      {
        id: editing?.id ?? null,
        data: {
          severity,
          title: title.trim(),
          body: body.trim(),
          audience_roles: audience,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          status,
        },
      },
      { onSuccess: onDone },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5"
    >
      <h3 className="text-[14px] font-semibold text-[var(--color-ink)]">
        {editing ? 'Editează anunțul' : 'Anunț nou'}
      </h3>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          Severitate
          <select
            className="select select-sm"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as AnnouncementInSeverity)}
          >
            {Object.values(AnnouncementInSeverity).map((value) => (
              <option key={value} value={value}>
                {SEVERITY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          Stare
          <select
            className="select select-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as AnnouncementInStatus)}
          >
            <option value={AnnouncementInStatus.draft}>Ciornă</option>
            <option value={AnnouncementInStatus.published}>Publicat</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          Începe (opțional)
          <input
            type="datetime-local"
            className="input input-sm"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          Se termină (opțional)
          <input
            type="datetime-local"
            className="input input-sm"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </label>
      </div>
      {windowInvalid && <p className="text-[12px] text-[var(--color-error)]">Sfârșitul trebuie să fie după început.</p>}

      <fieldset className="flex flex-wrap items-center gap-4 text-[13px]">
        <legend className="mb-1 text-[12px] text-[var(--color-ink-muted)]">Cine îl vede</legend>
        {Object.values(AnnouncementInAudienceRolesItem).map((role) => (
          <label key={role} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={audience.includes(role)}
              onChange={() => toggleAudience(role)}
            />
            {AUDIENCE_LABELS[role]}
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
        Titlu
        <input
          type="text"
          className="input input-sm w-full"
          maxLength={TITLE_MAX}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <span className="self-end">
          {title.length} / {TITLE_MAX}
        </span>
      </label>

      <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
        Descriere (text simplu)
        <textarea
          className="textarea textarea-sm w-full"
          rows={5}
          maxLength={BODY_MAX}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <span className="self-end">
          {body.length} / {BODY_MAX}
        </span>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-sm btn-primary" disabled={!canSubmit || save.isPending}>
          {editing ? 'Salvează' : 'Creează'}
        </button>
        {editing && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDone}>
            Renunță
          </button>
        )}
      </div>
    </form>
  )
}

export function AdminAnnouncementsSection() {
  const { data, isLoading } = useAdminAnnouncements()
  const setStatus = useAdminSetAnnouncementStatus()
  const remove = useAdminDeleteAnnouncement()
  const [editing, setEditing] = useState<AdminAnnouncementOut | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const announcements = data?.data ?? []

  function finishForm() {
    setEditing(null)
    setFormKey((key) => key + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Anunțuri</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          Ferestre afișate peste aplicație utilizatorilor din publicul ales, câte una, cele grave întâi. Severitatea
          apare doar ca accent. „Am înțeles” ascunde anunțul definitiv; cele critice nu pot fi ascunse definitiv și
          reapar la reîncărcarea paginii.
        </p>
      </div>

      <AnnouncementForm key={`${editing?.id ?? 'new'}-${formKey}`} editing={editing} onDone={finishForm} />

      {isLoading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Stare</th>
                <th>Severitate</th>
                <th>Titlu</th>
                <th>Public</th>
                <th>Interval</th>
                <th>Ascunse de</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--color-ink-muted)]">
                    Niciun anunț încă.
                  </td>
                </tr>
              )}
              {announcements.map((announcement) => (
                <tr key={announcement.id}>
                  <td>
                    <span className={`badge badge-sm badge-soft ${STATE_BADGE[announcement.state]}`}>
                      {STATE_LABELS[announcement.state]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-sm badge-soft ${SEVERITY_BADGE[announcement.severity]}`}>
                      {SEVERITY_LABELS[announcement.severity]}
                    </span>
                  </td>
                  <td className="max-w-[320px] truncate" title={announcement.body}>
                    {announcement.title}
                  </td>
                  <td>{announcement.audience_roles.map((role) => AUDIENCE_LABELS[role]).join(', ')}</td>
                  <td className="whitespace-nowrap text-[12px]">{windowLabel(announcement)}</td>
                  <td>{announcement.dismissed_count}</td>
                  <td className="whitespace-nowrap">
                    <div className="flex gap-1">
                      <button type="button" className="btn btn-xs btn-ghost" onClick={() => setEditing(announcement)}>
                        Editează
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        disabled={setStatus.isPending}
                        onClick={() =>
                          setStatus.mutate({
                            id: announcement.id,
                            status: announcement.status === 'published' ? 'draft' : 'published',
                          })
                        }
                      >
                        {announcement.status === 'published' ? 'Retrage' : 'Publică'}
                      </button>
                      {confirmDeleteId === announcement.id ? (
                        <button
                          type="button"
                          className="btn btn-xs btn-error"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(announcement.id, { onSettled: () => setConfirmDeleteId(null) })}
                        >
                          Confirmă ștergerea
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost text-[var(--color-error)]"
                          onClick={() => setConfirmDeleteId(announcement.id)}
                        >
                          Șterge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
