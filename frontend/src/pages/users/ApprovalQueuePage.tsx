import { useEffect, useState, useCallback } from 'react'
import { approvalApi } from '@/api/approvalApi'
import type { ApprovalWorkflow, ApprovalStatus } from '@/types/approval.types'
import type { PagedResponse } from '@/api/userApi'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ApprovalQueuePage() {
  const [data, setData]       = useState<PagedResponse<ApprovalWorkflow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<ApprovalStatus>('PENDING')
  const [modal, setModal]     = useState<{ id: number; decision: ApprovalStatus } | null>(null)
  const [notes, setNotes]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await approvalApi.list(filter)
      setData(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!modal) return
    setSubmitting(true)
    try {
      await approvalApi.decide(modal.id, modal.decision, notes || undefined)
      setModal(null); setNotes(''); load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Approval Queue" subtitle="Review and process account registration requests" />

      <div className="flex gap-2 mb-5">
        {(['PENDING', 'APPROVED', 'REJECTED'] as ApprovalStatus[]).map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-brand-700 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Applicant', 'Company', 'Account Type', 'Requested', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!data?.content.length && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No {filter.toLowerCase()} requests
                  </td></tr>
                )}
                {data?.content.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {a.user.firstName} {a.user.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{a.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.user.company}</td>
                    <td className="px-4 py-3 text-gray-500">{a.user.accountType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      {a.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setModal({ id: a.id, decision: 'APPROVED' }); setNotes('') }}
                            className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900
                                       font-medium bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors">
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => { setModal({ id: a.id, decision: 'REJECTED' }); setNotes('') }}
                            className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900
                                       font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {modal.decision === 'APPROVED' ? 'Approve' : 'Reject'} Registration
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.decision === 'APPROVED'
                ? 'The applicant will be notified and can log in immediately.'
                : 'Please provide a reason for the rejection.'}
            </p>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional for approval, recommended for rejection)"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
                Cancel
              </button>
              <button onClick={submit} disabled={submitting}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors
                  disabled:opacity-60 ${modal.decision === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'}`}>
                {submitting ? 'Processing…' : `Confirm ${modal.decision === 'APPROVED' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
