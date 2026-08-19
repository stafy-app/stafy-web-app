import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getAuth as getAuthApi } from '@stafy/api/generated/endpoints/auth/auth'
import { auth } from '@stafy/services/firebase'
import { mapAuthError } from '@stafy/utils/authError'
import { AuthContext, type RegisterData } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [authResolved, setAuthResolved] = useState(false)

  // onAuthStateChanged fires the instant signInWithEmailAndPassword/
  // createUserWithEmailAndPassword resolve internally — before login()/register()
  // below get a chance to call the backend. Without this guard, the listener's
  // hydration path races ahead of the backend call. login()/register() set
  // firebaseUser themselves on success; the listener only handles cold-start
  // hydration and out-of-band sign-outs while this ref is false.
  const isAuthenticating = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isAuthenticating.current) return
      setFirebaseUser(user)
      setAuthResolved(true)
    })
    return unsubscribe
  }, [])

  async function login(email: string, password: string) {
    isAuthenticating.current = true
    try {
      await signInWithEmailAndPassword(auth, email, password)

      try {
        await getAuthApi().loginUser()
      } catch (backendError: unknown) {
        const status = (backendError as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          // Firebase account exists but the backend row doesn't — a previous
          // registration attempt was interrupted before the backend call
          // completed. There's no first_name/last_name to auto-retry with.
          throw new Error('Înregistrarea nu a fost finalizată. Încearcă să te înregistrezi din nou.', {
            cause: backendError,
          })
        }
        throw backendError
      }

      setFirebaseUser(auth.currentUser)
    } catch (error) {
      throw new Error(mapAuthError(error), { cause: error })
    } finally {
      isAuthenticating.current = false
    }
  }

  async function register({ firstName, lastName, email, password }: RegisterData) {
    isAuthenticating.current = true
    try {
      await createUserWithEmailAndPassword(auth, email, password)

      try {
        await getAuthApi().registerUser({ first_name: firstName, last_name: lastName, role: 'manager' })
      } catch (backendError) {
        // Firebase account now exists but the backend row doesn't (network blip,
        // backend down). Deliberately not rolled back — deletion can itself fail
        // offline, and a half-rolled-back state is worse than a recoverable one.
        throw new Error('Cont creat, dar înregistrarea pe server a eșuat. Contactează administratorul.', {
          cause: backendError,
        })
      }

      setFirebaseUser(auth.currentUser)
    } catch (error) {
      throw new Error(mapAuthError(error), { cause: error })
    } finally {
      isAuthenticating.current = false
    }
  }

  async function logout() {
    await signOut(auth)
    setFirebaseUser(null)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, authResolved, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
