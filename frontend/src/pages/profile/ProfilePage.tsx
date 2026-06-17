import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { UserCircle, AlertCircle, CheckCircle, Mail, Building, Phone, Shield, Clock, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch } from '@/store'
import { updateUser } from '@/store/authSlice'
import { userApi } from '@/api/userApi'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/LoadingSpinner'
import type { User } from '@/types/auth.types'

// Form validation schema
const profileFormSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
  company: z.string()
    .max(150, 'Company must be at most 150 characters')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\+]*$/, 'Phone must contain only digits, spaces, hyphens, parentheses, or leading +')
    .max(20, 'Phone must be at most 20 characters')
    .optional()
    .or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

export default function ProfilePage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<User | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
  })

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await userApi.getById(user.id)
        const userData = response.data.data
        setProfileData(userData)
        
        // Pre-populate form with current values
        reset({
          firstName: userData.firstName,
          lastName: userData.lastName,
          company: userData.company || '',
          phone: userData.phone || '',
        })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile information. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id, reset])

  const handleRetry = () => {
    if (user?.id) {
      setLoading(true)
      setError(null)
      userApi.getById(user.id)
        .then(response => {
          const userData = response.data.data
          setProfileData(userData)
          reset({
            firstName: userData.firstName,
            lastName: userData.lastName,
            company: userData.company || '',
            phone: userData.phone || '',
          })
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load profile information. Please try again.')
        })
        .finally(() => setLoading(false))
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return
    
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const response = await userApi.update(user.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company || '',
        phone: data.phone || '',
      })
      
      const updatedUser = response.data.data
      
      // Update Redux store with new user data
      dispatch(updateUser(updatedUser))
      
      // Update local profile data
      setProfileData(updatedUser)
      
      // Show success message
      setSuccessMessage('Profile updated successfully')
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (profileData) {
      reset({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        company: profileData.company || '',
        phone: profileData.phone || '',
      })
      setError(null)
      setSuccessMessage(null)
    }
  }

  // Show loading state
  if (loading) {
    return <PageLoader />
  }

  // Show error state with retry
  if (error && !profileData) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Manage your personal information" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to load profile</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium
                         rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) return null

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="View and update your personal information"
      />

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error message (during form submission) */}
      {error && profileData && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Failed to update profile</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Header Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-brand-700">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{profileData.email}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200">
                <Shield size={14} className="text-brand-600" />
                <span className="text-sm font-medium text-brand-700">
                  {profileData.roles[0]?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details and Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Read-only Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCircle size={20} className="text-brand-600" />
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Mail size={14} />
                  Email Address
                </label>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {profileData.email}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Shield size={14} />
                  Account Type
                </label>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {profileData.accountType.replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Shield size={14} />
                  Roles
                </label>
                <div className="space-y-1">
                  {profileData.roles.map(role => (
                    <p key={role} className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      {role.replace(/_/g, ' ')}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Shield size={14} />
                  MFA Status
                </label>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {profileData.mfaEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>

              {profileData.lastLoginAt && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                    <Clock size={14} />
                    Last Login
                  </label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    {format(new Date(profileData.lastLoginAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Calendar size={14} />
                  Member Since
                </label>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {format(new Date(profileData.createdAt), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Editable Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Profile
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                               transition-colors"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                               transition-colors"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building size={14} />
                  Company
                </label>
                <input
                  type="text"
                  {...register('company')}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                             transition-colors"
                  placeholder="Your company name (optional)"
                />
                {errors.company && (
                  <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone size={14} />
                  Phone Number
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                             transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Use digits, spaces, hyphens, parentheses, or leading +
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold
                             rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  {submitting ? 'Updating...' : 'Update Profile'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold
                             rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
