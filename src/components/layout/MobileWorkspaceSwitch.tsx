import { useNavigate } from '@tanstack/react-router'
import { useProfile } from '@stafy/hooks/useProfile'
import { isCompanyManager } from '@stafy/utils/companyRole'
import { setWorkspaceMode, type WorkspaceMode } from '@stafy/utils/workspaceMode'

// Phone-only replacement for the Sidebar's workspace switcher (the Sidebar is hidden
// below md and BottomNav has no room for it). Renders nothing for employees.
export function MobileWorkspaceSwitch({ target }: { target: WorkspaceMode }) {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  if (!isCompanyManager(profile?.role) && profile?.role !== 'admin') return null

  function go() {
    setWorkspaceMode(target)
    navigate({ to: target === 'personal' ? '/me' : '/' })
  }

  return (
    <button type="button" onClick={go} className="btn btn-outline min-h-12 w-full md:hidden sm:w-auto sm:self-start">
      {target === 'personal' ? 'Mergi la spațiul meu personal' : 'Înapoi la companie'}
    </button>
  )
}
