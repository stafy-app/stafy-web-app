// Maps Firebase Auth error codes and the backend's {code, detail} error shape
// (stafy-backend's AppHTTPException) to user-facing Romanian messages. Shared by
// AuthProvider (login/register) and useSendPasswordResetEmail — both hit the same
// Firebase error-code surface.
export function mapAuthError(error: unknown): string {
  const err = error as { code?: string; response?: { data?: { detail?: string } }; message?: string }
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email sau parolă incorectă'
    case 'auth/email-already-in-use':
      return 'Există deja un cont cu acest email'
    case 'auth/weak-password':
      return 'Parola trebuie să aibă minim 6 caractere'
    case 'auth/invalid-email':
      return 'Adresa de email nu este validă'
    case 'auth/too-many-requests':
      return 'Prea multe încercări. Încearcă din nou mai târziu'
    case 'auth/network-request-failed':
      return 'Fără conexiune la internet'
    default:
      return err?.response?.data?.detail ?? err?.message ?? 'A apărut o eroare neașteptată'
  }
}
