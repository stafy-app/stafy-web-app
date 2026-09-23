export type WorkspaceMode = 'company' | 'personal'

const STORAGE_KEY = 'stafy.workspace.mode'

export function getWorkspaceMode(): WorkspaceMode {
  return localStorage.getItem(STORAGE_KEY) === 'personal' ? 'personal' : 'company'
}

export function setWorkspaceMode(mode: WorkspaceMode) {
  localStorage.setItem(STORAGE_KEY, mode)
}


