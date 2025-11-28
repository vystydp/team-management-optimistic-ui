import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResponsiveLayout, NavigationTab } from './components/layout/ResponsiveLayout';
import { TeamsPage } from './pages/Teams/TeamsPage';
import { EnvironmentsPage } from './pages/Environments/EnvironmentsPage';
import { AwsAccountsPage } from './pages/AwsAccounts/AwsAccountsPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { AuthCallbackPage } from './pages/Auth/AuthCallbackPage';
import { PorscheIcon } from './components/shared/PorscheIcon';
import { useAuthStore } from './stores/authStore';

function AuthenticatedApp() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('environments');

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
        return <AwsAccountsPage />;
      case 'control-plane':
        return renderControlPlanePage();
      default:
        return <TeamsPage />;
    }
  };

  return (
    <ResponsiveLayout currentTab={currentTab} onTabChange={setCurrentTab}>
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
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* Protected routes */}
        <Route
          path="/*"
          element={isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
