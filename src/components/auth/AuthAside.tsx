import { ICONS } from '@stafy/lib/icons'

const POINTS = [
  { icon: ICONS.clock, text: 'Instructorii își pontează orele din browser, în 60 de secunde.' },
  { icon: ICONS.tags, text: 'Tariful fiecărui om, pe fiecare activitate, se aplică singur.' },
  { icon: ICONS.download, text: 'Raportul de activitate pe fiecare om, gata în PDF.' },
]

export function AuthAside() {
  return (
    <aside className="relative flex h-full flex-col justify-between overflow-hidden rounded-r-[32px] shadow-[var(--shadow-aside)] bg-[linear-gradient(160deg,var(--color-night),var(--color-night-deep)_60%,var(--color-night))] p-[clamp(32px,4vw,56px)] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-72 size-[560px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_34%,transparent),transparent_66%)] blur-[30px]"
      />
      <div className="relative">
        <div className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-soft-strong)]">
          Pontaj pentru școli și centre
        </div>
        <h2 className="max-w-[460px] text-balance text-[clamp(28px,3vw,42px)] font-bold leading-[1.08] tracking-[-0.03em]">
          Finalul de lună nu mai trebuie să fie <span className="text-[var(--color-primary)]">o zi pierdută</span>.
        </h2>
      </div>

      <ul className="relative my-10 flex max-w-[460px] flex-col gap-5">
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3.5 text-[15.5px] leading-[1.5] text-white/80">
            <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-[10px] bg-white/10 text-[var(--color-primary-soft-strong)]">
              <Icon size={16} strokeWidth={2.2} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <div className="relative">
        <div className="mb-3 flex gap-2">
          {[true, false, false, false, false].map((on, i) => (
            <span key={i} className={`h-[5px] w-[42px] rounded-full ${on ? 'bg-[var(--color-primary)]' : 'bg-white/20'}`} />
          ))}
        </div>
        <p className="text-sm text-white/60">45 de zile gratuit, cu toate funcțiile. Fără card.</p>
      </div>
    </aside>
  )
}
