import { useTopBar } from '../../hooks/useTopBar'

export default function EmployeeProfilePage() {
  useTopBar({
    title: 'Profil angajat',
    breadcrumb: [{ label: 'Echipă', to: '/team' }, { label: 'Profil angajat' }],
  })
  return null
}
