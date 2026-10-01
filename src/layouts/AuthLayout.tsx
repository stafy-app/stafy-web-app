import { Navigate, Outlet } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
import { AuthAside } from '@stafy/components/auth/AuthAside'
import { AuthShell } from '@stafy/components/auth/AuthShell'
import { useAuth } from '@stafy/hooks/useAuth'

export function AuthLayout() {
  const { authResolved, firebaseUser } = useAuth()

  if (!authResolved) {
    return <FullscreenSpinner />
  }

  if (firebaseUser) {
    return <Navigate to="/" />
  }

  return (
    <AuthShell aside={<AuthAside />}>
      <Outlet />
    </AuthShell>
  )
}
