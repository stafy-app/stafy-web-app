import { useCallback, useState, type ReactNode } from 'react'
import { TopBarContext, type TopBarConfig, type TopBarBreadcrumbItem } from './TopBarContext'

function breadcrumbsEqual(a?: TopBarBreadcrumbItem[], b?: TopBarBreadcrumbItem[]): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((item, i) => item.label === b[i].label && item.to === b[i].to)
}

function configsEqual(a: TopBarConfig, b: TopBarConfig): boolean {
  return (
    a.title === b.title &&
    a.subtitle === b.subtitle &&
    a.action === b.action &&
    breadcrumbsEqual(a.breadcrumb, b.breadcrumb)
  )
}

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<TopBarConfig>({ title: '' })

  // useTopBar()'s effect has no dependency array by design (every page passes a fresh config
  // object literal on every render) — this bail-out is what keeps that from becoming a render
  // loop: setState with a functional updater that returns the *same* previous reference when
  // nothing meaningful changed skips the re-render entirely, instead of relying on callers to
  // memoize their config.
  const setConfig = useCallback((next: TopBarConfig) => {
    setConfigState((prev) => (configsEqual(prev, next) ? prev : next))
  }, [])

  return <TopBarContext.Provider value={{ config, setConfig }}>{children}</TopBarContext.Provider>
}
