import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { searchApi } from '@/api/searchApi'
import type {
  AirportPriceOption,
  AvailabilityResult,
  CalendarPricingResult,
  RecommendationResult,
  RouteOption,
  RouteSearchResult,
  SearchParams,
  ServiceAlternative,
} from '@/types/search.types'
import type { RateType, ServiceType, TemperatureRequirement } from '@/types/offer.types'
import {
  RATE_TYPE_OPTIONS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_OPTIONS,
  TEMPERATURE_OPTIONS,
} from '@/constants/offerOptions'
import { PageHeader } from '@/components/common/PageHeader'
import { Search as SearchIcon } from 'lucide-react'

interface FormState {
  originAirport: string
  destinationAirport: string
  date: string
  commodity: string
  serviceType: ServiceType
  rateType: RateType
  weightKg: string
  temperatureRequirement: TemperatureRequirement
  dangerousGoods: boolean
}

const today = () => format(new Date(), 'yyyy-MM-dd')

const initialState: FormState = {
  originAirport: '',
  destinationAirport: '',
  date: today(),
  commodity: '',
  serviceType: 'GENERAL_CARGO',
  rateType: 'PUBLISHED',
  weightKg: '100',
  temperatureRequirement: 'NONE',
  dangerousGoods: false,
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

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

const formatTime = (time: string) => time.slice(0, 5)

const formatDate = (date: string, pattern = 'EEE, dd MMM yyyy') => format(parseISO(date), pattern)

const shortDay = (dayOfWeek: string) => dayOfWeek.charAt(0) + dayOfWeek.slice(1, 3).toLowerCase()

const TypeBadge = ({ type }: { type: 'DIRECT' | 'CONNECTION' }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
    type === 'DIRECT' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
  }`}>
    {type === 'DIRECT' ? 'Direct' : 'Connection'}
  </span>
)

const CapacityBadge = ({ available }: { available: boolean }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
    available ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
  }`}>
    {available ? 'Available' : 'Limited'}
  </span>
)

const RouteOptionRow = ({ option, currency }: { option: RouteOption; currency: string }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3"><TypeBadge type={option.type} /></td>
    <td className="px-4 py-3 text-gray-700">
      {option.legs.map((leg, i) => (
        <div key={i} className={i > 0 ? 'mt-1' : ''}>
          <span className="font-medium text-gray-900">{leg.flightNumber}</span>{' '}
          {leg.origin} → {leg.destination}{' '}
          <span className="text-gray-400">({formatTime(leg.departureTime)}–{formatTime(leg.arrivalTime)})</span>
        </div>
      ))}
      {option.type === 'CONNECTION' && option.connectionAirport && (
        <div className="text-xs text-gray-400 mt-1">
          Connect at {option.connectionAirport} — {formatDuration(option.layoverMinutes ?? 0)} layover
        </div>
      )}
    </td>
    <td className="px-4 py-3 text-gray-500">{formatDuration(option.totalDurationMinutes)}</td>
    <td className="px-4 py-3 font-medium text-gray-900">
      {option.totalPrice != null ? `${currency} ${option.totalPrice.toFixed(2)}` : '—'}
    </td>
    <td className="px-4 py-3"><CapacityBadge available={option.capacityAvailable} /></td>
  </tr>
)

const ServiceAlternativeCard = ({ alt, label }: { alt: ServiceAlternative; label?: string }) => (
  <div className="rounded-lg border border-gray-200 p-3">
    <p className="text-sm font-semibold text-gray-900">{SERVICE_TYPE_LABELS[alt.serviceType]}</p>
    {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
    <p className="text-sm text-gray-700 mt-1">{alt.currency} {alt.price.toFixed(2)}</p>
    <p className="text-xs text-gray-500">~{alt.transitHours}h transit</p>
    {alt.savings > 0 && (
      <p className="text-xs text-green-700 mt-1">Save {alt.currency} {alt.savings.toFixed(2)}</p>
    )}
  </div>
)

const AirportOptionCard = ({ option }: { option: AirportPriceOption }) => (
  <div className="rounded-lg border border-gray-200 p-3">
    <p className="text-sm font-semibold text-gray-900">{option.originAirport} → {option.destinationAirport}</p>
    <p className="text-sm text-gray-700 mt-1">{option.currency} {option.price.toFixed(2)}</p>
    {option.savings > 0 && (
      <p className="text-xs text-green-700 mt-1">Save {option.currency} {option.savings.toFixed(2)}</p>
    )}
  </div>
)

export default function ShoppingSearchPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [routes, setRoutes] = useState<RouteSearchResult | null>(null)
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [calendar, setCalendar] = useState<CalendarPricingResult | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null)

  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({})

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.originAirport.trim().length !== 3) return setError('Origin airport must be a 3-letter IATA code')
    if (form.destinationAirport.trim().length !== 3) return setError('Destination airport must be a 3-letter IATA code')
    if (!form.date) return setError('Date is required')
    if (!form.weightKg || Number(form.weightKg) <= 0) return setError('Weight must be greater than 0')

    const params: SearchParams = {
      origin: form.originAirport.trim().toUpperCase(),
      destination: form.destinationAirport.trim().toUpperCase(),
      date: form.date,
      serviceType: form.serviceType,
      rateType: form.rateType,
      weightKg: Number(form.weightKg),
      temperatureRequirement: form.temperatureRequirement,
      dangerousGoods: form.dangerousGoods,
    }

    setLoading(true)
    setSearched(true)
    setRoutes(null)
    setAvailability(null)
    setCalendar(null)
    setRecommendations(null)

    const [routesRes, availabilityRes, calendarRes, recommendationsRes] = await Promise.allSettled([
      searchApi.routes(params),
      searchApi.availability(params),
      searchApi.calendar(params),
      searchApi.recommendations(params),
    ])

    const errs: Record<string, string> = {}

    if (routesRes.status === 'fulfilled') setRoutes(routesRes.value.data.data)
    else errs.routes = routesRes.reason.response?.data?.message ?? 'Failed to load route options'

    if (availabilityRes.status === 'fulfilled') setAvailability(availabilityRes.value.data.data)
    else errs.availability = availabilityRes.reason.response?.data?.message ?? 'Failed to load availability'

    if (calendarRes.status === 'fulfilled') setCalendar(calendarRes.value.data.data)
    else errs.calendar = calendarRes.reason.response?.data?.message ?? 'Failed to load calendar pricing'

    if (recommendationsRes.status === 'fulfilled') setRecommendations(recommendationsRes.value.data.data)
    else errs.recommendations = recommendationsRes.reason.response?.data?.message ?? 'Failed to load recommendations'

    setSectionErrors(errs)
    setLoading(false)
  }

  const hasRecommendations = !!recommendations && (
    recommendations.fasterRoutes.length > 0 ||
    recommendations.lowerCostRoutes.length > 0 ||
    recommendations.alternativeProducts.length > 0 ||
    recommendations.nearbyAirports.length > 0
  )

  return (
    <div>
      <PageHeader
        title="Shop & Search"
        subtitle="Search routes, check availability, compare calendar pricing and get recommendations"
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSearch}>
        <Section title="Search Shipments">
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
            <Field label="Date">
              <input type="date" value={form.date}
                onChange={e => update('date', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Commodity (optional)">
              <input value={form.commodity} onChange={e => update('commodity', e.target.value)}
                className={inputCls} placeholder="e.g. Consumer electronics" maxLength={150} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Field label="Product Type">
              <select value={form.serviceType} onChange={e => update('serviceType', e.target.value as ServiceType)} className={inputCls}>
                {SERVICE_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Weight (kg)">
              <input type="number" min="0" step="0.1" value={form.weightKg}
                onChange={e => update('weightKg', e.target.value)} className={inputCls} placeholder="100" />
            </Field>
            <Field label="Rate Type">
              <select value={form.rateType} onChange={e => update('rateType', e.target.value as RateType)} className={inputCls}>
                {RATE_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Temperature Requirement">
              <select value={form.temperatureRequirement}
                onChange={e => update('temperatureRequirement', e.target.value as TemperatureRequirement)} className={inputCls}>
                {TEMPERATURE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.dangerousGoods}
                onChange={e => update('dangerousGoods', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500" />
              Dangerous Goods
            </label>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold
                         rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm">
              <SearchIcon size={16} /> {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </Section>
      </form>

      {searched && (
        <>
          <Section title="Route Options">
            {sectionErrors.routes && (
              <p className="text-sm text-red-600 mb-2">{sectionErrors.routes}</p>
            )}
            {routes && (
              routes.options.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No routes found for this date.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Type', 'Flights', 'Total Duration', 'Price', 'Capacity'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {routes.options.map((opt, i) => (
                        <RouteOptionRow key={i} option={opt} currency={routes.currency} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </Section>

          <Section title="Availability">
            {sectionErrors.availability && (
              <p className="text-sm text-red-600 mb-2">{sectionErrors.availability}</p>
            )}
            {availability && (
              <>
                {availability.flights.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No scheduled flights for this date.</p>
                ) : (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {['Flight', 'Departs', 'Arrives', 'Aircraft', 'Space Available', 'ULD'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {availability.flights.map(f => (
                          <tr key={f.flightNumber} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{f.flightNumber}</td>
                            <td className="px-4 py-3 text-gray-500">{formatTime(f.departureTime)}</td>
                            <td className="px-4 py-3 text-gray-500">{formatTime(f.arrivalTime)}</td>
                            <td className="px-4 py-3 text-gray-500">{f.aircraftType}</td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full bg-brand-600"
                                    style={{ width: `${100 - f.capacityUtilizationPct}%` }} />
                                </div>
                                <span>{f.availableCapacityKg.toFixed(0)} / {f.totalCapacityKg.toFixed(0)} kg</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {f.uldType}: {f.availableUldPositions} / {f.totalUldPositions}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {availability.connections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Connection Options</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            {['Type', 'Flights', 'Total Duration'].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {availability.connections.map((opt, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3"><TypeBadge type={opt.type} /></td>
                              <td className="px-4 py-3 text-gray-700">
                                {opt.legs.map((leg, j) => (
                                  <div key={j} className={j > 0 ? 'mt-1' : ''}>
                                    <span className="font-medium text-gray-900">{leg.flightNumber}</span>{' '}
                                    {leg.origin} → {leg.destination}{' '}
                                    <span className="text-gray-400">({formatTime(leg.departureTime)}–{formatTime(leg.arrivalTime)})</span>
                                  </div>
                                ))}
                                {opt.connectionAirport && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Connect at {opt.connectionAirport} — {formatDuration(opt.layoverMinutes ?? 0)} layover
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500">{formatDuration(opt.totalDurationMinutes)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section title="Calendar Pricing">
            {sectionErrors.calendar && (
              <p className="text-sm text-red-600 mb-2">{sectionErrors.calendar}</p>
            )}
            {calendar && (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Date', 'Day', 'Flight', 'Price', 'Availability', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {calendar.days.map(d => (
                        <tr key={d.date} className={`hover:bg-gray-50 transition-colors ${d.cheapest ? 'bg-green-50/50' : ''}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">{formatDate(d.date, 'dd MMM yyyy')}</td>
                          <td className="px-4 py-3 text-gray-500">{shortDay(d.dayOfWeek)}</td>
                          <td className="px-4 py-3 text-gray-500">{d.operatesDirectFlight ? 'Direct flight' : '—'}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{calendar.currency} {d.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-500">{d.availabilityPct.toFixed(0)}%</td>
                          <td className="px-4 py-3">
                            {d.cheapest && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                Cheapest
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {calendar.alternativeAirports.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alternative Airports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {calendar.alternativeAirports.map((opt, i) => (
                        <AirportOptionCard key={i} option={opt} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section title="Recommendations">
            {sectionErrors.recommendations && (
              <p className="text-sm text-red-600 mb-2">{sectionErrors.recommendations}</p>
            )}
            {recommendations && (
              hasRecommendations ? (
                <div className="space-y-5">
                  {recommendations.fasterRoutes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Faster Routes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recommendations.fasterRoutes.map((alt, i) => <ServiceAlternativeCard key={i} alt={alt} />)}
                      </div>
                    </div>
                  )}
                  {recommendations.lowerCostRoutes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lower-Cost Routes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recommendations.lowerCostRoutes.map((alt, i) => <ServiceAlternativeCard key={i} alt={alt} />)}
                      </div>
                    </div>
                  )}
                  {recommendations.alternativeProducts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alternative Products</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recommendations.alternativeProducts.map((alt, i) => <ServiceAlternativeCard key={i} alt={alt} />)}
                      </div>
                    </div>
                  )}
                  {recommendations.nearbyAirports.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nearby Airports</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recommendations.nearbyAirports.map((opt, i) => <AirportOptionCard key={i} option={opt} />)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-6 text-center">No alternative recommendations for this search.</p>
              )
            )}
          </Section>
        </>
      )}
    </div>
  )
}
