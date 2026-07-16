import { Navigate, Outlet } from '@tanstack/react-router'
import { FullscreenSpinner } from '../components/layout/FullscreenSpinner'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { TopBarProvider } from '../context/TopBarProvider'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { setBlockedMessage } from '../utils/authBlockedMessage'

export function AppLayout() {
  const { authResolved, firebaseUser, logout } = useAuth()
  const { data: profile, isLoading: isProfileLoading } = useProfile()

  if (!authResolved) {
    return <FullscreenSpinner />
  }

  if (!firebaseUser) {
    return <Navigate to="/login" />
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
