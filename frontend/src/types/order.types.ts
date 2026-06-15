import type { AncillaryLine, ServiceType } from '@/types/offer.types'

export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

export interface ShipmentParty {
  name: string
  company: string
  addressLine1: string
  addressLine2: string | null
  city: string
  stateProvince: string | null
  postalCode: string | null
  country: string
  phone: string
  email: string | null
}

export interface ShipmentPartyInput {
  name: string
  company: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateProvince?: string
  postalCode?: string
  country: string
  phone: string
  email?: string
}

export interface Order {
  id: number
  orderNumber: string | null
  offerId: number
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
  chargeableWeightKg: number
  requestedCapacityKg: number
  currency: string
  totalPrice: number
  requestedShipDate: string
  specialInstructions: string | null
  consignor: ShipmentParty
  consignee: ShipmentParty
  notifyParty: ShipmentParty | null
  ancillaryServices: AncillaryLine[]
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface OrderCreateRequest {
  offerId: number
  requestedShipDate: string
  specialInstructions?: string
  consignor: ShipmentPartyInput
  consignee: ShipmentPartyInput
  notifyParty?: ShipmentPartyInput
}

export interface OrderFilters {
  status?: OrderStatus
  originAirport?: string
  destinationAirport?: string
  serviceType?: ServiceType
  search?: string
  page?: number
  size?: number
}
