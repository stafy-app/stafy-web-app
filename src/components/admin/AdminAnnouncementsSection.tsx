import { useState, type FormEvent } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { AdminModal } from '@stafy/components/admin/AdminModal'
import { ADMIN_CONTROL, AdminField } from '@stafy/components/admin/ui/AdminField'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { AdminPageHeader } from '@stafy/components/admin/ui/AdminPageHeader'
import { StatusDot, type StatusTone } from '@stafy/components/admin/ui/StatusDot'
import { AdminEmptyRow, AdminLoading, AdminTable } from '@stafy/components/admin/ui/AdminTable'
import {
  useAdminAnnouncements,
  useAdminDeleteAnnouncement,
  useAdminSaveAnnouncement,
  useAdminSetAnnouncementStatus,
} from '@stafy/hooks/useAdmin'
import {
  AnnouncementInAudienceRolesItem,
  AnnouncementInKind,
  AnnouncementInSeverity,
  AnnouncementInStatus,
  type AdminAnnouncementOut,
} from '@stafy/api/generated/endpoints/index.schemas'

const TITLE_MAX = 100
const BODY_MAX = 1000
const CTA_LABEL_MAX = 40
const CTA_URL_MAX = 500

const KIND_LABELS: Record<string, string> = {
  announcement: 'Anunț',
  whats_new: 'Noutăți',
}

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Informare',
  warning: 'Avertisment',
  critical: 'Critic',
}

const SEVERITY_TONE: Record<string, StatusTone> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Ciornă',
  scheduled: 'Programat',
  live: 'Activ',
  ended: 'Încheiat',
}

const STATE_TONE: Record<string, StatusTone> = {
  draft: 'neutral',
  scheduled: 'info',
  live: 'success',
  ended: 'neutral',
}

const AUDIENCE_LABELS: Record<string, string> = {
  owner: 'Owneri',
  manager: 'Manageri',
  employee: 'Angajați',
}

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', {
  dateStyle: 'short',
  timeStyle: 'short',
})

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

interface AnnouncementEditorProps {
  editing: AdminAnnouncementOut | null
  onDone: () => void
}

function AnnouncementEditor({ editing, onDone }: AnnouncementEditorProps) {
  const save = useAdminSaveAnnouncement()
  const [kind, setKind] = useState<AnnouncementInKind>(editing?.kind ?? AnnouncementInKind.announcement)
  const [ctaLabel, setCtaLabel] = useState(editing?.cta_label ?? '')
  const [ctaUrl, setCtaUrl] = useState(editing?.cta_url ?? '')
  const [showOnLogin, setShowOnLogin] = useState(editing?.show_on_login ?? false)
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
  const ctaUrlValid = !ctaUrl.trim() || /^(https:\/\/|\/(?!\/))\S+$/.test(ctaUrl.trim())
  const ctaIncomplete = !!ctaLabel.trim() !== !!ctaUrl.trim()
  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    audience.length > 0 &&
    !windowInvalid &&
    ctaUrlValid &&
    !ctaIncomplete

  function toggleAudience(role: AnnouncementInAudienceRolesItem) {
    setAudience((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate(
      {
        id: editing?.id ?? null,
        data: {
          kind,
          cta_label: ctaLabel.trim() || null,
          cta_url: ctaUrl.trim() || null,
          show_on_login: showOnLogin,
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
    <AdminModal
      title={editing ? 'Editează anunțul' : 'Anunț nou'}
      subtitle="Apare ca fereastră peste aplicație, câte unul, cele grave întâi."
      onClose={onDone}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
            Renunță
          </button>
          <button
            type="submit"
            form="announcement-form"
            className="btn btn-primary btn-sm"
            disabled={!canSubmit || save.isPending}
          >
            {editing ? 'Salvează' : 'Creează'}
          </button>
        </>
      }
    >
      <form id="announcement-form" onSubmit={handleSubmit}>
        <AdminSheet>
          <AdminSheetSection title="Conținut">
            <div className="flex flex-col gap-4">
              <AdminField label="Titlu">
                <input
                  type="text"
                  className={`input w-full ${ADMIN_CONTROL}`}
                  maxLength={TITLE_MAX}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <span className="self-end text-[12px] tabular-nums">
                  {title.length} / {TITLE_MAX}
                </span>
              </AdminField>
              <AdminField label="Descriere">
                <textarea
                  className={`textarea w-full ${ADMIN_CONTROL}`}
                  rows={5}
                  maxLength={BODY_MAX}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
                <span className="flex justify-between text-[12px]">
                  <span>Poți folosi **îngroșat**, *cursiv*, liste cu - și [text](https://…).</span>
                  <span className="tabular-nums">
                    {body.length} / {BODY_MAX}
                  </span>
                </span>
              </AdminField>
              <div className="flex flex-wrap gap-4">
                <AdminField label="Tip">
                  <select
                    className={`select ${ADMIN_CONTROL}`}
                    value={kind}
                    onChange={(event) => setKind(event.target.value as AnnouncementInKind)}
                  >
                    {Object.values(AnnouncementInKind).map((value) => (
                      <option key={value} value={value}>
                        {KIND_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="Severitate">
                  <select
                    className={`select ${ADMIN_CONTROL}`}
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as AnnouncementInSeverity)}
                  >
                    {Object.values(AnnouncementInSeverity).map((value) => (
                      <option key={value} value={value}>
                        {SEVERITY_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </AdminField>
              </div>
            </div>
          </AdminSheetSection>

          <AdminSheetSection title="Afișare" caption="Cine îl vede și unde.">
            <div className="flex flex-col gap-4">
              <fieldset className="flex flex-wrap items-center gap-5 text-[14px]">
                <legend className="mb-2 text-[13px] text-[var(--color-ink-soft)]">Cine îl vede</legend>
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
              <label className="flex cursor-pointer items-start gap-2 text-[14px]">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-0.5"
                  checked={showOnLogin}
                  onChange={(event) => setShowOnLogin(event.target.checked)}
                />
                <span>
                  Arată și pe pagina de autentificare
                  <span className="block text-[13px] text-[var(--color-ink-soft)]">
                    Îl vede oricine, și fără cont, indiferent de public.
                  </span>
                </span>
              </label>
            </div>
          </AdminSheetSection>

          <AdminSheetSection title="Buton" caption="Opțional. Completează ambele câmpuri sau niciunul.">
            <div className="flex flex-wrap gap-4">
              <AdminField label="Text buton">
                <input
                  type="text"
                  className={`input ${ADMIN_CONTROL}`}
                  maxLength={CTA_LABEL_MAX}
                  value={ctaLabel}
                  onChange={(event) => setCtaLabel(event.target.value)}
                />
              </AdminField>
              <AdminField label="Link (https://… sau o cale din aplicație, ex. /team)" className="min-w-[260px] flex-1">
                <input
                  type="text"
                  className={`input w-full ${ADMIN_CONTROL}`}
                  maxLength={CTA_URL_MAX}
                  value={ctaUrl}
                  onChange={(event) => setCtaUrl(event.target.value)}
                />
              </AdminField>
            </div>
            {!ctaUrlValid && (
              <p className="mt-2 text-[13px] text-[var(--color-error)]">Linkul trebuie să înceapă cu https:// sau /.</p>
            )}
            {ctaIncomplete && (
              <p className="mt-2 text-[13px] text-[var(--color-error)]">
                Completează și textul, și linkul butonului, sau pe niciunul.
              </p>
            )}
          </AdminSheetSection>

          <AdminSheetSection title="Programare" caption="Ciorna nu se vede nimănui. Intervalul e opțional.">
            <div className="flex flex-wrap gap-4">
              <AdminField label="Stare">
                <select
                  className={`select ${ADMIN_CONTROL}`}
                  value={status}
                  onChange={(event) => setStatus(event.target.value as AnnouncementInStatus)}
                >
                  <option value={AnnouncementInStatus.draft}>Ciornă</option>
                  <option value={AnnouncementInStatus.published}>Publicat</option>
                </select>
              </AdminField>
              <AdminField label="Începe">
                <input
                  type="datetime-local"
                  className={`input ${ADMIN_CONTROL}`}
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </AdminField>
              <AdminField label="Se termină">
                <input
                  type="datetime-local"
                  className={`input ${ADMIN_CONTROL}`}
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </AdminField>
            </div>
            {windowInvalid && (
              <p className="mt-2 text-[13px] text-[var(--color-error)]">Sfârșitul trebuie să fie după început.</p>
            )}
          </AdminSheetSection>
        </AdminSheet>
      </form>
    </AdminModal>
  )
}

export function AdminAnnouncementsSection() {
  const { data, isLoading } = useAdminAnnouncements()
  const setStatus = useAdminSetAnnouncementStatus()
  const remove = useAdminDeleteAnnouncement()
  const [editing, setEditing] = useState<AdminAnnouncementOut | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const announcements = data?.data ?? []

  function openForm(announcement: AdminAnnouncementOut | null) {
    setEditing(announcement)
    setFormOpen(true)
  }

  function finishForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <>
      <AdminPageHeader
        title="Anunțuri"
        subtitle="Mesaje către utilizatori, afișate ca fereastră peste aplicație. „Am înțeles” le ascunde definitiv; cele critice reapar la reîncărcare."
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openForm(null)}>
            Anunț nou
          </button>
        }
      />

      {formOpen && <AnnouncementEditor key={editing?.id ?? 'new'} editing={editing} onDone={finishForm} />}

      <AdminSheet>
        <AdminSheetSection flush>
          {isLoading ? (
            <AdminLoading />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Stare</th>
                  <th>Anunț</th>
                  <th>Public</th>
                  <th>Interval</th>
                  <th className="num">Ascunse de</th>
                  <th aria-hidden />
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 && (
                  <AdminEmptyRow colSpan={6}>Niciun anunț încă. Apasă „Anunț nou” ca să scrii primul.</AdminEmptyRow>
                )}
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="row-link" onClick={() => openForm(announcement)}>
                    <td>
                      <StatusDot tone={STATE_TONE[announcement.state]}>{STATE_LABELS[announcement.state]}</StatusDot>
                    </td>
                    <td className="max-w-[340px]">
                      <div className="truncate font-medium text-[var(--color-ink)]" title={announcement.body}>
                        {announcement.title}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-[var(--color-ink-soft)]">
                        <span>{KIND_LABELS[announcement.kind]}</span>
                        <StatusDot tone={SEVERITY_TONE[announcement.severity]}>
                          {SEVERITY_LABELS[announcement.severity]}
                        </StatusDot>
                        {announcement.show_on_login && <span>Și pe login</span>}
                      </div>
                    </td>
                    <td>{announcement.audience_roles.map((role) => AUDIENCE_LABELS[role]).join(', ')}</td>
                    <td className="whitespace-nowrap text-[12px] text-[var(--color-ink-soft)]">
                      {windowLabel(announcement)}
                    </td>
                    <td className="num">{announcement.dismissed_count}</td>
                    <td className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {confirmDeleteId === announcement.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs btn-error"
                              disabled={remove.isPending}
                              onClick={() =>
                                remove.mutate(announcement.id, {
                                  onSettled: () => setConfirmDeleteId(null),
                                })
                              }
                            >
                              Confirmă ștergerea
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Renunță
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
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
                            <div className="dropdown dropdown-end">
                              <button
                                type="button"
                                tabIndex={0}
                                className="btn btn-xs btn-ghost btn-square"
                                aria-label="Mai multe acțiuni"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              <ul
                                tabIndex={0}
                                className="dropdown-content menu z-10 w-40 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-pop)]"
                              >
                                <li>
                                  <button type="button" onClick={() => openForm(announcement)}>
                                    Editează
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="text-[var(--color-error)]"
                                    onClick={() => setConfirmDeleteId(announcement.id)}
                                  >
                                    Șterge
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </AdminSheetSection>
      </AdminSheet>
    </>
  )
}
