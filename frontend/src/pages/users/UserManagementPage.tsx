import { useEffect, useState, useCallback } from 'react'
import { userApi, type PagedResponse } from '@/api/userApi'
import type { User, UserStatus } from '@/types/auth.types'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function UserManagementPage() {
  const [data, setData] = useState<PagedResponse<User> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        size: 15,
      })
      setData(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (userId: number, status: UserStatus) => {
    await userApi.updateStatus(userId, status)
    load()
  }

  return (
    <div>
      <PageHeader title="User Management" subtitle="View and manage all portal user accounts" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by name, email, company…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as UserStatus | ''); setPage(0) }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Email', 'Company', 'Account Type', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.content.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
                  )}
                  {data?.content.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3 text-gray-500">{user.company}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {user.accountType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {user.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >Suspend</button>
                          )}
                          {user.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              className="text-xs text-green-600 hover:text-green-800 font-medium"
                            >Activate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {data.number * data.size + 1}–{Math.min((data.number + 1) * data.size, data.totalElements)} of {data.totalElements}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
