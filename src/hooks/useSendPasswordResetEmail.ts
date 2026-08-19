import { useMutation } from '@tanstack/react-query'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@stafy/services/firebase'
import { mapAuthError } from '@stafy/utils/authError'

// Pure Firebase — no backend call. Passwords are Firebase-owned; the backend
// never stores or sees them (see stafy-backend/stafy/auth/CLAUDE.md).
export function useSendPasswordResetEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      try {
        await sendPasswordResetEmail(auth, email)
      } catch (error) {
        throw new Error(mapAuthError(error), { cause: error })
      }
    },
  })
}
