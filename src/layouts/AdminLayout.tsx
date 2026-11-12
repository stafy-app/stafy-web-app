import { Navigate, Outlet } from '@tanstack/react-router'
import { SessionGate } from '@stafy/components/layout/SessionGate'
import { AdminSidebar } from '@stafy/components/admin/AdminSidebar'

// The root re-points --color-ink-muted (slate-400, below AA contrast on white) to --color-ink-soft for
// everything inside the console, including the sections shared with the manager shell.
// Shell for every /admin/* route: signed in + platform admin. Anyone else is
// sent back to the root, where AppLayout routes them to their own shell. No
// onboarding gate — the admin account is provisioned by the seed script with
// its personal company already onboarded.
export function AdminLayout() {
  return (
    <SessionGate>
      {(profile) => {
        if (profile.role !== 'admin') {
          return <Navigate to="/" />
        }

        return (
          <div className="flex min-h-screen flex-col [--color-ink-muted:var(--color-ink-soft)] md:flex-row">
            <AdminSidebar />
            <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-9">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
                <Outlet />
              </div>
            </main>
          </div>
        )
      }}
    </SessionGate>
  )
}
