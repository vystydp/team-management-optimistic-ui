import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResponsiveLayout, NavigationTab } from './components/layout/ResponsiveLayout';
import { TeamsPage } from './pages/Teams/TeamsPage';
import { EnvironmentsPage } from './pages/Environments/EnvironmentsPage';
import { AwsAccountsRouter } from './pages/AwsAccounts/AwsAccountsRouter';
import { ActivityFeedPage } from './pages/Activity/ActivityFeedPage';
import { ControlPlanePage } from './pages/ControlPlane/ControlPlanePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { AuthCallbackPage } from './pages/Auth/AuthCallbackPage';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './components/shared/Toast';
import { useToastStore } from './stores/toastStore';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function AuthenticatedApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    if (location.pathname.startsWith('/aws-accounts')) return 'aws-accounts';
    if (location.pathname.startsWith('/environments')) return 'environments';
    if (location.pathname.startsWith('/teams')) return 'teams';
    if (location.pathname.startsWith('/activity')) return 'activity';
    if (location.pathname.startsWith('/control-plane')) return 'control-plane';
    return 'teams';
  });

  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
    // Navigate to the base route for each tab
    navigate(`/${tab}`);
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'teams':
        return <TeamsPage />;
      case 'environments':
        return <EnvironmentsPage />;
      case 'aws-accounts':
        return <AwsAccountsRouter />;
      case 'activity':
        return <ActivityFeedPage />;
      case 'control-plane':
        return <ControlPlanePage />;
      default:
        return <TeamsPage />;
    }
  };

  useEffect(() => {
    // Sync tab with route
    if (location.pathname.startsWith('/aws-accounts')) setCurrentTab('aws-accounts');
    else if (location.pathname.startsWith('/environments')) setCurrentTab('environments');
    else if (location.pathname.startsWith('/teams')) setCurrentTab('teams');
    else if (location.pathname.startsWith('/activity')) setCurrentTab('activity');
    else if (location.pathname.startsWith('/control-plane')) setCurrentTab('control-plane');
  }, [location.pathname]);

  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <>
      <ResponsiveLayout currentTab={currentTab} onTabChange={handleTabChange}>
        {renderCurrentPage()}
      </ResponsiveLayout>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  );
}

function App() {
  const { isAuthenticated, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-porsche-gray-100 to-porsche-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-porsche-gray-900 mx-auto mb-4"></div>
          <p className="text-porsche-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Protected routes */}
          <Route
            path="/teams"
            element={isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/environments/*"
            element={isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/aws-accounts/*"
            element={isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/activity"
            element={isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/control-plane"
            element={isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/teams" replace /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
