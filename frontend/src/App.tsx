import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MainLayout } from './components/layout/MainLayout';

import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TicketListPage } from './features/tickets/TicketListPage';
import { TicketDetailPage } from './features/tickets/TicketDetailPage';
import { CreateTicketPage } from './features/tickets/CreateTicketPage';
import { AssetListPage } from './features/assets/AssetListPage';
import { AssetDetailPage } from './features/assets/AssetDetailPage';
import { KnowledgeBasePage } from './features/knowledge-base/KnowledgeBasePage';
import { KnowledgeBaseDetailPage } from './features/knowledge-base/KnowledgeBaseDetailPage';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { UsersPage } from './features/admin/UsersPage';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Tickets */}
              <Route path="tickets" element={<TicketListPage />} />
              <Route path="tickets/create" element={<CreateTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />

              {/* Assets */}
              <Route path="assets" element={<AssetListPage />} />
              <Route path="assets/:id" element={<AssetDetailPage />} />

              {/* Knowledge Base */}
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="knowledge-base/:id" element={<KnowledgeBaseDetailPage />} />

              {/* PC Health Monitoring (Tech & Admin) */}
              <Route
                path="monitoring"
                element={
                  <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']}>
                    <MonitoringPage />
                  </ProtectedRoute>
                }
              />

              {/* Administration (Admin only) */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};
