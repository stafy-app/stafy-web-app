import { useState } from 'react'
import { ICONS } from '@stafy/lib/icons'

interface EmployeeActionsMenuProps {
  isActive: boolean
  /** Target is a coordinator (role="manager") — suspend/reactivate don't apply
   * to them; the only lifecycle action is removing them from the company. */
  isCoordinator?: boolean
  onEditJobTitle: () => void
  onExportCsv: () => void
  onSuspend: () => void
  onReactivate: () => void
  onRemoveFromCompany?: () => void
  disabled?: boolean
}

export function EmployeeActionsMenu({
  isActive,
  isCoordinator = false,
  onEditJobTitle,
  onExportCsv,
  onSuspend,
  onReactivate,
  onRemoveFromCompany,
  disabled,
}: EmployeeActionsMenuProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        aria-label="Acțiuni angajat"
        className="btn btn-ghost btn-square btn-sm text-[var(--color-ink-soft)]"
      >
        <ICONS.moreVertical className="h-4 w-4" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-10 w-60 gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-md)]"
      >
        <li>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur()
              onEditJobTitle()
            }}
            className="flex items-center gap-2 text-[13px] text-[var(--color-ink)]"
          >
            <ICONS.pencil className="h-3.5 w-3.5" />
            Editează job title
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur()
              onExportCsv()
            }}
            className="flex items-center gap-2 text-[13px] text-[var(--color-ink)]"
          >
            <ICONS.download className="h-3.5 w-3.5" />
            Exportă pontaje CSV
          </button>
        </li>
        <div className="my-1 h-px bg-[var(--color-line-soft)]" />
        {isCoordinator ? (
          <li>
            {confirmingRemove ? (
              <div className="flex items-center justify-between gap-2 px-1 py-1 text-[13px]">
                <span className="text-[var(--color-ink-muted)]">Sigur?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setConfirmingRemove(false)
                      onRemoveFromCompany?.()
                    }}
                    className="font-semibold text-[var(--color-error)] disabled:opacity-50"
                  >
                    Da, elimină
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur()
                      setConfirmingRemove(false)
                    }}
                    className="text-[var(--color-ink-muted)]"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setConfirmingRemove(true)}
                className="flex items-center gap-2 text-[13px] text-[var(--color-error)] disabled:opacity-50"
              >
                <ICONS.userX className="h-3.5 w-3.5" />
                Elimină din companie
              </button>
            )}
          </li>
        ) : isActive ? (
          <li>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.currentTarget.blur()
                onSuspend()
              }}
              className="flex items-center gap-2 text-[13px] text-[var(--color-error)] disabled:opacity-50"
            >
              <ICONS.userX className="h-3.5 w-3.5" />
              Suspendă angajat
            </button>
          </li>
        ) : (
          <li>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.currentTarget.blur()
                onReactivate()
              }}
              className="flex items-center gap-2 text-[13px] text-[var(--color-success)] disabled:opacity-50"
            >
              <ICONS.userCheck className="h-3.5 w-3.5" />
              Reactivează angajat
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
