import type { ProviderMetric, ProviderStatus } from '@stafy/api/generated/endpoints/index.schemas'
import type { StatusTone } from '@stafy/components/admin/ui/StatusDot'

/** A provider needs a look when it is degraded, down or unknown, or when reading it failed. */
export function needsAttention(provider: ProviderStatus): boolean {
  return (
    provider.health === 'degraded' || provider.health === 'down' || provider.health === 'unknown' || !!provider.error
  )
}

const HEALTH_STATE: Record<string, { tone: StatusTone; label: string }> = {
  ok: { tone: 'success', label: 'Funcționează' },
  degraded: { tone: 'warning', label: 'Degradat' },
  down: { tone: 'error', label: 'Nefuncțional' },
  unknown: { tone: 'warning', label: 'Nu am putut citi serviciul' },
  unconfigured: { tone: 'neutral', label: 'Neconfigurat' },
}

/** A provider's overall state as one dot color and one phrase; "working" with a read error says so. */
export function providerState(provider: ProviderStatus): { tone: StatusTone; label: string } {
  if (provider.health === 'ok' && provider.error) return { tone: 'warning', label: 'Citit incomplet' }
  return HEALTH_STATE[provider.health] ?? HEALTH_STATE.unknown
}

/** Plain-language state of one row or metric, for screen readers. */
export function healthLabel(health: string | null | undefined): string {
  return (health && HEALTH_STATE[health]?.label) || 'Necunoscut'
}

/** Tone of one row or metric, from its health. */
export function healthTone(health: string | null | undefined): StatusTone {
  return (health && HEALTH_STATE[health]?.tone) || 'neutral'
}

/** A figure worth a KPI cell starts with a digit ("8", "100.00%", "34m 39s"); the rest are facts ("development"). */
export function isFigure(metric: ProviderMetric): boolean {
  return /^\d/.test(metric.value)
}

/**
 * Providers that exist only as figures in the strip above the service list, not as services of their own: they
 * describe the app as a whole (code, emails, expiry dates). Other figures in the strip (uptime, errors, database)
 * are read from real services, which stay in the list.
 */
export const KPI_PROVIDER_KEYS = ['github', 'resend', 'expiry'] as const
