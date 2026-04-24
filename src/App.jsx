import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import PrivateRoute      from './components/layout/PrivateRoute'
import AppShell          from './components/layout/AppShell'

import LoginPage         from './features/auth/LoginPage'
import SignupPage        from './features/auth/SignupPage'
import DashboardPage     from './features/dashboard/DashboardPage'
import ContentGenerator  from './features/generator/ContentGenerator'
import LibraryPage       from './features/library/LibraryPage'
import ConnectedAccounts from './features/accounts/ConnectedAccountsPage'
import BillingPage       from './features/billing/BillingPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"  element={<LoginPage  />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route element={<PrivateRoute />}>
              <Route element={<AppShell />}>
                <Route path="/"         element={<DashboardPage    />} />
                <Route path="/generate" element={<ContentGenerator />} />
                <Route path="/library"  element={<LibraryPage      />} />
                <Route path="/accounts" element={<ConnectedAccounts/>} />
                <Route path="/billing"  element={<BillingPage      />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
