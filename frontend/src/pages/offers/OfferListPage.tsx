import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { offerApi } from '@/api/offerApi'
import type { PagedResponse } from '@/api/userApi'
import type { Offer, OfferStatus } from '@/types/offer.types'
import { OFFER_STATUS_OPTIONS, SERVICE_TYPE_LABELS } from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { Search, ChevronLeft, ChevronRight, Plus, GitCompare } from 'lucide-react'
import { format } from 'date-fns'

export default function OfferListPage() {
  const navigate = useNavigate()
  const { canCreateOffers } = usePermissions()
  const [data, setData] = useState<PagedResponse<Offer> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OfferStatus | ''>('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<number[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offerApi.list({
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

  const toggleSelected = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const compare = () => navigate(`/offers/compare?ids=${selected.join(',')}`)

  return (
    <div>
      <PageHeader
        title="Offers"
        subtitle="Browse, price and compare cargo offers"
        action={canCreateOffers() ? (
          <Link to="/offers/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white
                       text-sm font-semibold rounded-lg transition-colors">
            <Plus size={16} /> New Offer
          </Link>
        ) : undefined}
      />

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by offer #, commodity, customer…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as OfferStatus | ''); setPage(0) }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">All Statuses</option>
          {OFFER_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button onClick={compare} disabled={selected.length < 2}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                     bg-white border border-gray-300 text-gray-600 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed">
          <GitCompare size={16} /> Compare Selected ({selected.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    {['Offer #', 'Route', 'Service Type', 'Customer', 'Total Price', 'Status', 'Valid Until'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.content.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No offers found</td></tr>
                  )}
                  {data?.content.map(offer => (
                    <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(offer.id)}
                          onChange={() => toggleSelected(offer.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500" />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link to={`/offers/${offer.id}`} className="text-brand-700 hover:text-brand-900">
                          {offer.offerNumber ?? `#${offer.id}`}
                        </Link>
                        {offer.version > 1 && <span className="ml-1 text-xs text-gray-400">v{offer.version}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{offer.originAirport} → {offer.destinationAirport}</td>
                      <td className="px-4 py-3 text-gray-500">{SERVICE_TYPE_LABELS[offer.serviceType]}</td>
                      <td className="px-4 py-3 text-gray-500">{offer.customerCompany}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {offer.currency} {offer.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={offer.status} /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {offer.validUntil ? format(new Date(offer.validUntil), 'dd MMM yyyy HH:mm') : '—'}
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
