import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/common/LoadingSpinner'

const LoginPage      = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage   = lazy(() => import('@/pages/auth/RegisterPage'))
const MfaPage        = lazy(() => import('@/pages/auth/MfaPage'))
const DashboardPage  = lazy(() => import('@/pages/dashboard/DashboardPage'))
const UserMgmtPage   = lazy(() => import('@/pages/users/UserManagementPage'))
const ApprovalPage   = lazy(() => import('@/pages/users/ApprovalQueuePage'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mfa"      element={<MfaPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users"     element={
              <ProtectedRoute roles={['AIRLINE_ADMINISTRATOR', 'CUSTOMER_ADMIN', 'SALES_AGENT']}>
                <UserMgmtPage />
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute roles={['AIRLINE_ADMINISTRATOR', 'SALES_AGENT']}>
                <ApprovalPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
