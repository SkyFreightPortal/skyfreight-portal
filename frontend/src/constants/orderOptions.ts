import type { OrderStatus } from '@/types/order.types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED:    'Created',
  CONFIRMED:  'Confirmed',
  IN_TRANSIT: 'In Transit',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
}

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]
