import { Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <Outlet />
    </div>
  )
}
