import { PorscheIcon } from '../../components/shared/PorscheIcon';
import { PageHeader } from '../../components/shared/PageHeader';

/**
 * Environments page - Team environment management
 * Phase 1: Basic placeholder with Porsche Design styling
 * Will be enhanced with React Aria components in Task 6
 */
export const EnvironmentsPage = () => {
  return (
    <div className="space-y-fluid-lg">
      <PageHeader breadcrumb="Platform Operations · Environments View" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-fluid-sm">
        <div>
          <h2 className="text-heading-lg font-bold text-porsche-neutral-800 font-porsche tracking-tight">
            Environments
          </h2>
          <p className="mt-2 text-sm text-porsche-neutral-600 font-porsche">
            Manage team environments across AWS accounts
          </p>
        </div>
        <button
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary hover:bg-console-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
          disabled
        >
          <span className="mr-2">
            <PorscheIcon name="add" size={16} className="text-white" />
          </span>
          Create Environment
        </button>
      </div>

      {/* Environment Health Monitor - Hero Section */}
      <div className="bg-white/90 backdrop-blur-porsche-sm rounded-porsche-lg p-fluid-md border border-porsche-silver shadow-porsche-md">
        <div className="flex items-center justify-between mb-fluid-sm">
          <div>
            <h2 className="text-heading-md font-bold text-porsche-neutral-800 font-porsche tracking-tight">
              Environment Health Monitor
            </h2>
            <p className="text-sm text-porsche-neutral-600 font-porsche mt-1">
              Real-time environment status across all AWS accounts
            </p>
          </div>
        </div>

        {/* Three Key Metrics - Dense Instrument Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid-sm">
          {/* Total Environments */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Total Environments
            </div>
            <div className="text-4xl font-bold text-porsche-neutral-800 font-porsche">0</div>
          </div>

          {/* Ready - PRIMARY with Visual Anchor */}
          <div className="bg-porsche-success-bg rounded-porsche p-fluid-sm border-2 border-porsche-success shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-success uppercase tracking-wide font-porsche mb-1 flex items-center gap-2">
              <PorscheIcon name="success" size={12} className="text-porsche-success" />
              Ready
            </div>
            <div className="text-4xl font-bold text-porsche-success font-porsche">0</div>
            <div className="mt-2 text-xs text-porsche-neutral-600 font-porsche">
              100% healthy
            </div>
          </div>

          {/* Creating/Paused - Flat Card */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Creating / Paused
            </div>
            <div className="text-4xl font-bold text-porsche-warning font-porsche">0 / 0</div>
          </div>
        </div>
      </div>

      {/* Crossplane Health Strip */}
      <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-porsche-success rounded-full"></div>
            <span className="text-xs font-bold uppercase tracking-wide text-porsche-neutral-700 font-porsche">
              Crossplane Healthy
            </span>
          </div>
          <span className="text-xs text-porsche-neutral-600 font-porsche">
            All environment resources reconciled
          </span>
        </div>
        <div className="text-xs text-porsche-neutral-500 font-porsche">
          0 env ops today
        </div>
      </div>

      {/* Empty State - Standardized */}
      <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
        <div className="px-4 py-12 sm:px-6 lg:px-8 text-center">
          <div className="mb-4 flex justify-center">
            <PorscheIcon name="globe" size={64} className="text-porsche-neutral-400" />
          </div>
          <h3 className="text-heading-md font-bold text-porsche-neutral-800 mb-3 font-porsche tracking-tight uppercase">
            No Environments Yet
          </h3>
          <p className="text-sm text-porsche-neutral-600 mb-fluid-lg max-w-md mx-auto font-porsche">
            Get started by creating your first team environment. Choose a template, select an AWS account, 
            and deploy your infrastructure.
          </p>
          <button
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary hover:bg-console-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
            disabled
          >
            <PorscheIcon name="add" size={16} className="text-white mr-2" />
            Create Your First Environment
          </button>
          <p className="mt-4 text-xs text-porsche-neutral-500 font-porsche italic">
            Coming soon: React Aria components in Task 6
          </p>
        </div>
      </div>

      {/* Templates Preview Section */}
      <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
        <div className="px-fluid-md py-fluid-lg sm:p-fluid-lg">
          <h3 className="text-heading-sm font-bold text-porsche-neutral-800 mb-fluid-md font-porsche tracking-tight">
            Available Templates
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Sandbox', 'Development', 'Staging'].map((template) => (
              <div
                key={template}
                className="border border-porsche-silver rounded-porsche-lg p-fluid-md hover:border-console-primary hover:shadow-porsche-md hover:scale-[1.02] transition-all duration-moderate ease-porsche-base cursor-pointer bg-porsche-surface"
              >
                <h4 className="font-bold text-porsche-black mb-2 uppercase tracking-wide text-sm font-porsche">
                  {template}
                </h4>
                <p className="text-sm text-porsche-neutral-600 mb-3 font-porsche">
                  {template === 'Sandbox' && 'Basic sandbox for development and testing'}
                  {template === 'Development' && 'Full development environment with monitoring'}
                  {template === 'Staging' && 'Pre-production staging environment'}
                </p>
                <div className="flex items-center text-xs text-porsche-neutral-400 font-semibold uppercase tracking-wide font-porsche">
                  <span>VPC • ECS • RDS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
