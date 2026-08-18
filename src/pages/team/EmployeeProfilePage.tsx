import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { EmployeeHeaderCard } from '@stafy/components/employee/EmployeeHeaderCard'
import { EmployeeTabs, type EmployeeTabKey } from '@stafy/components/employee/EmployeeTabs'
import { AttendanceTab } from '@stafy/components/employee/tabs/AttendanceTab'
import { RatesTab } from '@stafy/components/employee/tabs/RatesTab'
import { HistoryTab } from '@stafy/components/employee/tabs/HistoryTab'

export default function EmployeeProfilePage() {
  useTopBar({
    title: 'Profil angajat',
    breadcrumb: [{ label: 'Echipă', to: '/team' }, { label: 'Profil angajat' }],
  })

  const { employeeId } = useParams({ from: '/_app/team/$employeeId' })
  const employeeIdNumber = Number(employeeId)
  const [activeTab, setActiveTab] = useState<EmployeeTabKey>('attendance')

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <EmployeeHeaderCard employeeId={employeeIdNumber} />

      <EmployeeTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'attendance' && <AttendanceTab employeeId={employeeIdNumber} />}
      {activeTab === 'rates' && <RatesTab employeeId={employeeIdNumber} />}
      {activeTab === 'history' && <HistoryTab employeeId={employeeIdNumber} />}
    </div>
  )
}
