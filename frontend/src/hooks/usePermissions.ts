import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import type { RoleName } from '@/types/auth.types'

export function usePermissions() {
  const user = useSelector((s: RootState) => s.auth.user)

  const hasRole = (...roles: RoleName[]) =>
    !!user && roles.some(r => user.roles.includes(r))

  const isAdmin = () => hasRole('AIRLINE_ADMINISTRATOR')
  const canApprove = () => hasRole('AIRLINE_ADMINISTRATOR', 'SALES_AGENT')
  const canManageUsers = () => hasRole('AIRLINE_ADMINISTRATOR', 'CUSTOMER_ADMIN')
  const canCreateOffers = () => hasRole('AIRLINE_ADMINISTRATOR', 'SALES_AGENT', 'CUSTOMER_ADMIN')
  const canManageOffers = () => hasRole('AIRLINE_ADMINISTRATOR', 'SALES_AGENT', 'CUSTOMER_ADMIN')

  return { hasRole, isAdmin, canApprove, canManageUsers, canCreateOffers, canManageOffers }
}
