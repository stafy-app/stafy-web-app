import { Navigate, Outlet } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { AuthShell } from '@stafy/components/auth/AuthShell'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'

// Manager/admin only in practice — employees get onboarding_completed=true
// at register time (no separate step, see UserRepository.create_firebase_user),
// so they never land here with onboarding_completed: false.
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
    return <Navigate to={profile.role === 'employee' ? '/me' : '/'} />
  }

  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  )
}
