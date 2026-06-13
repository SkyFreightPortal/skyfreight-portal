import type { RateType, ServiceType, TemperatureRequirement } from '@/types/offer.types'

export interface FlightLeg {
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  aircraftType: string
}

export interface RouteOption {
  type: 'DIRECT' | 'CONNECTION'
  legs: FlightLeg[]
  totalDurationMinutes: number
  connectionAirport: string | null
  layoverMinutes: number | null
  totalPrice: number | null
  capacityAvailable: boolean
}

export interface RouteSearchResult {
  origin: string
  destination: string
  date: string
  serviceType: ServiceType
  currency: string
  options: RouteOption[]
}

export interface FlightAvailability {
  flightNumber: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  aircraftType: string
  totalCapacityKg: number
  availableCapacityKg: number
  capacityUtilizationPct: number
  uldType: string
  totalUldPositions: number
  availableUldPositions: number
}

export interface AvailabilityResult {
  origin: string
  destination: string
  date: string
  flights: FlightAvailability[]
  connections: RouteOption[]
}

export interface CalendarDay {
  date: string
  dayOfWeek: string
  operatesDirectFlight: boolean
  price: number
  availabilityPct: number
  cheapest: boolean
}

export interface AirportPriceOption {
  originAirport: string
  destinationAirport: string
  price: number
  savings: number
  currency: string
}

export interface CalendarPricingResult {
  origin: string
  destination: string
  serviceType: ServiceType
  currency: string
  days: CalendarDay[]
  cheapestDate: string | null
  alternativeAirports: AirportPriceOption[]
}

export interface ServiceAlternative {
  serviceType: ServiceType
  price: number
  currency: string
  transitHours: number
  savings: number
}

export interface RecommendationResult {
  fasterRoutes: ServiceAlternative[]
  lowerCostRoutes: ServiceAlternative[]
  alternativeProducts: ServiceAlternative[]
  nearbyAirports: AirportPriceOption[]
}

export interface SearchParams {
  origin: string
  destination: string
  date: string
  serviceType: ServiceType
  rateType: RateType
  weightKg: number
  temperatureRequirement: TemperatureRequirement
  dangerousGoods: boolean
}
