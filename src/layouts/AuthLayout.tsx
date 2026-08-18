import { Navigate, Outlet } from '@tanstack/react-router'
import { FullscreenSpinner } from '@stafy/components/layout/FullscreenSpinner'
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
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <Outlet />
    </div>
  )
}
