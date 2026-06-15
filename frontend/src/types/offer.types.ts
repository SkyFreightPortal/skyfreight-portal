export type ServiceType =
  | 'EXPRESS'
  | 'GENERAL_CARGO'
  | 'PHARMA'
  | 'PERISHABLE'
  | 'VALUABLE_CARGO'
  | 'LIVE_ANIMALS'
  | 'DANGEROUS_GOODS'
  | 'PRIORITY'

export type RateType = 'PUBLISHED' | 'CONTRACT' | 'SPOT' | 'DYNAMIC' | 'SEASONAL'

export type TemperatureRequirement = 'NONE' | 'CHILLED' | 'FROZEN' | 'CONTROLLED_ROOM_TEMP'

export type TransitPreference = 'STANDARD' | 'EXPRESS' | 'ECONOMY'

export type OfferStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUPERSEDED'
  | 'WITHDRAWN'

export type AncillaryServiceType =
  | 'DOOR_PICKUP'
  | 'LAST_MILE_DELIVERY'
  | 'REFRIGERATED_STORAGE'
  | 'PALLETIZATION'
  | 'PACKAGING'
  | 'INSURANCE'
  | 'CUSTOMS_CLEARANCE'
  | 'SCREENING'
  | 'WAREHOUSING'

export interface AncillaryLine {
  id: number
  serviceType: AncillaryServiceType
  price: number
  notes: string | null
}

export interface Offer {
  id: number
  offerNumber: string | null
  customerId: number
  customerName: string
  customerCompany: string
  createdById: number
  createdByName: string
  originAirport: string
  destinationAirport: string
  serviceType: ServiceType
  commodity: string
  weightKg: number
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  volumetricWeightKg: number | null
  chargeableWeightKg: number
  temperatureRequirement: TemperatureRequirement
  dangerousGoods: boolean
  dgClass: string | null
  transitPreference: TransitPreference
  estimatedTransitHours: number
  requestedCapacityKg: number
  capacityAvailable: boolean
  rateCardId: number | null
  rateType: RateType
  currency: string
  baseCharge: number
  fuelSurcharge: number
  securitySurcharge: number
  screeningFee: number
  terminalHandlingFee: number
  customsFee: number
  ancillaryTotal: number
  totalPrice: number
  declaredValue: number | null
  ancillaryServices: AncillaryLine[]
  status: OfferStatus
  validFrom: string
  validUntil: string
  capacityHoldUntil: string
  version: number
  parentOfferId: number | null
  orderId: number | null
  createdAt: string
  updatedAt: string
}

export interface OfferCreateRequest {
  customerId: number
  originAirport: string
  destinationAirport: string
  serviceType: ServiceType
  commodity: string
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  temperatureRequirement: TemperatureRequirement
  dangerousGoods: boolean
  dgClass?: string
  transitPreference: TransitPreference
  requestedCapacityKg: number
  rateType: RateType
  declaredValue?: number
  ancillaryServices: AncillaryServiceType[]
  validityDays?: number
}

export interface OfferFilters {
  status?: OfferStatus
  originAirport?: string
  destinationAirport?: string
  serviceType?: ServiceType
  search?: string
  page?: number
  size?: number
}
