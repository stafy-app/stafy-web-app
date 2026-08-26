import { useMemo, useState } from 'react'
import { PDFViewer, pdf } from '@react-pdf/renderer'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useTeamMembers } from '@stafy/hooks/useTeamMembers'
import { useEmployeeReport, useSetReportBonus, useClearReportBonus } from '@stafy/hooks/useReports'
import { useEmployeeTimeEntries } from '@stafy/hooks/useEmployeeTimeEntries'
import { getAdjacentPeriod, getCurrentPeriod } from '@stafy/utils/period'
import { PeriodBar } from '@stafy/components/dashboard/PeriodBar'
import { ReportEmployeePicker } from '@stafy/components/reports/ReportEmployeePicker'
import { BonusCard } from '@stafy/components/reports/BonusCard'
import { ReportDocument } from '@stafy/components/reports/ReportDocument'
import { showToast } from '@stafy/lib/toast'
import { ICONS } from '@stafy/lib/icons'

export default function ReportsPage() {
  useTopBar({ title: 'Rapoarte', subtitle: 'Export și rapoarte lunare' })

  const [period, setPeriod] = useState(getCurrentPeriod)
  const current = getCurrentPeriod()
  const isCurrentMonth = period.year === current.year && period.month === current.month

  const { data: teamData } = useTeamMembers(period.year, period.month)
  const members = useMemo(() => teamData?.data ?? [], [teamData])

  // No employee explicitly picked yet this session -> default to the roster's first
  // entry, computed at render time (not an effect) so switching months/employees
  // never needs a synchronizing setState.
  const [pickedEmployeeId, setPickedEmployeeId] = useState<number | null>(null)
  const selectedEmployeeId = pickedEmployeeId ?? members[0]?.user.id ?? null
  const hasEmployee = selectedEmployeeId !== null

  const [includeTimeEntries, setIncludeTimeEntries] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: report } = useEmployeeReport(selectedEmployeeId ?? 0, period.year, period.month, hasEmployee)
  const { data: timeEntriesData } = useEmployeeTimeEntries(
    selectedEmployeeId ?? 0,
    period.year,
    period.month,
    undefined,
    hasEmployee && includeTimeEntries,
  )
  const timeEntries = useMemo(() => timeEntriesData?.data ?? [], [timeEntriesData])

  const setBonusMutation = useSetReportBonus(selectedEmployeeId ?? 0, period.year, period.month)
  const clearBonusMutation = useClearReportBonus(selectedEmployeeId ?? 0, period.year, period.month)

  function goToPrevMonth() {
    setPeriod((p) => getAdjacentPeriod(p, -1))
  }

  function goToNextMonth() {
    setPeriod((p) => getAdjacentPeriod(p, 1))
  }

  async function handleDownload() {
    if (!report) return
    setIsDownloading(true)
    try {
      const blob = await pdf(
        <ReportDocument report={report} includeTimeEntries={includeTimeEntries} timeEntries={timeEntries} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `RA-${report.employee.last_name ?? 'angajat'}-${period.year}-${String(period.month).padStart(2, '0')}.pdf`
      link.click()
      // Deferred, not synchronous — revoking the object URL immediately after click() is
      // browser-timing-dependent and can cancel the download before it actually starts.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('PDF descărcat.')
    } catch {
      showToast('Nu s-a putut genera PDF-ul.', { tone: 'danger' })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-[1280px] gap-6">
      <div className="sticky top-6 flex w-[300px] flex-shrink-0 flex-col gap-4 self-start">
        <PeriodBar
          year={period.year}
          month={period.month}
          isCurrentMonth={isCurrentMonth}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
          onJumpToCurrent={() => setPeriod(getCurrentPeriod())}
          onJumpToMonth={(year, month) => setPeriod({ year, month })}
        />

        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
            Angajat
          </div>
          <ReportEmployeePicker
            members={members}
            selectedEmployeeId={selectedEmployeeId}
            onSelect={setPickedEmployeeId}
          />
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={includeTimeEntries}
              onChange={(e) => setIncludeTimeEntries(e.target.checked)}
              className="checkbox checkbox-sm mt-0.5"
            />
            <div>
              <div className="text-[13px] font-medium text-[var(--color-ink)]">Include listă pontaje</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
                Adaugă tabelul detaliat cu toate pontajele lunii în raport.
              </div>
            </div>
          </label>
        </div>

        <BonusCard
          key={`${selectedEmployeeId}-${period.year}-${period.month}`}
          bonus={report?.bonus}
          onSave={(amount, reason) => setBonusMutation.mutate({ amount, reason })}
          onClear={() => clearBonusMutation.mutate()}
        />

        <button
          type="button"
          onClick={handleDownload}
          disabled={!report || isDownloading}
          className="btn btn-primary w-full gap-2"
        >
          {isDownloading ? (
            <ICONS.loading className="h-4 w-4 animate-spin" />
          ) : (
            <ICONS.download className="h-4 w-4" />
          )}
          Descarcă PDF
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
          Previzualizare PDF · A4
        </div>
        {/* Forced to A4's exact aspect ratio (210:297). PDFViewer is an <iframe> into the
            browser's own PDF viewer — if the box it fills isn't A4-shaped, that viewer
            letterboxes the page and paints its own (dark) background in the leftover space.
            Matching the ratio exactly leaves nothing for the browser to paint around it.
            No height cap and no nested scroll container here — AppLayout's <main> is
            already the page's one scrollable region (`overflow-y-auto`); a tall preview
            just makes the whole Reports page scroll, same as any other tall page content. */}
        <div
          className={`mx-auto w-full overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-md)] ${
            isDownloading ? 'animate-document-pulse' : ''
          }`}
          style={{ maxWidth: 760, aspectRatio: '210 / 297' }}
        >
          {report ? (
            // `style` is typed to react-pdf's own document Style (not DOM CSSProperties),
            // even though it's spread straight onto the <iframe> at runtime — use
            // `className` instead, which is a plain string, to size/border it via Tailwind.
            <PDFViewer showToolbar={false} className="block h-full w-full border-0">
              <ReportDocument report={report} includeTimeEntries={includeTimeEntries} timeEntries={timeEntries} />
            </PDFViewer>
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--color-surface)] text-[13px] text-[var(--color-ink-muted)]">
              Selectează un angajat pentru a genera raportul.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
