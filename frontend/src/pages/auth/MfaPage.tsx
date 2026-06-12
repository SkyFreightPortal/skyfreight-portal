import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'

export default function MfaPage() {
  const { mfaRequired, mfaUserId, verifyMfa, loading, error, isAuthenticated, clearError } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<{ totpCode: string }>()

  useEffect(() => {
    if (!mfaRequired && !isAuthenticated) navigate('/login', { replace: true })
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [mfaRequired, isAuthenticated, navigate])

  useEffect(() => { return () => { clearError() } }, [])

  const onSubmit = ({ totpCode }: { totpCode: string }) => {
    if (mfaUserId) verifyMfa({ userId: mfaUserId, totpCode })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                        bg-brand-50 mb-4 mx-auto">
          <ShieldCheck className="text-brand-700" size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register('totpCode')}
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            className="w-full px-4 py-3 text-2xl font-mono text-center tracking-widest rounded-lg
                       border-2 border-gray-300 focus:outline-none focus:border-brand-500 transition-colors"
            placeholder="000000"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold
                       rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  )
}
