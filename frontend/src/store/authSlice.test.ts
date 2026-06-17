import { describe, it, expect, beforeEach } from 'vitest'
import authReducer, { updateUser } from './authSlice'
import type { AuthState, User } from '@/types/auth.types'

describe('authSlice - updateUser action', () => {
  let initialState: AuthState

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Initialize state with a mock user
    initialState = {
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Test Corp',
        phone: '+1-555-0100',
        accountType: 'FREIGHT_FORWARDER',
        status: 'ACTIVE',
        mfaEnabled: true,
        roles: ['CUSTOMER_ADMIN'],
        lastLoginAt: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      mfaRequired: false,
      mfaUserId: null,
      loading: false,
      error: null,
    }
  })

  it('should update user in Redux state', () => {
    // Arrange: Create updated user data
    const updatedUser: User = {
      ...initialState.user!,
      firstName: 'Jane',
      lastName: 'Smith',
      company: 'Updated Corp',
      phone: '+1-555-9999',
    }

    // Act: Dispatch updateUser action
    const newState = authReducer(initialState, updateUser(updatedUser))

    // Assert: Verify state is updated
    expect(newState.user).toEqual(updatedUser)
    expect(newState.user?.firstName).toBe('Jane')
    expect(newState.user?.lastName).toBe('Smith')
    expect(newState.user?.company).toBe('Updated Corp')
    expect(newState.user?.phone).toBe('+1-555-9999')
  })

  it('should persist user to localStorage', () => {
    // Arrange: Create updated user data
    const updatedUser: User = {
      ...initialState.user!,
      firstName: 'Jane',
      lastName: 'Smith',
    }

    // Act: Dispatch updateUser action
    authReducer(initialState, updateUser(updatedUser))

    // Assert: Verify localStorage is updated
    const storedUser = localStorage.getItem('user')
    expect(storedUser).not.toBeNull()
    
    const parsedUser = JSON.parse(storedUser!)
    expect(parsedUser).toEqual(updatedUser)
    expect(parsedUser.firstName).toBe('Jane')
    expect(parsedUser.lastName).toBe('Smith')
  })

  it('should include new firstName and lastName in updated user data', () => {
    // Arrange: Create updated user with new firstName and lastName
    const updatedUser: User = {
      ...initialState.user!,
      firstName: 'Michael',
      lastName: 'Johnson',
    }

    // Act: Dispatch updateUser action
    const newState = authReducer(initialState, updateUser(updatedUser))

    // Assert: Verify firstName and lastName are updated
    expect(newState.user?.firstName).toBe('Michael')
    expect(newState.user?.lastName).toBe('Johnson')
    
    // Verify other fields remain unchanged
    expect(newState.user?.email).toBe(initialState.user?.email)
    expect(newState.user?.id).toBe(initialState.user?.id)
    expect(newState.user?.accountType).toBe(initialState.user?.accountType)
    expect(newState.user?.roles).toEqual(initialState.user?.roles)
  })

  it('should preserve all user fields during update', () => {
    // Arrange: Create updated user with all fields
    const updatedUser: User = {
      id: 1,
      firstName: 'Updated',
      lastName: 'User',
      email: 'updated@example.com',
      company: 'New Company',
      phone: '+1-555-1234',
      accountType: 'SHIPPER',
      status: 'ACTIVE',
      mfaEnabled: false,
      roles: ['SALES_AGENT', 'OPERATIONS_USER'],
      lastLoginAt: '2024-02-01T12:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    }

    // Act: Dispatch updateUser action
    const newState = authReducer(initialState, updateUser(updatedUser))

    // Assert: Verify all fields are preserved
    expect(newState.user).toEqual(updatedUser)
    expect(newState.user?.id).toBe(1)
    expect(newState.user?.firstName).toBe('Updated')
    expect(newState.user?.lastName).toBe('User')
    expect(newState.user?.email).toBe('updated@example.com')
    expect(newState.user?.company).toBe('New Company')
    expect(newState.user?.phone).toBe('+1-555-1234')
    expect(newState.user?.accountType).toBe('SHIPPER')
    expect(newState.user?.status).toBe('ACTIVE')
    expect(newState.user?.mfaEnabled).toBe(false)
    expect(newState.user?.roles).toEqual(['SALES_AGENT', 'OPERATIONS_USER'])
    expect(newState.user?.lastLoginAt).toBe('2024-02-01T12:00:00Z')
    expect(newState.user?.createdAt).toBe('2024-01-01T00:00:00Z')
  })

  it('should not affect other auth state properties', () => {
    // Arrange: Create updated user data
    const updatedUser: User = {
      ...initialState.user!,
      firstName: 'Jane',
      lastName: 'Smith',
    }

    // Act: Dispatch updateUser action
    const newState = authReducer(initialState, updateUser(updatedUser))

    // Assert: Verify other state properties remain unchanged
    expect(newState.accessToken).toBe(initialState.accessToken)
    expect(newState.refreshToken).toBe(initialState.refreshToken)
    expect(newState.mfaRequired).toBe(initialState.mfaRequired)
    expect(newState.mfaUserId).toBe(initialState.mfaUserId)
    expect(newState.loading).toBe(initialState.loading)
    expect(newState.error).toBe(initialState.error)
  })

  it('should overwrite existing localStorage user data', () => {
    // Arrange: Set initial user in localStorage
    const oldUser: User = {
      ...initialState.user!,
      firstName: 'Old',
      lastName: 'Name',
    }
    localStorage.setItem('user', JSON.stringify(oldUser))

    const updatedUser: User = {
      ...initialState.user!,
      firstName: 'New',
      lastName: 'Name',
    }

    // Act: Dispatch updateUser action
    authReducer(initialState, updateUser(updatedUser))

    // Assert: Verify localStorage is overwritten
    const storedUser = localStorage.getItem('user')
    const parsedUser = JSON.parse(storedUser!)
    
    expect(parsedUser.firstName).toBe('New')
    expect(parsedUser.lastName).toBe('Name')
    expect(parsedUser.firstName).not.toBe('Old')
  })
})
