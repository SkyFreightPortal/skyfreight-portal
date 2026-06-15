import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { orderApi } from '@/api/orderApi'
import type { PagedResponse } from '@/api/userApi'
import type { Order, OrderStatus } from '@/types/order.types'
import { ORDER_STATUS_OPTIONS } from '@/constants/orderOptions'
import { SERVICE_TYPE_LABELS } from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function OrderListPage() {
  const [data, setData] = useState<PagedResponse<Order> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orderApi.list({
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

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Track cargo orders converted from accepted offers"
      />

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by order #, commodity, customer…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(0) }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Order #', 'Route', 'Service Type', 'Customer', 'Consignee', 'Total Price', 'Status', 'Ship Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.content.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
                  )}
                  {data?.content.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link to={`/orders/${order.id}`} className="text-brand-700 hover:text-brand-900">
                          {order.orderNumber ?? `#${order.id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{order.originAirport} → {order.destinationAirport}</td>
                      <td className="px-4 py-3 text-gray-500">{SERVICE_TYPE_LABELS[order.serviceType]}</td>
                      <td className="px-4 py-3 text-gray-500">{order.customerCompany}</td>
                      <td className="px-4 py-3 text-gray-500">{order.consignee.company}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {order.currency} {order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {format(new Date(order.requestedShipDate), 'dd MMM yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
