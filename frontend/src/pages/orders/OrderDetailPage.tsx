import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '@/api/orderApi'
import type { Order, OrderStatus, ShipmentParty } from '@/types/order.types'
import { ANCILLARY_LABELS, SERVICE_TYPE_LABELS } from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { usePermissions } from '@/hooks/usePermissions'
import { CheckCircle, Ban, Truck, PackageCheck, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right">{value}</span>
  </div>
)

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

const PartyCard = ({ title, party }: { title: string; party: ShipmentParty | null }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">{title}</h2>
    {party ? (
      <>
        <Row label="Contact" value={party.name} />
        <Row label="Company" value={party.company} />
        <Row label="Address" value={
          <span>
            {party.addressLine1}
            {party.addressLine2 && <>, {party.addressLine2}</>}
            <br />
            {party.city}{party.stateProvince ? `, ${party.stateProvince}` : ''} {party.postalCode ?? ''}
            <br />
            {party.country}
          </span>
        } />
        <Row label="Phone" value={party.phone} />
        {party.email && <Row label="Email" value={party.email} />}
      </>
    ) : (
      <p className="text-sm text-gray-400">Not specified</p>
    )}
  </div>
)

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canManageOffers } = usePermissions()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orderApi.getById(Number(id))
      setOrder(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (status: OrderStatus, label: string) => {
    if (!order) return
    if (!window.confirm(`${label} this order?`)) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await orderApi.updateStatus(order.id, status)
      setOrder(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update order status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <PageLoader />
  if (!order) return <p className="text-gray-500">Order not found.</p>

  const transitions = ALLOWED_TRANSITIONS[order.status]

  return (
    <div>
      <button onClick={() => navigate('/orders')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
        <ArrowLeft size={14} /> Back to Orders
      </button>

      <PageHeader
        title={order.orderNumber ?? `Order #${order.id}`}
        subtitle={`${order.originAirport} → ${order.destinationAirport} · ${SERVICE_TYPE_LABELS[order.serviceType]} · ${order.customerCompany}`}
        action={<StatusBadge status={order.status} />}
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
                <Row label="Commodity" value={order.commodity} />
                <Row label="Chargeable Weight" value={`${order.chargeableWeightKg} kg`} />
                <Row label="Requested Capacity" value={`${order.requestedCapacityKg} kg`} />
              </div>
              <div>
                <Row label="Requested Ship Date" value={format(new Date(order.requestedShipDate), 'dd MMM yyyy')} />
                <Row label="Special Instructions" value={order.specialInstructions || '—'} />
              </div>
            </div>
          </div>

          {/* Consignor / Consignee / Notify Party */}
          <PartyCard title="Consignor (Shipper)" party={order.consignor} />
          <PartyCard title="Consignee (Receiver)" party={order.consignee} />
          <PartyCard title="Notify Party" party={order.notifyParty} />

          {/* Price */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Products & Ancillary Services</h2>
            {order.ancillaryServices.length > 0 && (
              <>
                <div className="pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ancillary Services</div>
                {order.ancillaryServices.map(a => (
                  <Row key={a.id} label={ANCILLARY_LABELS[a.serviceType]} value={`${order.currency} ${a.price.toFixed(2)}`} />
                ))}
              </>
            )}
            <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-200">
              <span className="text-base font-bold text-gray-900">Total Price</span>
              <span className="text-base font-bold text-gray-900">{order.currency} {order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Order info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Order Info</h2>
            <Row label="Created By" value={order.createdByName} />
            <Row label="Created" value={format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')} />
            <Link to={`/offers/${order.offerId}`}
              className="flex items-center gap-1.5 mt-3 text-sm text-brand-700 hover:text-brand-900 font-medium">
              View source offer {order.offerNumber ? `(${order.offerNumber})` : ''}
            </Link>
          </div>

          {/* Actions */}
          {canManageOffers() && transitions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Actions</h2>
              <div className="flex flex-col gap-2">
                {transitions.includes('CONFIRMED') && (
                  <button onClick={() => handleStatusChange('CONFIRMED', 'Confirm')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors disabled:opacity-60">
                    <CheckCircle size={16} /> Confirm Order
                  </button>
                )}
                {transitions.includes('IN_TRANSIT') && (
                  <button onClick={() => handleStatusChange('IN_TRANSIT', 'Mark as in transit')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors disabled:opacity-60">
                    <Truck size={16} /> Mark In Transit
                  </button>
                )}
                {transitions.includes('DELIVERED') && (
                  <button onClick={() => handleStatusChange('DELIVERED', 'Mark as delivered')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-60">
                    <PackageCheck size={16} /> Mark Delivered
                  </button>
                )}
                {transitions.includes('CANCELLED') && (
                  <button onClick={() => handleStatusChange('CANCELLED', 'Cancel')} disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-red-50 hover:bg-red-100 text-red-700 transition-colors disabled:opacity-60">
                    <Ban size={16} /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
