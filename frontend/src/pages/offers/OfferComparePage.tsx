import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { offerApi } from '@/api/offerApi'
import type { Offer } from '@/types/offer.types'
import { ANCILLARY_LABELS, RATE_TYPE_LABELS, SERVICE_TYPE_LABELS } from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

const ROW_LABEL_CLS = 'px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide bg-gray-50 sticky left-0'

export default function OfferComparePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ids = (searchParams.get('ids') ?? '')
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => !Number.isNaN(n) && n > 0)

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length < 2) {
      setLoading(false)
      return
    }
    offerApi.compare(ids)
      .then(res => setOffers(res.data.data))
      .catch((err: any) => setError(err.response?.data?.message ?? 'Failed to load offers'))
      .finally(() => setLoading(false))
  }, [ids.join(',')])

  if (loading) return <PageLoader />

  if (ids.length < 2) {
    return (
      <div>
        <PageHeader title="Compare Offers" />
        <p className="text-gray-500">Select at least two offers from the list to compare.</p>
        <Link to="/offers" className="inline-block mt-3 text-sm text-brand-700 hover:text-brand-900 font-medium">
          Back to Offers
        </Link>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => navigate('/offers')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
        <ArrowLeft size={14} /> Back to Offers
      </button>

      <PageHeader title="Compare Offers" subtitle={`Comparing ${offers.length} offers side-by-side`} />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className={ROW_LABEL_CLS}></th>
              {offers.map(o => (
                <th key={o.id} className="px-4 py-3 text-left bg-gray-50 min-w-[200px]">
                  <Link to={`/offers/${o.id}`} className="text-brand-700 hover:text-brand-900 font-semibold">
                    {o.offerNumber ?? `#${o.id}`}
                  </Link>
                  {o.version > 1 && <span className="ml-1 text-xs text-gray-400">v{o.version}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className={ROW_LABEL_CLS}>Status</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3"><StatusBadge status={o.status} /></td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Customer</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{o.customerCompany}</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Routing</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{o.originAirport} → {o.destinationAirport}</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Service Level</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{SERVICE_TYPE_LABELS[o.serviceType]}</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Rate Type</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{RATE_TYPE_LABELS[o.rateType]}</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Chargeable Weight</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{o.chargeableWeightKg} kg</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Transit Time</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{o.estimatedTransitHours} hrs</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Capacity Available</td>
              {offers.map(o => (
                <td key={o.id} className="px-4 py-3">
                  <span className={o.capacityAvailable ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                    {o.capacityAvailable ? 'Yes' : 'No'}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Ancillary Services</td>
              {offers.map(o => (
                <td key={o.id} className="px-4 py-3 text-gray-700">
                  {o.ancillaryServices.length > 0
                    ? o.ancillaryServices.map(a => ANCILLARY_LABELS[a.serviceType]).join(', ')
                    : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Valid Until</td>
              {offers.map(o => <td key={o.id} className="px-4 py-3 text-gray-700">{format(new Date(o.validUntil), 'dd MMM yyyy HH:mm')}</td>)}
            </tr>
            <tr>
              <td className={ROW_LABEL_CLS}>Total Price</td>
              {offers.map(o => (
                <td key={o.id} className="px-4 py-3 text-base font-bold text-gray-900">
                  {o.currency} {o.totalPrice.toFixed(2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
