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
const OfferListPage    = lazy(() => import('@/pages/offers/OfferListPage'))
const OfferCreatePage  = lazy(() => import('@/pages/offers/OfferCreatePage'))
const OfferDetailPage  = lazy(() => import('@/pages/offers/OfferDetailPage'))
const OfferComparePage = lazy(() => import('@/pages/offers/OfferComparePage'))
const ShoppingSearchPage = lazy(() => import('@/pages/search/ShoppingSearchPage'))

const OFFER_READ_ROLES: import('@/types/auth.types').RoleName[] =
  ['AIRLINE_ADMINISTRATOR', 'SALES_AGENT', 'CUSTOMER_ADMIN', 'REVENUE_MANAGEMENT_USER', 'OPERATIONS_USER']
const OFFER_MANAGE_ROLES: import('@/types/auth.types').RoleName[] =
  ['AIRLINE_ADMINISTRATOR', 'SALES_AGENT', 'CUSTOMER_ADMIN']

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
            <Route path="/offers" element={
              <ProtectedRoute roles={OFFER_READ_ROLES}>
                <OfferListPage />
              </ProtectedRoute>
            } />
            <Route path="/offers/new" element={
              <ProtectedRoute roles={OFFER_MANAGE_ROLES}>
                <OfferCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/offers/compare" element={
              <ProtectedRoute roles={OFFER_READ_ROLES}>
                <OfferComparePage />
              </ProtectedRoute>
            } />
            <Route path="/offers/:id" element={
              <ProtectedRoute roles={OFFER_READ_ROLES}>
                <OfferDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute roles={OFFER_READ_ROLES}>
                <ShoppingSearchPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
