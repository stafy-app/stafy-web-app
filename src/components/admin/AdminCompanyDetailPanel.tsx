import { useState, type FormEvent } from 'react'
import { useAdminCompany, useAdminCompanyMembers, useAdminSetCompanyNotes } from '@stafy/hooks/useAdmin'
import { formatPlanDate } from '@stafy/utils/planLabels'

const MEMBERS_PAGE_SIZE = 25

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  employee: 'Angajat',
}

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'short', timeStyle: 'short' })

const LABEL_CLASS = 'text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink-muted)]'

interface AdminCompanyNotesEditorProps {
  companyId: number
  initialNote: string
  initialTags: string[]
  updatedAt: string | null
  updatedBy: string | null
}

function AdminCompanyNotesEditor({
  companyId,
  initialNote,
  initialTags,
  updatedAt,
  updatedBy,
}: AdminCompanyNotesEditorProps) {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <h4 className="text-[13px] font-semibold text-[var(--color-ink)]">Notă internă și etichete</h4>
      <p className="text-[12px] text-[var(--color-ink-muted)]">
        Vizibile doar în consola de admin, niciodată companiei.
      </p>
      <textarea
        className="textarea textarea-sm w-full"
        rows={3}
        maxLength={2000}
        placeholder="Ex.: pilot din octombrie, contact principal Maria, vrea export CSV"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <input
        className="input input-sm w-full"
        placeholder="Etichete separate prin virgulă (max 10, câte 30 de caractere)"
        value={tagsText}
        onChange={(event) => setTagsText(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-sm btn-primary" disabled={setNotes.isPending}>
          Salvează
        </button>
        {updatedAt && (
          <span className="text-[11px] text-[var(--color-ink-muted)]">
            Actualizat {dateTimeFormatter.format(new Date(updatedAt))}
            {updatedBy ? ` de ${updatedBy}` : ''}
          </span>
        )}
      </div>
    </form>
  )
}

export function AdminCompanyDetailPanel({ companyId }: { companyId: number }) {
  const { data: company } = useAdminCompany(companyId)
  const [membersPage, setMembersPage] = useState(1)
  const { data: members } = useAdminCompanyMembers(companyId, { page: membersPage, page_size: MEMBERS_PAGE_SIZE })

  if (!company) return <span className="loading loading-spinner loading-sm" />

  const memberRows = members?.data ?? []
  const membersTotal = members?.total ?? 0
  const memberPages = Math.max(1, Math.ceil(membersTotal / MEMBERS_PAGE_SIZE))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1">
        {company.admin_tags.map((tag) => (
          <span key={tag} className="badge badge-sm badge-soft badge-primary">
            {tag}
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
        <div>
          <dt className={LABEL_CLASS}>Contact owner</dt>
          <dd>
            {company.owner_name} ·{' '}
            <a className="link link-primary" href={`mailto:${company.owner_email}`}>
              {company.owner_email}
            </a>
          </dd>
        </div>
        <div>
          <dt className={LABEL_CLASS}>Locație</dt>
          <dd>{[company.city, company.address].filter(Boolean).join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className={LABEL_CLASS}>Creată</dt>
          <dd>{formatPlanDate(company.created_at)}</dd>
        </div>
        <div>
          <dt className={LABEL_CLASS}>Onboarding</dt>
          <dd>{company.onboarded_at ? formatPlanDate(company.onboarded_at) : 'Nefinalizat'}</dd>
        </div>
        <div>
          <dt className={LABEL_CLASS}>Ultima activitate</dt>
          <dd>{company.last_activity_at ? formatPlanDate(company.last_activity_at) : '—'}</dd>
        </div>
        <div>
          <dt className={LABEL_CLASS}>Fus orar</dt>
          <dd>{company.timezone}</dd>
        </div>
      </dl>

      <AdminCompanyNotesEditor
        key={company.admin_note_updated_at ?? 'never'}
        companyId={companyId}
        initialNote={company.admin_note ?? ''}
        initialTags={company.admin_tags}
        updatedAt={company.admin_note_updated_at}
        updatedBy={company.admin_note_updated_by}
      />

      <div className="flex flex-col gap-2">
        <h4 className="text-[13px] font-semibold text-[var(--color-ink)]">Membri ({membersTotal})</h4>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Funcție</th>
                <th>Stare</th>
                <th>Din</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((member) => (
                <tr key={member.user_id}>
                  <td className="font-medium">{member.name}</td>
                  <td>{member.email}</td>
                  <td>{ROLE_LABELS[member.company_role] ?? member.company_role}</td>
                  <td>{member.job_title ?? '—'}</td>
                  <td>
                    <span
                      className={`badge badge-sm badge-soft ${member.is_active ? 'badge-success' : 'badge-warning'}`}
                    >
                      {member.is_active ? 'Activ' : 'Suspendat'}
                    </span>
                  </td>
                  <td>{formatPlanDate(member.joined_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {memberPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-xs btn-outline"
              disabled={membersPage <= 1}
              onClick={() => setMembersPage(membersPage - 1)}
            >
              Înapoi
            </button>
            <span className="text-[12px] text-[var(--color-ink-muted)]">
              Pagina {membersPage} din {memberPages}
            </span>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              disabled={membersPage >= memberPages}
              onClick={() => setMembersPage(membersPage + 1)}
            >
              Înainte
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
