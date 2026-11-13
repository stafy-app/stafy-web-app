import { useState, type CSSProperties } from 'react'
import type { ProviderItem, ProviderMetric, ProviderStatus } from '@stafy/api/generated/endpoints/index.schemas'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { StatusDot } from '@stafy/components/admin/ui/StatusDot'
import { timeAgo } from '@stafy/utils/timeAgo'
import { healthLabel, healthTone, isFigure, providerState } from './providerHealth'

/** Rows a group shows before "Arată toate"; long deploy and issue lists stay readable. */
const GROUP_PREVIEW = 6

const VALUE_TONE: Record<string, string> = {
  degraded: 'text-[var(--color-warning-text)]',
  down: 'text-[var(--color-error)]',
}

const BAR_TONE: Record<string, string> = {
  ok: 'bg-[var(--color-success)]',
  degraded: 'bg-[var(--color-warning)]',
  down: 'bg-[var(--color-error)]',
}

function Figures({ metrics }: { metrics: ProviderMetric[] }) {
  // Up to four cells per row, equal width; fewer figures simply fill the row. Five or more use
  // three columns when that fills every row (six = two rows of three), otherwise four.
  const columns = metrics.length <= 4 ? metrics.length : metrics.length % 3 === 0 ? 3 : 4
  return (
    // Two columns below `md` (a lone last cell spans both). Each cell draws its own right and bottom hairline as a
    // 1px shadow; the outer edge is clipped by overflow-hidden, so an unfilled last row stays plain white.
    <div
      className="grid grid-cols-2 overflow-hidden border-b border-[var(--color-line)] max-md:[&>*:last-child:nth-child(odd)]:col-span-2 md:grid-cols-[repeat(var(--figure-cols),minmax(0,1fr))]"
      style={{ '--figure-cols': columns } as CSSProperties}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="min-w-0 px-4 py-4 shadow-[1px_0_0_var(--color-line),0_1px_0_var(--color-line)] sm:px-5"
        >
          <div className="truncate text-[13px] text-[var(--color-ink-soft)]" title={metric.label}>
            {metric.label}
          </div>
          <div
            className={`mt-1 truncate text-[26px] font-semibold leading-tight tracking-tight tabular-nums ${
              (metric.health && VALUE_TONE[metric.health]) || 'text-[var(--color-ink)]'
            }`}
          >
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}

/** A row's own figure: the value, and a thin bar under a percentage (uptime) colored by its health. */
function RowFigure({ metric }: { metric: ProviderMetric }) {
  const percent = metric.value.endsWith('%') ? Number.parseFloat(metric.value) : Number.NaN
  return (
    <div className="w-[92px] shrink-0">
      <div className="truncate text-[12px] text-[var(--color-ink-soft)]">{metric.label}</div>
      <div
        className={`text-[14px] font-semibold tabular-nums ${
          (metric.health && VALUE_TONE[metric.health]) || 'text-[var(--color-ink)]'
        }`}
      >
        {metric.value}
      </div>
      {!Number.isNaN(percent) && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className={`h-full rounded-full ${(metric.health && BAR_TONE[metric.health]) || 'bg-[var(--color-ink-muted)]'}`}
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ItemRow({ item }: { item: ProviderItem }) {
  const title = item.url ? (
    <a href={item.url} target="_blank" rel="noreferrer" className="no-underline hover:underline">
      {item.label}
    </a>
  ) : (
    item.label
  )
  const sub = [item.summary, item.detail].filter(Boolean).join(' · ')

  return (
    // Below `sm` the figures and the time wrap under the name instead of squeezing it.
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--color-line-soft)] px-4 py-3 last:border-b-0 sm:flex-nowrap sm:px-5">
      <div className="min-w-0 flex-1 max-sm:basis-full">
        <div className="flex items-center gap-2">
          <StatusDot tone={healthTone(item.health)}>
            <span className="sr-only">{healthLabel(item.health)}</span>
          </StatusDot>
          <span className="truncate text-[14px] font-medium text-[var(--color-ink)]" title={item.label}>
            {title}
          </span>
        </div>
        {sub && (
          <div className="mt-0.5 truncate pl-4 text-[13px] text-[var(--color-ink-soft)]" title={sub}>
            {sub}
          </div>
        )}
      </div>
      {(item.metrics ?? []).map((metric) => (
        <RowFigure key={metric.label} metric={metric} />
      ))}
      {item.at && (
        <div className="shrink-0 text-[12px] text-[var(--color-ink-soft)] max-sm:ml-auto sm:w-[104px] sm:text-right">
          {timeAgo(item.at)}
        </div>
      )}
    </li>
  )
}

function groupItems(items: ProviderItem[]): [string, ProviderItem[]][] {
  const groups = new Map<string, ProviderItem[]>()
  for (const item of items) {
    const key = item.group ?? ''
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.entries()]
}

function ItemGroup({ name, rows }: { name: string; rows: ProviderItem[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? rows : rows.slice(0, GROUP_PREVIEW)

  return (
    <AdminSheetSection title={`${name || 'Elemente'} · ${rows.length}`} flush>
      <ul>
        {shown.map((item, index) => (
          <ItemRow key={`${item.label}-${index}`} item={item} />
        ))}
      </ul>
      {rows.length > GROUP_PREVIEW && (
        <div className="border-t border-[var(--color-line)] px-5 py-2">
          <button
            type="button"
            className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
            onClick={() => setAll(!all)}
          >
            {all ? 'Arată mai puține' : `Arată toate (${rows.length})`}
          </button>
        </div>
      )}
    </AdminSheetSection>
  )
}

/**
 * One service in full, on the right: what it is (a sentence), its state and a link to the vendor, what is
 * wrong if anything, its figures as KPIs, its facts as a list, then each group of rows with its own state
 * and figures. The backend normalises every service into the same shape, so a new service needs no UI work.
 */
export function ProviderDetail({ provider }: { provider: ProviderStatus }) {
  const state = providerState(provider)
  const metrics = provider.metrics ?? []
  const figures = metrics.filter(isFigure)
  const facts = metrics.filter((metric) => !isFigure(metric))
  const items = provider.items ?? []
  const links = provider.links ?? []

  return (
    <AdminSheet>
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[22px] font-semibold tracking-tight text-[var(--color-ink)]">{provider.label}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--color-ink-soft)]">
              <StatusDot tone={state.tone}>{state.label}</StatusDot>
              <span>Citit {timeAgo(provider.fetched_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline no-underline"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
        {provider.description && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            {provider.description}
          </p>
        )}
        {facts.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--color-ink-soft)]">
            {facts.map((fact, index) => (
              <span key={fact.label}>
                {index > 0 && ' · '}
                {fact.label}: <span className="text-[var(--color-ink)]">{fact.value}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      {provider.health === 'unconfigured' && (
        <p className="px-5 py-6 text-[14px] text-[var(--color-ink-soft)]">
          Serviciul nu e configurat. Setează în backend cheia și resursele lui (vezi docs/deployment.md), apoi
          reîmprospătează.
        </p>
      )}

      {provider.error && (
        <div className="bg-[var(--color-warning-soft)] px-5 py-3 text-[14px] text-[var(--color-ink)]">
          <span className="font-semibold">Ce nu merge: </span>nu am putut citi serviciul ({provider.error}).
        </div>
      )}

      {figures.length > 0 && <Figures metrics={figures} />}

      {groupItems(items).map(([name, rows]) => (
        <ItemGroup key={name} name={name} rows={rows} />
      ))}

      {items.length === 0 && metrics.length === 0 && !provider.error && provider.health !== 'unconfigured' && (
        <p className="px-5 py-8 text-center text-[14px] text-[var(--color-ink-soft)]">
          Serviciul nu a raportat nimic încă.
        </p>
      )}
    </AdminSheet>
  )
}
