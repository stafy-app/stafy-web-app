import type { ProviderItem, ProviderStatus } from '@stafy/api/generated/endpoints/index.schemas'
import { timeAgo } from '@stafy/utils/timeAgo'
import { HealthBadge, HealthDot } from './HealthBadge'

// Rows come grouped by the provider (usually per environment); keep the provider's
// own order, which puts the service row before its deploy history.
function groupItems(items: ProviderItem[]): [string, ProviderItem[]][] {
  const groups = new Map<string, ProviderItem[]>()
  for (const item of items) {
    const key = item.group ?? ''
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.entries()]
}

function ItemRow({ item }: { item: ProviderItem }) {
  const title = item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="truncate text-[var(--color-ink)] no-underline hover:underline"
    >
      {item.label}
    </a>
  ) : (
    <span className="truncate text-[var(--color-ink)]">{item.label}</span>
  )
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span className="mt-1.5">
        <HealthDot health={item.health} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 font-mono text-[12px]">
          {title}
          {item.at && (
            <span className="flex-shrink-0 text-[11px] text-[var(--color-ink-muted)]">{timeAgo(item.at)}</span>
          )}
        </div>
        {item.summary && <div className="font-mono text-[11px] text-[var(--color-ink-soft)]">{item.summary}</div>}
        {item.detail && (
          <div className="truncate font-mono text-[11px] text-[var(--color-ink-muted)]">{item.detail}</div>
        )}
      </div>
    </li>
  )
}

// One card for every provider: the backend normalises each service into the same
// shape (health, metrics, grouped rows, links), so a new provider needs no UI work.
export function ProviderCard({ provider }: { provider: ProviderStatus }) {
  const items = provider.items ?? []
  const metrics = provider.metrics ?? []
  const links = provider.links ?? []
  const unconfigured = provider.health === 'unconfigured'

  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] ${
        unconfigured ? 'opacity-70' : ''
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-[14px] font-bold text-[var(--color-ink)]">{provider.label}</h2>
          <HealthBadge health={provider.health} />
        </div>
        <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">{timeAgo(provider.fetched_at)}</span>
      </header>

      {provider.summary && (
        <p className="mt-1 font-mono text-[12px] text-[var(--color-ink-soft)]">{provider.summary}</p>
      )}
      {unconfigured && (
        <p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">
          Setează în backend cheia și resursele acestui serviciu (vezi docs/deployment.md), apoi reîmprospătează.
        </p>
      )}
      {provider.error && (
        <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-info-soft)] px-2 py-1 font-mono text-[11px] text-[var(--color-info)]">
          Nu am putut citi serviciul: {provider.error}
        </p>
      )}

      {metrics.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                {metric.label}
              </dt>
              <dd className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[var(--color-ink)]">
                {metric.health && <HealthDot health={metric.health} />}
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {groupItems(items).map(([group, rows]) => (
        <div key={group} className="mt-3 border-t border-[var(--color-line-soft)] pt-2">
          {group && (
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-ink-muted)]">
              {group}
            </h3>
          )}
          <ul>
            {rows.map((item, index) => (
              <ItemRow key={`${item.label}-${index}`} item={item} />
            ))}
          </ul>
        </div>
      ))}

      {links.length > 0 && (
        <footer className="mt-3 flex flex-wrap gap-3 border-t border-[var(--color-line-soft)] pt-2">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-[var(--color-primary)] no-underline hover:underline"
            >
              {link.label} ↗
            </a>
          ))}
        </footer>
      )}
    </section>
  )
}
