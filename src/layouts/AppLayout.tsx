import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { Sidebar } from '@stafy/components/layout/Sidebar'
import { BottomNav } from '@stafy/components/layout/BottomNav'
import { Topbar } from '@stafy/components/layout/Topbar'
import { TopBarProvider } from '@stafy/context/TopBarProvider'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'
import { setBlockedMessage } from '@stafy/utils/authBlockedMessage'

export function AppLayout() {
  const { authResolved, firebaseUser } = useAuth()
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (!authResolved) {
    return <FullscreenSpinner />
  }

  if (!firebaseUser) {
    return <Navigate to="/login" />
  }

  // Signed into Firebase but the backend has no row for this account yet — an
  // interrupted registration. GET /profile 404s; recover via the
  // complete-registration flow instead of spinning on FullscreenSpinner forever.
  const profileStatus = (profileError as { response?: { status?: number } } | null)?.response?.status
  if (profileStatus === 404) {
    return <Navigate to="/complete-registration" />
  }

  if (isProfileLoading || !profile) {
    return <FullscreenSpinner />
  }

  // Employees use the /me personal shell (same pages managers use for self
  // time-tracking). Company routes (/, /team, /invitations, /reports, /settings)
  // are require_role("manager") on the backend — redirect instead of letting them
  // land on pages that would just 403. Admin keeps its existing /settings rule.
  // An employee's onboarding is the profile form at /employee-onboarding, not the
  // manager's company form — /onboarding's PATCH requires manager/admin.
  if (profile.role === 'employee') {
    if (pathname === '/employee-onboarding') {
      if (profile.onboarding_completed) {
        return <Navigate to="/me" />
      }
    } else if (pathname === '/me' || pathname.startsWith('/me/')) {
      if (!profile.onboarding_completed) {
        return <Navigate to="/employee-onboarding" />
      }
    } else {
      setBlockedMessage('Zona aceasta este doar pentru manageri — ai fost redirecționat la pagina ta personală.')
      return <Navigate to="/me" />
    }
  } else if (!profile.onboarding_completed) {
    return <Navigate to="/onboarding" />
  }

  // Admin accounts have no access to any manager-only route (Dashboard, Team,
  // Invitations, Reports, most of Settings) — every one of those endpoints is
  // require_role("manager") only, not "admin". Confine them to /settings (the
  // Admin section) instead of letting them land on/navigate into pages that
  // would just 403. See stafy-web-app/docs/modules/admin-dashboard.md.
  if (profile.role === 'admin' && pathname !== '/settings') {
    return <Navigate to="/settings" />
  }

  return (
    <TopBarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </div>
    </TopBarProvider>
  )
}
