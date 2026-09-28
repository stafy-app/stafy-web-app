import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

// 'owner' is the registration-time input this app always sends — the backend also
// still accepts the legacy 'manager' value (kept for stafy-mobile), treated identically.
export type UserRole = 'owner' | 'employee'

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

export interface CompleteRegistrationData {
  firstName: string
  lastName: string
  role: UserRole
}

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  authResolved: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  completeRegistration: (data: CompleteRegistrationData) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
