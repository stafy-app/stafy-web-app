import { useState, type ReactNode } from 'react'
import { TopBarContext, type TopBarConfig } from './TopBarContext'

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TopBarConfig>({ title: '' })
  return <TopBarContext.Provider value={{ config, setConfig }}>{children}</TopBarContext.Provider>
}
