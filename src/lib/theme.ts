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

export interface ThemeOrigin {
  x: number
  y: number
}

let fadeTimer: number | undefined

// Short colour cross-fade, the fallback when the circular reveal isn't available.
function fadeTheme(change: () => void) {
  const root = document.documentElement
  root.classList.add('theme-fading')
  change()
  window.clearTimeout(fadeTimer)
  fadeTimer = window.setTimeout(() => root.classList.remove('theme-fading'), 350)
}

// Circular reveal growing from `origin` (the clicked toggle) to the farthest viewport corner.
function revealTheme(origin: ThemeOrigin, change: () => void) {
  const root = document.documentElement
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
  root.style.setProperty('--vt-x', `${origin.x}px`)
  root.style.setProperty('--vt-y', `${origin.y}px`)
  root.style.setProperty('--vt-r', `${radius}px`)
  document.startViewTransition(change)
}

export function setThemePreference(next: ThemePreference, origin?: ThemeOrigin) {
  const before = getResolvedTheme()
  preference = next
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // storage blocked: the choice lasts until reload
  }
  const change = () => {
    applyTheme()
    notify()
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || getResolvedTheme() === before) change()
  else if (origin && typeof document.startViewTransition === 'function') revealTheme(origin, change)
  else fadeTheme(change)
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
