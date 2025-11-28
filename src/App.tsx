import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResponsiveLayout, NavigationTab } from './components/layout/ResponsiveLayout';
import { TeamsPage } from './pages/Teams/TeamsPage';
import { EnvironmentsPage } from './pages/Environments/EnvironmentsPage';
import { AwsAccountsRouter } from './pages/AwsAccounts/AwsAccountsRouter';
import { LoginPage } from './pages/Auth/LoginPage';
import { AuthCallbackPage } from './pages/Auth/AuthCallbackPage';
import { PorscheIcon } from './components/shared/PorscheIcon';
import { useAuthStore } from './stores/authStore';

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
    if (location.pathname.startsWith('/control-plane')) return 'control-plane';
    return 'teams';
  });

  const handleTabChange = (tab: NavigationTab) => {
    setCurrentTab(tab);
    // Navigate to the base route for each tab
    navigate(`/${tab}`);
  };

  const renderControlPlanePage = () => (
    <div className="space-y-fluid-lg">
      <div>
        <div className="text-xs uppercase tracking-wide font-semibold text-porsche-neutral-600 mb-1 font-porsche">
          Platform Operations  Control Plane
        </div>
        <h1 className="text-heading-xl font-bold text-porsche-black tracking-tight font-porsche">
          Crossplane & Platform Status
        </h1>
        <p className="text-sm text-porsche-neutral-600 mt-2 font-porsche">
          Monitor Crossplane resources, reconciliation status, and platform health
        </p>
      </div>
      
      <div className="bg-white/90 backdrop-blur-porsche-sm rounded-porsche-lg p-fluid-lg border border-porsche-silver shadow-porsche-md text-center">
        <PorscheIcon name="information" size={48} className="text-porsche-neutral-400 mx-auto mb-4" />
        <h3 className="text-heading-md font-bold text-porsche-black mb-3 font-porsche tracking-tight uppercase">
          Control Plane Dashboard
        </h3>
        <p className="text-sm text-porsche-neutral-600 mb-6 font-porsche max-w-md mx-auto">
          Coming soon with full Kubernetes integration in Phase 2.
        </p>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'teams':
        return <TeamsPage />;
      case 'environments':
        return <EnvironmentsPage />;
      case 'aws-accounts':
        return <AwsAccountsRouter />;
      case 'control-plane':
        return renderControlPlanePage();
      default:
        return <TeamsPage />;
    }
  };

  useEffect(() => {
    // Sync tab with route
    if (location.pathname.startsWith('/aws-accounts')) setCurrentTab('aws-accounts');
    else if (location.pathname.startsWith('/environments')) setCurrentTab('environments');
    else if (location.pathname.startsWith('/teams')) setCurrentTab('teams');
    else if (location.pathname.startsWith('/control-plane')) setCurrentTab('control-plane');
  }, [location.pathname]);

  return (
    <ResponsiveLayout currentTab={currentTab} onTabChange={handleTabChange}>
      {renderCurrentPage()}
    </ResponsiveLayout>
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
