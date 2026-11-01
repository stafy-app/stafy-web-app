import { useRef, useState } from 'react'
import { ICONS } from '@stafy/lib/icons'
import { ProviderDetail } from '@stafy/components/admin/infra/ProviderDetail'
import { ProviderNav } from '@stafy/components/admin/infra/ProviderNav'
import { needsAttention } from '@stafy/components/admin/infra/providerHealth'
import { AdminPageHeader } from '@stafy/components/admin/ui/AdminPageHeader'
import { useAdminInfra, useRefreshAdminInfra } from '@stafy/hooks/useAdminInfra'
import { getApiError } from '@stafy/services/apiErrors'

export default function AdminInfraPage() {
  const { data, isLoading, error, dataUpdatedAt, isFetching } = useAdminInfra()
  const refresh = useRefreshAdminInfra()
  const busy = isFetching || refresh.isPending
  const providers = data?.providers ?? []

  const configured = providers.filter((provider) => provider.health !== 'unconfigured')
  const unconfigured = providers.filter((provider) => provider.health === 'unconfigured')
  // Services that need a look come first, then the healthy ones, then the unconfigured, each in the backend's order.
  const ordered = [
    ...configured.filter((provider) => needsAttention(provider)),
    ...configured.filter((provider) => !needsAttention(provider)),
    ...unconfigured,
  ]
  const attention = configured.filter((provider) => needsAttention(provider)).length

  // The first one is open until another is picked.
  const [picked, setPicked] = useState<string | null>(null)
  const selected = ordered.find((provider) => provider.key === picked) ?? ordered[0]
  const detailRef = useRef<HTMLDivElement>(null)

  function select(key: string) {
    setPicked(key)
    // Stacked below `lg`, the detail sits under the list: bring it into view.
    if (window.innerWidth < 1024) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <AdminPageHeader
        title="Infrastructură"
        subtitle="Starea serviciilor pe care rulează Stafy, doar pentru citire. Se actualizează singură în fiecare minut."
        action={
          <>
            {dataUpdatedAt > 0 && (
              <span className="text-[13px] text-[var(--color-ink-soft)] tabular-nums">
                Citit la {new Date(dataUpdatedAt).toLocaleTimeString('ro-RO')}
              </span>
            )}
            <button
              type="button"
              onClick={() => refresh.mutate()}
              disabled={busy}
              className="btn btn-sm btn-outline gap-2"
            >
              <ICONS.refresh className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
              Reîmprospătează
            </button>
          </>
        }
      />

      {error && (
        <p className="rounded-[var(--radius-lg)] bg-[var(--color-error-soft)] px-4 py-3 text-[14px] text-[var(--color-error)]">
          Nu am putut încărca starea infrastructurii
          {getApiError(error)?.detail ? `: ${getApiError(error)?.detail}` : '.'}
        </p>
      )}

      {isLoading ? (
        <p className="text-[14px] text-[var(--color-ink-soft)]">Se încarcă…</p>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <ProviderNav
            providers={ordered}
            selectedKey={selected?.key}
            onSelect={select}
            working={configured.length - attention}
            attention={attention}
          />
          <div ref={detailRef} className="min-w-0 scroll-mt-6">
            {selected && <ProviderDetail key={selected.key} provider={selected} />}
          </div>
        </div>
      )}
    </>
  )
}
