import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '@/api/authApi'
import type { AuthState, User } from '@/types/auth.types'

const initialState: AuthState = {
  user:         JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken:  localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  mfaRequired:  false,
  mfaUserId:    null,
  loading:      false,
  error:        null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(payload)
      return data.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (payload: Parameters<typeof authApi.register>[0], { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(payload)
      return data.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
    }
  }
)

export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async (payload: { userId: number; totpCode: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.verifyMfa(payload.userId, payload.totpCode)
      return data.data
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Invalid MFA code')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      if (state.refreshToken) authApi.logout(state.refreshToken).catch(() => {})
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.mfaRequired = false
      state.mfaUserId = null
      localStorage.clear()
    },
    clearError(state) { state.error = null },
    setUser(state, action: PayloadAction<User>) { state.user = action.payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(login.fulfilled, (s, { payload }) => {
        s.loading = false
        if (payload.mfaRequired) {
          s.mfaRequired = true
          s.mfaUserId = payload.userId
        } else {
          s.user = payload.user
          s.accessToken = payload.accessToken
          s.refreshToken = payload.refreshToken
          localStorage.setItem('accessToken',  payload.accessToken)
          localStorage.setItem('refreshToken', payload.refreshToken)
          localStorage.setItem('user',         JSON.stringify(payload.user))
        }
      })
      .addCase(login.rejected, (s, { payload }) => {
        s.loading = false; s.error = payload as string
      })
      .addCase(verifyMfa.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(verifyMfa.fulfilled, (s, { payload }) => {
        s.loading = false; s.mfaRequired = false; s.mfaUserId = null
        s.user = payload.user
        s.accessToken = payload.accessToken
        s.refreshToken = payload.refreshToken
        localStorage.setItem('accessToken',  payload.accessToken)
        localStorage.setItem('refreshToken', payload.refreshToken)
        localStorage.setItem('user',         JSON.stringify(payload.user))
      })
      .addCase(verifyMfa.rejected, (s, { payload }) => {
        s.loading = false; s.error = payload as string
      })
      .addCase(register.pending,   (s) => { s.loading = true; s.error = null })
      .addCase(register.fulfilled, (s) => { s.loading = false })
      .addCase(register.rejected,  (s, { payload }) => {
        s.loading = false; s.error = payload as string
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export default authSlice.reducer
