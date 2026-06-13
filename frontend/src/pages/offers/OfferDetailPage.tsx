import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { offerApi } from '@/api/offerApi'
import type { Offer, OfferStatus } from '@/types/offer.types'
import {
  ANCILLARY_LABELS,
  RATE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  TEMPERATURE_LABELS,
  TRANSIT_PREFERENCE_LABELS,
} from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { CheckCircle, XCircle, Ban, History, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right">{value}</span>
  </div>
)

const ALLOWED_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  DRAFT: [],
  ACTIVE: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
  SUPERSEDED: [],
  WITHDRAWN: [],
}

export default function OfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canManageOffers } = usePermissions()
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offerApi.getById(Number(id))
      setOffer(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (status: OfferStatus, label: string) => {
    if (!offer) return
    if (!window.confirm(`${label} this offer?`)) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await offerApi.updateStatus(offer.id, status)
      setOffer(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update offer status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <PageLoader />
  if (!offer) return <p className="text-gray-500">Offer not found.</p>

  const transitions = ALLOWED_TRANSITIONS[offer.status]
  const canRevise = canManageOffers() && !['SUPERSEDED', 'WITHDRAWN'].includes(offer.status)

  return (
    <div>
      <button onClick={() => navigate('/offers')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
        <ArrowLeft size={14} /> Back to Offers
      </button>

      <PageHeader
        title={offer.offerNumber ?? `Offer #${offer.id}`}
        subtitle={`${offer.originAirport} → ${offer.destinationAirport} · ${SERVICE_TYPE_LABELS[offer.serviceType]} · ${offer.customerCompany}`}
        action={<StatusBadge status={offer.status} />}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Shipment details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Shipment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <Row label="Commodity" value={offer.commodity} />
                <Row label="Weight" value={`${offer.weightKg} kg`} />
                <Row label="Dimensions" value={
                  offer.lengthCm && offer.widthCm && offer.heightCm
                    ? `${offer.lengthCm} × ${offer.widthCm} × ${offer.heightCm} cm`
                    : '—'
                } />
                <Row label="Volumetric Weight" value={offer.volumetricWeightKg != null ? `${offer.volumetricWeightKg} kg` : '—'} />
                <Row label="Chargeable Weight" value={`${offer.chargeableWeightKg} kg`} />
              </div>
              <div>
                <Row label="Temperature Requirement" value={TEMPERATURE_LABELS[offer.temperatureRequirement]} />
                <Row label="Dangerous Goods" value={offer.dangerousGoods ? (offer.dgClass || 'Yes') : 'No'} />
                <Row label="Transit Preference" value={TRANSIT_PREFERENCE_LABELS[offer.transitPreference]} />
                <Row label="Estimated Transit Time" value={`${offer.estimatedTransitHours} hrs`} />
                <Row label="Requested Capacity" value={`${offer.requestedCapacityKg} kg`} />
                <Row label="Capacity Available" value={
                  <span className={offer.capacityAvailable ? 'text-green-700' : 'text-red-700'}>
                    {offer.capacityAvailable ? 'Yes' : 'No'}
                  </span>
                } />
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Price Breakdown</h2>
            <p className="text-xs text-gray-400 mb-3">Rate Type: {RATE_TYPE_LABELS[offer.rateType]}</p>
            <Row label="Base Charge" value={`${offer.currency} ${offer.baseCharge.toFixed(2)}`} />
            <Row label="Fuel Surcharge" value={`${offer.currency} ${offer.fuelSurcharge.toFixed(2)}`} />
            <Row label="Security Surcharge" value={`${offer.currency} ${offer.securitySurcharge.toFixed(2)}`} />
            <Row label="Screening Fee" value={`${offer.currency} ${offer.screeningFee.toFixed(2)}`} />
            <Row label="Terminal Handling Fee" value={`${offer.currency} ${offer.terminalHandlingFee.toFixed(2)}`} />
            <Row label="Customs Fee" value={`${offer.currency} ${offer.customsFee.toFixed(2)}`} />

            {offer.ancillaryServices.length > 0 && (
              <>
                <div className="pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ancillary Services</div>
                {offer.ancillaryServices.map(a => (
                  <Row key={a.id} label={ANCILLARY_LABELS[a.serviceType]} value={`${offer.currency} ${a.price.toFixed(2)}`} />
                ))}
                <Row label="Ancillary Total" value={`${offer.currency} ${offer.ancillaryTotal.toFixed(2)}`} />
              </>
            )}

            <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-200">
              <span className="text-base font-bold text-gray-900">Total Price</span>
              <span className="text-base font-bold text-gray-900">{offer.currency} {offer.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Validity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Validity</h2>
            <Row label="Valid From" value={format(new Date(offer.validFrom), 'dd MMM yyyy HH:mm')} />
            <Row label="Valid Until" value={format(new Date(offer.validUntil), 'dd MMM yyyy HH:mm')} />
            <Row label="Capacity Hold Until" value={format(new Date(offer.capacityHoldUntil), 'dd MMM yyyy HH:mm')} />
          </div>

          {/* Version */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Version</h2>
            <Row label="Version" value={`v${offer.version}`} />
            <Row label="Created By" value={offer.createdByName} />
            <Row label="Created" value={format(new Date(offer.createdAt), 'dd MMM yyyy HH:mm')} />
            {offer.parentOfferId && (
              <Link to={`/offers/${offer.parentOfferId}`}
                className="flex items-center gap-1.5 mt-3 text-sm text-brand-700 hover:text-brand-900 font-medium">
                <History size={14} /> View previous version
              </Link>
            )}
          </div>

          {/* Actions */}
          {canManageOffers() && (transitions.length > 0 || canRevise) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Actions</h2>
              <div className="flex flex-col gap-2">
                {transitions.includes('ACCEPTED') && (
                  <button onClick={() => handleStatusChange('ACCEPTED', 'Accept')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-60">
                    <CheckCircle size={16} /> Accept Offer
                  </button>
                )}
                {transitions.includes('REJECTED') && (
                  <button onClick={() => handleStatusChange('REJECTED', 'Reject')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-red-50 hover:bg-red-100 text-red-700 transition-colors disabled:opacity-60">
                    <XCircle size={16} /> Reject Offer
                  </button>
                )}
                {transitions.includes('WITHDRAWN') && (
                  <button onClick={() => handleStatusChange('WITHDRAWN', 'Withdraw')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-60">
                    <Ban size={16} /> Withdraw Offer
                  </button>
                )}
                {canRevise && (
                  <Link to={`/offers/new?revise=${offer.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors">
                    <History size={16} /> Revise Offer
                  </Link>
                )}
              </div>
            </div>
          )}

          {offer.status === 'EXPIRED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              This offer expired on {format(new Date(offer.validUntil), 'dd MMM yyyy HH:mm')}.
              {canManageOffers() && (
                <>
                  {' '}<Link to={`/offers/new?revise=${offer.id}`} className="font-semibold underline">Create a new version</Link>.
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
