import type { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'
import type { UserOut } from '@stafy/api/generated/endpoints/index.schemas'

interface SessionGateProps {
  children: (profile: UserOut) => ReactNode
}

// Shared first gate of every authenticated shell (`AppLayout`, `AdminLayout`):
// auth resolved, signed in, backend row exists, profile loaded. Role- and
// onboarding-specific routing stays in the layout that renders this.
export function SessionGate({ children }: SessionGateProps) {
  const { authResolved, firebaseUser } = useAuth()
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile()

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

  return <>{children(profile)}</>
}
