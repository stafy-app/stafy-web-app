// Light/dark theme store. The DaisyUI themes are "stafy" and "stafy-dark" (src/App.css); the active one is
// the data-theme attribute on <html>. The same resolve logic runs inline in index.html before first paint
// (no flash) — keep the storage key and theme names in sync with it.
export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'stafy-theme'
const THEME_NAMES: Record<ResolvedTheme, string> = { light: 'stafy', dark: 'stafy-dark' }

const listeners = new Set<() => void>()

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // storage blocked: fall through to the system preference
  }
  return 'system'
}

let preference: ThemePreference = readStored()

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getResolvedTheme(): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference
}

export function getThemePreference(): ThemePreference {
  return preference
}

function applyTheme() {
  document.documentElement.dataset.theme = THEME_NAMES[getResolvedTheme()]
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // storage blocked: the choice lasts until reload
  }
  applyTheme()
  notify()
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function initTheme() {
  applyTheme()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (preference === 'system') {
      applyTheme()
      notify()
    }
  })
}
