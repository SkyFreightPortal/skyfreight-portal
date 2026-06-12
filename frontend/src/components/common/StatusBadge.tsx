import clsx from 'clsx'
import type { UserStatus, ApprovalStatus } from '@/types/auth.types'

type Status = UserStatus | 'PENDING' | 'APPROVED' | 'REJECTED'

const map: Record<string, string> = {
  ACTIVE:           'bg-green-100 text-green-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PENDING:          'bg-yellow-100 text-yellow-800',
  SUSPENDED:        'bg-red-100 text-red-800',
  REJECTED:         'bg-gray-100 text-gray-600',
  APPROVED:         'bg-green-100 text-green-800',
}

const labels: Record<string, string> = {
  ACTIVE:           'Active',
  PENDING_APPROVAL: 'Pending Approval',
  PENDING:          'Pending',
  SUSPENDED:        'Suspended',
  REJECTED:         'Rejected',
  APPROVED:         'Approved',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      map[status] ?? 'bg-gray-100 text-gray-600')}>
      {labels[status] ?? status}
    </span>
  )
}
