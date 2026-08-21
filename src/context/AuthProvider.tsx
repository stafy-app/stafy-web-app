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
import { mapAuthError, OrphanRegistrationError } from '@stafy/utils/authError'
import { AuthContext, type CompleteRegistrationData, type RegisterData } from './AuthContext'

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
          // completed. Reflect the real Firebase session in context state
          // (the happy-path setFirebaseUser below never runs) so the
          // /complete-registration gate sees a signed-in user.
          setFirebaseUser(auth.currentUser)
          throw new OrphanRegistrationError()
        }
        throw backendError
      }

      setFirebaseUser(auth.currentUser)
    } catch (error) {
      if (error instanceof OrphanRegistrationError) {
        throw error
      }
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
        // The user recovers via /complete-registration, reached from login()'s
        // OrphanRegistrationError (see completeRegistration() below).
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

  // Finishes provisioning the backend row for a Firebase account that
  // already exists — the orphan-registration recovery path. auth.currentUser
  // is guaranteed to be set here: this is only reachable via login()'s
  // OrphanRegistrationError, which fires after signInWithEmailAndPassword
  // already succeeded. Role is hardcoded 'manager', same as register() — this
  // app never collects a role, it's manager-only.
  async function completeRegistration({ firstName, lastName }: CompleteRegistrationData) {
    try {
      if (!auth.currentUser) {
        throw new Error('Sesiunea a expirat. Te rugăm să te autentifici din nou.')
      }

      try {
        await getAuthApi().registerUser({ first_name: firstName, last_name: lastName, role: 'manager' })
      } catch (backendError) {
        throw new Error('Înregistrarea nu a putut fi finalizată. Încearcă din nou mai târziu.', {
          cause: backendError,
        })
      }

      setFirebaseUser(auth.currentUser)
    } catch (error) {
      throw new Error(mapAuthError(error), { cause: error })
    }
  }

  async function logout() {
    await signOut(auth)
    setFirebaseUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, authResolved, login, register, completeRegistration, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
