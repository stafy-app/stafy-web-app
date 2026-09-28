/**
 * `UserOut.role` is one of `employee`, `manager`, `owner`, `admin` — computed
 * per request from the caller's active company membership (or `admin` for a
 * platform admin). `owner` and `manager` are both company-level managers on
 * the backend's rank-based `require_company_role` gate (owner > manager >
 * employee, see stafy-backend/stafy/auth/dependencies.py) — any check meaning
 * "can this caller do what a company manager can do" must include both, not
 * just a literal `role === 'manager'` match, or an owner silently falls
 * through to the wrong branch.
 */
export function isCompanyManager(role?: string | null): boolean {
  return role === 'owner' || role === 'manager'
}
