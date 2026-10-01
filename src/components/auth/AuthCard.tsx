import type { ReactNode } from 'react'
import logoMark from '@stafy/assets/stafy_logo.svg'

interface AuthCardProps {
  title: string
  subtitle?: ReactNode
  /** Tailwind max-width class; the default fits the short forms, onboarding passes a wider one. */
  widthClass?: string
  children: ReactNode
}

export function AuthCard({ title, subtitle, widthClass = 'max-w-[420px]', children }: AuthCardProps) {
  return (
    <div className={`w-full ${widthClass}`}>
      <div className="animate-fade-slide-in mb-6 flex items-center justify-center gap-2.5">
        <img src={logoMark} alt="" className="h-8 w-8 rounded-[7px]" />
        <span className="text-[22px] font-bold tracking-[-0.02em] text-[var(--color-ink)]">Stafy</span>
      </div>
      <div className="animate-fade-slide-in rounded-[24px] bg-white p-[clamp(22px,5vw,36px)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-line-soft)]">
        <h1 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="mt-2 text-[14.5px] leading-[1.55] text-[var(--color-ink-soft)]">{subtitle}</p>}
        <div className="mt-6 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}
