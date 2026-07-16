export function FullscreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)]">
      <span className="loading loading-spinner loading-lg text-[var(--color-primary)]" />
    </div>
  )
}
