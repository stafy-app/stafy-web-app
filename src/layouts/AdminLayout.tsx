import { Navigate, Outlet } from '@tanstack/react-router'
import { SessionGate } from '@stafy/components/layout/SessionGate'
import { AdminSidebar } from '@stafy/components/admin/AdminSidebar'

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
          <div className="flex min-h-screen flex-col md:flex-row">
            <AdminSidebar />
            <main className="min-w-0 flex-1 p-4 sm:p-6">
              <Outlet />
            </main>
          </div>
        )
      }}
    </SessionGate>
  )
}
