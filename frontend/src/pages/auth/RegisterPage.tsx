import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  firstName:   z.string().min(1, 'Required'),
  lastName:    z.string().min(1, 'Required'),
  email:       z.string().email('Invalid email'),
  password:    z.string().min(8, 'At least 8 characters'),
  company:     z.string().min(1, 'Required'),
  phone:       z.string().optional(),
  accountType: z.enum(['FREIGHT_FORWARDER', 'SHIPPER', 'CORPORATE']),
})
type FormData = z.infer<typeof schema>

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
)

const inputCls = `w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors`

export default function RegisterPage() {
  const { register: registerUser, loading, error } = useAuth()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'FREIGHT_FORWARDER' },
  })

  const onSubmit = async (data: FormData) => {
    const result = await registerUser(data)
    if (!('error' in result)) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600
                      flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Your account is pending review. You'll receive an email once approved (typically 1–2 business days).
          </p>
          <Link to="/login" className="inline-block bg-brand-700 text-white px-6 py-2.5 rounded-lg
                                       font-semibold hover:bg-brand-800 transition-colors text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600
                    flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">✈</span>
          <h1 className="text-2xl font-bold text-white mt-2">SkyFreight Portal</h1>
          <p className="text-brand-200 text-sm mt-1">Request Account Access</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" error={errors.firstName?.message}>
                <input {...register('firstName')} className={inputCls} placeholder="Jane" />
              </Field>
              <Field label="Last Name" error={errors.lastName?.message}>
                <input {...register('lastName')} className={inputCls} placeholder="Smith" />
              </Field>
            </div>

            <Field label="Work Email" error={errors.email?.message}>
              <input type="email" {...register('email')} className={inputCls}
                     placeholder="jane@yourcompany.com" />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input type="password" {...register('password')} className={inputCls}
                     placeholder="At least 8 characters" />
            </Field>

            <Field label="Company Name" error={errors.company?.message}>
              <input {...register('company')} className={inputCls} placeholder="Acme Logistics Ltd." />
            </Field>

            <Field label="Phone Number (optional)" error={errors.phone?.message}>
              <input {...register('phone')} className={inputCls} placeholder="+971 50 000 0000" />
            </Field>

            <Field label="Account Type" error={errors.accountType?.message}>
              <select {...register('accountType')} className={inputCls}>
                <option value="FREIGHT_FORWARDER">Freight Forwarder</option>
                <option value="SHIPPER">Shipper</option>
                <option value="CORPORATE">Corporate Account</option>
              </select>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold
                         rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Submitting…' : 'Request Access'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
