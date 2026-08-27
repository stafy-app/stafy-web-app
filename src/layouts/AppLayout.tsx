import { Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { Sidebar } from '@stafy/components/layout/Sidebar'
import { Topbar } from '@stafy/components/layout/Topbar'
import { TopBarProvider } from '@stafy/context/TopBarProvider'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'
import { setBlockedMessage } from '@stafy/utils/authBlockedMessage'

export function AppLayout() {
  const { authResolved, firebaseUser, logout } = useAuth()
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

  if (profile.role === 'employee') {
    setBlockedMessage('Acest cont este de angajat — aplicația web este doar pentru manageri.')
    logout()
    return <Navigate to="/login" />
  }

  if (!profile.onboarding_completed) {
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
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TopBarProvider>
  )
}
