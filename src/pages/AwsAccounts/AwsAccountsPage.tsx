import { PorscheIcon } from '../../components/shared/PorscheIcon';
import { PageHeader } from '../../components/shared/PageHeader';
import { StepIndicator } from '../../components/shared/StepIndicator';

/**
 * AWS Accounts page - AWS account management and linking
 * Phase 1: Basic placeholder with Porsche Design styling
 * Will be enhanced with React Aria components in Task 7
 */
export const AwsAccountsPage = () => {
  return (
    <div className="space-y-fluid-lg">
      <PageHeader breadcrumb="Platform Operations · AWS Accounts View" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-fluid-sm">
        <div>
          <h2 className="text-heading-lg font-bold text-porsche-neutral-800 font-porsche tracking-tight">
            AWS Accounts
          </h2>
          <p className="mt-2 text-sm text-porsche-neutral-600 font-porsche">
            Link existing accounts or request new AWS accounts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-porsche-silver rounded-porsche shadow-porsche-sm text-sm font-bold uppercase tracking-wide text-porsche-neutral-600 bg-porsche-neutral-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:cursor-not-allowed"
            disabled
          >
            <span className="mr-2">
              <PorscheIcon name="arrowRight" size={16} />
            </span>
            Link Existing Account
          </button>
          <button
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary hover:bg-console-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
            disabled
          >
            <span className="mr-2">
              <PorscheIcon name="add" size={16} className="text-white" />
            </span>
            Request New Account
          </button>
        </div>
      </div>

      {/* AWS Account Health Monitor - Hero Section */}
      <div className="bg-white/90 backdrop-blur-porsche-sm rounded-porsche-lg p-fluid-md border border-porsche-silver shadow-porsche-md">
        <div className="flex items-center justify-between mb-fluid-sm">
          <div>
            <h2 className="text-heading-md font-bold text-porsche-neutral-800 font-porsche tracking-tight">
              Account Health Monitor
            </h2>
            <p className="text-sm text-porsche-neutral-600 font-porsche mt-1">
              Real-time AWS account status and guardrail compliance
            </p>
          </div>
        </div>

        {/* Three Key Metrics - Dense Instrument Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid-sm">
          {/* Total Accounts */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Total Accounts
            </div>
            <div className="text-4xl font-bold text-porsche-neutral-800 font-porsche">0</div>
          </div>

          {/* Linked - PRIMARY with Visual Anchor */}
          <div className="bg-porsche-success-bg rounded-porsche p-fluid-sm border-2 border-porsche-success shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-success uppercase tracking-wide font-porsche mb-1 flex items-center gap-2">
              <PorscheIcon name="success" size={12} className="text-porsche-success" />
              Linked & Secure
            </div>
            <div className="text-4xl font-bold text-porsche-success font-porsche">0</div>
            <div className="mt-2 text-xs text-porsche-neutral-600 font-porsche">
              All guardrails active
            </div>
          </div>

          {/* Pending/Violations - Flat Card */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Pending / Violations
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
            All account resources reconciled
          </span>
        </div>
        <div className="text-xs text-porsche-neutral-500 font-porsche">
          0 account ops today
        </div>
      </div>

      {/* Guardrail Alert Banner - Error State with Red */}
      <div className="bg-porsche-red/5 border-l-4 border-porsche-red p-fluid-md rounded-porsche shadow-porsche-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <PorscheIcon name="warning" size={24} className="text-porsche-red" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-porsche-red uppercase tracking-wide font-porsche mb-1">
              AWS Account Guardrailing Required
            </h3>
            <p className="text-sm text-porsche-neutral-700 font-porsche">
              Before linking or creating AWS accounts, your team must complete the security guardrail setup. 
              This ensures all accounts meet organizational security and compliance requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Empty States Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-fluid-lg">
        {/* Empty State - Linked Accounts */}
        <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
          <div className="px-4 py-12 sm:px-6 lg:px-8 text-center">
            <div className="mb-4 flex justify-center">
              <PorscheIcon name="arrowRight" size={64} className="text-porsche-neutral-400" />
            </div>
            <h3 className="text-heading-md font-bold text-porsche-neutral-800 mb-3 font-porsche tracking-tight uppercase">
              No Linked Accounts
            </h3>
            <p className="text-sm text-porsche-neutral-600 mb-fluid-lg max-w-md mx-auto font-porsche">
              Connect your existing AWS account to start deploying environments. 
              We'll help you set up the necessary IAM roles and permissions.
            </p>
            <button
              className="inline-flex items-center px-6 py-3 border-2 border-porsche-silver rounded-porsche shadow-porsche-sm text-sm font-bold uppercase tracking-wide text-porsche-neutral-600 bg-porsche-neutral-100 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:cursor-not-allowed"
              disabled
            >
              <PorscheIcon name="arrowRight" size={16} className="mr-2" />
              Link Your AWS Account
            </button>
          </div>
        </div>

        {/* Empty State - Account Requests */}
        <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
          <div className="px-4 py-12 sm:px-6 lg:px-8 text-center">
            <div className="mb-4 flex justify-center">
              <PorscheIcon name="add" size={64} className="text-porsche-neutral-400" />
            </div>
            <h3 className="text-heading-md font-bold text-porsche-neutral-800 mb-3 font-porsche tracking-tight uppercase">
              No Account Requests
            </h3>
            <p className="text-sm text-porsche-neutral-600 mb-fluid-lg max-w-md mx-auto font-porsche">
              Need a new AWS account? Request one and we'll create it under our AWS Organization 
              with all security guardrails automatically configured.
            </p>
            <button
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
              disabled
            >
              <PorscheIcon name="add" size={16} className="text-white mr-2" />
              Request New AWS Account
            </button>
            <p className="mt-4 text-xs text-porsche-neutral-500 font-porsche italic">
              Coming soon: Account request wizard with React Aria in Task 7
            </p>
          </div>
        </div>
      </div>

      {/* Account Linking Process - Informational */}
      <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
        <div className="px-fluid-md py-fluid-lg sm:p-fluid-lg">
          <h3 className="text-heading-sm font-bold text-porsche-neutral-800 mb-fluid-md font-porsche tracking-tight">
            Account Linking Process
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid-md">
            <StepIndicator
              step={1}
              title="Initiate Link"
              description="Provide your AWS account ID and select guardrail policies"
            />
            <StepIndicator
              step={2}
              title="Configure IAM"
              description="Deploy the CloudFormation template in your AWS account"
            />
            <StepIndicator
              step={{ icon: 'check' }}
              title="Verify & Deploy"
              description="Verify connection and deploy guardrails"
              variant="success"
            />
          </div>
        </div>
      </div>

      {/* Empty States Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md">
        {/* Link Existing Account Card */}
        <div className="bg-white/90 backdrop-blur-porsche-sm rounded-porsche-lg p-fluid-lg text-center border border-porsche-silver shadow-porsche-md">
          <div className="flex justify-center mb-fluid-sm">
            <PorscheIcon name="arrowRight" size={64} className="text-porsche-neutral-400" />
          </div>
          <h3 className="text-heading-sm font-bold text-porsche-neutral-800 mb-2 uppercase tracking-wide font-porsche">
            Link Existing Account
          </h3>
          <p className="text-sm text-porsche-neutral-600 mb-fluid-md font-porsche">
            Already have an AWS account? Link it to the CloudOps Platform.<br />
            We'll help you set up the necessary IAM roles and permissions.
          </p>
          <button
            className="inline-flex items-center px-6 py-3 border-2 border-porsche-silver rounded-porsche shadow-porsche-sm text-sm font-bold uppercase tracking-wide text-porsche-neutral-600 bg-porsche-neutral-100 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:cursor-not-allowed"
            disabled
          >
            <PorscheIcon name="arrowRight" size={16} className="mr-2" />
            Link Your AWS Account
          </button>
        </div>

        {/* Request New Account Card */}
        <div className="bg-white/90 backdrop-blur-porsche-sm rounded-porsche-lg p-fluid-lg text-center border border-porsche-silver shadow-porsche-md">
          <div className="flex justify-center mb-fluid-sm">
            <PorscheIcon name="add" size={64} className="text-porsche-neutral-400" />
          </div>
          <h3 className="text-heading-sm font-bold text-porsche-neutral-800 mb-2 uppercase tracking-wide font-porsche">
            Request New Account
          </h3>
          <p className="text-sm text-porsche-neutral-600 mb-fluid-md font-porsche">
            Need a new AWS account? Submit a request through the CloudOps Platform<br />
            with all security guardrails automatically configured.
          </p>
          <button
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
            disabled
          >
            <PorscheIcon name="add" size={16} className="text-white mr-2" />
            Request New AWS Account
          </button>
          <p className="mt-4 text-xs text-porsche-neutral-500 font-porsche italic">
            Coming soon: Account request wizard with React Aria in Task 7
          </p>
        </div>
      </div>
    </div>
  );
};
