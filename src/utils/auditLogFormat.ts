import type { AuditLogOut } from '@stafy/api/generated/endpoints/index.schemas'

/** Romanian label shown in the action filter dropdown and each row's action column. */
export const ACTION_LABELS: Record<string, string> = {
  'hourly_rate.created': 'Tarif activat',
  'hourly_rate.updated': 'Tarif modificat',
  'bonus.set': 'Bonus setat',
  'bonus.cleared': 'Bonus șters',
  'time_entry.deleted': 'Pontaj șters',
  'invitation.created': 'Invitație trimisă',
  'invitation.resent': 'Invitație retrimisă',
  'invitation.revoked': 'Invitație anulată',
  'invitation.accepted': 'Invitație acceptată',
  'invitation.rejected': 'Invitație respinsă',
  'user.suspended': 'Angajat suspendat',
  'user.reactivated': 'Angajat reactivat',
  'company.settings_updated': 'Date companie actualizate',
  'activity.created': 'Activitate creată',
  'activity.renamed': 'Activitate redenumită',
}

function field(value: AuditLogOut['before'], key: string): string | undefined {
  const raw = value?.[key]
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : undefined
}

/** One readable line summarizing before → after for a row, action-specific. */
export function formatAuditDetail(entry: AuditLogOut): string {
  const { before, after } = entry

  switch (entry.action) {
    case 'hourly_rate.created':
      return `${field(after, 'hourly_rate_gross') ?? '—'} RON/oră`
    case 'hourly_rate.updated':
      return `${field(before, 'hourly_rate_gross') ?? '—'} → ${field(after, 'hourly_rate_gross') ?? '—'} RON/oră`
    case 'bonus.set': {
      const amount = field(after, 'amount') ?? '—'
      const reason = field(after, 'reason')
      return reason ? `${amount} RON — ${reason}` : `${amount} RON`
    }
    case 'bonus.cleared':
      return `${field(before, 'amount') ?? '—'} RON`
    case 'time_entry.deleted': {
      const start = field(before, 'time_start')
      const end = field(before, 'time_end')
      return start && end
        ? `${new Date(start).toLocaleString('ro-RO')} – ${new Date(end).toLocaleTimeString('ro-RO')}`
        : '—'
    }
    case 'invitation.created':
      return field(after, 'invited_email') ?? '—'
    case 'invitation.accepted':
    case 'invitation.rejected':
    case 'invitation.resent':
    case 'invitation.revoked':
      return `${field(before, 'status') ?? '—'} → ${field(after, 'status') ?? '—'}`
    case 'user.suspended':
    case 'user.reactivated':
      return ''
    case 'company.settings_updated': {
      const changed = (['name', 'city', 'address'] as const).filter(
        (key) => field(before, key) !== field(after, key),
      )
      return changed
        .map((key) => `${field(before, key) ?? '—'} → ${field(after, key) ?? '—'}`)
        .join(', ')
    }
    case 'activity.created':
      return field(after, 'activity_name') ?? '—'
    case 'activity.renamed':
      return `${field(before, 'activity_name') ?? '—'} → ${field(after, 'activity_name') ?? '—'}`
    default:
      return ''
  }
}
