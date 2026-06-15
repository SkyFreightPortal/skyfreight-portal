import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { offerApi } from '@/api/offerApi'
import { orderApi } from '@/api/orderApi'
import type { Offer } from '@/types/offer.types'
import type { OrderCreateRequest, ShipmentPartyInput } from '@/types/order.types'
import { ANCILLARY_LABELS, SERVICE_TYPE_LABELS } from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { ArrowLeft } from 'lucide-react'
import { addDays, format } from 'date-fns'

interface PartyFormState {
  name: string
  company: string
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  country: string
  phone: string
  email: string
}

const emptyParty: PartyFormState = {
  name: '', company: '', addressLine1: '', addressLine2: '', city: '',
  stateProvince: '', postalCode: '', country: '', phone: '', email: '',
}

interface FormState {
  requestedShipDate: string
  specialInstructions: string
  consignor: PartyFormState
  consignee: PartyFormState
  includeNotifyParty: boolean
  notifyParty: PartyFormState
}

const inputCls = `w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors`

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">{title}</h2>
    {children}
  </div>
)

const PartyFields = ({ value, onChange }: { value: PartyFormState; onChange: (v: PartyFormState) => void }) => {
  const set = <K extends keyof PartyFormState>(key: K, v: string) => onChange({ ...value, [key]: v })
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Contact Name">
        <input value={value.name} onChange={e => set('name', e.target.value)} className={inputCls} maxLength={150} />
      </Field>
      <Field label="Company">
        <input value={value.company} onChange={e => set('company', e.target.value)} className={inputCls} maxLength={150} />
      </Field>
      <Field label="Address Line 1">
        <input value={value.addressLine1} onChange={e => set('addressLine1', e.target.value)} className={inputCls} maxLength={200} />
      </Field>
      <Field label="Address Line 2 (optional)">
        <input value={value.addressLine2} onChange={e => set('addressLine2', e.target.value)} className={inputCls} maxLength={200} />
      </Field>
      <Field label="City">
        <input value={value.city} onChange={e => set('city', e.target.value)} className={inputCls} maxLength={100} />
      </Field>
      <Field label="State / Province (optional)">
        <input value={value.stateProvince} onChange={e => set('stateProvince', e.target.value)} className={inputCls} maxLength={100} />
      </Field>
      <Field label="Postal Code (optional)">
        <input value={value.postalCode} onChange={e => set('postalCode', e.target.value)} className={inputCls} maxLength={20} />
      </Field>
      <Field label="Country">
        <input value={value.country} onChange={e => set('country', e.target.value)} className={inputCls} maxLength={100} />
      </Field>
      <Field label="Phone">
        <input value={value.phone} onChange={e => set('phone', e.target.value)} className={inputCls} maxLength={30} />
      </Field>
      <Field label="Email (optional)">
        <input type="email" value={value.email} onChange={e => set('email', e.target.value)} className={inputCls} maxLength={150} />
      </Field>
    </div>
  )
}

const initialState: FormState = {
  requestedShipDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  specialInstructions: '',
  consignor: { ...emptyParty },
  consignee: { ...emptyParty },
  includeNotifyParty: false,
  notifyParty: { ...emptyParty },
}

function toPartyInput(p: PartyFormState): ShipmentPartyInput {
  return {
    name: p.name.trim(),
    company: p.company.trim(),
    addressLine1: p.addressLine1.trim(),
    addressLine2: p.addressLine2.trim() || undefined,
    city: p.city.trim(),
    stateProvince: p.stateProvince.trim() || undefined,
    postalCode: p.postalCode.trim() || undefined,
    country: p.country.trim(),
    phone: p.phone.trim(),
    email: p.email.trim() || undefined,
  }
}

function validateParty(p: PartyFormState, label: string): string | null {
  if (!p.name.trim()) return `${label}: contact name is required`
  if (!p.company.trim()) return `${label}: company is required`
  if (!p.addressLine1.trim()) return `${label}: address line 1 is required`
  if (!p.city.trim()) return `${label}: city is required`
  if (!p.country.trim()) return `${label}: country is required`
  if (!p.phone.trim()) return `${label}: phone is required`
  return null
}

export default function OrderCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const offerId = searchParams.get('offerId')

  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialState)

  useEffect(() => {
    if (!offerId) {
      setLoadError('No offer specified. Start order creation from an accepted offer.')
      setLoading(false)
      return
    }
    offerApi.getById(Number(offerId))
      .then(res => setOffer(res.data.data))
      .catch(() => setLoadError('Offer not found.'))
      .finally(() => setLoading(false))
  }, [offerId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!offer) return

    if (!form.requestedShipDate) return setError('Requested ship date is required')

    const consignorErr = validateParty(form.consignor, 'Consignor')
    if (consignorErr) return setError(consignorErr)
    const consigneeErr = validateParty(form.consignee, 'Consignee')
    if (consigneeErr) return setError(consigneeErr)
    if (form.includeNotifyParty) {
      const notifyErr = validateParty(form.notifyParty, 'Notify Party')
      if (notifyErr) return setError(notifyErr)
    }

    const payload: OrderCreateRequest = {
      offerId: offer.id,
      requestedShipDate: form.requestedShipDate,
      specialInstructions: form.specialInstructions.trim() || undefined,
      consignor: toPartyInput(form.consignor),
      consignee: toPartyInput(form.consignee),
      notifyParty: form.includeNotifyParty ? toPartyInput(form.notifyParty) : undefined,
    }

    setSubmitting(true)
    try {
      const res = await orderApi.create(payload)
      navigate(`/orders/${res.data.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />

  if (loadError || !offer) {
    return (
      <div>
        <PageHeader title="Create Order" />
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {loadError ?? 'Offer not found.'}
        </div>
      </div>
    )
  }

  if (offer.status !== 'ACCEPTED') {
    return (
      <div>
        <PageHeader title="Create Order" />
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Only accepted offers can be converted to an order. This offer has status "{offer.status}".
        </div>
        <Link to={`/offers/${offer.id}`} className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-700 hover:text-brand-900 font-medium">
          <ArrowLeft size={14} /> Back to Offer
        </Link>
      </div>
    )
  }

  if (offer.orderId) {
    return (
      <div>
        <PageHeader title="Create Order" />
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          This offer has already been converted to an order.
        </div>
        <Link to={`/orders/${offer.orderId}`} className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand-700 hover:text-brand-900 font-medium">
          View Order
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to={`/offers/${offer.id}`}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
        <ArrowLeft size={14} /> Back to Offer
      </Link>

      <PageHeader
        title="Create Order"
        subtitle={`Convert offer ${offer.offerNumber ?? `#${offer.id}`} into a firm order`}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Section title="Order Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 text-sm">
          <div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Route</span>
              <span className="font-medium text-gray-900">{offer.originAirport} → {offer.destinationAirport}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Service Type</span>
              <span className="font-medium text-gray-900">{SERVICE_TYPE_LABELS[offer.serviceType]}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Commodity</span>
              <span className="font-medium text-gray-900">{offer.commodity}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Chargeable Weight</span>
              <span className="font-medium text-gray-900">{offer.chargeableWeightKg} kg</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Requested Capacity</span>
              <span className="font-medium text-gray-900">{offer.requestedCapacityKg} kg</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900">{offer.customerCompany}</span>
            </div>
            {offer.ancillaryServices.length > 0 && (
              <div className="py-2 border-b border-gray-50">
                <span className="text-gray-500 block mb-1">Ancillary Services</span>
                <ul className="list-disc list-inside text-gray-700">
                  {offer.ancillaryServices.map(a => (
                    <li key={a.id}>{ANCILLARY_LABELS[a.serviceType]} — {offer.currency} {a.price.toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-between py-2 mt-1">
              <span className="text-base font-bold text-gray-900">Total Price</span>
              <span className="text-base font-bold text-gray-900">{offer.currency} {offer.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Section>

      <form onSubmit={onSubmit}>
        <Section title="Shipment Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Requested Ship Date">
              <input type="date" value={form.requestedShipDate}
                onChange={e => update('requestedShipDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Special Instructions (optional)">
              <input value={form.specialInstructions}
                onChange={e => update('specialInstructions', e.target.value)} className={inputCls} maxLength={500} />
            </Field>
          </div>
        </Section>

        <Section title="Consignor (Shipper)">
          <PartyFields value={form.consignor} onChange={v => update('consignor', v)} />
        </Section>

        <Section title="Consignee (Receiver)">
          <PartyFields value={form.consignee} onChange={v => update('consignee', v)} />
        </Section>

        <Section title="Notify Party">
          <div className="flex items-center gap-2 mb-4">
            <input id="includeNotify" type="checkbox" checked={form.includeNotifyParty}
              onChange={e => update('includeNotifyParty', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500" />
            <label htmlFor="includeNotify" className="text-sm font-medium text-gray-700">Include a notify party</label>
          </div>
          {form.includeNotifyParty && (
            <PartyFields value={form.notifyParty} onChange={v => update('notifyParty', v)} />
          )}
        </Section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(`/offers/${offer.id}`)}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm">
            {submitting ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  )
}
