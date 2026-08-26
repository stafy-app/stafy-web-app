import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
import type { EmployeeReportOut, TimeEntryOut } from '@stafy/api/generated/endpoints/index.schemas'
import interLatinRegular from '@fontsource/inter/files/inter-latin-400-normal.woff?url'
import interLatinBold from '@fontsource/inter/files/inter-latin-700-normal.woff?url'
import interLatinItalic from '@fontsource/inter/files/inter-latin-400-italic.woff?url'
import interLatinBoldItalic from '@fontsource/inter/files/inter-latin-700-italic.woff?url'
import interLatinExtRegular from '@stafy/assets/fonts/inter-latin-ext-400-normal.woff?url'
import interLatinExtBold from '@stafy/assets/fonts/inter-latin-ext-700-normal.woff?url'
import interLatinExtItalic from '@stafy/assets/fonts/inter-latin-ext-400-italic.woff?url'
import interLatinExtBoldItalic from '@stafy/assets/fonts/inter-latin-ext-700-italic.woff?url'

// react-pdf's built-in base-14 fonts (Helvetica, Courier) use WinAnsi encoding, which has no
// Romanian diacritics (ă, â, î, ș, ț) at all — they silently drop from the rendered PDF.
// Two separate Inter families are registered — `latin` (digits, base punctuation, plain
// letters) and `latin-ext` (ă/â/î/ș/ț only, nothing else) — because @fontsource ships them as
// disjoint subsets. `page.fontFamily` below is set to `['InterLatin', 'InterLatinExt']`; react-pdf
// resolves glyphs per-run across that stack (falling back further to Helvetica for anything
// neither covers), so combining the two gives full coverage without hand-splitting text.
//
// The `latin-ext` files come from `src/assets/fonts/`, NOT `@fontsource/inter` directly — they
// are byte-patched copies of the upstream files, with ONLY their internal `name` table changed
// (postScriptName/fullName/family "Inter" -> "IntrX", nothing else touched: same glyphs, same
// cmap, same numGlyphs). This is required, not cosmetic: @fontsource's `latin` and `latin-ext`
// subset files for the same weight both self-report the identical internal PostScript name
// (e.g. both "Inter-Bold"). `@react-pdf/pdfkit`'s font embedder caches/dedupes embedded fonts by
// that internal name (`FontsMixin.font()` in `@react-pdf/pdfkit`, the `this._fontFamilies[this._font.name]`
// check) — so once the `latin` file is embedded under "Inter-Bold", the `latin-ext` file silently
// reuses that SAME embedded font object instead of being embedded at all, and every diacritic
// glyph gets drawn from `latin`'s (diacritic-free) glyph table using the wrong glyph index —
// rendering as a garbage character, not a blank/missing one. Renaming just the `latin-ext`
// copy's internal name breaks the collision. Registered as .woff, not .woff2 — react-pdf/
// fontkit's WOFF2 path is unreliable and throws "RangeError: Offset is outside the bounds of
// the DataView" on embed; plain WOFF is the supported, stable format.
Font.register({
  family: 'InterLatin',
  fonts: [
    { src: interLatinRegular, fontWeight: 'normal', fontStyle: 'normal' },
    { src: interLatinBold, fontWeight: 'bold', fontStyle: 'normal' },
    { src: interLatinItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: interLatinBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
  ],
})
Font.register({
  family: 'InterLatinExt',
  fonts: [
    { src: interLatinExtRegular, fontWeight: 'normal', fontStyle: 'normal' },
    { src: interLatinExtBold, fontWeight: 'bold', fontStyle: 'normal' },
    { src: interLatinExtItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: interLatinExtBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
  ],
})

interface ReportDocumentProps {
  report: EmployeeReportOut
  includeTimeEntries: boolean
  timeEntries: TimeEntryOut[]
}

const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateFormat = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 40,
    // Wider than the top/side padding on purpose — reserves room for the fixed footer so
    // content flowing near the bottom of a page never overlaps it (see `footer` below).
    paddingBottom: 70,
    fontFamily: ['InterLatin', 'InterLatinExt'],
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },
  headerMastheadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // flex-start, not center: several of these rows pair a two-line field (label + subtext)
    // on one side with a single-line field on the other — center would misalign their baselines.
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerRowLast: {
    marginBottom: 0,
  },
  headerFieldGroup: {
    flex: 1,
  },
  headerFieldGroupRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldText: {
    fontSize: 10,
  },
  fieldLabel: {
    fontWeight: 'bold',
  },
  fieldSub: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
  },
  label: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
  },
  summaryCol: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: 'Courier-Bold',
    marginTop: 4,
  },
  summaryNote: {
    fontSize: 8,
    fontFamily: 'Courier',
    fontStyle: 'italic',
    color: '#444444',
    marginTop: 3,
  },
  table: {
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingVertical: 5,
  },
  tableTotalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 6,
    marginTop: 2,
  },
  th: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#666666',
  },
  // Monospace, applied only to numeric value cells — never to `th` header labels, which are
  // plain text (e.g. "Durată", "Sumă") and need the Inter stack for their diacritics. Courier
  // is one of react-pdf's built-in base-14 fonts and has no Romanian-diacritic glyphs at all.
  mono: {
    fontFamily: 'Courier',
  },
  colActivity: { flex: 3 },
  colHours: { flex: 1, textAlign: 'right' },
  colRate: { flex: 1.4, textAlign: 'right' },
  colTotal: { flex: 1.4, textAlign: 'right' },
  bonusLabel: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 11,
    fontFamily: 'Courier-Bold',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  attColDate: { flex: 1.6 },
  attColTime: { flex: 1.3 },
  attColActivity: { flex: 1.6 },
  attColDuration: { flex: 1, textAlign: 'right' },
  attColRate: { flex: 1.2, textAlign: 'right' },
  attColAmount: { flex: 1.3, textAlign: 'right' },
  signatureBlock: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    width: 160,
    marginTop: 40,
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    fontSize: 8,
    color: '#999999',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerNote: {
    marginBottom: 2,
  },
})

// Bump when the template's layout/fields change, so past PDFs stay identifiable by format.
const TEMPLATE_VERSION = 'v1.0'

function reportRef(employeeId: number, generatedAt: string): string {
  // UTC, not local getters — this code is a stable identifier for one generation instant,
  // cited by accounting; it must not change depending on the browser's timezone.
  const d = new Date(generatedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `RA-${employeeId}-${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`
}

interface TimeEntryRow {
  entry: TimeEntryOut
  start: Date
  end: Date
  hours: number
  rate: number
  amount: number
}

export function ReportDocument({ report, includeTimeEntries, timeEntries }: ReportDocumentProps) {
  const employeeName = [report.employee.first_name, report.employee.last_name].filter(Boolean).join(' ')
  const managerName = [report.generated_by.first_name, report.generated_by.last_name].filter(Boolean).join(' ')
  const periodStart = new Date(report.year, report.month - 1, 1)
  const periodEnd = new Date(report.year, report.month, 0)
  const periodLabel = `${dateFormat.format(periodStart)} – ${dateFormat.format(periodEnd)}`
  const bonusAmount = report.bonus ? parseFloat(report.bonus.amount) : 0
  const ref = reportRef(report.employee.id ?? 0, report.generated_at)

  const timeEntryRows: TimeEntryRow[] = timeEntries.map((entry) => {
    const start = new Date(entry.time_start)
    const end = new Date(entry.time_end)
    const hours = (end.getTime() - start.getTime()) / 3_600_000
    const rate = parseFloat(entry.rate_applied)
    return { entry, start, end, hours, rate, amount: hours * rate }
  })
  const timeEntriesTotalHours = timeEntryRows.reduce((sum, row) => sum + row.hours, 0)
  const timeEntriesTotalAmount = timeEntryRows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <Document
      title={`Raport de activitate — ${employeeName} — ${periodLabel}`}
      author={managerName}
      subject="Raport de activitate și calcul salarial"
      creator="stafy.ro"
      producer="stafy.ro"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerMastheadRow}>
            <Text style={styles.companyName}>{report.company.name}</Text>
            <Text style={styles.reportTitle}>Raport de activitate</Text>
          </View>
          <View style={styles.headerRow}>
            <View style={styles.headerFieldGroup}>
              {report.company.address && (
                <Text style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>Adresă: </Text>
                  {report.company.address}
                </Text>
              )}
            </View>
            <Text style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Perioadă: </Text>
              {periodLabel}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <View style={styles.headerFieldGroup}>
              <Text style={styles.fieldText}>
                <Text style={styles.fieldLabel}>Angajat: </Text>
                {employeeName}
              </Text>
              <Text style={styles.fieldSub}>{report.employee.email}</Text>
            </View>
            <View style={styles.headerFieldGroupRight}>
              <Text style={styles.fieldText}>
                <Text style={styles.fieldLabel}>Generat de: </Text>
                {managerName}
              </Text>
              <Text style={styles.fieldSub}>{report.generated_by.email}</Text>
            </View>
          </View>
          <View style={[styles.headerRow, styles.headerRowLast]}>
            <Text style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Funcție: </Text>
              {report.employee.job_title ?? '—'}
            </Text>
            <Text style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Generat în data: </Text>
              {dateFormat.format(new Date(report.generated_at))}, ora {timeFormat.format(new Date(report.generated_at))}
            </Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryCol}>
            <Text style={styles.label}>Total ore</Text>
            <Text style={styles.summaryValue}>{report.total_hours.toFixed(2)}h</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.label}>Total de plată</Text>
            <Text style={styles.summaryValue}>{ron.format(parseFloat(report.total_pay))} RON</Text>
            {report.bonus && (
              <Text style={styles.summaryNote}>
                {ron.format(parseFloat(report.pay_from_hours))} + bonus {ron.format(bonusAmount)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Defalcare pe activități</Text>
          <View style={styles.tableHeaderRow} fixed>
            <Text style={[styles.th, styles.colActivity]}>Activitate</Text>
            <Text style={[styles.th, styles.colHours]}>Ore</Text>
            <Text style={[styles.th, styles.colRate]}>Tarif</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {report.activity_groups.map((group, i) => (
            <View key={`${group.activity_id}-${group.rate_applied}-${i}`} style={styles.tableRow} wrap={false}>
              <Text style={styles.colActivity}>{group.activity_name}</Text>
              <Text style={[styles.colHours, styles.mono]}>{group.hours.toFixed(2)}h</Text>
              <Text style={[styles.colRate, styles.mono]}>{ron.format(parseFloat(group.rate_applied))} RON</Text>
              <Text style={[styles.colTotal, styles.mono]}>{ron.format(parseFloat(group.subtotal))} RON</Text>
            </View>
          ))}
          {report.bonus && (
            <View style={styles.tableRow} wrap={false}>
              <Text style={[styles.colActivity, styles.bonusLabel]}>• Bonus{report.bonus.reason ? ` — ${report.bonus.reason}` : ''}</Text>
              <Text style={styles.colHours}>—</Text>
              <Text style={styles.colRate}>—</Text>
              <Text style={[styles.colTotal, styles.mono]}>{ron.format(bonusAmount)} RON</Text>
            </View>
          )}
          <View style={styles.tableTotalRow} wrap={false}>
            <Text style={[styles.colActivity, styles.totalLabel]}>Total general</Text>
            <Text style={styles.colHours} />
            <Text style={styles.colRate} />
            <Text style={[styles.colTotal, styles.totalValue]}>{ron.format(parseFloat(report.total_pay))} RON</Text>
          </View>
        </View>

        {includeTimeEntries && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>Listă pontaje</Text>
            <View style={styles.tableHeaderRow} fixed>
              <Text style={[styles.th, styles.attColDate]}>Dată</Text>
              <Text style={[styles.th, styles.attColTime]}>Interval</Text>
              <Text style={[styles.th, styles.attColActivity]}>Activitate</Text>
              <Text style={[styles.th, styles.attColDuration]}>Durată</Text>
              <Text style={[styles.th, styles.attColRate]}>Tarif</Text>
              <Text style={[styles.th, styles.attColAmount]}>Sumă</Text>
            </View>
            {timeEntryRows.map(({ entry, start, end, hours, rate, amount }) => (
              <View key={entry.id} style={styles.tableRow} wrap={false}>
                <Text style={styles.attColDate}>{dateFormat.format(start)}</Text>
                <Text style={[styles.attColTime, styles.mono]}>
                  {timeFormat.format(start)}–{timeFormat.format(end)}
                </Text>
                <Text style={styles.attColActivity}>{entry.activity.activity_name}</Text>
                <Text style={[styles.attColDuration, styles.mono]}>{hours.toFixed(2)}h</Text>
                <Text style={[styles.attColRate, styles.mono]}>{ron.format(rate)} RON</Text>
                <Text style={[styles.attColAmount, styles.mono]}>{ron.format(amount)} RON</Text>
              </View>
            ))}
            <View style={styles.tableTotalRow} wrap={false}>
              <Text style={[styles.attColDate, styles.totalLabel]}>Total</Text>
              <Text style={styles.attColTime} />
              <Text style={styles.attColActivity} />
              <Text style={[styles.attColDuration, styles.mono, styles.totalValue]}>{timeEntriesTotalHours.toFixed(2)}h</Text>
              <Text style={styles.attColRate} />
              <Text style={[styles.attColAmount, styles.mono, styles.totalValue]}>{ron.format(timeEntriesTotalAmount)} RON</Text>
            </View>
          </View>
        )}

        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Semnătura manager</Text>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerNote}>Confidențial — conține date cu caracter personal</Text>
            <Text>Document generat automat de stafy.ro · Format {TEMPLATE_VERSION} · Ref: {ref}</Text>
          </View>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
