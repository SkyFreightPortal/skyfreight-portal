import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { login, logout, verifyMfa, register, clearError } from '@/store/authSlice'

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>()
  const { user, loading, error, mfaRequired, mfaUserId, accessToken } =
    useSelector((s: RootState) => s.auth)

  return {
    user,
    loading,
    error,
    mfaRequired,
    mfaUserId,
    isAuthenticated: !!accessToken && !!user,
    login:     (payload: Parameters<typeof login>[0]) => dispatch(login(payload)),
    register:  (payload: Parameters<typeof register>[0]) => dispatch(register(payload)),
    verifyMfa: (payload: Parameters<typeof verifyMfa>[0]) => dispatch(verifyMfa(payload)),
    logout:    () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  }
}
