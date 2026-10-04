import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { SessionGate } from '@stafy/components/layout/SessionGate'
import { Sidebar } from '@stafy/components/layout/Sidebar'
import { BottomNav } from '@stafy/components/layout/BottomNav'
import { Topbar } from '@stafy/components/layout/Topbar'
import { PlanStatusBanner } from '@stafy/components/layout/PlanStatusBanner'
import { IncomingInvitations } from '@stafy/components/invitations/IncomingInvitations'
import { TopBarProvider } from '@stafy/context/TopBarProvider'
import { setBlockedMessage } from '@stafy/utils/authBlockedMessage'

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <SessionGate>
      {(profile) => {
        // Platform admins work in their own shell (AdminLayout, /admin/*). Every
        // route here is a company-scoped endpoint gated by company role, which a
        // platform admin has no special access to — bounce instead of 403-ing.
        // See stafy-web-app/docs/modules/admin-dashboard.md.
        if (profile.role === 'admin') {
          return <Navigate to="/admin" />
        }

        // Employees use the /me personal shell (same pages managers use for self
        // time-tracking). Company routes (/, /team, /invitations, /reports, /settings)
        // are require_company_role(min="manager") on the backend — redirect instead of
        // letting them land on pages that would just 403.
        // No onboarding_completed check for employees — they have no onboarding step
        // (onboarding_completed is set true at register time, see OnboardingLayout).
        if (profile.role === 'employee') {
          if (pathname !== '/me' && !pathname.startsWith('/me/')) {
            setBlockedMessage('Zona aceasta este doar pentru manageri — ai fost redirecționat la pagina ta personală.')
            return <Navigate to="/me" />
          }
        } else if (!profile.onboarding_completed) {
          return <Navigate to="/onboarding" />
        }

        return (
          <TopBarProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />
                <PlanStatusBanner />
                <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6">
                  <IncomingInvitations />
                  <Outlet />
                </main>
                <BottomNav />
              </div>
            </div>
          </TopBarProvider>
        )
      }}
    </SessionGate>
  )
}
