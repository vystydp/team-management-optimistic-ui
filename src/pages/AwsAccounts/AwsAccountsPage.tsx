import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PorscheIcon } from '../../components/shared/PorscheIcon';
import { PageHeader } from '../../components/shared/PageHeader';
import { StepIndicator } from '../../components/shared/StepIndicator';
import { awsAccountService } from '../../services/awsAccountService';
import { useAwsAccountStore } from '../../stores/awsAccountStore';
import { LinkAccountModal, type LinkAccountFormData } from '../../components/aws/LinkAccountModal';
import { AccountCard } from '../../components/aws/AccountCard';
import { AwsAccountRef } from '../../types/aws';

/**
 * AWS Accounts page - AWS account management and linking
 */
export const AwsAccountsPage = () => {
  const navigate = useNavigate();
  const { accounts, setAccounts } = useAwsAccountStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [processingAccounts, setProcessingAccounts] = useState<Set<string>>(new Set());

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        const fetchedAccounts = await awsAccountService.listAccounts();
        setAccounts(fetchedAccounts);
      } catch (err) {
        console.error('Failed to load accounts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [setAccounts]);

  // Poll for status updates on accounts that are guardrailing
  useEffect(() => {
    const accountsToPolling = accounts.filter(acc => acc.status === 'guardrailing');
    if (accountsToPolling.length === 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedAccounts = await awsAccountService.listAccounts();
        setAccounts(updatedAccounts);
      } catch (err) {
        console.error('Failed to poll account status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [accounts, setAccounts]);

  // Handle linking account with optimistic update
  const handleLinkAccount = async (data: LinkAccountFormData) => {
    // Create optimistic account
    const optimisticAccount: AwsAccountRef = {
      id: `temp-${Date.now()}`,
      accountId: data.accountId,
      accountName: data.accountName,
      roleArn: data.roleArn,
      type: 'linked',
      status: 'linked',
      ownerEmail: data.ownerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistically add to UI
    setAccounts([...accounts, optimisticAccount]);

    try {
      // Make actual API call
      const linkedAccount = await awsAccountService.linkAccount(data);
      
      // Replace optimistic account with real one
      setAccounts(accounts.map(acc => 
        acc.id === optimisticAccount.id ? linkedAccount : acc
      ));
    } catch (err) {
      // Rollback on error
      setAccounts(accounts.filter(acc => acc.id !== optimisticAccount.id));
      throw err; // Re-throw to show error in modal
    }
  };

  // Handle securing account with optimistic update
  const handleSecureAccount = async (accountId: string) => {
    setProcessingAccounts(prev => new Set(prev).add(accountId));

    // Optimistically update status
    setAccounts(accounts.map(acc =>
      acc.id === accountId
        ? { ...acc, status: 'guardrailing' as const, updatedAt: new Date() }
        : acc
    ));

    try {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) return;

      await awsAccountService.secureAccount({ accountId: account.accountId });
      // Polling will update to final status
    } catch (err) {
      console.error('Failed to secure account:', err);
      // Rollback on error
      setAccounts(accounts.map(acc =>
        acc.id === accountId
          ? { ...acc, status: 'error' as const, errorMessage: err instanceof Error ? err.message : 'Failed to apply guardrails' }
          : acc
      ));
    } finally {
      setProcessingAccounts(prev => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  // Handle removing account
  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to unlink this account?')) return;

    setProcessingAccounts(prev => new Set(prev).add(accountId));

    // Optimistically remove from UI
    const accountToRemove = accounts.find(acc => acc.id === accountId);
    setAccounts(accounts.filter(acc => acc.id !== accountId));

    try {
      await awsAccountService.unlinkAccount(accountId);
    } catch (err) {
      console.error('Failed to unlink account:', err);
      // Rollback on error
      if (accountToRemove) {
        setAccounts([...accounts, accountToRemove]);
      }
      setError(err instanceof Error ? err.message : 'Failed to unlink account');
    } finally {
      setProcessingAccounts(prev => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const linkedAccounts = accounts.filter(acc => acc.status === 'guardrailed');
  const pendingAccounts = accounts.filter(acc => acc.status === 'guardrailing' || acc.status === 'linked');
  const errorAccounts = accounts.filter(acc => acc.status === 'error');

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
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-porsche-silver rounded-porsche shadow-porsche-sm text-sm font-bold uppercase tracking-wide text-porsche-neutral-600 bg-porsche-neutral-100 hover:bg-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:cursor-not-allowed"
          >
            <span className="mr-2">
              <PorscheIcon name="arrowRight" size={16} />
            </span>
            Link Existing Account
          </button>
          <button
            onClick={() => navigate('/aws-accounts/requests/new')}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary hover:bg-console-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
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
            <div className="text-4xl font-bold text-porsche-neutral-800 font-porsche">
              {loading ? '...' : accounts.length}
            </div>
          </div>

          {/* Linked - PRIMARY with Visual Anchor */}
          <div className="bg-porsche-success-bg rounded-porsche p-fluid-sm border-2 border-porsche-success shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-success uppercase tracking-wide font-porsche mb-1 flex items-center gap-2">
              <PorscheIcon name="success" size={12} className="text-porsche-success" />
              Linked & Secure
            </div>
            <div className="text-4xl font-bold text-porsche-success font-porsche">
              {loading ? '...' : linkedAccounts.length}
            </div>
            <div className="mt-2 text-xs text-porsche-neutral-600 font-porsche">
              All guardrails active
            </div>
          </div>

          {/* Pending/Violations - Flat Card */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Pending / Violations
            </div>
            <div className="text-4xl font-bold text-porsche-warning font-porsche">
              {loading ? '...' : `${pendingAccounts.length} / ${errorAccounts.length}`}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-porsche-red/5 border-l-4 border-porsche-red p-fluid-md rounded-porsche shadow-porsche-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <PorscheIcon name="warning" size={24} className="text-porsche-red" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-porsche-red uppercase tracking-wide font-porsche mb-1">
                Error Loading Accounts
              </h3>
              <p className="text-sm text-porsche-neutral-700 font-porsche">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

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
          {accounts.length} account ops today
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

      {/* Accounts List or Empty State */}
      {!loading && accounts.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-md">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onSecure={handleSecureAccount}
              onRemove={handleRemoveAccount}
              isProcessing={processingAccounts.has(account.id)}
            />
          ))}
        </div>
      )}

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

      {/* Link Account Modal */}
      <LinkAccountModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={handleLinkAccount}
      />
    </div>
  );
};
