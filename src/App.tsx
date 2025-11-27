import { useState } from 'react';
import { ResponsiveLayout, NavigationTab } from './components/layout/ResponsiveLayout';
import { TeamsPage } from './pages/Teams/TeamsPage';
import { EnvironmentsPage } from './pages/Environments/EnvironmentsPage';
import { AwsAccountsPage } from './pages/AwsAccounts/AwsAccountsPage';
import { PorscheIcon } from './components/shared/PorscheIcon';

function App() {
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

export default App;
