import api from './axiosConfig'
import type { ApprovalWorkflow, ApprovalStatus } from '@/types/approval.types'
import type { PagedResponse } from './userApi'

export const approvalApi = {
  list: (status: ApprovalStatus = 'PENDING', page = 0) =>
    api.get<{ data: PagedResponse<ApprovalWorkflow> }>('/approvals', { params: { status, page } }),
  pendingCount: () =>
    api.get<{ data: { pendingCount: number } }>('/approvals/pending/count'),
  decide: (id: number, decision: ApprovalStatus, notes?: string) =>
    api.post<{ data: ApprovalWorkflow }>(`/approvals/${id}/decide`, { decision, notes }),
}
