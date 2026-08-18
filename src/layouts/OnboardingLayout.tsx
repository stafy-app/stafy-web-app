import { Navigate, Outlet } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'

export function OnboardingLayout() {
  const { authResolved, firebaseUser } = useAuth()
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

  if (profile.onboarding_completed) {
    return <Navigate to="/" />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <Outlet />
    </div>
  )
}
