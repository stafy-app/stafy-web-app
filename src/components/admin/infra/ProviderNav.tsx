import type { ProviderStatus } from '@stafy/api/generated/endpoints/index.schemas'
import { StatusDot } from '@stafy/components/admin/ui/StatusDot'
import { providerState } from './providerHealth'

interface ProviderNavProps {
  providers: ProviderStatus[]
  selectedKey: string | undefined
  onSelect: (key: string) => void
  working: number
  attention: number
}

/**
 * The left panel: one row per service (name and state), the ones that need a look first. The header line
 * counts how many work. Sticky on wide screens so the list stays in view while the detail scrolls.
 */
export function ProviderNav({ providers, selectedKey, onSelect, working, attention }: ProviderNavProps) {
  return (
    <nav
      aria-label="Servicii"
      className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] lg:sticky lg:top-6"
    >
      <div className="border-b border-[var(--color-line)] px-4 py-3">
        <div className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">Servicii</div>
        <div className="text-[13px] text-[var(--color-ink-soft)]">
          {working} din {providers.length} funcționează
          {attention > 0 && <span className="text-[var(--color-error)]">, {attention} necesită atenție</span>}
        </div>
      </div>
      {/* Two columns on phones and tablets, so the list doesn't push the detail a screen down. */}
      <ul className="grid grid-cols-2 gap-0.5 p-1.5 sm:grid-cols-3 lg:block">
        {providers.map((provider) => {
          const state = providerState(provider)
          const active = provider.key === selectedKey
          return (
            <li key={provider.key}>
              <button
                type="button"
                aria-current={active}
                onClick={() => onSelect(provider.key)}
                className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-[var(--radius-lg)] px-3 py-2.5 text-left transition-colors ${
                  active ? 'bg-[var(--color-primary-soft)]' : 'hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <span className="text-[14px] font-semibold text-[var(--color-ink)]">{provider.label}</span>
                <StatusDot tone={state.tone}>{state.label}</StatusDot>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
