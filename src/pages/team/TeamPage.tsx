import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useTeamMembers } from '@stafy/hooks/useTeamMembers'
import { getCurrentPeriod } from '@stafy/utils/period'
import { exportTeamCsv } from '@stafy/utils/exportTeamCsv'
import { EmployeeCard } from '@stafy/components/team/EmployeeCard'
import { ICONS } from '@stafy/lib/icons'

export default function TeamPage() {
  useTopBar({ title: 'Echipă', subtitle: 'Roster complet al companiei' })
  const navigate = useNavigate()

  const { year, month } = getCurrentPeriod()
  const { data, isLoading } = useTeamMembers(year, month)
  const [search, setSearch] = useState('')

  const filteredMembers = useMemo(() => {
    const members = data?.data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return members

    return members.filter((member) => {
      const haystack = `${member.user.first_name ?? ''} ${member.user.last_name ?? ''} ${member.user.email ?? ''}`
      return haystack.toLowerCase().includes(query)
    })
  }, [data, search])

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-[340px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
          <ICONS.search className="h-4 w-4 flex-shrink-0 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Caută angajat după nume sau email…"
            className="w-full bg-transparent text-[13px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline gap-2"
            onClick={() => exportTeamCsv(data?.data ?? [], year, month)}
          >
            <ICONS.download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary gap-2"
            onClick={() => navigate({ to: '/invitations' })}
          >
            <ICONS.plus className="h-4 w-4" />
            Invită angajat
          </button>
        </div>
      </div>

      {isLoading ? null : filteredMembers.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-sm)]">
          <div className="text-[13px] text-[var(--color-ink-muted)]">
            {search
              ? `Niciun angajat nu se potrivește cu „${search}”.`
              : 'Nu există angajați în companie.'}
          </div>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {filteredMembers.map((member, index) => (
            <EmployeeCard key={member.user.id} member={member} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
