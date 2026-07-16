import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  authResolved: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
