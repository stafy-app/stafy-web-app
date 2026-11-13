import type { ReactNode } from 'react'

/** Scroll container + the shared dense table (`.admin-table` in `App.css`). Every admin table uses it. */
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="admin-table">{children}</table>
    </div>
  )
}

/** Single full-width row for "nothing here yet" and "nothing matches", with a hint on what to do next. */
export function AdminEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="!py-10 text-center text-[var(--color-ink-soft)]">
        {children}
      </td>
    </tr>
  )
}

export function AdminLoading() {
  return (
    <div className="p-8 text-center">
      <span className="loading loading-spinner loading-sm" />
    </div>
  )
}

interface AdminPagerProps {
  page: number
  pageCount: number
  onPage: (page: number) => void
}

/** Footer pager for a table inside a flush `AdminSheetSection`; renders nothing for a single page. */
export function AdminPager({ page, pageCount, onPage }: AdminPagerProps) {
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-3 py-2">
      <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Înapoi
      </button>
      <span className="text-[13px] text-[var(--color-ink-soft)] tabular-nums">
        Pagina {page} din {pageCount}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        Înainte
      </button>
    </div>
  )
}
