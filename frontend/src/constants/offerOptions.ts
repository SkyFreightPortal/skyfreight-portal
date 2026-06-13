import type {
  ServiceType,
  RateType,
  TemperatureRequirement,
  TransitPreference,
  OfferStatus,
  AncillaryServiceType,
} from '@/types/offer.types'

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  EXPRESS: 'Express',
  GENERAL_CARGO: 'General Cargo',
  PHARMA: 'Pharma',
  PERISHABLE: 'Perishable',
  VALUABLE_CARGO: 'Valuable Cargo',
  LIVE_ANIMALS: 'Live Animals',
  DANGEROUS_GOODS: 'Dangerous Goods',
  PRIORITY: 'Priority',
}

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  PUBLISHED: 'Published Rate',
  CONTRACT: 'Contract Rate',
  SPOT: 'Spot Rate',
  DYNAMIC: 'Dynamic Pricing',
  SEASONAL: 'Seasonal Rate',
}

export const TEMPERATURE_LABELS: Record<TemperatureRequirement, string> = {
  NONE: 'None (Ambient)',
  CHILLED: 'Chilled (2-8°C)',
  FROZEN: 'Frozen (-20°C)',
  CONTROLLED_ROOM_TEMP: 'Controlled Room Temp (15-25°C)',
}

export const TRANSIT_PREFERENCE_LABELS: Record<TransitPreference, string> = {
  STANDARD: 'Standard',
  EXPRESS: 'Express (Faster)',
  ECONOMY: 'Economy (Slower)',
}

export const ANCILLARY_LABELS: Record<AncillaryServiceType, string> = {
  DOOR_PICKUP: 'Door Pickup',
  LAST_MILE_DELIVERY: 'Last-Mile Delivery',
  REFRIGERATED_STORAGE: 'Refrigerated Storage',
  PALLETIZATION: 'Palletization',
  PACKAGING: 'Packaging',
  INSURANCE: 'Insurance',
  CUSTOMS_CLEARANCE: 'Customs Clearance',
  SCREENING: 'Screening',
  WAREHOUSING: 'Warehousing',
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  SUPERSEDED: 'Superseded',
  WITHDRAWN: 'Withdrawn',
}

export const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]
export const RATE_TYPE_OPTIONS = Object.entries(RATE_TYPE_LABELS) as [RateType, string][]
export const TEMPERATURE_OPTIONS = Object.entries(TEMPERATURE_LABELS) as [TemperatureRequirement, string][]
export const TRANSIT_PREFERENCE_OPTIONS = Object.entries(TRANSIT_PREFERENCE_LABELS) as [TransitPreference, string][]
export const ANCILLARY_OPTIONS = Object.entries(ANCILLARY_LABELS) as [AncillaryServiceType, string][]
export const OFFER_STATUS_OPTIONS = Object.entries(OFFER_STATUS_LABELS) as [OfferStatus, string][]
