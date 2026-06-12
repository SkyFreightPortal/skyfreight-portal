import type { User } from './auth.types'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ApprovalWorkflow {
  id:          number
  user:        User
  status:      ApprovalStatus
  reviewedBy:  string | null
  reviewNotes: string | null
  reviewedAt:  string | null
  createdAt:   string
}
