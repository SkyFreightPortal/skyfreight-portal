export type AccountType = 'FREIGHT_FORWARDER' | 'SHIPPER' | 'CORPORATE'
export type UserStatus  = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
export type RoleName    =
  | 'CUSTOMER_ADMIN'
  | 'SALES_AGENT'
  | 'OPERATIONS_USER'
  | 'REVENUE_MANAGEMENT_USER'
  | 'FINANCE_USER'
  | 'AIRLINE_ADMINISTRATOR'

export interface User {
  id:          number
  firstName:   string
  lastName:    string
  email:       string
  company:     string
  phone:       string
  accountType: AccountType
  status:      UserStatus
  mfaEnabled:  boolean
  roles:       RoleName[]
  lastLoginAt: string | null
  createdAt:   string
}

export interface AuthResponse {
  accessToken:  string
  refreshToken: string
  tokenType:    string
  expiresIn:    number
  mfaRequired:  boolean
  userId:       number | null
  user:         User | null
}

export interface AuthState {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  mfaRequired:  boolean
  mfaUserId:    number | null
  loading:      boolean
  error:        string | null
}
