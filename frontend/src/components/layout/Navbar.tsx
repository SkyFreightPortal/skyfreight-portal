import { LogOut, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

export function Navbar() {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U'

  return (
    <header className="bg-brand-900 text-white shadow-lg z-20 flex-shrink-0">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">✈</span>
          <div>
            <span className="text-lg font-bold tracking-tight">SkyFreight</span>
            <span className="text-brand-100 text-sm ml-2 hidden sm:inline">Portal</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-brand-800 transition-colors">
            <Bell size={18} />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-brand-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center
                              text-sm font-semibold">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-brand-200 mt-0.5 truncate max-w-[140px]">
                  {user?.roles?.[0]?.replace(/_/g, ' ')}
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border
                              border-gray-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600
                             hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
