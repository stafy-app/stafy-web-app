import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { AppLayout } from '@stafy/layouts/AppLayout'
import { AuthLayout } from '@stafy/layouts/AuthLayout'
import { OnboardingLayout } from '@stafy/layouts/OnboardingLayout'
import { CompleteRegistrationLayout } from '@stafy/layouts/CompleteRegistrationLayout'
import DashboardPage from '@stafy/pages/dashboard/DashboardPage'
import TeamPage from '@stafy/pages/team/TeamPage'
import EmployeeProfilePage from '@stafy/pages/team/EmployeeProfilePage'
import MyDashboardPage from '@stafy/pages/me/MyDashboardPage'
import MyAttendancePage from '@stafy/pages/me/MyAttendancePage'
import MyHistoryPage from '@stafy/pages/me/MyHistoryPage'
import MyRatesPage from '@stafy/pages/me/MyRatesPage'
import MyProfilePage from '@stafy/pages/me/MyProfilePage'
import InvitationsPage from '@stafy/pages/invitations/InvitationsPage'
import ReportsPage from '@stafy/pages/reports/ReportsPage'
import SettingsPage from '@stafy/pages/settings/SettingsPage'
import LoginPage from '@stafy/pages/auth/LoginPage'
import RegisterPage from '@stafy/pages/auth/RegisterPage'
import CompleteRegistrationPage from '@stafy/pages/auth/CompleteRegistrationPage'
import OnboardingPage from '@stafy/pages/onboarding/OnboardingPage'
import EmployeeOnboardingPage from '@stafy/pages/onboarding/EmployeeOnboardingPage'
import TestsPage from '@stafy/pages/tests/TestsPage'

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

const myDashboardRoute = createRoute({
  path: '/me',
  getParentRoute: () => appLayoutRoute,
  component: MyDashboardPage,
})

const myAttendanceRoute = createRoute({
  path: '/me/attendance',
  getParentRoute: () => appLayoutRoute,
  component: MyAttendancePage,
})

const myHistoryRoute = createRoute({
  path: '/me/history',
  getParentRoute: () => appLayoutRoute,
  component: MyHistoryPage,
})

const myRatesRoute = createRoute({
  path: '/me/rates',
  getParentRoute: () => appLayoutRoute,
  component: MyRatesPage,
})

const myProfileRoute = createRoute({
  path: '/me/profile',
  getParentRoute: () => appLayoutRoute,
  component: MyProfilePage,
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

const employeeOnboardingRoute = createRoute({
  path: '/employee-onboarding',
  getParentRoute: () => appLayoutRoute,
  component: EmployeeOnboardingPage,
})

const completeRegistrationLayoutRoute = createRoute({
  id: '_complete-registration',
  getParentRoute: () => rootRoute,
  component: CompleteRegistrationLayout,
})

const completeRegistrationRoute = createRoute({
  path: '/complete-registration',
  getParentRoute: () => completeRegistrationLayoutRoute,
  component: CompleteRegistrationPage,
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
    myDashboardRoute,
    myAttendanceRoute,
    myHistoryRoute,
    myRatesRoute,
    myProfileRoute,
    employeeOnboardingRoute,
    invitationsRoute,
    reportsRoute,
    settingsRoute,
  ]),
  authLayoutRoute.addChildren([loginRoute, registerRoute]),
  onboardingLayoutRoute.addChildren([onboardingRoute]),
  completeRegistrationLayoutRoute.addChildren([completeRegistrationRoute]),
  ...(import.meta.env.DEV ? [testsRoute] : []),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
