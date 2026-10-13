import { ICONS } from '@stafy/lib/icons'
import { ProviderCard } from '@stafy/components/admin/infra/ProviderCard'
import { useAdminInfra, useRefreshAdminInfra } from '@stafy/hooks/useAdminInfra'
import { getApiError } from '@stafy/services/apiErrors'

export default function AdminInfraPage() {
  const { data, isLoading, error, dataUpdatedAt, isFetching } = useAdminInfra()
  const refresh = useRefreshAdminInfra()
  const busy = isFetching || refresh.isPending
  const providers = data?.providers ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-[18px] font-bold text-[var(--color-ink)]">Infrastructură</h1>
          <p className="font-mono text-[12px] text-[var(--color-ink-muted)]">
            Starea serviciilor platformei, doar pentru citire. Se actualizează singură în fiecare minut.
            {dataUpdatedAt > 0 && ` Ultima citire: ${new Date(dataUpdatedAt).toLocaleTimeString('ro-RO')}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh.mutate()}
          disabled={busy}
          className="btn btn-sm btn-outline gap-2 font-mono"
        >
          <ICONS.refresh className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
          Reîmprospătează
        </button>
      </div>

      {isLoading && <p className="font-mono text-[13px] text-[var(--color-ink-muted)]">Se încarcă…</p>}
      {error && (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-error-soft)] px-3 py-2 font-mono text-[12px] text-[var(--color-error)]">
          Nu am putut încărca starea infrastructurii{getApiError(error)?.detail ? `: ${getApiError(error)?.detail}` : '.'}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {providers.map((provider) => (
          <ProviderCard key={provider.key} provider={provider} />
        ))}
      </div>
    </div>
  )
}
