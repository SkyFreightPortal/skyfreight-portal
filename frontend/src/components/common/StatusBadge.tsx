import clsx from 'clsx'
import type { UserStatus } from '@/types/auth.types'
import type { OfferStatus } from '@/types/offer.types'

type Status = UserStatus | OfferStatus | 'PENDING' | 'APPROVED' | 'REJECTED'

const map: Record<string, string> = {
  ACTIVE:           'bg-green-100 text-green-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PENDING:          'bg-yellow-100 text-yellow-800',
  SUSPENDED:        'bg-red-100 text-red-800',
  REJECTED:         'bg-gray-100 text-gray-600',
  APPROVED:         'bg-green-100 text-green-800',
  DRAFT:            'bg-gray-100 text-gray-600',
  ACCEPTED:         'bg-green-100 text-green-800',
  EXPIRED:          'bg-orange-100 text-orange-800',
  SUPERSEDED:       'bg-blue-100 text-blue-800',
  WITHDRAWN:        'bg-gray-100 text-gray-600',
}

const labels: Record<string, string> = {
  ACTIVE:           'Active',
  PENDING_APPROVAL: 'Pending Approval',
  PENDING:          'Pending',
  SUSPENDED:        'Suspended',
  REJECTED:         'Rejected',
  APPROVED:         'Approved',
  DRAFT:            'Draft',
  ACCEPTED:         'Accepted',
  EXPIRED:          'Expired',
  SUPERSEDED:       'Superseded',
  WITHDRAWN:        'Withdrawn',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      map[status] ?? 'bg-gray-100 text-gray-600')}>
      {labels[status] ?? status}
    </span>
  )
}
