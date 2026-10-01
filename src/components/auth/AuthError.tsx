export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="animate-fade-slide-in rounded-xl bg-[var(--color-error-soft)] px-3.5 py-2.5 text-sm text-[var(--color-error)]"
    >
      {message}
    </div>
  )
}
