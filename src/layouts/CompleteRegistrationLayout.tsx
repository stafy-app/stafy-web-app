import { Navigate, Outlet } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { useAuth } from '@stafy/hooks/useAuth'

// Deliberately shallow gate — signed-in only, no useProfile() check. This
// page exists precisely for the case where no backend row (and therefore no
// profile) exists yet, so it can't depend on one the way AppLayout/
// OnboardingLayout do.
export function CompleteRegistrationLayout() {
  const { authResolved, firebaseUser } = useAuth()

  if (!authResolved) {
    return <FullscreenSpinner />
  }

  if (!firebaseUser) {
    return <Navigate to="/login" />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <Outlet />
    </div>
  )
}
