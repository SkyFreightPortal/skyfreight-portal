import { useEffect, useState } from 'react'
import { Users, ClipboardCheck, UserCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { approvalApi } from '@/api/approvalApi'
import { userApi } from '@/api/userApi'
import { PageHeader } from '@/components/common/PageHeader'
import { Link } from 'react-router-dom'

interface StatCard { label: string; value: string | number; icon: React.ReactNode; color: string; to: string }

function Card({ label, value, icon, color, to }: StatCard) {
  return (
    <Link to={to}
      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm
                 hover:shadow-md transition-shadow flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { canApprove, canManageUsers } = usePermissions()
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [totalUsers, setTotalUsers] = useState<number>(0)

  useEffect(() => {
    if (canApprove()) {
      approvalApi.pendingCount()
        .then(r => setPendingCount(r.data.data.pendingCount))
        .catch(() => {})
    }
    if (canManageUsers()) {
      userApi.list({ size: 1 })
        .then(r => setTotalUsers(r.data.data.totalElements))
        .catch(() => {})
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName}!`}
        subtitle="Here's an overview of your SkyFreight Portal activity."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {canManageUsers() && (
          <Card label="Total Users" value={totalUsers}
            icon={<Users size={22} className="text-blue-600" />}
            color="bg-blue-50" to="/users" />
        )}
        {canApprove() && (
          <Card label="Pending Approvals" value={pendingCount}
            icon={<ClipboardCheck size={22} className="text-orange-600" />}
            color="bg-orange-50" to="/approvals" />
        )}
        <Card label="My Role" value={user?.roles?.[0]?.replace(/_/g, ' ') ?? '—'}
          icon={<ShieldCheck size={22} className="text-purple-600" />}
          color="bg-purple-50" to="/dashboard" />
      </div>

      {/* Role info panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck size={18} className="text-brand-600" /> Your Access Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {user?.roles?.map(role => (
            <div key={role} className="flex items-center gap-2 p-3 rounded-lg bg-brand-50
                                       border border-brand-100 text-sm text-brand-800 font-medium">
              <ShieldCheck size={14} className="text-brand-600" />
              {role.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Account: {user?.company} · {user?.accountType?.replace(/_/g, ' ')} ·
          Status: <span className="font-medium text-green-600">{user?.status}</span>
        </p>
      </div>
    </div>
  )
}
