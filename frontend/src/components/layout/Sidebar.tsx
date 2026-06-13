import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardCheck, Package } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard, roles: null },
  { to: '/users',          label: 'Users',            icon: Users,           roles: ['AIRLINE_ADMINISTRATOR', 'CUSTOMER_ADMIN', 'SALES_AGENT'] },
  { to: '/approvals',      label: 'Approvals',        icon: ClipboardCheck,  roles: ['AIRLINE_ADMINISTRATOR', 'SALES_AGENT'] },
  { to: '/offers',         label: 'Offers',           icon: Package,         roles: ['AIRLINE_ADMINISTRATOR', 'CUSTOMER_ADMIN', 'SALES_AGENT', 'REVENUE_MANAGEMENT_USER', 'OPERATIONS_USER'] },
]

export function Sidebar() {
  const { hasRole } = usePermissions()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
      <nav className="flex-1 p-3 space-y-1 pt-4">
        {navItems
          .filter(item => !item.roles || hasRole(...(item.roles as any)))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-[3px]',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold border-accent-500'
                    : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">SkyFreight Portal v1.0</p>
      </div>
    </aside>
  )
}
