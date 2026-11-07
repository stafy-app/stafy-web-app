import { Info } from 'lucide-react'
import type { ProviderStatus } from '@stafy/api/generated/endpoints/index.schemas'
import { StatusDot } from '@stafy/components/admin/ui/StatusDot'
import { healthTone } from './providerHealth'

interface Kpi {
  value: string
  hint: string
}

interface KpiDefinition {
  /** The provider the figure is read from; picking the cell opens that provider's detail. */
  providerKey: string
  title: string
  /** What the figure means, shown behind the info icon. */
  info: string
  /** The figure, or undefined when the provider does not carry it (then the cell shows a dash). */
  read: (provider: ProviderStatus) => Kpi | undefined
}

const NO_VALUE = '—'

function metric(provider: ProviderStatus, label: string): string | undefined {
  return (provider.metrics ?? []).find((m) => m.label === label)?.value
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

const KPIS: KpiDefinition[] = [
  {
    providerKey: 'github',
    title: 'Cod și teste',
    info: 'Câte dintre repository-urile Stafy au testele automate (CI) trecute pe ramura principală, fără alerte grave de securitate. Dacă ceva pică, nu ar trebui lansată o versiune nouă.',
    read: (p) => {
      const ok = metric(p, 'Repository-uri în regulă')
      return ok ? { value: ok, hint: 'repository-uri în regulă' } : undefined
    },
  },
  {
    providerKey: 'resend',
    title: 'Emailuri, 24 h',
    info: 'Câte emailuri (invitații) au ajuns la destinatar din cele trimise în ultimele 24 de ore. Cele respinse apar în detaliu, ca să vezi cui nu i-a ajuns invitația.',
    read: (p) => {
      const sent = metric(p, 'Trimise (24 h)')
      const delivered = metric(p, 'Livrate')
      return sent && delivered ? { value: `${delivered} din ${sent}`, hint: 'livrate' } : undefined
    },
  },
  {
    providerKey: 'expiry',
    title: 'Expirări',
    info: 'Câte zile mai sunt până expiră cel mai apropiat certificat SSL sau domeniu. Dacă expiră, utilizatorii nu mai pot intra în aplicație, deci trebuie reînnoit din timp.',
    read: (p) => {
      const nearest = (p.items ?? [])
        .filter((item) => item.at)
        .sort((a, b) => new Date(a.at as string).getTime() - new Date(b.at as string).getTime())[0]
      if (!nearest?.at) return undefined
      const days = daysUntil(nearest.at)
      return {
        value: days < 0 ? 'expirat' : `${days} ${days === 1 ? 'zi' : 'zile'}`,
        hint: `${nearest.group === 'Domenii' ? 'domeniul' : 'certificat SSL'} ${nearest.label}`,
      }
    },
  },
  {
    providerKey: 'uptimerobot',
    title: 'Disponibilitate, 30 zile',
    info: 'Cât din ultimele 30 de zile au răspuns adresele Stafy, verificate din exterior la câteva minute. 99,9% înseamnă cel mult ~43 de minute de nefuncționare pe lună.',
    read: (p) => {
      const uptime = metric(p, 'Uptime 30 zile')
      return uptime ? { value: uptime, hint: 'din timp funcțional' } : undefined
    },
  },
  {
    providerKey: 'sentry',
    title: 'Erori, 24 h',
    info: 'Câte erori a prins aplicația (backend și web) în ultimele 24 de ore. Sub cifră vezi câte probleme rămân nerezolvate în total. Un număr mare după o lansare înseamnă că ceva s-a stricat.',
    read: (p) => {
      const recent = metric(p, 'Erori în ultimele 24 h')
      const open = metric(p, 'Probleme nerezolvate')
      return recent ? { value: recent, hint: open ? `${open} nerezolvate` : 'în ultimele 24 h' } : undefined
    },
  },
  {
    providerKey: 'neon',
    title: 'Baza de date',
    info: 'Cât din planul Neon (calcul) ai consumat în perioada curentă. La 100% baza de date se oprește până se resetează perioada sau treci pe un plan mai mare. Procentul apare doar dacă ai setat limitele planului; altfel vezi spațiul ocupat.',
    read: (p) => {
      const percent = metric(p, 'Calcul față de plan')?.match(/\((\d+%)\)/)?.[1]
      if (percent) return { value: percent, hint: 'din calculul planului' }
      const size = metric(p, 'Spațiu folosit')
      return size ? { value: size, hint: 'spațiu ocupat' } : undefined
    },
  },
]

interface InfraKpiStripProps {
  providers: ProviderStatus[]
  selectedKey: string | undefined
  onSelect: (key: string) => void
}

/**
 * The app-wide figures as one strip: title with an info icon, the figure large, a hint and a state dot. A cell
 * opens the detail of the provider it is read from. A provider that is not configured or not readable shows a
 * dash and says why.
 */
export function InfraKpiStrip({ providers, selectedKey, onSelect }: InfraKpiStripProps) {
  const cells = KPIS.flatMap((definition) => {
    const provider = providers.find((p) => p.key === definition.providerKey)
    return provider ? [{ definition, provider }] : []
  })
  if (cells.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-px rounded-[var(--radius-xl)] bg-[var(--color-line)] shadow-[var(--shadow-card)] md:grid-cols-3 xl:grid-cols-6">
      {cells.map(({ definition, provider }) => {
        const readable = provider.health !== 'unconfigured' && provider.health !== 'unknown'
        const kpi = readable ? definition.read(provider) : undefined
        const hint = kpi?.hint ?? (provider.health === 'unconfigured' ? 'Neconfigurat' : 'Nu am putut citi')
        const tone =
          provider.health === 'unconfigured' ? 'neutral' : provider.error ? 'warning' : healthTone(provider.health)
        const active = provider.key === selectedKey
        return (
          <div
            key={definition.title}
            className={`relative transition-colors first:rounded-tl-[var(--radius-xl)] last:rounded-br-[var(--radius-xl)] ${
              active ? 'bg-[var(--color-primary-soft)]' : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'
            }`}
          >
            <button
              type="button"
              aria-current={active}
              onClick={() => onSelect(provider.key)}
              className="flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left"
            >
              <span className="truncate pr-5 text-[12px] font-medium text-[var(--color-ink-soft)]">{definition.title}</span>
              <span className="text-[22px] font-semibold leading-none tracking-tight text-[var(--color-ink)] tabular-nums">
                {kpi?.value ?? NO_VALUE}
              </span>
              <StatusDot tone={tone} truncate>
                {hint}
              </StatusDot>
            </button>
            <span
              className="tooltip tooltip-left absolute right-2 top-2.5 z-10 before:max-w-[17rem] before:whitespace-normal before:text-left before:text-[12px] before:leading-snug"
              data-tip={definition.info}
            >
              <span
                tabIndex={0}
                role="img"
                aria-label={`Ce înseamnă: ${definition.info}`}
                className="flex h-5 w-5 cursor-help items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:text-[var(--color-ink-soft)] focus-visible:text-[var(--color-ink-soft)]"
              >
                <Info className="h-4 w-4" />
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
