import { Document, Page, View, Text, StyleSheet, Svg, Rect, G, Path, Circle, Line, Font } from '@react-pdf/renderer'
import type { EmployeeReportOut, TimeEntryOut } from '../../api/generated/endpoints/index.schemas'
import interRegular from '@fontsource/inter/files/inter-latin-ext-400-normal.woff?url'
import interBold from '@fontsource/inter/files/inter-latin-ext-700-normal.woff?url'
import interItalic from '@fontsource/inter/files/inter-latin-ext-400-italic.woff?url'
import interBoldItalic from '@fontsource/inter/files/inter-latin-ext-700-italic.woff?url'

// react-pdf's built-in base-14 fonts (Helvetica, Courier) use WinAnsi encoding, which has no
// Romanian diacritics (ă, â, î, ș, ț) at all — they silently drop from the rendered PDF. Inter's
// latin-ext subset covers them. Registered as .woff, not .woff2 — react-pdf/fontkit's WOFF2 path
// is unreliable and throws "RangeError: Offset is outside the bounds of the DataView" on embed;
// plain WOFF is the supported, stable format.
Font.register({
  family: 'Inter',
  fonts: [
    { src: interRegular, fontWeight: 'normal', fontStyle: 'normal' },
    { src: interBold, fontWeight: 'bold', fontStyle: 'normal' },
    { src: interItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: interBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
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

function Logo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect x={0} y={0} width={512} height={512} rx={120} ry={120} fill="#FF6B00" />
      <G transform="translate(256, 256)" fill="none" stroke="white" strokeWidth={45} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M0 -140 L121.2 -70 L121.2 70 L0 140 L-121.2 70 L-121.2 -70 Z" />
        <Circle cx={0} cy={0} r={50} />
        <Line x1={0} y1={50} x2={0} y2={140} />
        <Line x1={43.3} y1={-25} x2={121.2} y2={-70} />
        <Line x1={-43.3} y1={-25} x2={-121.2} y2={-70} />
      </G>
    </Svg>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  colActivity: { flex: 3 },
  colHours: { flex: 1, textAlign: 'right', fontFamily: 'Courier' },
  colRate: { flex: 1.4, textAlign: 'right', fontFamily: 'Courier' },
  colTotal: { flex: 1.4, textAlign: 'right', fontFamily: 'Courier' },
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
  attColTime: { flex: 1.3, fontFamily: 'Courier' },
  attColActivity: { flex: 1.6 },
  attColDuration: { flex: 1, textAlign: 'right', fontFamily: 'Courier' },
  attColRate: { flex: 1.2, textAlign: 'right', fontFamily: 'Courier' },
  attColAmount: { flex: 1.3, textAlign: 'right', fontFamily: 'Courier' },
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
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    fontSize: 8,
    color: '#999999',
  },
})

export function ReportDocument({ report, includeTimeEntries, timeEntries }: ReportDocumentProps) {
  const employeeName = [report.employee.first_name, report.employee.last_name].filter(Boolean).join(' ')
  const managerName = [report.generated_by.first_name, report.generated_by.last_name].filter(Boolean).join(' ')
  const periodStart = new Date(report.year, report.month - 1, 1)
  const periodEnd = new Date(report.year, report.month, 0)
  const periodLabel = `${dateFormat.format(periodStart)} – ${dateFormat.format(periodEnd)}`
  const bonusAmount = report.bonus ? parseFloat(report.bonus.amount) : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Logo size={28} />
            <Text style={styles.reportTitle}>Raport de activitate</Text>
          </View>
          <View style={styles.headerRow}>
            <View style={styles.headerFieldGroup}>
              <Text style={styles.fieldText}>
                <Text style={styles.fieldLabel}>Companie: </Text>
                {report.company.name}
              </Text>
              {report.company.address && <Text style={styles.fieldSub}>{report.company.address}</Text>}
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
            <Text style={styles.summaryValue}>{report.total_hours.toFixed(1)}h</Text>
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
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colActivity]}>Activitate</Text>
            <Text style={[styles.th, styles.colHours]}>Ore</Text>
            <Text style={[styles.th, styles.colRate]}>Tarif</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {report.activity_groups.map((group, i) => (
            <View key={`${group.activity_id}-${group.rate_applied}-${i}`} style={styles.tableRow}>
              <Text style={styles.colActivity}>{group.activity_name}</Text>
              <Text style={styles.colHours}>{group.hours.toFixed(1)}h</Text>
              <Text style={styles.colRate}>{ron.format(parseFloat(group.rate_applied))} RON</Text>
              <Text style={styles.colTotal}>{ron.format(parseFloat(group.subtotal))} RON</Text>
            </View>
          ))}
          {report.bonus && (
            <View style={styles.tableRow}>
              <Text style={[styles.colActivity, styles.bonusLabel]}>★ Bonus{report.bonus.reason ? ` — ${report.bonus.reason}` : ''}</Text>
              <Text style={styles.colHours}>—</Text>
              <Text style={styles.colRate}>—</Text>
              <Text style={styles.colTotal}>{ron.format(bonusAmount)} RON</Text>
            </View>
          )}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.colActivity, styles.totalLabel]}>Total general</Text>
            <Text style={styles.colHours} />
            <Text style={styles.colRate} />
            <Text style={[styles.colTotal, styles.totalValue]}>{ron.format(parseFloat(report.total_pay))} RON</Text>
          </View>
        </View>

        {includeTimeEntries && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>Listă pontaje</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.attColDate]}>Dată</Text>
              <Text style={[styles.th, styles.attColTime]}>Interval</Text>
              <Text style={[styles.th, styles.attColActivity]}>Activitate</Text>
              <Text style={[styles.th, styles.attColDuration]}>Durată</Text>
              <Text style={[styles.th, styles.attColRate]}>Tarif</Text>
              <Text style={[styles.th, styles.attColAmount]}>Sumă</Text>
            </View>
            {timeEntries.map((entry) => {
              const start = new Date(entry.time_start)
              const end = new Date(entry.time_end)
              const hours = (end.getTime() - start.getTime()) / 3_600_000
              const rate = parseFloat(entry.rate_applied)
              return (
                <View key={entry.id} style={styles.tableRow}>
                  <Text style={styles.attColDate}>{dateFormat.format(start)}</Text>
                  <Text style={styles.attColTime}>
                    {timeFormat.format(start)}–{timeFormat.format(end)}
                  </Text>
                  <Text style={styles.attColActivity}>{entry.activity.activity_name}</Text>
                  <Text style={styles.attColDuration}>{hours.toFixed(1)}h</Text>
                  <Text style={styles.attColRate}>{ron.format(rate)} RON</Text>
                  <Text style={styles.attColAmount}>{ron.format(hours * rate)} RON</Text>
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Semnătura manager</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Document generat automat de Stafy.ro</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
