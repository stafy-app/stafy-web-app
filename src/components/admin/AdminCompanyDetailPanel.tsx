import { Fragment, useState, type FormEvent } from 'react'
import {
  useAdminCompany,
  useAdminCompanyMembers,
  useAdminSetCompanyNotes,
  useAdminSetCompanyRestriction,
  useAdminSetUserBlocked,
} from '@stafy/hooks/useAdmin'
import type { AdminCompanyDetailOut } from '@stafy/api/generated/endpoints/index.schemas'
import { ADMIN_CONTROL, AdminDetailList } from '@stafy/components/admin/ui/AdminField'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { AdminLoading, AdminPager, AdminTable } from '@stafy/components/admin/ui/AdminTable'
import { StatusDot } from '@stafy/components/admin/ui/StatusDot'
import { formatPlanDate } from '@stafy/utils/planLabels'

const MEMBERS_PAGE_SIZE = 25

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  employee: 'Angajat',
}

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'short', timeStyle: 'short' })

const FIELD_CLASS = ADMIN_CONTROL

interface NotesEditorProps {
  companyId: number
  initialNote: string
  initialTags: string[]
  updatedAt: string | null
  updatedBy: string | null
}

function NotesEditor({ companyId, initialNote, initialTags, updatedAt, updatedBy }: NotesEditorProps) {
  const setNotes = useAdminSetCompanyNotes(companyId)
  const [note, setNote] = useState(initialNote)
  const [tagsText, setTagsText] = useState(initialTags.join(', '))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setNotes.mutate({
      note: note.trim() || null,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        className={`textarea w-full ${FIELD_CLASS}`}
        rows={4}
        maxLength={2000}
        aria-label="Notă internă"
        placeholder="Ex.: pilot din octombrie, contact principal Maria, vrea export CSV"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <input
        className={`input w-full ${FIELD_CLASS}`}
        aria-label="Etichete"
        placeholder="Etichete separate prin virgulă (cel mult 10, câte 30 de caractere)"
        value={tagsText}
        onChange={(event) => setTagsText(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary btn-sm" disabled={setNotes.isPending}>
          Salvează
        </button>
        {updatedAt && (
          <span className="text-[13px] text-[var(--color-ink-soft)]">
            Actualizat {dateTimeFormatter.format(new Date(updatedAt))}
            {updatedBy ? ` de ${updatedBy}` : ''}
          </span>
        )}
      </div>
    </form>
  )
}

/** Prezentare: who the company is, then the internal note (never shown to the company). */
export function CompanyOverviewTab({ companyId }: { companyId: number }) {
  const { data: company } = useAdminCompany(companyId)
  if (!company) return <AdminLoading />

  return (
    <>
      <AdminSheet>
        <AdminSheetSection title="Despre companie">
          <AdminDetailList
            items={[
              {
                label: 'Contact owner',
                value: (
                  <>
                    {company.owner_name},{' '}
                    <a className="link link-primary" href={`mailto:${company.owner_email}`}>
                      {company.owner_email}
                    </a>
                  </>
                ),
              },
              { label: 'Locație', value: [company.city, company.address].filter(Boolean).join(', ') || '—' },
              { label: 'Creată', value: formatPlanDate(company.created_at) },
              {
                label: 'Onboarding',
                value: company.onboarded_at ? formatPlanDate(company.onboarded_at) : 'Nefinalizat',
              },
              {
                label: 'Ultima activitate',
                value: company.last_activity_at ? formatPlanDate(company.last_activity_at) : '—',
              },
              { label: 'Fus orar', value: company.timezone },
              {
                label: 'Etichete',
                value: company.admin_tags.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {company.admin_tags.map((tag) => (
                      <span key={tag} className="badge badge-soft badge-primary">
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : (
                  '—'
                ),
              },
            ]}
          />
        </AdminSheetSection>

        <AdminSheetSection
          title="Notă internă și etichete"
          caption="Se văd doar în consola de admin, niciodată de companie."
        >
          <NotesEditor
            key={company.admin_note_updated_at ?? 'never'}
            companyId={companyId}
            initialNote={company.admin_note ?? ''}
            initialTags={company.admin_tags}
            updatedAt={company.admin_note_updated_at}
            updatedBy={company.admin_note_updated_by}
          />
        </AdminSheetSection>
      </AdminSheet>
    </>
  )
}

/** Membri: the live roster; blocking an account opens a full-width reason row under the member. */
export function CompanyMembersTab({ companyId }: { companyId: number }) {
  const [page, setPage] = useState(1)
  const { data: members } = useAdminCompanyMembers(companyId, { page, page_size: MEMBERS_PAGE_SIZE })
  const setBlocked = useAdminSetUserBlocked(companyId)
  const [target, setTarget] = useState<{ userId: number; blocked: boolean } | null>(null)
  const [reason, setReason] = useState('')

  if (!members) return <AdminLoading />

  const rows = members.data
  const pages = Math.max(1, Math.ceil(members.total / MEMBERS_PAGE_SIZE))

  function closeForm() {
    setTarget(null)
    setReason('')
  }

  return (
    <AdminSheet>
      <AdminSheetSection
        title={`Membri (${members.total})`}
        caption="Cei activi acum în companie. Blocarea unui cont îl oprește în toate companiile."
        flush
      >
        <AdminTable>
          <thead>
            <tr>
              <th>Nume</th>
              <th>Rol</th>
              <th className="max-sm:hidden">Funcție</th>
              <th>Stare</th>
              <th className="max-sm:hidden">Din</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => (
              <Fragment key={member.user_id}>
                <tr>
                  <td className="max-w-[300px]">
                    {/* Email under the name on phones, beside it from sm up. */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                      <span className="shrink-0 font-medium text-[var(--color-ink)]">{member.name}</span>
                      <span className="max-w-[40vw] truncate text-[12px] text-[var(--color-ink-soft)] sm:max-w-none">
                        {member.email}
                      </span>
                    </div>
                  </td>
                  <td>{ROLE_LABELS[member.company_role] ?? member.company_role}</td>
                  <td className="max-sm:hidden">{member.job_title ?? '—'}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <StatusDot tone={member.is_active ? 'success' : 'warning'}>
                        {member.is_active ? 'Activ' : 'Suspendat'}
                      </StatusDot>
                      {member.blocked && <StatusDot tone="error">Cont blocat</StatusDot>}
                    </div>
                  </td>
                  <td className="tabular-nums max-sm:hidden">{formatPlanDate(member.joined_at)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        setReason('')
                        setTarget({ userId: member.user_id, blocked: !member.blocked })
                      }}
                    >
                      {member.blocked ? 'Deblochează' : 'Blochează'}
                    </button>
                  </td>
                </tr>
                {target?.userId === member.user_id && (
                  <tr>
                    <td colSpan={6} className="bg-[var(--color-surface-2)]">
                      <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(event) => {
                          event.preventDefault()
                          setBlocked.mutate(
                            { userId: member.user_id, blocked: target.blocked, data: { reason: reason.trim() } },
                            { onSuccess: closeForm },
                          )
                        }}
                      >
                        <span className="text-[13px] text-[var(--color-ink)] max-sm:basis-full">
                          {target.blocked
                            ? `${member.name} nu va mai putea folosi Stafy în nicio companie.`
                            : `${member.name} va putea folosi din nou Stafy.`}
                        </span>
                        <input
                          className="input input-sm min-w-0 flex-1 rounded-[var(--radius-lg)] max-sm:basis-full sm:min-w-[240px]"
                          autoFocus
                          maxLength={500}
                          aria-label="Motiv"
                          placeholder="Motiv (obligatoriu, intră în audit)"
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                        />
                        <button
                          type="submit"
                          className={`btn btn-sm ${target.blocked ? 'btn-error' : 'btn-primary'}`}
                          disabled={!reason.trim() || setBlocked.isPending}
                        >
                          {target.blocked ? 'Blochează contul' : 'Deblochează contul'}
                        </button>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={closeForm}>
                          Renunță
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </AdminTable>
        <AdminPager page={page} pageCount={pages} onPage={setPage} />
      </AdminSheetSection>
    </AdminSheet>
  )
}

const RESTRICTION_LABELS: Record<string, string> = {
  read_only: 'Doar citire',
  suspended: 'Suspendată',
}

const RESTRICTION_ACTIONS = [
  {
    value: 'read_only',
    label: 'Pune în doar citire',
    button: 'Aplică',
    hint: 'Echipa poate ponta în continuare, dar nu se mai pot face alte modificări.',
  },
  {
    value: 'suspended',
    label: 'Suspendă compania',
    button: 'Suspendă',
    hint: 'Nimeni din companie nu se mai poate conecta până o reactivezi.',
  },
] as const

function RestrictionControl({ company }: { company: AdminCompanyDetailOut }) {
  const setRestriction = useAdminSetCompanyRestriction(company.company_id)
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()

  function apply(restriction: 'read_only' | 'suspended' | null) {
    setRestriction.mutate({ restriction, reason: trimmed }, { onSuccess: () => setReason('') })
  }

  return (
    <div className="flex flex-col gap-4">
      {company.restriction ? (
        <div className="text-[14px]">
          <StatusDot tone="error">
            {RESTRICTION_LABELS[company.restriction]}
            {company.restricted_at && ` din ${dateTimeFormatter.format(new Date(company.restricted_at))}`}
          </StatusDot>
          {company.restriction_reason && (
            <div className="mt-1 text-[var(--color-ink-soft)]">Motiv: {company.restriction_reason}</div>
          )}
        </div>
      ) : (
        <StatusDot tone="success">Fără restricții</StatusDot>
      )}

      <input
        className={`input w-full ${FIELD_CLASS}`}
        maxLength={500}
        aria-label="Motiv"
        placeholder="Motiv (obligatoriu, intră în audit)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      {company.restriction ? (
        <div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!trimmed || setRestriction.isPending}
            onClick={() => apply(null)}
          >
            Ridică restricția
          </button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--color-hairline)]">
          {RESTRICTION_ACTIONS.map((action) => (
            <li
              key={action.value}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="max-w-md">
                <div className="text-[14px] font-medium text-[var(--color-ink)]">{action.label}</div>
                <div className="text-[13px] text-[var(--color-ink-soft)]">{action.hint}</div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline btn-error"
                disabled={!trimmed || setRestriction.isPending}
                onClick={() => apply(action.value)}
              >
                {action.button}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Acces: the risky actions, kept apart from the everyday tabs. */
export function CompanyAccessTab({ companyId }: { companyId: number }) {
  const { data: company } = useAdminCompany(companyId)
  if (!company) return <AdminLoading />

  return (
    <AdminSheet>
      <AdminSheetSection
        title="Restricții de acces"
        caption="Acțiuni cu efect imediat pentru toți membrii. Motivul e obligatoriu și rămâne în audit, nu se vede de companie."
      >
        <RestrictionControl company={company} />
      </AdminSheetSection>
    </AdminSheet>
  )
}
