import { createContext, type ReactNode } from 'react'

export interface TopBarBreadcrumbItem {
  label: string
  to?: string
}

export interface TopBarConfig {
  title: string
  subtitle?: string
  breadcrumb?: TopBarBreadcrumbItem[]
  action?: ReactNode
}

export interface TopBarContextValue {
  config: TopBarConfig
  setConfig: (config: TopBarConfig) => void
}

export const TopBarContext = createContext<TopBarContextValue | null>(null)
