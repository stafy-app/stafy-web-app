import { useContext, useEffect } from 'react'
import { TopBarContext, type TopBarConfig } from '@stafy/context/TopBarContext'

export function useTopBarState() {
  const ctx = useContext(TopBarContext)
  if (!ctx) throw new Error('useTopBarState must be used within TopBarProvider')
  return ctx.config
}

/** Called by a page component to set the shared shell's title/subtitle/breadcrumb/action. */
export function useTopBar(config: TopBarConfig) {
  const ctx = useContext(TopBarContext)
  if (!ctx) throw new Error('useTopBar must be used within TopBarProvider')
  const { setConfig } = ctx
  useEffect(() => {
    setConfig(config)
  })
}
