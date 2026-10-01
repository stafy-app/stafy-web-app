import type { ReactNode } from 'react'

// Page frame for every signed-out / pre-onboarding screen: warm canvas, two soft brand glows, centered content.
// `aside` (login/register only) adds a dark brand panel on wide screens.
export function AuthShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[var(--color-warm)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-56 -z-10 size-[560px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_20%,transparent),transparent_68%)] blur-[70px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-72 -left-48 -z-10 size-[520px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_70%)] blur-[80px]"
      />
      {aside ? (
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="hidden py-4 lg:block">{aside}</div>
          <main className="flex items-center justify-center px-4 py-10">{children}</main>
        </div>
      ) : (
        <main className="flex min-h-screen items-center justify-center px-4 py-10">{children}</main>
      )}
    </div>
  )
}
