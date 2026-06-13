import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { offerApi } from '@/api/offerApi'
import { userApi } from '@/api/userApi'
import type { User } from '@/types/auth.types'
import type {
  AncillaryServiceType,
  OfferCreateRequest,
  RateType,
  ServiceType,
  TemperatureRequirement,
  TransitPreference,
} from '@/types/offer.types'
import {
  ANCILLARY_OPTIONS,
  RATE_TYPE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  TEMPERATURE_OPTIONS,
  TRANSIT_PREFERENCE_OPTIONS,
} from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/LoadingSpinner'

interface FormState {
  customerId: string
  originAirport: string
  destinationAirport: string
  serviceType: ServiceType
  commodity: string
  weightKg: string
  lengthCm: string
  widthCm: string
  heightCm: string
  temperatureRequirement: TemperatureRequirement
  dangerousGoods: boolean
  dgClass: string
  transitPreference: TransitPreference
  requestedCapacityKg: string
  rateType: RateType
  declaredValue: string
  ancillaryServices: AncillaryServiceType[]
  validityDays: string
}

const initialState: FormState = {
  customerId: '',
  originAirport: '',
  destinationAirport: '',
  serviceType: 'GENERAL_CARGO',
  commodity: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  temperatureRequirement: 'NONE',
  dangerousGoods: false,
  dgClass: '',
  transitPreference: 'STANDARD',
  requestedCapacityKg: '',
  rateType: 'PUBLISHED',
  declaredValue: '',
  ancillaryServices: [],
  validityDays: '',
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

export default function OfferCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reviseId = searchParams.get('revise')

  const [customers, setCustomers] = useState<User[]>([])
  const [loadingOffer, setLoadingOffer] = useState(!!reviseId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialState)

  useEffect(() => {
    userApi.list({ status: 'ACTIVE', size: 100 }).then(res => setCustomers(res.data.data.content))
  }, [])

  useEffect(() => {
    if (!reviseId) return
    offerApi.getById(Number(reviseId))
      .then(res => {
        const o = res.data.data
        setForm({
          customerId: String(o.customerId),
          originAirport: o.originAirport,
          destinationAirport: o.destinationAirport,
          serviceType: o.serviceType,
          commodity: o.commodity,
          weightKg: String(o.weightKg),
          lengthCm: o.lengthCm != null ? String(o.lengthCm) : '',
          widthCm: o.widthCm != null ? String(o.widthCm) : '',
          heightCm: o.heightCm != null ? String(o.heightCm) : '',
          temperatureRequirement: o.temperatureRequirement,
          dangerousGoods: o.dangerousGoods,
          dgClass: o.dgClass ?? '',
          transitPreference: o.transitPreference,
          requestedCapacityKg: String(o.requestedCapacityKg),
          rateType: o.rateType,
          declaredValue: o.declaredValue != null ? String(o.declaredValue) : '',
          ancillaryServices: o.ancillaryServices.map(a => a.serviceType),
          validityDays: '',
        })
      })
      .finally(() => setLoadingOffer(false))
  }, [reviseId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleAncillary = (type: AncillaryServiceType) =>
    setForm(f => ({
      ...f,
      ancillaryServices: f.ancillaryServices.includes(type)
        ? f.ancillaryServices.filter(t => t !== type)
        : [...f.ancillaryServices, type],
    }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.customerId) return setError('Please select a customer')
    if (form.originAirport.trim().length !== 3) return setError('Origin airport must be a 3-letter IATA code')
    if (form.destinationAirport.trim().length !== 3) return setError('Destination airport must be a 3-letter IATA code')
    if (!form.commodity.trim()) return setError('Commodity is required')
    if (!form.weightKg || Number(form.weightKg) <= 0) return setError('Weight must be greater than 0')
    if (!form.requestedCapacityKg || Number(form.requestedCapacityKg) <= 0) return setError('Requested capacity must be greater than 0')
    if (form.dangerousGoods && !form.dgClass.trim()) return setError('DG class is required when dangerous goods is selected')

    const payload: OfferCreateRequest = {
      customerId: Number(form.customerId),
      originAirport: form.originAirport.trim().toUpperCase(),
      destinationAirport: form.destinationAirport.trim().toUpperCase(),
      serviceType: form.serviceType,
      commodity: form.commodity.trim(),
      weightKg: Number(form.weightKg),
      lengthCm: form.lengthCm ? Number(form.lengthCm) : undefined,
      widthCm: form.widthCm ? Number(form.widthCm) : undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      temperatureRequirement: form.temperatureRequirement,
      dangerousGoods: form.dangerousGoods,
      dgClass: form.dangerousGoods ? form.dgClass.trim() : undefined,
      transitPreference: form.transitPreference,
      requestedCapacityKg: Number(form.requestedCapacityKg),
      rateType: form.rateType,
      declaredValue: form.declaredValue ? Number(form.declaredValue) : undefined,
      ancillaryServices: form.ancillaryServices,
      validityDays: form.validityDays ? Number(form.validityDays) : undefined,
    }

    setSubmitting(true)
    try {
      const res = reviseId
        ? await offerApi.revise(Number(reviseId), payload)
        : await offerApi.create(payload)
      navigate(`/offers/${res.data.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save offer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingOffer) return <PageLoader />

  return (
    <div>
      <PageHeader
        title={reviseId ? 'Revise Offer' : 'New Cargo Offer'}
        subtitle={reviseId
          ? 'Adjust the shipment details to generate a re-priced version of this offer'
          : 'Generate a priced cargo offer based on shipment details and service options'}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <Section title="Route & Shipment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Customer">
              <select value={form.customerId} onChange={e => update('customerId', e.target.value)} className={inputCls}>
                <option value="">Select customer…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company} — {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commodity">
              <input value={form.commodity} onChange={e => update('commodity', e.target.value)}
                className={inputCls} placeholder="e.g. Consumer electronics" maxLength={150} />
            </Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Field label="Origin Airport" hint="3-letter IATA code">
              <input value={form.originAirport}
                onChange={e => update('originAirport', e.target.value.toUpperCase())}
                className={inputCls + ' uppercase'} placeholder="JFK" maxLength={3} />
            </Field>
            <Field label="Destination Airport" hint="3-letter IATA code">
              <input value={form.destinationAirport}
                onChange={e => update('destinationAirport', e.target.value.toUpperCase())}
                className={inputCls + ' uppercase'} placeholder="LHR" maxLength={3} />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" min="0" step="0.1" value={form.weightKg}
                onChange={e => update('weightKg', e.target.value)} className={inputCls} placeholder="500" />
            </Field>
            <Field label="Declared Value (optional)" hint="Used for insurance pricing">
              <input type="number" min="0" step="0.01" value={form.declaredValue}
                onChange={e => update('declaredValue', e.target.value)} className={inputCls} placeholder="0.00" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Length (cm, optional)">
              <input type="number" min="0" step="0.1" value={form.lengthCm}
                onChange={e => update('lengthCm', e.target.value)} className={inputCls} placeholder="—" />
            </Field>
            <Field label="Width (cm, optional)">
              <input type="number" min="0" step="0.1" value={form.widthCm}
                onChange={e => update('widthCm', e.target.value)} className={inputCls} placeholder="—" />
            </Field>
            <Field label="Height (cm, optional)">
              <input type="number" min="0" step="0.1" value={form.heightCm}
                onChange={e => update('heightCm', e.target.value)} className={inputCls} placeholder="—" />
            </Field>
          </div>
        </Section>

        <Section title="Service Options">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Service Type">
              <select value={form.serviceType} onChange={e => update('serviceType', e.target.value as ServiceType)} className={inputCls}>
                {SERVICE_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Rate Type">
              <select value={form.rateType} onChange={e => update('rateType', e.target.value as RateType)} className={inputCls}>
                {RATE_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Field label="Temperature Requirement">
              <select value={form.temperatureRequirement}
                onChange={e => update('temperatureRequirement', e.target.value as TemperatureRequirement)} className={inputCls}>
                {TEMPERATURE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Transit Preference">
              <select value={form.transitPreference}
                onChange={e => update('transitPreference', e.target.value as TransitPreference)} className={inputCls}>
                {TRANSIT_PREFERENCE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Requested Capacity (kg)">
              <input type="number" min="0" step="0.1" value={form.requestedCapacityKg}
                onChange={e => update('requestedCapacityKg', e.target.value)} className={inputCls} placeholder="500" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
            <Field label="Validity (days, optional)" hint="Defaults to 7 days">
              <input type="number" min="1" step="1" value={form.validityDays}
                onChange={e => update('validityDays', e.target.value)} className={inputCls} placeholder="7" />
            </Field>
            <div className="flex items-center gap-2 pb-2.5">
              <input id="dg" type="checkbox" checked={form.dangerousGoods}
                onChange={e => update('dangerousGoods', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500" />
              <label htmlFor="dg" className="text-sm font-medium text-gray-700">Dangerous Goods</label>
            </div>
            {form.dangerousGoods && (
              <Field label="DG Class">
                <input value={form.dgClass} onChange={e => update('dgClass', e.target.value)}
                  className={inputCls} placeholder="e.g. Class 9 - Miscellaneous" maxLength={100} />
              </Field>
            )}
          </div>
        </Section>

        <Section title="Ancillary Services">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ANCILLARY_OPTIONS.map(([value, label]) => (
              <label key={value}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200
                           hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={form.ancillaryServices.includes(value)}
                  onChange={() => toggleAncillary(value)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500" />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/offers')}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm">
            {submitting ? 'Calculating…' : reviseId ? 'Revise Offer' : 'Create Offer'}
          </button>
        </div>
      </form>
    </div>
  )
}
