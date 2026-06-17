import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import authReducer from '@/store/authSlice'
import * as userApi from '@/api/userApi'

// Mock the userApi module
vi.mock('@/api/userApi', () => ({
  userApi: {
    getById: vi.fn(),
    update: vi.fn(),
  },
}))

// Helper function to create a mock store with authenticated user
const createMockStore = (userId = 1) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          company: 'Test Company',
          phone: '+1 (555) 123-4567',
          accountType: 'CORPORATE',
          status: 'ACTIVE',
          mfaEnabled: true,
          roles: ['CUSTOMER_ADMIN'],
          lastLoginAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
        loading: false,
        error: null,
      },
    },
  })
}

// Helper function to render component with all required providers
const renderWithProviders = (store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    </Provider>
  )
}

// Mock user data returned from API
const mockUserData = {
  data: {
    success: true,
    data: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Test Company',
      phone: '+1 (555) 123-4567',
      accountType: 'CORPORATE',
      status: 'ACTIVE',
      mfaEnabled: true,
      roles: ['CUSTOMER_ADMIN'],
      lastLoginAt: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    message: 'User retrieved successfully',
  },
}

describe('ProfileEditForm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful API response
    vi.mocked(userApi.userApi.getById).mockResolvedValue(mockUserData)
  })

  it('should display validation error when firstName is empty', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstNameInput = screen.getByPlaceholderText('John')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Clear the firstName field
    await user.clear(firstNameInput)
    
    // Submit the form
    await user.click(submitButton)

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
    })

    // Verify API was not called
    expect(userApi.userApi.update).not.toHaveBeenCalled()
  })

  it('should display validation error when lastName is empty', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const lastNameInput = screen.getByPlaceholderText('Doe')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Clear the lastName field
    await user.clear(lastNameInput)
    
    // Submit the form
    await user.click(submitButton)

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
    })

    // Verify API was not called
    expect(userApi.userApi.update).not.toHaveBeenCalled()
  })

  it('should display validation error when phone contains invalid characters', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Enter invalid phone with letters
    await user.clear(phoneInput)
    await user.type(phoneInput, '123-abc-4567')
    
    // Submit the form
    await user.click(submitButton)

    // Check for validation error
    await waitFor(() => {
      expect(
        screen.getByText('Phone must contain only digits, spaces, hyphens, parentheses, or leading +')
      ).toBeInTheDocument()
    })

    // Verify API was not called
    expect(userApi.userApi.update).not.toHaveBeenCalled()
  })

  it('should not show validation error when company is empty (optional field)', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Your company name (optional)')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const companyInput = screen.getByPlaceholderText('Your company name (optional)')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Mock successful update
    vi.mocked(userApi.userApi.update).mockResolvedValue(mockUserData)

    // Clear the company field (optional)
    await user.clear(companyInput)
    
    // Submit the form
    await user.click(submitButton)

    // Wait for submission
    await waitFor(() => {
      expect(userApi.userApi.update).toHaveBeenCalled()
    })

    // Verify no validation error appears for company
    expect(screen.queryByText(/company/i, { selector: '.text-red-600' })).not.toBeInTheDocument()
  })

  it('should not show validation error when phone is empty (optional field)', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Mock successful update
    vi.mocked(userApi.userApi.update).mockResolvedValue(mockUserData)

    // Clear the phone field (optional)
    await user.clear(phoneInput)
    
    // Submit the form
    await user.click(submitButton)

    // Wait for submission
    await waitFor(() => {
      expect(userApi.userApi.update).toHaveBeenCalled()
    })

    // Verify no validation error appears for phone
    expect(screen.queryByText(/phone must contain/i)).not.toBeInTheDocument()
  })

  it('should block form submission when validation fails', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstNameInput = screen.getByPlaceholderText('John')
    const lastNameInput = screen.getByPlaceholderText('Doe')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Clear both required fields
    await user.clear(firstNameInput)
    await user.clear(lastNameInput)
    
    // Submit the form
    await user.click(submitButton)

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
    })

    // Verify API was not called (form submission was blocked)
    expect(userApi.userApi.update).not.toHaveBeenCalled()
  })

  it('should allow valid phone formats with digits, spaces, hyphens, parentheses, and leading +', async () => {
    renderWithProviders()

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('+1 (555) 123-4567')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Mock successful update
    vi.mocked(userApi.userApi.update).mockResolvedValue(mockUserData)

    // Test valid phone format with all allowed characters
    await user.clear(phoneInput)
    await user.type(phoneInput, '+1 (555) 123-4567')
    
    // Submit the form
    await user.click(submitButton)

    // Wait for submission (no validation errors)
    await waitFor(() => {
      expect(userApi.userApi.update).toHaveBeenCalled()
    })

    // Verify no phone validation error
    expect(screen.queryByText(/phone must contain/i)).not.toBeInTheDocument()
  })
})

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user data on mount', async () => {
    vi.mocked(userApi.userApi.getById).mockResolvedValue(mockUserData)
    
    renderWithProviders()

    // Verify API was called with correct user ID
    await waitFor(() => {
      expect(userApi.userApi.getById).toHaveBeenCalledWith(1)
    })

    // Verify user data is displayed (email appears in multiple places)
    await waitFor(() => {
      const emails = screen.getAllByText('john.doe@example.com')
      expect(emails.length).toBeGreaterThan(0)
      expect(screen.getByPlaceholderText('John')).toHaveValue('John')
      expect(screen.getByPlaceholderText('Doe')).toHaveValue('Doe')
    })
  })

  it('should display loading spinner during fetch', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(userApi.userApi.getById).mockReturnValue(promise as any)

    renderWithProviders()

    // Verify loading spinner is shown (it's a visual spinner with animation)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()

    // Resolve the promise
    resolvePromise!(mockUserData)

    // Wait for loading to complete
    await waitFor(() => {
      const spinnerAfter = document.querySelector('.animate-spin')
      expect(spinnerAfter).not.toBeInTheDocument()
    })
  })

  it('should show error message and retry button when fetch fails', async () => {
    const errorMessage = 'Network error occurred'
    vi.mocked(userApi.userApi.getById).mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    })

    renderWithProviders()

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Verify retry button is present
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('should re-issue GET request when retry button is clicked', async () => {
    const errorMessage = 'Network error occurred'
    
    // First call fails
    vi.mocked(userApi.userApi.getById).mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage,
        },
      },
    })

    renderWithProviders()

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
    })

    // Mock successful response for retry
    vi.mocked(userApi.userApi.getById).mockResolvedValue(mockUserData)

    const user = userEvent.setup()
    const retryButton = screen.getByRole('button', { name: /retry/i })

    // Click retry button
    await user.click(retryButton)

    // Verify API was called again
    await waitFor(() => {
      expect(userApi.userApi.getById).toHaveBeenCalledTimes(2)
    })

    // Verify profile data is now displayed (email appears in multiple places)
    await waitFor(() => {
      const emails = screen.getAllByText('john.doe@example.com')
      expect(emails.length).toBeGreaterThan(0)
      expect(screen.queryByText('Failed to load profile')).not.toBeInTheDocument()
    })
  })

  it('should submit form with correct data structure', async () => {
    vi.mocked(userApi.userApi.getById).mockResolvedValue(mockUserData)
    vi.mocked(userApi.userApi.update).mockResolvedValue(mockUserData)

    renderWithProviders()

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstNameInput = screen.getByPlaceholderText('John')
    const lastNameInput = screen.getByPlaceholderText('Doe')
    const companyInput = screen.getByPlaceholderText('Your company name (optional)')
    const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Update form fields
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')
    await user.clear(lastNameInput)
    await user.type(lastNameInput, 'Smith')
    await user.clear(companyInput)
    await user.type(companyInput, 'New Company')
    await user.clear(phoneInput)
    await user.type(phoneInput, '+1 (555) 999-8888')

    // Submit form
    await user.click(submitButton)

    // Verify API was called with correct data structure
    await waitFor(() => {
      expect(userApi.userApi.update).toHaveBeenCalledWith(1, {
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'New Company',
        phone: '+1 (555) 999-8888',
      })
    })
  })

  it('should display success message after successful update', async () => {
    vi.mocked(userApi.userApi.getById).mockResolvedValue(mockUserData)
    
    const updatedUserData = {
      data: {
        success: true,
        data: {
          ...mockUserData.data.data,
          firstName: 'Jane',
          lastName: 'Smith',
        },
        message: 'User updated successfully',
      },
    }
    vi.mocked(userApi.userApi.update).mockResolvedValue(updatedUserData)

    renderWithProviders()

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstNameInput = screen.getByPlaceholderText('John')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Update first name
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')

    // Submit form
    await user.click(submitButton)

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
    })
  })

  it('should display error message when update fails', async () => {
    vi.mocked(userApi.userApi.getById).mockResolvedValue(mockUserData)
    
    const errorMessage = 'Failed to update user'
    vi.mocked(userApi.userApi.update).mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    })

    renderWithProviders()

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const firstNameInput = screen.getByPlaceholderText('John')
    const submitButton = screen.getByRole('button', { name: /update profile/i })

    // Update first name
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')

    // Submit form
    await user.click(submitButton)

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})
