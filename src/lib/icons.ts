import {
  Check,
  Info,
  AlertTriangle,
  XCircle,
  X,
  Loader2,
  Search,
  Download,
  Plus,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICONS = {
  check: Check,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
  close: X,
  loading: Loader2,
  search: Search,
  download: Download,
  plus: Plus,
  chevronRight: ChevronRight,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS
