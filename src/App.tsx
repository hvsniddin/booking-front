import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ServicesPage } from './pages/ServicesPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { BookingFlow } from './pages/BookingFlow';
import { MyBookings } from './pages/MyBookings';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { ProfilePage } from './pages/ProfilePage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const homePath = user?.role === 'ADMIN'
    ? '/services'
    : user?.role === 'PROVIDER'
      ? '/appointments'
      : '/services';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {isAuthenticated && <Sidebar />}
      
      <main className={`flex-1 ${isAuthenticated ? 'lg:pl-64' : ''}`}>
        <Routes>
          {/* Public authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to={homePath} replace />} />
          </Route>

          {/* Shared paths with role-specific content */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/services"
              element={user?.role === 'ADMIN'
                ? <AdminPanel section="services" />
                : user?.role === 'CUSTOMER'
                  ? <ServicesPage />
                  : <Navigate to={homePath} replace />}
            />
            <Route
              path="/providers"
              element={user?.role === 'ADMIN'
                ? <AdminPanel section="providers" />
                : user?.role === 'CUSTOMER'
                  ? <ProvidersPage />
                  : <Navigate to={homePath} replace />}
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Customer workspace */}
          <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
            <Route path="/book" element={<BookingFlow />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>

          {/* Provider workspace */}
          <Route element={<ProtectedRoute roles={['PROVIDER']} />}>
            <Route path="/appointments" element={<ProviderDashboard section="appointments" />} />
            <Route path="/hours" element={<ProviderDashboard section="hours" />} />
            <Route path="/time-off" element={<ProviderDashboard section="timeoff" />} />
            <Route path="/provider-dashboard" element={<Navigate to="/appointments" replace />} />
            <Route path="/provider-dashboard/appointments" element={<Navigate to="/appointments" replace />} />
            <Route path="/provider-dashboard/hours" element={<Navigate to="/hours" replace />} />
            <Route path="/provider-dashboard/time-off" element={<Navigate to="/time-off" replace />} />
          </Route>

          {/* Admin workspace */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/bookings" element={<AdminPanel section="bookings" />} />
            <Route path="/admin" element={<Navigate to="/services" replace />} />
            <Route path="/admin/services" element={<Navigate to="/services" replace />} />
            <Route path="/admin/providers" element={<Navigate to="/providers" replace />} />
            <Route path="/admin/bookings" element={<Navigate to="/bookings" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </div>
  );
};
