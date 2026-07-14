import { Link } from '@tanstack/react-router'

const navItems = [
  { to: '/', label: 'Acasă' },
  { to: '/team', label: 'Echipă' },
  { to: '/invitations', label: 'Invitații' },
  { to: '/reports', label: 'Rapoarte' },
  { to: '/settings', label: 'Setări' },
] as const

export function Sidebar() {
  return (
    <aside className="menu w-56 min-h-screen bg-base-100 border-r border-base-300 p-4">
      <ul className="menu-vertical gap-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link to={item.to} activeProps={{ className: 'active' }}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
