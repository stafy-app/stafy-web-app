import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { OnboardingLayout } from '../layouts/OnboardingLayout'
import DashboardPage from '../pages/dashboard/DashboardPage'
import TeamPage from '../pages/team/TeamPage'
import EmployeeProfilePage from '../pages/team/EmployeeProfilePage'
import InvitationsPage from '../pages/invitations/InvitationsPage'
import ReportsPage from '../pages/reports/ReportsPage'
import SettingsPage from '../pages/settings/SettingsPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import OnboardingPage from '../pages/onboarding/OnboardingPage'
import TestsPage from '../pages/tests/TestsPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const appLayoutRoute = createRoute({
  id: '_app',
  getParentRoute: () => rootRoute,
  component: AppLayout,
})

const dashboardRoute = createRoute({
  path: '/',
  getParentRoute: () => appLayoutRoute,
  component: DashboardPage,
})

const teamRoute = createRoute({
  path: '/team',
  getParentRoute: () => appLayoutRoute,
  component: TeamPage,
})

const employeeProfileRoute = createRoute({
  path: '/team/$employeeId',
  getParentRoute: () => appLayoutRoute,
  component: EmployeeProfilePage,
})

const invitationsRoute = createRoute({
  path: '/invitations',
  getParentRoute: () => appLayoutRoute,
  component: InvitationsPage,
})

const reportsRoute = createRoute({
  path: '/reports',
  getParentRoute: () => appLayoutRoute,
  component: ReportsPage,
})

const settingsRoute = createRoute({
  path: '/settings',
  getParentRoute: () => appLayoutRoute,
  component: SettingsPage,
})

const authLayoutRoute = createRoute({
  id: '_auth',
  getParentRoute: () => rootRoute,
  component: AuthLayout,
})

const loginRoute = createRoute({
  path: '/login',
  getParentRoute: () => authLayoutRoute,
  component: LoginPage,
})

const registerRoute = createRoute({
  path: '/register',
  getParentRoute: () => authLayoutRoute,
  component: RegisterPage,
})

const onboardingLayoutRoute = createRoute({
  id: '_onboarding',
  getParentRoute: () => rootRoute,
  component: OnboardingLayout,
})

const onboardingRoute = createRoute({
  path: '/onboarding',
  getParentRoute: () => onboardingLayoutRoute,
  component: OnboardingPage,
})

// Dev-only shadow route — never spliced into the tree in production builds,
// so it doesn't exist in the prod route tree at all (not just unlinked).
const testsRoute = createRoute({
  path: '/tests',
  getParentRoute: () => rootRoute,
  component: TestsPage,
})

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    dashboardRoute,
    teamRoute,
    employeeProfileRoute,
    invitationsRoute,
    reportsRoute,
    settingsRoute,
  ]),
  authLayoutRoute.addChildren([loginRoute, registerRoute]),
  onboardingLayoutRoute.addChildren([onboardingRoute]),
  ...(import.meta.env.DEV ? [testsRoute] : []),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
